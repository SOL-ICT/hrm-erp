<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\InvoiceTemplate;

$template = InvoiceTemplate::find(17);

echo "=== CHECKING PROBLEMATIC FORMULAS ===\n\n";

foreach ($template->custom_components as $component) {
    if ($component['type'] === 'formula') {
        echo "Component: " . $component['name'] . "\n";
        echo "ID: " . $component['id'] . "\n";
        echo "Formula: " . $component['formula'] . "\n";
        echo "Rate: " . $component['rate'] . "\n";
        echo "---\n";
    }
}
