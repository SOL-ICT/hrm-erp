<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * PURPOSE: Create master approvals table for centralized approval system
     * 
     * ARCHITECTURE: Module-specific approvals with shared infrastructure
     * - Each module (Boarding, Contracts, Claims, etc.) has separate approval UI
     * - This table provides shared data structure for all modules
     * - Polymorphic relationships allow linking to any approvable entity
     * 
     * KEY FEATURES:
     * - Polymorphic morphTo relationship (approvable_type + approvable_id)
     * - Module and approval type tracking for filtering
     * - Workflow integration via workflow_id
     * - Current approver tracking as workflow progresses
     * - Priority and urgency management
     * - Metadata storage in JSON for flexibility
     */
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            
            // Polymorphic relationship to any approvable entity
            $table->string('approvable_type', 255); // 'App\Models\Staff', 'App\Models\Contract', etc.
            $table->unsignedBigInteger('approvable_id');
            
            // Approval metadata - for filtering by module
            $table->string('approval_type', 100); // 'staff_boarding', 'contract_creation', 'claim_submission'
            $table->string('module_name', 100); // 'boarding', 'contracts', 'claims'
            
            // Requester information
            $table->unsignedBigInteger('requested_by');
            $table->timestamp('requested_at')->useCurrent();
            
            // Current status
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'cancelled',
                'escalated'
            ])->default('pending');
            
            // Current approver (changes as workflow progresses through levels)
            $table->unsignedBigInteger('current_approver_id')->nullable();
            $table->integer('current_approval_level')->default(1); // 1st level, 2nd level, etc.
            
            // Priority and urgency
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->boolean('is_overdue')->default(false);
            $table->timestamp('due_date')->nullable();
            
            // Workflow tracking
            $table->unsignedBigInteger('workflow_id')->nullable();
            $table->integer('total_approval_levels')->default(1);
            
            // Flexible metadata storage (module-specific data)
            $table->json('request_data')->nullable(); // Snapshot of request details
            $table->text('notes')->nullable();
            
            // Completion tracking
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('completed_by')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('requested_by')
                ->references('id')
                ->on('users')
                ->onDelete('restrict');
            
            $table->foreign('current_approver_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
            
            $table->foreign('completed_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
            
            $table->foreign('workflow_id')
                ->references('id')
                ->on('approval_workflows')
                ->onDelete('set null');
            
            // Indexes for performance
            $table->index(['approvable_type', 'approvable_id'], 'idx_approvals_approvable');
            $table->index('status', 'idx_approvals_status');
            $table->index('current_approver_id', 'idx_approvals_current_approver');
            $table->index(['module_name', 'approval_type'], 'idx_approvals_module_type');
            $table->index('requested_by', 'idx_approvals_requested_by');
            $table->index('is_overdue', 'idx_approvals_is_overdue');
            $table->index('created_at', 'idx_approvals_created_at');
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
