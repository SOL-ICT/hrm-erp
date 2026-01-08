<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->boot();

use App\Models\User;
use App\Services\RecruitmentHierarchyService;

try {
    $user = User::find(192);
    if (!$user) {
        echo "User 192 not found\n";
        exit(1);
    }
    
    $service = new RecruitmentHierarchyService();
    $permissions = $service->getUserPermissions($user);

    echo "User 192 ({$user->name}) permissions:\n";
    if ($permissions) {
        echo "hierarchy_level: " . $permissions->hierarchy_level . "\n";
        echo "can_approve_boarding: " . ($permissions->can_approve_boarding ? 'true' : 'false') . "\n";
        echo "role_id: " . $permissions->role_id . "\n";
        echo "role name: " . $permissions->role->name ?? 'N/A' . "\n";
    } else {
        echo "No permissions found\n";
    }
    
    echo "\nUser staff_profile_id: " . $user->staff_profile_id . "\n";
    echo "User role (legacy): " . $user->role . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}