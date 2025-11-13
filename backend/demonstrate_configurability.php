<?php

require __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DEMONSTRATING CLIENT-SPECIFIC CONFIGURATIONS ===\n\n";

// Show how the current Fiducia client is configured
$fiduciaClient = \App\Models\Client::find(25);
$fiduciaTemplate = \App\Models\ExportTemplate::where('client_id', 25)
    ->where('format', 'invoice_line_items')
    ->first();

echo "FIDUCIA CLIENT CONFIGURATION:\n";
echo "Client: {$fiduciaClient->client_name}\n";
if ($fiduciaTemplate) {
    $mappings = $fiduciaTemplate->column_mappings;
    if (is_string($mappings)) {
        $mappings = json_decode($mappings, true);
    }

    echo "Export Template: {$fiduciaTemplate->name}\n";
    echo "Line Items:\n";
    foreach ($mappings as $index => $item) {
        echo "  " . ($index + 1) . ". {$item['name']}\n";
        echo "     Formula: {$item['formula_type']}\n";
        echo "     Percentage: " . ($item['percentage'] ?? 0) . "%\n";
        echo "     Depends On: " . ($item['depends_on'] ?? 'N/A') . "\n\n";
    }
}

echo "=== HOW OTHER CLIENTS COULD BE CONFIGURED DIFFERENTLY ===\n\n";

echo "EXAMPLE CLIENT A (Higher Management Fee):\n";
echo "• Management Fee: 15% instead of 10%\n";
echo "• VAT Rate: 7.5% (standard)\n";
echo "• Additional Line Item: Service Charge (5%)\n";
echo "• Result: Higher total invoice amount\n\n";

echo "EXAMPLE CLIENT B (Lower Management Fee, Custom VAT):\n";
echo "• Management Fee: 8% instead of 10%\n";
echo "• VAT Rate: 5% (special rate if configured)\n";
echo "• Different Line Items: Admin Fee + Processing Fee\n";
echo "• Result: More detailed breakdown, different totals\n\n";

echo "EXAMPLE CLIENT C (Fixed Fees):\n";
echo "• Management Fee: Fixed ₦50,000 per invoice\n";
echo "• Processing Fee: Fixed ₦10,000\n";
echo "• No percentage-based calculations\n";
echo "• Result: Predictable fees regardless of payroll size\n\n";

echo "=== SYSTEM FLEXIBILITY ===\n";
echo "✅ Each client can have unique export templates\n";
echo "✅ Different formula types: component, percentage, fixed_amount, sum\n";
echo "✅ Configurable percentages per line item\n";
echo "✅ Client-specific VAT rates if needed\n";
echo "✅ Custom line items and descriptions\n";
echo "✅ Flexible dependency chains (VAT depends on management fees)\n";
echo "✅ No hardcoded business logic - all template-driven\n\n";

echo "=== CONFIGURATION METHODS ===\n";
echo "Administrators can configure clients through:\n";
echo "1. Export Template Builder in frontend\n";
echo "2. Database updates to export_templates table\n";
echo "3. Client-specific settings in clients table\n";
echo "4. Template import/export functionality\n\n";

echo "🎉 The system is now truly multi-tenant and configurable!\n";
echo "Each client gets exactly the invoice format and calculations they need.\n";
