<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Add Prorated Fields to Payroll Items Table
 * 
 * Purpose: Separate full monthly entitlement from prorated payment amounts
 * 
 * Background:
 * - Previously, monthly_gross was incorrectly calculated as (annual_gross / 12) * proration
 * - This meant if staff worked 20/30 days, monthly_gross showed ₦80,000 instead of ₦100,000
 * - WRONG because monthly_gross should show ENTITLEMENT, not payment
 * 
 * Fix:
 * - monthly_gross = annual_gross / 12 (FULL entitlement, no proration)
 * - prorated_monthly_gross = monthly_gross * proration_factor (actual payment)
 * - Same logic for reimbursables
 * 
 * Impact:
 * - Payroll reports now show both full entitlement and prorated payment
 * - Net pay and deductions still use prorated amounts (correct)
 * - Excel exports show correct monthly gross regardless of attendance
 * 
 * Related Files:
 * - app/Services/PayrollCalculationEngine.php (calculation logic)
 * - app/Models/PayrollItem.php (model definition)
 * - PAYROLL_CALCULATION_FIX.md (documentation)
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            // Add prorated fields after monthly_reimbursables
            $table->decimal('prorated_monthly_gross', 15, 2)
                ->after('monthly_reimbursables')
                ->nullable()
                ->comment('monthly_gross * proration_factor (actual payment amount)');

            $table->decimal('prorated_monthly_reimbursables', 15, 2)
                ->after('prorated_monthly_gross')
                ->nullable()
                ->comment('monthly_reimbursables * proration_factor');
        });

        // Update existing records to populate prorated fields
        // (Existing records have monthly_gross already prorated, so copy those values)
        DB::statement('
            UPDATE payroll_items 
            SET 
                prorated_monthly_gross = monthly_gross,
                prorated_monthly_reimbursables = monthly_reimbursables
            WHERE prorated_monthly_gross IS NULL
        ');

        // Now update monthly_gross to be full entitlement (divide by proration to reverse the proration)
        DB::statement('
            UPDATE payroll_items 
            SET 
                monthly_gross = CASE 
                    WHEN proration_factor > 0 THEN monthly_gross / proration_factor
                    ELSE monthly_gross
                END,
                monthly_reimbursables = CASE 
                    WHEN proration_factor > 0 THEN monthly_reimbursables / proration_factor
                    ELSE monthly_reimbursables
                END
            WHERE proration_factor > 0
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->dropColumn(['prorated_monthly_gross', 'prorated_monthly_reimbursables']);
        });
    }
};
