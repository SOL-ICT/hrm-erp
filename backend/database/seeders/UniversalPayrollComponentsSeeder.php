<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\EmolumentComponent;

/**
 * Universal Payroll Components Seeder
 * 
 * Purpose: Update existing emolument_components with payroll-specific flags
 *          for the 11 universal template components
 * 
 * Universal Template (11 Components):
 * 1. Basic Salary (pensionable)
 * 2. Housing Allowance (pensionable)
 * 3. Transport Allowance (pensionable)
 * 4. Other Allowances
 * 5. 13th Month (deduction category - paid lump sum)
 * 6. Leave Allowance (deduction category - paid lump sum)
 * 7. OTJ - Telephone (reimbursable)
 * 8. OTJ - Transport (reimbursable)
 * 9. Uniform (reimbursable)
 * 10. Client Operational Fund (reimbursable)
 * 11. Meal Allowance (allowance)
 * 
 * Related Documentation: PAYROLL_SYSTEM_COMPREHENSIVE_DOCUMENTATION.md
 */
class UniversalPayrollComponentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define the 11 universal components with their properties
        $universalComponents = [
            // SALARY COMPONENTS (1)
            [
                'component_code' => 'BASIC_SALARY',
                'is_universal_template' => true,
                'is_pensionable' => true,
                'payroll_category' => 'salary',
                'display_order' => 1
            ],

            // ALLOWANCE COMPONENTS (3 pensionable + 1 non-pensionable)
            [
                'component_code' => 'HOUSING',
                'is_universal_template' => true,
                'is_pensionable' => true,
                'payroll_category' => 'allowance',
                'display_order' => 2
            ],
            [
                'component_code' => 'TRANSPORT',
                'is_universal_template' => true,
                'is_pensionable' => true,
                'payroll_category' => 'allowance',
                'display_order' => 3
            ],
            [
                'component_code' => 'OTHER_ALLOWANCES',
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'allowance',
                'display_order' => 4
            ],
            [
                'component_code' => 'MEAL_ALLOWANCE',
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'allowance',
                'display_order' => 5
            ],

            // DEDUCTION COMPONENTS (2 - deducted monthly, paid lump sum)
            [
                'component_code' => 'LEAVE_ALLOWANCE',
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'deduction',
                'display_order' => 6
            ],
            [
                'component_code' => 'THIRTEENTH_MONTH',
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'deduction',
                'display_order' => 7
            ],

            // REIMBURSABLE COMPONENTS (4 - paid monthly as reimbursables)
            [
                'component_code' => 'OTJ_TELEPHONE',
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'reimbursable',
                'display_order' => 8
            ],
            [
                'component_code' => 'OTJ_TRANSPORT',
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'reimbursable',
                'display_order' => 9
            ],
            [
                'component_code' => 'UNIFORM',
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'reimbursable',
                'display_order' => 10
            ],
            [
                'component_code' => 'CLIENT_OP_FUND',
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'reimbursable',
                'display_order' => 11
            ]
        ];

        DB::beginTransaction();

        try {
            $updatedCount = 0;
            $createdCount = 0;
            $missingComponents = [];

            foreach ($universalComponents as $componentData) {
                $component = EmolumentComponent::where('component_code', $componentData['component_code'])->first();

                if ($component) {
                    // Update existing component
                    $component->update([
                        'is_universal_template' => $componentData['is_universal_template'],
                        'is_pensionable' => $componentData['is_pensionable'],
                        'payroll_category' => $componentData['payroll_category'],
                        'display_order' => $componentData['display_order']
                    ]);
                    $updatedCount++;

                    $this->command->info("✓ Updated: {$componentData['component_code']} (Pensionable: " .
                        ($componentData['is_pensionable'] ? 'Yes' : 'No') . ", " .
                        "Category: {$componentData['payroll_category']})");
                } else {
                    // Component doesn't exist - log as missing
                    $missingComponents[] = $componentData['component_code'];
                    $this->command->warn("⚠ Missing: {$componentData['component_code']} - Consider creating it");
                }
            }

            DB::commit();

            // Summary
            $this->command->info("\n" . str_repeat('=', 70));
            $this->command->info("UNIVERSAL PAYROLL COMPONENTS SEEDER - SUMMARY");
            $this->command->info(str_repeat('=', 70));
            $this->command->info("✓ Updated: {$updatedCount} components");
            $this->command->info("✓ Created: {$createdCount} components");

            if (count($missingComponents) > 0) {
                $this->command->warn("⚠ Missing: " . count($missingComponents) . " components");
                $this->command->warn("  Components: " . implode(', ', $missingComponents));
                $this->command->warn("  Action Required: Create these components manually or update seeder");
            }

            $this->command->info("\nPENSIONABLE COMPONENTS (8% pension applies):");
            $this->command->info("  1. BASIC_SALARY");
            $this->command->info("  2. HOUSING");
            $this->command->info("  3. TRANSPORT");

            $this->command->info("\nREIMBURSABLE COMPONENTS (paid monthly separately):");
            $this->command->info("  1. OTJ_TELEPHONE");
            $this->command->info("  2. OTJ_TRANSPORT");
            $this->command->info("  3. UNIFORM");
            $this->command->info("  4. CLIENT_OP_FUND");

            $this->command->info("\nDEDUCTION COMPONENTS (deducted monthly, paid lump sum):");
            $this->command->info("  1. LEAVE_ALLOWANCE");
            $this->command->info("  2. THIRTEENTH_MONTH");

            $this->command->info(str_repeat('=', 70) . "\n");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Error updating components: " . $e->getMessage());
            throw $e;
        }
    }
}
