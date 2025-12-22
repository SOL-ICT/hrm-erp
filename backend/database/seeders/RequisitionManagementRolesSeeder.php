<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RequisitionManagementRolesSeeder extends Seeder
{
    /**
     * Create roles specific to Requisition Management if they don't exist
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Store Keeper',
                'slug' => 'store-keeper',
                'description' => 'Manages store inventory and approves requisitions',
                'is_active' => true,
            ],
            [
                'name' => 'Admin Officer',
                'slug' => 'admin-officer',
                'description' => 'Administrative officer with oversight of requisitions',
                'is_active' => true,
            ],
        ];

        foreach ($roles as $role) {
            $existing = DB::table('roles')->where('slug', $role['slug'])->first();
            
            if (!$existing) {
                $roleId = DB::table('roles')->insertGetId([
                    'name' => $role['name'],
                    'slug' => $role['slug'],
                    'description' => $role['description'],
                    'is_active' => $role['is_active'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->command->info("✓ Created role: {$role['name']} (ID: {$roleId})");
            } else {
                $this->command->info("Role '{$role['name']}' already exists (ID: {$existing->id})");
            }
        }

        // Now assign permissions
        $this->assignPermissions();
    }

    private function assignPermissions()
    {
        // Get submodule IDs
        $moduleId = DB::table('modules')->where('slug', 'requisition-management')->value('id');
        if (!$moduleId) {
            $this->command->error('Requisition Management module not found!');
            return;
        }

        $submodules = DB::table('submodules')
            ->where('module_id', $moduleId)
            ->pluck('id', 'slug');

        // Get role IDs
        $adminOfficerRole = DB::table('roles')->where('name', 'Admin Officer')->first();
        $storeKeeperRole = DB::table('roles')->where('name', 'Store Keeper')->first();
        $adminRole = DB::table('roles')->where('name', 'Admin')->first(); // Using existing Admin role for staff-like permissions

        // Admin Officer: Full access to approve-requisition, requisition-history, inventory-management
        if ($adminOfficerRole && isset($submodules['approve-requisition'])) {
            $adminPermissions = DB::table('permissions')
                ->whereIn('submodule_id', [
                    $submodules['approve-requisition'],
                    $submodules['requisition-history'],
                    $submodules['inventory-management'],
                ])
                ->pluck('id');

            $count = 0;
            foreach ($adminPermissions as $permissionId) {
                if ($this->assignPermissionToRole($adminOfficerRole->id, $permissionId)) {
                    $count++;
                }
            }
            $this->command->info("✓ Assigned {$count} permissions to Admin Officer");
        }

        // Store Keeper: approve-requisition, inventory-management, view history
        if ($storeKeeperRole && isset($submodules['approve-requisition'])) {
            $storeKeeperPermissions = DB::table('permissions')
                ->whereIn('submodule_id', [
                    $submodules['approve-requisition'],
                    $submodules['inventory-management'],
                ])
                ->pluck('id')
                ->toArray();

            // Add requisition-history read permission only
            $historyReadPermission = DB::table('permissions')
                ->where('submodule_id', $submodules['requisition-history'])
                ->where('slug', 'requisition-history.read')
                ->first();

            if ($historyReadPermission) {
                $storeKeeperPermissions[] = $historyReadPermission->id;
            }

            $count = 0;
            foreach ($storeKeeperPermissions as $permissionId) {
                if ($this->assignPermissionToRole($storeKeeperRole->id, $permissionId)) {
                    $count++;
                }
            }
            $this->command->info("✓ Assigned {$count} permissions to Store Keeper");
        }

        // Admin role (general staff): create-requisition only
        if ($adminRole && isset($submodules['create-requisition'])) {
            $staffPermissions = DB::table('permissions')
                ->where('submodule_id', $submodules['create-requisition'])
                ->pluck('id');

            $count = 0;
            foreach ($staffPermissions as $permissionId) {
                if ($this->assignPermissionToRole($adminRole->id, $permissionId)) {
                    $count++;
                }
            }
            $this->command->info("✓ Assigned {$count} requisition creation permissions to Admin role");
        }
    }

    /**
     * Helper to assign permission to role if not already assigned
     * Returns true if assigned, false if already exists
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
            return true;
        }
        return false;
    }
}
