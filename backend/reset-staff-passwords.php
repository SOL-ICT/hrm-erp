<?php

/**
 * Reset Staff Default Passwords
 * Updates all bulk uploaded staff passwords to a simpler default
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== Reset Staff Default Passwords ===\n\n";

// Get the new default password from command line or use default
$newPassword = isset($argv[1]) ? $argv[1] : '12345678';
$targetDate = isset($argv[2]) ? $argv[2] : null;
$staffIdThreshold = isset($argv[3]) ? (int)$argv[3] : 13;

if ($targetDate) {
    echo "Targeting users created on: {$targetDate}\n";
    echo "New default password: {$newPassword}\n\n";
    
    // Get users created on specific date
    $users = User::whereNotNull('staff_profile_id')
        ->whereDate('created_at', $targetDate)
        ->get();
} else {
    echo "New default password: {$newPassword}\n";
    echo "Updating users for staff ID > {$staffIdThreshold}\n\n";
    
    // Get all users linked to bulk uploaded staff
    $users = User::whereNotNull('staff_profile_id')
        ->where('staff_profile_id', '>', $staffIdThreshold)
        ->get();
}

echo "Found {$users->count()} user accounts to update\n\n";

if ($users->isEmpty()) {
    echo "No users to update.\n";
    exit(0);
}

$successCount = 0;
$failCount = 0;

foreach ($users as $user) {
    try {
        $user->password = Hash::make($newPassword);
        $user->save();
        
        echo "✓ Updated password for: {$user->name} (Staff ID: {$user->staff_profile_id})\n";
        $successCount++;
    } catch (\Exception $e) {
        echo "✗ Failed to update {$user->name}: {$e->getMessage()}\n";
        $failCount++;
    }
}

echo "\n=== Summary ===\n";
echo "Successfully updated: {$successCount}\n";
echo "Failed: {$failCount}\n";
echo "\n✓ Password reset complete!\n";
echo "All affected staff can now login with password: {$newPassword}\n";
