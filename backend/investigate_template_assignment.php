<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Client;
use App\Models\InvoiceTemplate;

echo "=== INVESTIGATING TEMPLATE ASSIGNMENT ISSUE ===\n\n";

// Check Template 17 details
echo "📋 TEMPLATE 17 DETAILS:\n";
$template17 = InvoiceTemplate::find(17);
if ($template17) {
    echo "   ID: " . $template17->id . "\n";
    echo "   Name: " . $template17->template_name . "\n";
    echo "   Service Fee: " . $template17->service_fee_percentage . "%\n";
    echo "   Created: " . $template17->created_at . "\n";
    echo "   Updated: " . $template17->updated_at . "\n";

    // Check if template has any client references
    $clients = Client::where('template_id', 17)->get();
    echo "   Clients using this template: " . $clients->count() . "\n";
    if ($clients->count() > 0) {
        foreach ($clients as $client) {
            echo "     - " . $client->organisation_name . " (ID: " . $client->id . ")\n";
        }
    }
} else {
    echo "   ❌ Template 17 not found\n";
}

// Check FIDUCIA client details
echo "\n🏢 FIDUCIA CLIENT DETAILS:\n";
$fiducia = Client::where('organisation_name', 'LIKE', '%FIDUCIA%')->first();
if ($fiducia) {
    echo "   ID: " . $fiducia->id . "\n";
    echo "   Name: " . $fiducia->organisation_name . "\n";
    echo "   Template ID: " . ($fiducia->template_id ?? 'NULL') . "\n";
    echo "   Created: " . $fiducia->created_at . "\n";
    echo "   Updated: " . $fiducia->updated_at . "\n";
} else {
    echo "   ❌ FIDUCIA client not found\n";
}

// Check the template creation timeline vs client creation
echo "\n🕐 TIMELINE ANALYSIS:\n";
if ($template17 && $fiducia) {
    echo "   Template 17 created: " . $template17->created_at . "\n";
    echo "   FIDUCIA client created: " . $fiducia->created_at . "\n";

    if ($template17->created_at > $fiducia->created_at) {
        echo "   📅 Template was created AFTER the client\n";
        echo "   💡 This suggests the template was created later and not auto-assigned\n";
    } else {
        echo "   📅 Template was created BEFORE the client\n";
        echo "   🤔 Template should have been available during client creation\n";
    }
}

// Check if there's an automatic assignment mechanism
echo "\n🔍 CHECKING ASSIGNMENT LOGIC:\n";
echo "   Looking for any auto-assignment code...\n";

// Check database schema for template_id field
$tableInfo = \Illuminate\Support\Facades\DB::select("DESCRIBE clients");
$hasTemplateId = false;
foreach ($tableInfo as $column) {
    if ($column->Field === 'template_id') {
        $hasTemplateId = true;
        echo "   ✅ clients.template_id column exists (Type: " . $column->Type . ", Null: " . $column->Null . ")\n";
        break;
    }
}

if (!$hasTemplateId) {
    echo "   ❌ clients.template_id column missing - this could be the issue!\n";
}

// Check for any template assignment during client creation
echo "\n🔎 POSSIBLE REASONS FOR MISSING ASSIGNMENT:\n";
echo "   1. Manual assignment required (no auto-assignment implemented)\n";
echo "   2. Template created after client, so wasn't available during setup\n";
echo "   3. Missing template_id column in clients table\n";
echo "   4. Bug in client creation process\n";
echo "   5. Template was created but assignment step was skipped\n";
