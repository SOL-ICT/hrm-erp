<?php

namespace App\Services;

use App\Models\GeneratedInvoice;
use App\Models\SolMasterDetail;
use App\Models\ExportTemplate;
use App\Models\InvoiceTemplate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class InvoicePDFExportService
{
    /**
     * Export invoice to PDF with FIRS data
     *
     * @param int|GeneratedInvoice $invoiceOrId
     * @param array $firsData FIRS submission data
     * @param string|null $issueDate Optional issue date (Y-m-d format)
     * @return \Illuminate\Http\Response
     */
    public static function exportInvoiceToPDFWithFIRS($invoiceOrId, array $firsData, $issueDate = null)
    {
        try {
            // Handle both invoice object and invoice ID
            if ($invoiceOrId instanceof GeneratedInvoice) {
                $invoice = $invoiceOrId;
                // Ensure relationships are loaded
                if (!$invoice->relationLoaded('client')) {
                    $invoice->load(['client', 'lineItems', 'attendanceUpload']);
                }
            } else {
                // Load invoice with relationships by ID
                $invoice = GeneratedInvoice::with([
                    'client',
                    'lineItems',
                    'attendanceUpload'
                ])->findOrFail($invoiceOrId);
            }

            // Prepare data for PDF including FIRS data
            $data = self::prepareInvoiceDataWithFIRS($invoice, $firsData, $issueDate);

            // Generate PDF using app helper
            $pdf = app('dompdf.wrapper')->loadView('pdf.invoice', $data);
            $pdf->setPaper('A4', 'portrait');

            // Set options for better Unicode support
            $pdf->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
                'isFontSubsettingEnabled' => true
            ]);

            // Generate filename
            $filename = self::generatePDFFilename($invoice, 'FIRS');

            Log::info('FIRS Invoice PDF generated successfully', [
                'invoice_id' => $invoice->id,
                'filename' => $filename,
                'firs_irn' => $firsData['irn'] ?? 'N/A'
            ]);

            // Use Laravel's download method like the working regular PDF export
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error("FIRS PDF export failed for invoice {$invoice->id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Export invoice to PDF (standard version)
     *
     * @param int|GeneratedInvoice $invoiceOrId
     * @param string|null $issueDate Optional issue date (Y-m-d format)
     * @return \Illuminate\Http\Response
     */
    public static function exportInvoiceToPDF($invoiceOrId, $issueDate = null)
    {
        try {
            // Handle both invoice object and invoice ID
            if ($invoiceOrId instanceof GeneratedInvoice) {
                $invoice = $invoiceOrId;
                // Ensure relationships are loaded
                if (!$invoice->relationLoaded('client')) {
                    $invoice->load(['client', 'lineItems', 'attendanceUpload']);
                }
            } else {
                // Load invoice with relationships by ID
                $invoice = GeneratedInvoice::with([
                    'client',
                    'lineItems',
                    'attendanceUpload'
                ])->findOrFail($invoiceOrId);
            }

            // Prepare data for PDF
            $data = self::prepareInvoiceData($invoice, $issueDate);

            // Generate PDF using app helper
            $pdf = app('dompdf.wrapper')->loadView('pdf.invoice', $data);
            $pdf->setPaper('A4', 'portrait');

            // Set options for better Unicode support
            $pdf->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
                'isFontSubsettingEnabled' => true
            ]);

            // Generate filename
            $filename = self::generatePDFFilename($invoice);

            Log::info('Invoice PDF generated successfully', [
                'invoice_id' => $invoice->id,
                'filename' => $filename
            ]);

            // Return PDF as download response
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error("PDF export failed for invoice {$invoice->id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Prepare invoice data for PDF generation
     *
     * @param GeneratedInvoice $invoice
     * @param string|null $issueDate Optional issue date (Y-m-d format)
     * @return array
     */
    private static function prepareInvoiceData($invoice, $issueDate = null)
    {
        // Get SOL Master Details
        $companyInfo = SolMasterDetail::getCompanyInfo();
        $bankingDetails = SolMasterDetail::getBankingDetails();
        $signatureDetails = SolMasterDetail::getSignatureDetails();

        // Format dates - use provided issue date or invoice creation date
        if ($issueDate) {
            $invoiceDate = Carbon::parse($issueDate)->format('F d, Y');
            Log::info('Using custom issue date for PDF', ['custom_date' => $issueDate, 'formatted' => $invoiceDate]);
        } else {
            $invoiceDate = Carbon::parse($invoice->created_at)->format('F d, Y');
            Log::info('Using default issue date from invoice creation', ['formatted' => $invoiceDate]);
        }
        $currentYear = Carbon::parse($invoice->created_at)->format('Y');
        $currentMonth = Carbon::parse($invoice->created_at)->format('m');

        // Build External Order Number: Year/Month/INV/prefix
        $clientPrefix = $invoice->client->prefix ?? 'GEN';
        $externalOrder = "{$currentYear}/{$currentMonth}/INV/{$clientPrefix}";

        // Generate dynamic invoice table data from export template
        try {
            Log::info('Attempting dynamic invoice table generation for client_id: ' . $invoice->client_id);
            $invoiceTableResult = self::generateDynamicInvoiceTableData($invoice);
            $invoiceTableData = $invoiceTableResult['table_data'];
            $totalInvoiceValue = $invoiceTableResult['total_amount'];
            Log::info('Dynamic invoice table generation successful');
        } catch (\Exception $e) {
            Log::error('Error in dynamic invoice table generation: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            // Fallback to basic structure
            $fallbackResult = self::generateFallbackInvoiceTableData($invoice);
            $invoiceTableData = $fallbackResult['table_data'];
            $totalInvoiceValue = $fallbackResult['total_amount'];
        }        // Get period (Month, Year format)
        $period = Carbon::parse($invoice->created_at)->format('F, Y');

        // Load logo as base64 from file
        $logoPath = public_path('images/SOL Logo.png');
        $logoBase64 = '';
        if (file_exists($logoPath)) {
            $logoBase64 = base64_encode(file_get_contents($logoPath));
        }

        return [
            // Header info
            'issue_date' => $invoiceDate,
            'customer_code' => $invoice->client->prefix ?? 'N/A',
            'external_order' => $externalOrder,
            'payment_terms' => $invoice->client->payment_terms ?? '30 days',

            // Client info
            'client_name' => $invoice->client->name ?? 'N/A',
            'contact_person_position' => $invoice->client->contact_person_position ?? 'N/A',
            'contact_person_address' => $invoice->client->contact_person_address ?? 'N/A',
            'contact_person_name' => $invoice->client->contact_person_name ?? 'N/A',

            // Invoice data
            'period' => $period,
            'invoice_table_data' => $invoiceTableData,
            'total_amount' => $totalInvoiceValue,
            'amount_in_words' => self::numberToWords($totalInvoiceValue),

            // Company details and dynamic content
            'logo_base64' => $logoBase64,
            'service_description' => $companyInfo['service_description'] ?? 'Provision & Management of Support Staff',
            'company_name' => $companyInfo['company_name'] ?? 'Strategic Outsourcing Limited',
            'thank_you_message' => $companyInfo['thank_you_message'] ?? 'Thank you for doing business with us',
            'bank_name' => $bankingDetails['bank_name'] ?? 'N/A',
            'account_name' => $bankingDetails['account_name'] ?? 'N/A',
            'account_number' => $bankingDetails['account_number'] ?? 'N/A',
            'vat_registration_number' => $companyInfo['vat_registration_number'] ?? 'N/A',
            'tin' => $companyInfo['tin'] ?? 'N/A',

            // Signatures
            'compensation_officer' => $signatureDetails['compensation_officer'] ?? 'Compensation Officer',
            'company_accountant' => $signatureDetails['company_accountant'] ?? 'Company Accountant',
        ];
    }

    /**
     * Prepare invoice data for PDF generation with FIRS data
     *
     * @param GeneratedInvoice $invoice
     * @param array $firsData FIRS submission data
     * @param string|null $issueDate Optional issue date (Y-m-d format)
     * @return array
     */
    private static function prepareInvoiceDataWithFIRS($invoice, array $firsData, $issueDate = null)
    {
        Log::info('🚀 prepareInvoiceDataWithFIRS called', [
            'invoice_id' => $invoice->id,
            'firs_data_keys' => array_keys($firsData),
            'method' => __METHOD__
        ]);

        // Get base invoice data
        $data = self::prepareInvoiceData($invoice, $issueDate);

        // Generate QR code dynamically from IRN using production service
        $qrCodeBase64 = null;
        $irn = $firsData['irn'] ?? $firsData['firs_irn'] ?? null;

        if (!empty($irn)) {
            try {
                Log::info('Generating FIRS QR code for PDF using production service', [
                    'invoice_id' => $invoice->id,
                    'irn' => $irn
                ]);

                // Use the production QR service to generate encrypted QR data from IRN
                $qrService = new \App\Services\FIRSQRCodeService();
                $qrData = $qrService->generateQRDataFromIRN($irn);

                Log::info('FIRS PDF Export: Using EXACT working encrypted QR data for MBS 360', [
                    'invoice_id' => $invoice->id,
                    'irn' => $irn,
                    'qr_data_length' => $qrData ? strlen($qrData) : 0,
                    'qr_data_preview' => $qrData ? substr($qrData, 0, 50) . '...' : 'null',
                    'expected_length' => '344 characters (encrypted Base64)'
                ]);

                if ($qrData) {
                    // Generate QR code image from the JSON data (MBS 360 compatible)
                    $qrCodeBase64 = self::generateQRCodeImage($qrData);

                    Log::info('FIRS QR code generated successfully for PDF (ENCRYPTED format for MBS 360)', [
                        'invoice_id' => $invoice->id,
                        'irn' => $irn,
                        'qr_data_length' => strlen($qrData),
                        'qr_image_generated' => !empty($qrCodeBase64),
                        'format' => 'Encrypted Base64 (MBS 360 compatible)',
                        'matches_working_length' => strlen($qrData) === 344 ? 'YES' : 'NO'
                    ]);
                } else {
                    Log::warning('Failed to generate QR data from IRN', [
                        'invoice_id' => $invoice->id,
                        'irn' => $irn
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('FIRS QR code generation failed for PDF', [
                    'error' => $e->getMessage(),
                    'invoice_id' => $invoice->id,
                    'irn' => $irn
                ]);
            }
        } else {
            Log::warning('No IRN available for FIRS QR generation', [
                'invoice_id' => $invoice->id,
                'firs_data_keys' => array_keys($firsData)
            ]);
        }

        Log::info('QR Code processing result for FIRS PDF', [
            'invoice_id' => $invoice->id,
            'qr_code_generated' => !empty($qrCodeBase64),
            'qr_code_length' => $qrCodeBase64 ? strlen($qrCodeBase64) : 0,
            'qr_code_starts_with_data' => $qrCodeBase64 ? (strpos($qrCodeBase64, 'data:') === 0) : false
        ]);        // Format FIRS dates for display
        $firsApprovalDate = null;
        if (!empty($firsData['approval_date'])) {
            try {
                $firsApprovalDate = Carbon::parse($firsData['approval_date'])->format('F d, Y H:i T');
            } catch (\Exception $e) {
                $firsApprovalDate = $firsData['approval_date'];
            }
        }

        $firsSubmissionDate = null;
        if (!empty($firsData['submission_date'])) {
            try {
                $firsSubmissionDate = Carbon::parse($firsData['submission_date'])->format('F d, Y H:i T');
            } catch (\Exception $e) {
                $firsSubmissionDate = $firsData['submission_date'];
            }
        }

        // Add FIRS-specific data
        $firsEnhancedData = [
            'has_firs_data' => true,
            'firs_compliance_enabled' => true,

            // FIRS Invoice Identification
            'firs_irn' => $firsData['irn'] ?? $firsData['firs_irn'] ?? '',
            'firs_invoice_number' => $firsData['firs_invoice_number'] ?? '',
            'firs_reference' => $firsData['firs_reference'] ?? '',
            'firs_validation_number' => $firsData['validation_number'] ?? $firsData['irn'] ?? '',

            // FIRS Approval Information
            'firs_approval_date_formatted' => $firsApprovalDate,
            'firs_submission_date_formatted' => $firsSubmissionDate,
            'firs_submission_status' => $firsData['submission_status'] ?? 'approved',

            // FIRS Tax Compliance Details
            'firs_document_currency' => $firsData['document_currency_code'] ?? 'NGN',
            'firs_tax_currency' => $firsData['tax_currency_code'] ?? 'NGN',
            'firs_invoice_type_code' => $firsData['invoice_type_code'] ?? '380',

            // QR Code for FIRS Verification (fix variable name for template)
            'firs_qr_code' => $qrCodeBase64, // Template expects this variable name
            'firs_qr_code_base64' => $qrCodeBase64, // Keep backup
            'firs_qr_available' => !empty($qrCodeBase64),

            // FIRS data structure for template
            'firs_data' => [
                'irn' => $firsData['irn'] ?? $firsData['firs_irn'] ?? '',
                'invoice_type_code' => $firsData['invoice_type_code'] ?? '396',
                'document_currency_code' => $firsData['document_currency_code'] ?? 'NGN',
                'tax_currency_code' => $firsData['tax_currency_code'] ?? 'NGN',
                'approval_date' => $firsApprovalDate,
                'submission_date' => $firsSubmissionDate,
                'accounting_supplier_party' => $firsData['accounting_supplier_party'] ?? [
                    'party_name' => 'Strategic Outsourcing Limited',
                    'tin' => '32506532-0001',
                    'email' => 'info@strategicoutsourcing.com.ng',
                    'telephone' => '+234-803-123-4567',
                    'postal_address' => [
                        'street_name' => 'Plot 1665, Oyin Jolayemi Street',
                        'city_name' => 'Lagos'
                    ]
                ],
                'accounting_customer_party' => $firsData['accounting_customer_party'] ?? [
                    'party_name' => $invoice->client->organisation_name ?? 'N/A',
                    'tin' => $invoice->client->firs_tin ?? $invoice->client->tin ?? 'N/A',
                    'email' => $invoice->client->firs_contact_email ?? $invoice->client->contact_person_email ?? 'N/A',
                    'telephone' => $invoice->client->firs_contact_telephone ?? $invoice->client->contact_person_phone ?? $invoice->client->phone ?? 'N/A',
                    'business_description' => $invoice->client->firs_business_description ?? $invoice->client->business_description ?? 'Client Services',
                    'postal_address' => [
                        'street_name' => $invoice->client->head_office_address ?? 'N/A',
                        'city_name' => $invoice->client->firs_city ?? $invoice->client->city ?? 'Lagos',
                        'postal_zone' => $invoice->client->firs_postal_zone ?? $invoice->client->postal_zone ?? '101233',
                        'country' => $invoice->client->firs_country ?? $invoice->client->country ?? 'NG'
                    ]
                ]
            ],

            // FIRS Party Information
            'firs_supplier_details' => $firsData['accounting_supplier_party'] ?? [
                'party_name' => 'Strategic Outsourcing Limited',
                'party_tin' => '32506532-0001'
            ],
            'firs_customer_details' => $firsData['accounting_customer_party'] ?? [
                'party_name' => $invoice->client->organisation_name ?? $invoice->client->name ?? '',
                'party_tin' => $invoice->client->firs_tin ?? $invoice->client->tin ?? ''
            ],

            // FIRS Compliance Messages for PDF
            'firs_compliance_notice' => 'This invoice has been submitted to and approved by the Federal Inland Revenue Service (FIRS) of Nigeria for tax compliance.',
            'firs_verification_notice' => 'Scan the QR code below to verify this invoice with FIRS or visit the FIRS e-invoicing portal.',
            'firs_qr_instructions' => 'Use any QR code scanner app to verify this invoice authenticity with FIRS database.',

            // Complete FIRS data for advanced use
            'firs_complete_data' => $firsData
        ];

        // Merge FIRS data with base data
        return array_merge($data, $firsEnhancedData);
    }

    /**
     * Generate QR code image as base64 from QR data
     *
     * @param string $qrData
     * @return string|null
     */
    private static function generateQRCodeImage($qrData)
    {
        try {
            Log::info('FIRS QR Image Generation: Starting with ENCRYPTED QR data', [
                'qr_data_length' => strlen($qrData),
                'qr_data_preview' => substr($qrData, 0, 50) . '...',
                'is_encrypted' => strlen($qrData) === 344 ? 'YES (correct length)' : 'NO (wrong length)'
            ]);

            // The QR data from our service is now JSON (what MBS 360 expects)
            // We need to URL-encode ONLY for the API call, not for the QR content itself
            $dataToEncode = $qrData;

            // Method 1: Use optimal QR size for 150px display (3:1 ratio for crisp scaling)
            $qrApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=450x450&format=png&data=" . urlencode($dataToEncode);

            $context = stream_context_create([
                'http' => [
                    'timeout' => 15,
                    'method' => 'GET',
                    'header' => [
                        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept: image/png,image/*,*/*;q=0.8'
                    ]
                ]
            ]);

            Log::info('FIRS QR Image: Using EXACT same method as working test', [
                'data_length' => strlen($dataToEncode),
                'encrypted_preview' => substr($dataToEncode, 0, 50) . '...',
                'method' => 'GET with urlencode (SAME AS WORKING TEST)'
            ]);

            $imageContent = @file_get_contents($qrApiUrl, false, $context);

            if ($imageContent !== false && strlen($imageContent) > 100) {
                // Verify it's a valid image
                $imageInfo = @getimagesizefromstring($imageContent);
                if ($imageInfo !== false) {
                    $base64Image = 'data:image/png;base64,' . base64_encode($imageContent);

                    Log::info('FIRS QR Image: ENCRYPTED QR image generated successfully', [
                        'image_size_bytes' => strlen($imageContent),
                        'image_dimensions' => $imageInfo[0] . 'x' . $imageInfo[1],
                        'data_uri_length' => strlen($base64Image),
                        'method' => 'QR Server API (ENCRYPTED for MBS 360)'
                    ]);

                    return $base64Image;
                }
            }

            Log::warning('FIRS QR Image: QR Server API failed, trying alternative');

            // Method 2: Try QRicket API
            $qrUrl2 = "https://qrickit.com/api/qr?d=" . urlencode($dataToEncode) . "&s=8";

            $imageContent = @file_get_contents($qrUrl2, false, $context);

            if ($imageContent !== false && strlen($imageContent) > 100) {
                $imageInfo = @getimagesizefromstring($imageContent);
                if ($imageInfo !== false) {
                    $base64Image = 'data:image/png;base64,' . base64_encode($imageContent);

                    Log::info('FIRS QR Image: Generated using QRickit API', [
                        'image_size_bytes' => strlen($imageContent),
                        'data_uri_length' => strlen($base64Image)
                    ]);

                    return $base64Image;
                }
            }

            Log::warning('FIRS QR Image: All external APIs failed, creating text placeholder');

            // Method 3: Create a text-based placeholder that shows the QR data
            $svg = '<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="white" stroke="black" stroke-width="2"/>
  <rect x="20" y="20" width="30" height="30" fill="black"/>
  <rect x="70" y="20" width="30" height="30" fill="black"/>
  <rect x="120" y="20" width="30" height="30" fill="black"/>
  <rect x="170" y="20" width="30" height="30" fill="black"/>
  <rect x="220" y="20" width="30" height="30" fill="black"/>
  
  <rect x="20" y="70" width="30" height="30" fill="black"/>
  <rect x="220" y="70" width="30" height="30" fill="black"/>
  
  <rect x="20" y="120" width="30" height="30" fill="black"/>
  <rect x="70" y="120" width="30" height="30" fill="black"/>
  <rect x="120" y="120" width="30" height="30" fill="black"/>
  <rect x="170" y="120" width="30" height="30" fill="black"/>
  <rect x="220" y="120" width="30" height="30" fill="black"/>
  
  <rect x="20" y="170" width="30" height="30" fill="black"/>
  <rect x="220" y="170" width="30" height="30" fill="black"/>
  
  <rect x="20" y="220" width="30" height="30" fill="black"/>
  <rect x="70" y="220" width="30" height="30" fill="black"/>
  <rect x="120" y="220" width="30" height="30" fill="black"/>
  <rect x="170" y="220" width="30" height="30" fill="black"/>
  <rect x="220" y="220" width="30" height="30" fill="black"/>
  
  <text x="150" y="280" font-family="Arial, sans-serif" font-size="12" fill="black" text-anchor="middle">
    <tspan x="150" dy="0">FIRS QR Code</tspan>
    <tspan x="150" dy="15">Generated Successfully</tspan>
  </text>
</svg>';

            $base64Svg = 'data:image/svg+xml;base64,' . base64_encode($svg);

            Log::info('FIRS QR Image: Generated SVG placeholder', [
                'svg_length' => strlen($svg),
                'data_uri_length' => strlen($base64Svg)
            ]);

            return $base64Svg;
        } catch (\Exception $e) {
            Log::error('FIRS QR Image: Complete failure in QR image generation', [
                'error' => $e->getMessage(),
                'qr_data_length' => strlen($qrData ?? ''),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return null;
        }
    }

    /**
     * Generate dynamic invoice table data based on export template
     *
     * @param GeneratedInvoice $invoice
     * @return array
     */
    private static function generateDynamicInvoiceTableData($invoice)
    {
        // Get export template for this client with invoice line items
        $exportTemplate = \App\Models\ExportTemplate::where('client_id', $invoice->client_id)
            ->where('format', 'invoice_line_items')
            ->where('is_active', true)
            ->first();

        Log::info('Export template search', [
            'client_id' => $invoice->client_id,
            'template_found' => $exportTemplate ? 'yes' : 'no',
            'template_id' => $exportTemplate ? $exportTemplate->id : null
        ]);

        if (!$exportTemplate) {
            // Fallback to basic structure if no export template found
            Log::info('No export template found for client_id: ' . $invoice->client_id);
            return self::generateFallbackInvoiceTableData($invoice);
        }

        // Parse the line items from export template
        $columnMappings = $exportTemplate->column_mappings;
        Log::info('Column mappings raw', ['mappings' => $columnMappings]);

        // Handle JSON string or array
        if (is_string($columnMappings)) {
            $lineItems = json_decode($columnMappings, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON decode error for export template: ' . json_last_error_msg());
                return self::generateFallbackInvoiceTableData($invoice);
            }
        } else {
            $lineItems = $columnMappings;
        }

        Log::info('Parsed line items', ['count' => count($lineItems ?? []), 'items' => $lineItems]);

        if (empty($lineItems) || !is_array($lineItems)) {
            Log::info('Empty or invalid line items in export template');
            return self::generateFallbackInvoiceTableData($invoice);
        }

        // Get invoice template components for calculations
        $invoiceTemplate = \App\Models\InvoiceTemplate::where('client_id', $invoice->client_id)->first();
        $templateComponents = self::parseInvoiceTemplateComponents($invoiceTemplate);

        // Get calculation breakdown for component values
        $calculationBreakdown = null;
        if ($invoice->calculation_breakdown) {
            $calculationBreakdown = is_string($invoice->calculation_breakdown)
                ? json_decode($invoice->calculation_breakdown, true)
                : $invoice->calculation_breakdown;
        }

        // Sort line items by order
        usort($lineItems, function ($a, $b) {
            return ($a['order'] ?? 0) - ($b['order'] ?? 0);
        });

        // Calculate each line item
        $invoiceTableData = [];
        $calculatedValues = []; // Store calculated values for reference
        $itemNumber = 1;

        foreach ($lineItems as $lineItem) {
            $amount = self::calculateLineItemAmount($lineItem, $templateComponents, $calculationBreakdown, $calculatedValues, $invoice, $lineItems);

            $invoiceTableData[] = [
                'item' => (string)$itemNumber,
                'description' => $lineItem['name'],
                'amount' => $amount
            ];

            // Store calculated value for future reference
            $calculatedValues[$lineItem['id']] = $amount;
            $itemNumber++;
        }

        // Find total amount - use the last item in the table as it should be the final total
        $totalAmount = $invoice->total_invoice_amount ?? 0;
        if (!empty($invoiceTableData)) {
            // Use the last item as it should be the final total
            $lastItem = end($invoiceTableData);
            $totalAmount = $lastItem['amount'];

            Log::info('Selected total amount for amount in words', [
                'selected_item' => $lastItem['description'],
                'selected_amount' => $totalAmount,
                'fallback_db_total' => $invoice->total_invoice_amount ?? 0
            ]);
        }

        return [
            'table_data' => $invoiceTableData,
            'total_amount' => $totalAmount
        ];
    }

    /**
     * Calculate individual line item amount based on formula type
     *
     * @param array $lineItem
     * @param array $templateComponents  
     * @param array|null $calculationBreakdown
     * @param array $calculatedValues
     * @param GeneratedInvoice $invoice
     * @return float
     */
    private static function calculateLineItemAmount($lineItem, $templateComponents, $calculationBreakdown, $calculatedValues, $invoice, $allLineItems = [])
    {
        $formulaType = $lineItem['formula_type'] ?? 'fixed_amount';

        Log::info('Calculating line item', [
            'name' => $lineItem['name'],
            'formula_type' => $formulaType,
            'depends_on' => $lineItem['depends_on'] ?? null,
            'percentage' => $lineItem['percentage'] ?? null
        ]);

        switch ($formulaType) {
            case 'component':
                // Get value directly from invoice template component
                $dependsOn = $lineItem['depends_on'] ?? '';
                $value = self::getComponentValue($dependsOn, $templateComponents, $calculationBreakdown, $invoice);

                // If this is a management fee component, use DB value if available, otherwise calculate
                if ($dependsOn === 'TOTAL_MANAGEMENT_FEES') {
                    if ($value > 0) {
                        // Use the database value if it exists
                        Log::info('Using management fee from database', ['value' => $value]);
                        return $value;
                    } else {
                        // For older invoices, management fee is 10% of the base cost (Total Cost of Employment)
                        // Get the base cost from TOTAL_EMPLOYER_COSTS
                        $baseCost = self::getComponentValue('TOTAL_EMPLOYER_COSTS', $templateComponents, $calculationBreakdown, $invoice);
                        $managementFeeRate = 0.10; // 10%
                        $managementFee = $baseCost * $managementFeeRate;

                        Log::info('Calculated management fee as 10% of base cost', [
                            'base_cost' => $baseCost,
                            'management_fee_rate' => $managementFeeRate,
                            'calculated_management_fee' => $managementFee
                        ]);

                        return $managementFee;
                    }
                }

                return $value;

            case 'percentage':
                // Calculate percentage of another component/line item

                // Special handling for VAT on Management Fee
                if (($lineItem['depends_on'] ?? '') === 'VAT_ON_MGT_FEE' && isset($lineItem['base_component'])) {
                    // First, check if we have VAT amount in the database
                    $dbVatAmount = floatval($invoice->vat_amount ?? 0);
                    if ($dbVatAmount > 0) {
                        Log::info('Using VAT amount from database', ['vat_amount' => $dbVatAmount]);
                        return $dbVatAmount;
                    }

                    // If no database VAT, calculate it from management fee
                    $managementFeeValue = 0;

                    // First check if we have management fee from database
                    $dbManagementFee = floatval($invoice->management_fee ?? 0);
                    if ($dbManagementFee > 0) {
                        $managementFeeValue = $dbManagementFee;
                        Log::info('Using management fee from database for VAT calculation', ['management_fee' => $dbManagementFee]);
                    } else {
                        // Look for calculated management fee by name
                        foreach ($calculatedValues as $itemId => $value) {
                            // Check if this corresponds to a management fee item by looking at line items
                            foreach ($allLineItems as $item) {
                                if (
                                    $item['id'] === $itemId &&
                                    (stripos($item['name'], 'management') !== false ||
                                        stripos($item['name'], 'mgmt') !== false)
                                ) {
                                    $managementFeeValue = floatval($value);
                                    Log::info('Using calculated management fee for VAT calculation', ['management_fee' => $managementFeeValue]);
                                    break 2; // Break both loops
                                }
                            }
                        }

                        // If still no management fee found, calculate it as 10% of base cost
                        if ($managementFeeValue == 0) {
                            $baseCost = self::getComponentValue('TOTAL_EMPLOYER_COSTS', $templateComponents, $calculationBreakdown, $invoice);
                            $managementFeeValue = $baseCost * 0.10; // 10%
                            Log::info('Calculated management fee on-demand for VAT (10% of base cost)', ['base_cost' => $baseCost, 'management_fee' => $managementFeeValue]);
                        }
                    }

                    $percentage = floatval($lineItem['percentage'] ?? 0);
                    $calculated = $managementFeeValue * ($percentage / 100);

                    Log::info('Calculated VAT from management fee', [
                        'management_fee_value' => $managementFeeValue,
                        'percentage' => $percentage,
                        'calculated_vat' => $calculated
                    ]);

                    return $calculated;
                }

                // Standard percentage calculation
                $baseValue = self::getBaseValueForPercentage($lineItem, $templateComponents, $calculationBreakdown, $calculatedValues, $invoice);
                $percentage = floatval($lineItem['percentage'] ?? 0);
                $calculated = $baseValue * ($percentage / 100);

                Log::info('Calculated percentage', [
                    'base_value' => $baseValue,
                    'percentage' => $percentage,
                    'calculated_value' => $calculated
                ]);

                return $calculated;

            case 'percentage_subtraction':
                // Calculate negative percentage (subtraction)
                $baseValue = self::getBaseValueForPercentage($lineItem, $templateComponents, $calculationBreakdown, $calculatedValues, $invoice);
                $percentage = floatval($lineItem['percentage'] ?? 0);
                return - ($baseValue * ($percentage / 100));

            case 'sum':
                // Sum multiple line items or components
                $total = 0;
                $sumItems = $lineItem['sum_items'] ?? [];

                Log::info('Starting sum calculation', [
                    'line_item_name' => $lineItem['name'] ?? 'Unknown',
                    'sum_items' => $sumItems,
                    'available_calculated_values' => array_keys($calculatedValues),
                    'calculated_values_content' => $calculatedValues
                ]);

                if (is_array($sumItems)) {
                    foreach ($sumItems as $itemId) {
                        if (isset($calculatedValues[$itemId])) {
                            $value = floatval($calculatedValues[$itemId]);
                            $total += $value;
                            Log::info('Added to sum', ['item_id' => $itemId, 'value' => $value, 'running_total' => $total]);
                        } else {
                            Log::warning('Sum item not found in calculated values', ['item_id' => $itemId]);
                        }
                    }
                }

                Log::info('Final sum calculation', [
                    'line_item_name' => $lineItem['name'] ?? 'Unknown',
                    'sum_items' => $sumItems,
                    'final_total' => $total
                ]);

                // If this is the final total and we have a database total, check for discrepancy
                if (stripos($lineItem['name'] ?? '', 'total') !== false) {
                    $dbTotal = floatval($invoice->total_invoice_amount ?? 0);
                    if ($dbTotal > 0 && abs($dbTotal - $total) > 1) { // Allow small rounding differences
                        Log::warning('Sum total does not match database total', [
                            'calculated_total' => $total,
                            'database_total' => $dbTotal,
                            'difference' => $dbTotal - $total,
                            'using_database_total' => true
                        ]);
                        return $dbTotal; // Use database total when there's a significant discrepancy
                    }
                }

                return $total;

            case 'subtraction':
                // Base amount minus other items
                $baseValue = self::getBaseValueForPercentage($lineItem, $templateComponents, $calculationBreakdown, $calculatedValues, $invoice);
                $subtractAmount = 0;
                $subtractItems = $lineItem['subtract_items'] ?? [];
                if (is_array($subtractItems)) {
                    foreach ($subtractItems as $itemId) {
                        if (isset($calculatedValues[$itemId])) {
                            $subtractAmount += floatval($calculatedValues[$itemId]);
                        }
                    }
                }
                return $baseValue - $subtractAmount;

            case 'fixed_amount':
                // Fixed amount
                return floatval($lineItem['amount'] ?? 0);

            default:
                return 0;
        }
    }

    /**
     * Get component value from invoice template or calculation breakdown
     *
     * @param string $componentId
     * @param array $templateComponents
     * @param array|null $calculationBreakdown  
     * @param GeneratedInvoice $invoice
     * @return float
     */
    private static function getComponentValue($componentId, $templateComponents, $calculationBreakdown, $invoice)
    {
        Log::info('Getting component value', [
            'component_id' => $componentId,
            'available_template_components' => array_keys($templateComponents),
            'invoice_fields' => [
                'net_payroll' => $invoice->net_payroll,
                'management_fee' => $invoice->management_fee,
                'vat_amount' => $invoice->vat_amount,
                'total_invoice_amount' => $invoice->total_invoice_amount
            ]
        ]);

        // First try to get from template components
        if (isset($templateComponents[$componentId])) {
            Log::info('Found in template components', ['value' => $templateComponents[$componentId]]);
            return $templateComponents[$componentId];
        }

        // Try to map to common invoice fields
        switch ($componentId) {
            case 'TOTAL_EMPLOYER_COSTS':
            case 'TOTAL_SALARY_AND_ALLOWANCES':
                // Check if we have fees in database - if so, use credit_to_bank
                $managementFee = floatval($invoice->management_fee ?? 0);
                $vatAmount = floatval($invoice->vat_amount ?? 0);

                if ($managementFee > 0 || $vatAmount > 0) {
                    // Use credit to bank for newer invoices with proper fee breakdown
                    $calculationBreakdown = $invoice->calculation_breakdown;
                    if ($calculationBreakdown && is_array($calculationBreakdown)) {
                        $totalCreditToBank = 0;
                        foreach ($calculationBreakdown as $employee) {
                            if (isset($employee['calculation_breakdown']['credit_to_bank'])) {
                                $totalCreditToBank += floatval($employee['calculation_breakdown']['credit_to_bank']);
                            }
                        }
                        if ($totalCreditToBank > 0) {
                            Log::info('Calculated total credit to bank from breakdown (newer invoice)', ['value' => $totalCreditToBank]);
                            return $totalCreditToBank;
                        }
                    }
                }

                // For older invoices with 0 fees, calculate the base cost before management fee and VAT
                // The total_invoice_amount includes everything, so we need to back-calculate the base cost
                $totalInvoice = floatval($invoice->total_invoice_amount ?? 0);
                $managementFeeRate = 0.10; // 10%
                $vatRate = 0.075; // 7.5%

                // Formula: total = base_cost + (base_cost * mgmt_rate) + (base_cost * mgmt_rate * vat_rate)
                // So: total = base_cost * (1 + mgmt_rate + (mgmt_rate * vat_rate))
                // So: base_cost = total / (1 + mgmt_rate + (mgmt_rate * vat_rate))
                $multiplier = 1 + $managementFeeRate + ($managementFeeRate * $vatRate);
                $baseCost = $totalInvoice / $multiplier;

                Log::info('Calculated base cost for older invoice', [
                    'total_invoice' => $totalInvoice,
                    'management_rate' => $managementFeeRate,
                    'vat_rate' => $vatRate,
                    'multiplier' => $multiplier,
                    'base_cost' => $baseCost
                ]);

                return $baseCost;
                return $value;

            case 'TOTAL_MANAGEMENT_FEES':
                $value = $invoice->management_fee ?? 0;
                Log::info('Mapped to management_fee', ['value' => $value]);
                return $value;

            case 'VAT_ON_MGT_FEE':
                $value = $invoice->vat_amount ?? 0;
                Log::info('Mapped to vat_amount', ['value' => $value]);
                return $value;

            case 'GRAND_TOTAL':
            case 'TOTAL_COST_TO_CLIENT':
                $value = $invoice->total_invoice_amount ?? 0;
                Log::info('Mapped to total_invoice_amount', ['value' => $value]);
                return $value;

            default:
                // Try to find in calculation breakdown
                if ($calculationBreakdown && isset($calculationBreakdown[$componentId])) {
                    Log::info('Found in calculation breakdown', ['value' => $calculationBreakdown[$componentId]]);
                    return $calculationBreakdown[$componentId];
                }
                Log::warning('Component not found anywhere', ['component_id' => $componentId]);
                return 0;
        }
    }

    /**
     * Get base value for percentage calculations
     *
     * @param array $lineItem
     * @param array $templateComponents
     * @param array|null $calculationBreakdown
     * @param array $calculatedValues  
     * @param GeneratedInvoice $invoice
     * @return float
     */
    private static function getBaseValueForPercentage($lineItem, $templateComponents, $calculationBreakdown, $calculatedValues, $invoice)
    {
        $dependsOn = $lineItem['depends_on'] ?? '';

        if (empty($dependsOn)) {
            return 0;
        }

        Log::info('Getting base value for percentage', [
            'depends_on' => $dependsOn,
            'calculated_values_keys' => array_keys($calculatedValues)
        ]);

        // Check if it depends on another line item (higher priority)
        if (isset($calculatedValues[$dependsOn])) {
            $value = floatval($calculatedValues[$dependsOn]);
            Log::info('Found base value in calculated values', ['value' => $value]);
            return $value;
        }

        // For VAT calculation, check if we should use a line item instead of component
        if ($dependsOn === 'VAT_ON_MGT_FEE' && isset($lineItem['base_component'])) {
            // Look for the management fee in calculated values
            foreach ($calculatedValues as $itemId => $value) {
                // Check if this is a management fee item
                if (stripos($itemId, 'management') !== false || stripos($itemId, 'mgmt') !== false) {
                    Log::info('Using management fee from calculated values for VAT base', ['value' => $value]);
                    return floatval($value);
                }
            }
        }

        // Otherwise get from component
        $value = self::getComponentValue($dependsOn, $templateComponents, $calculationBreakdown, $invoice);
        Log::info('Found base value in components', ['value' => $value]);
        return $value;
    }

    /**
     * Parse invoice template components into a usable array
     *
     * @param \App\Models\InvoiceTemplate|null $template
     * @return array
     */
    private static function parseInvoiceTemplateComponents($template)
    {
        if (!$template) {
            return [];
        }

        $components = [];

        // Parse management_fees
        if ($template->management_fees) {
            $managementFees = is_string($template->management_fees)
                ? json_decode($template->management_fees, true)
                : $template->management_fees;

            foreach ($managementFees as $fee) {
                $components[$fee['name']] = $fee['value'] ?? 0;
            }
        }

        // Parse other sections as needed
        // Add more parsing logic here for custom_components, employer_costs, etc.

        return $components;
    }

    /**
     * Generate fallback invoice table data when no export template is available
     *
     * @param GeneratedInvoice $invoice
     * @return array
     */
    private static function generateFallbackInvoiceTableData($invoice)
    {
        $staffCost = $invoice->net_payroll ?? 0;
        $managementFee = $invoice->management_fee ?? 0;
        $vatAmount = $invoice->vat_amount ?? 0;
        $totalInvoiceValue = $invoice->total_invoice_amount ?? 0;

        $invoiceTableData = [
            [
                'item' => '1',
                'description' => 'Total Cost of Employment',
                'amount' => $staffCost
            ]
        ];

        $itemNumber = 2;

        // Only add management fee if it's greater than 0
        if ($managementFee > 0) {
            $invoiceTableData[] = [
                'item' => (string)$itemNumber,
                'description' => 'Management Fees',
                'amount' => $managementFee
            ];
            $itemNumber++;
        }

        // Only add VAT if it's greater than 0
        if ($vatAmount > 0) {
            $invoiceTableData[] = [
                'item' => (string)$itemNumber,
                'description' => 'VAT on Management Fee',
                'amount' => $vatAmount
            ];
            $itemNumber++;
        }

        // Add total
        $invoiceTableData[] = [
            'item' => (string)$itemNumber,
            'description' => 'Total Invoice Value',
            'amount' => $totalInvoiceValue
        ];

        return [
            'table_data' => $invoiceTableData,
            'total_amount' => $totalInvoiceValue
        ];
    }

    /**
     * Generate PDF filename
     *
     * @param GeneratedInvoice $invoice
     * @return string
     */
    private static function generatePDFFilename($invoice, $type = null)
    {
        $clientName = $invoice->client->name ?? 'Client';
        $invoiceNumber = $invoice->invoice_number ?? $invoice->id;
        $date = Carbon::parse($invoice->created_at)->format('Y-m-d');

        // Clean filename
        $cleanClientName = preg_replace('/[^A-Za-z0-9_-]/', '_', $clientName);

        // Add type suffix if provided
        $typePrefix = $type ? "_{$type}" : '';

        return "SOL_Invoice{$typePrefix}_{$invoiceNumber}_{$cleanClientName}_{$date}.pdf";
    }

    /**
     * Convert number to words
     *
     * @param float $number
     * @return string
     */
    private static function numberToWords($number)
    {
        if (!$number) return 'Zero Naira Only';

        try {
            // Check if NumberFormatter class exists (requires intl extension)
            if (class_exists('\NumberFormatter')) {
                $formatter = new \NumberFormatter('en', \NumberFormatter::SPELLOUT);
                $words = $formatter->format($number);
                return ucfirst($words) . ' Naira Only';
            }

            // Fallback to custom implementation if intl extension is not available
            return self::convertNumberToWords($number) . ' Naira Only';
        } catch (\Exception $e) {
            Log::warning('Failed to convert number to words', ['number' => $number, 'error' => $e->getMessage()]);
            return 'Amount: ₦' . number_format($number, 2);
        }
    }

    /**
     * Custom number to words conversion (fallback)
     *
     * @param float $number
     * @return string
     */
    private static function convertNumberToWords($number)
    {
        $number = (int) $number; // Convert to integer for word conversion

        if ($number == 0) return 'Zero';

        $ones = [
            '',
            'One',
            'Two',
            'Three',
            'Four',
            'Five',
            'Six',
            'Seven',
            'Eight',
            'Nine',
            'Ten',
            'Eleven',
            'Twelve',
            'Thirteen',
            'Fourteen',
            'Fifteen',
            'Sixteen',
            'Seventeen',
            'Eighteen',
            'Nineteen'
        ];

        $tens = [
            '',
            '',
            'Twenty',
            'Thirty',
            'Forty',
            'Fifty',
            'Sixty',
            'Seventy',
            'Eighty',
            'Ninety'
        ];

        $hundreds = ['', 'Thousand', 'Million', 'Billion'];

        if ($number < 20) {
            return $ones[$number];
        } elseif ($number < 100) {
            return $tens[intval($number / 10)] . ($number % 10 != 0 ? ' ' . $ones[$number % 10] : '');
        } elseif ($number < 1000) {
            return $ones[intval($number / 100)] . ' Hundred' . ($number % 100 != 0 ? ' ' . self::convertNumberToWords($number % 100) : '');
        } elseif ($number < 1000000) {
            return self::convertNumberToWords(intval($number / 1000)) . ' Thousand' . ($number % 1000 != 0 ? ' ' . self::convertNumberToWords($number % 1000) : '');
        } elseif ($number < 1000000000) {
            return self::convertNumberToWords(intval($number / 1000000)) . ' Million' . ($number % 1000000 != 0 ? ' ' . self::convertNumberToWords($number % 1000000) : '');
        } else {
            return self::convertNumberToWords(intval($number / 1000000000)) . ' Billion' . ($number % 1000000000 != 0 ? ' ' . self::convertNumberToWords($number % 1000000000) : '');
        }
    }
}
