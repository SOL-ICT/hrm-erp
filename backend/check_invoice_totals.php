<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AttendanceUpload;
use App\Models\Invoice;

echo "=== CHECKING FIDUCIA INVOICE TOTALS ===\n\n";

// Find FIDUCIA upload and its invoice
$fiduciaUpload = AttendanceUpload::whereHas('client', function ($query) {
    $query->where('organisation_name', 'LIKE', '%FIDUCIA%');
})->with(['client', 'invoice'])->first();

if (!$fiduciaUpload) {
    echo "❌ No FIDUCIA upload found\n";
    exit;
}

$invoice = $fiduciaUpload->invoice;
if (!$invoice) {
    echo "❌ No invoice found for FIDUCIA upload\n";
    exit;
}

echo "🧾 INVOICE DETAILS:\n";
echo "   Invoice ID: " . $invoice->id . "\n";
echo "   Client: " . $fiduciaUpload->client->organisation_name . "\n";
echo "   Invoice Number: " . ($invoice->invoice_number ?? 'Not Set') . "\n\n";

echo "💰 FINANCIAL TOTALS:\n";
echo "   Total Staff Cost: ₦" . number_format($invoice->total_staff_cost ?? 0, 2) . "\n";
echo "   Total Statutory Cost: ₦" . number_format($invoice->total_statutory_cost ?? 0, 2) . "\n";
echo "   Gross Salary Total: ₦" . number_format($invoice->gross_salary_total ?? 0, 2) . "\n";
echo "   Total Deductions: ₦" . number_format($invoice->total_deductions ?? 0, 2) . "\n";
echo "   Net Salary Total: ₦" . number_format($invoice->net_salary_total ?? 0, 2) . "\n\n";

echo "💼 SERVICE FEES & CHARGES:\n";
echo "   Management Fee: ₦" . number_format($invoice->management_fee ?? 0, 2) . "\n";
echo "   VAT Amount: ₦" . number_format($invoice->vat_amount ?? 0, 2) . "\n";
echo "   WHT Amount: ₦" . number_format($invoice->wht_amount ?? 0, 2) . "\n";
echo "   Service Fee: ₦" . number_format($invoice->service_fee ?? 0, 2) . "\n\n";

echo "🎯 FINAL TOTALS:\n";
echo "   Total Invoice Amount: ₦" . number_format($invoice->total_invoice_amount ?? 0, 2) . "\n";
echo "   Total Cost: ₦" . number_format($invoice->total_cost ?? 0, 2) . "\n\n";

echo "🔍 ALL INVOICE FIELDS:\n";
$invoiceArray = $invoice->toArray();
foreach ($invoiceArray as $field => $value) {
    if (str_contains($field, 'total') || str_contains($field, 'fee') || str_contains($field, 'cost') || str_contains($field, 'amount')) {
        echo "   " . $field . ": " . ($value ?? 'NULL') . "\n";
    }
}
