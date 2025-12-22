<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testing RBAC API Response ===\n\n";

// Get Super Admin user
$user = DB::table('users')->where('email', 'admin@sol.ng')->first();
if (!$user) {
    echo "❌ User not found\n";
    exit(1);
}

echo "✓ User found: {$user->name} ({$user->email})\n\n";

// Get staff record
$staff = DB::table('staff')
    ->where('email', $user->email)
    ->where('client_id', 1)
    ->where('status', 'active')
    ->first();

if (!$staff) {
    echo "❌ Staff record not found\n";
    exit(1);
}

echo "✓ Staff record found: ID {$staff->id}\n\n";

// Get roles
$userRoles = DB::table('staff_roles as sr')
    ->join('roles as r', 'sr.role_id', '=', 'r.id')
    ->where('sr.staff_id', $staff->id)
    ->where('r.is_active', true)
    ->select('r.id', 'r.name', 'r.slug')
    ->get();

echo "✓ User Roles: " . $userRoles->count() . "\n";
foreach ($userRoles as $role) {
    echo "  - {$role->name} (ID: {$role->id})\n";
}
echo "\n";

// Get role-based permissions
$rolePermissions = DB::table('role_permissions as rp')
    ->join('permissions as p', 'rp.permission_id', '=', 'p.id')
    ->join('submodules as s', 'p.submodule_id', '=', 's.id')
    ->join('modules as m', 's.module_id', '=', 'm.id')
    ->whereIn('rp.role_id', $userRoles->pluck('id'))
    ->select(
        'm.slug as module_slug',
        's.slug as submodule_slug',
        'p.slug as permission_slug'
    )
    ->get();

echo "✓ Total Permissions: " . $rolePermissions->count() . "\n\n";

// Filter for requisition-management
$reqPermissions = $rolePermissions->filter(function($perm) {
    return $perm->module_slug === 'requisition-management';
});

echo "✓ Requisition Management Permissions: " . $reqPermissions->count() . "\n";

// Filter for inventory-management
$invPermissions = $reqPermissions->filter(function($perm) {
    return $perm->submodule_slug === 'inventory-management';
});

echo "✓ Inventory Management Permissions: " . $invPermissions->count() . "\n";
foreach ($invPermissions as $perm) {
    // Check if permission slug already includes submodule prefix
    if (strpos($perm->permission_slug, $perm->submodule_slug . '.') === 0) {
        // Permission slug already prefixed
        $key = "{$perm->module_slug}.{$perm->permission_slug}";
    } else {
        // Permission slug is simple
        $key = "{$perm->module_slug}.{$perm->submodule_slug}.{$perm->permission_slug}";
    }
    echo "  - {$key}\n";
}

echo "\n=== Test Complete ===\n";
