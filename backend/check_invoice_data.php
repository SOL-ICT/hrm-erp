<?php

require_once '/var/www/bootstrap/app.php';

use App\Models\GeneratedInvoice;

// Get the invoice
$invoice = GeneratedInvoice::find(28);

if (!$invoice) {
    echo "Invoice not found\n";
    exit(1);
}

echo "=== INVOICE 28 DATA ===\n\n";

echo "Export Line Items:\n";
echo json_encode($invoice->export_line_items, JSON_PRETTY_PRINT);
echo "\n\n";

echo "Calculation Breakdown:\n";
if (is_array($invoice->calculation_breakdown) && !empty($invoice->calculation_breakdown)) {
    // Show first employee's breakdown as example
    $firstEmployee = reset($invoice->calculation_breakdown);
    echo "First Employee Sample:\n";
    echo json_encode($firstEmployee, JSON_PRETTY_PRINT);
} else {
    echo json_encode($invoice->calculation_breakdown, JSON_PRETTY_PRINT);
}
echo "\n\n";

echo "Database Fields:\n";
echo "- gross_payroll: " . $invoice->gross_payroll . "\n";
echo "- net_payroll: " . $invoice->net_payroll . "\n";
echo "- management_fee: " . $invoice->management_fee . "\n";
echo "- vat_amount: " . $invoice->vat_amount . "\n";
echo "- total_invoice_amount: " . $invoice->total_invoice_amount . "\n";

echo "\n=== END ===\n";
