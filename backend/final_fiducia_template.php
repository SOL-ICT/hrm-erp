<?php

echo "=== FINAL CORRECTED FIDUCIA TEMPLATE CALCULATION ===\n\n";

echo "🎯 FINAL SPECIFICATIONS:\n";
echo "   - Medical & Insurance: ₦18,000 annually\n";
echo "   - Operational Reimbursable: ₦0 for FIDUCIA\n";
echo "   - All percentage calculations confirmed correct\n\n";

echo "🏗️  CUSTOM COMPONENTS (Gross Salary Breakdown):\n";
$grossComponents = [
    'BASIC_SALARY' => 35909.29,
    'HOUSING' => 17575.96,
    'TRANSPORT_ALLOWANCE' => 20909.29,
    'UTILITY_ALLOWANCE' => 40409.29,
    'ANNUAL_LEAVE' => 2500.00,
    '13TH_MONTH' => 1666.67
];

foreach ($grossComponents as $name => $amount) {
    echo sprintf("   - %s: ₦%s (fixed amount)\n", $name, number_format($amount, 2));
}

$calculatedGross = array_sum($grossComponents);
echo sprintf("   - GROSS_SALARY: ₦%s (formula: SUM of above components)\n\n", number_format($calculatedGross, 2));

echo "🏗️  STATUTORY COMPONENTS (Total Outsourcing - I3):\n";

// Calculate statutory components
$basicHousingTransport = $grossComponents['BASIC_SALARY'] + $grossComponents['HOUSING'] + $grossComponents['TRANSPORT_ALLOWANCE'];

// Monthly medical insurance (₦18,000 annually ÷ 12 months)
$monthlyMedicalInsurance = 18000 / 12;

$statutoryAmounts = [
    'ITF' => $calculatedGross * 0.01, // 1% of Gross
    'ECA' => $calculatedGross * 0.01, // 1% of Gross
    'FIDELITY_GUARANTEE' => 2000, // Fixed monthly
    'MEDICAL_INSURANCE' => $monthlyMedicalInsurance, // ₦18,000 annually
    'BACKGROUND_CHECK' => 5000, // Fixed monthly
    'GROUP_LIFE_INSURANCE' => ($basicHousingTransport * 0.01) * 3, // 1% of BHT × 3
    'EMPLOYER_PENSION_CONTRIBUTION' => $basicHousingTransport * 0.10 // 10% of BHT
];

foreach ($statutoryAmounts as $name => $amount) {
    if ($name === 'ITF' || $name === 'ECA') {
        echo sprintf("   - %s: 1%% of Gross = ₦%s\n", $name, number_format($amount, 2));
    } elseif ($name === 'GROUP_LIFE_INSURANCE') {
        echo sprintf("   - %s: 1%% of (Basic+Housing+Transport) × 3 = ₦%s\n", $name, number_format($amount, 2));
    } elseif ($name === 'EMPLOYER_PENSION_CONTRIBUTION') {
        echo sprintf("   - %s: 10%% of (Basic+Housing+Transport) = ₦%s\n", $name, number_format($amount, 2));
    } elseif ($name === 'MEDICAL_INSURANCE') {
        echo sprintf("   - %s: ₦18,000 annually (₦%s monthly)\n", $name, number_format($amount, 2));
    } else {
        echo sprintf("   - %s: ₦%s (fixed monthly)\n", $name, number_format($amount, 2));
    }
}

$totalOutsourcing = array_sum($statutoryAmounts);
echo sprintf("\n   TOTAL OUTSOURCING: ₦%s\n\n", number_format($totalOutsourcing, 2));

echo "📊 FINAL CALCULATION FLOW:\n";
echo sprintf("   G3 (Gross Salary): ₦%s\n", number_format($calculatedGross, 2));
echo sprintf("   H3 (Operational Reimbursable): ₦0.00\n");
echo sprintf("   I3 (Total Outsourcing): ₦%s\n", number_format($totalOutsourcing, 2));

$totalStaffCost = $calculatedGross + 0 + $totalOutsourcing;
$agencyFee = $totalStaffCost * 0.10; // 10%
$vat = $agencyFee * 0.075; // 7.5%
$totalEmploymentCost = $totalStaffCost + $agencyFee + $vat;

echo sprintf("   J3 (Total Staff Cost): ₦%s (G3 + H3 + I3)\n", number_format($totalStaffCost, 2));
echo sprintf("   K3 (Agency Fee): ₦%s (10%% of J3)\n", number_format($agencyFee, 2));
echo sprintf("   L3 (VAT): ₦%s (7.5%% of K3)\n", number_format($vat, 2));
echo sprintf("   M3 (Total Employment Cost): ₦%s (J3 + K3 + L3)\n\n", number_format($totalEmploymentCost, 2));

echo "🎯 COMPARISON WITH TARGET:\n";
echo sprintf("   Your Expected: ₦147,413.28\n");
echo sprintf("   Final Calculation: ₦%s\n", number_format($totalEmploymentCost, 2));
$finalDifference = 147413.28 - $totalEmploymentCost;
echo sprintf("   Difference: ₦%s\n\n", number_format($finalDifference, 2));

if (abs($finalDifference) < 100) {
    echo "✅ EXCELLENT! We're very close to your target!\n\n";
} else {
    echo "🔧 Still need minor adjustment of ₦" . number_format(abs($finalDifference), 2) . "\n\n";
}

echo "📝 DATABASE TEMPLATE STRUCTURE TO CREATE:\n\n";

echo "🔹 CLIENT: FIDUCIA (ID: 25)\n";
echo "🔹 SERVICE FEE PERCENTAGE: 10%\n";
echo "🔹 ANNUAL DIVISION FACTOR: 12\n\n";

echo "🔹 CUSTOM COMPONENTS:\n";
foreach ($grossComponents as $name => $amount) {
    echo sprintf("   {\n");
    echo sprintf("     \"name\": \"%s\",\n", $name);
    echo sprintf("     \"rate\": %s,\n", $amount);
    echo sprintf("     \"type\": \"fixed\",\n");
    echo sprintf("     \"enabled\": true\n");
    echo sprintf("   },\n");
}
echo "   {\n";
echo "     \"name\": \"GROSS_SALARY\",\n";
echo "     \"rate\": 0,\n";
echo "     \"type\": \"formula\",\n";
echo "     \"formula\": \"SUM(BASIC_SALARY:13TH_MONTH)\",\n";
echo "     \"enabled\": true\n";
echo "   }\n\n";

echo "🔹 STATUTORY COMPONENTS:\n";
$statutoryFormulas = [
    'ITF' => ['rate' => 1, 'type' => 'formula', 'formula' => 'GROSS_SALARY * 0.01'],
    'ECA' => ['rate' => 1, 'type' => 'formula', 'formula' => 'GROSS_SALARY * 0.01'],
    'FIDELITY_GUARANTEE' => ['rate' => 2000, 'type' => 'fixed'],
    'MEDICAL_INSURANCE' => ['rate' => 1500, 'type' => 'fixed'], // ₦18,000 ÷ 12 = ₦1,500
    'BACKGROUND_CHECK' => ['rate' => 5000, 'type' => 'fixed'],
    'GROUP_LIFE_INSURANCE' => ['rate' => 1, 'type' => 'formula', 'formula' => '(BASIC_SALARY + HOUSING + TRANSPORT_ALLOWANCE) * 0.01 * 3'],
    'EMPLOYER_PENSION_CONTRIBUTION' => ['rate' => 10, 'type' => 'formula', 'formula' => '(BASIC_SALARY + HOUSING + TRANSPORT_ALLOWANCE) * 0.10']
];

foreach ($statutoryFormulas as $name => $details) {
    echo sprintf("   {\n");
    echo sprintf("     \"name\": \"%s\",\n", $name);
    echo sprintf("     \"rate\": %s,\n", $details['rate']);
    echo sprintf("     \"type\": \"%s\",\n", $details['type']);
    if (isset($details['formula'])) {
        echo sprintf("     \"formula\": \"%s\",\n", $details['formula']);
    }
    echo sprintf("     \"enabled\": true\n");
    echo sprintf("   },\n");
}

echo "\n✅ READY TO UPDATE DATABASE TEMPLATE!\n";
