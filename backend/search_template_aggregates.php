<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\InvoiceTemplate;

echo "=== SEARCHING FOR AGGREGATE TOTALS IN FIDUCIA TEMPLATE ===\n\n";

$template = InvoiceTemplate::find(17);

if (!$template) {
    echo "❌ Template 17 not found\n";
    exit;
}

echo "🔍 SEARCHING CUSTOM COMPONENTS FOR AGGREGATE TOTALS:\n";
if ($template->custom_components) {
    foreach ($template->custom_components as $index => $component) {
        $name = strtoupper($component['name'] ?? '');
        $id = strtoupper($component['id'] ?? '');

        // Check for aggregate total keywords
        if (
            str_contains($name, 'TOTAL') || str_contains($name, 'COST') ||
            str_contains($name, 'OUTSOURCING') || str_contains($name, 'STAFF') ||
            str_contains($name, 'AGENCY') || str_contains($name, 'FEE') ||
            str_contains($name, 'VAT') || str_contains($name, 'EMPLOYMENT')
        ) {

            echo "   ✅ FOUND: " . ($component['name'] ?? 'Unnamed') . "\n";
            echo "      ID: " . ($component['id'] ?? 'N/A') . "\n";
            echo "      Type: " . ($component['type'] ?? 'Unknown') . "\n";
            echo "      Rate: " . ($component['rate'] ?? 'N/A') . "\n";
            if (isset($component['formula'])) {
                echo "      Formula: " . $component['formula'] . "\n";
            }
            echo "      ---\n";
        }
    }
}

echo "\n🔍 SEARCHING STATUTORY COMPONENTS FOR AGGREGATE TOTALS:\n";
if ($template->statutory_components) {
    foreach ($template->statutory_components as $key => $component) {
        $name = strtoupper($component['name'] ?? '');

        // Check for aggregate total keywords
        if (
            str_contains($name, 'TOTAL') || str_contains($name, 'COST') ||
            str_contains($name, 'OUTSOURCING') || str_contains($name, 'STAFF') ||
            str_contains($name, 'AGENCY') || str_contains($name, 'FEE') ||
            str_contains($name, 'VAT') || str_contains($name, 'EMPLOYMENT')
        ) {

            echo "   ✅ FOUND: " . ($component['name'] ?? 'Unnamed') . "\n";
            echo "      Key: " . $key . "\n";
            echo "      Type: " . ($component['type'] ?? 'Unknown') . "\n";
            echo "      Rate: " . ($component['rate'] ?? 'N/A') . "\n";
            if (isset($component['formula'])) {
                echo "      Formula: " . $component['formula'] . "\n";
            }
            echo "      ---\n";
        }
    }
}

echo "\n🔍 CHECKING FOR MISSING AGGREGATE COMPONENTS:\n";
$expectedAggregates = [
    'TOTAL_OUTSOURCING_STATUTORY_COST',
    'TOTAL_STAFF_COST',
    'AGENCY_FEE',
    'VAT_ON_AGENCY_FEE',
    'TOTAL_COST_OF_EMPLOYMENT'
];

$foundAggregates = [];

// Check custom components
if ($template->custom_components) {
    foreach ($template->custom_components as $component) {
        $name = strtoupper($component['name'] ?? '');
        $id = strtoupper($component['id'] ?? '');
        foreach ($expectedAggregates as $expected) {
            if (
                str_contains($name, str_replace('_', '', $expected)) ||
                str_contains($id, $expected)
            ) {
                $foundAggregates[] = $expected;
            }
        }
    }
}

// Check statutory components  
if ($template->statutory_components) {
    foreach ($template->statutory_components as $key => $component) {
        $name = strtoupper($component['name'] ?? '');
        $keyUpper = strtoupper($key);
        foreach ($expectedAggregates as $expected) {
            if (
                str_contains($name, str_replace('_', '', $expected)) ||
                str_contains($keyUpper, $expected)
            ) {
                $foundAggregates[] = $expected;
            }
        }
    }
}

echo "📊 EXPECTED vs FOUND:\n";
foreach ($expectedAggregates as $expected) {
    $status = in_array($expected, $foundAggregates) ? '✅ FOUND' : '❌ MISSING';
    echo "   " . str_replace('_', ' ', $expected) . ": " . $status . "\n";
}

if (count($foundAggregates) == 0) {
    echo "\n⚠️  NO AGGREGATE TOTALS FOUND IN TEMPLATE!\n";
    echo "   The template only has individual components but no aggregate calculations.\n";
    echo "   This means the aggregate totals need to be added to the template structure.\n";
}
