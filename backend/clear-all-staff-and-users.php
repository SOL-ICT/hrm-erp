<?php
/**
 * Clear All Test Staff and Associated Users
 * 
 * Deletes all staff records and their associated user accounts
 * Usage: docker exec hrm-laravel-api php clear-all-staff-and-users.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "========================================\n";
    echo "Clear All Staff and Users\n";
    echo "========================================\n\n";

    // Exclude original/system staff and users (IDs 2-17 for staff, 1-11 for users)
    $excludeStaffIds = [2, 3, 10, 11, 12, 13]; // Original 6 staff to keep
    $excludeUserIds = [1, 2, 3, 4, 6, 10, 11, 12]; // Original 8 users to keep
    
    // Get counts before deletion (excluding protected records)
    $staffCount = DB::table('staff')->whereNotIn('id', $excludeStaffIds)->count();
    $userCount = DB::table('users')->whereNotIn('id', $excludeUserIds)->count();
    
    echo "Current Status:\n";
    echo "  Staff Records (excluding protected): {$staffCount}\n";
    echo "  User Accounts (excluding protected): {$userCount}\n";
    echo "  Protected Staff IDs: " . implode(', ', $excludeStaffIds) . "\n";
    echo "  Protected User IDs: " . implode(', ', $excludeUserIds) . "\n\n";

    if ($staffCount == 0) {
        echo "No staff to clear. Exiting.\n";
        exit(0);
    }

    // Check for --confirm flag
    $confirmed = in_array('--confirm', $argv);
    
    if (!$confirmed) {
        echo "⚠️  WARNING: This will delete ALL test staff and their user accounts!\n";
        echo "Run with --confirm flag to proceed:\n";
        echo "  docker exec hrm-laravel-api php clear-all-staff-and-users.php --confirm\n\n";
        exit(1);
    }

    echo "\nStarting deletion process...\n\n";

    DB::beginTransaction();

    try {
        // Get all staff IDs and their email addresses (excluding protected records)
        $staffData = DB::table('staff')
            ->whereNotIn('id', $excludeStaffIds)
            ->select('id', 'email')
            ->get();
        $staffIds = $staffData->pluck('id')->toArray();
        $staffEmails = $staffData->pluck('email')->toArray();

        echo "Step 1: Deleting related staff records...\n";
        
        // Delete related records
        $deletedPersonalInfo = DB::table('staff_personal_info')->whereIn('staff_id', $staffIds)->delete();
        echo "  - Personal Info: {$deletedPersonalInfo} records\n";
        
        $deletedBanking = DB::table('staff_banking')->whereIn('staff_id', $staffIds)->delete();
        echo "  - Banking: {$deletedBanking} records\n";
        
        $deletedEducation = DB::table('staff_education')->whereIn('staff_id', $staffIds)->delete();
        echo "  - Education: {$deletedEducation} records\n";
        
        $deletedExperience = DB::table('staff_experience')->whereIn('staff_id', $staffIds)->delete();
        echo "  - Experience: {$deletedExperience} records\n";
        
        $deletedEmergency = DB::table('staff_emergency_contacts')->whereIn('staff_id', $staffIds)->delete();
        echo "  - Emergency Contacts: {$deletedEmergency} records\n";
        
        $deletedGuarantors = DB::table('staff_guarantors')->whereIn('staff_id', $staffIds)->delete();
        echo "  - Guarantors: {$deletedGuarantors} records\n";
        
        $deletedLegalIds = DB::table('staff_legal_ids')->whereIn('staff_id', $staffIds)->delete();
        echo "  - Legal IDs: {$deletedLegalIds} records\n";
        
        $deletedReferences = DB::table('staff_references')->whereIn('staff_id', $staffIds)->delete();
        echo "  - References: {$deletedReferences} records\n";

        echo "\nStep 2: Deleting staff records...\n";
        $deletedStaff = DB::table('staff')->whereIn('id', $staffIds)->delete();
        echo "  - Staff: {$deletedStaff} records\n";

        echo "\nStep 3: Deleting user accounts (excluding protected)...\n";
        $deletedUsers = DB::table('users')
            ->whereIn('email', $staffEmails)
            ->whereNotIn('id', $excludeUserIds)
            ->delete();
        echo "  - Users: {$deletedUsers} records\n";

        DB::commit();

        echo "\n========================================\n";
        echo "Deletion Complete!\n";
        echo "========================================\n";
        echo "  Staff Deleted: {$deletedStaff}\n";
        echo "  Users Deleted: {$deletedUsers}\n";
        echo "  Related Records Deleted: " . ($deletedPersonalInfo + $deletedBanking + $deletedEducation + $deletedExperience + $deletedEmergency + $deletedGuarantors + $deletedLegalIds + $deletedReferences) . "\n";
        echo "\n✓ All staff and users cleared successfully!\n";

    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }

} catch (\Exception $e) {
    echo "\nERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
