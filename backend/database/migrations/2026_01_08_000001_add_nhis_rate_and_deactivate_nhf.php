<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration: Add NHIS Rate and Deactivate NHF
 * 
 * Changes:
 * 1. Add NHIS_RATE setting (5% of Basic Salary - tax relief only, not deducted)
 * 2. Deactivate NHF_RATE setting (no longer used)
 * 
 * Reason:
 * - NHIS provides tax relief similar to pension (reduces taxable income)
 * - NHIS is NOT deducted from employee pay monthly
 * - NHF is deprecated and no longer applicable
 */
class AddNhisRateAndDeactivateNhf extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add NHIS_RATE setting
        DB::table('payroll_settings')->insert([
            'setting_key' => 'NHIS_RATE',
            'setting_value' => json_encode([
                'base' => 'basic_salary',
                'rate' => 5,
                'frequency' => 'annual',
                'legal_reference' => 'National Health Insurance Scheme Act',
                'note' => 'Not deducted from pay - only used for tax relief calculation'
            ]),
            'setting_type' => 'statutory_rate',
            'description' => 'NHIS Contribution (5% of Basic Salary - Tax Relief Only, Not Deducted)',
            'unit' => 'percentage',
            'is_active' => true,
            'is_editable' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Deactivate NHF_RATE
        DB::table('payroll_settings')
            ->where('setting_key', 'NHF_RATE')
            ->update([
                'is_active' => false,
                'description' => 'DEPRECATED - NHF no longer used',
                'updated_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove NHIS_RATE setting
        DB::table('payroll_settings')
            ->where('setting_key', 'NHIS_RATE')
            ->delete();

        // Reactivate NHF_RATE
        DB::table('payroll_settings')
            ->where('setting_key', 'NHF_RATE')
            ->update([
                'is_active' => true,
                'description' => 'National Housing Fund Contribution (2.5% of Basic Salary)',
                'updated_at' => now(),
            ]);
    }
}
