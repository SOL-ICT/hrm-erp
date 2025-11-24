<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add Payroll-Specific Columns to Emolument Components
 * 
 * Purpose: Enhance emolument_components table to support payroll processing
 * 
 * New Columns:
 * - is_universal_template: Flag for 11 standard components (Basic, Housing, etc.)
 * - is_pensionable: Flag for pension calculation (Basic, Housing, Transport only)
 * - payroll_category: Separate salary, allowance, reimbursable, deduction, statutory
 * 
 * Migration Type: ALTER TABLE (preserves existing 56 components)
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
        Schema::table('emolument_components', function (Blueprint $table) {
            // Flag for 11 universal payroll template components
            $table->boolean('is_universal_template')
                ->default(false)
                ->after('is_active')
                ->comment('TRUE for 11 standard components (Basic Salary, Housing, Transport, etc.)');

            // Flag for pension calculation (8% deduction applies only to pensionable components)
            $table->boolean('is_pensionable')
                ->default(false)
                ->after('is_universal_template')
                ->comment('TRUE for Basic Salary, Housing Allowance, Transport Allowance only');

            // Category for payroll processing logic
            $table->enum('payroll_category', [
                'salary',      // Basic Salary (annual, prorated monthly)
                'allowance',   // Housing, Transport, Other (annual, prorated monthly)
                'reimbursable', // OTJ, Uniform, Client Op Fund (annual but paid monthly as reimbursables)
                'deduction',   // Leave Allowance, 13th Month (deducted monthly, paid lump sum)
                'statutory'    // PAYE, Pension, NHF (calculated deductions)
            ])
                ->nullable()
                ->after('is_pensionable')
                ->comment('Determines how component is treated in payroll calculation');

            // Add index for efficient payroll queries
            $table->index(['is_universal_template', 'is_active'], 'idx_universal_active');
            $table->index(['is_pensionable', 'is_active'], 'idx_pensionable_active');
            $table->index(['payroll_category', 'is_active'], 'idx_category_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('emolument_components', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('idx_universal_active');
            $table->dropIndex('idx_pensionable_active');
            $table->dropIndex('idx_category_active');

            // Drop columns
            $table->dropColumn(['is_universal_template', 'is_pensionable', 'payroll_category']);
        });
    }
};
