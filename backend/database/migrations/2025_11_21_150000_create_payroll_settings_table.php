<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates payroll_settings table to store configurable tax rates, formulas, and statutory rates.
     * This allows admins to update payroll calculation parameters without code changes.
     * Seeded with Nigeria 2025 defaults (PAYE brackets, pension rates, formulas, etc.)
     */
    public function up(): void
    {
        Schema::create('payroll_settings', function (Blueprint $table) {
            $table->id();

            // Identifier - unique key for each setting (e.g., 'PAYE_BRACKETS', 'PENSION_RATE')
            $table->string('setting_key', 100)->unique()->comment('Unique identifier for the setting');

            // Configuration value stored as JSON for flexibility
            $table->json('setting_value')->comment('Setting value (rates, brackets, formulas as structured JSON)');

            // Setting categorization
            $table->enum('setting_type', [
                'tax_bracket',     // PAYE tax tiers
                'statutory_rate',  // Pension, NHF, NSITF, ITF rates
                'formula',         // Calculation formulas (gross pay, taxable income, net pay)
                'reference'        // Reference data (universal components list)
            ])->comment('Type of setting for validation and UI rendering');

            // Metadata
            $table->text('description')->nullable()->comment('Human-readable description of the setting');
            $table->string('unit', 20)->nullable()->comment('Unit type: percentage, naira, formula, reference');

            // Control flags
            $table->boolean('is_active')->default(true)->comment('Whether this setting is currently active');
            $table->boolean('is_editable')->default(true)->comment('Whether users can edit this setting (some may be system-locked)');

            // Audit trail
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->text('last_modified_reason')->nullable()->comment('Reason for the last change (required on update)');

            // Timestamps
            $table->timestamps();

            // Foreign keys
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index('setting_type', 'idx_setting_type');
            $table->index('is_active', 'idx_is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_settings');
    }
};
