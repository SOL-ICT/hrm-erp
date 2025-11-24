<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Payroll Runs Table
 * 
 * Purpose: Track monthly payroll execution and approval workflow
 * 
 * Features:
 * - One payroll run per client per month/year (UNIQUE constraint)
 * - Workflow states: draft → calculated → approved → exported
 * - Aggregate totals for reporting
 * - Export file tracking
 * - Approval audit trail
 * 
 * Workflow States:
 * - draft: Created but not calculated yet
 * - calculated: Calculation completed, awaiting review
 * - approved: HR/Finance approved, ready for payment
 * - exported: Excel file generated for bank upload
 * - cancelled: Rolled back (requires recalculation)
 * 
 * Related Documentation: PAYROLL_SYSTEM_COMPREHENSIVE_DOCUMENTATION.md
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->id();

            // Client & Period
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->integer('month')->comment('1-12');
            $table->integer('year')->comment('e.g., 2025');

            // Source Data
            $table->unsignedBigInteger('attendance_upload_id')->nullable()
                ->comment('Links to attendance data used - nullable for manual payroll runs');
            $table->index('attendance_upload_id', 'idx_attendance_upload');

            // Workflow Status
            $table->enum('status', ['draft', 'calculated', 'approved', 'exported', 'cancelled'])->default('draft');

            // Aggregate Statistics
            $table->integer('total_staff_count')->default(0)->comment('Number of staff processed');
            $table->decimal('total_gross_pay', 15, 2)->default(0.00)->comment('Sum of all monthly_gross');
            $table->decimal('total_deductions', 15, 2)->default(0.00)->comment('Sum of all deductions (PAYE + Pension + etc.)');
            $table->decimal('total_net_pay', 15, 2)->default(0.00)->comment('Sum of all net_pay');
            $table->decimal('total_credit_to_bank', 15, 2)->default(0.00)->comment('Sum of all credit_to_bank');

            // Processing Timestamps
            $table->timestamp('calculation_date')->nullable()->comment('When calculation completed');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('exported_at')->nullable();

            // Export Tracking
            $table->string('export_file_path', 500)->nullable()->comment('Path to generated Excel file');

            // Additional Notes
            $table->text('notes')->nullable();

            // Audit Trail
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // Indexes
            $table->index('status', 'idx_status');
            $table->index(['client_id', 'year', 'month'], 'idx_client_period');

            // Unique Constraint: One payroll run per client per month/year
            $table->unique(['client_id', 'month', 'year'], 'unique_client_month_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_runs');
    }
};
