<?php

echo "Checking current state of upload 15...\n";

$existingInvoices = \App\Models\GeneratedInvoice::where('attendance_upload_id', 15)->get();
echo "Existing invoices count: " . $existingInvoices->count() . "\n";

foreach ($existingInvoices as $invoice) {
    echo "Invoice: {$invoice->invoice_number} (ID: {$invoice->id})\n";
}

echo "Current state check complete.\n";
