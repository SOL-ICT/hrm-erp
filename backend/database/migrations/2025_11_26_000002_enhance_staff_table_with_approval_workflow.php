<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Migration: Add boarding approval workflow and offer acceptance tracking to staff table
     * 
     * PURPOSE: 
     * 1. Track boarding approval status for staff created by assigned users
     * 2. Track offer acceptance status for new staff
     * 3. Automate suspension/termination for non-acceptance
     * 
     * ADDED COLUMNS:
     * Boarding Approval (6 columns):
     * - recruitment_request_id: Links staff to recruitment ticket
     * - boarding_approval_status: pending, approved, rejected, auto_approved
     * - approved_by: Who approved the boarding
     * - approved_at: When boarding was approved
     * - approval_notes: Notes from approver
     * - rejection_reason: Why boarding was rejected
     * 
     * Offer Acceptance (5 columns):
     * - offer_acceptance_status: not_applicable, sent, accepted, rejected, expired
     * - offer_sent_at: When offer letter was sent
     * - offer_accepted_at: When staff accepted offer
     * - offer_expires_at: Offer expiry date (14 days from sent)
     * - offer_already_accepted: For bulk upload - existing staff flag
     */
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Boarding Approval Workflow fields
            $table->unsignedBigInteger('recruitment_request_id')->nullable()->after('onboarded_by');
            $table->enum('boarding_approval_status', ['pending', 'approved', 'rejected', 'auto_approved'])
                ->default('auto_approved')
                ->after('recruitment_request_id');
            $table->unsignedBigInteger('approved_by')->nullable()->after('boarding_approval_status');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->text('approval_notes')->nullable()->after('approved_at');
            $table->text('rejection_reason')->nullable()->after('approval_notes');

            // Offer Acceptance Tracking fields
            $table->enum('offer_acceptance_status', ['not_applicable', 'sent', 'accepted', 'rejected', 'expired'])
                ->default('not_applicable')
                ->after('rejection_reason');
            $table->timestamp('offer_sent_at')->nullable()->after('offer_acceptance_status');
            $table->timestamp('offer_accepted_at')->nullable()->after('offer_sent_at');
            $table->timestamp('offer_expires_at')->nullable()->after('offer_accepted_at');
            $table->boolean('offer_already_accepted')->default(false)->after('offer_expires_at');

            // Indexes for performance
            $table->index('recruitment_request_id', 'idx_staff_recruitment_request_id');
            $table->index('boarding_approval_status', 'idx_staff_boarding_approval_status');
            $table->index('approved_by', 'idx_staff_approved_by');
            $table->index('offer_acceptance_status', 'idx_staff_offer_acceptance_status');
            $table->index('offer_expires_at', 'idx_staff_offer_expires_at');

            // Foreign keys
            $table->foreign('recruitment_request_id', 'fk_staff_recruitment_request_id')
                ->references('id')
                ->on('recruitment_requests')
                ->onDelete('set null');

            $table->foreign('approved_by', 'fk_staff_approved_by')
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
        Schema::table('staff', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign('fk_staff_recruitment_request_id');
            $table->dropForeign('fk_staff_approved_by');

            // Drop indexes
            $table->dropIndex('idx_staff_recruitment_request_id');
            $table->dropIndex('idx_staff_boarding_approval_status');
            $table->dropIndex('idx_staff_approved_by');
            $table->dropIndex('idx_staff_offer_acceptance_status');
            $table->dropIndex('idx_staff_offer_expires_at');

            // Drop columns
            $table->dropColumn([
                'recruitment_request_id',
                'boarding_approval_status',
                'approved_by',
                'approved_at',
                'approval_notes',
                'rejection_reason',
                'offer_acceptance_status',
                'offer_sent_at',
                'offer_accepted_at',
                'offer_expires_at',
                'offer_already_accepted'
            ]);
        });
    }
};
