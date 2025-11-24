<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add Payroll Enhancement Columns
 * 
 * Purpose: Support dual-purpose attendance uploads and client-specific custom components
 * 
 * Changes:
 * 1. attendance_uploads.is_for_payroll - Flag to differentiate payroll vs invoice attendance
 * 2. emolument_components.client_id - Enable client-specific custom emolument components
 * 
 * Related Documentation: PAYROLL_PROCESSING_TECHNICAL_SPEC.md section 2.2
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add is_for_payroll column to attendance_uploads
        Schema::table('attendance_uploads', function (Blueprint $table) {
            $table->boolean('is_for_payroll')
                ->default(true)
                ->after('ready_for_processing')
                ->comment('TRUE = payroll attendance, FALSE = invoice attendance');

            // Add index for filtering
            $table->index('is_for_payroll', 'idx_is_for_payroll');
        });

        // Add client_id column to emolument_components
        Schema::table('emolument_components', function (Blueprint $table) {
            $table->foreignId('client_id')
                ->nullable()
                ->after('payroll_category')
                ->constrained('clients')
                ->onDelete('cascade')
                ->comment('NULL = universal component, NOT NULL = client-specific custom component');

            // Add index for filtering
            $table->index('client_id', 'idx_client_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_uploads', function (Blueprint $table) {
            $table->dropIndex('idx_is_for_payroll');
            $table->dropColumn('is_for_payroll');
        });

        Schema::table('emolument_components', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropIndex('idx_client_id');
            $table->dropColumn('client_id');
        });
    }
};
