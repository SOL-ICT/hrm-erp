<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserManagementPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder adds the User Management submodule and its permissions
     * to the Administration module.
     */
    public function run(): void
    {
        // Get Administration module ID
        $administrationModule = DB::table('modules')
            ->where('slug', 'administration')
            ->first();

        if (!$administrationModule) {
            $this->command->error('Administration module not found!');
            return;
        }

        // Check if user-management submodule already exists
        $existingSubmodule = DB::table('submodules')
            ->where('slug', 'user-management')
            ->first();

        if ($existingSubmodule) {
            $this->command->info('User Management submodule already exists (ID: ' . $existingSubmodule->id . ')');
            $submoduleId = $existingSubmodule->id;
        } else {
            // Get the highest sort_order for administration submodules
            $maxSortOrder = DB::table('submodules')
                ->where('module_id', $administrationModule->id)
                ->max('sort_order') ?? 0;

            // Create user-management submodule
            $submoduleId = DB::table('submodules')->insertGetId([
                'module_id' => $administrationModule->id,
                'name' => 'User Management',
                'slug' => 'user-management',
                'description' => 'Manage SOL staff users, roles, and permissions',
                'sort_order' => $maxSortOrder + 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info('Created User Management submodule (ID: ' . $submoduleId . ')');
        }

        // Define permissions for user-management
        $permissions = [
            ['name' => 'Read', 'slug' => 'read', 'description' => 'View user list and details'],
            ['name' => 'Create', 'slug' => 'create', 'description' => 'Create new users'],
            ['name' => 'Update', 'slug' => 'update', 'description' => 'Edit existing users'],
            ['name' => 'Delete', 'slug' => 'delete', 'description' => 'Delete users'],
            ['name' => 'Read', 'slug' => 'user-management.read', 'description' => 'View user management page'],
            ['name' => 'Update', 'slug' => 'user-management.update', 'description' => 'Update user details'],
            ['name' => 'Reset Password', 'slug' => 'user-management.reset-password', 'description' => 'Reset user passwords'],
            ['name' => 'View History', 'slug' => 'user-management.view-history', 'description' => 'View user role change history'],
        ];

        $insertedCount = 0;
        $existingCount = 0;

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
                $insertedCount++;
            } else {
                $existingCount++;
            }
        }

        $this->command->info("User Management Permissions: {$insertedCount} created, {$existingCount} already existed");

        // Assign all user-management permissions to Super Admin role (role_id = 1)
        $superAdminRole = DB::table('roles')->where('id', 1)->first();
        
        if ($superAdminRole) {
            $permissionIds = DB::table('permissions')
                ->where('submodule_id', $submoduleId)
                ->pluck('id')
                ->toArray();

            $assignedCount = 0;
            foreach ($permissionIds as $permissionId) {
                $exists = DB::table('role_permissions')
                    ->where('role_id', 1)
                    ->where('permission_id', $permissionId)
                    ->exists();

                if (!$exists) {
                    DB::table('role_permissions')->insert([
                        'role_id' => 1,
                        'permission_id' => $permissionId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $assignedCount++;
                }
            }

            $this->command->info("Assigned {$assignedCount} permissions to Super Admin role");
        }

        $this->command->info('✅ User Management module setup complete!');
    }
}
