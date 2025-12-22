<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Requisition Management Module Verification ===\n\n";

// Get module
$module = DB::table('modules')->where('slug', 'requisition-management')->first();
if ($module) {
    echo "✓ Module: {$module->name} (ID: {$module->id})\n\n";
} else {
    echo "✗ Module not found!\n";
    exit(1);
}

// Get submodules
echo "Submodules:\n";
$submodules = DB::table('submodules')->where('module_id', $module->id)->orderBy('sort_order')->get();
foreach ($submodules as $submodule) {
    echo "  - {$submodule->name} (slug: {$submodule->slug}, ID: {$submodule->id})\n";
    
    // Get permissions for this submodule
    $permissions = DB::table('permissions')->where('submodule_id', $submodule->id)->get();
    echo "    Permissions: " . $permissions->count() . "\n";
    foreach ($permissions as $permission) {
        echo "      • {$permission->name} ({$permission->slug})\n";
    }
    echo "\n";
}

// Get role assignments
echo "\n=== Role Permissions ===\n";
$roles = DB::table('roles')->whereIn('name', ['Super Admin', 'Global Admin', 'Admin Officer', 'Store Keeper', 'Staff'])->get();

foreach ($roles as $role) {
    $permissionCount = DB::table('role_permissions')
        ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
        ->whereIn('permissions.submodule_id', $submodules->pluck('id'))
        ->where('role_permissions.role_id', $role->id)
        ->count();
    
    echo "{$role->name}: {$permissionCount} permissions\n";
}

echo "\n✓ Verification complete!\n";
