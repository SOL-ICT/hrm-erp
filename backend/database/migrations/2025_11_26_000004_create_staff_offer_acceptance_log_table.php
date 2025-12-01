<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Migration: Create staff_offer_acceptance_log table for audit trail
     * 
     * PURPOSE: Track all offer acceptance related actions for compliance and audit
     * 
     * ACTIONS TRACKED:
     * - sent: Offer letter sent to staff
     * - accepted: Staff accepted the offer
     * - rejected: Staff rejected the offer
     * - suspended: Staff suspended due to non-acceptance (14 days)
     * - terminated: Staff terminated due to non-acceptance (30 days)
     * - reminded: Reminder email sent to staff
     * 
     * METADATA EXAMPLES:
     * - email_sent: true/false
     * - reminder_count: 1, 2, 3
     * - days_since_sent: 11, 14, 27, 30
     * - previous_status: 'active', 'inactive'
     */
    public function up(): void
    {
        Schema::create('staff_offer_acceptance_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('staff_id');

            // Action performed
            $table->enum('action', ['sent', 'accepted', 'rejected', 'suspended', 'terminated', 'reminded'])
                ->comment('Type of action performed');

            // Additional context
            $table->text('notes')->nullable()
                ->comment('Additional notes or context');

            // Who performed the action (null for system actions)
            $table->unsignedBigInteger('actioned_by')->nullable()
                ->comment('User who performed action, null for system/cron actions');

            // Extra metadata as JSON
            $table->json('metadata')->nullable()
                ->comment('Additional data like email_sent, reminder_count, etc.');

            $table->timestamp('created_at')->useCurrent()
                ->comment('When the action occurred');

            // Indexes for querying
            $table->index('staff_id', 'idx_offer_log_staff_id');
            $table->index('action', 'idx_offer_log_action');
            $table->index('created_at', 'idx_offer_log_created_at');

            // Foreign keys
            $table->foreign('staff_id', 'fk_offer_log_staff_id')
                ->references('id')
                ->on('staff')
                ->onDelete('cascade');

            $table->foreign('actioned_by', 'fk_offer_log_actioned_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_offer_acceptance_log');
    }
};
