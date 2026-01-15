<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LeaveManagementPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * This seeder adds:
     * 1. Leave Management module with 4 submodules
     * And assigns them to appropriate roles.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Leave Management RBAC Setup...');

        // Setup Leave Management module
        $this->seedLeaveManagement();

        $this->command->info('✅ Leave Management RBAC Setup Complete!');
    }

    /**
     * Seed Leave Management Module
     */
    private function seedLeaveManagement(): void
    {
        $this->command->info("\n📅 Setting up Leave Management Submodules under HR & Payroll Management...");

        // Get the existing HR & Payroll Management module
        $existingModule = DB::table('modules')
            ->where('slug', 'hr-payroll-management')
            ->first();

        if (!$existingModule) {
            $this->command->error('❌ HR & Payroll Management module not found! Please ensure it exists in the database.');
            return;
        }

        $moduleId = $existingModule->id;
        $this->command->info('✓ Found HR & Payroll Management module (ID: ' . $moduleId . ')');

        // Define 4 submodules
        $submodules = [
            [
                'name' => 'Leave Policies',
                'slug' => 'leave-policies',
                'description' => 'Configure leave types, entitlements, and policies',
                'sort_order' => 1,
            ],
            [
                'name' => 'Leave Management',
                'slug' => 'leave-management',
                'description' => 'Manage and approve staff leave applications',
                'sort_order' => 2,
            ],
            [
                'name' => 'Attendance Tracking',
                'slug' => 'attendance-tracking',
                'description' => 'Track staff attendance records',
                'sort_order' => 3,
            ],
            [
                'name' => 'Leave Reports',
                'slug' => 'leave-reports',
                'description' => 'View leave analytics and reports',
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
                $submoduleIds[$submodule['slug']] = $existing->id;
                $this->command->info("  ✓ Submodule '{$submodule['name']}' already exists");
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
                $this->command->info("  ✓ Created submodule: {$submodule['name']}");
            }
        }

        // Create 4 permissions (read, write, update, delete) for each submodule
        $permissionTypes = ['read', 'write', 'update', 'delete'];
        $permissionDescriptions = [
            'read' => 'View records',
            'write' => 'Create new records',
            'update' => 'Modify existing records',
            'delete' => 'Remove records',
        ];

        foreach ($submoduleIds as $slug => $submoduleId) {
            foreach ($permissionTypes as $type) {
                $existing = DB::table('permissions')
                    ->where('submodule_id', $submoduleId)
                    ->where('slug', $type)
                    ->first();

                if (!$existing) {
                    DB::table('permissions')->insert([
                        'submodule_id' => $submoduleId,
                        'name' => ucfirst($type),
                        'slug' => $type,
                        'description' => $permissionDescriptions[$type],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            $this->command->info("  ✓ Created/verified 4 permissions for: " . str_replace('-', ' ', $slug));
        }

        // Assign permissions to roles
        $this->assignLeavePermissions($submoduleIds);
    }

    /**
     * Assign Leave Management permissions to roles
     */
    private function assignLeavePermissions(array $submoduleIds): void
    {
        $this->command->info("\n🔐 Assigning Leave permissions to roles...");

        // Get roles
        $superAdminRole = DB::table('roles')->where('slug', 'super-admin')->first();
        $globalAdminRole = DB::table('roles')->where('slug', 'global-admin')->first();
        $hrManagerRole = DB::table('roles')->where('slug', 'hr-manager')->first();
        $regionalofficerRole = DB::table('roles')->where('slug', 'regional-officer')->first();
        $zonalOfficerRole = DB::table('roles')->where('slug', 'zonal-officer')->first();
        $adminOfficerRole = DB::table('roles')->where('slug', 'admin-officer')->first();
        $supervisorRole = DB::table('roles')->where('slug', 'supervisor')->first();
        $hrOfficerRole = DB::table('roles')->where('slug', 'hr-officer')->first();

        // Get all leave permissions
        $allLeavePermissions = DB::table('permissions')
            ->whereIn('submodule_id', array_values($submoduleIds))
            ->pluck('id');

        // Super Admin: Full access to everything
        if ($superAdminRole) {
            foreach ($allLeavePermissions as $permissionId) {
                $this->assignPermissionToRole($superAdminRole->id, $permissionId);
            }
            $this->command->info("  ✓ Super Admin: Full leave management access");
        }

        // Global Admin: Full access to everything
        if ($globalAdminRole) {
            foreach ($allLeavePermissions as $permissionId) {
                $this->assignPermissionToRole($globalAdminRole->id, $permissionId);
            }
            $this->command->info("  ✓ Global Admin: Full leave management access");
        }

        // HR Manager: Full access to all leave management
        if ($hrManagerRole) {
            foreach ($allLeavePermissions as $permissionId) {
                $this->assignPermissionToRole($hrManagerRole->id, $permissionId);
            }
            $this->command->info("  ✓ HR Manager: Full leave management access");
        }

        // HR Officer: Read all + Write/Update on Leave Management & Leave Policies
        if ($hrOfficerRole) {
            // Read all
            $readPermissions = DB::table('permissions')
                ->whereIn('submodule_id', array_values($submoduleIds))
                ->where('slug', 'read')
                ->pluck('id');

            // Write/Update Leave Management & Leave Policies
            $leavePermissions = DB::table('permissions')
                ->whereIn('submodule_id', [
                    $submoduleIds['leave-management'],
                    $submoduleIds['leave-policies'],
                ])
                ->whereIn('slug', ['write', 'update'])
                ->pluck('id');

            foreach ($readPermissions->merge($leavePermissions) as $permissionId) {
                $this->assignPermissionToRole($hrOfficerRole->id, $permissionId);
            }
            $this->command->info("  ✓ HR Officer: Read all + Leave Management & Policies management");
        }

        // Regional Officer: Read all + Update Leave Management
        if ($regionalofficerRole) {
            $roPermissions = DB::table('permissions')
                ->whereIn('submodule_id', array_values($submoduleIds))
                ->where('slug', 'read')
                ->pluck('id')
                ->merge(
                    DB::table('permissions')
                        ->where('submodule_id', $submoduleIds['leave-management'])
                        ->where('slug', 'update')
                        ->pluck('id')
                );

            foreach ($roPermissions as $permissionId) {
                $this->assignPermissionToRole($regionalofficerRole->id, $permissionId);
            }
            $this->command->info("  ✓ Regional Officer: Read all + Leave approval");
        }

        // Zonal Officer: Read all + Update Leave Management
        if ($zonalOfficerRole) {
            $zoPermissions = DB::table('permissions')
                ->whereIn('submodule_id', array_values($submoduleIds))
                ->where('slug', 'read')
                ->pluck('id')
                ->merge(
                    DB::table('permissions')
                        ->where('submodule_id', $submoduleIds['leave-management'])
                        ->where('slug', 'update')
                        ->pluck('id')
                );

            foreach ($zoPermissions as $permissionId) {
                $this->assignPermissionToRole($zonalOfficerRole->id, $permissionId);
            }
            $this->command->info("  ✓ Zonal Officer: Read all + Leave approval");
        }

        // Admin Officer: Read all + Update Leave Management
        if ($adminOfficerRole) {
            $aoPermissions = DB::table('permissions')
                ->whereIn('submodule_id', array_values($submoduleIds))
                ->where('slug', 'read')
                ->pluck('id')
                ->merge(
                    DB::table('permissions')
                        ->where('submodule_id', $submoduleIds['leave-management'])
                        ->where('slug', 'update')
                        ->pluck('id')
                );

            foreach ($aoPermissions as $permissionId) {
                $this->assignPermissionToRole($adminOfficerRole->id, $permissionId);
            }
            $this->command->info("  ✓ Admin Officer: Read all + Leave approval");
        }

        // Supervisor: Read Leave Management + Update (approve/reject leaves)
        if ($supervisorRole) {
            $supPermissions = DB::table('permissions')
                ->where('submodule_id', $submoduleIds['leave-management'])
                ->whereIn('slug', ['read', 'update'])
                ->pluck('id');

            foreach ($supPermissions as $permissionId) {
                $this->assignPermissionToRole($supervisorRole->id, $permissionId);
            }
            $this->command->info("  ✓ Supervisor: Leave Management + Approval");
        }
    }

    /**
     * Helper to assign permission to role (prevent duplicates)
     */
    private function assignPermissionToRole(int $roleId, int $permissionId): void
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
