<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\Staff;
use App\Models\User;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Clear Uploaded Staff Records ===\n\n";

// Keep staff IDs 1-17, delete everything after ID 17
$staffIds = Staff::where('id', '>', 17)->pluck('id')->toArray();

echo "Found " . count($staffIds) . " staff records to delete (keeping IDs 1-17)\n";
echo "Staff IDs to delete: " . implode(', ', $staffIds) . "\n\n";

DB::beginTransaction();

try {
    $deletedStaff = 0;
    $deletedUsers = 0;
    $deletedBanking = 0;
    $deletedPersonalInfo = 0;
    $deletedLegalIds = 0;
    $deletedEmergencyContacts = 0;
    $deletedGuarantors = 0;
    $deletedEducation = 0;
    $deletedExperience = 0;

    foreach ($staffIds as $staffId) {
        // Check if staff exists
        $staff = Staff::find($staffId);
        if (!$staff) {
            continue;
        }

        echo "Deleting Staff ID {$staffId} - {$staff->first_name} {$staff->last_name} ({$staff->staff_id})...\n";

        // Delete user account (keep user IDs 1-11)
        $user = User::where('staff_profile_id', $staffId)->first();
        if ($user && $user->id > 11) {
            $user->delete();
            $deletedUsers++;
            echo "  ✓ Deleted user account (ID: {$user->id})\n";
        } elseif ($user) {
            echo "  ⚠ Skipped user account (ID: {$user->id}) - keeping IDs 1-11\n";
        }

        // Delete related records
        DB::table('staff_banking')->where('staff_id', $staffId)->delete();
        $deletedBanking++;

        DB::table('staff_personal_info')->where('staff_id', $staffId)->delete();
        $deletedPersonalInfo++;

        DB::table('staff_legal_ids')->where('staff_id', $staffId)->delete();
        $deletedLegalIds++;

        DB::table('staff_emergency_contacts')->where('staff_id', $staffId)->delete();
        $deletedEmergencyContacts++;

        DB::table('staff_guarantors')->where('staff_id', $staffId)->delete();
        $deletedGuarantors++;

        DB::table('staff_education')->where('staff_id', $staffId)->delete();
        $deletedEducation++;

        DB::table('staff_experience')->where('staff_id', $staffId)->delete();
        $deletedExperience++;

        // Delete staff record
        $staff->delete();
        $deletedStaff++;
        echo "  ✓ Deleted staff record\n";
    }

    DB::commit();

    echo "\n=== Summary ===\n";
    echo "Staff records deleted: {$deletedStaff}\n";
    echo "User accounts deleted: {$deletedUsers}\n";
    echo "Banking records deleted: {$deletedBanking}\n";
    echo "Personal info records deleted: {$deletedPersonalInfo}\n";
    echo "Legal IDs deleted: {$deletedLegalIds}\n";
    echo "Emergency contacts deleted: {$deletedEmergencyContacts}\n";
    echo "Guarantors deleted: {$deletedGuarantors}\n";
    echo "Education records deleted: {$deletedEducation}\n";
    echo "Experience records deleted: {$deletedExperience}\n";
    echo "\n✓ All records cleared successfully!\n";
    echo "\nYou can now re-upload the staff Excel file.\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "\n✗ ERROR: {$e->getMessage()}\n";
    echo "Transaction rolled back.\n";
    exit(1);
}
