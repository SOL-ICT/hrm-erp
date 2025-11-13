<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Client;
use App\Models\InvoiceTemplate;

echo "=== CHECKING ALL TEMPLATES AND CLIENT ASSIGNMENTS ===\n\n";

// Check all available templates
echo "📋 AVAILABLE INVOICE TEMPLATES:\n";
echo "================================\n";
$templates = InvoiceTemplate::all();

if ($templates->count() == 0) {
    echo "❌ No templates found in the system\n\n";
} else {
    foreach ($templates as $template) {
        echo "Template ID: " . $template->id . "\n";
        echo "Name: " . ($template->template_name ?? 'UNNAMED') . "\n";
        echo "Service Fee Percentage: " . ($template->service_fee_percentage ?? 'NOT SET') . "%\n";
        echo "Service Fee Label: " . ($template->service_fee_label ?? 'NOT SET') . "\n";
        echo "Created: " . $template->created_at . "\n";
        echo "---\n";
    }
}

// Check FIDUCIA client
echo "\n🏢 FIDUCIA CLIENT STATUS:\n";
echo "=========================\n";
$fiducia = Client::where('organisation_name', 'LIKE', '%FIDUCIA%')->first();

if ($fiducia) {
    echo "Client ID: " . $fiducia->id . "\n";
    echo "Organisation: " . $fiducia->organisation_name . "\n";
    echo "Template ID: " . ($fiducia->template_id ?? 'NOT ASSIGNED') . "\n";

    if ($fiducia->template_id) {
        echo "Template Name: " . ($fiducia->template->template_name ?? 'UNKNOWN') . "\n";
    } else {
        echo "⚠️  NO TEMPLATE ASSIGNED TO FIDUCIA CLIENT\n";
    }
} else {
    echo "❌ FIDUCIA client not found\n";
}

// Check all clients and their template assignments
echo "\n👥 ALL CLIENTS AND TEMPLATE ASSIGNMENTS:\n";
echo "========================================\n";
$clients = Client::with('template')->get();

foreach ($clients as $client) {
    echo $client->organisation_name . " (ID: " . $client->id . ") -> ";
    if ($client->template_id && $client->template) {
        echo "Template: " . $client->template->template_name . " (ID: " . $client->template_id . ")\n";
    } else {
        echo "NO TEMPLATE ASSIGNED\n";
    }
}
