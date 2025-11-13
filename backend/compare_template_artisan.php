<?php

use Illuminate\Support\Facades\DB;

$template = DB::table('invoice_templates')
    ->where('id', 17)
    ->where('client_name', 'FIDUCIA')
    ->first();

if (!$template) {
    echo "❌ FIDUCIA template not found in database!\n";
    exit;
}

echo "=== FIDUCIA TEMPLATE COMPARISON: EXCEL vs DATABASE ===\n\n";

echo "📋 FIDUCIA Template Found:\n";
echo "   ID: " . $template->id . "\n";
echo "   Client: " . $template->client_name . "\n\n";

$templateData = json_decode($template->template_data, true);

echo "🏗️  DATABASE TEMPLATE STRUCTURE:\n";
echo json_encode($templateData, JSON_PRETTY_PRINT) . "\n\n";

echo "=== EXCEL FORMULA ANALYSIS ===\n";
echo "🔍 From Excel Analysis:\n";
echo "   G3 (Gross Salary): ₦118,970.51 (hard-coded value)\n";
echo "   H3 (Operational Reimbursable): ₦0.00 (=[1]Payroll!T2)\n";
echo "   I3 (Outsourcing & Statutory): ₦0.00 (=[1]Payroll!AG2)\n";
echo "   J3 (Total Staff Cost): ₦118,970.51 (=SUM(G3:I3))\n";
echo "   K3 (Agency Fee): ₦11,897.05 (=10%*J3)\n";
echo "   L3 (VAT on Agency): ₦892.28 (=7.5%*K3)\n";
echo "   M3 (Total Cost): ₦131,759.84 (=J3+K3+L3)\n\n";

echo "=== CALCULATION VERIFICATION ===\n";
$grossSalary = 118970.51;
$operationalReimbursable = 0.00;
$outsourcingStatutory = 0.00;

$totalStaffCost = $grossSalary + $operationalReimbursable + $outsourcingStatutory;
$agencyFee = $totalStaffCost * 0.10; // 10%
$vat = $agencyFee * 0.075; // 7.5%
$totalCost = $totalStaffCost + $agencyFee + $vat;

echo "🧮 Manual Calculation:\n";
echo sprintf(
    "   Total Staff Cost: ₦%s + ₦%s + ₦%s = ₦%s\n",
    number_format($grossSalary, 2),
    number_format($operationalReimbursable, 2),
    number_format($outsourcingStatutory, 2),
    number_format($totalStaffCost, 2)
);
echo sprintf(
    "   Agency Fee (10%%): ₦%s × 10%% = ₦%s\n",
    number_format($totalStaffCost, 2),
    number_format($agencyFee, 2)
);
echo sprintf(
    "   VAT (7.5%%): ₦%s × 7.5%% = ₦%s\n",
    number_format($agencyFee, 2),
    number_format($vat, 2)
);
echo sprintf(
    "   Total Cost: ₦%s + ₦%s + ₦%s = ₦%s\n",
    number_format($totalStaffCost, 2),
    number_format($agencyFee, 2),
    number_format($vat, 2),
    number_format($totalCost, 2)
);

echo "\n=== COMPARISON RESULT ===\n";
echo sprintf("   Excel Total: ₦%s\n", number_format(131759.84, 2));
echo sprintf("   Manual Calc: ₦%s\n", number_format($totalCost, 2));
echo sprintf("   Difference: ₦%s\n", number_format(abs(131759.84 - $totalCost), 2));

if (abs(131759.84 - $totalCost) < 0.01) {
    echo "   ✅ CALCULATIONS MATCH!\n";
} else {
    echo "   ❌ CALCULATIONS DON'T MATCH!\n";
}

echo "\n=== DATABASE TEMPLATE ANALYSIS ===\n";
if (isset($templateData['custom_components'])) {
    echo "📊 Custom Components in Database:\n";
    foreach ($templateData['custom_components'] as $component) {
        echo sprintf(
            "   - %s: %s%% (Type: %s)\n",
            $component['name'],
            $component['rate'],
            $component['type']
        );
    }
}

if (isset($templateData['statutory_components'])) {
    echo "\n📊 Statutory Components in Database:\n";
    foreach ($templateData['statutory_components'] as $component) {
        echo sprintf(
            "   - %s: %s%% (Type: %s)\n",
            $component['name'],
            $component['rate'],
            $component['type']
        );
    }
}

echo "\n=== DISCREPANCY ANALYSIS ===\n";
echo "🎯 Expected User Amount: ₦147,413.28\n";
echo "🎯 Excel Amount: ₦131,759.84\n";
echo "🎯 Difference: ₦" . number_format(147413.28 - 131759.84, 2) . "\n";

echo "\n🔍 Possible Issues:\n";
echo "1. Excel template references external 'Payroll' sheet for some values\n";
echo "2. H3 and I3 show ₦0.00 but reference =[1]Payroll!T2 and =[1]Payroll!AG2\n";
echo "3. Database template might have different component structure\n";
echo "4. User's expected amount might include additional components not in Excel\n";
echo "5. Missing outsourcing/statutory costs that should be ₦15,653.44\n";
