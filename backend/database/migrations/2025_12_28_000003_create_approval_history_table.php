<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create approval_history table
 * 
 * Purpose:
 * Immutable audit trail for all approval actions. Every state change, comment,
 * or assignment is recorded here with full context (who, when, why).
 * 
 * Key Design Decisions:
 * - NO UPDATES: This is a write-only table. Once an entry is created, it should
 *   never be modified or deleted (except for admin data corrections).
 * - NO updated_at: Only created_at timestamp since records are immutable.
 * - Comprehensive Context: Captures IP address, user agent, and comments for
 *   forensic analysis and compliance.
 * - Sequential History: Order by created_at to reconstruct exact sequence of events.
 * 
 * Module-Specific Usage:
 * - Boarding: Tracks supervisor approval, control approval, rejections
 * - Contracts: Tracks HR approval, legal review, final sign-off
 * - Claims: Tracks manager approval, finance approval, disbursement
 * 
 * Each module queries this table filtered by approval_id to show approval chain/timeline.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_history', function (Blueprint $table) {
            // Core references
            $table->id();
            $table->unsignedBigInteger('approval_id'); // FK to approvals table
            
            // Action details
            $table->enum('action', [
                'submitted',    // Initial submission for approval
                'assigned',     // Assigned to specific approver
                'approved',     // Approved at current level
                'rejected',     // Rejected by approver
                'escalated',    // Escalated to higher authority
                'cancelled',    // Cancelled by requester
                'commented',    // Comment added without status change
                'delegated',    // Approval delegated to another user
                'returned'      // Returned to requester for clarification
            ])->comment('Type of action performed');
            
            $table->unsignedBigInteger('action_by'); // FK to users table - who performed action
            $table->timestamp('action_at')->useCurrent(); // When action was performed
            
            // Status tracking
            $table->string('from_status', 50)->nullable()->comment('Status before this action');
            $table->string('to_status', 50)->nullable()->comment('Status after this action');
            $table->integer('approval_level')->nullable()->comment('Which workflow level acted (1, 2, 3, etc)');
            
            // Additional context
            $table->text('comments')->nullable()->comment('Optional comments from approver/actor');
            $table->text('rejection_reason')->nullable()->comment('Required when action=rejected');
            $table->string('ip_address', 45)->nullable()->comment('IPv4 or IPv6 address of actor');
            $table->text('user_agent')->nullable()->comment('Browser/device information');
            
            // Metadata
            $table->json('metadata')->nullable()->comment('Additional context (delegation details, escalation reason, etc)');
            
            // Timestamps - NOTE: Only created_at, no updated_at (immutable records)
            $table->timestamp('created_at')->useCurrent();
            
            // Foreign keys
            $table->foreign('approval_id')
                ->references('id')
                ->on('approvals')
                ->onDelete('cascade') // Delete history when approval is deleted
                ->comment('Link to parent approval record');
                
            $table->foreign('action_by')
                ->references('id')
                ->on('users')
                ->onDelete('restrict') // Cannot delete user with history records
                ->comment('User who performed the action');
            
            // Indexes for performance
            $table->index('approval_id', 'idx_approval_history_approval');
            $table->index('action_by', 'idx_approval_history_actor');
            $table->index('action_at', 'idx_approval_history_date');
            $table->index(['approval_id', 'action'], 'idx_approval_history_approval_action');
        });
        
        // Add helpful comment to table
        DB::statement("ALTER TABLE approval_history COMMENT = 'Immutable audit trail for all approval actions. Records every state change with full context (who, when, why). Used by all modules for approval timeline and compliance reporting.'");
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_history');
    }
};
