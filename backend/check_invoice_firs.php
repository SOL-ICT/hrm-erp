<?php

require '/var/www/vendor/autoload.php';

// Bootstrap Laravel
$app = require '/var/www/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "=== Checking Invoice 40 FIRS Data ===\n";

    $invoice = \App\Models\GeneratedInvoice::find(40);
    if (!$invoice) {
        echo "Invoice 40 not found\n";
        exit(1);
    }

    echo "Invoice Number: {$invoice->invoice_number}\n";
    echo "FIRS Submitted: " . ($invoice->firs_submitted ? 'YES' : 'NO') . "\n";
    echo "FIRS Approved: " . ($invoice->firs_approved ? 'YES' : 'NO') . "\n";
    echo "FIRS IRN: " . ($invoice->firs_irn ?? 'NONE') . "\n";
    echo "FIRS QR Data: " . ($invoice->firs_qr_data ? 'EXISTS (' . strlen($invoice->firs_qr_data) . ' chars)' : 'NONE') . "\n";
    echo "FIRS Status: " . ($invoice->firs_status ?? 'NONE') . "\n";

    if ($invoice->firs_qr_data) {
        echo "\nQR Data preview: " . substr($invoice->firs_qr_data, 0, 100) . "...\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
