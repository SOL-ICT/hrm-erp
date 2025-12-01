<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Migration: Add ticket assignment and delegation fields to recruitment_requests table
     * 
     * PURPOSE: Enable ticket assignment workflow where authorized users can assign
     * recruitment tickets to subordinates who can process but need approval.
     * 
     * ADDED COLUMNS:
     * - assigned_to: FK to users.id - user assigned to process this ticket
     * - requires_approval: Whether ticket creator needs approval for their actions
     * - assigned_at: Timestamp when ticket was assigned
     * - assignment_notes: Notes from assigner to assignee
     */
    public function up(): void
    {
        Schema::table('recruitment_requests', function (Blueprint $table) {
            // Ticket assignment fields
            $table->unsignedBigInteger('assigned_to')->nullable()->after('approved_by');
            $table->boolean('requires_approval')->default(false)->after('assigned_to');
            $table->timestamp('assigned_at')->nullable()->after('requires_approval');
            $table->text('assignment_notes')->nullable()->after('assigned_at');

            // Indexes
            $table->index('assigned_to', 'idx_recruitment_requests_assigned_to');

            // Foreign keys
            $table->foreign('assigned_to', 'fk_recruitment_requests_assigned_to')
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
        Schema::table('recruitment_requests', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign('fk_recruitment_requests_assigned_to');

            // Drop indexes
            $table->dropIndex('idx_recruitment_requests_assigned_to');

            // Drop columns
            $table->dropColumn([
                'assigned_to',
                'requires_approval',
                'assigned_at',
                'assignment_notes'
            ]);
        });
    }
};
