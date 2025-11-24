<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Remove Redundant Columns from Pay Grade Structures
 * 
 * Purpose: Clean up pay_grade_structures table by removing columns that duplicate
 *          data already stored in emoluments JSON field
 * 
 * Columns to Remove:
 * - basic_salary (use emoluments['BASIC_SALARY'])
 * - transport_allowance (use emoluments['TRANSPORT'])
 * - housing_allowance (use emoluments['HOUSING'])
 * - meal_allowance (use emoluments['MEAL_ALLOWANCE'] if exists)
 * 
 * Data Safety: Emoluments JSON field contains all component data, so no data loss
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
        // Check if columns exist before attempting to drop (defensive programming)
        Schema::table('pay_grade_structures', function (Blueprint $table) {
            $columnsToCheck = [
                'basic_salary',
                'transport_allowance',
                'housing_allowance',
                'meal_allowance'
            ];

            foreach ($columnsToCheck as $column) {
                if (Schema::hasColumn('pay_grade_structures', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Note: Reversing this migration will recreate columns but data will be lost
     *       Only use for emergency rollback during initial deployment
     */
    public function down(): void
    {
        Schema::table('pay_grade_structures', function (Blueprint $table) {
            // Recreate columns as nullable (data cannot be restored)
            $table->decimal('basic_salary', 15, 2)->nullable()->after('pay_structure_type');
            $table->decimal('transport_allowance', 15, 2)->nullable()->after('basic_salary');
            $table->decimal('housing_allowance', 15, 2)->nullable()->after('transport_allowance');
            $table->decimal('meal_allowance', 15, 2)->nullable()->after('housing_allowance');
        });
    }
};
