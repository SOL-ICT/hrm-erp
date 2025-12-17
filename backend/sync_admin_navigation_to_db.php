<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Capsule\Manager as Capsule;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

/**
 * Sync AdminNavigation structure to database
 * This script updates the database to match exactly what's in AdminNavigation.jsx
 */

echo "🔄 SYNCING ADMIN NAVIGATION TO DATABASE\n";
echo "=====================================\n\n";

// AdminNavigation structure (extracted from AdminNavigation.jsx)
$navigationConfig = [
    [
        'id' => 'dashboard',
        'name' => 'Dashboard',
        'slug' => 'dashboard',
        'icon' => '📊',
        'type' => 'single',
        'description' => 'Main administrative dashboard',
        'sort_order' => 1
    ],
    [
        'id' => 'client-contract-management',
        'name' => 'Contract Management Module',
        'slug' => 'client-contract-management',
        'icon' => '📋',
        'type' => 'module',
        'description' => 'Client relationships and contracts',
        'sort_order' => 2,
        'submodules' => [
            ['id' => 'client-master', 'name' => 'Master Setup', 'route' => '/admin/client-contract-management/client-master', 'sort_order' => 1],
            ['id' => 'client-service-location', 'name' => 'Service Location', 'route' => '/admin/client-contract-management/client-service-location', 'sort_order' => 2],
            ['id' => 'salary-structure', 'name' => 'Job Function Setup', 'route' => '/admin/client-contract-management/salary-structure', 'sort_order' => 3],
        ]
    ],
    [
        'id' => 'recruitment-management',
        'name' => 'Recruitment Management',
        'slug' => 'recruitment-management',
        'icon' => '👥',
        'type' => 'module',
        'description' => 'Recruitment and candidate management',
        'sort_order' => 3,
        'submodules' => [
            ['id' => 'recruitment-request', 'name' => 'Vacancy Declaration', 'route' => '/admin/recruitment-management/recruitment-request', 'sort_order' => 1],
            ['id' => 'check-blacklist', 'name' => 'Check Blacklist', 'route' => '/admin/recruitment-management/check-blacklist', 'sort_order' => 2],
            ['id' => 'screening-management', 'name' => 'Screening Management', 'route' => '/admin/recruitment-management/screening-management', 'sort_order' => 3],
            ['id' => 'interview', 'name' => 'Interview', 'route' => '/admin/recruitment-management/interview', 'sort_order' => 4],
            ['id' => 'boarding', 'name' => 'Boarding', 'route' => '/admin/recruitment-management/boarding', 'sort_order' => 5],
            ['id' => 'reports', 'name' => 'Reports', 'route' => '/admin/recruitment-management/reports', 'sort_order' => 6],
        ]
    ],
    [
        'id' => 'hr-payroll-management',
        'name' => 'HR & Payroll Management',
        'slug' => 'hr-payroll-management',
        'icon' => '💼',
        'type' => 'module',
        'description' => 'Human resources and payroll management',
        'sort_order' => 4,
        'submodules' => [
            ['id' => 'employee-record', 'name' => 'Employee Record', 'route' => '/admin/hr-payroll-management/employee-record', 'sort_order' => 1],
            ['id' => 'employee-management', 'name' => 'Employee Management', 'route' => '/admin/hr-payroll-management/employee-management', 'sort_order' => 2],
            ['id' => 'payroll-processing', 'name' => 'Payroll Processing', 'route' => '/admin/hr-payroll-management/payroll-processing', 'sort_order' => 3],
            ['id' => 'attendance-tracking', 'name' => 'Attendance Tracking', 'route' => '/admin/hr-payroll-management/attendance-tracking', 'sort_order' => 4],
            ['id' => 'leave-management', 'name' => 'Leave Management', 'route' => '/admin/hr-payroll-management/leave-management', 'sort_order' => 5],
            ['id' => 'performance-review', 'name' => 'Performance Review', 'route' => '/admin/hr-payroll-management/performance-review', 'sort_order' => 6],
            ['id' => 'invoicing', 'name' => 'Invoicing', 'route' => '/admin/hr-payroll-management/invoicing', 'sort_order' => 7],
        ]
    ],
    [
        'id' => 'claims',
        'name' => 'Claims',
        'slug' => 'claims',
        'icon' => '⚖️',
        'type' => 'module',
        'description' => 'Claims resolution and management',
        'sort_order' => 5,
        'submodules' => [
            ['id' => 'claims-resolution', 'name' => 'Claims Resolution', 'route' => '/admin/claims/claims-resolution', 'sort_order' => 1],
            ['id' => 'claims-resolution-list', 'name' => 'Claims Resolution List', 'route' => '/admin/claims/claims-resolution-list', 'sort_order' => 2],
            ['id' => 'policy-management', 'name' => 'Policy Management', 'route' => '/admin/claims/policy-management', 'sort_order' => 3],
        ]
    ],
    [
        'id' => 'requisition-management',
        'name' => 'Requisition Management',
        'slug' => 'requisition-management',
        'icon' => '📝',
        'type' => 'module',
        'description' => 'Staff requisition and approvals',
        'sort_order' => 6,
        'submodules' => [
            ['id' => 'create-requisition', 'name' => 'Create Requisition', 'route' => '/admin/requisition-management/create-requisition', 'sort_order' => 1],
            ['id' => 'approve-requisition', 'name' => 'Approve Requisition', 'route' => '/admin/requisition-management/approve-requisition', 'sort_order' => 2],
            ['id' => 'requisition-history', 'name' => 'Requisition History', 'route' => '/admin/requisition-management/requisition-history', 'sort_order' => 3],
        ]
    ],
    [
        'id' => 'procurement-management',
        'name' => 'Procurement Management',
        'slug' => 'procurement-management',
        'icon' => '📦',
        'type' => 'module',
        'description' => 'Procurement and vendor management',
        'sort_order' => 7,
        'submodules' => [
            ['id' => 'vendor-management', 'name' => 'Vendor Management', 'route' => '/admin/procurement-management/vendor-management', 'sort_order' => 1],
            ['id' => 'purchase-orders', 'name' => 'Purchase Orders', 'route' => '/admin/procurement-management/purchase-orders', 'sort_order' => 2],
            ['id' => 'inventory-tracking', 'name' => 'Inventory Tracking', 'route' => '/admin/procurement-management/inventory-tracking', 'sort_order' => 3],
        ]
    ],
    [
        'id' => 'business-development',
        'name' => 'Business Development',
        'slug' => 'business-development',
        'icon' => '📈',
        'type' => 'module',
        'description' => 'Business growth and development',
        'sort_order' => 8,
        'submodules' => [
            ['id' => 'lead-management', 'name' => 'Lead Management', 'route' => '/admin/business-development/lead-management', 'sort_order' => 1],
            ['id' => 'opportunity-tracking', 'name' => 'Opportunity Tracking', 'route' => '/admin/business-development/opportunity-tracking', 'sort_order' => 2],
            ['id' => 'market-analysis', 'name' => 'Market Analysis', 'route' => '/admin/business-development/market-analysis', 'sort_order' => 3],
        ]
    ],
    [
        'id' => 'administration',
        'name' => 'Administration',
        'slug' => 'administration',
        'icon' => '⚙️',
        'type' => 'module',
        'description' => 'System administration and settings',
        'sort_order' => 9,
        'submodules' => [
            ['id' => 'sol-master', 'name' => 'SOL Master', 'route' => '/admin/administration/sol-master', 'sort_order' => 1],
            ['id' => 'user-management', 'name' => 'User Management', 'route' => '/admin/administration/user-management', 'sort_order' => 2],
            ['id' => 'rbac-management', 'name' => 'Roles & Permissions', 'route' => '/admin/administration/rbac-management', 'sort_order' => 3],
            ['id' => 'system-settings', 'name' => 'System Settings', 'route' => '/admin/administration/system-settings', 'sort_order' => 4],
            ['id' => 'audit-logs', 'name' => 'Audit Logs', 'route' => '/admin/administration/audit-logs', 'sort_order' => 5],
        ]
    ],
];

try {
    DB::beginTransaction();

    echo "🗑️  Step 1: Cleaning existing modules/submodules/permissions...\n";

    // Delete existing data (cascade will handle submodules and permissions)
    DB::statement('SET FOREIGN_KEY_CHECKS=0');
    DB::table('role_permissions')->truncate();
    DB::table('user_permissions')->truncate();
    DB::table('permissions')->truncate();
    DB::table('submodules')->truncate();
    DB::table('modules')->truncate();
    DB::statement('SET FOREIGN_KEY_CHECKS=1');

    echo "✅ Cleaned existing data\n\n";

    echo "📝 Step 2: Inserting new modules and submodules...\n";

    foreach ($navigationConfig as $moduleData) {
        // Insert module
        $moduleId = DB::table('modules')->insertGetId([
            'name' => $moduleData['name'],
            'slug' => $moduleData['slug'],
            'description' => $moduleData['description'],
            'icon' => $moduleData['icon'] ?? null,
            'sort_order' => $moduleData['sort_order'],
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        echo "  ✓ Module: {$moduleData['name']} (ID: {$moduleId})\n";

        // Insert submodules if they exist
        if (isset($moduleData['submodules'])) {
            foreach ($moduleData['submodules'] as $submoduleData) {
                $submoduleId = DB::table('submodules')->insertGetId([
                    'module_id' => $moduleId,
                    'name' => $submoduleData['name'],
                    'slug' => $submoduleData['id'],
                    'description' => $submoduleData['name'],
                    'route' => $submoduleData['route'] ?? null,
                    'sort_order' => $submoduleData['sort_order'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                echo "    ➤ Submodule: {$submoduleData['name']} (ID: {$submoduleId})\n";
            }
        }
    }

    echo "\n🔑 Step 3: Creating standard permissions for all submodules...\n";

    $permissionTypes = ['read', 'write', 'delete', 'full'];
    $permissionDescriptions = [
        'read' => 'View and access content',
        'write' => 'Create and modify content',
        'delete' => 'Remove content',
        'full' => 'Complete administrative access'
    ];

    $submodules = DB::table('submodules')->get();
    foreach ($submodules as $submodule) {
        foreach ($permissionTypes as $permissionType) {
            DB::table('permissions')->insert([
                'submodule_id' => $submodule->id,
                'name' => ucfirst($permissionType),
                'slug' => $permissionType,
                'description' => $permissionDescriptions[$permissionType],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        echo "    ✓ Created 4 permissions for: {$submodule->name}\n";
    }

    echo "\n🎯 Step 4: Setting up default permissions for key roles...\n";

    // Get key roles
    $superAdminRole = DB::table('roles')->where('slug', 'super-admin')->first();
    $adminRole = DB::table('roles')->where('slug', 'admin')->first();
    $globalAdminRole = DB::table('roles')->where('slug', 'global-admin')->first();

    // Get all permissions
    $allPermissions = DB::table('permissions')->pluck('id')->toArray();

    // Super Admin and Global Admin get ALL permissions
    if ($superAdminRole) {
        foreach ($allPermissions as $permissionId) {
            DB::table('role_permissions')->insert([
                'role_id' => $superAdminRole->id,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        echo "  ✅ Super Admin: Full access to all modules\n";
    }

    if ($globalAdminRole) {
        foreach ($allPermissions as $permissionId) {
            DB::table('role_permissions')->insert([
                'role_id' => $globalAdminRole->id,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        echo "  ✅ Global Admin: Full access to all modules\n";
    }

    // Admin gets most permissions except some sensitive areas
    if ($adminRole) {
        $adminPermissions = DB::table('permissions')
            ->join('submodules', 'permissions.submodule_id', '=', 'submodules.id')
            ->where('submodules.slug', '!=', 'rbac-management') // No RBAC access for regular admin
            ->where('submodules.slug', '!=', 'audit-logs') // No audit log access
            ->pluck('permissions.id')
            ->toArray();

        foreach ($adminPermissions as $permissionId) {
            DB::table('role_permissions')->insert([
                'role_id' => $adminRole->id,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        echo "  ✅ Admin: Access to most modules (excluding RBAC & Audit)\n";
    }

    DB::commit();

    echo "\n🎉 SYNC COMPLETED SUCCESSFULLY!\n";
    echo "=====================================\n";

    // Show summary
    $moduleCount = DB::table('modules')->count();
    $submoduleCount = DB::table('submodules')->count();
    $permissionCount = DB::table('permissions')->count();
    $rolePermissionCount = DB::table('role_permissions')->count();

    echo "📊 Final Summary:\n";
    echo "  • Modules: {$moduleCount}\n";
    echo "  • Submodules: {$submoduleCount}\n";
    echo "  • Permissions: {$permissionCount}\n";
    echo "  • Role-Permission Assignments: {$rolePermissionCount}\n\n";

    echo "✅ Database now matches AdminNavigation structure exactly!\n";
    echo "✅ RBAC system is ready for use!\n\n";
} catch (\Exception $e) {
    DB::rollback();
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Transaction rolled back.\n";
    exit(1);
}
