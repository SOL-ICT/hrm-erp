<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Client;
use App\Models\InvoiceTemplate;

echo "=== ASSIGNING FIDUCIA TEMPLATE TO FIDUCIA CLIENT ===\n\n";

// Find FIDUCIA client
$fiducia = Client::where('organisation_name', 'LIKE', '%FIDUCIA%')->first();
if (!$fiducia) {
    echo "❌ FIDUCIA client not found\n";
    exit;
}

// Find FIDUCIA template
$template = InvoiceTemplate::where('template_name', 'FIDUCIA')->first();
if (!$template) {
    echo "❌ FIDUCIA template not found\n";
    exit;
}

echo "🏢 FIDUCIA Client: " . $fiducia->organisation_name . " (ID: " . $fiducia->id . ")\n";
echo "📋 FIDUCIA Template: " . $template->template_name . " (ID: " . $template->id . ")\n";
echo "💰 Service Fee: " . $template->service_fee_percentage . "%\n\n";

// Assign template to client
echo "🔗 Assigning template to client...\n";
$fiducia->template_id = $template->id;
$fiducia->save();

echo "✅ Template assignment successful!\n\n";

// Verify assignment
$fiducia->refresh();
echo "🔍 VERIFICATION:\n";
echo "   Client: " . $fiducia->organisation_name . "\n";
echo "   Template ID: " . $fiducia->template_id . "\n";

// Show template details
echo "\n📋 TEMPLATE DETAILS:\n";
echo "   Name: " . $template->template_name . "\n";
echo "   Service Fee Percentage: " . $template->service_fee_percentage . "%\n";
echo "   Service Fee Label: " . ($template->service_fee_label ?? 'Default: Service Fee') . "\n";
