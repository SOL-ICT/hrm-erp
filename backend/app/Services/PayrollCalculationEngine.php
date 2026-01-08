<?php

namespace App\Services;

use App\Models\TaxBracket;
use App\Models\PayrollCalculationFormula;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Payroll Calculation Engine
 * 
 * Purpose: Core calculation logic for payroll processing
 * 
 * Features:
 * - Progressive tax calculation (Nigerian 6-tier system)
 * - Component categorization (pensionable, reimbursable, deductions)
 * - Monthly payroll calculation with proration
 * - Formula-driven computation
 * - Audit trail with calculation snapshots
 * 
 * Calculation Sequence (13 Formulas):
 * 1. ANNUAL_GROSS - Sum of salary components
 * 2. ANNUAL_REIMBURSABLES - Sum of reimbursable components
 * 3. PENSIONABLE_AMOUNT - Sum of pensionable components
 * 4. MONTHLY_GROSS - ANNUAL_GROSS / 12 (FULL monthly entitlement, NO proration)
 * 5. MONTHLY_REIMBURSABLES - ANNUAL_REIMBURSABLES / 12 (FULL monthly, NO proration)
 * 6. PRORATED_MONTHLY_GROSS - MONTHLY_GROSS × proration (for net pay calculation)
 * 7. CRA - Consolidated Relief Allowance (NOT USED - removed from tax law)
 * 8. TAXABLE_INCOME - (ANNUAL_GROSS × 0.95) - (PENSIONABLE × 0.08)
 * 9. PAYE - Progressive tax on taxable income (monthly amount prorated)
 * 10. PENSION - (PENSIONABLE / 12) × 0.08 × proration
 * 11. LEAVE_ALLOWANCE_DEDUCTION - (LEAVE / 12) × proration
 * 12. THIRTEENTH_MONTH_DEDUCTION - (13TH / 12) × proration
 * 13. NET_PAY - PRORATED_MONTHLY_GROSS - total_deductions
 * 14. CREDIT_TO_BANK - NET_PAY + PRORATED_MONTHLY_REIMBURSABLES
 */
class PayrollCalculationEngine
{
    /**
     * Calculate monthly payroll for a single staff member
     * 
     * @param object $staff - Staff record
     * @param object $payGrade - Pay grade structure with emoluments
     * @param object $attendanceRecord - Attendance record with proration
     * @param int $year - Payroll year
     * @return array - Complete payroll calculation
     */
    public function calculateMonthlyPayroll($staff, $payGrade, $attendanceRecord, $year = null)
    {
        $year = $year ?? date('Y');

        // Step 1: Get emoluments from pay grade
        $emoluments = $this->getPayGradeEmoluments($payGrade->id);

        // Step 2: Categorize components
        $categorized = $this->separateEmolumentsByCategory($emoluments);

        // Step 3: Get proration factor from attendance
        $prorationFactor = $attendanceRecord->prorated_percentage / 100;

        // Step 4: Calculate annual amounts
        $annualGross = $categorized['annual_gross'];
        $annualReimbursables = $categorized['annual_reimbursables'];
        $pensionableAmount = $categorized['pensionable_amount'];

        // Step 5: Calculate monthly amounts
        // IMPORTANT: monthly_gross is the FULL monthly salary (not prorated)
        // This is the staff's entitled monthly gross regardless of attendance
        $monthlyGross = $annualGross / 12;
        $monthlyReimbursables = $annualReimbursables / 12;

        // Step 5b: Calculate PRORATED amounts for actual payment calculation
        // These are used for deductions and net pay only
        $proratedMonthlyGross = $monthlyGross * $prorationFactor;
        $proratedMonthlyReimbursables = $monthlyReimbursables * $prorationFactor;

        // Step 6: Calculate Rent Relief (replaces CRA under Nigeria Tax Act 2025)
        // Formula: Lower of (20% × Annual Rent Paid) or NGN 500,000
        // Get rates from payroll_settings (not hardcoded)
        $annualRentPaid = $staff->annual_rent_paid ?? 0;
        $rentReliefRate = $this->getPayrollSetting('RENT_RELIEF_RATE', 0.20, true); // Default 20%, stored as 20
        $rentReliefCap = $this->getPayrollSetting('RENT_RELIEF_CAP', 500000, false); // Default NGN 500,000, not a percentage
        $rentRelief = min(($annualRentPaid * $rentReliefRate), $rentReliefCap);

        // Step 7: Calculate tax reliefs
        // Pension Relief: 8% of pensionable components (Basic + Housing + Transport)
        // NHIS Relief: 5% of Basic Salary only (not deducted from pay, but reduces taxable income)
        // Rent Relief: 20% of annual rent paid (capped at NGN 500,000)
        // Reference: Nigeria Tax Act 2025, Section on Chargeable Income
        $pensionRate = $this->getPayrollSetting('PENSION_RATE', 0.08, true); // Default 8%, stored as 8
        $pensionRelief = $pensionableAmount * $pensionRate; // Pension contribution relief
        
        $nhisRate = $this->getPayrollSetting('NHIS_RATE', 0.05, true); // Default 5%, stored as 5
        $basicSalary = $categorized['basic_salary'];
        $nhisRelief = $basicSalary * $nhisRate; // NHIS relief (not deducted, only for tax)
        
        // Step 8: Calculate taxable income (annual)
        // Formula: Annual Gross - Pension Relief - NHIS Relief - Rent Relief
        $taxableIncome = $annualGross - $pensionRelief - $nhisRelief - $rentRelief;

        // Step 9: Calculate PAYE (progressive tax using 2025 brackets)
        $payeTax = $this->calculateProgressiveTax($taxableIncome, $year);
        $monthlyPaye = ($payeTax / 12) * $prorationFactor;

        // Step 10: Calculate deductions (all prorated)
        // IMPORTANT: NHIS is NOT a deduction - it's only a tax relief
        // Only pension is actually deducted from employee pay
        // Use the same pension rate from settings (consistency is key)
        // IMPORTANT: Round each deduction BEFORE summing to avoid cumulative rounding errors
        $monthlyPayeRounded = round($monthlyPaye, 2);
        $pensionDeductionRounded = round(($pensionableAmount / 12) * $pensionRate * $prorationFactor, 2);
        $leaveAllowanceDeductionRounded = round(($categorized['leave_allowance'] / 12) * $prorationFactor, 2);
        $thirteenthMonthDeductionRounded = round(($categorized['thirteenth_month'] / 12) * $prorationFactor, 2);
        $otherDeductionsRounded = 0.00; // Placeholder for future: loans, advances, etc.

        // Calculate total deductions by summing ROUNDED values (avoids rounding errors)
        $totalDed1: Calculate net pay using rounded values
        // Net pay uses PRORATED gross (because if staff worked 20/30 days, they get prorated pay)
        // Formula: Prorated Gross - Total Deductions (both already rounded to 2 decimals)
        $netPay = round($proratedMonthlyGross, 2) - $totalDeductions;

        // Step 12round($proratedMonthlyGross, 2) - $totalDeductions;

        // Step 11: Calculate credit to bank (net + reimbursables)
        $creditToBank = $netPay + $proratedMonthlyReimbursables;

        // Return complete calculation
        return [
            // Staff snapshot
            'staff_id' => $staff->id,
            'staff_name' => $staff->first_name . ' ' . $staff->last_name,
            'staff_code' => $staff->employee_code ?? $staff->staff_id ?? 'N/A',
            // Banking info not included - will be fetched when needed for payments
            // 'bank_name' => null,
            // 'account_number' => null,
            'pfa_code' => $staff->pfa_code ?? null,

            // Attendance data
            'days_present' => $attendanceRecord->days_worked,
            'days_absent' => $attendanceRecord->total_expected_days - $attendanceRecord->days_worked,
            'total_days' => $attendanceRecord->total_expected_days,
            'proration_factor' => round($prorationFactor, 4),

            // Annual amounts
            'annual_gross_salary' => round($annualGross, 2),
            'annual_reimbursables' => round($annualReimbursables, 2),
            'pensionable_amount' => round($pensionableAmount, 2),

            // Monthly amounts (FULL - not prorated)
            // This shows what the staff is entitled to for a full month
            'monthly_gross' => round($monthlyGross, 2), // ← This is the FULL monthly gross
            'monthly_reimbursables' => round($monthlyReimbursables, 2),

            // Prorated amounts (for actual payment calculation)
            'prorated_monthly_gross' => round($proratedMonthlyGross, 2), // ← This is reduced by attendance
            'prorated_monthly_reimbursables' => round($proratedMonthlyReimbursables, 2),
20% of rent, max NGN 500k)
            'pension_relief' => round($pensionRelief, 2), // Pension relief (8% of pensionable)
            'nhis_relief' => round($nhisRelief, 2), // NHIS relief (5% of basic - NOT deducted)
            'rent_relief' => round($rentRelief, 2), // Rent relief (replaces CRA)
            'pension_relief' => round($pensionRelief, 2), // Pension relief
            'taxable_income' => round($taxableIncome, 2),
            'paye_tax' => $monthlyPayeRounded,

            // Deductions (already rounded)
            'pension_deduction' => $pensionDeductionRounded,
            'leave_allowance_deduction' => $leaveAllowanceDeductionRounded,
            'thirteenth_month_deduction' => $thirteenthMonthDeductionRounded,
            'other_deductions' => $otherDeductionsRounded,
            'total_deductions' => round($totalDeductions, 2), // Round final sum

            // Final amounts
            'net_pay' => round($netPay, 2),
            'credit_to_bank' => round($creditToBank, 2),

            // Emoluments snapshot (JSON)
            'emoluments_snapshot' => $categorized['all_emoluments'],

            // Metadata
            'calculation_date' => now(),
            'pay_grade_structure_id' => $payGrade->id,
            // Note: attendance_id should be set by the service, not the engine
        ];
    }

    /**
     * Calculate progressive tax using Nigerian 6-tier system
     * 
     * @param float $taxableIncome - Annual taxable income
     * @param int $year - Tax year
     * @return float - Total PAYE tax
     */
    /**
     * Calculate progressive tax on taxable income
     * 
     * Nigerian PAYE Tax Calculation - Nigeria Tax Act 2025
     * 
     * Method:
     * 1. Apply progressive tax brackets directly to full chargeable income
     * 2. First NGN 800,000 is tax-free (0% band)
     * 3. Excess taxed at marginal rates (15%, 18%, 21%, 23%, 25%)
     * 
     * IMPORTANT: This calculation is DYNAMIC and works for ANY income level
     * - No hardcoded limits
     * - Fetches tax brackets from database (configurable)
     * - Works for salaries from ₦0 to ₦100,000,000+ monthly
     * 
     * Example (Low Income):
     * - Chargeable Income: ₦600,000 → PAYE: ₦0 (fully within 0% band)
     * 
     * Example (Medium Income):
     * - Chargeable Income: ₦1,356,227.32
     * - Band 1 (0-800k @ 0%): ₦800,000 × 0% = ₦0
     * - Band 2 (800k-3m @ 15%): ₦556,227.32 × 15% = ₦83,434.10
     * - Total Annual PAYE: ₦83,434.10
     * 
     * Example (High Income):
     * - Chargeable Income: ₦60,000,000 (₦5M/month)
     * - Band 1 (0-800k @ 0%): ₦0
     * - Band 2 (800k-3m @ 15%): ₦330,000
     * - Band 3 (3m-12m @ 18%): ₦1,620,000
     * - Band 4 (12m-25m @ 21%): ₦2,730,000
     * - Band 5 (25m-50m @ 23%): ₦5,750,000
     * - Band 6 (50m-60m @ 25%): ₦2,500,000
     * - Total Annual PAYE: ₦12,930,000 (₦1,077,500/month)
     * 
     * @param float $taxableIncome Annual taxable (chargeable) income
     * @param int|null $year Tax year (for bracket lookup)
     * @return float Annual tax amount
     */
    public function calculateProgressiveTax($taxableIncome, $year = null)
    {
        $year = $year ?? date('Y');

        // If income is zero or negative, no tax
        if ($taxableIncome <= 0) {
            return 0;
        }

        // Get active tax brackets for the year
        $brackets = TaxBracket::where('effective_from', '<=', "{$year}-12-31")
            ->where(function ($query) use ($year) {
                $query->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', "{$year}-01-01");
            })
            ->orderBy('tier_number')
            ->get();

        if ($brackets->isEmpty()) {
            // Fallback: use latest available brackets
            $brackets = TaxBracket::orderBy('effective_from', 'desc')
                ->orderBy('tier_number')
                ->limit(6)
                ->get();
        }

        $totalTax = 0;
        $remainingIncome = $taxableIncome; // Apply tax to FULL taxable income (no pre-deduction)

        foreach ($brackets as $bracket) {
            if ($remainingIncome <= 0) {
                break;
            }

            // Calculate income in this bracket
            $bracketIncome = 0;

            if ($bracket->income_to === null) {
                // Last tier (no upper limit)
                $bracketIncome = $remainingIncome;
            } else {
                // Calculate bracket width
                $bracketWidth = $bracket->income_to - $bracket->income_from;
                $bracketIncome = min($remainingIncome, $bracketWidth);
            }

            // Calculate tax for this bracket
            $bracketTax = $bracketIncome * ($bracket->tax_rate / 100);
            $totalTax += $bracketTax;

            // Reduce remaining income
            $remainingIncome -= $bracketIncome;
        }

        return $totalTax;
    }

    /**
     * Calculate Consolidated Relief Allowance (CRA)
     * 
     * CRA is a tax relief granted to employees in Nigeria.
     * Formula: Higher of (1% of Annual Gross + ₦200,000) OR (20% of Annual Gross)
     * Capped at: ₦840,000 per year (as per payroll_settings.TAX_EXEMPTION)
     * 
     * Reference: Companies Income Tax Act (Amendment) 2011
     * 
     * @param float $annualGross - Annual gross salary
     * @return float - CRA amount
     */
    private function calculateCRA($annualGross)
    {
        // Get CRA configuration from payroll_settings
        $craConfig = DB::table('payroll_settings')
            ->where('setting_key', 'TAX_EXEMPTION')
            ->first();

        if (!$craConfig) {
            // Fallback to standard Nigerian CRA if config not found
            $maxCRA = 840000; // Standard max as of 2025
            $craPercentage = 0.20; // 20% of gross
        } else {
            $config = json_decode($craConfig->setting_value, true);
            $maxCRA = $config['annual_exemption'] ?? 840000;
            $craPercentage = ($config['cra_percentage'] ?? 20) / 100;
        }

        // Calculate CRA using both methods
        $method1 = (0.01 * $annualGross) + 200000; // 1% of gross + ₦200,000
        $method2 = $craPercentage * $annualGross;   // Configurable % of gross (default 20%)

        // Take the higher value
        $cra = max($method1, $method2);

        // Cap at maximum allowed
        $cra = min($cra, $maxCRA);

        return $cra;
    }

    /**
     * Separate emoluments by category
     * 
     * @param array $emoluments - Array of emolument components with amounts
     * @return array - Categorized amounts
     */
    public function separateEmolumentsByCategory($emoluments)
    {
        $annualGross = 0;
        $annualReimbursables = 0;
        $pensionableAmount = 0;
        $leaveAllowance = 0;
        $thirteenthMonth = 0;
        $allEmoluments = [];

        foreach ($emoluments as $emolument) {
            $amount = (float) $emolument->amount;
            $code = $emolument->component_code;

            // Store in snapshot
            $allEmoluments[$code] = $amount;

            // Categorize by payroll_category
            // CRITICAL: salary and allowance components count toward annual gross
            // Reimbursables are separate (transport, meals paid after salary processing)
            // Deductions tracked separately but STILL count toward gross (Leave/13th Month are paid but spread)
            switch ($emolument->payroll_category) {
                case 'salary':
                case 'allowance':
                    $annualGross += $amount;
                    break;

                case 'reimbursable':
                    $annualReimbursables += $amount;
                    break;

                case 'deduction':
                    // Deductions like Leave Allowance and 13th Month are PART OF GROSS
                    // but are deducted monthly and paid back at specific times
                    $annualGross += $amount;

                    // Track specific deductions for monthly deduction calculation
                    if ($code === 'LEAVE_ALLOWANCE') {
                        $leaveAllowance = $amount;
                    } elseif ($code === 'THIRTEENTH_MONTH') {
                        $thirteenthMonth = $amount;
                    }
                    break;
            }

            // Track pensionable components
            if ($emolument->is_pensionable) {
                $pensionableAmount += $amount;
            }
        }

        return [
            'annual_gross' => $annualGross,
            'annual_reimbursables' => $annualReimbursables,
            'pensionable_amount' => $pensionableAmount,
            'basic_salary' => $allEmoluments['BASIC_SALARY'] ?? 0, // For NHIS calculation
            'leave_allowance' => $leaveAllowance,
            'thirteenth_month' => $thirteenthMonth,
            'all_emoluments' => $allEmoluments,
        ];
    }

    /**
     * Get emoluments for a pay grade structure
     * 
     * FIXED: Read from pay_grade_structures.emoluments JSON column
     * (Previously queried non-existent junction table 'pay_grade_emoluments')
     * 
     * @param int $payGradeId - Pay grade structure ID
     * @return \Illuminate\Support\Collection - Emoluments with amounts
     */
    private function getPayGradeEmoluments($payGradeId)
    {
        // Get pay grade structure
        $payGrade = DB::table('pay_grade_structures')->find($payGradeId);

        // Return empty collection if not found or no emoluments
        if (!$payGrade || !$payGrade->emoluments) {
            return collect();
        }

        // Decode JSON emoluments
        // Expected format: [{"component_id": 57, "amount": 500000}, ...]
        $emolumentsJson = json_decode($payGrade->emoluments, true);

        if (empty($emolumentsJson)) {
            return collect();
        }

        // Extract component IDs
        $componentIds = array_column($emolumentsJson, 'component_id');

        // Fetch component details and merge with amounts
        return DB::table('emolument_components')
            ->whereIn('id', $componentIds)
            ->where('is_active', true)
            ->get()
            ->map(function ($component) use ($emolumentsJson) {
                // Find matching amount from JSON
                $match = collect($emolumentsJson)->firstWhere('component_id', $component->id);
                $component->amount = $match['amount'] ?? 0;
                return $component;
            });
    }

    /**
     * Calculate total days based on calculation method
     * 
     * @param int $month - Month (1-12)
     * @param int $year - Year
     * @param string $method - 'calendar_days' or 'working_days'
     * @return int - Total days
     */
    public function calculateTotalDays($month, $year, $method = 'calendar_days')
    {
        // Get days in month using DateTime (no Calendar extension required)
        $daysInMonth = (int) date('t', mktime(0, 0, 0, $month, 1, $year));

        if ($method === 'calendar_days') {
            return $daysInMonth;
        }

        // Calculate working days (Monday-Friday)
        $workingDays = 0;

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $timestamp = mktime(0, 0, 0, $month, $day, $year);
            $dayOfWeek = date('N', $timestamp); // 1 (Monday) to 7 (Sunday)

            if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
                $workingDays++;
            }
        }

        return $workingDays;
    }

    /**
     * Validate payroll calculation before saving
     * 
     * @param array $calculation - Payroll calculation result
     * @return array - Validation result ['valid' => bool, 'errors' => array]
     */
    public function validateCalculation($calculation)
    {
        $errors = [];

        // Check for negative values
        if ($calculation['monthly_gross'] < 0) {
            $errors[] = 'Monthly gross cannot be negative';
        }

        if ($calculation['net_pay'] < 0) {
            $errors[] = 'Net pay is negative - deductions exceed gross pay';
        }

        // Check proration factor range
        if ($calculation['proration_factor'] < 0 || $calculation['proration_factor'] > 1) {
            $errors[] = 'Proration factor must be between 0 and 1';
        }

        // Check attendance logic
        if ($calculation['days_present'] + $calculation['days_absent'] != $calculation['total_days']) {
            $errors[] = 'Attendance days do not add up correctly';
        }

        // Verify deductions calculation
        $expectedDeductions = $calculation['paye_tax'] +
            $calculation['pension_deduction'] +
            $calculation['leave_allowance_deduction'] +
            $calculation['thirteenth_month_deduction'] +
            $calculation['other_deductions'];

        if (abs($expectedDeductions - $calculation['total_deductions']) > 0.01) {
            $errors[] = 'Total deductions calculation mismatch';
        }

        // Verify net pay calculation
        // Net pay should be calculated from PRORATED gross (not full monthly gross)
        $expectedNetPay = $calculation['prorated_monthly_gross'] - $calculation['total_deductions'];

        if (abs($expectedNetPay - $calculation['net_pay']) > 0.01) {
            $errors[] = 'Net pay calculation mismatch';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Get payroll setting value from database
     * 
     * Helper method to fetch configurable rates/values from payroll_settings table
     * This prevents hardcoding and allows system-wide configuration changes
     * 
     * @param string $key Setting key (e.g., 'PENSION_RATE', 'RENT_RELIEF_CAP')
     * @param mixed $default Default value if setting not found
     * @param bool $asPercentage If true, converts percentage values (e.g., 8 → 0.08)
     * @return mixed Setting value or default
     */
    private function getPayrollSetting($key, $default = null, $asPercentage = false)
    {
        static $cache = [];

        // Cache key includes the percentage flag
        $cacheKey = $key . ($asPercentage ? '_pct' : '');

        // Check cache first to avoid repeated DB queries
        if (isset($cache[$cacheKey])) {
            return $cache[$cacheKey];
        }

        try {
            $setting = DB::table('payroll_settings')
                ->where('setting_key', $key)
                ->where('is_active', true)
                ->first();

            if ($setting) {
                $value = json_decode($setting->setting_value, true);
                $extractedValue = null;

                // Handle different value formats
                if (is_array($value)) {
                    // Try common keys for rate/value
                    if (isset($value['rate'])) {
                        $extractedValue = (float) $value['rate'];
                    } elseif (isset($value['employee_rate'])) {
                        $extractedValue = (float) $value['employee_rate'];
                    } elseif (isset($value['value'])) {
                        $extractedValue = (float) $value['value'];
                    } else {
                        // If array has no recognizable key, use default
                        $extractedValue = $default;
                    }
                } else {
                    // Simple scalar value
                    $extractedValue = is_numeric($value) ? (float) $value : $default;
                }

                // Convert percentage values if needed (8 → 0.08)
                if ($asPercentage && $extractedValue !== null && $extractedValue > 1) {
                    $extractedValue = $extractedValue / 100;
                }

                $cache[$cacheKey] = $extractedValue;
                return $extractedValue;
            }
        } catch (\Exception $e) {
            // If table doesn't exist or query fails, use default
            Log::warning("PayrollSetting not found: {$key}, using default: {$default}");
        }

        $cache[$cacheKey] = $default;
        return $default;
    }
}
