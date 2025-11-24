<?php

namespace App\Services;

use App\Models\TaxBracket;
use App\Models\PayrollCalculationFormula;
use Illuminate\Support\Facades\DB;

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
 * 4. MONTHLY_GROSS - (ANNUAL_GROSS / 12) × proration
 * 5. MONTHLY_REIMBURSABLES - (ANNUAL_REIMBURSABLES / 12) × proration
 * 6. CRA - Consolidated Relief Allowance (higher of 1% + ₦200k or 20% of gross, capped at ₦840k)
 * 7. TAXABLE_INCOME - (ANNUAL_GROSS × 0.95) - (PENSIONABLE × 0.08) - CRA
 * 8. PAYE - Progressive tax on taxable income
 * 9. PENSION - (PENSIONABLE / 12) × 0.08 × proration
 * 10. LEAVE_ALLOWANCE_DEDUCTION - (LEAVE / 12) × proration
 * 11. THIRTEENTH_MONTH_DEDUCTION - (13TH / 12) × proration
 * 12. NET_PAY - MONTHLY_GROSS - total_deductions
 * 13. CREDIT_TO_BANK - NET_PAY + MONTHLY_REIMBURSABLES
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

        // Step 5: Calculate monthly amounts (prorated)
        $monthlyGross = ($annualGross / 12) * $prorationFactor;
        $monthlyReimbursables = ($annualReimbursables / 12) * $prorationFactor;

        // Step 6: Calculate CRA (Consolidated Relief Allowance)
        $cra = $this->calculateCRA($annualGross);

        // Step 7: Calculate taxable income (annual)
        // Formula: (Annual Gross × 95%) - (Pensionable × 8%) - CRA
        // Reference: payroll_settings.TAXABLE_INCOME_FORMULA
        $grossIncome = $annualGross * 0.95; // 95% of gross (CRA relief)
        $pensionRelief = $pensionableAmount * 0.08; // Pension contribution relief
        $taxableIncome = $grossIncome - $pensionRelief - $cra;

        // Step 8: Calculate PAYE (progressive tax)
        $payeTax = $this->calculateProgressiveTax($taxableIncome, $year);
        $monthlyPaye = ($payeTax / 12) * $prorationFactor;

        // Step 8: Calculate deductions (all prorated)
        $pensionDeduction = ($pensionableAmount / 12) * 0.08 * $prorationFactor;
        $leaveAllowanceDeduction = ($categorized['leave_allowance'] / 12) * $prorationFactor;
        $thirteenthMonthDeduction = ($categorized['thirteenth_month'] / 12) * $prorationFactor;
        $otherDeductions = 0.00; // Placeholder for future: loans, advances, etc.

        $totalDeductions = $monthlyPaye + $pensionDeduction + $leaveAllowanceDeduction + $thirteenthMonthDeduction + $otherDeductions;

        // Step 9: Calculate net pay
        $netPay = $monthlyGross - $totalDeductions;

        // Step 10: Calculate credit to bank (net + reimbursables)
        $creditToBank = $netPay + $monthlyReimbursables;

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

            // Monthly amounts (prorated)
            'monthly_gross' => round($monthlyGross, 2),
            'monthly_reimbursables' => round($monthlyReimbursables, 2),

            // Tax calculation components
            'consolidated_relief_allowance' => round($cra, 2), // CRA for audit trail
            'taxable_income' => round($taxableIncome, 2),
            'paye_tax' => round($monthlyPaye, 2),

            // Deductions
            'pension_deduction' => round($pensionDeduction, 2),
            'leave_allowance_deduction' => round($leaveAllowanceDeduction, 2),
            'thirteenth_month_deduction' => round($thirteenthMonthDeduction, 2),
            'other_deductions' => round($otherDeductions, 2),
            'total_deductions' => round($totalDeductions, 2),

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
    public function calculateProgressiveTax($taxableIncome, $year = null)
    {
        $year = $year ?? date('Y');

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
        $remainingIncome = $taxableIncome;

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
            switch ($emolument->payroll_category) {
                case 'salary':
                case 'allowance':
                    // Add to annual gross (excludes reimbursables and deductions)
                    if ($emolument->payroll_category !== 'reimbursable' && $emolument->payroll_category !== 'deduction') {
                        $annualGross += $amount;
                    }
                    break;

                case 'reimbursable':
                    $annualReimbursables += $amount;
                    break;

                case 'deduction':
                    // Track specific deductions
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
        $expectedNetPay = $calculation['monthly_gross'] - $calculation['total_deductions'];

        if (abs($expectedNetPay - $calculation['net_pay']) > 0.01) {
            $errors[] = 'Net pay calculation mismatch';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}
