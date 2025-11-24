<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Payroll Calculation Formulas Seeder
 * 
 * Purpose: Seed 9 default calculation formulas for payroll processing
 * 
 * Formulas:
 * 1. ANNUAL_GROSS - Sum of salary + allowances
 * 2. MONTHLY_GROSS - (annual_gross / 12) * proration_factor
 * 3. PENSIONABLE_AMOUNT - Sum of is_pensionable components (Basic, Housing, Transport)
 * 4. TAXABLE_INCOME - (annual_gross * 0.95) - (pensionable_amount * 0.08)
 * 5. PAYE - Progressive tax using tax_brackets table
 * 6. PENSION - (pensionable_amount * 0.08) * proration_factor
 * 7. LEAVE_ALLOWANCE_DEDUCTION - (LEAVE_ALLOWANCE / 12) * proration_factor
 * 8. THIRTEENTH_MONTH_DEDUCTION - (THIRTEENTH_MONTH / 12) * proration_factor
 * 9. NET_PAY - monthly_gross - (paye + pension + leave_deduction + 13th_deduction)
 * 10. CREDIT_TO_BANK - net_pay + (monthly_reimbursables / 12)
 * 
 * Note: These are system defaults. Clients can override specific formulas if needed.
 * 
 * Related Documentation: PAYROLL_SYSTEM_COMPREHENSIVE_DOCUMENTATION.md
 */
class PayrollCalculationFormulasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $formulas = [
            [
                'formula_code' => 'ANNUAL_GROSS',
                'formula_name' => 'Annual Gross Salary',
                'formula_expression' => 'SUM(emoluments WHERE payroll_category IN ("salary", "allowance"))',
                'description' => 'Total annual compensation from salary and allowance components. ' .
                    'Does NOT include reimbursables (OTJ, Uniform, etc.).',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 1
            ],
            [
                'formula_code' => 'ANNUAL_REIMBURSABLES',
                'formula_name' => 'Annual Reimbursables',
                'formula_expression' => 'SUM(emoluments WHERE payroll_category = "reimbursable")',
                'description' => 'Total annual reimbursable amounts (OTJ-Telephone, OTJ-Transport, Uniform, Client Op Fund). ' .
                    'These are added to net pay monthly but not subject to tax/pension.',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 2
            ],
            [
                'formula_code' => 'PENSIONABLE_AMOUNT',
                'formula_name' => 'Pensionable Components',
                'formula_expression' => 'SUM(emoluments WHERE is_pensionable = TRUE)',
                'description' => 'Sum of pensionable components (Basic Salary, Housing, Transport). ' .
                    '8% pension deduction applies only to this amount.',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 3
            ],
            [
                'formula_code' => 'MONTHLY_GROSS',
                'formula_name' => 'Monthly Gross Salary',
                'formula_expression' => '(annual_gross / 12) * (days_present / total_days)',
                'description' => 'Prorated monthly gross salary based on attendance. ' .
                    'Formula: (Annual Gross ÷ 12) × Attendance Proration Factor',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 4
            ],
            [
                'formula_code' => 'MONTHLY_REIMBURSABLES',
                'formula_name' => 'Monthly Reimbursables',
                'formula_expression' => '(annual_reimbursables / 12) * (days_present / total_days)',
                'description' => 'Prorated monthly reimbursable amount. ' .
                    'Added to net pay to get final credit to bank amount.',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 5
            ],
            [
                'formula_code' => 'TAXABLE_INCOME',
                'formula_name' => 'Taxable Income',
                'formula_expression' => '(annual_gross * 0.95) - (pensionable_amount * 0.08)',
                'description' => 'Income subject to PAYE tax calculation. ' .
                    'Formula: (95% of Annual Gross) - (8% Pension on Pensionable Amount). ' .
                    'The 5% reduction accounts for pension relief.',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 6
            ],
            [
                'formula_code' => 'PAYE',
                'formula_name' => 'Pay As You Earn Tax',
                'formula_expression' => 'progressive_tax(taxable_income) USING tax_brackets WHERE is_active = TRUE',
                'description' => 'Nigerian progressive tax calculation using 6 tiers from tax_brackets table. ' .
                    'Exemption: First ₦840,000 is tax-free. ' .
                    'Rates: 0%, 15%, 18%, 21%, 23%, 25% for different income bands.',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 7
            ],
            [
                'formula_code' => 'PENSION',
                'formula_name' => 'Pension Deduction (8%)',
                'formula_expression' => '(pensionable_amount * 0.08 / 12) * (days_present / total_days)',
                'description' => 'Monthly pension deduction (8% of pensionable components, prorated). ' .
                    'Applies only to Basic Salary, Housing, and Transport allowances.',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 8
            ],
            [
                'formula_code' => 'LEAVE_ALLOWANCE_DEDUCTION',
                'formula_name' => 'Leave Allowance Monthly Deduction',
                'formula_expression' => '(emoluments["LEAVE_ALLOWANCE"] / 12) * (days_present / total_days)',
                'description' => 'Monthly deduction for leave allowance (paid as lump sum at year-end). ' .
                    'Prorated based on attendance.',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 9
            ],
            [
                'formula_code' => 'THIRTEENTH_MONTH_DEDUCTION',
                'formula_name' => '13th Month Monthly Deduction',
                'formula_expression' => '(emoluments["THIRTEENTH_MONTH"] / 12) * (days_present / total_days)',
                'description' => 'Monthly deduction for 13th month salary (paid as lump sum in December). ' .
                    'Prorated based on attendance.',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 10
            ],
            [
                'formula_code' => 'NET_PAY',
                'formula_name' => 'Net Pay',
                'formula_expression' => 'monthly_gross - (paye + pension + leave_allowance_deduction + thirteenth_month_deduction)',
                'description' => 'Take-home pay before adding reimbursables. ' .
                    'Formula: Monthly Gross - All Deductions (PAYE + Pension + Leave + 13th Month)',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 11
            ],
            [
                'formula_code' => 'CREDIT_TO_BANK',
                'formula_name' => 'Final Credit to Bank',
                'formula_expression' => 'net_pay + monthly_reimbursables',
                'description' => 'Final amount to be credited to staff bank account. ' .
                    'Formula: Net Pay + Monthly Reimbursables. ' .
                    'This is the amount used for bank transfer.',
                'is_system_default' => true,
                'client_id' => null,
                'job_structure_id' => null,
                'is_active' => true,
                'display_order' => 12
            ]
        ];

        DB::beginTransaction();

        try {
            // Clear existing formulas (for re-seeding)
            DB::table('payroll_calculation_formulas')->where('is_system_default', true)->delete();

            // Insert new formulas
            DB::table('payroll_calculation_formulas')->insert($formulas);

            DB::commit();

            // Summary
            $this->command->info("\n" . str_repeat('=', 80));
            $this->command->info("PAYROLL CALCULATION FORMULAS SEEDER - SUMMARY");
            $this->command->info(str_repeat('=', 80));
            $this->command->info("✓ Seeded: 12 system default formulas");
            $this->command->info("");

            foreach ($formulas as $formula) {
                $this->command->info(sprintf(
                    "  %2d. %-30s | %s",
                    $formula['display_order'],
                    $formula['formula_code'],
                    $formula['formula_name']
                ));
            }

            $this->command->info("");
            $this->command->info("CALCULATION SEQUENCE:");
            $this->command->info("  1. ANNUAL_GROSS → Calculate total annual salary + allowances");
            $this->command->info("  2. ANNUAL_REIMBURSABLES → Calculate total annual reimbursables");
            $this->command->info("  3. PENSIONABLE_AMOUNT → Identify pensionable components");
            $this->command->info("  4. MONTHLY_GROSS → Prorate annual gross to monthly");
            $this->command->info("  5. MONTHLY_REIMBURSABLES → Prorate reimbursables to monthly");
            $this->command->info("  6. TAXABLE_INCOME → Calculate income subject to tax");
            $this->command->info("  7. PAYE → Apply progressive tax brackets");
            $this->command->info("  8. PENSION → Calculate 8% pension deduction");
            $this->command->info("  9. LEAVE_ALLOWANCE_DEDUCTION → Monthly leave deduction");
            $this->command->info(" 10. THIRTEENTH_MONTH_DEDUCTION → Monthly 13th month deduction");
            $this->command->info(" 11. NET_PAY → Subtract all deductions from gross");
            $this->command->info(" 12. CREDIT_TO_BANK → Add reimbursables to net pay");
            $this->command->info("");
            $this->command->info("CLIENT OVERRIDE:");
            $this->command->info("  To override a formula for specific client:");
            $this->command->info("  1. Copy formula record");
            $this->command->info("  2. Set client_id = <target_client>");
            $this->command->info("  3. Set is_system_default = FALSE");
            $this->command->info("  4. Modify formula_expression as needed");
            $this->command->info(str_repeat('=', 80) . "\n");
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Error seeding formulas: " . $e->getMessage());
            throw $e;
        }
    }
}
