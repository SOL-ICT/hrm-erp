<?php

/**
 * Manual Approval Script for Pending Staff
 * Bypasses service validation - temporary until Approval module is built
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Staff;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== Manual Staff Approval Script ===\n\n";

// Get control user (assuming user ID 2 is super admin)
$controlUser = User::find(2);
if (!$controlUser) {
    echo "Error: Control user not found!\n";
    exit(1);
}

echo "Control User: {$controlUser->name} (ID: {$controlUser->id})\n\n";

// Get all pending staff
$pendingStaff = Staff::where('boarding_approval_status', 'pending_control_approval')
    ->where('client_id', 1)
    ->get();

echo "Found {$pendingStaff->count()} staff awaiting approval\n\n";

if ($pendingStaff->isEmpty()) {
    echo "No pending staff to approve.\n";
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
            'control_approval_notes' => 'Manual bulk approval via script - Approval module pending',
            'status' => $staff->offer_already_accepted ? 'active' : 'inactive',
        ]);

        // Create user account
        $username = $staff->staff_id;
        $counter = 1;
        while (User::where('username', $username)->exists()) {
            $username = $staff->staff_id . '_' . $counter;
            $counter++;
        }

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

        // Default role for staff
        $role = 'Staff';

        $user = User::create([
            'name' => trim($staff->first_name . ' ' . $staff->last_name),
            'email' => $email,
            'username' => $username,
            'password' => bcrypt('mysolc3ntfi3ld@'), // Default password
            'role' => $role,
            'user_type' => 'staff',
            'staff_profile_id' => $staff->id,
            'is_active' => $staff->status === 'active',
            'preferences' => new \stdClass(), // Empty JSON object
        ]);

        $usersCreated++;

        // Update ticket counter if offer already accepted
        if ($staff->offer_already_accepted) {
            $ticket = $staff->recruitmentRequest;
            if ($ticket) {
                $ticket->staff_accepted_offer = ($ticket->staff_accepted_offer ?? 0) + 1;
                $ticket->save();
            }
        }

        DB::commit();
        echo "✓ APPROVED + USER CREATED (Status: {$staff->status}, Username: {$username})\n";
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
echo "User accounts created: {$usersCreated}\n";

if (!empty($errors)) {
    echo "\nErrors:\n";
    foreach ($errors as $error) {
        echo "  - {$error['staff']}: {$error['error']}\n";
    }
}

echo "\nScript completed!\n";
echo "\nDefault Password for all users: mysolc3ntfi3ld@\n";
