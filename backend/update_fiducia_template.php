<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->boot();

use Illuminate\Support\Facades\DB;

echo "=== UPDATING FIDUCIA TEMPLATE IN DATABASE ===\n\n";

try {
    // Find FIDUCIA client
    $client = DB::table('clients')->where('organisation_name', 'FIDUCIA')->first();
    if (!$client) {
        echo "❌ FIDUCIA client not found!\n";
        exit;
    }

    echo "📋 Found FIDUCIA Client (ID: {$client->id})\n\n";

    // Define the correct template structure
    $customComponents = [
        [
            "id" => "basic_salary",
            "name" => "BASIC_SALARY",
            "rate" => 35909.29,
            "type" => "fixed",
            "amount" => 35909.29,
            "enabled" => true,
            "formula" => null,
            "components" => [],
            "description" => "Basic Salary",
            "calculation_type" => "fixed"
        ],
        [
            "id" => "housing",
            "name" => "HOUSING",
            "rate" => 17575.96,
            "type" => "fixed",
            "amount" => 17575.96,
            "enabled" => true,
            "formula" => null,
            "components" => [],
            "description" => "Housing Allowance",
            "calculation_type" => "fixed"
        ],
        [
            "id" => "transport_allowance",
            "name" => "TRANSPORT_ALLOWANCE",
            "rate" => 20909.29,
            "type" => "fixed",
            "amount" => 20909.29,
            "enabled" => true,
            "formula" => null,
            "components" => [],
            "description" => "Transport Allowance",
            "calculation_type" => "fixed"
        ],
        [
            "id" => "utility_allowance",
            "name" => "UTILITY_ALLOWANCE",
            "rate" => 40409.29,
            "type" => "fixed",
            "amount" => 40409.29,
            "enabled" => true,
            "formula" => null,
            "components" => [],
            "description" => "Utility Allowance",
            "calculation_type" => "fixed"
        ],
        [
            "id" => "annual_leave",
            "name" => "ANNUAL_LEAVE",
            "rate" => 2500.00,
            "type" => "fixed",
            "amount" => 2500.00,
            "enabled" => true,
            "formula" => null,
            "components" => [],
            "description" => "Annual Leave",
            "calculation_type" => "fixed"
        ],
        [
            "id" => "thirteenth_month",
            "name" => "13TH_MONTH",
            "rate" => 1666.67,
            "type" => "fixed",
            "amount" => 1666.67,
            "enabled" => true,
            "formula" => null,
            "components" => [],
            "description" => "13th Month",
            "calculation_type" => "fixed"
        ],
        [
            "id" => "gross_salary",
            "name" => "GROSS_SALARY",
            "rate" => 0,
            "type" => "formula",
            "amount" => 0,
            "enabled" => true,
            "formula" => "SUM(BASIC_SALARY,HOUSING,TRANSPORT_ALLOWANCE,UTILITY_ALLOWANCE,ANNUAL_LEAVE,13TH_MONTH)",
            "components" => [
                ["id" => "basic_salary", "name" => "BASIC_SALARY"],
                ["id" => "housing", "name" => "HOUSING"],
                ["id" => "transport_allowance", "name" => "TRANSPORT_ALLOWANCE"],
                ["id" => "utility_allowance", "name" => "UTILITY_ALLOWANCE"],
                ["id" => "annual_leave", "name" => "ANNUAL_LEAVE"],
                ["id" => "thirteenth_month", "name" => "13TH_MONTH"]
            ],
            "description" => "Gross Salary (Sum of all salary components)",
            "calculation_type" => "formula"
        ]
    ];

    // Define statutory/outsourcing components
    $statutoryComponents = [
        "itf" => [
            "name" => "ITF",
            "rate" => 1,
            "type" => "formula",
            "amount" => null,
            "enabled" => true,
            "formula" => "GROSS_SALARY * 0.01",
            "components" => [["id" => "gross_salary", "name" => "GROSS_SALARY"]],
            "description" => "Industrial Training Fund (1% of Gross)",
            "calculation_type" => "formula"
        ],
        "eca" => [
            "name" => "ECA",
            "rate" => 1,
            "type" => "formula",
            "amount" => null,
            "enabled" => true,
            "formula" => "GROSS_SALARY * 0.01",
            "components" => [["id" => "gross_salary", "name" => "GROSS_SALARY"]],
            "description" => "Employees Compensation Act (1% of Gross)",
            "calculation_type" => "formula"
        ],
        "fidelity_guarantee" => [
            "name" => "FIDELITY_GUARANTEE",
            "rate" => 2000,
            "type" => "fixed",
            "amount" => 2000,
            "enabled" => true,
            "formula" => null,
            "components" => [],
            "description" => "Fidelity Guarantee Insurance",
            "calculation_type" => "fixed",
            "fixed_amount" => 2000
        ],
        "background_check" => [
            "name" => "BACKGROUND_CHECK",
            "rate" => 5000,
            "type" => "fixed",
            "amount" => 5000,
            "enabled" => true,
            "formula" => null,
            "components" => [],
            "description" => "Background Check",
            "calculation_type" => "fixed",
            "fixed_amount" => 5000
        ],
        "group_life_insurance" => [
            "name" => "GROUP_LIFE_INSURANCE",
            "rate" => 1,
            "type" => "formula",
            "amount" => null,
            "enabled" => true,
            "formula" => "(BASIC_SALARY + HOUSING + TRANSPORT_ALLOWANCE) * 0.01 * 3",
            "components" => [
                ["id" => "basic_salary", "name" => "BASIC_SALARY"],
                ["id" => "housing", "name" => "HOUSING"],
                ["id" => "transport_allowance", "name" => "TRANSPORT_ALLOWANCE"]
            ],
            "description" => "Group Life Insurance (1% of BHT * 3)",
            "calculation_type" => "formula"
        ],
        "employer_pension_contribution" => [
            "name" => "EMPLOYER_PENSION_CONTRIBUTION",
            "rate" => 10,
            "type" => "formula",
            "amount" => null,
            "enabled" => true,
            "formula" => "(BASIC_SALARY + HOUSING + TRANSPORT_ALLOWANCE) * 0.10",
            "components" => [
                ["id" => "basic_salary", "name" => "BASIC_SALARY"],
                ["id" => "housing", "name" => "HOUSING"],
                ["id" => "transport_allowance", "name" => "TRANSPORT_ALLOWANCE"]
            ],
            "description" => "Employer Pension Contribution (10% of BHT)",
            "calculation_type" => "formula"
        ]
    ];

    // Update the template
    $updateData = [
        'custom_components' => json_encode($customComponents),
        'statutory_components' => json_encode($statutoryComponents),
        'service_fee_percentage' => 10.00, // Set to 10% as per Excel
        'template_name' => 'FIDUCIA Updated Template',
        'description' => 'Updated template matching Excel structure with proper component breakdown',
        'updated_at' => now()
    ];

    $updated = DB::table('invoice_templates')
        ->where('client_id', $client->id)
        ->update($updateData);

    if ($updated) {
        echo "✅ FIDUCIA template updated successfully!\n\n";

        // Verify the update
        $template = DB::table('invoice_templates')->where('client_id', $client->id)->first();

        echo "📊 UPDATED TEMPLATE VERIFICATION:\n";
        echo "   Service Fee Percentage: {$template->service_fee_percentage}%\n";
        echo "   Template Name: {$template->template_name}\n\n";

        // Calculate expected amounts with the new structure
        echo "🧮 EXPECTED CALCULATION RESULTS:\n";
        $grossSalary = 35909.29 + 17575.96 + 20909.29 + 40409.29 + 2500.00 + 1666.67; // 118,970.50

        // Calculate statutory components
        $itf = $grossSalary * 0.01;
        $eca = $grossSalary * 0.01;
        $fidelityGuarantee = 2000;
        $backgroundCheck = 5000;
        $basicHousingTransport = 35909.29 + 17575.96 + 20909.29; // 74,394.54
        $groupLife = $basicHousingTransport * 0.01 * 3;
        $employerPension = $basicHousingTransport * 0.10;

        $totalOutsourcing = $itf + $eca + $fidelityGuarantee + $backgroundCheck + $groupLife + $employerPension;
        $totalStaffCost = $grossSalary + $totalOutsourcing;
        $agencyFee = $totalStaffCost * 0.10;
        $vat = $agencyFee * 0.075;
        $totalEmploymentCost = $totalStaffCost + $agencyFee + $vat;

        echo sprintf("   Gross Salary: ₦%s\n", number_format($grossSalary, 2));
        echo sprintf("   Total Outsourcing: ₦%s\n", number_format($totalOutsourcing, 2));
        echo sprintf("   Total Staff Cost: ₦%s\n", number_format($totalStaffCost, 2));
        echo sprintf("   Agency Fee (10%%): ₦%s\n", number_format($agencyFee, 2));
        echo sprintf("   VAT (7.5%%): ₦%s\n", number_format($vat, 2));
        echo sprintf("   TOTAL EMPLOYMENT COST: ₦%s\n\n", number_format($totalEmploymentCost, 2));

        echo "🎯 COMPARISON:\n";
        echo sprintf("   Target Amount: ₦147,413.28\n");
        echo sprintf("   Calculated Amount: ₦%s\n", number_format($totalEmploymentCost, 2));
        echo sprintf("   Difference: ₦%s\n", number_format(abs(147413.28 - $totalEmploymentCost), 2));

        if (abs(147413.28 - $totalEmploymentCost) < 100) {
            echo "   ✅ CALCULATIONS MATCH TARGET!\n";
        } else {
            echo "   ⚠️  Small difference - may need minor adjustments\n";
        }
    } else {
        echo "❌ Failed to update template\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
