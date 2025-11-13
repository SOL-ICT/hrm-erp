<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\InvoiceTemplate;

echo "=== FIDUCIA TEMPLATE 17 - COMPLETE DETAILS ===\n\n";

$template = InvoiceTemplate::find(17);

if (!$template) {
    echo "❌ Template 17 not found\n";
    exit;
}

echo "📋 BASIC INFO:\n";
echo "   ID: " . $template->id . "\n";
echo "   Name: " . $template->template_name . "\n";
echo "   Client ID: " . $template->client_id . "\n";
echo "   Pay Grade Structure ID: " . $template->pay_grade_structure_id . "\n";
echo "   Description: " . ($template->description ?? 'None') . "\n";
echo "   Version: " . $template->template_version . "\n";
echo "   Is Active: " . ($template->is_active ? 'YES' : 'NO') . "\n";
echo "   Is Default: " . ($template->is_default ? 'YES' : 'NO') . "\n";

echo "\n💰 FINANCIAL SETTINGS:\n";
echo "   Service Fee Percentage: " . $template->service_fee_percentage . "%\n";
echo "   Annual Division Factor: " . $template->annual_division_factor . "\n";
echo "   Use Credit to Bank Model: " . ($template->use_credit_to_bank_model ? 'YES' : 'NO') . "\n";
echo "   Prorate Salary: " . ($template->prorate_salary ? 'YES' : 'NO') . "\n";
echo "   Minimum Attendance Factor: " . $template->minimum_attendance_factor . "\n";
echo "   Attendance Calculation Method: " . $template->attendance_calculation_method . "\n";

echo "\n💵 CUSTOM COMPONENTS (Salary Items):\n";
if ($template->custom_components) {
    $customComponents = is_array($template->custom_components) ? $template->custom_components : json_decode($template->custom_components, true);
    if (is_array($customComponents)) {
        foreach ($customComponents as $index => $component) {
            echo "   " . ($index + 1) . ". " . ($component['component_name'] ?? 'Unnamed') . "\n";
            echo "      Type: " . ($component['component_type'] ?? 'Unknown') . "\n";
            echo "      Amount: " . ($component['amount'] ?? 'Variable') . "\n";
            echo "      Calculation Method: " . ($component['calculation_method'] ?? 'N/A') . "\n";
            echo "      Is Taxable: " . (isset($component['is_taxable']) ? ($component['is_taxable'] ? 'YES' : 'NO') : 'Unknown') . "\n";
            echo "      ---\n";
        }
    } else {
        echo "   ❌ Custom components data is not valid JSON array\n";
        echo "   Raw data: " . $template->custom_components . "\n";
    }
} else {
    echo "   No custom components defined\n";
}

echo "\n⚖️ STATUTORY COMPONENTS (Deductions):\n";
if ($template->statutory_components) {
    $statutoryComponents = is_array($template->statutory_components) ? $template->statutory_components : json_decode($template->statutory_components, true);
    if (is_array($statutoryComponents)) {
        foreach ($statutoryComponents as $index => $component) {
            echo "   " . ($index + 1) . ". " . ($component['component_name'] ?? 'Unnamed') . "\n";
            echo "      Type: " . ($component['component_type'] ?? 'Unknown') . "\n";
            echo "      Amount: " . ($component['amount'] ?? 'Variable') . "\n";
            echo "      Calculation Method: " . ($component['calculation_method'] ?? 'N/A') . "\n";
            echo "      Is Mandatory: " . (isset($component['is_mandatory']) ? ($component['is_mandatory'] ? 'YES' : 'NO') : 'Unknown') . "\n";
            echo "      ---\n";
        }
    } else {
        echo "   ❌ Statutory components data is not valid JSON array\n";
        echo "   Raw data: " . $template->statutory_components . "\n";
    }
} else {
    echo "   No statutory components defined\n";
}

echo "\n🧮 CALCULATION RULES:\n";
if ($template->calculation_rules) {
    $calculationRules = is_array($template->calculation_rules) ? $template->calculation_rules : json_decode($template->calculation_rules, true);
    if (is_array($calculationRules)) {
        foreach ($calculationRules as $key => $rule) {
            echo "   " . $key . ": " . (is_array($rule) ? json_encode($rule) : $rule) . "\n";
        }
    } else {
        echo "   ❌ Calculation rules data is not valid JSON\n";
        echo "   Raw data: " . $template->calculation_rules . "\n";
    }
} else {
    echo "   No specific calculation rules defined\n";
}

echo "\n📅 TIMESTAMPS:\n";
echo "   Created: " . $template->created_at . "\n";
echo "   Updated: " . $template->updated_at . "\n";
echo "   Last Used: " . ($template->last_used_at ?? 'Never') . "\n";
echo "   Created By: " . ($template->created_by ?? 'Unknown') . "\n";
echo "   Updated By: " . ($template->updated_by ?? 'Unknown') . "\n";
