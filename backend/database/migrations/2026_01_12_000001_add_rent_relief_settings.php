<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration: Add Rent Relief Settings
 * 
 * Purpose: Add missing RENT_RELIEF_RATE and RENT_RELIEF_CAP settings to payroll_settings table
 * 
 * Background:
 * - Nigeria Tax Act 2025 replaced CRA with Rent Relief
 * - Rent Relief = 20% of annual rent paid (capped at ₦500,000)
 * - PayrollCalculationEngine uses these settings but they were missing from database
 * - Currently using hardcoded fallback values (Line 82-83 in PayrollCalculationEngine.php)
 * 
 * This migration adds proper database configuration to eliminate hardcoded values
 */
class AddRentReliefSettings extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();

        // Insert RENT_RELIEF_RATE setting
        DB::table('payroll_settings')->insert([
            'setting_key' => 'RENT_RELIEF_RATE',
            'setting_type' => 'statutory_rate',
            'setting_value' => json_encode([
                'rate' => 20.0,
                'base' => 'annual_rent_paid',
                'frequency' => 'annual',
                'legal_reference' => 'Nigeria Tax Act 2025 - Section on Rent Relief',
                'description' => 'Percentage of annual rent paid that qualifies for tax relief'
            ]),
            'description' => 'Rent Relief Rate (20% of Annual Rent Paid for Tax Relief)',
            'unit' => 'percentage',
            'is_active' => true,
            'is_editable' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Insert RENT_RELIEF_CAP setting
        DB::table('payroll_settings')->insert([
            'setting_key' => 'RENT_RELIEF_CAP',
            'setting_type' => 'statutory_rate',
            'setting_value' => json_encode([
                'amount' => 500000,
                'currency' => 'NGN',
                'frequency' => 'annual',
                'legal_reference' => 'Nigeria Tax Act 2025 - Section on Rent Relief',
                'description' => 'Maximum annual rent relief allowed for tax purposes'
            ]),
            'description' => 'Rent Relief Cap (Maximum NGN 500,000 per year)',
            'unit' => 'naira',
            'is_active' => true,
            'is_editable' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('payroll_settings')
            ->whereIn('setting_key', ['RENT_RELIEF_RATE', 'RENT_RELIEF_CAP'])
            ->delete();
    }
}
