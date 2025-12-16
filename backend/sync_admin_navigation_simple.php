<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔄 SYNCING ADMIN NAVIGATION TO DATABASE\n";
echo "=====================================\n\n";

// AdminNavigation configuration matching the frontend structure
$navigationConfig = [
    [
        'id' => 'dashboard',
        'name' => 'Dashboard',
        'slug' => 'dashboard',
        'icon' => '📊',
        'type' => 'module',
        'description' => 'Main administrative dashboard',
        'sort_order' => 1,
        'submodules' => [
            ['id' => 'overview', 'name' => 'Dashboard Overview', 'route' => '/admin/dashboard', 'sort_order' => 1],
        ]
    ],
    [
        'id' => 'client-contract-management',
        'name' => 'Contract Management Module',
        'slug' => 'client-contract-management',
        'icon' => '📋',
        'type' => 'module',
        'description' => 'Contract management and setup',
        'sort_order' => 2,
        'submodules' => [
            ['id' => 'client-master', 'name' => 'Master Setup', 'route' => '/admin/client-contract-management/client-master', 'sort_order' => 1],
            ['id' => 'service-location', 'name' => 'Service Location', 'route' => '/admin/client-contract-management/service-location', 'sort_order' => 2],
            ['id' => 'job-function-setup', 'name' => 'Job Function Setup', 'route' => '/admin/client-contract-management/job-function-setup', 'sort_order' => 3],
        ]
    ],
    [
        'id' => 'recruitment',
        'name' => 'Recruitment Management',
        'slug' => 'recruitment',
        'icon' => '👥',
        'type' => 'module',
        'description' => 'Recruitment and hiring processes',
        'sort_order' => 3,
        'submodules' => [
            ['id' => 'vacancy-declaration', 'name' => 'Vacancy Declaration', 'route' => '/admin/recruitment/vacancy-declaration', 'sort_order' => 1],
            ['id' => 'check-blacklist', 'name' => 'Check Blacklist', 'route' => '/admin/recruitment/check-blacklist', 'sort_order' => 2],
            ['id' => 'screening-management', 'name' => 'Screening Management', 'route' => '/admin/recruitment/screening-management', 'sort_order' => 3],
            ['id' => 'interview', 'name' => 'Interview', 'route' => '/admin/recruitment/interview', 'sort_order' => 4],
            ['id' => 'boarding', 'name' => 'Boarding', 'route' => '/admin/recruitment/boarding', 'sort_order' => 5],
            ['id' => 'reports', 'name' => 'Reports', 'route' => '/admin/recruitment/reports', 'sort_order' => 6],
        ]
    ],
    [
        'id' => 'hr-payroll',
        'name' => 'HR & Payroll Management',
        'slug' => 'hr-payroll',
        'icon' => '💼',
        'type' => 'module',
        'description' => 'Human resources and payroll management',
        'sort_order' => 4,
        'submodules' => [
            ['id' => 'employee-record', 'name' => 'Employee Record', 'route' => '/admin/hr-payroll/employee-record', 'sort_order' => 1],
            ['id' => 'employee-management', 'name' => 'Employee Management', 'route' => '/admin/hr-payroll/employee-management', 'sort_order' => 2],
            ['id' => 'payroll-processing', 'name' => 'Payroll Processing', 'route' => '/admin/hr-payroll/payroll-processing', 'sort_order' => 3],
            ['id' => 'attendance-tracking', 'name' => 'Attendance Tracking', 'route' => '/admin/hr-payroll/attendance-tracking', 'sort_order' => 4],
            ['id' => 'leave-management', 'name' => 'Leave Management', 'route' => '/admin/hr-payroll/leave-management', 'sort_order' => 5],
            ['id' => 'performance-review', 'name' => 'Performance Review', 'route' => '/admin/hr-payroll/performance-review', 'sort_order' => 6],
            ['id' => 'invoicing', 'name' => 'Invoicing', 'route' => '/admin/hr-payroll/invoicing', 'sort_order' => 7],
        ]
    ],
    [
        'id' => 'claims',
        'name' => 'Claims',
        'slug' => 'claims',
        'icon' => '🛡️',
        'type' => 'module',
        'description' => 'Claims resolution and management',
        'sort_order' => 5,
        'submodules' => [
            ['id' => 'claims-resolution', 'name' => 'Claims Resolution', 'route' => '/admin/claims/claims-resolution', 'sort_order' => 1],
            ['id' => 'claims-resolution-list', 'name' => 'Claims Resolution List', 'route' => '/admin/claims/claims-resolution-list', 'sort_order' => 2],
        ]
    ],
    [
        'id' => 'requisition',
        'name' => 'Requisition Management',
        'slug' => 'requisition',
        'icon' => '📝',
        'type' => 'module',
        'description' => 'Requisition creation and approval',
        'sort_order' => 6,
        'submodules' => [
            ['id' => 'create-requisition', 'name' => 'Create Requisition', 'route' => '/admin/requisition/create-requisition', 'sort_order' => 1],
            ['id' => 'approve-requisition', 'name' => 'Approve Requisition', 'route' => '/admin/requisition/approve-requisition', 'sort_order' => 2],
            ['id' => 'requisition-history', 'name' => 'Requisition History', 'route' => '/admin/requisition/requisition-history', 'sort_order' => 3],
        ]
    ],
    [
        'id' => 'procurement',
        'name' => 'Procurement Management',
        'slug' => 'procurement',
        'icon' => '🛒',
        'type' => 'module',
        'description' => 'Procurement and vendor management',
        'sort_order' => 7,
        'submodules' => [
            ['id' => 'vendor-management', 'name' => 'Vendor Management', 'route' => '/admin/procurement/vendor-management', 'sort_order' => 1],
            ['id' => 'purchase-orders', 'name' => 'Purchase Orders', 'route' => '/admin/procurement/purchase-orders', 'sort_order' => 2],
            ['id' => 'inventory-tracking', 'name' => 'Inventory Tracking', 'route' => '/admin/procurement/inventory-tracking', 'sort_order' => 3],
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
    echo "🗑️  Step 1: Cleaning existing modules/submodules/permissions...\n";

    // Delete existing data (cascade will handle submodules and permissions)
    DB::statement('SET FOREIGN_KEY_CHECKS=0');
    DB::table('role_permissions')->delete();
    DB::table('user_permissions')->delete();
    DB::table('permissions')->delete();
    DB::table('submodules')->delete();
    DB::table('modules')->delete();
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
        if (isset($moduleData['submodules']) && is_array($moduleData['submodules'])) {
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

    // Get all submodules
    $submodules = DB::table('submodules')->get();

    foreach ($submodules as $submodule) {
        // Create standard CRUD permissions for each submodule
        $permissions = [
            ['name' => 'Read', 'slug' => 'read', 'description' => 'View and access content'],
            ['name' => 'Create', 'slug' => 'create', 'description' => 'Create new entries'],
            ['name' => 'Update', 'slug' => 'update', 'description' => 'Edit existing entries'],
            ['name' => 'Delete', 'slug' => 'delete', 'description' => 'Remove entries'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->insert([
                'submodule_id' => $submodule->id,
                'name' => $permission['name'],
                'slug' => $permission['slug'],
                'description' => $permission['description'],
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

    // Super Admin gets ALL permissions
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

    // Global Admin gets ALL permissions
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

    // Regular Admin gets most permissions (excluding sensitive ones)
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
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
