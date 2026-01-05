<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Fix recruitment request approval workflow configuration:
     * 1. Change approval_type from 'request_creation' to 'recruitment_request'
     * 2. Set approver_criteria for hierarchy-based approval lookup
     *
     * @return void
     */
    public function up()
    {
        // Step 1: Fix approval_type in approval_workflows table
        DB::table('approval_workflows')
            ->where('id', 1)
            ->where('workflow_name', 'Recruitment Request Creation Approval')
            ->update([
                'approval_type' => 'recruitment_request',
                'updated_at' => now(),
            ]);

        // Step 2: Set approver_criteria for workflow level 1
        // This configures hierarchy-based approver lookup:
        // - Finds users with higher authority (lower hierarchy_level) than requester
        // - Checks for can_approve_request permission in recruitment_hierarchy table
        DB::table('approval_workflow_levels')
            ->where('id', 1)
            ->where('workflow_id', 1)
            ->where('level_number', 1)
            ->update([
                'approver_criteria' => json_encode([
                    'hierarchy_check' => 'higher_than_requester',
                    'permission_required' => 'can_approve_request',
                ]),
                'updated_at' => now(),
            ]);

        // Log the changes
        \Log::info('Recruitment request approval workflow fixed', [
            'workflow_id' => 1,
            'approval_type' => 'recruitment_request',
            'approver_criteria' => [
                'hierarchy_check' => 'higher_than_requester',
                'permission_required' => 'can_approve_request',
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Rollback Step 2: Clear approver_criteria
        DB::table('approval_workflow_levels')
            ->where('id', 1)
            ->where('workflow_id', 1)
            ->where('level_number', 1)
            ->update([
                'approver_criteria' => json_encode([
                    'hierarchy_check' => 'higher_than_requester',
                    'same_department' => true,
                ]),
                'updated_at' => now(),
            ]);

        // Rollback Step 1: Restore original approval_type
        DB::table('approval_workflows')
            ->where('id', 1)
            ->where('workflow_name', 'Recruitment Request Creation Approval')
            ->update([
                'approval_type' => 'request_creation',
                'updated_at' => now(),
            ]);

        \Log::info('Recruitment request approval workflow rollback completed', [
            'workflow_id' => 1,
            'approval_type' => 'request_creation',
        ]);
    }
};
