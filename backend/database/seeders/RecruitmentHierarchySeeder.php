<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RecruitmentHierarchySeeder extends Seeder
{
    /**
     * Seed recruitment hierarchy permissions for default roles
     * 
     * UPDATED BUSINESS LOGIC (Nov 26, 2025):
     * - Control Department provides FINAL approval for all boarding (compliance/audit)
     * - HR can both board without approval AND approve boarding (supervisory role)
     * 
     * HIERARCHY LEVELS:
     * Level 0: Control (final approval - compliance/audit gate)
     * Level 1: Global Admin, Super Admin (highest authority - can do everything)
     * Level 2: HR, Regional Manager (supervisory - can board and approve)
     * Level 3: Recruitment (operational - can board, cannot approve)
     * Level 5: Recruitment Assistant (needs approval for everything)
     * 
     * WORKFLOW:
     * 1. Staff is boarded by Recruitment/HR/Regional Manager
     * 2. If boarder has can_board_without_approval → status: pending_control_approval
     * 3. Control Department reviews for compliance
     * 4. Control approves → status: active, staff can start work
     * 
     * This ensures compliance and audit trail while maintaining operational efficiency
     */
    public function run(): void
    {
        $hierarchyData = [
            // Control Department (role_id=6) - Final approval for compliance
            [
                'role_id' => 6,
                'can_create_request' => false,
                'can_approve_request' => false,
                'can_assign_ticket' => false,
                'can_board_without_approval' => false,
                'can_approve_boarding' => true, // FINAL approval authority
                'hierarchy_level' => 0, // HIGHEST level - compliance gate
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Global Admin (role_id=17) - Highest authority, all permissions
            [
                'role_id' => 17,
                'can_create_request' => true,
                'can_approve_request' => true,
                'can_assign_ticket' => true,
                'can_board_without_approval' => true,
                'can_approve_boarding' => true,
                'hierarchy_level' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Super Admin (role_id=1) - Highest authority, all permissions
            [
                'role_id' => 1,
                'can_create_request' => true,
                'can_approve_request' => true,
                'can_assign_ticket' => true,
                'can_board_without_approval' => true,
                'can_approve_boarding' => true,
                'hierarchy_level' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // HR (role_id=3) - Supervisory role
            // FIXED: HR can now board without approval (consistent with approval permission)
            [
                'role_id' => 3,
                'can_create_request' => false,
                'can_approve_request' => false,
                'can_assign_ticket' => false,
                'can_board_without_approval' => true, // CHANGED: HR is supervisory
                'can_approve_boarding' => true,
                'hierarchy_level' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Regional Manager (role_id=8) - Supervisory role
            [
                'role_id' => 8,
                'can_create_request' => true,
                'can_approve_request' => false,
                'can_assign_ticket' => true,
                'can_board_without_approval' => true,
                'can_approve_boarding' => true,
                'hierarchy_level' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Recruitment (role_id=7) - Operational role
            [
                'role_id' => 7,
                'can_create_request' => true,
                'can_approve_request' => false,
                'can_assign_ticket' => true,
                'can_board_without_approval' => true, // Can board, but goes to Control
                'can_approve_boarding' => false, // Cannot approve - operational only
                'hierarchy_level' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Recruitment Assistant (role_id=10) - Entry level
            [
                'role_id' => 10,
                'can_create_request' => false,
                'can_approve_request' => false,
                'can_assign_ticket' => false,
                'can_board_without_approval' => false,
                'can_approve_boarding' => false,
                'hierarchy_level' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert or update (in case seeder is run multiple times)
        foreach ($hierarchyData as $data) {
            DB::table('recruitment_hierarchy')->updateOrInsert(
                ['role_id' => $data['role_id']],
                $data
            );
        }

        $this->command->info('✓ Recruitment hierarchy permissions seeded for 7 roles');
        $this->command->info('  - Control (Level 0): FINAL approval for compliance/audit');
        $this->command->info('  - Global Admin (Level 1): All permissions');
        $this->command->info('  - Super Admin (Level 1): All permissions');
        $this->command->info('  - HR (Level 2): Board without approval + Approve boarding');
        $this->command->info('  - Regional Manager (Level 2): Board without approval + Approve boarding');
        $this->command->info('  - Recruitment (Level 3): Board without approval (goes to Control)');
        $this->command->info('  - Recruitment Assistant (Level 5): Needs approval');
        $this->command->info('');
        $this->command->warn('⚠ IMPORTANT: All boarding requires final Control approval for compliance');
    }
}
