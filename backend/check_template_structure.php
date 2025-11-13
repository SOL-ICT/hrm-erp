<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use App\Models\InvoiceTemplate;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 CHECKING TEMPLATE COMPONENT STRUCTURE\n";
echo "=" . str_repeat("=", 50) . "\n\n";

try {
    $template = InvoiceTemplate::find(30);

    if (!$template) {
        echo "❌ Template not found!\n";
        exit(1);
    }

    echo "Template: {$template->template_name}\n\n";

    echo "📊 RAW CUSTOM COMPONENTS:\n";
    echo json_encode($template->custom_components, JSON_PRETTY_PRINT) . "\n\n";

    echo "📊 COMPONENT VALIDATION:\n";
    foreach ($template->custom_components ?? [] as $index => $component) {
        echo "Component " . ($index + 1) . ":\n";
        echo "  Name: " . (isset($component['name']) ? "✅ {$component['name']}" : "❌ MISSING") . "\n";
        echo "  Type: " . (isset($component['type']) ? "✅ {$component['type']}" : "❌ MISSING") . "\n";
        echo "  Rate: " . (isset($component['rate']) ? "✅ {$component['rate']}" : "❌ MISSING") . "\n";
        echo "  Amount: " . (isset($component['amount']) ? "✅ {$component['amount']}" : "❌ MISSING") . "\n";

        // Check validation
        if (!isset($component['name']) || !isset($component['type'])) {
            echo "  VALIDATION: ❌ FAILED (missing name or type)\n";
        } elseif (
            $component['type'] !== 'formula' &&
            !isset($component['rate']) && !isset($component['amount'])
        ) {
            echo "  VALIDATION: ❌ FAILED (missing rate/amount for non-formula)\n";
        } else {
            echo "  VALIDATION: ✅ PASSED\n";
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
