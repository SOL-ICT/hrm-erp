<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Purpose: Create approval_history table - immutable audit trail
     * 
     * This table stores every action taken on an approval request.
     * It is append-only (no updates, no updated_at column) to maintain audit integrity.
     * 
     * Every approval, rejection, escalation, comment is logged here with full context.
     */
    public function up(): void
    {
        Schema::create('approval_history', function (Blueprint $table) {
            $table->id();
            
            // Link to the approval record
            $table->unsignedBigInteger('approval_id');
            
            // Action details
            $table->enum('action', [
                'submitted',
                'assigned', 
                'approved',
                'rejected',
                'escalated',
                'cancelled',
                'commented',
                'delegated',
                'level_completed'
            ])->comment('Type of action taken');
            
            // Actor info
            $table->unsignedBigInteger('action_by');
            $table->timestamp('action_at')->useCurrent();
            
            // Status transition
            $table->string('from_status', 50)->nullable();
            $table->string('to_status', 50)->nullable();
            
            // Workflow context
            $table->integer('approval_level')->nullable()->comment('Which level in the workflow');
            
            // Action context
            $table->text('comments')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Audit metadata
            $table->string('ip_address', 45)->nullable()->comment('IPv4 or IPv6 address');
            $table->text('user_agent')->nullable()->comment('Browser/device information');
            
            // Immutable record - only created_at, no updated_at
            $table->timestamp('created_at')->useCurrent();
            
            // Foreign keys
            $table->foreign('approval_id')->references('id')->on('approvals')->onDelete('cascade');
            $table->foreign('action_by')->references('id')->on('users')->onDelete('restrict');
            
            // Indexes
            $table->index('approval_id', 'idx_approval_id');
            $table->index('action_by', 'idx_action_by');
            $table->index('action_at', 'idx_action_at');
            $table->index('action', 'idx_action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_history');
    }
};
