<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProcurementAdvanceManagementPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder adds:
     * 1. Procurement Management module with 4 submodules
     * 2. Staff Advance Management module with 6 submodules
     * And assigns them to appropriate roles.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Procurement & Advance Management RBAC Setup...');
        
        // PART 1: Procurement Management Module
        $this->seedProcurementManagement();
        
        // PART 2: Staff Advance Management Module
        $this->seedStaffAdvanceManagement();
        
        $this->command->info('✅ Procurement & Advance Management RBAC Setup Complete!');
    }

    /**
     * Seed Procurement Management Module
     */
    private function seedProcurementManagement(): void
    {
        $this->command->info("\n📦 Setting up Procurement Management Module...");

        // Check if module exists
        $existingModule = DB::table('modules')
            ->where('slug', 'procurement-management')
            ->first();

        if ($existingModule) {
            $this->command->info('Module already exists (ID: ' . $existingModule->id . ')');
            $moduleId = $existingModule->id;
        } else {
            $maxSortOrder = DB::table('modules')->max('sort_order') ?? 0;
            $moduleId = DB::table('modules')->insertGetId([
                'name' => 'Procurement Management',
                'slug' => 'procurement-management',
                'description' => 'Manage purchase requests, procurement logs, vendors, and reports',
                'icon' => '🛒',
                'sort_order' => $maxSortOrder + 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->command->info('✓ Created Procurement Management module (ID: ' . $moduleId . ')');
        }

        // Define 4 submodules
        $submodules = [
            [
                'name' => 'Purchase Requests',
                'slug' => 'purchase-requests',
                'description' => 'Create and manage purchase requests',
                'sort_order' => 1,
            ],
            [
                'name' => 'Procurement Logging',
                'slug' => 'procurement-logging',
                'description' => 'Log received items and track procurement',
                'sort_order' => 2,
            ],
            [
                'name' => 'Vendor Management',
                'slug' => 'vendor-management',
                'description' => 'Manage vendor records and ratings',
                'sort_order' => 3,
            ],
            [
                'name' => 'Procurement Reports',
                'slug' => 'procurement-reports',
                'description' => 'View procurement analytics and reports',
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
        $this->assignProcurementPermissions($submoduleIds);
    }

    /**
     * Assign Procurement Management permissions to roles
     */
    private function assignProcurementPermissions(array $submoduleIds): void
    {
        $this->command->info("\n🔐 Assigning Procurement permissions to roles...");

        // Get roles
        $superAdminRole = DB::table('roles')->where('slug', 'super-admin')->first();
        $globalAdminRole = DB::table('roles')->where('slug', 'global-admin')->first();
        $storeKeeperRole = DB::table('roles')->where('slug', 'store-keeper')->first();
        $adminOfficerRole = DB::table('roles')->where('slug', 'admin-officer')->first();
        $financeDirectorRole = DB::table('roles')->where('slug', 'finance-director')->first();

        // Get all procurement permissions for admin roles
        $allProcurementPermissions = DB::table('permissions')
            ->whereIn('submodule_id', array_values($submoduleIds))
            ->pluck('id');

        // Super Admin: Full access to everything
        if ($superAdminRole) {
            foreach ($allProcurementPermissions as $permissionId) {
                $this->assignPermissionToRole($superAdminRole->id, $permissionId);
            }
            $this->command->info("  ✓ Super Admin: Full procurement access");
        }

        // Global Admin: Full access to everything
        if ($globalAdminRole) {
            foreach ($allProcurementPermissions as $permissionId) {
                $this->assignPermissionToRole($globalAdminRole->id, $permissionId);
            }
            $this->command->info("  ✓ Global Admin: Full procurement access");
        }

        // Store Keeper: Full access to all procurement submodules
        if ($storeKeeperRole) {
            foreach ($allProcurementPermissions as $permissionId) {
                $this->assignPermissionToRole($storeKeeperRole->id, $permissionId);
            }
            $this->command->info("  ✓ Store Keeper: Full procurement access");
        }

        // Admin Officer: Read access to all, write/update to purchase requests
        if ($adminOfficerRole) {
            // Read all
            $readPermissions = DB::table('permissions')
                ->whereIn('submodule_id', array_values($submoduleIds))
                ->where('slug', 'read')
                ->pluck('id');

            // Write/Update purchase requests
            $prPermissions = DB::table('permissions')
                ->where('submodule_id', $submoduleIds['purchase-requests'])
                ->whereIn('slug', ['write', 'update'])
                ->pluck('id');

            foreach ($readPermissions->merge($prPermissions) as $permissionId) {
                $this->assignPermissionToRole($adminOfficerRole->id, $permissionId);
            }
            $this->command->info("  ✓ Admin Officer: Read all + Purchase Request management");
        }

        // Finance Director: Read/Update access to all procurement
        if ($financeDirectorRole) {
            $fdPermissions = DB::table('permissions')
                ->whereIn('submodule_id', array_values($submoduleIds))
                ->whereIn('slug', ['read', 'update'])
                ->pluck('id');

            foreach ($fdPermissions as $permissionId) {
                $this->assignPermissionToRole($financeDirectorRole->id, $permissionId);
            }
            $this->command->info("  ✓ Finance Director: Read/Update procurement");
        }
    }

    /**
     * Seed Staff Advance Management Module
     */
    private function seedStaffAdvanceManagement(): void
    {
        $this->command->info("\n💰 Setting up Staff Advance Management Module...");

        // Check if module exists
        $existingModule = DB::table('modules')
            ->where('slug', 'staff-advance-management')
            ->first();

        if ($existingModule) {
            $this->command->info('Module already exists (ID: ' . $existingModule->id . ')');
            $moduleId = $existingModule->id;
        } else {
            $maxSortOrder = DB::table('modules')->max('sort_order') ?? 0;
            $moduleId = DB::table('modules')->insertGetId([
                'name' => 'Staff Advance Management',
                'slug' => 'staff-advance-management',
                'description' => 'Manage staff advances, approvals, disbursements, and retirements',
                'icon' => '💵',
                'sort_order' => $maxSortOrder + 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->command->info('✓ Created Staff Advance Management module (ID: ' . $moduleId . ')');
        }

        // Define 6 submodules
        $submodules = [
            [
                'name' => 'My Advances',
                'slug' => 'my-advances',
                'description' => 'Request and view personal advances',
                'sort_order' => 1,
            ],
            [
                'name' => 'Advance Approvals',
                'slug' => 'advance-approvals',
                'description' => 'Approve or reject advance requests',
                'sort_order' => 2,
            ],
            [
                'name' => 'Disbursement',
                'slug' => 'disbursement',
                'description' => 'Process approved advances for payment',
                'sort_order' => 3,
            ],
            [
                'name' => 'Retirement Submission',
                'slug' => 'retirement-submission',
                'description' => 'Submit expense reports and retirements',
                'sort_order' => 4,
            ],
            [
                'name' => 'Compliance Review',
                'slug' => 'compliance-review',
                'description' => 'Review and approve retirement submissions',
                'sort_order' => 5,
            ],
            [
                'name' => 'Budget Allocation',
                'slug' => 'budget-allocation',
                'description' => 'Allocate budgets to users',
                'sort_order' => 6,
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

        // Create 4 permissions for each submodule
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
        $this->assignAdvancePermissions($submoduleIds);
    }

    /**
     * Assign Staff Advance Management permissions to roles
     */
    private function assignAdvancePermissions(array $submoduleIds): void
    {
        $this->command->info("\n🔐 Assigning Advance permissions to roles...");

        // Get roles
        $superAdminRole = DB::table('roles')->where('slug', 'super-admin')->first();
        $globalAdminRole = DB::table('roles')->where('slug', 'global-admin')->first();
        $regionalOfficerRole = DB::table('roles')->where('slug', 'regional-officer')->first();
        $zonalOfficerRole = DB::table('roles')->where('slug', 'zonal-officer')->first();
        $adminOfficerRole = DB::table('roles')->where('slug', 'admin-officer')->first();
        $financeDirectorRole = DB::table('roles')->where('slug', 'finance-director')->first();
        $accountsRole = DB::table('roles')->where('slug', 'accounts')->first();
        $riskManagementRole = DB::table('roles')->where('slug', 'risk-management')->first();

        // Get all advance management permissions for admin roles
        $allAdvancePermissions = DB::table('permissions')
            ->whereIn('submodule_id', array_values($submoduleIds))
            ->pluck('id');

        // Super Admin: Full access to everything
        if ($superAdminRole) {
            foreach ($allAdvancePermissions as $permissionId) {
                $this->assignPermissionToRole($superAdminRole->id, $permissionId);
            }
            $this->command->info("  ✓ Super Admin: Full advance management access");
        }

        // Global Admin: Full access to everything
        if ($globalAdminRole) {
            foreach ($allAdvancePermissions as $permissionId) {
                $this->assignPermissionToRole($globalAdminRole->id, $permissionId);
            }
            $this->command->info("  ✓ Global Admin: Full advance management access");
        }

        // All staff: My Advances (read, write)
        $myAdvancesPermissions = DB::table('permissions')
            ->where('submodule_id', $submoduleIds['my-advances'])
            ->whereIn('slug', ['read', 'write'])
            ->pluck('id');

        // Regional Officer: Approve advances (level 1)
        if ($regionalOfficerRole) {
            $roPermissions = $myAdvancesPermissions->merge(
                DB::table('permissions')
                    ->where('submodule_id', $submoduleIds['advance-approvals'])
                    ->whereIn('slug', ['read', 'update'])
                    ->pluck('id')
            );

            foreach ($roPermissions as $permissionId) {
                $this->assignPermissionToRole($regionalOfficerRole->id, $permissionId);
            }
            $this->command->info("  ✓ Regional Officer: My Advances + Level 1 Approvals");
        }

        // Zonal Officer: Approve advances (level 2)
        if ($zonalOfficerRole) {
            $zoPermissions = $myAdvancesPermissions->merge(
                DB::table('permissions')
                    ->where('submodule_id', $submoduleIds['advance-approvals'])
                    ->whereIn('slug', ['read', 'update'])
                    ->pluck('id')
            );

            foreach ($zoPermissions as $permissionId) {
                $this->assignPermissionToRole($zonalOfficerRole->id, $permissionId);
            }
            $this->command->info("  ✓ Zonal Officer: My Advances + Level 2 Approvals");
        }

        // Admin Officer: Approve advances (level 3)
        if ($adminOfficerRole) {
            $aoPermissions = $myAdvancesPermissions->merge(
                DB::table('permissions')
                    ->where('submodule_id', $submoduleIds['advance-approvals'])
                    ->whereIn('slug', ['read', 'update'])
                    ->pluck('id')
            );

            foreach ($aoPermissions as $permissionId) {
                $this->assignPermissionToRole($adminOfficerRole->id, $permissionId);
            }
            $this->command->info("  ✓ Admin Officer: My Advances + Level 3 Approvals");
        }

        // Finance Director: Final approval + Budget Allocation
        if ($financeDirectorRole) {
            $fdPermissions = $myAdvancesPermissions
                ->merge(
                    DB::table('permissions')
                        ->where('submodule_id', $submoduleIds['advance-approvals'])
                        ->whereIn('slug', ['read', 'update'])
                        ->pluck('id')
                )
                ->merge(
                    DB::table('permissions')
                        ->where('submodule_id', $submoduleIds['budget-allocation'])
                        ->pluck('id')
                );

            foreach ($fdPermissions as $permissionId) {
                $this->assignPermissionToRole($financeDirectorRole->id, $permissionId);
            }
            $this->command->info("  ✓ Finance Director: Full approvals + Budget Allocation");
        }

        // Accounts: Disbursement processing
        if ($accountsRole) {
            $accountsPermissions = DB::table('permissions')
                ->whereIn('submodule_id', [
                    $submoduleIds['disbursement'],
                ])
                ->pluck('id');

            foreach ($accountsPermissions as $permissionId) {
                $this->assignPermissionToRole($accountsRole->id, $permissionId);
            }
            $this->command->info("  ✓ Accounts: Disbursement processing");
        }

        // Risk Management: Compliance Review
        if ($riskManagementRole) {
            $rmPermissions = DB::table('permissions')
                ->whereIn('submodule_id', [
                    $submoduleIds['compliance-review'],
                ])
                ->pluck('id');

            foreach ($rmPermissions as $permissionId) {
                $this->assignPermissionToRole($riskManagementRole->id, $permissionId);
            }
            $this->command->info("  ✓ Risk Management: Compliance Review");
        }

        // All advance users: Retirement Submission
        $retirementPermissions = DB::table('permissions')
            ->where('submodule_id', $submoduleIds['retirement-submission'])
            ->whereIn('slug', ['read', 'write'])
            ->pluck('id');

        $allAdvanceRoles = [
            $regionalOfficerRole,
            $zonalOfficerRole,
            $adminOfficerRole,
            $financeDirectorRole,
        ];

        foreach ($allAdvanceRoles as $role) {
            if ($role) {
                foreach ($retirementPermissions as $permissionId) {
                    $this->assignPermissionToRole($role->id, $permissionId);
                }
            }
        }
        $this->command->info("  ✓ All advance users: Retirement Submission");
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
