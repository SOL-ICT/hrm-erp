<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ApprovalManagementPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder adds:
     * 1. Approval Management module (centralized approval system)
     * 2. Ensures Procurement Management module RBAC is set up
     * 3. Ensures Staff Advance Management module RBAC is set up
     * And assigns them to appropriate roles.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Approval Management RBAC Setup...');
        
        // PART 1: Approval Management Module (NEW)
        $this->seedApprovalManagement();
        
        // PART 2: Ensure Procurement Management Module (if not already seeded)
        $this->ensureProcurementManagement();
        
        // PART 3: Ensure Staff Advance Management Module (if not already seeded)
        $this->ensureStaffAdvanceManagement();
        
        $this->command->info('✅ Approval Management RBAC Setup Complete!');
    }

    /**
     * Seed Approval Management Module
     */
    private function seedApprovalManagement(): void
    {
        $this->command->info("\n✅ Setting up Approval Management Module...");

        // Check if module exists
        $existingModule = DB::table('modules')
            ->where('slug', 'approval-management')
            ->first();

        if ($existingModule) {
            $this->command->info('Module already exists (ID: ' . $existingModule->id . ')');
            $moduleId = $existingModule->id;
        } else {
            $maxSortOrder = DB::table('modules')->max('sort_order') ?? 0;
            $moduleId = DB::table('modules')->insertGetId([
                'name' => 'Approval Center',
                'slug' => 'approval-management',
                'description' => 'Centralized approval management across all modules',
                'icon' => '✅',
                'sort_order' => $maxSortOrder + 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->command->info('✓ Created Approval Management module (ID: ' . $moduleId . ')');
        }

        // Define permissions for Approval Management (no submodules - it's a single page)
        $permissions = [
            [
                'name' => 'View Pending Approvals',
                'slug' => 'approval-management.view-pending',
                'description' => 'View approvals waiting for my action',
            ],
            [
                'name' => 'View Submitted Approvals',
                'slug' => 'approval-management.view-submitted',
                'description' => 'View my submitted approval requests',
            ],
            [
                'name' => 'View Delegated Approvals',
                'slug' => 'approval-management.view-delegated',
                'description' => 'View approvals delegated to me',
            ],
            [
                'name' => 'Approve Requests',
                'slug' => 'approval-management.approve',
                'description' => 'Approve pending approval requests',
            ],
            [
                'name' => 'Reject Requests',
                'slug' => 'approval-management.reject',
                'description' => 'Reject approval requests with reason',
            ],
            [
                'name' => 'Add Comments',
                'slug' => 'approval-management.comment',
                'description' => 'Add comments to approval requests',
            ],
            [
                'name' => 'Escalate Approvals',
                'slug' => 'approval-management.escalate',
                'description' => 'Escalate approvals to higher authority',
            ],
            [
                'name' => 'Cancel Approvals',
                'slug' => 'approval-management.cancel',
                'description' => 'Cancel own approval requests',
            ],
            [
                'name' => 'View Statistics',
                'slug' => 'approval-management.view-stats',
                'description' => 'View approval statistics and analytics',
            ],
            [
                'name' => 'View All Approvals',
                'slug' => 'approval-management.view-all',
                'description' => 'View all approvals across modules (Admin only)',
            ],
            [
                'name' => 'Manage Workflows',
                'slug' => 'approval-management.manage-workflows',
                'description' => 'Configure approval workflows (Super Admin only)',
            ],
            [
                'name' => 'Manage Policies',
                'slug' => 'approval-management.manage-policies',
                'description' => 'Configure approval policies (Super Admin only)',
            ],
            [
                'name' => 'Manage Delegation',
                'slug' => 'approval-management.manage-delegation',
                'description' => 'Create and manage approval delegations',
            ],
        ];

        $permissionIds = [];
        foreach ($permissions as $permission) {
            $existing = DB::table('permissions')
                ->where('slug', $permission['slug'])
                ->first();

            if ($existing) {
                $permissionIds[$permission['slug']] = $existing->id;
                $this->command->info("  ✓ Permission '{$permission['name']}' already exists");
            } else {
                // For module-level permissions (no submodules), we need to create a virtual submodule
                // or link directly. Let's check if we need a default submodule for this module.
                $defaultSubmodule = DB::table('submodules')
                    ->where('module_id', $moduleId)
                    ->where('slug', 'approval-dashboard')
                    ->first();
                
                if (!$defaultSubmodule) {
                    // Create a default submodule for approval center
                    $submoduleId = DB::table('submodules')->insertGetId([
                        'module_id' => $moduleId,
                        'name' => 'Approval Dashboard',
                        'slug' => 'approval-dashboard',
                        'description' => 'Centralized approval dashboard',
                        'sort_order' => 1,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $this->command->info("  ✓ Created default submodule for approval permissions");
                } else {
                    $submoduleId = $defaultSubmodule->id;
                }

                $permissionId = DB::table('permissions')->insertGetId([
                    'name' => $permission['name'],
                    'slug' => $permission['slug'],
                    'description' => $permission['description'],
                    'submodule_id' => $submoduleId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $permissionIds[$permission['slug']] = $permissionId;
                $this->command->info("  ✓ Created permission: {$permission['name']}");
            }
        }

        // Assign permissions to roles
        $this->assignApprovalPermissionsToRoles($permissionIds);
    }

    /**
     * Assign Approval Management permissions to roles
     */
    private function assignApprovalPermissionsToRoles(array $permissionIds): void
    {
        $this->command->info("\n🔐 Assigning Approval Management permissions to roles...");

        // Get role IDs
        $roles = [
            'super_admin' => DB::table('roles')->where('slug', 'super-admin')->value('id'),
            'admin' => DB::table('roles')->where('slug', 'admin')->value('id'),
            'manager' => DB::table('roles')->where('slug', 'manager')->value('id'),
            'staff' => DB::table('roles')->where('slug', 'staff')->value('id'),
        ];

        // Super Admin - ALL permissions
        if ($roles['super_admin']) {
            foreach ($permissionIds as $permissionId) {
                DB::table('role_permissions')->insertOrIgnore([
                    'role_id' => $roles['super_admin'],
                    'permission_id' => $permissionId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            $this->command->info("  ✓ Assigned ALL permissions to Super Admin");
        }

        // Admin - All except workflow/policy management
        if ($roles['admin']) {
            $adminPermissions = [
                'approval-management.view-pending',
                'approval-management.view-submitted',
                'approval-management.view-delegated',
                'approval-management.approve',
                'approval-management.reject',
                'approval-management.comment',
                'approval-management.escalate',
                'approval-management.cancel',
                'approval-management.view-stats',
                'approval-management.view-all',
                'approval-management.manage-delegation',
            ];

            foreach ($adminPermissions as $permSlug) {
                if (isset($permissionIds[$permSlug])) {
                    DB::table('role_permissions')->insertOrIgnore([
                        'role_id' => $roles['admin'],
                        'permission_id' => $permissionIds[$permSlug],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            $this->command->info("  ✓ Assigned " . count($adminPermissions) . " permissions to Admin");
        }

        // Manager - View and action permissions
        if ($roles['manager']) {
            $managerPermissions = [
                'approval-management.view-pending',
                'approval-management.view-submitted',
                'approval-management.view-delegated',
                'approval-management.approve',
                'approval-management.reject',
                'approval-management.comment',
                'approval-management.escalate',
                'approval-management.cancel',
                'approval-management.view-stats',
                'approval-management.manage-delegation',
            ];

            foreach ($managerPermissions as $permSlug) {
                if (isset($permissionIds[$permSlug])) {
                    DB::table('role_permissions')->insertOrIgnore([
                        'role_id' => $roles['manager'],
                        'permission_id' => $permissionIds[$permSlug],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            $this->command->info("  ✓ Assigned " . count($managerPermissions) . " permissions to Manager");
        }

        // Staff - Basic view and submit permissions
        if ($roles['staff']) {
            $staffPermissions = [
                'approval-management.view-submitted',
                'approval-management.comment',
                'approval-management.cancel',
            ];

            foreach ($staffPermissions as $permSlug) {
                if (isset($permissionIds[$permSlug])) {
                    DB::table('role_permissions')->insertOrIgnore([
                        'role_id' => $roles['staff'],
                        'permission_id' => $permissionIds[$permSlug],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            $this->command->info("  ✓ Assigned " . count($staffPermissions) . " permissions to Staff");
        }
    }

    /**
     * Ensure Procurement Management Module is set up
     */
    private function ensureProcurementManagement(): void
    {
        $this->command->info("\n🛒 Checking Procurement Management Module...");

        $existingModule = DB::table('modules')
            ->where('slug', 'procurement-management')
            ->first();

        if ($existingModule) {
            $this->command->info("  ✓ Procurement Management module exists (ID: {$existingModule->id})");
            return;
        }

        $this->command->info("  ⚠️  Procurement Management module not found. Run ProcurementAdvanceManagementPermissionsSeeder");
    }

    /**
     * Ensure Staff Advance Management Module is set up
     */
    private function ensureStaffAdvanceManagement(): void
    {
        $this->command->info("\n💰 Checking Staff Advance Management Module...");

        $existingModule = DB::table('modules')
            ->where('slug', 'staff-advance-management')
            ->first();

        if ($existingModule) {
            $this->command->info("  ✓ Staff Advance Management module exists (ID: {$existingModule->id})");
            return;
        }

        $this->command->info("  ⚠️  Staff Advance Management module not found. Run ProcurementAdvanceManagementPermissionsSeeder");
    }
}
