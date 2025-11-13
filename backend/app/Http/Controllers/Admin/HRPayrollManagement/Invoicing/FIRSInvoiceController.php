<?php

namespace App\Http\Controllers\Admin\HRPayrollManagement\Invoicing;

use App\Http\Controllers\Controller;
use App\Models\AttendanceUpload;
use App\Models\GeneratedInvoice;
use App\Services\TemplateBasedCalculationService;
use App\Services\AttendanceExportService;
use App\Services\FIRSService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Exception;

class FIRSInvoiceController extends Controller
{
    protected $calculationService;
    protected $attendanceExportService;
    protected $firsService;

    public function __construct(
        TemplateBasedCalculationService $calculationService,
        AttendanceExportService $attendanceExportService,
        FIRSService $firsService
    ) {
        $this->calculationService = $calculationService;
        $this->attendanceExportService = $attendanceExportService;
        $this->firsService = $firsService;
    }

    public function submitToFIRS(Request $request, $uploadId): JsonResponse
    {
        try {
            $upload = AttendanceUpload::with(['client', 'uploader'])
                ->where('id', $uploadId)
                ->first();

            if (!$upload) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance upload not found'
                ], 404);
            }

            if (!$this->firsService->isEnabled()) {
                return response()->json([
                    'success' => false,
                    'message' => 'FIRS integration is not configured'
                ], 400);
            }

            // Find or get invoice for this attendance upload
            $invoice = GeneratedInvoice::where('attendance_upload_id', $uploadId)->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'No invoice found for this attendance upload. Please generate an invoice first.'
                ], 400);
            }

            Log::info('FIRS: Starting submission for invoice', [
                'upload_id' => $uploadId,
                'invoice_id' => $invoice->id
            ]);

            $invoiceData = $this->prepareInvoiceData($invoice, $upload);

            Log::info('FIRS: Prepared invoice data for submission', [
                'invoice_data' => $invoiceData
            ]);

            $firsResult = $this->firsService->submitInvoice($invoiceData);

            Log::info('FIRS: Received response from service', [
                'firs_result' => $firsResult
            ]);

            // Store FIRS response data on the invoice (not attendance)
            $invoice->update([
                'firs_submitted' => true,
                'firs_submitted_at' => now(),
                'firs_approved' => $firsResult['approved'] ?? false,
                'firs_approved_at' => ($firsResult['approved'] ?? false) ? now() : null,
                'firs_status' => ($firsResult['approved'] ?? false) ? 'approved' : 'rejected',
                'firs_invoice_number' => $firsResult['firs_invoice_number'] ?? null,
                'firs_reference' => $firsResult['firs_reference'] ?? null,
                'firs_irn' => $firsResult['irn'] ?? null,
                'firs_certificate' => $firsResult['certificate'] ?? null,
                'firs_qr_data' => $firsResult['qr_code_data'] ?? null,
                'firs_response_data' => isset($firsResult['data']) ? json_encode($firsResult['data']) : null,
                'firs_error_message' => ($firsResult['approved'] ?? false) ? null : ($firsResult['message'] ?? 'Unknown error'),
                'firs_last_checked_at' => now()
            ]);

            return response()->json([
                'success' => $response . success,
                'message' => $response . message,
                'data' => [
                    'invoice_id' => $invoice->id,
                    'firs_status' => $invoice->firs_status,
                    'firs_approved' => $invoice->firs_approved,
                    'firs_invoice_number' => $invoice->firs_invoice_number,
                    'firs_reference' => $invoice->firs_reference,
                    'firs_data' => $response . data ?? null
                ]
            ]);
        } catch (Exception $e) {
            Log::error('FIRS: Submission failed', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'FIRS submission failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getFIRSServiceStatus(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->firsService->getStatus()
        ]);
    }

    /**
     * Preview invoice data for FIRS submission
     */
    public function previewInvoiceForFIRS(Request $request, $uploadId)
    {
        try {
            $upload = AttendanceUpload::find($uploadId);

            if (!$upload) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance upload not found.'
                ], 404);
            }

            $invoice = GeneratedInvoice::where('attendance_upload_id', $uploadId)->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'No invoice found for this attendance upload. Please generate an invoice first.'
                ], 400);
            }

            $invoiceData = $this->prepareInvoiceData($invoice, $upload);

            return response()->json([
                'success' => true,
                'message' => 'Invoice data retrieved successfully',
                'data' => $invoiceData
            ]);
        } catch (\Exception $e) {
            Log::error('FIRS: Preview failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to preview invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    private function prepareInvoiceData(GeneratedInvoice $invoice, AttendanceUpload $upload): array
    {
        $client = $upload->client;

        return [
            'invoice_number' => $invoice->invoice_number,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),

            'supplier' => [
                'tin' => '32506532-0001',
                'name' => 'Strategic Outsourcing Limited'
            ],
            'customer' => [
                'tin' => $client->firs_tin ?? $client->tin ?? '',
                'name' => $client->organisation_name ?? $client->name
            ],
            'line_items' => [[
                'item_code' => 'HR-SERVICES',
                'description' => 'HR and Payroll Management Services',
                'quantity' => 1,
                'unit_price' => (float) $invoice->total_invoice_amount,
                'total_amount' => (float) $invoice->total_invoice_amount
            ]],

            'sub_total' => (float) $invoice->net_payroll + (float) $invoice->management_fee,
            'total_tax' => (float) $invoice->vat_amount,
            'total_amount' => (float) $invoice->total_invoice_amount,
            'payment_terms' => '30 days',
            'notes' => 'HR and Payroll Management Services'
        ];
    }

    /**
     * Export FIRS-compliant PDF with QR code (only for FIRS-approved invoices)
     * 
     * @param \Illuminate\Http\Request $request
     * @param string $invoiceId
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\Response
     */
    public function exportFIRSCompliancePDF(Request $request, string $invoiceId)
    {
        try {
            $invoice = GeneratedInvoice::with(['client', 'lineItems'])
                ->where('id', $invoiceId)
                ->orWhere('invoice_number', $invoiceId)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found'
                ], 404);
            }

            // Strict FIRS compliance check - must be approved
            if (!$invoice->firs_submitted || !$invoice->firs_approved) {
                return response()->json([
                    'success' => false,
                    'message' => 'FIRS Compliance Required',
                    'error_code' => 'FIRS_NOT_APPROVED',
                    'compliance_status' => [
                        'firs_submitted' => $invoice->firs_submitted ?? false,
                        'firs_approved' => $invoice->firs_approved ?? false,
                        'firs_status' => $invoice->firs_status ?? 'not_submitted',
                        'message' => 'This invoice must be FIRS-approved to export compliant PDF'
                    ],
                    'required_action' => 'Please submit this invoice to FIRS and obtain approval first'
                ], 403);
            }

            // Validate FIRS data availability
            if (!$invoice->firs_qr_data || !$invoice->firs_irn) {
                return response()->json([
                    'success' => false,
                    'message' => 'FIRS data incomplete',
                    'error_code' => 'FIRS_DATA_MISSING',
                    'required_action' => 'Please resubmit to FIRS to obtain complete compliance data'
                ], 422);
            }

            // Get optional issue date
            $issueDate = $request->input('issue_date');

            // Generate FIRS-compliant PDF with QR code and full compliance details
            return \App\Services\InvoicePDFExportService::exportInvoiceToPDFWithFIRS(
                $invoice,
                $this->prepareFIRSDataForPDF($invoice),
                $issueDate
            );
        } catch (Exception $e) {
            Log::error('Failed to export FIRS-compliant PDF', [
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export FIRS-compliant PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit generated invoice to FIRS (invoice-based endpoint)
     * 
     * @param \Illuminate\Http\Request $request
     * @param string $invoiceId
     * @return \Illuminate\Http\JsonResponse
     */
    public function submitInvoiceToFIRS(Request $request, string $invoiceId): JsonResponse
    {
        try {
            $invoice = GeneratedInvoice::with(['client', 'attendanceUpload.uploader'])
                ->where('id', $invoiceId)
                ->orWhere('invoice_number', $invoiceId)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found'
                ], 404);
            }

            if (!$this->firsService->isEnabled()) {
                return response()->json([
                    'success' => false,
                    'message' => 'FIRS integration is not configured'
                ], 400);
            }

            Log::info('FIRS: Starting submission for invoice', [
                'invoice_id' => $invoiceId,
                'invoice_number' => $invoice->invoice_number
            ]);

            // Use the invoice and its related attendance upload
            $upload = $invoice->attendanceUpload;
            $invoiceData = $this->prepareInvoiceData($invoice, $upload);

            Log::info('FIRS: Prepared invoice data for submission', [
                'invoice_data' => $invoiceData
            ]);

            $firsResult = $this->firsService->submitInvoice($invoiceData);

            Log::info('FIRS: Received response from service', [
                'firs_result' => $firsResult
            ]);

            // Update invoice with FIRS data
            if ($firsResult['success']) {
                // Check if this is a simulation response (not real FIRS approval)
                $isSimulation = isset($firsResult['data']['simulation']) && $firsResult['data']['simulation'] === true;
                $isApproved = ($firsResult['approved'] ?? false) && !$isSimulation;

                $invoice->update([
                    'firs_submitted' => true,
                    'firs_submitted_at' => now(),
                    'firs_status' => $isSimulation ? 'simulated' : ($isApproved ? 'approved' : 'submitted'),
                    'firs_irn' => $firsResult['irn'] ?? null,
                    'firs_invoice_number' => $firsResult['firs_invoice_number'] ?? null,
                    'firs_reference' => $firsResult['firs_reference'] ?? null,
                    'firs_qr_data' => $firsResult['qr_code_data'] ?? null,
                    'firs_response_data' => $firsResult['data'] ?? null,
                    'firs_approved' => $isApproved,
                    'firs_approved_at' => $isApproved ? now() : null
                ]);

                Log::info('FIRS: Invoice updated with submission data', [
                    'invoice_id' => $invoice->id,
                    'firs_status' => $isApproved ? 'approved' : 'submitted',
                    'firs_approved' => $isApproved
                ]);
            } else {
                $invoice->update([
                    'firs_submitted' => false,
                    'firs_status' => 'failed',
                    'firs_error_message' => $firsResult['message'] ?? 'Unknown error'
                ]);
            }

            return response()->json([
                'success' => $firsResult['success'],
                'message' => $firsResult['message'] ?? 'FIRS submission completed',
                'data' => [
                    'invoice_id' => $invoice->id,
                    'firs_status' => $invoice->firs_status,
                    'firs_approved' => $invoice->firs_approved,
                    'firs_invoice_number' => $invoice->firs_invoice_number,
                    'firs_reference' => $invoice->firs_reference,
                    'firs_approved_at' => $invoice->firs_approved_at,
                    'firs_qr_data' => $invoice->firs_qr_data,
                    'firs_data' => $firsResult['data'] ?? null
                ]
            ]);
        } catch (Exception $e) {
            Log::error('FIRS: Failed to submit invoice', [
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit invoice to FIRS',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview invoice data for FIRS submission (invoice-based endpoint)
     * 
     * @param \Illuminate\Http\Request $request
     * @param string $invoiceId
     * @return \Illuminate\Http\JsonResponse
     */
    public function previewInvoiceDataForFIRS(Request $request, string $invoiceId): JsonResponse
    {
        try {
            $invoice = GeneratedInvoice::with(['client', 'attendanceUpload', 'lineItems'])
                ->where('id', $invoiceId)
                ->orWhere('invoice_number', $invoiceId)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found'
                ], 404);
            }

            $upload = $invoice->attendanceUpload;
            $invoiceData = $this->prepareInvoiceData($invoice, $upload);

            return response()->json([
                'success' => true,
                'message' => 'Invoice preview data prepared for FIRS',
                'data' => [
                    'invoice_preview' => $invoiceData,
                    'invoice_details' => [
                        'id' => $invoice->id,
                        'invoice_number' => $invoice->invoice_number,
                        'total_amount' => $invoice->total_invoice_amount,
                        'client' => $invoice->client->organisation_name ?? $invoice->client->name,
                        'firs_status' => $invoice->firs_status ?? 'not_submitted'
                    ]
                ]
            ]);
        } catch (Exception $e) {
            Log::error('FIRS: Failed to preview invoice data', [
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to preview invoice data for FIRS',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Prepare FIRS data for PDF generation
     *
     * @param GeneratedInvoice $invoice
     * @return array
     */
    private function prepareFIRSDataForPDF(GeneratedInvoice $invoice): array
    {
        // Generate encrypted QR data for FIRS compliance
        $qrData = $this->generateEncryptedQRData($invoice);

        return [
            'firs_submitted' => $invoice->firs_submitted,
            'firs_approved' => $invoice->firs_approved,
            'firs_irn' => $invoice->firs_irn,
            'firs_invoice_number' => $invoice->firs_invoice_number,
            'firs_reference' => $invoice->firs_reference,
            'firs_approved_at' => $invoice->firs_approved_at,
            'firs_qr_data' => $qrData,
            'firs_status' => $invoice->firs_status,
            // Add the QR data with the expected key name for PDF service
            'qr_code_data' => $qrData,
            'qr_code' => $qrData,
            'irn' => $invoice->firs_irn,
            'approval_date' => $invoice->firs_approved_at,
        ];
    }

    /**
     * Generate encrypted QR data for FIRS compliance using FIRSQRCodeService
     * 
     * @param GeneratedInvoice $invoice
     * @return string|null
     */
    private function generateEncryptedQRData(GeneratedInvoice $invoice): ?string
    {
        try {
            // Validate IRN is available
            if (empty($invoice->firs_irn)) {
                Log::warning('Cannot generate FIRS QR: IRN missing', [
                    'invoice_id' => $invoice->id
                ]);
                return $invoice->firs_qr_data; // Fallback to stored data
            }

            // Initialize FIRS QR Code Service
            $qrService = new \App\Services\FIRSQRCodeService();

            // Generate encrypted QR code using official FIRS method (IRN only)
            $encryptedData = $qrService->generateQRDataFromIRN($invoice->firs_irn);

            if ($encryptedData) {
                Log::info('FIRS QR data generated for PDF using official method', [
                    'invoice_id' => $invoice->id,
                    'irn' => $invoice->firs_irn,
                    'encrypted_length' => strlen($encryptedData),
                    'method' => 'Official FIRS RSA encryption'
                ]);

                return $encryptedData;
            } else {
                Log::warning('FIRS encrypted QR generation failed, using stored data', [
                    'invoice_id' => $invoice->id,
                    'irn' => $invoice->firs_irn
                ]);

                // Fallback to stored QR data if available
                return $invoice->firs_qr_data;
            }
        } catch (Exception $e) {
            Log::error('Failed to generate FIRS encrypted QR data', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            // Fallback to stored QR data if available
            return $invoice->firs_qr_data;
        }
    }
}
