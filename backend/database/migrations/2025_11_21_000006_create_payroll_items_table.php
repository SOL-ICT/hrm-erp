<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Payroll Items Table
 * 
 * Purpose: Store individual staff payroll calculation details (MOST CRITICAL TABLE)
 * 
 * Features:
 * - One record per staff per payroll run (UNIQUE constraint)
 * - Complete calculation breakdown (all formulas stored)
 * - Snapshot of staff/bank details at calculation time (audit trail)
 * - Emoluments snapshot (JSON) for Excel export
 * - All intermediate calculation steps preserved
 * 
 * Calculation Workflow (30+ columns):
 * 1. Load grade → annual amounts
 * 2. Load attendance → proration factor
 * 3. Calculate monthly gross (prorated)
 * 4. Calculate taxable income
 * 5. Calculate PAYE (progressive tax)
 * 6. Calculate deductions (pension, leave, 13th month)
 * 7. Calculate net pay
 * 8. Calculate credit to bank (net + reimbursables)
 * 
 * Data Snapshot Pattern:
 * - Stores staff name, bank details, PFA code at calculation time
 * - If staff changes grade/bank later, historical payroll remains accurate
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
        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();

            // Parent Payroll Run
            $table->foreignId('payroll_run_id')->constrained('payroll_runs')->onDelete('cascade');

            // Staff & Grade (at calculation time)
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade')
                ->comment('Denormalized for performance');
            $table->foreignId('pay_grade_structure_id')->constrained('pay_grade_structures')->onDelete('restrict')
                ->comment('Grade used for calculation');
            $table->unsignedBigInteger('attendance_id')->nullable()
                ->comment('Attendance record used (from existing attendance system) - nullable for manual adjustments');
            $table->index('attendance_id', 'idx_attendance');

            // Staff Information Snapshot (for audit trail)
            $table->string('staff_name', 255)->comment('Name at calculation time');
            $table->string('staff_code', 50)->comment('Code at calculation time');
            $table->string('bank_name', 100)->nullable()->comment('Bank at calculation time');
            $table->string('account_number', 20)->nullable()->comment('Account at calculation time');
            $table->string('pfa_code', 50)->nullable()->comment('Pension Fund Administrator code');

            // Attendance Data (mapped from attendance_records)
            $table->integer('days_present')->comment('From attendance_records.days_worked');
            $table->integer('days_absent')->comment('Calculated: total_expected_days - days_worked');
            $table->integer('total_days')->comment('From attendance_records.total_expected_days');
            $table->decimal('proration_factor', 5, 4)->comment('From attendance_records.prorated_percentage / 100');

            // Annual Compensation (from grade structure)
            $table->decimal('annual_gross_salary', 15, 2)->comment('Sum of salary + allowances');
            $table->decimal('annual_reimbursables', 15, 2)->comment('Sum of reimbursable components');
            $table->decimal('pensionable_amount', 15, 2)->comment('Sum of is_pensionable components');

            // Monthly Calculations (prorated)
            $table->decimal('monthly_gross', 15, 2)->comment('(annual_gross / 12) * proration_factor');
            $table->decimal('monthly_reimbursables', 15, 2)->comment('(annual_reimbursables / 12) * proration_factor');

            // Tax Calculation
            $table->decimal('taxable_income', 15, 2)->comment('(annual_gross * 0.95) - (pensionable * 0.08)');
            $table->decimal('paye_tax', 15, 2)->comment('Progressive tax from tax_brackets');

            // Deductions (all prorated)
            $table->decimal('pension_deduction', 15, 2)->comment('(pensionable * 0.08) * proration_factor');
            $table->decimal('leave_allowance_deduction', 15, 2)->comment('(LEAVE_ALLOWANCE / 12) * proration_factor');
            $table->decimal('thirteenth_month_deduction', 15, 2)->comment('(THIRTEENTH_MONTH / 12) * proration_factor');
            $table->decimal('other_deductions', 15, 2)->default(0.00)->comment('Future: loans, advances, etc.');
            $table->decimal('total_deductions', 15, 2)->comment('Sum of all deductions');

            // Final Amounts
            $table->decimal('net_pay', 15, 2)->comment('monthly_gross - total_deductions');
            $table->decimal('credit_to_bank', 15, 2)->comment('net_pay + monthly_reimbursables');

            // Emoluments Snapshot (JSON) - Full breakdown for Excel export
            $table->json('emoluments_snapshot')->comment('{"BASIC_SALARY": 50000, "HOUSING": 70000, ...}');

            // Calculation Metadata
            $table->timestamp('calculation_date')->nullable()->comment('When this item was calculated');
            $table->text('notes')->nullable();

            // Timestamps
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // Indexes for Performance
            $table->index('payroll_run_id', 'idx_payroll_run');
            $table->index('staff_id', 'idx_staff');
            $table->index('client_id', 'idx_client');

            // Unique Constraint: One item per staff per payroll run
            $table->unique(['payroll_run_id', 'staff_id'], 'unique_payroll_staff');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_items');
    }
};
