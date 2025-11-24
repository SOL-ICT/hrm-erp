<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Tax Brackets Seeder
 * 
 * Purpose: Seed Nigerian progressive tax brackets for PAYE calculation
 * 
 * Tax Year: 2025
 * Exemption Threshold: First ₦840,000 is tax-free
 * 
 * Calculation Example:
 * Income: ₦2,500,000
 * - Tier 1 (0-300k @ 0%): ₦0
 * - Tier 2 (300k-600k @ 15%): ₦45,000
 * - Tier 3 (600k-1.1M @ 18%): ₦90,000
 * - Tier 4 (1.1M-1.6M @ 21%): ₦105,000
 * - Tier 5 (1.6M-2.5M @ 23%): ₦207,000
 * Total PAYE: ₦447,000
 * 
 * Related Documentation: PAYROLL_SYSTEM_COMPREHENSIVE_DOCUMENTATION.md
 */
class TaxBracketsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $effectiveFrom = Carbon::create(2025, 1, 1); // January 1, 2025

        $brackets = [
            [
                'tier_number' => 1,
                'income_from' => 0.00,
                'income_to' => 300000.00,
                'tax_rate' => 0.00,
                'description' => 'First ₦300,000 (Exempt)',
                'is_active' => true,
                'effective_from' => $effectiveFrom,
                'effective_to' => null,
            ],
            [
                'tier_number' => 2,
                'income_from' => 300000.00,
                'income_to' => 600000.00,
                'tax_rate' => 15.00,
                'description' => 'Next ₦300,000 (15%)',
                'is_active' => true,
                'effective_from' => $effectiveFrom,
                'effective_to' => null,
            ],
            [
                'tier_number' => 3,
                'income_from' => 600000.00,
                'income_to' => 1100000.00,
                'tax_rate' => 18.00,
                'description' => 'Next ₦500,000 (18%)',
                'is_active' => true,
                'effective_from' => $effectiveFrom,
                'effective_to' => null,
            ],
            [
                'tier_number' => 4,
                'income_from' => 1100000.00,
                'income_to' => 1600000.00,
                'tax_rate' => 21.00,
                'description' => 'Next ₦500,000 (21%)',
                'is_active' => true,
                'effective_from' => $effectiveFrom,
                'effective_to' => null,
            ],
            [
                'tier_number' => 5,
                'income_from' => 1600000.00,
                'income_to' => 3200000.00,
                'tax_rate' => 23.00,
                'description' => 'Next ₦1,600,000 (23%)',
                'is_active' => true,
                'effective_from' => $effectiveFrom,
                'effective_to' => null,
            ],
            [
                'tier_number' => 6,
                'income_from' => 3200000.00,
                'income_to' => null, // No upper limit
                'tax_rate' => 25.00,
                'description' => 'Above ₦3,200,000 (25%)',
                'is_active' => true,
                'effective_from' => $effectiveFrom,
                'effective_to' => null,
            ],
        ];

        try {
            // Clear existing brackets (for re-seeding)
            DB::table('tax_brackets')->delete();

            // Insert new brackets
            DB::table('tax_brackets')->insert($brackets);

            // Summary
            $this->command->info("\n" . str_repeat('=', 70));
            $this->command->info("TAX BRACKETS SEEDER - SUMMARY");
            $this->command->info(str_repeat('=', 70));
            $this->command->info("✓ Seeded: 6 Nigerian tax brackets for " . $effectiveFrom->format('Y'));
            $this->command->info("");

            foreach ($brackets as $bracket) {
                $toAmount = $bracket['income_to']
                    ? '₦' . number_format($bracket['income_to'], 2)
                    : 'No Limit';

                $this->command->info(sprintf(
                    "  Tier %d: ₦%s - %s @ %s%% | %s",
                    $bracket['tier_number'],
                    number_format($bracket['income_from'], 2),
                    $toAmount,
                    $bracket['tax_rate'],
                    $bracket['description']
                ));
            }

            $this->command->info("");
            $this->command->info("EXEMPTION THRESHOLD: ₦840,000");
            $this->command->info("  (Tier 1: ₦300k + Tier 2: ₦300k + Tier 3: ₦240k = ₦840k exempt)");
            $this->command->info("");
            $this->command->info("CALCULATION EXAMPLE:");
            $this->command->info("  Taxable Income: ₦2,500,000");
            $this->command->info("  - Tier 1 (0-300k @ 0%):        ₦0");
            $this->command->info("  - Tier 2 (300k-600k @ 15%):    ₦45,000");
            $this->command->info("  - Tier 3 (600k-1.1M @ 18%):    ₦90,000");
            $this->command->info("  - Tier 4 (1.1M-1.6M @ 21%):    ₦105,000");
            $this->command->info("  - Tier 5 (1.6M-2.5M @ 23%):    ₦207,000");
            $this->command->info("  Total PAYE:                    ₦447,000");
            $this->command->info(str_repeat('=', 70) . "\n");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Error seeding tax brackets: " . $e->getMessage());
            throw $e;
        }
    }
}
