<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\Staff;
use App\Models\StaffBanking;
use App\Models\StaffPersonalInfo;
use App\Models\StaffLegalId;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Fixing Staff Related Records ===\n\n";

// SQL to fetch original Excel data that failed
// We'll need to manually map this based on the logs
// The banking data was in the Excel but failed due to payment_mode enum issue

$bankingData = [
    18 => ['bank' => 'Access Bank Plc', 'account' => '1627221012'],
    19 => ['bank' => 'Access Bank Plc', 'account' => '0098468589'],
    20 => ['bank' => 'Access Bank Plc', 'account' => '1852839792'],
    21 => ['bank' => 'Access Bank Plc', 'account' => '0025793931'],
    22 => ['bank' => 'Access Bank Plc', 'account' => '0025827548'],
    23 => ['bank' => 'Wema Bank Plc', 'account' => '8270007406'],
    24 => ['bank' => 'Access Bank Plc', 'account' => '1472573454'],
    25 => ['bank' => 'Access Bank Plc', 'account' => '1684598560'],
    26 => ['bank' => 'Access Bank Plc', 'account' => '1641408400'],
    27 => ['bank' => 'Access Bank Plc', 'account' => '0695101453'],
    28 => ['bank' => 'Access Bank Plc', 'account' => '1436308461'],
    29 => ['bank' => 'Access Bank Plc', 'account' => '0017930151'],
    30 => ['bank' => 'Access Bank Plc', 'account' => '1443074029'],
    31 => ['bank' => 'Access Bank Plc', 'account' => '0106979663'],
    32 => ['bank' => 'Access Bank Plc', 'account' => '1679068593'],
    33 => ['bank' => 'Opay Digital', 'account' => '8107692132'],
    34 => ['bank' => 'Access Bank Plc', 'account' => '1539226606'],
    35 => ['bank' => 'Access Bank Plc', 'account' => '0765439413'],
    36 => ['bank' => 'Access Bank Plc', 'account' => '0031558292'],
    37 => ['bank' => 'Access Bank Plc', 'account' => '0050483412'],
    39 => ['bank' => 'Guarantee Trust Bank', 'account' => '0023146827'],
    40 => ['bank' => 'Access Bank Plc', 'account' => '1825358079'],
    41 => ['bank' => 'Access Bank Plc', 'account' => '0099527687'],
    42 => ['bank' => 'Access Bank Plc', 'account' => '1494182340'],
    43 => ['bank' => 'Access Bank Plc', 'account' => '1895803420'],
    44 => ['bank' => 'Access Bank Plc', 'account' => '1960513597'],
    45 => ['bank' => 'Access Bank Plc', 'account' => '0078020462'],
    46 => ['bank' => 'Access Bank Plc', 'account' => '0017871012'],
    47 => ['bank' => 'Access Bank Plc', 'account' => '1590427419'],
    48 => ['bank' => 'Access Bank Plc', 'account' => '1489971252'],
    49 => ['bank' => 'Access Bank Plc', 'account' => '1898470142'],
    50 => ['bank' => 'Access Bank Plc', 'account' => '0082736412'],
    52 => ['bank' => 'Access Bank Plc', 'account' => '0709640842'],
    53 => ['bank' => 'Access Bank Plc', 'account' => '0017930247'],
    54 => ['bank' => 'Access Bank Plc', 'account' => '0099516023'],
    55 => ['bank' => 'Access Bank Plc', 'account' => '0726670664'],
    56 => ['bank' => 'Access Bank Plc', 'account' => '0073820368'],
    57 => ['bank' => 'Access Bank Plc', 'account' => '1850877558'],
    58 => ['bank' => 'Access Bank Plc', 'account' => '1899954461'],
    59 => ['bank' => 'Access Bank Plc', 'account' => '0098105460'],
    60 => ['bank' => 'Access Bank Plc', 'account' => '0013279490'],
    61 => ['bank' => 'Access Bank Plc', 'account' => '0103948774'],
    62 => ['bank' => 'Access Bank Plc', 'account' => '0099461460'],
    63 => ['bank' => 'Access Bank Plc', 'account' => '1466681499'],
    65 => ['bank' => 'Access Bank Plc', 'account' => '0096474584'],
];

$successCount = 0;
$failedCount = 0;

foreach ($bankingData as $staffId => $data) {
    try {
        // Check if banking record already exists
        $existing = StaffBanking::where('staff_id', $staffId)->first();
        if ($existing) {
            echo "Staff ID {$staffId}: Banking record already exists, skipping\n";
            continue;
        }

        StaffBanking::create([
            'staff_id' => $staffId,
            'payment_mode' => 'bank_transfer', // All were "Credit Transfer" in Excel
            'bank_name' => $data['bank'],
            'account_number' => $data['account'],
        ]);

        echo "Staff ID {$staffId}: ✓ Banking record created\n";
        $successCount++;
    } catch (\Exception $e) {
        echo "Staff ID {$staffId}: ✗ FAILED - {$e->getMessage()}\n";
        $failedCount++;
    }
}

echo "\n=== Summary ===\n";
echo "Successfully created: {$successCount}\n";
echo "Failed: {$failedCount}\n";
echo "\nScript completed!\n";
