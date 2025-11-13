<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Client;

echo "=== CHECKING FIDUCIA TEMPLATE CONFIGURATION ===\n\n";

$fiducia = Client::where('organisation_name', 'LIKE', '%FIDUCIA%')->first();

if (!$fiducia) {
    echo "❌ No FIDUCIA client found\n";
    exit;
}

echo "🏢 CLIENT FOUND: " . $fiducia->organisation_name . "\n";
echo "   Client ID: " . $fiducia->id . "\n\n";

if (!$fiducia->template) {
    echo "❌ No template configured for this client\n";
    exit;
}

$template = $fiducia->template;

echo "📋 TEMPLATE CONFIGURATION:\n";
echo "   Template ID: " . $template->id . "\n";
echo "   Template Name: " . ($template->template_name ?? 'NOT SET') . "\n";
echo "   Service Fee Percentage: " . ($template->service_fee_percentage ?? 'NOT SET') . "%\n";
echo "   Service Fee Label: " . ($template->service_fee_label ?? 'NOT SET') . "\n\n";

echo "🔍 FULL TEMPLATE STRUCTURE:\n";
echo "=====================================\n";
print_r($template->toArray());

echo "\n📊 CUSTOM COMPONENTS (Salary Items):\n";
if ($template->custom_components) {
    foreach ($template->custom_components as $component) {
        echo "   - " . $component['component_name'] . " (Amount: " . ($component['amount'] ?? 'Variable') . ")\n";
    }
} else {
    echo "   No custom components found\n";
}

echo "\n⚖️ STATUTORY COMPONENTS (Deductions):\n";
if ($template->statutory_components) {
    foreach ($template->statutory_components as $component) {
        echo "   - " . $component['component_name'] . " (Amount: " . ($component['amount'] ?? 'Variable') . ")\n";
    }
} else {
    echo "   No statutory components found\n";
}
