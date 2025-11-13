<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceUpload;
use App\Models\GeneratedInvoice;
use App\Models\InvoiceLineItem;
use App\Models\Client;
use App\Models\Staff;
use App\Models\AttendanceRecord;
use App\Services\InvoiceGenerationService;
use App\Services\InvoiceExcelExportService;
use App\Services\AttendanceExportService;
use App\Services\AttendanceFileProcessingService;
use App\Services\AttendanceBasedPayrollService; // Phase 3.1 - Attendance-Based Salary Calculation
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;

class InvoiceController extends Controller
{
    protected $invoiceService;
    protected $excelExportService;
    protected $fileProcessingService;
    protected $attendancePayrollService; // Phase 3.1

    public function __construct(
        InvoiceGenerationService $invoiceService,
        InvoiceExcelExportService $excelExportService,
        AttendanceFileProcessingService $fileProcessingService,
        AttendanceBasedPayrollService $attendancePayrollService // Phase 3.1
    ) {
        $this->invoiceService = $invoiceService;
        $this->excelExportService = $excelExportService;
        $this->fileProcessingService = $fileProcessingService;
        $this->attendancePayrollService = $attendancePayrollService; // Phase 3.1
    }

    /**
     * Get all invoices with pagination and filters
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = GeneratedInvoice::with(['client', 'attendanceUpload'])
                ->orderBy('created_at', 'desc');

            // Apply filters
            if ($request->filled('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            if ($request->filled('invoice_type')) {
                $query->where('invoice_type', $request->invoice_type);
            }

            if ($request->filled('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Search functionality
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                        ->orWhere('invoice_period', 'like', "%{$search}%")
                        ->orWhereHas('client', function ($clientQuery) use ($search) {
                            $clientQuery->where('client_name', 'like', "%{$search}%");
                        });
                });
            }

            $invoices = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $invoices,
                'message' => 'Invoices retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving invoices: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single invoice with details
     */
    public function show($id): JsonResponse
    {
        try {
            $invoice = GeneratedInvoice::with(['client', 'lineItems', 'attendanceUpload'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }
    }

    /**
     * Generate new invoice from attendance upload
     */
    public function generate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attendance_upload_id' => 'required|exists:attendance_uploads,id',
            'invoice_type' => 'required|in:detailed,summary',
            'invoice_period' => 'required|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $invoice = $this->invoiceService->generateInvoice(
                $request->attendance_upload_id,
                $request->invoice_type,
                $request->invoice_period
            );

            return response()->json([
                'success' => true,
                'data' => $invoice,
                'message' => 'Invoice generated successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export invoice to Excel
     */
    public function exportExcel($id)
    {
        try {
            $invoice = GeneratedInvoice::with(['client', 'lineItems', 'attendanceUpload'])
                ->findOrFail($id);

            // Use multi-sheet export with template-based content
            return InvoiceExcelExportService::exportInvoice($id);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error exporting invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance uploads available for invoice generation
     */
    public function availableAttendance(Request $request): JsonResponse
    {
        try {
            $query = AttendanceUpload::with('client')
                ->whereDoesntHave('generatedInvoices') // Only uploads without invoices
                ->where('processing_status', 'completed') // Fixed column name
                ->orderBy('created_at', 'desc');

            if ($request->filled('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            $uploads = $query->get();

            return response()->json([
                'success' => true,
                'data' => $uploads,
                'message' => 'Available attendance uploads retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving attendance uploads: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get invoice statistics for dashboard
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $stats = [
                'total_invoices' => GeneratedInvoice::count(),
                'total_amount' => GeneratedInvoice::sum('total_invoice_amount'), // Fixed column name
                'this_month_invoices' => GeneratedInvoice::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'this_month_amount' => GeneratedInvoice::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->sum('total_invoice_amount'), // Fixed column name
                'by_type' => GeneratedInvoice::selectRaw('invoice_type, COUNT(*) as count, SUM(total_invoice_amount) as total') // Fixed column name
                    ->groupBy('invoice_type')
                    ->get(),
                'recent_invoices' => GeneratedInvoice::with('client')
                    ->latest()
                    ->take(5)
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Invoice statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete invoice (soft delete)
     */
    public function destroy($id): JsonResponse
    {
        try {
            $invoice = GeneratedInvoice::findOrFail($id);
            $invoice->delete();

            return response()->json([
                'success' => true,
                'message' => 'Invoice deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload and process attendance file
     */
    public function uploadAttendanceFile(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
                'client_id' => 'required|exists:clients,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $clientId = $request->client_id;
            $uploadedBy = Auth::id() ?? 1; // Default to user 1 if not authenticated

            $result = $this->fileProcessingService->processAttendanceFile($file, $clientId, $uploadedBy);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'File processed successfully',
                    'data' => [
                        'upload_id' => $result['upload_id'],
                        'processed' => $result['processed'],
                        'failed' => $result['failed'],
                        'warnings' => $result['warnings'] ?? []
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'File processing failed',
                    'errors' => $result['errors'] ?? []
                ], 422);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error processing file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload and process simplified attendance file (Phase 2.2)
     * Only requires: Employee Code, Employee Name, Designation, Days Worked
     * Salary data is auto-fetched from employee records
     */
    public function uploadSimplifiedAttendanceFile(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
                'client_id' => 'required|exists:clients,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $clientId = $request->client_id;
            $uploadedBy = Auth::id() ?? 1;

            // Get client to check pay calculation basis
            $client = Client::findOrFail($clientId);

            // Process simplified attendance file
            $result = $this->processSimplifiedAttendanceFile($file, $client, $uploadedBy);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Simplified attendance file processed successfully',
                    'data' => [
                        'upload_id' => $result['upload_id'],
                        'processed' => $result['processed'],
                        'failed' => $result['failed'],
                        'warnings' => $result['warnings'] ?? [],
                        'employee_records_found' => $result['employee_records_found'] ?? 0,
                        'salary_data_fetched' => $result['salary_data_fetched'] ?? 0,
                        'preview_data' => $result['preview_data'] ?? []
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Simplified file processing failed',
                    'errors' => $result['errors'] ?? [],
                    'validation_errors' => $result['validation_errors'] ?? []
                ], 422);
            }
        } catch (\Exception $e) {
            Log::error('Simplified attendance upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error processing simplified attendance file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process simplified attendance file with auto-fetch salary data
     */
    private function processSimplifiedAttendanceFile($file, $client, $uploadedBy)
    {
        try {
            // Use the existing file processing service to handle Excel reading
            $result = $this->fileProcessingService->processAttendanceFile($file, $client->id, $uploadedBy);

            if (!$result['success']) {
                return $result;
            }

            // Get the attendance upload record
            $attendanceUpload = AttendanceUpload::find($result['upload_id']);

            // Update upload type to simplified
            $attendanceUpload->update(['upload_type' => 'simplified']);

            // Get the attendance records for auto-salary processing
            $attendanceRecords = AttendanceRecord::where('attendance_upload_id', $attendanceUpload->id)->get();

            $processed = 0;
            $salaryDataFetched = 0;
            $warnings = [];
            $previewData = [];

            foreach ($attendanceRecords as $record) {
                try {
                    // Find employee record by code
                    $employee = Staff::where('employee_id', $record->employee_code)
                        ->where('client_id', $client->id)
                        ->first();

                    if (!$employee) {
                        $warnings[] = "Employee code '{$record->employee_code}' not found";
                        continue;
                    }

                    // Get employee salary data from pay grade assignment
                    $salaryData = $this->getEmployeeSalaryData($employee);

                    if (!$salaryData) {
                        $warnings[] = "No pay grade assignment found for employee '{$record->employee_code}'";
                        continue;
                    }

                    $salaryDataFetched++;

                    // Phase 3.1: Use AttendanceBasedPayrollService for comprehensive calculation
                    $payBasis = $client->pay_calculation_basis ?? 'working_days';

                    // Get template settings for the client (if available)
                    $templateSettings = $this->getClientTemplateSettings($client->id);

                    // Calculate attendance-based salary using the comprehensive service
                    $attendanceCalculation = $this->attendancePayrollService->calculateAdjustedSalary(
                        $employee,
                        $record->days_worked,
                        $payBasis,
                        $templateSettings
                    );

                    // Update attendance record with comprehensive calculation data
                    $record->update([
                        // Original salary data
                        'basic_salary' => $attendanceCalculation['base_components']['basic_salary'] ?? 0,
                        'allowances' => json_encode($attendanceCalculation['adjusted_components']['allowances'] ?? []),
                        'deductions' => json_encode($attendanceCalculation['statutory_deductions'] ?? []),
                        'gross_salary' => $attendanceCalculation['gross_salary'],

                        // Enhanced attendance calculation fields (Phase 3.1)
                        'attendance_factor' => $attendanceCalculation['attendance_factor'],
                        'total_expected_days' => $attendanceCalculation['total_days'],
                        'actual_working_days' => $attendanceCalculation['days_worked'],
                        'prorated_percentage' => $attendanceCalculation['attendance_percentage'],
                        'calculation_method' => $attendanceCalculation['calculation_basis'],
                        'net_salary' => $attendanceCalculation['net_salary'],
                        'credit_to_bank' => $attendanceCalculation['credit_to_bank'],
                        'adjusted_components' => json_encode($attendanceCalculation['adjusted_components']),
                        'calculation_details' => json_encode($attendanceCalculation),
                        'calculated_at' => now(),
                        'calculated_by' => Auth::user()->email ?? 'system'
                    ]);

                    // Add to preview data (first 5 records) with enhanced information
                    if (count($previewData) < 5) {
                        $previewData[] = [
                            'employee_code' => $record->employee_code,
                            'employee_name' => $attendanceCalculation['employee_name'],
                            'pay_grade' => $attendanceCalculation['pay_grade'],
                            'days_worked' => $attendanceCalculation['days_worked'],
                            'total_days' => $attendanceCalculation['total_days'],
                            'attendance_factor' => $attendanceCalculation['attendance_factor'],
                            'attendance_percentage' => $attendanceCalculation['attendance_percentage'],
                            'gross_salary' => $attendanceCalculation['gross_salary'],
                            'net_salary' => $attendanceCalculation['net_salary'],
                            'credit_to_bank' => $attendanceCalculation['credit_to_bank'],
                            'calculation_basis' => $attendanceCalculation['calculation_basis']
                        ];
                    }

                    $processed++;
                } catch (\Exception $e) {
                    Log::error("Error processing attendance record: " . $e->getMessage());
                    $warnings[] = "Employee '{$record->employee_code}': Processing error - " . $e->getMessage();
                }
            }

            // Update upload status with simplified processing info
            $attendanceUpload->update([
                'processing_notes' => json_encode(array_merge(
                    json_decode($attendanceUpload->processing_notes, true) ?? [],
                    $warnings,
                    ["Simplified upload: {$salaryDataFetched} salary records auto-fetched"]
                ))
            ]);

            return [
                'success' => true,
                'upload_id' => $attendanceUpload->id,
                'processed' => $processed,
                'failed' => $result['failed'] ?? 0,
                'warnings' => $warnings,
                'salary_data_fetched' => $salaryDataFetched,
                'preview_data' => $previewData,
                'message' => "Simplified attendance upload completed. Salary data automatically fetched for {$salaryDataFetched} employees."
            ];
        } catch (\Exception $e) {
            Log::error("Error in simplified attendance processing: " . $e->getMessage());
            return [
                'success' => false,
                'errors' => ['Error processing simplified attendance file: ' . $e->getMessage()]
            ];
        }
    }

    /**
     * Get employee salary data from pay grade assignment
     */
    private function getEmployeeSalaryData($employee)
    {
        // This would integrate with the existing salary structure system
        // For now, return sample data - in real implementation, fetch from pay grades
        return [
            'basic_salary' => 150000,
            'allowances' => ['transport' => 15000, 'housing' => 25000, 'meal' => 5000],
            'deductions' => ['tax' => 5000, 'pension' => 7500, 'nhf' => 750],
            'gross_salary' => 195000
        ];
    }

    /**
     * Calculate attendance factor based on days worked and calculation basis
     */
    private function calculateAttendanceFactor($daysWorked, $calculationBasis)
    {
        $expectedDays = $this->getExpectedWorkingDays($calculationBasis);
        return min(1.0, (float)$daysWorked / $expectedDays);
    }

    /**
     * Get expected working days based on calculation basis
     */
    private function getExpectedWorkingDays($calculationBasis)
    {
        return $calculationBasis === 'calendar_days' ? 30 : 22; // 22 working days default
    }

    /**
     * Get all attendance uploads with pagination
     */
    public function getAttendanceUploads(Request $request): JsonResponse
    {
        try {
            $query = AttendanceUpload::with(['client', 'uploader'])
                ->orderBy('created_at', 'desc');

            // Apply filters
            if ($request->filled('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $uploads = $query->paginate($request->per_page ?? 15);

            return response()->json([
                'success' => true,
                'data' => $uploads
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching uploads: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get upload statistics
     */
    public function getUploadStatistics($uploadId): JsonResponse
    {
        try {
            $stats = $this->fileProcessingService->getUploadStatistics($uploadId);

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an attendance upload and all associated records
     */
    public function deleteAttendanceUpload($uploadId): JsonResponse
    {
        try {
            $success = $this->fileProcessingService->deleteUpload($uploadId);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Upload deleted successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete upload'
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting upload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test the AttendanceBasedPayrollService (Phase 3.1 - Development/Testing endpoint)
     */
    public function testAttendancePayrollCalculation(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'employee_id' => 'required|exists:staff,id',
                'days_worked' => 'required|integer|min:0|max:31',
                'client_id' => 'required|exists:clients,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get employee and client
            $employee = Staff::findOrFail($request->employee_id);
            $client = Client::findOrFail($request->client_id);

            // Get template settings
            $templateSettings = $this->getClientTemplateSettings($client->id);

            // Calculate attendance-based salary
            $result = $this->attendancePayrollService->calculateAdjustedSalary(
                $employee,
                $request->days_worked,
                $client->pay_calculation_basis ?? 'working_days',
                $templateSettings
            );

            return response()->json([
                'success' => true,
                'message' => 'Attendance-based payroll calculation completed',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Attendance payroll calculation test error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error testing attendance payroll calculation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get client template settings for attendance-based payroll calculations (Phase 3.1)
     * 
     * @param int $clientId
     * @return array
     */
    private function getClientTemplateSettings(int $clientId): array
    {
        try {
            // For now, return default template settings
            // In future phases, this will load actual client template configurations
            return [
                'statutory' => [
                    'paye' => [
                        'enabled' => true,
                        'rate' => 7.5,
                        'type' => 'percentage',
                        'formula' => '',
                        'components' => []
                    ],
                    'pension' => [
                        'enabled' => true,
                        'rate' => 8,
                        'type' => 'percentage',
                        'formula' => '',
                        'components' => []
                    ],
                    'nsitf' => [
                        'enabled' => true,
                        'rate' => 1,
                        'type' => 'percentage',
                        'formula' => '',
                        'components' => []
                    ]
                ],
                'custom' => []
            ];
        } catch (\Exception $e) {
            Log::error("Error getting client template settings: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Generate invoice with attendance-based payroll calculation (Phase 3.2 - Template Processing Logic)
     * Integrates AttendanceBasedPayrollService with template-driven invoice generation
     */
    public function generateAttendanceBasedInvoice(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attendance_upload_id' => 'required|exists:attendance_uploads,id',
            'template_id' => 'nullable|exists:invoice_templates,id',
            'invoice_type' => 'required|in:detailed,summary',
            'invoice_period' => 'required|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Log::info('Phase 3.2: Starting attendance-based invoice generation', [
                'attendance_upload_id' => $request->attendance_upload_id,
                'template_id' => $request->template_id,
                'invoice_type' => $request->invoice_type
            ]);

            // 1. Load attendance upload and related data
            $attendanceUpload = AttendanceUpload::with(['attendanceRecords', 'client'])->findOrFail($request->attendance_upload_id);
            $client = $attendanceUpload->client;

            // 2. Get client template settings (Phase 3.2 integration point)
            $templateSettings = $this->getClientTemplateSettings($client->id);

            // TODO Phase 3.2: Enhance to use specific template_id when template system is fully integrated
            if ($request->template_id) {
                Log::info('Phase 3.2: Template ID provided but template integration pending', [
                    'template_id' => $request->template_id
                ]);
            }

            // 3. Process attendance records through AttendanceBasedPayrollService
            $payrollResults = $this->processAttendanceWithTemplate($attendanceUpload, $templateSettings);

            // 4. Generate invoice using processed payroll data
            $invoiceData = $this->generateInvoiceFromPayroll($attendanceUpload, $payrollResults, $request->invoice_type, $request->invoice_period);

            Log::info('Phase 3.2: Attendance-based invoice generation completed', [
                'invoice_id' => $invoiceData['id'],
                'total_amount' => $invoiceData['total_invoice_amount'],
                'employees_processed' => count($payrollResults)
            ]);

            return response()->json([
                'success' => true,
                'data' => $invoiceData,
                'payroll_summary' => [
                    'employees_processed' => count($payrollResults),
                    'total_gross' => array_sum(array_column($payrollResults, 'gross_salary')),
                    'total_net' => array_sum(array_column($payrollResults, 'net_salary')),
                    'total_credit_to_bank' => array_sum(array_column($payrollResults, 'credit_to_bank'))
                ],
                'message' => 'Invoice generated successfully with attendance-based payroll calculations'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Phase 3.2: Attendance-based invoice generation failed', [
                'attendance_upload_id' => $request->attendance_upload_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate attendance-based invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process attendance records through AttendanceBasedPayrollService with template settings (Phase 3.2)
     */
    private function processAttendanceWithTemplate(AttendanceUpload $attendanceUpload, array $templateSettings): array
    {
        $attendanceRecords = $attendanceUpload->attendanceRecords()->where('status', 'processed')->get();
        $client = $attendanceUpload->client;
        $payrollResults = [];

        foreach ($attendanceRecords as $record) {
            try {
                // Find staff member for this attendance record
                $staff = Staff::where('employee_code', $record->employee_id)
                    ->where('client_id', $client->id)
                    ->first();

                if (!$staff) {
                    Log::warning('Staff not found for attendance record', [
                        'employee_id' => $record->employee_id,
                        'client_id' => $client->id
                    ]);
                    continue;
                }

                // Calculate payroll using AttendanceBasedPayrollService with template settings
                $payrollResult = $this->attendancePayrollService->calculateAdjustedSalary(
                    $staff,
                    $record->days_worked,
                    $client->pay_calculation_basis ?? 'working_days',
                    $templateSettings
                );

                // Add record metadata to result
                $payrollResult['attendance_record_id'] = $record->id;
                $payrollResult['employee_code'] = $record->employee_id;
                $payrollResult['designation'] = $record->designation;
                $payrollResult['payroll_month'] = $record->payroll_month;

                $payrollResults[] = $payrollResult;
            } catch (\Exception $e) {
                Log::error('Failed to process attendance record payroll', [
                    'record_id' => $record->id,
                    'employee_code' => $record->employee_code,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $payrollResults;
    }

    /**
     * Generate invoice data from processed payroll results (Phase 3.2)
     */
    private function generateInvoiceFromPayroll(AttendanceUpload $attendanceUpload, array $payrollResults, string $invoiceType, string $invoicePeriod): array
    {
        $client = $attendanceUpload->client;

        // Map invoice type to database enum values
        $mappedInvoiceType = match ($invoiceType) {
            'detailed', 'with_schedule' => 'with_schedule',
            'summary', 'without_schedule' => 'without_schedule',
            default => 'with_schedule'
        };

        // Calculate totals from payroll results
        $totalGross = array_sum(array_column($payrollResults, 'gross_salary'));
        $totalNet = array_sum(array_column($payrollResults, 'net_salary'));
        $totalCreditToBank = array_sum(array_column($payrollResults, 'credit_to_bank'));

        // Create invoice record
        $invoice = GeneratedInvoice::create([
            'invoice_number' => 'INV-' . now()->format('YmdHis') . '-' . $client->id,
            'attendance_upload_id' => $attendanceUpload->id,
            'client_id' => $client->id,
            'invoice_type' => $mappedInvoiceType,
            'invoice_month' => now()->startOfMonth(), // Use invoice_month instead of invoice_period
            'total_employees' => count($payrollResults),
            'gross_payroll' => $totalGross,
            'net_payroll' => $totalNet,
            'total_invoice_amount' => $totalCreditToBank,
            'status' => 'generated',
            'generated_by' => Auth::id() ?? 1,
            'calculation_breakdown' => json_encode([
                'payroll_service_version' => '3.1',
                'template_processing_version' => '3.2',
                'employees_processed' => count($payrollResults),
                'calculation_basis' => $client->pay_calculation_basis ?? 'working_days',
                'payroll_details' => $payrollResults
            ])
        ]);

        // Create line items from payroll results
        foreach ($payrollResults as $payrollResult) {
            InvoiceLineItem::create([
                'generated_invoice_id' => $invoice->id,
                'attendance_record_id' => $payrollResult['attendance_record_id'] ?? null,
                'employee_id' => $payrollResult['employee_code'],
                'employee_name' => $payrollResult['employee_name'],
                'designation' => $payrollResult['designation'] ?? 'Staff',
                'days_worked' => $payrollResult['days_worked'],
                'basic_salary' => $payrollResult['base_components']['basic_salary'] ?? 0,
                'gross_pay' => $payrollResult['gross_salary'],
                'paye_deduction' => $payrollResult['statutory_deductions']['paye'] ?? 0,
                'nhf_deduction' => $payrollResult['statutory_deductions']['nhf'] ?? 0,
                'nsitf_deduction' => $payrollResult['statutory_deductions']['nsitf'] ?? 0,
                'other_deductions' => ($payrollResult['statutory_deductions']['pension'] ?? 0) + ($payrollResult['statutory_deductions']['itf'] ?? 0),
                'total_deductions' => array_sum($payrollResult['statutory_deductions'] ?? []),
                'net_pay' => $payrollResult['net_salary'],
                'allowances_breakdown' => json_encode($payrollResult['base_components'] ?? []),
                'deductions_breakdown' => json_encode($payrollResult['statutory_deductions'] ?? [])
            ]);
        }

        return $invoice->load(['client', 'lineItems'])->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | Phase 1.3: Enhanced Attendance Upload Process
    |--------------------------------------------------------------------------
    */

    /**
     * Upload attendance file with direct pay_grade_structure_id matching
     * Phase 1.3: Enhanced upload process with template validation
     */
    public function uploadWithDirectMatching(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
                'client_id' => 'required|exists:clients,id',
                'month' => 'required|string|max:20',
                'description' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Use the existing file processing service
            $result = $this->fileProcessingService->processAttendanceFile(
                $request->file('file'),
                $request->client_id,
                Auth::id()
            );

            if (!$result['success']) {
                return response()->json($result, 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Attendance file uploaded and processed successfully with direct matching',
                'data' => $result['data'],
                'validation_summary' => $result['validation_summary'] ?? null
            ]);
        } catch (\Exception $e) {
            Log::error('Enhanced attendance upload failed: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->except(['file'])
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process attendance file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get validation results for an attendance upload
     * Phase 1.3: Detailed validation reporting
     */
    public function getValidationResults(int $uploadId): JsonResponse
    {
        try {
            $upload = AttendanceUpload::findOrFail($uploadId);

            // Check authorization
            if (!$this->canAccessUpload($upload)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to upload validation results'
                ], 403);
            }

            // Get validation results from attendance records
            $attendanceRecords = AttendanceRecord::where('attendance_upload_id', $uploadId)
                ->with(['staff.payGradeStructure'])
                ->get();

            $validationResults = [
                'total_records' => $attendanceRecords->count(),
                'valid_records' => 0,
                'invalid_records' => 0,
                'template_coverage' => [],
                'validation_errors' => [],
                'missing_templates' => []
            ];

            foreach ($attendanceRecords as $record) {
                if ($record->validation_status === 'valid') {
                    $validationResults['valid_records']++;
                } else {
                    $validationResults['invalid_records']++;
                    $validationResults['validation_errors'][] = [
                        'employee_code' => $record->employee_code,
                        'employee_name' => $record->employee_name,
                        'error' => $record->validation_notes
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $validationResults
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get validation results: ' . $e->getMessage(), [
                'upload_id' => $uploadId,
                'exception' => $e
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve validation results: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get template coverage for an attendance upload
     * Phase 1.3: Template coverage validation
     */
    public function getTemplateCoverage(int $uploadId): JsonResponse
    {
        try {
            $upload = AttendanceUpload::with('client')->findOrFail($uploadId);

            // Check authorization
            if (!$this->canAccessUpload($upload)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to template coverage data'
                ], 403);
            }

            // Get unique pay_grade_structure_ids from the upload
            $payGradeStructureIds = AttendanceRecord::where('attendance_upload_id', $uploadId)
                ->whereNotNull('pay_grade_structure_id')
                ->distinct()
                ->pluck('pay_grade_structure_id')
                ->toArray();

            // Check template coverage using AttendanceExportService if available
            // For now, we'll provide basic coverage info
            $coverageResults = [
                'client_id' => $upload->client_id,
                'client_name' => $upload->client->organisation_name,
                'upload_id' => $uploadId,
                'pay_grade_structures' => [],
                'coverage_percentage' => 0,
                'missing_templates' => [],
                'covered_templates' => []
            ];

            // Basic template coverage check
            foreach ($payGradeStructureIds as $payGradeId) {
                $hasTemplate = \App\Models\InvoiceTemplate::where('client_id', $upload->client_id)
                    ->where('pay_grade_structure_id', $payGradeId)
                    ->exists();

                if ($hasTemplate) {
                    $coverageResults['covered_templates'][] = $payGradeId;
                } else {
                    $coverageResults['missing_templates'][] = $payGradeId;
                }
            }

            $totalStructures = count($payGradeStructureIds);
            $coveredStructures = count($coverageResults['covered_templates']);
            $coverageResults['coverage_percentage'] = $totalStructures > 0
                ? round(($coveredStructures / $totalStructures) * 100, 2)
                : 100;

            return response()->json([
                'success' => true,
                'data' => $coverageResults
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get template coverage: ' . $e->getMessage(), [
                'upload_id' => $uploadId,
                'exception' => $e
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve template coverage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if the current user can access the upload
     */
    private function canAccessUpload(AttendanceUpload $upload): bool
    {
        // For now, basic authorization - can be enhanced based on user roles
        return true;
    }
}
