<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\InvoiceTemplate;

echo "All Invoice Templates:\n";
$templates = InvoiceTemplate::all();
foreach ($templates as $template) {
    echo "ID: {$template->id}, Client: {$template->client_id}\n";
}

// Use template ID 30 which should be Fiducia
$template = InvoiceTemplate::find(30);
if ($template) {
    echo "\nUsing template ID: {$template->id}\n";
    echo "Template components JSON: " . substr($template->template_components, 0, 200) . "...\n";

    $components = json_decode($template->template_components, true);

    if ($components) {
        echo "Template Components Structure:\n";
        foreach ($components as $key => $component) {
            echo "Key: $key\n";
            echo "Fields: " . implode(', ', array_keys($component)) . "\n";
            if (in_array($component['type'], ['pension', 'nhf', 'nsitf', 'tax'])) {
                echo "STATUTORY COMPONENT: " . json_encode($component, JSON_PRETTY_PRINT) . "\n";
            }
            echo "---\n";
        }
    } else {
        echo "Failed to decode template_components JSON\n";
    }
} else {
    echo "Template ID 30 not found.\n";
}
