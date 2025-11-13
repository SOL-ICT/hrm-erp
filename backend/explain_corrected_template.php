<?php

echo "=== CORRECTED FIDUCIA TEMPLATE STRUCTURE UNDERSTANDING ===\n\n";

echo "🎯 YOUR CLARIFICATIONS:\n";
echo "   1. We can ignore G3 (the hardcoded ₦118,970.51)\n";
echo "   2. I3 (Total Outsourcing) = ITF + Fidelity Guarantee + Medical & Insurance + Background Check + Group Life Insurance + Employer's Contribution + ECA\n\n";

echo "📊 MY UNDERSTANDING OF THE CORRECTED TEMPLATE:\n\n";

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

echo "🏗️  STATUTORY COMPONENTS (Total Outsourcing - Column I3):\n";

// Calculate statutory components based on your requirements
$basicHousingTransport = $grossComponents['BASIC_SALARY'] + $grossComponents['HOUSING'] + $grossComponents['TRANSPORT_ALLOWANCE'];

$statutoryComponents = [
    'ITF' => ['rate' => 1, 'type' => 'percentage', 'base' => 'GROSS_SALARY', 'description' => '1% of Gross Salary'],
    'ECA' => ['rate' => 1, 'type' => 'percentage', 'base' => 'GROSS_SALARY', 'description' => '1% of Gross Salary'],
    'FIDELITY_GUARANTEE' => ['rate' => 2000, 'type' => 'fixed', 'base' => '', 'description' => 'Fixed amount'],
    'MEDICAL_INSURANCE' => ['rate' => 0, 'type' => 'fixed', 'base' => '', 'description' => 'Fixed amount (TBD)'],
    'BACKGROUND_CHECK' => ['rate' => 5000, 'type' => 'fixed', 'base' => '', 'description' => 'Fixed amount'],
    'GROUP_LIFE_INSURANCE' => ['rate' => 1, 'type' => 'percentage', 'base' => 'BASIC+HOUSING+TRANSPORT', 'description' => '1% of (Basic+Housing+Transport) × 3'],
    'EMPLOYER_PENSION_CONTRIBUTION' => ['rate' => 10, 'type' => 'percentage', 'base' => 'BASIC+HOUSING+TRANSPORT', 'description' => '10% of (Basic+Housing+Transport)']
];

foreach ($statutoryComponents as $name => $details) {
    if ($details['type'] == 'percentage') {
        if ($details['base'] == 'GROSS_SALARY') {
            $calculated = $calculatedGross * ($details['rate'] / 100);
        } elseif ($details['base'] == 'BASIC+HOUSING+TRANSPORT') {
            $calculated = $basicHousingTransport * ($details['rate'] / 100);
            if ($name == 'GROUP_LIFE_INSURANCE') {
                $calculated *= 3; // Special case: multiply by 3
            }
        }
        echo sprintf("   - %s: %s%% (%s) = ₦%s\n", $name, $details['rate'], $details['description'], number_format($calculated, 2));
    } else {
        echo sprintf("   - %s: ₦%s (%s)\n", $name, number_format($details['rate'], 2), $details['description']);
    }
}

echo "\n📋 CALCULATION FLOW:\n\n";

// Calculate total outsourcing
$totalOutsourcing = 0;
$totalOutsourcing += $calculatedGross * 0.01; // ITF
$totalOutsourcing += $calculatedGross * 0.01; // ECA
$totalOutsourcing += 2000; // Fidelity Guarantee
$totalOutsourcing += 0; // Medical Insurance (TBD)
$totalOutsourcing += 5000; // Background Check
$totalOutsourcing += ($basicHousingTransport * 0.01) * 3; // Group Life Insurance
$totalOutsourcing += $basicHousingTransport * 0.10; // Employer Pension Contribution

echo sprintf("   G3 (Gross Salary): ₦%s (SUM of salary components)\n", number_format($calculatedGross, 2));
echo sprintf("   H3 (Operational Reimbursable): ₦0.00 (as per Excel)\n");
echo sprintf("   I3 (Total Outsourcing): ₦%s (SUM of statutory components)\n", number_format($totalOutsourcing, 2));

$totalStaffCost = $calculatedGross + 0 + $totalOutsourcing;
$agencyFee = $totalStaffCost * 0.10;
$vat = $agencyFee * 0.075;
$totalEmploymentCost = $totalStaffCost + $agencyFee + $vat;

echo sprintf("   J3 (Total Staff Cost): ₦%s (G3 + H3 + I3)\n", number_format($totalStaffCost, 2));
echo sprintf("   K3 (Agency Fee): ₦%s (10%% of J3)\n", number_format($agencyFee, 2));
echo sprintf("   L3 (VAT): ₦%s (7.5%% of K3)\n", number_format($vat, 2));
echo sprintf("   M3 (Total Cost): ₦%s (J3 + K3 + L3)\n\n", number_format($totalEmploymentCost, 2));

echo "🎯 COMPARISON WITH YOUR TARGET:\n";
echo sprintf("   Your Expected: ₦147,413.28\n");
echo sprintf("   Our Calculation: ₦%s\n", number_format($totalEmploymentCost, 2));
$difference = 147413.28 - $totalEmploymentCost;
echo sprintf("   Difference: ₦%s\n\n", number_format($difference, 2));

if (abs($difference) > 100) {
    echo "🔧 ADJUSTMENT NEEDED:\n";
    echo sprintf("   Medical Insurance should be: ₦%s to reach target\n\n", number_format($difference, 2));
}

echo "📝 DATABASE TEMPLATE STRUCTURE:\n\n";
echo "🔹 SERVICE FEE PERCENTAGE: 10%\n";
echo "🔹 CUSTOM COMPONENTS: Salary breakdown components\n";
echo "🔹 STATUTORY COMPONENTS: Outsourcing obligations\n";
echo "🔹 CALCULATION METHOD: Template-based with formulas\n\n";

echo "✅ DOES THIS MATCH YOUR UNDERSTANDING?\n";
echo "   1. Gross = Sum of 6 salary components\n";
echo "   2. Outsourcing = Sum of 7 statutory components\n";
echo "   3. Service Fee = 10% of Total Staff Cost\n";
echo "   4. VAT = 7.5% of Service Fee\n";
echo "   5. Medical Insurance amount adjusted to hit ₦147,413.28 target\n";
