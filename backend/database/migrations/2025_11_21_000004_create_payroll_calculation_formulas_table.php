<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Payroll Calculation Formulas Table
 * 
 * Purpose: Store default and custom calculation formulas for payroll processing
 * 
 * Features:
 * - 9 default system formulas (ANNUAL_GROSS, MONTHLY_GROSS, PAYE, etc.)
 * - Client-specific formula overrides
 * - Job structure-specific formula overrides
 * - Formula expression stored as text for flexibility
 * 
 * Default Formulas:
 * 1. ANNUAL_GROSS - Sum of salary + allowances
 * 2. MONTHLY_GROSS - (annual_gross / 12) * proration
 * 3. PENSIONABLE_AMOUNT - Sum of is_pensionable components
 * 4. TAXABLE_INCOME - (annual_gross * 0.95) - (pensionable * 0.08)
 * 5. PAYE - Progressive tax calculation
 * 6. PENSION - (pensionable * 0.08) * proration
 * 7. NET_PAY - monthly_gross - total_deductions
 * 8. CREDIT_TO_BANK - net_pay + monthly_reimbursables
 * 
 * Override Logic:
 * - If client_id IS NULL → System default
 * - If client_id NOT NULL & job_structure_id IS NULL → Client override
 * - If both NOT NULL → Job-specific override
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
        Schema::create('payroll_calculation_formulas', function (Blueprint $table) {
            $table->id();

            // Formula Identification
            $table->string('formula_code', 50)->comment('Unique code: ANNUAL_GROSS, PAYE, etc.');
            $table->string('formula_name', 100)->comment('Human-readable name');
            $table->text('formula_expression')->comment('Calculation logic/expression');
            $table->text('description')->nullable()->comment('Explanation of formula purpose');

            // Scope (System Default vs Overrides)
            $table->boolean('is_system_default')->default(true)->comment('FALSE for client/job overrides');
            $table->foreignId('client_id')->nullable()->constrained('clients')->onDelete('cascade')
                ->comment('NULL = system default, NOT NULL = client-specific');
            $table->foreignId('job_structure_id')->nullable()->constrained('job_structures')->onDelete('cascade')
                ->comment('NULL = all jobs, NOT NULL = job-specific');

            // Status & Display
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0)->comment('Order in calculation sequence');

            // Audit Trail
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // Indexes
            $table->index(['client_id', 'job_structure_id'], 'idx_client_job');
            $table->index(['formula_code', 'is_active'], 'idx_code_active');

            // Unique Constraint: One formula code per scope
            $table->unique(['formula_code', 'client_id', 'job_structure_id'], 'unique_formula_scope');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_calculation_formulas');
    }
};
