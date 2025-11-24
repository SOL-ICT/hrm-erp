<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Tax Brackets Table
 * 
 * Purpose: Store Nigerian progressive tax rates for PAYE calculation
 * 
 * Features:
 * - 6-tier progressive tax system
 * - Effective date tracking (for tax law changes)
 * - Admin-updatable tax rates
 * - Supports historical tax brackets
 * 
 * Nigerian Tax System (2025):
 * - First ₦300,000: 0%
 * - Next ₦300,000: 15%
 * - Next ₦500,000: 18%
 * - Next ₦500,000: 21%
 * - Next ₦1,600,000: 23%
 * - Above ₦3,200,000: 25%
 * - Exemption Threshold: ₦840,000 (first 3 brackets = ₦300k + ₦300k + ₦240k)
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
        Schema::create('tax_brackets', function (Blueprint $table) {
            $table->id();

            // Bracket Configuration
            $table->integer('tier_number')->comment('1-6 for Nigerian tax system');
            $table->decimal('income_from', 15, 2)->comment('Lower bound (inclusive)');
            $table->decimal('income_to', 15, 2)->nullable()->comment('Upper bound (NULL = infinity for last tier)');
            $table->decimal('tax_rate', 5, 2)->comment('Tax percentage (0.00, 15.00, 18.00, etc.)');
            $table->string('description', 255)->nullable()->comment('Human-readable: "First ₦300,000"');

            // Status & Effective Dates
            $table->boolean('is_active')->default(true);
            $table->date('effective_from')->comment('When this bracket becomes active');
            $table->date('effective_to')->nullable()->comment('When this bracket expires (NULL = current)');

            // Audit Trail
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // Indexes for Performance
            $table->index(['is_active', 'effective_from', 'effective_to'], 'idx_active_effective');
            $table->index(['tier_number', 'is_active'], 'idx_tier_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_brackets');
    }
};
