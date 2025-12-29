<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Purpose: Create approval_workflow_levels table - workflow step definitions
     * 
     * This table defines each level/step in an approval workflow.
     * For example, STAFF_BOARDING_2LEVEL workflow has:
     *   - Level 1: Supervisor Approval
     *   - Level 2: Control Approval
     * 
     * Supports role-based, user-based, or criteria-based approver assignment.
     */
    public function up(): void
    {
        Schema::create('approval_workflow_levels', function (Blueprint $table) {
            $table->id();
            
            // Link to workflow
            $table->unsignedBigInteger('workflow_id');
            
            // Level definition
            $table->integer('level_number')->comment('1, 2, 3, etc. - order of execution');
            $table->string('level_name', 200)->comment('Supervisor Approval, Finance Review, Control Approval, etc.');
            $table->text('description')->nullable();
            
            // Approver assignment (multiple options)
            $table->unsignedBigInteger('approver_role_id')->nullable()->comment('Assign to specific role');
            $table->unsignedBigInteger('approver_user_id')->nullable()->comment('Assign to specific user');
            $table->json('approver_criteria')->nullable()->comment('Dynamic criteria: {"hierarchy_level": "<=2", "department": "Finance"}');
            
            // Parallel approval settings (when multiple approvers at same level)
            $table->boolean('requires_all_approvers')->default(false)->comment('True = all must approve, False = any one can approve');
            $table->integer('minimum_approvers')->default(1)->comment('Minimum number of approvals required');
            
            // SLA and escalation
            $table->integer('sla_hours')->default(24)->comment('Expected response time');
            $table->boolean('escalation_enabled')->default(true);
            $table->integer('escalation_hours')->nullable()->comment('Hours before escalation (defaults to 2x SLA)');
            $table->unsignedBigInteger('escalation_role_id')->nullable()->comment('Role to escalate to');
            
            // Conditional logic
            $table->json('skip_conditions')->nullable()->comment('Conditions to skip this level: {"amount": "<10000"}');
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('workflow_id')->references('id')->on('approval_workflows')->onDelete('cascade');
            $table->foreign('approver_role_id')->references('id')->on('roles')->onDelete('set null');
            $table->foreign('approver_user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('escalation_role_id')->references('id')->on('roles')->onDelete('set null');
            
            // Unique constraint - only one definition per level per workflow
            $table->unique(['workflow_id', 'level_number'], 'unique_workflow_level');
            
            // Indexes
            $table->index('workflow_id', 'idx_workflow_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_workflow_levels');
    }
};
