<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('calculation_templates', function (Blueprint $table) {
            $table->id();

            // Template identification
            $table->string('name')->comment('Template name for this pay grade');
            $table->string('pay_grade_code')->comment('Unique code for this pay grade');
            $table->text('description')->nullable()->comment('Template description');
            $table->string('version', 10)->default('1.0')->comment('Template version for change tracking');

            // Calculation components (JSON)
            $table->json('salary_components')->comment('Salary components with formulas and amounts');
            $table->json('allowance_components')->comment('Allowance components with formulas and amounts');
            $table->json('deduction_components')->comment('Deduction components with formulas and amounts');
            $table->json('statutory_components')->comment('Statutory components (pension, tax, etc.)');

            // Calculation rules
            $table->json('calculation_rules')->comment('Rules for calculation order and processing');
            $table->decimal('annual_division_factor', 8, 2)->default(12.00)->comment('Factor for annual calculations');
            $table->string('attendance_calculation_method')->default('working_days')->comment('Method for attendance calculation');
            $table->boolean('prorate_salary')->default(true)->comment('Whether to prorate salary based on attendance');
            $table->decimal('minimum_attendance_factor', 3, 2)->default(0.50)->comment('Minimum attendance factor for salary');

            // Metadata
            $table->boolean('is_active')->default(true)->comment('Whether template is active');
            $table->boolean('is_default')->default(false)->comment('Whether this is the default template for the grade');
            $table->string('created_by')->comment('User who created this template');
            $table->string('updated_by')->nullable()->comment('User who last updated this template');
            $table->timestamp('last_used_at')->nullable()->comment('When this template was last used');

            // Audit trail
            $table->timestamps();

            // Indexes
            $table->index('pay_grade_code');
            $table->index(['is_active', 'is_default']);
            $table->index('last_used_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calculation_templates');
    }
};
