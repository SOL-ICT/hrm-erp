<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Updates tax brackets to Nigeria Tax Act 2025 rates
     * Effective: January 1, 2025
     * 
     * Key Changes:
     * - Expanded 0% band from ₦300,000 to ₦800,000 (full exemption for low earners)
     * - New progressive rates: 0%, 15%, 18%, 21%, 23%, 25%
     * - Abolished CRA (Consolidated Relief Allowance)
     * - Introduced Rent Relief (20% of annual rent, capped at ₦500,000)
     */
    public function up(): void
    {
        // Delete old brackets
        DB::table('tax_brackets')->truncate();

        // Insert NEW 2025 tax brackets
        DB::table('tax_brackets')->insert([
            [
                'tier_number' => 1,
                'income_from' => 0.00,
                'income_to' => 800000.00,
                'tax_rate' => 0.00,
                'effective_from' => '2025-01-01',
                'effective_to' => null,
                'description' => 'First ₦800,000 - Tax Free (Nigeria Tax Act 2025)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tier_number' => 2,
                'income_from' => 800000.00,
                'income_to' => 3000000.00,
                'tax_rate' => 15.00,
                'effective_from' => '2025-01-01',
                'effective_to' => null,
                'description' => '₦800,001 to ₦3,000,000 at 15%',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tier_number' => 3,
                'income_from' => 3000000.00,
                'income_to' => 12000000.00,
                'tax_rate' => 18.00,
                'effective_from' => '2025-01-01',
                'effective_to' => null,
                'description' => '₦3,000,001 to ₦12,000,000 at 18%',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tier_number' => 4,
                'income_from' => 12000000.00,
                'income_to' => 25000000.00,
                'tax_rate' => 21.00,
                'effective_from' => '2025-01-01',
                'effective_to' => null,
                'description' => '₦12,000,001 to ₦25,000,000 at 21%',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tier_number' => 5,
                'income_from' => 25000000.00,
                'income_to' => 50000000.00,
                'tax_rate' => 23.00,
                'effective_from' => '2025-01-01',
                'effective_to' => null,
                'description' => '₦25,000,001 to ₦50,000,000 at 23%',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tier_number' => 6,
                'income_from' => 50000000.00,
                'income_to' => null, // No upper limit
                'tax_rate' => 25.00,
                'effective_from' => '2025-01-01',
                'effective_to' => null,
                'description' => 'Above ₦50,000,000 at 25%',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore old brackets (optional - just truncate for now)
        DB::table('tax_brackets')->truncate();

        // Could restore old brackets here if needed for rollback
    }
};
