<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Cleanup Old Emolument Components Seeder
 * 
 * Purpose: Delete old/unused emolument components (IDs 1-56)
 *          Keep only the 11 universal template components
 * 
 * Components to DELETE (56 old components):
 *   IDs 1-56 (SALARY, DAILY_WAGES, etc.)
 * 
 * Components to KEEP (11 universal template):
 *   ID 36: UNIFORM
 *   ID 37: THIRTEENTH_MONTH
 *   ID 57: BASIC_SALARY
 *   ID 58: HOUSING
 *   ID 59: TRANSPORT
 *   ID 60: OTHER_ALLOWANCES
 *   ID 61: MEAL_ALLOWANCE
 *   ID 62: LEAVE_ALLOWANCE
 *   ID 63: OTJ_TELEPHONE
 *   ID 64: OTJ_TRANSPORT
 *   ID 65: CLIENT_OP_FUND
 * 
 * Additionally:
 *   - Clear emoluments JSON from all pay_grade_structures (fresh start)
 *   - Reset total_compensation to 0
 */
class CleanupOldEmolumentComponentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info("\n" . str_repeat('=', 70));
        $this->command->info("CLEANUP OLD EMOLUMENT COMPONENTS SEEDER");
        $this->command->info(str_repeat('=', 70));

        DB::beginTransaction();

        try {
            // Step 1: Clear all emoluments from pay_grade_structures
            $this->command->info("\nStep 1: Clearing emoluments from pay grade structures...");

            $affectedGrades = DB::table('pay_grade_structures')
                ->whereNotNull('emoluments')
                ->count();

            DB::table('pay_grade_structures')->update([
                'emoluments' => null,
                'total_compensation' => 0.00,
            ]);

            $this->command->info("✓ Cleared emoluments from {$affectedGrades} pay grade structures");

            // Step 2: Delete old emolument components (IDs 1-35, 38-56)
            // Keep IDs 36, 37 (UNIFORM, THIRTEENTH_MONTH) and 57-65 (new universal components)
            $this->command->info("\nStep 2: Deleting old emolument components...");

            $idsToDelete = array_merge(
                range(1, 35),   // IDs 1-35
                range(38, 56)   // IDs 38-56
            );

            $deletedCount = DB::table('emolument_components')
                ->whereIn('id', $idsToDelete)
                ->delete();

            $this->command->info("✓ Deleted {$deletedCount} old emolument components");

            // Step 3: Verify remaining components
            $this->command->info("\nStep 3: Verifying remaining components...");

            $remaining = DB::table('emolument_components')
                ->where('is_universal_template', true)
                ->orderBy('id')
                ->get(['id', 'component_code', 'component_name', 'is_pensionable', 'payroll_category']);

            $this->command->info("\nRemaining Universal Components:");
            foreach ($remaining as $component) {
                $pensionable = $component->is_pensionable ? '✓ Pensionable' : '✗ Not Pensionable';
                $category = strtoupper($component->payroll_category ?? 'N/A');
                $this->command->info(sprintf(
                    "  [%2d] %-20s | %-15s | %s",
                    $component->id,
                    $component->component_code,
                    $pensionable,
                    $category
                ));
            }

            DB::commit();

            // Summary
            $this->command->info("\n" . str_repeat('=', 70));
            $this->command->info("CLEANUP SUMMARY");
            $this->command->info(str_repeat('=', 70));
            $this->command->info("✓ Cleared emoluments: {$affectedGrades} pay grade structures");
            $this->command->info("✓ Deleted components: {$deletedCount} old components");
            $this->command->info("✓ Remaining universal components: " . $remaining->count());

            if ($remaining->count() === 11) {
                $this->command->info("\n✅ SUCCESS: Cleanup complete! Only 11 universal components remain.");
            } else {
                $this->command->warn("\n⚠ WARNING: Expected 11 components, found " . $remaining->count());
            }

            $this->command->info(str_repeat('=', 70) . "\n");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("\n❌ ERROR: Cleanup failed - " . $e->getMessage());
            throw $e;
        }
    }
}
