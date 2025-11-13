<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\InvoiceTemplate;

echo "=== FIDUCIA TEMPLATE 17 - RAW DATA STRUCTURE ===\n\n";

$template = InvoiceTemplate::find(17);

if (!$template) {
    echo "❌ Template 17 not found\n";
    exit;
}

echo "📋 BASIC INFO:\n";
echo "   Template Name: " . $template->template_name . "\n";
echo "   Service Fee: " . $template->service_fee_percentage . "%\n";
echo "   Pay Grade Structure ID: " . $template->pay_grade_structure_id . "\n\n";

echo "💵 CUSTOM COMPONENTS (RAW):\n";
echo "   Type: " . gettype($template->custom_components) . "\n";
if ($template->custom_components) {
    if (is_array($template->custom_components)) {
        echo "   Count: " . count($template->custom_components) . "\n";
        print_r($template->custom_components);
    } else {
        echo "   Raw String: " . $template->custom_components . "\n";
    }
} else {
    echo "   No custom components\n";
}

echo "\n⚖️ STATUTORY COMPONENTS (RAW):\n";
echo "   Type: " . gettype($template->statutory_components) . "\n";
if ($template->statutory_components) {
    if (is_array($template->statutory_components)) {
        echo "   Count: " . count($template->statutory_components) . "\n";
        print_r($template->statutory_components);
    } else {
        echo "   Raw String: " . $template->statutory_components . "\n";
    }
} else {
    echo "   No statutory components\n";
}

echo "\n🧮 CALCULATION RULES (RAW):\n";
echo "   Type: " . gettype($template->calculation_rules) . "\n";
if ($template->calculation_rules) {
    if (is_array($template->calculation_rules)) {
        print_r($template->calculation_rules);
    } else {
        echo "   Raw String: " . $template->calculation_rules . "\n";
    }
} else {
    echo "   No calculation rules\n";
}
