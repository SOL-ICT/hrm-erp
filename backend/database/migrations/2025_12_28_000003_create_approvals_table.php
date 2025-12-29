<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Purpose: Create approvals table - master approval records
     * 
     * This table stores all approval requests across the system with polymorphic
     * relationships to any approvable entity (Staff, RecruitmentRequest, Claim, Contract, etc.)
     * 
     * Each record represents one approval request that may go through multiple workflow levels.
     */
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            
            // Polymorphic relationship to any approvable entity
            $table->string('approvable_type')->comment('Model class: App\\Models\\Staff, App\\Models\\Claim, etc.');
            $table->unsignedBigInteger('approvable_id')->comment('ID of the approvable entity');
            
            // Approval metadata
            $table->string('approval_type', 100)->comment('staff_boarding, claim_submission, contract_approval, etc.');
            $table->string('module_name', 100)->comment('recruitment, claims, contracts, payroll, etc.');
            
            // Requester info
            $table->unsignedBigInteger('requested_by');
            $table->timestamp('requested_at')->useCurrent();
            
            // Current status
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled', 'escalated'])->default('pending');
            
            // Current approver (changes as workflow progresses)
            $table->unsignedBigInteger('current_approver_id')->nullable();
            $table->integer('current_approval_level')->default(1)->comment('Current workflow level (1, 2, 3, etc.)');
            
            // Priority and urgency
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->boolean('is_overdue')->default(false);
            $table->timestamp('due_date')->nullable();
            
            // Workflow tracking
            $table->unsignedBigInteger('workflow_id')->nullable()->comment('Links to approval_workflows table');
            $table->integer('total_approval_levels')->default(1);
            
            // Metadata (snapshot of request details)
            $table->json('request_data')->nullable();
            $table->text('notes')->nullable();
            
            // Completion tracking
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('completed_by')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('current_approver_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('completed_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('workflow_id')->references('id')->on('approval_workflows')->onDelete('set null');
            
            // Indexes
            $table->index(['approvable_type', 'approvable_id'], 'idx_approvable');
            $table->index('status', 'idx_status');
            $table->index('current_approver_id', 'idx_current_approver');
            $table->index(['module_name', 'approval_type'], 'idx_module_type');
            $table->index('requested_by', 'idx_requested_by');
            $table->index('is_overdue', 'idx_is_overdue');
            $table->index('created_at', 'idx_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
