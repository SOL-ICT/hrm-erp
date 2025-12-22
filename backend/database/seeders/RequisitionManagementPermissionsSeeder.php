<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RequisitionManagementPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder adds the Requisition Management module with its submodules and permissions
     * and assigns them to appropriate roles.
     */
    public function run(): void
    {
        // Check if requisition-management module already exists
        $existingModule = DB::table('modules')
            ->where('slug', 'requisition-management')
            ->first();

        if ($existingModule) {
            $this->command->info('Requisition Management module already exists (ID: ' . $existingModule->id . ')');
            $moduleId = $existingModule->id;
        } else {
            // Get the highest sort_order
            $maxSortOrder = DB::table('modules')->max('sort_order') ?? 0;

            // Create requisition-management module
            $moduleId = DB::table('modules')->insertGetId([
                'name' => 'Requisition Management',
                'slug' => 'requisition-management',
                'description' => 'Staff requisition and approvals system',
                'icon' => '📦',
                'sort_order' => $maxSortOrder + 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info('Created Requisition Management module (ID: ' . $moduleId . ')');
        }

        // Define submodules
        $submodules = [
            [
                'name' => 'Create Requisition',
                'slug' => 'create-requisition',
                'description' => 'Create and track staff requisition requests',
                'sort_order' => 1,
            ],
            [
                'name' => 'Approve Requisition',
                'slug' => 'approve-requisition',
                'description' => 'Review, approve/reject requisitions and manage collections',
                'sort_order' => 2,
            ],
            [
                'name' => 'Requisition History',
                'slug' => 'requisition-history',
                'description' => 'View complete audit trail of all requisitions',
                'sort_order' => 3,
            ],
            [
                'name' => 'Inventory Management',
                'slug' => 'inventory-management',
                'description' => 'Manage store inventory items and stock levels',
                'sort_order' => 4,
            ],
        ];

        $submoduleIds = [];
        foreach ($submodules as $submodule) {
            $existing = DB::table('submodules')
                ->where('module_id', $moduleId)
                ->where('slug', $submodule['slug'])
                ->first();

            if ($existing) {
                $this->command->info("Submodule '{$submodule['name']}' already exists");
                $submoduleIds[$submodule['slug']] = $existing->id;
            } else {
                $submoduleId = DB::table('submodules')->insertGetId([
                    'module_id' => $moduleId,
                    'name' => $submodule['name'],
                    'slug' => $submodule['slug'],
                    'description' => $submodule['description'],
                    'sort_order' => $submodule['sort_order'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $submoduleIds[$submodule['slug']] = $submoduleId;
                $this->command->info("Created submodule: {$submodule['name']}");
            }
        }

        // Define permissions for each submodule
        $permissionsMap = [
            'create-requisition' => [
                ['name' => 'Read', 'slug' => 'create-requisition.read', 'description' => 'View requisition creation interface'],
                ['name' => 'Create', 'slug' => 'create-requisition.create', 'description' => 'Submit new requisition requests'],
                ['name' => 'View Own', 'slug' => 'create-requisition.view-own', 'description' => 'View own requisitions'],
                ['name' => 'Cancel', 'slug' => 'create-requisition.cancel', 'description' => 'Cancel pending requisitions'],
            ],
            'approve-requisition' => [
                ['name' => 'Read', 'slug' => 'approve-requisition.read', 'description' => 'View pending requisitions'],
                ['name' => 'Approve', 'slug' => 'approve-requisition.approve', 'description' => 'Approve requisition requests'],
                ['name' => 'Reject', 'slug' => 'approve-requisition.reject', 'description' => 'Reject requisition requests'],
                ['name' => 'Mark Ready', 'slug' => 'approve-requisition.mark-ready', 'description' => 'Mark items ready for collection'],
                ['name' => 'Mark Collected', 'slug' => 'approve-requisition.mark-collected', 'description' => 'Mark items as collected'],
            ],
            'requisition-history' => [
                ['name' => 'Read', 'slug' => 'requisition-history.read', 'description' => 'View requisition history'],
                ['name' => 'Export', 'slug' => 'requisition-history.export', 'description' => 'Export requisition data'],
                ['name' => 'View All', 'slug' => 'requisition-history.view-all', 'description' => 'View all departments requisitions'],
            ],
            'inventory-management' => [
                ['name' => 'Read', 'slug' => 'inventory-management.read', 'description' => 'View inventory items'],
                ['name' => 'Create', 'slug' => 'inventory-management.create', 'description' => 'Add new inventory items'],
                ['name' => 'Update', 'slug' => 'inventory-management.update', 'description' => 'Edit inventory items'],
                ['name' => 'Delete', 'slug' => 'inventory-management.delete', 'description' => 'Delete inventory items'],
                ['name' => 'Restock', 'slug' => 'inventory-management.restock', 'description' => 'Restock inventory items'],
            ],
        ];

        $totalInserted = 0;
        $totalExisting = 0;

        foreach ($permissionsMap as $submoduleSlug => $permissions) {
            $submoduleId = $submoduleIds[$submoduleSlug];
            
            foreach ($permissions as $permission) {
                $exists = DB::table('permissions')
                    ->where('submodule_id', $submoduleId)
                    ->where('slug', $permission['slug'])
                    ->exists();

                if (!$exists) {
                    DB::table('permissions')->insert([
                        'submodule_id' => $submoduleId,
                        'name' => $permission['name'],
                        'slug' => $permission['slug'],
                        'description' => $permission['description'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $totalInserted++;
                } else {
                    $totalExisting++;
                }
            }
        }

        $this->command->info("Permissions: {$totalInserted} created, {$totalExisting} already existed");

        // Assign permissions to roles
        $this->assignPermissionsToRoles($submoduleIds);

        $this->command->info('✓ Requisition Management module setup complete');
    }

    /**
     * Assign permissions to appropriate roles
     */
    private function assignPermissionsToRoles($submoduleIds)
    {
        // Get role IDs
        $superAdminRole = DB::table('roles')->where('name', 'Super Admin')->orWhere('id', 1)->first();
        $globalAdminRole = DB::table('roles')->where('name', 'Global Admin')->orWhere('id', 17)->first();
        $adminOfficerRole = DB::table('roles')->where('name', 'Admin Officer')->first();
        $storeKeeperRole = DB::table('roles')->where('name', 'Store Keeper')->first();
        $staffRole = DB::table('roles')->where('name', 'Staff')->first();

        // Super Admin & Global Admin: Full access to everything
        foreach ([$superAdminRole, $globalAdminRole] as $role) {
            if ($role) {
                $allPermissions = DB::table('permissions')
                    ->whereIn('submodule_id', array_values($submoduleIds))
                    ->pluck('id');

                foreach ($allPermissions as $permissionId) {
                    $this->assignPermissionToRole($role->id, $permissionId);
                }
                $this->command->info("✓ Assigned all requisition permissions to {$role->name}");
            }
        }

        // Admin Officer: Full access to approve-requisition, requisition-history, inventory-management
        if ($adminOfficerRole) {
            $adminPermissions = DB::table('permissions')
                ->whereIn('submodule_id', [
                    $submoduleIds['approve-requisition'],
                    $submoduleIds['requisition-history'],
                    $submoduleIds['inventory-management'],
                ])
                ->pluck('id');

            foreach ($adminPermissions as $permissionId) {
                $this->assignPermissionToRole($adminOfficerRole->id, $permissionId);
            }
            $this->command->info("✓ Assigned approval and management permissions to Admin Officer");
        }

        // Store Keeper: approve-requisition, inventory-management, view history
        if ($storeKeeperRole) {
            $storeKeeperPermissions = DB::table('permissions')
                ->whereIn('submodule_id', [
                    $submoduleIds['approve-requisition'],
                    $submoduleIds['inventory-management'],
                ])
                ->pluck('id');

            // Add requisition-history read permission
            $historyReadPermission = DB::table('permissions')
                ->where('submodule_id', $submoduleIds['requisition-history'])
                ->where('slug', 'requisition-history.read')
                ->first();

            if ($historyReadPermission) {
                $storeKeeperPermissions[] = $historyReadPermission->id;
            }

            foreach ($storeKeeperPermissions as $permissionId) {
                $this->assignPermissionToRole($storeKeeperRole->id, $permissionId);
            }
            $this->command->info("✓ Assigned approval and inventory permissions to Store Keeper");
        }

        // Staff: create-requisition submodule only
        if ($staffRole) {
            $staffPermissions = DB::table('permissions')
                ->where('submodule_id', $submoduleIds['create-requisition'])
                ->pluck('id');

            foreach ($staffPermissions as $permissionId) {
                $this->assignPermissionToRole($staffRole->id, $permissionId);
            }
            $this->command->info("✓ Assigned requisition creation permissions to Staff");
        }
    }

    /**
     * Helper to assign permission to role if not already assigned
     */
    private function assignPermissionToRole($roleId, $permissionId)
    {
        $exists = DB::table('role_permissions')
            ->where('role_id', $roleId)
            ->where('permission_id', $permissionId)
            ->exists();

        if (!$exists) {
            DB::table('role_permissions')->insert([
                'role_id' => $roleId,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
