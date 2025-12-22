<?php

/**
 * Production Staff Approval Script
 * Manual approval for pending staff on production server
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Staff;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== Production Manual Staff Approval Script ===\n\n";

// Get control user (check for super admin)
$controlUser = User::where('role', 'Super Admin')->orWhere('role', 'Admin')->first();
if (!$controlUser) {
    // Fallback to user ID 1
    $controlUser = User::find(1);
}

if (!$controlUser) {
    echo "Error: No control user found! Please ensure admin user exists.\n";
    exit(1);
}

echo "Control User: {$controlUser->name} (ID: {$controlUser->id}, Role: {$controlUser->role})\n\n";

// Get all pending staff
$pendingStaff = Staff::where('boarding_approval_status', 'pending_control_approval')
    ->get();

echo "Found {$pendingStaff->count()} staff awaiting approval\n\n";

if ($pendingStaff->isEmpty()) {
    echo "No pending staff to approve.\n";
    echo "\nChecking staff boarding statuses:\n";
    $statusCounts = Staff::select('boarding_approval_status', DB::raw('count(*) as count'))
        ->groupBy('boarding_approval_status')
        ->get();
    
    foreach ($statusCounts as $status) {
        echo "  - {$status->boarding_approval_status}: {$status->count}\n";
    }
    exit(0);
}

$successCount = 0;
$failCount = 0;
$errors = [];
$usersCreated = 0;

foreach ($pendingStaff as $staff) {
    DB::beginTransaction();
    try {
        echo "Processing: {$staff->employee_code} - {$staff->first_name} {$staff->last_name}... ";
        
        // Update staff approval status
        $staff->update([
            'boarding_approval_status' => 'control_approved',
            'control_approved_by' => $controlUser->id,
            'control_approved_at' => now(),
            'control_approval_notes' => 'Production manual bulk approval via script',
            'status' => $staff->offer_already_accepted ? 'active' : 'inactive',
        ]);

        // Create user account if it doesn't exist
        $existingUser = User::where('staff_profile_id', $staff->id)->first();
        
        if (!$existingUser) {
            // Generate unique username
            $username = $staff->staff_id;
            $counter = 1;
            while (User::where('username', $username)->exists()) {
                $username = $staff->staff_id . '_' . $counter;
                $counter++;
            }

            // Handle email
            $email = $staff->email;
            if (empty($email)) {
                $email = strtolower($staff->staff_id) . '@solnigeria.com';
            }

            $originalEmail = $email;
            $emailCounter = 1;
            while (User::where('email', $email)->exists()) {
                $email = str_replace('@', "+{$emailCounter}@", $originalEmail);
                $emailCounter++;
            }

            // Create user account
            $user = User::create([
                'name' => trim($staff->first_name . ' ' . $staff->last_name),
                'email' => $email,
                'username' => $username,
                'password' => bcrypt('mysolc3ntfi3ld@'), // Default password
                'role' => 'Staff',
                'user_type' => 'staff',
                'staff_profile_id' => $staff->id,
                'is_active' => $staff->status === 'active',
                'preferences' => new \stdClass(), // Empty JSON object
            ]);

            $usersCreated++;
            echo "✓ APPROVED + USER CREATED (Status: {$staff->status}, Username: {$username})\n";
        } else {
            echo "✓ APPROVED (User already exists)\n";
        }

        // Update recruitment ticket if applicable
        if ($staff->offer_already_accepted && $staff->recruitmentRequest) {
            $ticket = $staff->recruitmentRequest;
            $ticket->staff_accepted_offer = ($ticket->staff_accepted_offer ?? 0) + 1;
            $ticket->save();
        }

        DB::commit();
        $successCount++;
        
    } catch (\Exception $e) {
        DB::rollBack();
        echo "✗ FAILED: {$e->getMessage()}\n";
        $failCount++;
        $errors[] = [
            'staff' => $staff->employee_code,
            'error' => $e->getMessage()
        ];
    }
}

echo "\n=== Summary ===\n";
echo "Successfully approved: {$successCount}\n";
echo "Failed: {$failCount}\n";
echo "New user accounts created: {$usersCreated}\n";

if (!empty($errors)) {
    echo "\nErrors:\n";
    foreach ($errors as $error) {
        echo "  - {$error['staff']}: {$error['error']}\n";
    }
}

echo "\nScript completed!\n";
echo "\nDefault Password for new users: mysolc3ntfi3ld@\n";
echo "\nNext steps:\n";
echo "1. Users should change their passwords on first login\n";
echo "2. Check admin dashboard to verify staff boarding status\n";