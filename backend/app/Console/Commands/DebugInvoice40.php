<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\GeneratedInvoice;
use App\Services\FIRSQRCodeService;

class DebugInvoice40 extends Command
{
    protected $signature = 'debug:invoice40';
    protected $description = 'Debug invoice 40 FIRS data and QR generation';

    public function handle()
    {
        $invoiceId = 40;

        $this->info("=== DEBUGGING INVOICE {$invoiceId} ===");

        $invoice = GeneratedInvoice::with(['client'])->find($invoiceId);

        if (!$invoice) {
            $this->error("Invoice {$invoiceId} not found!");
            return 1;
        }

        $this->info("Invoice ID: {$invoice->id}");
        $this->info("Invoice Number: {$invoice->invoice_number}");
        $this->info("Client: {$invoice->client->name}");

        $this->info("\n=== FIRS DATA (Direct on Invoice Model) ===");
        $this->info("FIRS Submitted: " . ($invoice->firs_submitted ? 'YES' : 'NO'));
        $this->info("FIRS Approved: " . ($invoice->firs_approved ? 'YES' : 'NO'));
        $this->info("FIRS Status: " . ($invoice->firs_status ?? 'NULL'));
        $this->info("FIRS IRN: " . ($invoice->firs_irn ?? 'NULL'));
        $this->info("FIRS Invoice Number: " . ($invoice->firs_invoice_number ?? 'NULL'));
        $this->info("FIRS Reference: " . ($invoice->firs_reference ?? 'NULL'));
        $this->info("FIRS QR Data: " . ($invoice->firs_qr_data ? 'YES (' . strlen($invoice->firs_qr_data) . ' bytes)' : 'NULL/EMPTY'));

        // Check the controller condition
        $controllerCondition = $invoice->firs_approved && $invoice->firs_qr_data;
        $this->info("Controller Condition (firs_approved && firs_qr_data): " . ($controllerCondition ? 'TRUE' : 'FALSE'));
        if (!$controllerCondition) {
            $this->error("❌ This will cause the controller to use exportInvoiceToPDF instead of exportInvoiceToPDFWithFIRS!");
            $this->error("❌ The standard export method does NOT have QR generation code!");
        } else {
            $this->info("✅ Controller will use exportInvoiceToPDFWithFIRS with QR generation!");
        }

        // Simulate InvoicePDFExportService logic
        $firsData = [
            'firs_irn' => $invoice->firs_irn,
            'irn' => $invoice->firs_irn, // Some places might expect 'irn' key
            'firs_status' => $invoice->firs_status,
            'firs_submitted' => $invoice->firs_submitted,
            'firs_approved' => $invoice->firs_approved,
        ];
        $irn = $firsData['irn'] ?? $firsData['firs_irn'] ?? null;

        $this->info("\n=== PDF EXPORT SIMULATION ===");
        $this->info("FIRS Data Keys: " . implode(', ', array_keys($firsData)));
        $this->info("Extracted IRN: " . ($irn ?: 'NULL/EMPTY'));

        if (!empty($irn)) {
            $this->info("✅ IRN is available - QR generation should proceed");

            // Test QR generation
            try {
                $qrService = new FIRSQRCodeService();
                $qrData = $qrService->generateQRDataFromIRN($irn);

                if ($qrData) {
                    $this->info("✅ QR Data Generated: " . strlen($qrData) . " bytes");
                } else {
                    $this->error("❌ QR Generation Failed - returned null");
                }
            } catch (\Exception $e) {
                $this->error("❌ QR Generation Error: " . $e->getMessage());
            }
        } else {
            $this->error("❌ IRN is empty/null - QR generation will be skipped!");
            $this->error("This explains why no QR logs appear in export!");
        }



        $this->info("\n=== TESTING CONTROLLER FLOW ===");

        // Simulate prepareFIRSDataForPDF method
        $firsData = [
            'irn' => $invoice->firs_irn,
            'firs_invoice_number' => $invoice->firs_invoice_number,
            'firs_reference' => $invoice->firs_reference,
            'approval_date' => $invoice->firs_approved_at ?
                $invoice->firs_approved_at->format('Y-m-d H:i:s') : null,
            'submission_date' => $invoice->firs_submitted_at ?
                $invoice->firs_submitted_at->format('Y-m-d H:i:s') : null,
            'qr_code' => $invoice->firs_qr_data,
            'certificate' => $invoice->firs_certificate,
        ];

        $this->info("Prepared FIRS Data Keys: " . implode(', ', array_keys($firsData)));
        $this->info("IRN in prepared data: " . ($firsData['irn'] ?? 'NULL'));

        // Test the exact same logic as prepareInvoiceDataWithFIRS
        $testIrn = $firsData['irn'] ?? $firsData['firs_irn'] ?? null;
        $this->info("IRN extracted for QR: " . ($testIrn ?: 'NULL'));

        if (!empty($testIrn)) {
            $this->info("✅ QR generation should work with this data");
        } else {
            $this->error("❌ QR generation will be skipped - IRN is empty!");
        }

        return 0;
    }
}
