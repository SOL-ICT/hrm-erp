<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Create Missing Payroll Components Seeder
 * 
 * Purpose: Create the 9 missing emolument components required for universal payroll template
 * 
 * Components Created:
 * PENSIONABLE (3):
 *   - BASIC_SALARY
 *   - HOUSING
 *   - TRANSPORT
 * 
 * REGULAR ALLOWANCES (2):
 *   - OTHER_ALLOWANCES
 *   - MEAL_ALLOWANCE
 * 
 * DEDUCTIONS (1):
 *   - LEAVE_ALLOWANCE (deducted monthly, paid as lump sum)
 * 
 * REIMBURSABLES (3):
 *   - OTJ_TELEPHONE
 *   - OTJ_TRANSPORT
 *   - CLIENT_OP_FUND
 * 
 * Note: THIRTEENTH_MONTH and UNIFORM already exist and were updated by UniversalPayrollComponentsSeeder
 */
class CreateMissingPayrollComponentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info("\n" . str_repeat('=', 70));
        $this->command->info("CREATE MISSING PAYROLL COMPONENTS SEEDER");
        $this->command->info(str_repeat('=', 70));

        $now = Carbon::now();
        $componentsToCreate = [
            // PENSIONABLE COMPONENTS (3)
            [
                'component_code' => 'BASIC_SALARY',
                'component_name' => 'Basic Salary',
                'description' => 'Basic Salary - Core pensionable component',
                'category' => 'basic',
                'status' => 'regular',
                'type' => 'fixed_allowance',
                'class' => 'cash_item',
                'client_account' => 'SALARIES',
                'ledger_account_code' => 'SAL001',
                'ledger_account_name' => 'Basic Salary Account',
                'is_taxable' => true,
                'calculation_method' => 'fixed',
                'display_order' => 1,
                'is_active' => true,
                'is_universal_template' => true,
                'is_pensionable' => true,
                'payroll_category' => 'salary',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'component_code' => 'HOUSING',
                'component_name' => 'Housing Allowance',
                'description' => 'Housing Allowance - Pensionable component',
                'category' => 'allowance',
                'status' => 'regular',
                'type' => 'fixed_allowance',
                'class' => 'cash_item',
                'client_account' => 'ALLOWANCES',
                'ledger_account_code' => 'ALL001',
                'ledger_account_name' => 'Housing Allowance Account',
                'is_taxable' => true,
                'calculation_method' => 'fixed',
                'display_order' => 2,
                'is_active' => true,
                'is_universal_template' => true,
                'is_pensionable' => true,
                'payroll_category' => 'allowance',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'component_code' => 'TRANSPORT',
                'component_name' => 'Transport Allowance',
                'description' => 'Transport Allowance - Pensionable component',
                'category' => 'allowance',
                'status' => 'regular',
                'type' => 'fixed_allowance',
                'class' => 'cash_item',
                'client_account' => 'ALLOWANCES',
                'ledger_account_code' => 'ALL002',
                'ledger_account_name' => 'Transport Allowance Account',
                'is_taxable' => true,
                'calculation_method' => 'fixed',
                'display_order' => 3,
                'is_active' => true,
                'is_universal_template' => true,
                'is_pensionable' => true,
                'payroll_category' => 'allowance',
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // REGULAR ALLOWANCES (2)
            [
                'component_code' => 'OTHER_ALLOWANCES',
                'component_name' => 'Other Allowances',
                'description' => 'Other Allowances - Non-pensionable',
                'category' => 'allowance',
                'status' => 'regular',
                'type' => 'fixed_allowance',
                'class' => 'cash_item',
                'client_account' => 'ALLOWANCES',
                'ledger_account_code' => 'ALL003',
                'ledger_account_name' => 'Other Allowances Account',
                'is_taxable' => true,
                'calculation_method' => 'fixed',
                'display_order' => 4,
                'is_active' => true,
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'allowance',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'component_code' => 'MEAL_ALLOWANCE',
                'component_name' => 'Meal Allowance',
                'description' => 'Meal Allowance - Non-pensionable',
                'category' => 'allowance',
                'status' => 'regular',
                'type' => 'fixed_allowance',
                'class' => 'cash_item',
                'client_account' => 'ALLOWANCES',
                'ledger_account_code' => 'ALL004',
                'ledger_account_name' => 'Meal Allowance Account',
                'is_taxable' => true,
                'calculation_method' => 'fixed',
                'display_order' => 5,
                'is_active' => true,
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'allowance',
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // DEDUCTIONS (1) - Deducted monthly, paid as lump sum
            [
                'component_code' => 'LEAVE_ALLOWANCE',
                'component_name' => 'Leave Allowance',
                'description' => 'Leave Allowance - Deducted monthly (1/12), paid as lump sum',
                'category' => 'deduction',
                'status' => 'regular',
                'type' => 'fixed_allowance',
                'class' => 'cash_item',
                'client_account' => 'DEDUCTIONS',
                'ledger_account_code' => 'DED001',
                'ledger_account_name' => 'Leave Allowance Deduction Account',
                'is_taxable' => false,
                'calculation_method' => 'fixed',
                'display_order' => 6,
                'is_active' => true,
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'deduction',
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // REIMBURSABLES (3) - Paid monthly separately
            [
                'component_code' => 'OTJ_TELEPHONE',
                'component_name' => 'On-the-Job Telephone',
                'description' => 'On-the-Job Telephone - Reimbursable (paid separately)',
                'category' => 'allowance',
                'status' => 'benefit',
                'type' => 'fixed_allowance',
                'class' => 'cash_item',
                'client_account' => 'REIMBURSABLES',
                'ledger_account_code' => 'RMB001',
                'ledger_account_name' => 'OTJ Telephone Reimbursement Account',
                'is_taxable' => false,
                'calculation_method' => 'fixed',
                'display_order' => 7,
                'is_active' => true,
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'reimbursable',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'component_code' => 'OTJ_TRANSPORT',
                'component_name' => 'On-the-Job Transport',
                'description' => 'On-the-Job Transport - Reimbursable (paid separately)',
                'category' => 'allowance',
                'status' => 'benefit',
                'type' => 'fixed_allowance',
                'class' => 'cash_item',
                'client_account' => 'REIMBURSABLES',
                'ledger_account_code' => 'RMB002',
                'ledger_account_name' => 'OTJ Transport Reimbursement Account',
                'is_taxable' => false,
                'calculation_method' => 'fixed',
                'display_order' => 8,
                'is_active' => true,
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'reimbursable',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'component_code' => 'CLIENT_OP_FUND',
                'component_name' => 'Client Operational Fund',
                'description' => 'Client Operational Fund - Reimbursable (paid separately)',
                'category' => 'allowance',
                'status' => 'benefit',
                'type' => 'fixed_allowance',
                'class' => 'cash_item',
                'client_account' => 'REIMBURSABLES',
                'ledger_account_code' => 'RMB003',
                'ledger_account_name' => 'Client Op Fund Reimbursement Account',
                'is_taxable' => false,
                'calculation_method' => 'fixed',
                'display_order' => 9,
                'is_active' => true,
                'is_universal_template' => true,
                'is_pensionable' => false,
                'payroll_category' => 'reimbursable',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        $created = 0;
        $skipped = 0;

        foreach ($componentsToCreate as $component) {
            // Check if component already exists
            $exists = DB::table('emolument_components')
                ->where('component_code', $component['component_code'])
                ->exists();

            if ($exists) {
                $this->command->warn("⚠ Skipped: {$component['component_code']} (already exists)");
                $skipped++;
                continue;
            }

            // Create component
            DB::table('emolument_components')->insert($component);

            $category = $component['payroll_category'];
            $pensionable = $component['is_pensionable'] ? 'Yes' : 'No';
            $this->command->info("✓ Created: {$component['component_code']} (Category: {$category}, Pensionable: {$pensionable})");
            $created++;
        }

        // Summary
        $this->command->info("\n" . str_repeat('=', 70));
        $this->command->info("SUMMARY");
        $this->command->info(str_repeat('=', 70));
        $this->command->info("✓ Created: {$created} new components");
        $this->command->info("⚠ Skipped: {$skipped} existing components");

        // Show categorization
        $this->command->info("\nCOMPONENT CATEGORIES:");
        $this->command->info("  PENSIONABLE (8% pension applies):");
        $this->command->info("    1. BASIC_SALARY");
        $this->command->info("    2. HOUSING");
        $this->command->info("    3. TRANSPORT");

        $this->command->info("\n  REIMBURSABLES (paid separately monthly):");
        $this->command->info("    1. OTJ_TELEPHONE");
        $this->command->info("    2. OTJ_TRANSPORT");
        $this->command->info("    3. UNIFORM");
        $this->command->info("    4. CLIENT_OP_FUND");

        $this->command->info("\n  DEDUCTIONS (deducted monthly, paid lump sum):");
        $this->command->info("    1. LEAVE_ALLOWANCE (1/12 deducted monthly)");
        $this->command->info("    2. THIRTEENTH_MONTH (1/12 deducted monthly)");

        $this->command->info("\n  REGULAR ALLOWANCES:");
        $this->command->info("    1. OTHER_ALLOWANCES");
        $this->command->info("    2. MEAL_ALLOWANCE");
        $this->command->info(str_repeat('=', 70) . "\n");

        // Verify final count
        $totalUniversal = DB::table('emolument_components')
            ->where('is_universal_template', true)
            ->count();

        $this->command->info("✓ Total universal components in database: {$totalUniversal}");

        if ($totalUniversal >= 11) {
            $this->command->info("✓ SUCCESS: All 11 universal components are now in the database!");
        } else {
            $this->command->warn("⚠ WARNING: Expected 11 components, found {$totalUniversal}");
        }
    }
}
