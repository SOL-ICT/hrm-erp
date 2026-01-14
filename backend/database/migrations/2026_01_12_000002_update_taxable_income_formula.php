<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration: Update Taxable Income Formula
 * 
 * Purpose: Update TAXABLE_INCOME_FORMULA to reflect actual engine calculation
 * 
 * Old Formula (Database):
 * (GROSS_PAY × 0.95) - (PENSIONABLE_AMOUNT × 0.08) - TAX_EXEMPTION
 * 
 * New Formula (Matching Engine):
 * ANNUAL_GROSS - PENSION_RELIEF - NHIS_RELIEF - RENT_RELIEF
 * 
 * Components:
 * - ANNUAL_GROSS: Sum of all salary components
 * - PENSION_RELIEF: 8% of pensionable amount (Basic + Housing + Transport)
 * - NHIS_RELIEF: 5% of basic salary (tax relief only, not deducted)
 * - RENT_RELIEF: 20% of annual rent paid (max NGN 500,000)
 */
class UpdateTaxableIncomeFormula extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('payroll_settings')
            ->where('setting_key', 'TAXABLE_INCOME_FORMULA')
            ->update([
                'setting_value' => json_encode([
                    'formula' => 'ANNUAL_GROSS - PENSION_RELIEF - NHIS_RELIEF - RENT_RELIEF',
                    'description' => 'Annual Gross minus all tax reliefs (Pension, NHIS, Rent)',
                    'components' => [
                        'ANNUAL_GROSS',
                        'PENSION_RELIEF',
                        'NHIS_RELIEF',
                        'RENT_RELIEF'
                    ],
                    'reliefs' => [
                        'pension_relief' => [
                            'formula' => 'PENSIONABLE_AMOUNT × PENSION_RATE',
                            'rate_source' => 'PENSION_RATE setting (8%)',
                            'base' => 'Basic + Housing + Transport (pensionable components)'
                        ],
                        'nhis_relief' => [
                            'formula' => 'BASIC_SALARY × NHIS_RATE',
                            'rate_source' => 'NHIS_RATE setting (5%)',
                            'base' => 'Basic Salary only',
                            'note' => 'Tax relief only - not deducted from pay'
                        ],
                        'rent_relief' => [
                            'formula' => 'MIN(ANNUAL_RENT_PAID × RENT_RELIEF_RATE, RENT_RELIEF_CAP)',
                            'rate_source' => 'RENT_RELIEF_RATE setting (20%)',
                            'cap_source' => 'RENT_RELIEF_CAP setting (NGN 500,000)',
                            'base' => 'Annual rent paid by employee'
                        ]
                    ],
                    'type' => 'calculation',
                    'period' => 'annual',
                    'legal_reference' => 'Nigeria Tax Act 2025'
                ]),
                'description' => 'Formula for calculating Taxable Income (Gross minus Pension, NHIS, and Rent reliefs)',
                'updated_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to old formula
        DB::table('payroll_settings')
            ->where('setting_key', 'TAXABLE_INCOME_FORMULA')
            ->update([
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
                'updated_at' => now(),
            ]);
    }
}
