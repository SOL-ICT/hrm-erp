<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AttendanceExportService;
use App\Services\InvoicePDFExportService;
use App\Models\AttendanceUpload;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Exception;

/**
 * AttendanceExportController
 * 
 * API endpoints for attendance export functionality
 * Handles export-based attendance template generation and processing
 * 
 * Phase 1.1: Staff Profile Export Functionality
 */
class AttendanceExportController extends Controller
{
    protected $attendanceExportService;

    public function __construct(AttendanceExportService $attendanceExportService)
    {
        $this->attendanceExportService = $attendanceExportService;
    }

    /**
     * Export attendance template for a client
     * 
     * @param Request $request
     * @return JsonResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function exportTemplate(Request $request)
    {
        try {
            $request->validate([
                'client_id' => 'required|integer|exists:clients,id'
            ]);

            $clientId = $request->input('client_id');

            return $this->attendanceExportService->exportAttendanceTemplate($clientId);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export attendance template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get export preview for a client
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getExportPreview(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'client_id' => 'required|integer|exists:clients,id'
            ]);

            $clientId = $request->input('client_id');
            $preview = $this->attendanceExportService->getExportPreview($clientId);

            return response()->json([
                'success' => true,
                'data' => $preview
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get export preview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate staff templates for a client
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function validateTemplates(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'client_id' => 'required|integer|exists:clients,id'
            ]);

            $clientId = $request->input('client_id');
            $validation = $this->attendanceExportService->validateStaffTemplates($clientId);

            return response()->json([
                'success' => true,
                'data' => $validation
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get client export statistics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getExportStats(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'client_id' => 'required|integer|exists:clients,id'
            ]);

            $clientId = $request->input('client_id');
            $stats = $this->attendanceExportService->getClientExportStats($clientId);

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get export statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload and process attendance data
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function uploadAttendance(Request $request): JsonResponse
    {
        Log::info('Upload attendance method called', [
            'client_id' => $request->input('client_id'),
            'has_file' => $request->hasFile('attendance_file'),
            'method' => $request->method(),
            'content_type' => $request->header('content-type'),
            'is_for_payroll' => $request->input('is_for_payroll')
        ]);

        try {
            $request->validate([
                'client_id' => 'required|integer|exists:clients,id',
                'attendance_file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // 10MB max
                'payroll_month' => 'nullable|date_format:Y-m',
                'is_for_payroll' => 'nullable|boolean' // PAYROLL PROCESSING FLAG
            ]);

            $clientId = $request->input('client_id');
            $file = $request->file('attendance_file');
            $payrollMonth = $request->input('payroll_month');
            $isForPayroll = $request->input('is_for_payroll', true); // Default to true (payroll)

            Log::info('Validation passed, processing file', [
                'client_id' => $clientId,
                'filename' => $file->getClientOriginalName(),
                'payroll_month' => $payrollMonth,
                'is_for_payroll' => $isForPayroll
            ]);

            // Process the uploaded file and save to database
            $result = $this->attendanceExportService->processUploadedAttendanceWithSave(
                $clientId,
                $file,
                $payrollMonth,
                $isForPayroll // Pass flag to service
            );

            Log::info('File processed successfully', ['upload_id' => $result['upload_id']]);

            return response()->json([
                'success' => true,
                'message' => 'Attendance data uploaded and processed successfully',
                'data' => $result
            ]);
        } catch (Exception $e) {
            Log::error('Upload attendance failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process attendance upload',
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get validation results for an uploaded attendance file
     * Phase 1.3: Enhanced validation reporting
     * 
     * @param int $uploadId
     * @return JsonResponse
     */
    public function getValidationResults(int $uploadId): JsonResponse
    {
        try {
            $validationResults = $this->attendanceExportService->getValidationResults($uploadId);

            return response()->json([
                'success' => true,
                'message' => 'Validation results retrieved successfully',
                'data' => $validationResults
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve validation results',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get template coverage for an uploaded attendance file
     * Phase 1.3: Template coverage validation
     * 
     * @param int $uploadId
     * @return JsonResponse
     */
    public function getTemplateCoverage(int $uploadId): JsonResponse
    {
        try {
            $coverageResults = $this->attendanceExportService->getTemplateCoverage($uploadId);

            return response()->json([
                'success' => true,
                'message' => 'Template coverage results retrieved successfully',
                'data' => $coverageResults
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve template coverage',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get paginated list of attendance uploads
     * Phase 2.1: Frontend attendance uploads display
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getAttendanceUploads(Request $request): JsonResponse
    {
        try {
            // Get query parameters
            $perPage = $request->query('per_page', 10);
            $clientId = $request->query('client_id');
            $status = $request->query('status');

            // Build query with relationships
            $query = \App\Models\AttendanceUpload::with([
                'client',
                'uploader:id,name,email' // Load user who uploaded
            ]);

            // Apply filters
            if ($clientId) {
                $query->where('client_id', $clientId);
            }

            if ($status) {
                $query->where('processing_status', $status);
            }

            // Order by latest first
            $query->orderBy('created_at', 'desc');

            // Paginate results
            $uploads = $query->paginate($perPage);

            // Transform data to include calculated fields
            $transformedData = collect($uploads->items())->map(function ($upload) {
                // Use the successfully_matched and failed_matches columns from DB
                $matchedCount = $upload->successfully_matched ?? 0;
                $unmatchedCount = $upload->failed_matches ?? 0;
                $totalRecords = $upload->total_records ?? 0;

                return [
                    'id' => $upload->id,
                    'file_name' => $upload->file_name,
                    'month' => $upload->payroll_month ? $upload->payroll_month->format('M Y') : null,
                    'uploaded_at' => $upload->created_at ? $upload->created_at->format('Y-m-d H:i:s') : null,
                    'uploaded_by' => $upload->uploader ?
                        $upload->uploader->name :
                        'System',
                    'total_records' => $totalRecords,
                    'matched_count' => $matchedCount,
                    'unmatched_count' => $unmatchedCount,
                    'status' => $upload->processing_status ?? 'pending',
                    'client_id' => $upload->client_id,
                    'client_name' => $upload->client ? $upload->client->client_name : null,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Attendance uploads retrieved successfully',
                'data' => $transformedData,
                'pagination' => [
                    'current_page' => $uploads->currentPage(),
                    'last_page' => $uploads->lastPage(),
                    'per_page' => $uploads->perPage(),
                    'total' => $uploads->total(),
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attendance uploads',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download attendance template for a client (GET endpoint)
     * Phase 2.1: Template download functionality
     * 
     * @param int $clientId
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
     */
    public function downloadAttendanceTemplate(int $clientId)
    {
        try {
            // Use the existing export service method
            return $this->attendanceExportService->exportAttendanceTemplate($clientId);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download attendance template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an attendance upload
     * 
     * @param int $uploadId
     * @return JsonResponse
     */
    public function deleteUpload(int $uploadId): JsonResponse
    {
        try {
            $upload = AttendanceUpload::findOrFail($uploadId);

            // Delete the stored file if it exists
            if ($upload->file_path && Storage::exists($upload->file_path)) {
                Storage::delete($upload->file_path);
            }

            // Delete the database record
            $upload->delete();

            Log::info('Upload deleted successfully', ['upload_id' => $uploadId]);

            return response()->json([
                'success' => true,
                'message' => 'Upload deleted successfully'
            ]);
        } catch (Exception $e) {
            Log::error('Failed to delete upload', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete upload',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get preview data for an attendance upload (Phase 2.1)
     * 
     * @param int $uploadId
     * @return JsonResponse
     */
    public function getUploadPreview($uploadId)
    {
        try {
            $upload = AttendanceUpload::findOrFail($uploadId);

            // Get validation results
            $validationResults = $this->getValidationResults($uploadId);
            if (!$validationResults->getData()->success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get validation results for upload preview'
                ], 500);
            }

            // Get template coverage
            $templateCoverage = $this->getTemplateCoverage($uploadId);
            if (!$templateCoverage->getData()->success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get template coverage for upload preview'
                ], 500);
            }

            $validationData = $validationResults->getData()->data;
            $coverageData = $templateCoverage->getData()->data;

            return response()->json([
                'success' => true,
                'data' => [
                    'upload' => [
                        'id' => $upload->id,
                        'file_name' => $upload->file_name,
                        'client_id' => $upload->client_id,
                        'payroll_month' => $upload->payroll_month,
                        'upload_date' => $upload->created_at,
                        'total_records' => $upload->total_records,
                        'valid_records' => $upload->valid_records,
                        'status' => $upload->status
                    ],
                    'validation' => $validationData,
                    'template_coverage' => $coverageData,
                    'matched_staff' => $validationData->matched_staff ?? [],
                    'unmatched_staff' => $validationData->unmatched_staff ?? [],
                    'duplicate_staff' => $validationData->duplicate_staff ?? [],
                    'errors' => $validationData->errors ?? []
                ]
            ]);
        } catch (Exception $e) {
            Log::error('Failed to get upload preview', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load preview data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate invoice from attendance upload
     * 
     * @param Request $request
     * @param int $uploadId
     * @return JsonResponse
     */
    public function generateInvoice(Request $request, $uploadId)
    {
        try {
            $request->validate([
                'invoice_type' => 'required|string|in:with_schedule,summary_only'
            ]);

            // Find the attendance upload
            $upload = AttendanceUpload::with(['client', 'attendanceRecords'])->findOrFail($uploadId);

            // Check if upload is completed
            if ($upload->processing_status !== 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot generate invoice from incomplete upload'
                ], 400);
            }

            $invoiceType = $request->input('invoice_type');

            // Use the service to generate invoice
            $result = $this->attendanceExportService->generateInvoiceFromUpload($upload, $invoiceType);

            Log::info('Invoice generated successfully', [
                'upload_id' => $uploadId,
                'invoice_type' => $invoiceType,
                'result' => $result
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Invoice generated successfully',
                'invoice_id' => $result['invoice_id'] ?? null,
                'data' => $result
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance upload not found'
            ], 404);
        } catch (Exception $e) {
            Log::error('Failed to generate invoice', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update individual attendance record
     * @param Request $request
     * @param int $recordId
     * @return JsonResponse
     */
    public function updateAttendanceRecord(Request $request, $recordId)
    {
        try {
            $request->validate([
                'staff_id' => 'sometimes|required|exists:staff,id',
                'hours_worked' => 'sometimes|numeric|min:0',
                'remarks' => 'sometimes|string|nullable'
            ]);

            $record = AttendanceRecord::findOrFail($recordId);
            $record->update($request->only(['staff_id', 'hours_worked', 'remarks']));

            Log::info('Attendance record updated', [
                'record_id' => $recordId,
                'updates' => $request->only(['staff_id', 'hours_worked', 'remarks'])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Attendance record updated successfully',
                'data' => $record->load('staff')
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance record not found'
            ], 404);
        } catch (Exception $e) {
            Log::error('Failed to update attendance record', [
                'record_id' => $recordId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update attendance record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete individual attendance record
     * @param int $recordId
     * @return JsonResponse
     */
    public function deleteAttendanceRecord($recordId)
    {
        try {
            $record = AttendanceRecord::findOrFail($recordId);
            $uploadId = $record->attendance_upload_id;

            $record->delete();

            Log::info('Attendance record deleted', [
                'record_id' => $recordId,
                'upload_id' => $uploadId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Attendance record deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance record not found'
            ], 404);
        } catch (Exception $e) {
            Log::error('Failed to delete attendance record', [
                'record_id' => $recordId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete attendance record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add staff to attendance upload
     * @param Request $request
     * @param int $uploadId
     * @return JsonResponse
     */
    public function addStaffToAttendance(Request $request, $uploadId)
    {
        try {
            $request->validate([
                'staff_id' => 'required|exists:staff,id',
                'hours_worked' => 'required|numeric|min:0',
                'remarks' => 'nullable|string'
            ]);

            $upload = AttendanceUpload::findOrFail($uploadId);

            // Check if staff already exists in this upload
            $existingRecord = AttendanceRecord::where('attendance_upload_id', $uploadId)
                ->where('staff_id', $request->staff_id)
                ->first();

            if ($existingRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member already exists in this attendance upload'
                ], 400);
            }

            $record = AttendanceRecord::create([
                'attendance_upload_id' => $uploadId,
                'staff_id' => $request->staff_id,
                'hours_worked' => $request->hours_worked,
                'remarks' => $request->remarks
            ]);

            Log::info('Staff added to attendance upload', [
                'upload_id' => $uploadId,
                'staff_id' => $request->staff_id,
                'record_id' => $record->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Staff added to attendance upload successfully',
                'data' => $record->load('staff')
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance upload not found'
            ], 404);
        } catch (Exception $e) {
            Log::error('Failed to add staff to attendance upload', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add staff to attendance upload',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get generated invoices list
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getGeneratedInvoices(Request $request): JsonResponse
    {
        try {
            $invoices = \App\Models\GeneratedInvoice::with(['client', 'attendanceUpload'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $invoices,
                'total' => $invoices->count()
            ]);
        } catch (Exception $e) {
            Log::error('Failed to fetch generated invoices', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch invoices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get invoice details with line items
     * 
     * @param string $invoiceId
     * @return JsonResponse
     */
    public function getInvoiceDetails(string $invoiceId): JsonResponse
    {
        try {
            $invoice = \App\Models\GeneratedInvoice::with(['client', 'attendanceUpload', 'lineItems'])
                ->where('id', $invoiceId)
                ->orWhere('invoice_number', $invoiceId)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found'
                ], 404);
            }

            // Format the response with line items
            $invoiceData = $invoice->toArray();
            $invoiceData['line_items'] = $invoice->lineItems->toArray();

            return response()->json([
                'success' => true,
                'data' => $invoiceData
            ]);
        } catch (Exception $e) {
            Log::error('Failed to fetch invoice details', [
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch invoice details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export invoice to PDF
     * 
     * @param Request $request
     * @param string $invoiceId
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\Response
     */
    public function exportInvoicePDF(Request $request, string $invoiceId)
    {
        try {
            // Validate issue date and force export flag
            $request->validate([
                'issue_date' => 'sometimes|date_format:Y-m-d',
                'force_export' => 'sometimes|boolean'  // Allow forcing export without FIRS approval (for admin)
            ]);

            $invoice = \App\Models\GeneratedInvoice::with(['client', 'lineItems'])
                ->where('id', $invoiceId)
                ->orWhere('invoice_number', $invoiceId)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found'
                ], 404);
            }

            // Get request parameters
            $issueDate = $request->input('issue_date');
            $forceExport = $request->input('force_export', false);

            // FIRS Compliance Check - Only enforce if FIRS approval is strictly required for PDF export
            $requireFIRSApprovalForPDF = config('firs.pdf_export.require_approval_for_export', false); // Changed default to false
            if (!$forceExport && $requireFIRSApprovalForPDF && $this->isFIRSRequired($invoice) && !$this->isFIRSCompliant($invoice)) {
                $complianceMessage = $this->getFIRSComplianceMessage($invoice);

                return response()->json([
                    'success' => false,
                    'message' => 'FIRS Compliance Required',
                    'error_code' => 'FIRS_NOT_APPROVED',
                    'compliance_status' => [
                        'firs_submitted' => $invoice->firs_submitted ?? false,
                        'firs_approved' => $invoice->firs_approved ?? false,
                        'firs_status' => $invoice->firs_status ?? 'not_submitted',
                        'message' => $complianceMessage
                    ],
                    'required_action' => 'Please submit this invoice to FIRS and obtain approval before exporting PDF'
                ], 403); // 403 Forbidden - compliance required
            }

            // Generate PDF based on FIRS approval status
            if ($invoice->firs_approved && $invoice->firs_qr_data) {
                // Generate FIRS-compliant PDF with QR code and compliance details
                return InvoicePDFExportService::exportInvoiceToPDFWithFIRS($invoice, $this->prepareFIRSDataForPDF($invoice), $issueDate);
            } else {
                // Generate standard PDF (for force export or legacy invoices)
                return InvoicePDFExportService::exportInvoiceToPDF($invoice, $issueDate);
            }
        } catch (Exception $e) {
            Log::error('Failed to export invoice to PDF', [
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export invoice to PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export invoice to Excel
     * 
     * @param string $invoiceId
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\Response
     */
    public function exportInvoiceExcel(string $invoiceId)
    {
        try {
            $invoice = \App\Models\GeneratedInvoice::with(['client', 'attendanceUpload.attendanceRecords.staff'])
                ->where('id', $invoiceId)
                ->orWhere('invoice_number', $invoiceId)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found'
                ], 404);
            }

            // Use template-based export for all clients (uses each client's actual template structure)
            if (!$invoice->attendanceUpload) {
                return response()->json([
                    'success' => false,
                    'message' => 'No attendance upload found for this invoice'
                ], 404);
            }

            return $this->attendanceExportService->generateTemplateBasedInvoiceExport($invoice->attendanceUpload);
        } catch (Exception $e) {
            Log::error('Failed to export invoice to Excel', [
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export invoice to Excel',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if invoice is FIRS compliant for PDF export
     *
     * @param \App\Models\GeneratedInvoice $invoice
     * @return bool
     */
    private function isFIRSCompliant($invoice)
    {
        // Check if FIRS integration is enabled for this client
        if (!$this->isFIRSRequired($invoice)) {
            return true; // No FIRS requirement, allow export
        }

        // Check FIRS approval status
        return $invoice->firs_submitted && $invoice->firs_approved;
    }

    /**
     * Check if FIRS is required for this invoice/client
     *
     * @param \App\Models\GeneratedInvoice $invoice
     * @return bool
     */
    private function isFIRSRequired($invoice)
    {
        // FIRS is required if client has FIRS TIN or if invoice amount meets threshold
        $client = $invoice->client;
        $invoiceAmount = $invoice->total_invoice_amount ?? 0;

        // FIRS is required if:
        // 1. Client has FIRS TIN configured
        // 2. Invoice amount is above minimum threshold (e.g., 50,000 NGN)
        $firsMinimumAmount = config('firs.minimum_invoice_amount', 50000);

        return !empty($client->firs_tin) || $invoiceAmount >= $firsMinimumAmount;
    }

    /**
     * Get FIRS compliance message based on current status
     *
     * @param \App\Models\GeneratedInvoice $invoice
     * @return string
     */
    private function getFIRSComplianceMessage($invoice)
    {
        if (!$invoice->firs_submitted) {
            return 'This invoice has not been submitted to FIRS for tax compliance approval. Please submit to FIRS before exporting PDF.';
        }

        if (!$invoice->firs_approved) {
            $errorMessage = $invoice->firs_error_message ? " Error: {$invoice->firs_error_message}" : '';
            return "This invoice was submitted to FIRS but has not been approved.{$errorMessage} Please resolve FIRS issues before exporting PDF.";
        }

        return 'FIRS compliance status unknown. Please check FIRS submission status.';
    }

    /**
     * Prepare FIRS data for PDF generation
     *
     * @param \App\Models\GeneratedInvoice $invoice
     * @return array
     */
    private function prepareFIRSDataForPDF($invoice)
    {
        $firsResponseData = $invoice->firs_response_data ?? [];

        return [
            // FIRS Identification
            'irn' => $invoice->firs_irn,
            'firs_invoice_number' => $invoice->firs_invoice_number,
            'firs_reference' => $invoice->firs_reference,

            // FIRS Approval Details
            'approval_date' => $invoice->firs_approved_at ?
                $invoice->firs_approved_at->format('Y-m-d H:i:s') : null,
            'submission_date' => $invoice->firs_submitted_at ?
                $invoice->firs_submitted_at->format('Y-m-d H:i:s') : null,

            // QR Code Data
            'qr_code' => $invoice->firs_qr_data,
            'certificate' => $invoice->firs_certificate,

            // FIRS Tax Information
            'document_currency_code' => 'NGN',
            'tax_currency_code' => 'NGN',
            'invoice_type_code' => '380', // Commercial Invoice

            // FIRS Supplier Information (Strategic Outsourcing Limited)
            'accounting_supplier_party' => [
                'party_name' => 'Strategic Outsourcing Limited',
                'party_tin' => '32506532-0001',
                'party_address' => [
                    'street_name' => 'Plot 1665, Oyin Jolayemi Street',
                    'city_name' => 'Lagos',
                    'postal_zone' => '101233',
                    'country_identification_code' => 'NG'
                ]
            ],

            // FIRS Customer Information
            'accounting_customer_party' => [
                'party_name' => $invoice->client->organisation_name ?? $invoice->client->name,
                'party_tin' => $invoice->client->firs_tin ?? $invoice->client->tin ?? '',
                'party_address' => [
                    'street_name' => $invoice->client->head_office_address ?? '',
                    'city_name' => $invoice->client->city ?? 'Lagos',
                    'postal_zone' => $invoice->client->postal_zone ?? '',
                    'country_identification_code' => 'NG'
                ]
            ],

            // FIRS Status Information
            'submission_status' => 'approved',
            'validation_number' => $invoice->firs_irn,

            // Complete FIRS API Response (for audit trail)
            'firs_api_response' => $firsResponseData
        ];
    }

    // ============================================================================
    // PAYROLL PROCESSING MODULE - ATTENDANCE FOR PAYROLL
    // ============================================================================

    /**
     * Get attendance uploads filtered for payroll processing
     * 
     * Returns only uploads where is_for_payroll = true (payroll-related attendance)
     * Excludes uploads intended for invoicing purposes
     * 
     * @param Request $request (client_id, status, per_page)
     * @return JsonResponse
     */
    public function getAttendanceForPayroll(Request $request): JsonResponse
    {
        try {
            // Get query parameters
            $perPage = $request->query('per_page', 10);
            $clientId = $request->query('client_id');
            $status = $request->query('status');

            // Build query - filter for payroll uploads
            $query = \App\Models\AttendanceUpload::with(['client', 'uploader:id,name'])
                ->where('is_for_payroll', true); // PAYROLL FILTER

            // Apply additional filters
            if ($clientId) {
                $query->where('client_id', $clientId);
            }

            if ($status) {
                $query->where('processing_status', $status);
            }

            // Order by latest first
            $query->orderBy('created_at', 'desc');

            // Paginate results
            $uploads = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Payroll attendance uploads retrieved successfully',
                'data' => $uploads->items(),
                'pagination' => [
                    'current_page' => $uploads->currentPage(),
                    'last_page' => $uploads->lastPage(),
                    'per_page' => $uploads->perPage(),
                    'total' => $uploads->total(),
                ]
            ]);
        } catch (Exception $e) {
            Log::error('AttendanceExportController::getAttendanceForPayroll error: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve payroll attendance uploads',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
