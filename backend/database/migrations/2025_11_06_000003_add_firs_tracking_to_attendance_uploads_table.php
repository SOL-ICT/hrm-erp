<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add FIRS e-invoicing tracking fields to attendance_uploads table
     */
    public function up(): void
    {
        Schema::table('attendance_uploads', function (Blueprint $table) {
            // FIRS e-invoicing tracking fields
            $table->enum('firs_status', ['pending', 'approved', 'rejected'])->nullable()->after('validation_completed_at')
                ->comment('FIRS submission status');

            $table->string('firs_irn', 100)->nullable()->after('firs_status')
                ->comment('Invoice Reference Number sent to FIRS');

            $table->json('firs_response_data')->nullable()->after('firs_irn')
                ->comment('Complete FIRS API response data');

            $table->timestamp('firs_submitted_at')->nullable()->after('firs_response_data')
                ->comment('When invoice was submitted to FIRS');

            $table->text('firs_qr_code')->nullable()->after('firs_submitted_at')
                ->comment('Generated QR code data (base64) for FIRS compliance');

            $table->json('firs_submission_payload')->nullable()->after('firs_qr_code')
                ->comment('Original payload sent to FIRS for debugging');

            // Add indexes for efficient queries
            $table->index('firs_status', 'attendance_uploads_firs_status_index');
            $table->index('firs_irn', 'attendance_uploads_firs_irn_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_uploads', function (Blueprint $table) {
            $table->dropIndex('attendance_uploads_firs_status_index');
            $table->dropIndex('attendance_uploads_firs_irn_index');
            $table->dropColumn([
                'firs_status',
                'firs_irn',
                'firs_response_data',
                'firs_submitted_at',
                'firs_qr_code',
                'firs_submission_payload'
            ]);
        });
    }
};
