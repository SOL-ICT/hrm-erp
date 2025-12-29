<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ApprovalWorkflowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Purpose: Seed initial recruitment workflows into centralized approval system
     * 
     * Creates 3 workflows:
     * 1. RECRUITMENT_REQUEST_CREATION - Single supervisor approval for ticket creation
     * 2. TICKET_ASSIGNMENT - Assignee acceptance workflow
     * 3. STAFF_BOARDING_2LEVEL - Two-level boarding approval (Supervisor → Control)
     */
    public function run(): void
    {
        $now = Carbon::now();

        // ===============================================
        // Workflow 1: Recruitment Request Creation
        // ===============================================
        $recruitmentRequestWorkflowId = DB::table('approval_workflows')->insertGetId([
            'workflow_name' => 'Recruitment Request Creation Approval',
            'workflow_code' => 'RECRUITMENT_REQUEST_CREATION',
            'module_name' => 'recruitment',
            'approval_type' => 'request_creation',
            'description' => 'Single-level approval for users who cannot create recruitment requests directly',
            'workflow_type' => 'sequential',
            'total_levels' => 1,
            'activation_conditions' => json_encode([
                'user_can_create_without_approval' => false
            ]),
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Level 1: Supervisor Approval
        DB::table('approval_workflow_levels')->insert([
            'workflow_id' => $recruitmentRequestWorkflowId,
            'level_number' => 1,
            'level_name' => 'Supervisor Approval',
            'description' => 'Immediate supervisor must approve request creation',
            'approver_criteria' => json_encode([
                'hierarchy_check' => 'higher_than_requester',
                'same_department' => true,
            ]),
            'requires_all_approvers' => false,
            'minimum_approvers' => 1,
            'sla_hours' => 24,
            'escalation_enabled' => true,
            'escalation_hours' => 48,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ===============================================
        // Workflow 2: Ticket Assignment
        // ===============================================
        $ticketAssignmentWorkflowId = DB::table('approval_workflows')->insertGetId([
            'workflow_name' => 'Ticket Assignment Acceptance',
            'workflow_code' => 'TICKET_ASSIGNMENT',
            'module_name' => 'recruitment',
            'approval_type' => 'ticket_assignment',
            'description' => 'Assignee must accept/reject ticket assignment',
            'workflow_type' => 'sequential',
            'total_levels' => 1,
            'activation_conditions' => json_encode([
                'requires_assignee_acceptance' => true
            ]),
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Level 1: Assignee Acceptance
        DB::table('approval_workflow_levels')->insert([
            'workflow_id' => $ticketAssignmentWorkflowId,
            'level_number' => 1,
            'level_name' => 'Assignee Acceptance',
            'description' => 'Assigned user must accept the assignment',
            'approver_criteria' => json_encode([
                'approver_type' => 'assignee',
            ]),
            'requires_all_approvers' => false,
            'minimum_approvers' => 1,
            'sla_hours' => 24,
            'escalation_enabled' => true,
            'escalation_hours' => 48,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ===============================================
        // Workflow 3: Staff Boarding - Two Level Approval
        // ===============================================
        $staffBoardingWorkflowId = DB::table('approval_workflows')->insertGetId([
            'workflow_name' => 'Staff Boarding Two-Level Approval',
            'workflow_code' => 'STAFF_BOARDING_2LEVEL',
            'module_name' => 'recruitment',
            'approval_type' => 'staff_boarding',
            'description' => 'Two-level sequential approval: Supervisor then Control Department',
            'workflow_type' => 'sequential',
            'total_levels' => 2,
            'activation_conditions' => json_encode([
                'user_can_board_without_approval' => false
            ]),
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Level 1: Supervisor Approval
        DB::table('approval_workflow_levels')->insert([
            'workflow_id' => $staffBoardingWorkflowId,
            'level_number' => 1,
            'level_name' => 'Supervisor Approval',
            'description' => 'Direct supervisor or higher authority approves boarding request',
            'approver_criteria' => json_encode([
                'hierarchy_check' => 'higher_than_requester',
                'permission_required' => 'can_approve_boarding',
            ]),
            'requires_all_approvers' => false,
            'minimum_approvers' => 1,
            'sla_hours' => 48,
            'escalation_enabled' => true,
            'escalation_hours' => 96,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Level 2: Control Department Approval
        DB::table('approval_workflow_levels')->insert([
            'workflow_id' => $staffBoardingWorkflowId,
            'level_number' => 2,
            'level_name' => 'Control Approval',
            'description' => 'Control Department (hierarchy level 0) provides final approval',
            'approver_criteria' => json_encode([
                'hierarchy_level' => 0,
                'department' => 'Control',
                'permission_required' => 'can_approve_boarding',
            ]),
            'requires_all_approvers' => false,
            'minimum_approvers' => 1,
            'sla_hours' => 48,
            'escalation_enabled' => true,
            'escalation_hours' => 96,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->command->info('✅ Seeded 3 recruitment workflows:');
        $this->command->info("   - RECRUITMENT_REQUEST_CREATION (ID: {$recruitmentRequestWorkflowId})");
        $this->command->info("   - TICKET_ASSIGNMENT (ID: {$ticketAssignmentWorkflowId})");
        $this->command->info("   - STAFF_BOARDING_2LEVEL (ID: {$staffBoardingWorkflowId})");
        $this->command->info('✅ Seeded 5 workflow levels across all workflows');
    }
}
