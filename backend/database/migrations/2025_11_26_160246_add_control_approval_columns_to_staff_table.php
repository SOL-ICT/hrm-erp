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
     * Adds Control Department approval columns for compliance/audit workflow
     * Updates boarding_approval_status enum to include new statuses
     */
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Control approval columns
            $table->unsignedBigInteger('control_approved_by')->nullable()->after('approved_by');
            $table->timestamp('control_approved_at')->nullable()->after('control_approved_by');
            $table->text('control_approval_notes')->nullable()->after('control_approved_at');

            // Control rejection columns
            $table->unsignedBigInteger('control_rejected_by')->nullable()->after('control_approval_notes');
            $table->timestamp('control_rejected_at')->nullable()->after('control_rejected_by');
            $table->text('control_rejection_reason')->nullable()->after('control_rejected_at');

            // Foreign keys
            $table->foreign('control_approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('control_rejected_by')->references('id')->on('users')->onDelete('set null');
        });

        // Update enum to include new statuses
        DB::statement("ALTER TABLE staff MODIFY COLUMN boarding_approval_status ENUM(
            'pending',
            'approved',
            'rejected',
            'auto_approved',
            'pending_control_approval',
            'control_approved',
            'control_rejected'
        ) DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['control_approved_by']);
            $table->dropForeign(['control_rejected_by']);

            // Drop columns
            $table->dropColumn([
                'control_approved_by',
                'control_approved_at',
                'control_approval_notes',
                'control_rejected_by',
                'control_rejected_at',
                'control_rejection_reason'
            ]);
        });

        // Restore original enum
        DB::statement("ALTER TABLE staff MODIFY COLUMN boarding_approval_status ENUM(
            'pending',
            'approved',
            'rejected',
            'auto_approved'
        ) DEFAULT 'pending'");
    }
};
