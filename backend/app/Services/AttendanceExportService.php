<?php

namespace App\Services;

use App\Models\Staff;
use App\Models\Client;
use App\Models\AttendanceUpload;
use App\Models\GeneratedInvoice;
use App\Models\InvoiceLineItem;
use App\Models\ExportTemplate;
use App\Models\InvoiceSnapshot;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\AttendanceTemplateExport;
use App\Exports\FiduciaInvoiceExport;
use App\Exports\TemplateBasedInvoiceExport;

/**
 * AttendanceExportService
 * 
 * Handles export of attendance templates with pre-filled staff data
 * Supports export-based attendance workflow for error-free invoice processing
 * 
 * Phase 1.1: Staff Profile Export Functionality
 */
class AttendanceExportService
{
    protected TemplateBasedCalculationService $templateService;

    public function __construct()
    {
        $this->templateService = new TemplateBasedCalculationService();
    }

    /**
     * Match staff from attendance data using employee_code (exact) or name (fuzzy)
     * Uses same advanced matching logic as EmployeeManagementBulkUploadService
     * 
     * @param array $attendanceRow ['employee_code' => 'EMP001', 'employee_name' => 'John Doe']
     * @param int $clientId
     * @return Staff|null
     */
    private function matchStaffFromAttendance(array $attendanceRow, int $clientId): ?Staff
    {
        $employeeCode = $attendanceRow['employee_code'] ?? $attendanceRow['Employee ID'] ?? null;
        $employeeName = $attendanceRow['employee_name'] ?? $attendanceRow['Employee Name'] ?? null;

        $staff = null;

        // Try exact match by employee_code first (highest priority)
        if ($employeeCode) {
            $staff = Staff::where('employee_code', $employeeCode)
                ->where('client_id', $clientId)
                ->first();
        }

        // If not found, try fuzzy name match
        if (!$staff && $employeeName) {
            $cleanName = trim($employeeName);

            // Try matching as "First Last" or "Last First"
            $staff = Staff::where('client_id', $clientId)
                ->where(function ($query) use ($cleanName) {
                    // Match "FirstName LastName" pattern
                    $query->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$cleanName}%"])
                        // Match "LastName FirstName" pattern
                        ->orWhereRaw("CONCAT(last_name, ' ', first_name) LIKE ?", ["%{$cleanName}%"])
                        // Match "FirstName MiddleName LastName" pattern
                        ->orWhereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$cleanName}%"]);
                })
                ->first();
        }

        return $staff;
    }

    /**
     * Get total days for pay calculation basis
     * 
     * @param string $payBasis
     * @param int $month
     * @param int $year
     * @return int
     */
    private function getTotalDaysForPayBasis(string $payBasis, int $month, int $year): int
    {
        if ($payBasis === 'working_days') {
            // Calculate working days (exclude weekends)
            $date = \Carbon\Carbon::createFromDate($year, $month, 1);
            $daysInMonth = $date->daysInMonth;
            $workingDays = 0;

            for ($day = 1; $day <= $daysInMonth; $day++) {
                $currentDate = \Carbon\Carbon::createFromDate($year, $month, $day);
                if (!$currentDate->isWeekend()) {
                    $workingDays++;
                }
            }

            return $workingDays;
        } else {
            // Calendar days - all days in month
            return \Carbon\Carbon::createFromDate($year, $month, 1)->daysInMonth;
        }
    }

    /**
     * Export attendance template for a client
     * Exports ALL active staff - user fills in Days Present only
     * No longer filters by template coverage - simplified approach
     * 
     * @param int $clientId
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     * @throws \Exception
     */
    public function exportAttendanceTemplate(int $clientId)
    {
        try {
            Log::info("Starting attendance template export", [
                'client_id' => $clientId
            ]);

            // 1. Validate client exists
            $client = Client::findOrFail($clientId);

            // 2. Get ALL active staff for client (no template filtering)
            $staff = Staff::where('client_id', $clientId)
                ->where('status', 'active')
                ->orderBy('employee_code')
                ->get();

            if ($staff->isEmpty()) {
                throw new \Exception("No active staff found for client: {$client->organisation_name}");
            }

            Log::info("Exporting attendance template", [
                'client_id' => $clientId,
                'client_name' => $client->organisation_name,
                'total_staff' => $staff->count()
            ]);

            // 3. Get template coverage for informational purposes only
            $coverage = $this->templateService->getTemplateCoverage($clientId);

            // 4. Generate filename
            $filename = $this->generateFilename($client);

            // 5. Export to Excel
            $export = new AttendanceTemplateExport($staff, $client, $coverage);

            Log::info("Attendance template export completed successfully", [
                'client_id' => $clientId,
                'client_name' => $client->organisation_name,
                'staff_count' => $staff->count(),
                'filename' => $filename
            ]);

            return Excel::download($export, $filename);
        } catch (\Exception $e) {
            Log::error("Error exporting attendance template", [
                'client_id' => $clientId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }

    /**
     * Get export preview data for a client
     * 
     * @param int $clientId
     * @return array
     */
    public function getExportPreview(int $clientId): array
    {
        try {
            $client = Client::findOrFail($clientId);

            // Get template coverage
            $coverage = $this->templateService->getTemplateCoverage($clientId);
            $coveredPayGrades = collect($coverage)
                ->where('has_template', true)
                ->pluck('pay_grade_structure_id')
                ->toArray();

            // Get staff with template coverage
            $staffWithTemplates = Staff::where('client_id', $clientId)
                ->where('status', 'active')
                ->whereNotNull('pay_grade_structure_id')
                ->whereIn('pay_grade_structure_id', $coveredPayGrades)
                ->count();

            // Get staff without template coverage
            $staffWithoutTemplates = Staff::where('client_id', $clientId)
                ->where('status', 'active')
                ->where(function ($query) use ($coveredPayGrades) {
                    $query->whereNull('pay_grade_structure_id')
                        ->orWhereNotIn('pay_grade_structure_id', $coveredPayGrades);
                })
                ->count();

            return [
                'client_name' => $client->organisation_name,
                'total_active_staff' => $staffWithTemplates + $staffWithoutTemplates,
                'staff_with_templates' => $staffWithTemplates,
                'staff_without_templates' => $staffWithoutTemplates,
                'template_coverage_percentage' => $staffWithTemplates > 0 ?
                    round(($staffWithTemplates / ($staffWithTemplates + $staffWithoutTemplates)) * 100, 2) : 0,
                'can_export' => $staffWithTemplates > 0,
                'coverage_details' => $coverage
            ];
        } catch (\Exception $e) {
            Log::error("Error getting export preview", [
                'client_id' => $clientId,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Generate export filename
     * 
     * @param Client $client
     * @return string
     */
    private function generateFilename(Client $client): string
    {
        $clientSlug = str_replace(' ', '_', strtolower($client->organisation_name));
        $clientSlug = preg_replace('/[^a-z0-9_]/', '', $clientSlug);
        $date = date('Y_m_d');
        $time = date('His');

        return "attendance_template_{$clientSlug}_{$date}_{$time}.xlsx";
    }

    /**
     * Get staff without template coverage for a client
     * 
     * @param int $clientId
     * @return \Illuminate\Support\Collection
     */
    public function getStaffWithoutTemplates(int $clientId)
    {
        $coverage = $this->templateService->getTemplateCoverage($clientId);
        $coveredPayGrades = collect($coverage)
            ->where('has_template', true)
            ->pluck('pay_grade_structure_id')
            ->toArray();

        return Staff::where('client_id', $clientId)
            ->where('status', 'active')
            ->where(function ($query) use ($coveredPayGrades) {
                $query->whereNull('pay_grade_structure_id')
                    ->orWhereNotIn('pay_grade_structure_id', $coveredPayGrades);
            })
            ->get();
    }

    /**
     * Validate staff templates for a client
     * 
     * @param int $clientId
     * @return array
     */
    public function validateStaffTemplates(int $clientId): array
    {
        $staff = Staff::where('client_id', $clientId)->get();
        $coverage = $this->templateService->getTemplateCoverage($clientId);

        $validation = [
            'total_staff' => $staff->count(),
            'covered_staff' => 0,
            'uncovered_staff' => 0,
            'coverage_details' => [],
            'missing_templates' => [],
            'validation_passed' => false
        ];

        $payGradeGroups = $staff->groupBy('pay_grade_structure_id');

        foreach ($payGradeGroups as $payGradeId => $staffGroup) {
            $hasTemplate = collect($coverage)->firstWhere('pay_grade_structure_id', $payGradeId)['has_template'] ?? false;

            $coverageDetail = [
                'pay_grade_structure_id' => $payGradeId,
                'staff_count' => $staffGroup->count(),
                'has_template' => $hasTemplate
            ];

            if ($hasTemplate) {
                $validation['covered_staff'] += $staffGroup->count();
            } else {
                $validation['uncovered_staff'] += $staffGroup->count();
                $validation['missing_templates'][] = $payGradeId;
            }

            $validation['coverage_details'][] = $coverageDetail;
        }

        $validation['validation_passed'] = $validation['uncovered_staff'] === 0;

        return $validation;
    }

    /**
     * Get client export statistics
     * 
     * @param int $clientId
     * @return array
     */
    public function getClientExportStats(int $clientId): array
    {
        $staff = Staff::where('client_id', $clientId)->get();
        $client = Client::findOrFail($clientId);
        $coverage = $this->templateService->getTemplateCoverage($clientId);

        $payGradeGroups = $staff->groupBy('pay_grade_structure_id');
        $templateStats = [];

        foreach ($payGradeGroups as $payGradeId => $staffGroup) {
            $hasTemplate = collect($coverage)->firstWhere('pay_grade_structure_id', $payGradeId)['has_template'] ?? false;

            $templateStats[] = [
                'pay_grade_structure_id' => $payGradeId,
                'staff_count' => $staffGroup->count(),
                'has_template' => $hasTemplate,
                'template_status' => $hasTemplate ? 'Ready' : 'Missing Template'
            ];
        }

        return [
            'client' => [
                'id' => $client->id,
                'name' => $client->organisation_name,
                'total_staff' => $staff->count()
            ],
            'template_statistics' => $templateStats,
            'summary' => [
                'total_pay_grades' => $payGradeGroups->count(),
                'covered_pay_grades' => collect($templateStats)->where('has_template', true)->count(),
                'coverage_percentage' => $payGradeGroups->count() > 0
                    ? round((collect($templateStats)->where('has_template', true)->count() / $payGradeGroups->count()) * 100, 2)
                    : 0
            ],
            'export_ready' => collect($templateStats)->every('has_template')
        ];
    }

    /**
     * Process uploaded attendance file and save to database
     * Phase 1.3: Enhanced upload with database storage
     * 
     * @param int $clientId
     * @param \Illuminate\Http\UploadedFile $file
     * @param string|null $payrollMonth
     * @return array
     */
    public function processUploadedAttendanceWithSave(
        int $clientId,
        $file,
        ?string $payrollMonth = null,
        bool $isForPayroll = true // PAYROLL PROCESSING FLAG
    ): array {
        // Process the file first
        $processedResult = $this->processUploadedAttendance($clientId, $file);

        // Default to current month if not provided
        if (!$payrollMonth) {
            $payrollMonth = now()->format('Y-m-01');
        } else {
            // Convert YYYY-MM to YYYY-MM-01 for database
            $payrollMonth = $payrollMonth . '-01';
        }

        // Save to database
        $upload = AttendanceUpload::create([
            'client_id' => $clientId,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $file->store('attendance_uploads'),
            'file_type' => $file->getClientOriginalExtension(),
            'total_records' => $processedResult['total_rows'],
            'processed_records' => $processedResult['valid_records'],
            'failed_records' => count($processedResult['errors']),
            'processing_status' => $processedResult['processing_successful'] ? 'completed' : 'failed',
            'processing_errors' => json_encode($processedResult['errors']),
            'payroll_month' => $payrollMonth,
            'uploaded_by' => 1, // Default user ID
            'is_for_payroll' => $isForPayroll, // PAYROLL FLAG
            // Auto-confirm validation results
            'successfully_matched' => $processedResult['valid_records'],
            'failed_matches' => count($processedResult['unmatched_staff'] ?? []),
            'match_percentage' => $processedResult['total_rows'] > 0
                ? ($processedResult['valid_records'] / $processedResult['total_rows']) * 100
                : 0,
            'validation_status' => $processedResult['processing_successful'] ? 'validated' : 'failed',
            'ready_for_processing' => $processedResult['processing_successful'], // AUTO-CONFIRM
            'validation_completed_at' => now(),
            // Store validation results for display
            'format_validation_results' => json_encode([
                'headers_valid' => true,
                'rows_processed' => $processedResult['total_rows']
            ]),
            'matching_validation_results' => json_encode([
                'matched_staff' => $processedResult['processed_data'] ?? [],
                'unmatched_staff' => $processedResult['unmatched_staff'] ?? []
            ]),
            'template_coverage_results' => json_encode([
                'covered_pay_grades' => $processedResult['pay_grades_covered'] ?? 0,
                'coverage_percentage' => $processedResult['coverage_percentage'] ?? 100
            ]),
        ]);

        // Create individual attendance records for valid entries
        if (!empty($processedResult['processed_data'])) {
            foreach ($processedResult['processed_data'] as $recordData) {
                \App\Models\AttendanceRecord::create([
                    'attendance_upload_id' => $upload->id,
                    'client_id' => $clientId,
                    'staff_id' => $recordData['staff_id'],
                    'employee_id' => $recordData['employee_code'],
                    'employee_code' => $recordData['employee_code'],
                    'employee_name' => $recordData['employee_name'],
                    'pay_grade_structure_id' => $recordData['pay_grade_structure_id'],
                    'days_worked' => (int) $recordData['days_worked'],
                    'payroll_month' => $payrollMonth,
                    'direct_id_matched' => true,
                    'record_status' => 'valid',
                    'template_available' => true, // Assume template is available since validation passed
                    'ready_for_calculation' => true,
                    'status' => 'pending'
                ]);
            }
        }

        // Add upload_id to result
        $processedResult['upload_id'] = $upload->id;

        return $processedResult;
    }

    /**
     * Process uploaded attendance file without saving to database
     * Phase 1.3: Core processing logic
     * 
     * @param int $clientId
     * @param \Illuminate\Http\UploadedFile $file
     * @return array
     */
    public function processUploadedAttendance(int $clientId, $file): array
    {
        try {
            // Import the file data
            $data = Excel::toArray([], $file)[0]; // Get first sheet

            // Remove header row
            $headers = array_shift($data);

            // Validate headers (3-column format after simplification)
            $expectedHeaders = ['Employee ID', 'Employee Name', 'Days Present'];
            if ($headers !== $expectedHeaders) {
                throw new \Exception('Invalid file format. Expected headers: ' . implode(', ', $expectedHeaders));
            }

            $processedData = [];
            $errors = [];
            $validRecords = 0;

            foreach ($data as $rowIndex => $row) {
                $rowNumber = $rowIndex + 2; // +2 because we removed header and arrays are 0-indexed

                // Validate row structure (now only 3 columns)
                if (count($row) < 3) {
                    $errors[] = "Row {$rowNumber}: Insufficient columns";
                    continue;
                }

                [$employeeCode, $employeeName, $daysPresent] = $row;

                // Validate days present
                if (!is_numeric($daysPresent) || $daysPresent < 0 || $daysPresent > 31) {
                    $errors[] = "Row {$rowNumber}: Invalid days present ({$daysPresent}). Must be between 0 and 31.";
                    continue;
                }

                // Use advanced fuzzy matching to find staff member
                $staff = $this->matchStaffFromAttendance([
                    'employee_code' => $employeeCode,
                    'employee_name' => $employeeName
                ], $clientId);

                if (!$staff) {
                    $errors[] = "Row {$rowNumber}: Staff not found (Code: {$employeeCode}, Name: {$employeeName}). Please check employee code or name.";
                    continue;
                }

                // Track match confidence (exact employee_code match vs fuzzy name match)
                $matchType = (trim($staff->employee_code) === trim($employeeCode)) ? 'exact' : 'fuzzy';

                $processedData[] = [
                    'staff_id' => $staff->id,
                    'employee_code' => $staff->employee_code, // Use actual staff employee_code
                    'employee_name' => $staff->full_name,       // Use actual staff name
                    'pay_grade_structure_id' => $staff->pay_grade_structure_id, // Get from matched staff
                    'days_worked' => (float) $daysPresent, // Changed variable name
                    'match_type' => $matchType, // Track whether exact or fuzzy match
                    'row_number' => $rowNumber
                ];

                $validRecords++;
            }

            return [
                'total_rows' => count($data),
                'valid_records' => $validRecords,
                'errors' => $errors,
                'processed_data' => $processedData,
                'processing_successful' => empty($errors),
                'ready_for_calculation' => empty($errors) && $validRecords > 0
            ];
        } catch (\Exception $e) {
            throw new \Exception("File processing failed: " . $e->getMessage());
        }
    }

    /**
     * Get validation results for an uploaded attendance file
     * Phase 2.1: Enhanced validation results with staff matching details
     * 
     * @param int $uploadId
     * @return array
     * @throws \Exception
     */
    public function getValidationResults(int $uploadId): array
    {
        try {
            // Retrieve the upload record
            $upload = AttendanceUpload::findOrFail($uploadId);

            // Get the stored processing errors (already decoded by Eloquent)
            $errors = $upload->processing_errors ?? [];

            // Get individual attendance records for this upload
            $attendanceRecords = \App\Models\AttendanceRecord::where('attendance_upload_id', $uploadId)
                ->with(['staff'])
                ->get();

            // Separate matched and unmatched staff
            $matchedStaff = [];
            $unmatchedStaff = [];
            $duplicateStaff = [];

            foreach ($attendanceRecords as $record) {
                $staffData = [
                    'id' => $record->id,
                    'employee_code' => $record->employee_code,
                    'employee_name' => $record->employee_name,
                    'pay_grade_structure_id' => $record->pay_grade_structure_id,
                    'days_worked' => $record->days_worked,
                    'staff_id' => $record->staff_id,
                    'record_status' => $record->record_status,
                    'template_available' => $record->template_available,
                    'ready_for_calculation' => $record->ready_for_calculation,
                    'direct_id_matched' => $record->direct_id_matched,
                    'staff' => $record->staff ? [
                        'id' => $record->staff->id,
                        'employee_code' => $record->staff->employee_code,
                        'first_name' => $record->staff->first_name,
                        'last_name' => $record->staff->last_name,
                        'email' => $record->staff->email,
                        'pay_grade_structure_id' => $record->staff->pay_grade_structure_id,
                        'status' => $record->staff->status
                    ] : null
                ];

                if ($record->record_status === 'valid' && $record->staff_id) {
                    $matchedStaff[] = $staffData;
                } else {
                    $unmatchedStaff[] = $staffData;
                }
            }

            return [
                'upload_id' => $uploadId,
                'validation_status' => $upload->processing_status,
                'total_records' => $upload->total_records,
                'valid_records' => $upload->processed_records,
                'invalid_records' => $upload->failed_records,
                'errors' => $errors,
                'warnings' => [],
                'matched_staff' => $matchedStaff,
                'unmatched_staff' => $unmatchedStaff,
                'duplicate_staff' => $duplicateStaff,
                'template_coverage' => [
                    'covered_pay_grades' => $upload->processed_records,
                    'uncovered_pay_grades' => $upload->failed_records,
                    'coverage_percentage' => $upload->total_records > 0
                        ? round(($upload->processed_records / $upload->total_records) * 100, 2)
                        : 0
                ],
                'validation_timestamp' => $upload->updated_at->toISOString(),
                'message' => 'Validation results retrieved from upload record.'
            ];
        } catch (\Exception $e) {
            throw new \Exception("Failed to retrieve validation results: " . $e->getMessage());
        }
    }

    /**
     * Get template coverage for an uploaded attendance file
     * Phase 1.3: Template coverage validation
     * 
     * @param int $uploadId
     * @return array
     * @throws \Exception
     */
    public function getTemplateCoverage(int $uploadId): array
    {
        try {
            // For now, we'll return mock template coverage results
            // In a full implementation, this would retrieve coverage analysis from a database table
            // that stores upload coverage analysis

            return [
                'upload_id' => $uploadId,
                'coverage_status' => 'analyzed',
                'total_pay_grades' => 0,
                'covered_pay_grades' => 0,
                'uncovered_pay_grades' => 0,
                'coverage_percentage' => 0,
                'coverage_details' => [],
                'missing_templates' => [],
                'coverage_timestamp' => now()->toISOString(),
                'message' => 'Template coverage service is not yet fully implemented. Please use the validate-templates endpoint for coverage analysis.'
            ];
        } catch (\Exception $e) {
            throw new \Exception("Failed to retrieve template coverage: " . $e->getMessage());
        }
    }

    /**
     * Generate invoice from attendance upload
     * 
     * @param AttendanceUpload $upload
     * @param string $invoiceType
     * @return array
     * @throws \Exception
     */
    public function generateInvoiceFromUpload(AttendanceUpload $upload, string $invoiceType = 'with_schedule')
    {
        try {
            Log::info("Starting invoice generation from upload", [
                'upload_id' => $upload->id,
                'client_id' => $upload->client_id,
                'invoice_type' => $invoiceType,
                'total_records' => $upload->total_records
            ]);

            // Validate that upload has attendance records
            $attendanceRecords = $upload->attendanceRecords()->with('staff')->get();

            if ($attendanceRecords->isEmpty()) {
                throw new \Exception('No attendance records found for this upload');
            }

            // Check if an invoice already exists for this upload
            $existingInvoice = GeneratedInvoice::where('attendance_upload_id', $upload->id)->first();
            if ($existingInvoice) {
                Log::info("Invoice already exists for upload", [
                    'upload_id' => $upload->id,
                    'existing_invoice_id' => $existingInvoice->invoice_number
                ]);

                // Get period from payroll_month
                $payrollDate = \Carbon\Carbon::parse($upload->payroll_month);

                // Return existing invoice data
                return [
                    'invoice_id' => $existingInvoice->invoice_number,
                    'database_id' => $existingInvoice->id,
                    'upload_id' => $upload->id,
                    'client_id' => $upload->client_id,
                    'client_name' => $upload->client->organisation_name,
                    'invoice_type' => $existingInvoice->invoice_type,
                    'period_month' => $payrollDate->month,
                    'period_year' => $payrollDate->year,
                    'total_staff' => $existingInvoice->total_employees,
                    'total_amount' => $existingInvoice->total_invoice_amount,
                    'generated_at' => $existingInvoice->generated_at,
                    'status' => 'already_exists',
                    'staff_details' => $existingInvoice->calculation_breakdown
                ];
            }

            // Generate sequential invoice number per client in FIRS-compatible format
            $invoiceId = $this->generateSequentialInvoiceNumber($upload->client_id);

            // Get period from payroll_month for invoice data
            $payrollDate = \Carbon\Carbon::parse($upload->payroll_month);

            // Calculate invoice data
            $invoiceData = [
                'invoice_id' => $invoiceId,
                'upload_id' => $upload->id,
                'client_id' => $upload->client_id,
                'client_name' => $upload->client->organisation_name,
                'invoice_type' => $invoiceType,
                'period_month' => $payrollDate->month,
                'period_year' => $payrollDate->year,
                'total_staff' => $attendanceRecords->count(),
                'total_amount' => 0,
                'generated_at' => now(),
                'staff_details' => []
            ];

            $totalAmount = 0;
            $totalGrossPayroll = 0;
            $totalDeductions = 0;
            $totalNetPayroll = 0;

            // Process each attendance record using TemplateBasedCalculationService
            foreach ($attendanceRecords as $record) {
                try {
                    // Get client's pay calculation basis
                    $client = $upload->client;
                    $payBasis = $client->pay_calculation_basis ?? 'calendar_days';

                    // Use invoice/payroll month for accurate proration calculation
                    // This ensures the calculation uses the correct month (September = 30 days, October = 31 days)
                    $invoiceMonth = \Carbon\Carbon::parse($upload->payroll_month);

                    // Calculate total days based on client's pay calculation basis (using invoice month)
                    $totalDays = $this->getTotalDaysForPayBasis($payBasis, $invoiceMonth->month, $invoiceMonth->year);

                    // Calculate attendance factor
                    $attendanceFactor = min($record->days_worked / $totalDays, 1.0);

                    // Prepare attendance context for proration calculations
                    $attendanceContext = [
                        'days_worked' => $record->days_worked,
                        'total_days' => $totalDays,
                        'calculation_basis' => $payBasis
                    ];

                    // Use TemplateBasedCalculationService for actual calculations
                    $calculationResult = $this->templateService->calculateFromTemplate(
                        $record->staff,
                        $upload->client_id,
                        $attendanceFactor,
                        $attendanceContext
                    );

                    $staffCalculation = [
                        'attendance_record_id' => $record->id, // Add the actual attendance record ID
                        'staff_id' => $record->staff_id,
                        'employee_code' => $record->staff->employee_code, // Add employee code
                        'staff_name' => $record->staff->first_name . ' ' . $record->staff->last_name,
                        'staff_number' => $record->staff->staff_number,
                        'pay_grade' => $record->staff->jobAssignment->payGradeStructure->grade_name ?? 'N/A',
                        'days_worked' => $record->days_worked,
                        'attendance_factor' => $attendanceFactor,
                        'basic_amount' => $calculationResult['adjusted_components']['basic_salary']['adjusted_amount'] ?? 0,
                        'gross_amount' => $calculationResult['gross_salary'] ?? 0,
                        'deductions' => array_sum($calculationResult['statutory_deductions'] ?? []),
                        'net_amount' => $calculationResult['net_salary'] ?? 0,
                        'total_amount' => $calculationResult['net_salary'] ?? 0,
                        'calculation_breakdown' => $calculationResult
                    ];

                    $totalAmount += $staffCalculation['total_amount'];
                    $totalGrossPayroll += $staffCalculation['gross_amount'];
                    $totalDeductions += $staffCalculation['deductions'];
                    $totalNetPayroll += $staffCalculation['net_amount'];
                    $invoiceData['staff_details'][] = $staffCalculation;
                } catch (\Exception $e) {
                    Log::error("Failed to calculate for staff member", [
                        'staff_id' => $record->staff_id,
                        'error' => $e->getMessage()
                    ]);

                    // Fallback calculation
                    $staffCalculation = [
                        'attendance_record_id' => $record->id, // Add the actual attendance record ID
                        'staff_id' => $record->staff_id,
                        'employee_code' => $record->staff->employee_code, // Add employee code
                        'staff_name' => $record->staff->first_name . ' ' . $record->staff->last_name,
                        'staff_number' => $record->staff->staff_number,
                        'pay_grade' => $record->staff->jobAssignment->payGradeStructure->grade_name ?? 'N/A',
                        'days_worked' => $record->days_worked,
                        'attendance_factor' => 0,
                        'basic_amount' => 0,
                        'gross_amount' => 0,
                        'deductions' => 0,
                        'net_amount' => 0,
                        'total_amount' => 0,
                        'error' => $e->getMessage()
                    ];

                    $invoiceData['staff_details'][] = $staffCalculation;
                }
            }

            $invoiceData['total_amount'] = $totalGrossPayroll + $totalDeductions; // Credit to Bank model
            $invoiceData['gross_payroll'] = $totalGrossPayroll;
            $invoiceData['total_deductions'] = $totalDeductions;
            $invoiceData['net_payroll'] = $totalNetPayroll;

            // Apply Export Template (Phase 2: Invoice Formatting)
            $exportTemplate = ExportTemplate::where('client_id', $upload->client_id)
                ->where('is_active', true)
                ->first();
            $managementFee = 0;
            $vatAmount = 0;
            $finalInvoiceTotal = $totalGrossPayroll + $totalDeductions;
            $exportLineItems = [];

            if ($exportTemplate && $exportTemplate->fee_calculation_rules) {
                Log::info("Applying export template for client", [
                    'client_id' => $upload->client_id,
                    'template_id' => $exportTemplate->id,
                    'template_name' => $exportTemplate->name
                ]);

                // Prepare payroll data for export template
                $payrollData = [
                    'gross_payroll' => $totalGrossPayroll,
                    'net_payroll' => $totalNetPayroll,
                    'total_deductions' => $totalDeductions,
                ];

                // Apply export template line items (Management Fee, VAT, etc.)
                $templateResult = $this->applyExportTemplateRules($exportTemplate->fee_calculation_rules, $payrollData);
                $exportLineItems = $templateResult['export_line_items'] ?? [];
                $finalInvoiceTotal = $templateResult['final_invoice_total'] ?? $finalInvoiceTotal;

                // Extract specific fees for database storage
                $managementFee = $exportLineItems['Management Fee'] ?? 0;
                $vatAmount = $exportLineItems['VAT on Management Fee'] ?? 0;

                Log::info("Export template applied successfully", [
                    'management_fee' => $managementFee,
                    'vat_amount' => $vatAmount,
                    'final_total' => $finalInvoiceTotal,
                    'line_items' => array_keys($exportLineItems)
                ]);
            } else {
                Log::info("No export template found for client, using default calculations", [
                    'client_id' => $upload->client_id
                ]);
            }

            // Update invoice data with export template results
            $invoiceData['management_fee'] = $managementFee;
            $invoiceData['vat_amount'] = $vatAmount;
            $invoiceData['export_line_items'] = $exportLineItems;
            $invoiceData['final_invoice_total'] = $finalInvoiceTotal;

            // Save invoice to database with export template calculations
            $generatedInvoice = GeneratedInvoice::create([
                'invoice_number' => $invoiceData['invoice_id'],
                'client_id' => $upload->client_id,
                'attendance_upload_id' => $upload->id,
                'invoice_month' => now()->createFromDate($upload->period_year, $upload->period_month, 1),
                'invoice_type' => $invoiceType,
                'total_employees' => $invoiceData['total_staff'],
                'gross_payroll' => $totalGrossPayroll,
                'total_deductions' => $totalDeductions,
                'net_payroll' => $totalNetPayroll,
                'management_fee' => $managementFee, // From export template
                'vat_amount' => $vatAmount, // From export template
                'wht_amount' => 0, // Can be added to export template if needed
                'total_invoice_amount' => $finalInvoiceTotal, // From export template calculation
                'status' => 'generated',
                'calculation_breakdown' => $invoiceData['staff_details'],
                'export_line_items' => $exportLineItems, // Store export template results
                'generated_by' => Auth::id() ?? 1,
                'generated_at' => now()
            ]);

            // Create Invoice Snapshot for complete audit trail (Phase 4: Enhanced Audit Trail)
            $this->createInvoiceSnapshot($generatedInvoice, $upload, $exportTemplate, $invoiceData, $exportLineItems);

            // Save line items for each staff member with proper calculations (only for "with_schedule" invoices)
            if ($invoiceType === 'with_schedule') {
                foreach ($invoiceData['staff_details'] as $staffDetail) {
                    $calculationBreakdown = $staffDetail['calculation_breakdown'] ?? [];

                    InvoiceLineItem::create([
                        'generated_invoice_id' => $generatedInvoice->id,
                        'attendance_record_id' => $staffDetail['attendance_record_id'], // Reference to actual attendance record ID
                        'employee_id' => $staffDetail['employee_code'], // Use employee code instead of staff_id
                        'employee_name' => $staffDetail['staff_name'],
                        'designation' => $staffDetail['pay_grade'],
                        'days_worked' => $staffDetail['days_worked'],
                        'basic_salary' => $staffDetail['basic_amount'],
                        'gross_pay' => $staffDetail['gross_amount'],
                        'paye_deduction' => $calculationBreakdown['statutory_deductions']['paye'] ?? 0,
                        'nhf_deduction' => 0, // NHF not in template
                        'nsitf_deduction' => ($calculationBreakdown['statutory_deductions']['itf'] ?? 0) + ($calculationBreakdown['statutory_deductions']['eca'] ?? 0),
                        'other_deductions' => $calculationBreakdown['other_deductions'] ?? 0,
                        'total_deductions' => $staffDetail['deductions'],
                        'net_pay' => $staffDetail['net_amount'],
                        'allowances_breakdown' => $calculationBreakdown['allowance_components'] ?? [],
                        'deductions_breakdown' => $calculationBreakdown['deduction_components'] ?? []
                    ]);
                }

                Log::info("Line items created for with_schedule invoice", [
                    'invoice_id' => $invoiceData['invoice_id'],
                    'line_items_count' => count($invoiceData['staff_details'])
                ]);
            } else {
                Log::info("Summary invoice (without_schedule) generated, no line items created", [
                    'invoice_id' => $invoiceData['invoice_id'],
                    'invoice_type' => $invoiceType
                ]);
            }

            // Update invoice data with database ID
            $invoiceData['database_id'] = $generatedInvoice->id;

            Log::info("Invoice generated successfully", [
                'invoice_id' => $invoiceData['invoice_id'],
                'database_id' => $generatedInvoice->id,
                'invoice_type' => $invoiceType,
                'total_staff' => $invoiceData['total_staff'],
                'gross_payroll' => $totalGrossPayroll,
                'total_deductions' => $totalDeductions,
                'net_payroll' => $totalNetPayroll,
                'total_amount' => $invoiceData['total_amount']
            ]);

            // TODO: Save invoice to database (if needed)
            // TODO: Generate PDF invoice (if needed)
            // TODO: Send notifications (if needed)

            return $invoiceData;
        } catch (\Exception $e) {
            Log::error("Failed to generate invoice from upload", [
                'upload_id' => $upload->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception("Failed to generate invoice: " . $e->getMessage());
        }
    }

    /**
     * Generate FIDUCIA template-based invoice export
     * 
     * @param AttendanceUpload $upload
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     * @throws \Exception
     */
    public function generateFiduciaInvoiceExport(AttendanceUpload $upload)
    {
        try {
            Log::info("Starting FIDUCIA invoice export generation", [
                'upload_id' => $upload->id,
                'client_id' => $upload->client_id,
                'client_name' => $upload->client->organisation_name
            ]);

            // Get attendance records with staff information
            $attendanceRecords = $upload->attendanceRecords()->with('staff')->get();

            if ($attendanceRecords->isEmpty()) {
                throw new \Exception('No attendance records found for this upload');
            }

            // Generate filename
            $payrollDate = \Carbon\Carbon::parse($upload->payroll_month);
            $filename = sprintf(
                'FIDUCIA_Invoice_%s_%s_%s.xlsx',
                $upload->client->organisation_name,
                $payrollDate->format('Y_m'),
                now()->format('Ymd_His')
            );

            // Create FIDUCIA invoice export
            $export = new FiduciaInvoiceExport($attendanceRecords, $upload->client);

            Log::info("FIDUCIA invoice export completed successfully", [
                'upload_id' => $upload->id,
                'client_name' => $upload->client->organisation_name,
                'staff_count' => $attendanceRecords->count(),
                'filename' => $filename,
                'payroll_month' => $upload->payroll_month
            ]);

            return Excel::download($export, $filename);
        } catch (\Exception $e) {
            Log::error("FIDUCIA invoice export generation failed", [
                'upload_id' => $upload->id,
                'client_id' => $upload->client_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception("Failed to generate FIDUCIA invoice export: " . $e->getMessage());
        }
    }

    /**
     * Generate template-based invoice export for any client
     * 
     * @param AttendanceUpload $upload
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     * @throws \Exception
     */
    public function generateTemplateBasedInvoiceExport(AttendanceUpload $upload)
    {
        try {
            Log::info("Starting template-based invoice export generation", [
                'upload_id' => $upload->id,
                'client_id' => $upload->client_id,
                'client_name' => $upload->client->organisation_name
            ]);

            // Get attendance records with staff information
            $attendanceRecords = $upload->attendanceRecords()->with('staff')->get();

            if ($attendanceRecords->isEmpty()) {
                throw new \Exception('No attendance records found for this upload');
            }

            // Generate filename
            $payrollDate = \Carbon\Carbon::parse($upload->payroll_month);
            $filename = sprintf(
                '%s_Invoice_%s_%s.xlsx',
                str_replace(' ', '_', $upload->client->organisation_name),
                $payrollDate->format('Y_m'),
                now()->format('Ymd_His')
            );

            // Create template-based invoice export
            $export = new TemplateBasedInvoiceExport($attendanceRecords, $upload->client, $upload);

            Log::info("Template-based invoice export completed successfully", [
                'upload_id' => $upload->id,
                'client_name' => $upload->client->organisation_name,
                'staff_count' => $attendanceRecords->count(),
                'filename' => $filename,
                'payroll_month' => $upload->payroll_month
            ]);

            return Excel::download($export, $filename);
        } catch (\Exception $e) {
            Log::error("Template-based invoice export generation failed", [
                'upload_id' => $upload->id,
                'client_id' => $upload->client_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception("Failed to generate template-based invoice export: " . $e->getMessage());
        }
    }

    /**
     * Apply export template rules to payroll data
     * 
     * @param array $feeCalculationRules
     * @param array $payrollData
     * @return array
     */
    private function applyExportTemplateRules($feeCalculationRules, $payrollData)
    {
        $results = [];
        $componentValues = [
            'total_staff_cost' => $payrollData['gross_payroll'] ?? 0,
            'gross_payroll' => $payrollData['gross_payroll'] ?? 0,
            'net_payroll' => $payrollData['net_payroll'] ?? 0,
            'total_deductions' => $payrollData['total_deductions'] ?? 0,
        ];

        // If fee_calculation_rules is structured as line items
        if (isset($feeCalculationRules['line_items'])) {
            $lineItems = $feeCalculationRules['line_items'];
        } else {
            // Use default line items if no specific rules defined
            $lineItems = $this->getDefaultExportLineItems();
        }

        foreach ($lineItems as $lineItem) {
            $value = $this->calculateExportLineItemValue($lineItem, $componentValues, $results);
            $results[$lineItem['name']] = $value;

            // Store calculated values for dependent calculations
            $componentKey = strtolower(str_replace(' ', '_', $lineItem['name']));
            $componentValues[$componentKey] = $value;
        }

        return [
            'export_line_items' => $results,
            'final_invoice_total' => end($results) ?: $payrollData['gross_payroll']
        ];
    }

    /**
     * Calculate individual export line item value
     * 
     * @param array $lineItem
     * @param array $componentValues
     * @param array $results
     * @return float
     */
    private function calculateExportLineItemValue($lineItem, $componentValues, $results)
    {
        switch ($lineItem['formula_type']) {
            case 'percentage':
                $baseComponent = $lineItem['depends_on'] ?? 'total_staff_cost';
                $baseValue = $componentValues[$baseComponent] ?? 0;
                return $baseValue * ($lineItem['formula'] / 100);

            case 'component_sum':
                $components = $lineItem['depends_on'] ?? [];
                $sum = 0;
                foreach ($components as $component) {
                    $sum += $componentValues[$component] ?? 0;
                }
                return $sum;

            case 'line_item_sum':
                $items = $lineItem['depends_on'] ?? [];
                $sum = 0;
                foreach ($items as $item) {
                    $sum += $results[$item] ?? 0;
                }
                return $sum;

            case 'fixed_amount':
                return $lineItem['formula'] ?? 0;

            default:
                return 0;
        }
    }

    /**
     * Get default export line items if no template is configured
     * 
     * @return array
     */
    private function getDefaultExportLineItems()
    {
        return [
            [
                'name' => 'Total Staff Cost',
                'formula_type' => 'component_sum',
                'formula' => null,
                'depends_on' => ['gross_payroll', 'total_deductions'],
                'order' => 1
            ],
            [
                'name' => 'Management Fee',
                'formula_type' => 'percentage',
                'formula' => 10,
                'depends_on' => 'total_staff_cost',
                'order' => 2
            ],
            [
                'name' => 'VAT on Management Fee',
                'formula_type' => 'percentage',
                'formula' => 7.5,
                'depends_on' => 'management_fee',
                'order' => 3
            ],
            [
                'name' => 'Invoice Total',
                'formula_type' => 'line_item_sum',
                'formula' => null,
                'depends_on' => ['Total Staff Cost', 'Management Fee', 'VAT on Management Fee'],
                'order' => 4
            ]
        ];
    }

    /**
     * Create Invoice Snapshot for complete audit trail
     * Captures both calculation and export template data
     * 
     * @param GeneratedInvoice $generatedInvoice
     * @param AttendanceUpload $upload
     * @param ExportTemplate|null $exportTemplate
     * @param array $invoiceData
     * @param array $exportLineItems
     * @return InvoiceSnapshot
     */
    private function createInvoiceSnapshot($generatedInvoice, $upload, $exportTemplate, $invoiceData, $exportLineItems)
    {
        try {
            // Get calculation template ID (if any was used)
            $calculationTemplateId = null;

            // Try to find which calculation template was used by checking first staff member
            if (!empty($invoiceData['staff_details'])) {
                $firstStaff = reset($invoiceData['staff_details']);
                if (isset($firstStaff['calculation_breakdown']['template_id'])) {
                    $calculationTemplateId = $firstStaff['calculation_breakdown']['template_id'];
                }
            }

            // Handle NOT NULL constraints - provide defaults if needed
            if (!$calculationTemplateId) {
                // Get first available calculation template as default
                $defaultCalcTemplate = \App\Models\CalculationTemplate::first();
                $calculationTemplateId = $defaultCalcTemplate ? $defaultCalcTemplate->id : 1;
            }

            $exportTemplateId = $exportTemplate ? $exportTemplate->id : null;
            if (!$exportTemplateId) {
                // Get first available export template as default or create one
                $defaultExportTemplate = \App\Models\ExportTemplate::first();
                if (!$defaultExportTemplate) {
                    // Create a minimal default export template
                    $defaultExportTemplate = \App\Models\ExportTemplate::create([
                        'client_id' => $upload->client_id,
                        'name' => 'Default Export Template',
                        'version' => '1.0',
                        'format' => 'excel',
                        'column_mappings' => ['name' => 'Name', 'amount' => 'Amount'],
                        'formatting_rules' => ['currency' => '₦#,##0.00'],
                        'created_by' => Auth::user()->id ?? '1'
                    ]);
                }
                $exportTemplateId = $defaultExportTemplate->id;
                $exportTemplate = $defaultExportTemplate; // Update for snapshot
            }

            // Create template snapshots for audit trail
            $templateSnapshot = [];
            $exportMetadata = [];

            // Capture calculation template snapshot
            if ($calculationTemplateId) {
                $calculationTemplate = \App\Models\CalculationTemplate::find($calculationTemplateId);
                if ($calculationTemplate) {
                    $templateSnapshot['calculation_template'] = [
                        'id' => $calculationTemplate->id,
                        'name' => $calculationTemplate->name,
                        'version' => $calculationTemplate->version,
                        'components' => $calculationTemplate->component_structure,
                        'snapshot_time' => now()->toISOString()
                    ];
                }
            }

            // Capture export template snapshot
            if ($exportTemplate) {
                $templateSnapshot['export_template'] = [
                    'id' => $exportTemplate->id,
                    'name' => $exportTemplate->name,
                    'version' => $exportTemplate->version,
                    'fee_calculation_rules' => $exportTemplate->fee_calculation_rules,
                    'snapshot_time' => now()->toISOString()
                ];

                $exportMetadata = [
                    'template_id' => $exportTemplate->id,
                    'template_name' => $exportTemplate->name,
                    'line_items_applied' => $exportLineItems,
                    'format' => $exportTemplate->format,
                    'applied_at' => now()->toISOString()
                ];
            }

            // Calculate hash for integrity verification
            $calculationHash = hash('sha256', json_encode([
                'invoice_number' => $generatedInvoice->invoice_number,
                'employee_calculations' => $invoiceData['staff_details'],
                'export_line_items' => $exportLineItems,
                'totals' => [
                    'gross' => $generatedInvoice->gross_payroll,
                    'deductions' => $generatedInvoice->total_deductions,
                    'net' => $generatedInvoice->net_payroll,
                    'final_total' => $generatedInvoice->total_invoice_amount
                ]
            ]));

            // Create the invoice snapshot
            $snapshot = InvoiceSnapshot::create([
                'client_id' => $upload->client_id,
                'calculation_template_id' => $calculationTemplateId,
                'export_template_id' => $exportTemplateId,
                'invoice_number' => $generatedInvoice->invoice_number,
                'invoice_period' => $upload->payroll_month,
                'employee_calculations' => $invoiceData['staff_details'],
                'template_snapshot' => $templateSnapshot,
                'calculation_metadata' => [
                    'upload_id' => $upload->id,
                    'upload_filename' => $upload->file_name,
                    'processing_date' => now()->toISOString(),
                    'total_records_processed' => count($invoiceData['staff_details']),
                    'calculation_basis' => $upload->client->pay_calculation_basis ?? 'calendar_days',
                    'templates_used' => [
                        'calculation_template_id' => $calculationTemplateId,
                        'export_template_id' => $exportTemplateId
                    ]
                ],
                'total_gross_salary' => $generatedInvoice->gross_payroll,
                'total_deductions' => $generatedInvoice->total_deductions,
                'total_net_salary' => $generatedInvoice->net_payroll,
                'total_service_fees' => $generatedInvoice->management_fee + $generatedInvoice->vat_amount,
                'employee_count' => $generatedInvoice->total_employees,
                'export_metadata' => $exportMetadata,
                'export_file_paths' => [], // Will be populated when files are generated
                'status' => 'generated',
                'generated_at' => $generatedInvoice->generated_at,
                'calculation_hash' => $calculationHash,
                'is_validated' => false, // Can be validated later
                'created_by' => Auth::user()->name ?? 'System',
                'notes' => "Invoice generated from attendance upload {$upload->file_name} using " .
                    ($exportTemplate ? "export template '{$exportTemplate->name}'" : "default calculations") .
                    ($calculationTemplateId ? " and calculation template ID {$calculationTemplateId}" : "")
            ]);

            Log::info("Invoice snapshot created successfully", [
                'snapshot_id' => $snapshot->id,
                'invoice_number' => $generatedInvoice->invoice_number,
                'calculation_template_id' => $calculationTemplateId,
                'export_template_id' => $exportTemplateId,
                'calculation_hash' => $calculationHash
            ]);

            return $snapshot;
        } catch (\Exception $e) {
            Log::error("Failed to create invoice snapshot", [
                'invoice_id' => $generatedInvoice->id,
                'invoice_number' => $generatedInvoice->invoice_number,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Don't fail the invoice generation if snapshot creation fails
            return null;
        }
    }

    /**
     * Generate sequential invoice number per client in FIRS format (e.g., INV0001)
     *
     * @param int $clientId
     * @return string
     */
    protected function generateSequentialInvoiceNumber($clientId): string
    {
        // Get the highest invoice number for this specific client
        $lastInvoice = GeneratedInvoice::whereHas('attendanceUpload', function ($query) use ($clientId) {
            $query->where('client_id', $clientId);
        })
            ->where('invoice_number', 'LIKE', 'INV%')
            ->orderByRaw('CAST(SUBSTRING(invoice_number, 4) AS UNSIGNED) DESC')
            ->first();

        if ($lastInvoice && preg_match('/INV(\d+)/', $lastInvoice->invoice_number, $matches)) {
            $nextNumber = (int)$matches[1] + 1;
        } else {
            $nextNumber = 1; // First invoice for this client
        }

        // Format as INV0001, INV0002, etc. (per client)
        return sprintf('INV%04d', $nextNumber);
    }
}
