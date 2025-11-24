<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PayrollSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Seeds payroll_settings table with Nigeria 2025 default values:
     * - PAYE tax brackets (6 tiers)
     * - Statutory rates (Pension, NHF, NSITF, ITF)
     * - Tax exemption threshold
     * - Calculation formulas (Gross Pay, Taxable Income, Net Pay)
     * - Universal components reference
     */
    public function run(): void
    {
        $now = Carbon::now();

        $settings = [
            // 1. PAYE Tax Brackets (6 tiers - Nigerian Progressive Tax System)
            [
                'setting_key' => 'PAYE_BRACKETS',
                'setting_type' => 'tax_bracket',
                'setting_value' => json_encode([
                    ['tier' => 1, 'min' => 0, 'max' => 300000, 'rate' => 0, 'description' => 'Tax Exempt'],
                    ['tier' => 2, 'min' => 300000, 'max' => 600000, 'rate' => 15, 'description' => '15% on excess over ₦300,000'],
                    ['tier' => 3, 'min' => 600000, 'max' => 1100000, 'rate' => 18, 'description' => '18% on excess over ₦600,000'],
                    ['tier' => 4, 'min' => 1100000, 'max' => 1600000, 'rate' => 21, 'description' => '21% on excess over ₦1,100,000'],
                    ['tier' => 5, 'min' => 1600000, 'max' => 3200000, 'rate' => 23, 'description' => '23% on excess over ₦1,600,000'],
                    ['tier' => 6, 'min' => 3200000, 'max' => null, 'rate' => 25, 'description' => '25% on excess over ₦3,200,000']
                ]),
                'description' => 'Nigerian Progressive PAYE Tax Brackets (Annual Income)',
                'unit' => 'percentage',
                'is_active' => true,
                'is_editable' => true,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // 2. Pension Contribution Rate
            [
                'setting_key' => 'PENSION_RATE',
                'setting_type' => 'statutory_rate',
                'setting_value' => json_encode([
                    'employee_rate' => 8.0,
                    'employer_rate' => 10.0,
                    'total_rate' => 18.0,
                    'minimum_pensionable' => 30000,
                    'base' => 'pensionable_amount',
                    'legal_reference' => 'Pension Reform Act 2014'
                ]),
                'description' => 'Mandatory Pension Contribution (8% employee + 10% employer on pensionable emoluments)',
                'unit' => 'percentage',
                'is_active' => true,
                'is_editable' => true,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // 3. National Housing Fund (NHF)
            [
                'setting_key' => 'NHF_RATE',
                'setting_type' => 'statutory_rate',
                'setting_value' => json_encode([
                    'rate' => 2.5,
                    'base' => 'basic_salary',
                    'frequency' => 'monthly',
                    'legal_reference' => 'National Housing Fund Act'
                ]),
                'description' => 'National Housing Fund Contribution (2.5% of Basic Salary)',
                'unit' => 'percentage',
                'is_active' => true,
                'is_editable' => true,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // 4. NSITF (Nigeria Social Insurance Trust Fund)
            [
                'setting_key' => 'NSITF_RATE',
                'setting_type' => 'statutory_rate',
                'setting_value' => json_encode([
                    'rate' => 1.0,
                    'base' => 'total_emoluments',
                    'frequency' => 'monthly',
                    'paid_by' => 'employer',
                    'legal_reference' => 'Employees Compensation Act 2010'
                ]),
                'description' => 'NSITF Contribution (1% of Total Emoluments) - Employer paid',
                'unit' => 'percentage',
                'is_active' => true,
                'is_editable' => true,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // 5. ITF (Industrial Training Fund)
            [
                'setting_key' => 'ITF_RATE',
                'setting_type' => 'statutory_rate',
                'setting_value' => json_encode([
                    'rate' => 1.0,
                    'base' => 'annual_payroll',
                    'frequency' => 'annual',
                    'paid_by' => 'employer',
                    'legal_reference' => 'Industrial Training Fund Act'
                ]),
                'description' => 'ITF Contribution (1% of Annual Payroll) - Employer paid',
                'unit' => 'percentage',
                'is_active' => true,
                'is_editable' => true,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // 6. Tax Exemption Threshold
            [
                'setting_key' => 'TAX_EXEMPTION',
                'setting_type' => 'tax_bracket',
                'setting_value' => json_encode([
                    'annual_exemption' => 840000,
                    'monthly_exemption' => 70000,
                    'cra_percentage' => 20,
                    'calculation_method' => 'CRA_plus_20_percent_gross',
                    'description' => 'Consolidated Relief Allowance (CRA) + 20% of Gross Income (max ₦840,000/year)',
                    'legal_reference' => 'Companies Income Tax Act (Amendment) 2011'
                ]),
                'description' => 'Annual Tax Exemption Threshold (CRA + 20% Gross, max ₦840,000)',
                'unit' => 'naira',
                'is_active' => true,
                'is_editable' => true,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // 7. Gross Pay Calculation Formula
            [
                'setting_key' => 'GROSS_PAY_FORMULA',
                'setting_type' => 'formula',
                'setting_value' => json_encode([
                    'formula' => 'BASIC_SALARY + HOUSING + TRANSPORT + OTHER_ALLOWANCES + MEAL_ALLOWANCE',
                    'components' => ['BASIC_SALARY', 'HOUSING', 'TRANSPORT', 'OTHER_ALLOWANCES', 'MEAL_ALLOWANCE'],
                    'type' => 'sum',
                    'period' => 'annual',
                    'description' => 'Sum of all salary and allowance components (annual basis)'
                ]),
                'description' => 'Formula for calculating Annual Gross Pay (sum of pensionable and non-pensionable emoluments)',
                'unit' => 'formula',
                'is_active' => true,
                'is_editable' => true,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // 8. Taxable Income Formula
            [
                'setting_key' => 'TAXABLE_INCOME_FORMULA',
                'setting_type' => 'formula',
                'setting_value' => json_encode([
                    'formula' => '(GROSS_PAY × 0.95) - (PENSIONABLE_AMOUNT × 0.08) - TAX_EXEMPTION',
                    'description' => '95% of gross (CRA relief) minus pension contribution (8%) minus exemption threshold',
                    'components' => ['GROSS_PAY', 'PENSIONABLE_AMOUNT', 'TAX_EXEMPTION'],
                    'constants' => [
                        'cra_percentage' => 0.95,
                        'pension_relief_percentage' => 0.08
                    ],
                    'type' => 'calculation',
                    'period' => 'annual'
                ]),
                'description' => 'Formula for calculating Taxable Income (after CRA and Pension relief)',
                'unit' => 'formula',
                'is_active' => true,
                'is_editable' => true,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // 9. Net Pay Calculation Formula
            [
                'setting_key' => 'NET_PAY_FORMULA',
                'setting_type' => 'formula',
                'setting_value' => json_encode([
                    'formula' => 'MONTHLY_GROSS - (PAYE + PENSION + LEAVE_DEDUCTION + 13TH_DEDUCTION + OTHER_DEDUCTIONS)',
                    'components' => ['MONTHLY_GROSS', 'PAYE', 'PENSION', 'LEAVE_DEDUCTION', '13TH_DEDUCTION', 'OTHER_DEDUCTIONS'],
                    'type' => 'subtraction',
                    'period' => 'monthly',
                    'description' => 'Monthly gross minus all deductions (tax, pension, leave reserve, 13th month, others)'
                ]),
                'description' => 'Formula for calculating Monthly Net Pay (take-home pay before reimbursables)',
                'unit' => 'formula',
                'is_active' => true,
                'is_editable' => true,
                'created_at' => $now,
                'updated_at' => $now
            ],

            // 10. Universal Components Reference (Read-Only)
            [
                'setting_key' => 'UNIVERSAL_COMPONENTS',
                'setting_type' => 'reference',
                'setting_value' => json_encode([
                    ['code' => 'BASIC_SALARY', 'name' => 'Basic Salary', 'category' => 'salary', 'pensionable' => true, 'description' => 'Core monthly salary amount'],
                    ['code' => 'HOUSING', 'name' => 'Housing Allowance', 'category' => 'allowance', 'pensionable' => true, 'description' => 'Housing/accommodation allowance'],
                    ['code' => 'TRANSPORT', 'name' => 'Transport Allowance', 'category' => 'allowance', 'pensionable' => true, 'description' => 'Transportation allowance'],
                    ['code' => 'OTHER_ALLOWANCES', 'name' => 'Other Allowances', 'category' => 'allowance', 'pensionable' => false, 'description' => 'Miscellaneous allowances'],
                    ['code' => 'MEAL_ALLOWANCE', 'name' => 'Meal Allowance', 'category' => 'allowance', 'pensionable' => false, 'description' => 'Meal/lunch allowance'],
                    ['code' => 'LEAVE_ALLOWANCE', 'name' => 'Leave Allowance', 'category' => 'deduction', 'pensionable' => false, 'description' => 'Deducted monthly (1/12), paid annually'],
                    ['code' => 'THIRTEENTH_MONTH', 'name' => '13th Month Salary', 'category' => 'deduction', 'pensionable' => false, 'description' => 'Deducted monthly (1/12), paid annually'],
                    ['code' => 'OTJ_TELEPHONE', 'name' => 'On-the-Job Telephone', 'category' => 'reimbursable', 'pensionable' => false, 'description' => 'Reimbursable telephone expenses'],
                    ['code' => 'OTJ_TRANSPORT', 'name' => 'On-the-Job Transport', 'category' => 'reimbursable', 'pensionable' => false, 'description' => 'Reimbursable transport expenses'],
                    ['code' => 'UNIFORM', 'name' => 'Uniform Allowance', 'category' => 'reimbursable', 'pensionable' => false, 'description' => 'Reimbursable uniform costs'],
                    ['code' => 'CLIENT_OP_FUND', 'name' => 'Client Operation Fund', 'category' => 'reimbursable', 'pensionable' => false, 'description' => 'Client operational fund reimbursement']
                ]),
                'description' => 'System-wide Universal Emolument Components (11 components) - Reference Only',
                'unit' => 'reference',
                'is_active' => true,
                'is_editable' => false, // Read-only reference data
                'created_at' => $now,
                'updated_at' => $now
            ]
        ];

        // Insert all settings
        DB::table('payroll_settings')->insert($settings);

        $this->command->info('✅ Payroll settings seeded successfully with Nigeria 2025 defaults!');
        $this->command->info('   - PAYE Brackets: 6 tiers (0%, 15%, 18%, 21%, 23%, 25%)');
        $this->command->info('   - Pension: 8% employee + 10% employer');
        $this->command->info('   - NHF: 2.5% of basic salary');
        $this->command->info('   - NSITF: 1% of total emoluments');
        $this->command->info('   - ITF: 1% of annual payroll');
        $this->command->info('   - Tax Exemption: ₦840,000/year');
        $this->command->info('   - Formulas: Gross Pay, Taxable Income, Net Pay');
        $this->command->info('   - Universal Components: 11 components reference');
    }
}
