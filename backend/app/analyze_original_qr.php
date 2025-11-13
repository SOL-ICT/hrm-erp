<?php

require_once __DIR__ . '/vendor/autoload.php';

// Load Laravel app
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneratedInvoice;

echo "=== Analyzing Original FIRS QR Data ===\n\n";

$invoice = GeneratedInvoice::where('firs_approved', true)->first();

if ($invoice) {
    echo "Invoice ID: {$invoice->id}\n";
    echo "Invoice Number: {$invoice->invoice_number}\n";
    echo "FIRS IRN: {$invoice->firs_irn}\n";
    echo "Original FIRS QR Data: " . ($invoice->firs_qr_data ?? 'NULL') . "\n";
    echo "Length: " . strlen($invoice->firs_qr_data ?? '') . "\n";
    
    if ($invoice->firs_qr_data) {
        $decoded = json_decode($invoice->firs_qr_data, true);
        echo "Is JSON: " . ($decoded ? 'YES' : 'NO') . "\n";
        
        if ($decoded) {
            echo "JSON Structure:\n";
            foreach ($decoded as $key => $value) {
                echo "  $key: $value\n";
            }
        } else {
            echo "Raw Content (first 200 chars): " . substr($invoice->firs_qr_data, 0, 200) . "\n";
        }
    }
} else {
    echo "No FIRS-approved invoices found.\n";
}