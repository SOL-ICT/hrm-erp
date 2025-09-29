<?php

namespace App\Services;

use App\Models\Staff;
use App\Models\Client;
use App\Models\AttendanceRecord;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * AttendanceBasedPayrollService
 * 
 * Handles attendance-based salary calculations with pro-rated adjustments
 * Based on client pay calculation basis (Calendar Days vs Working Days)
 * 
 * Phase 3.1: Attendance-Based Salary Calculation Implementation
 */
class AttendanceBasedPayrollService
{
    /**
     * Calculate adjusted salary based on attendance
     * 
     * @param Staff $employee
     * @param int $daysWorked
     * @param string $clientPayBasis ('calendar_days' or 'working_days')
     * @param array $templateSettings
     * @return array
     */
    public function calculateAdjustedSalary(Staff $employee, int $daysWorked, string $clientPayBasis, array $templateSettings = []): array
    {
        try {
            Log::info("Starting attendance-based salary calculation", [
                'employee_id' => $employee->id,
                'employee_name' => $employee->full_name,
                'days_worked' => $daysWorked,
                'pay_basis' => $clientPayBasis
            ]);

            // 1. Get total days for calculation basis
            $totalDays = $this->getTotalDays($clientPayBasis);

            // 2. Calculate attendance factor
            $attendanceFactor = $this->calculateAttendanceFactor($daysWorked, $totalDays);

            // 3. Get base salary components from employee pay grade
            $baseSalaryComponents = $this->getBaseSalaryComponents($employee);

            // 4. Apply attendance factor to allowance components
            $adjustedComponents = $this->adjustAllowanceComponents($baseSalaryComponents, $attendanceFactor);

            // 5. Calculate gross salary (sum of adjusted allowances)
            $grossSalary = $this->calculateGross($adjustedComponents);

            // 6. Calculate statutory deductions based on template settings
            $statutoryDeductions = $this->calculateStatutoryDeductions($grossSalary, $adjustedComponents, $templateSettings);

            // 7. Calculate net salary
            $netSalary = $this->calculateNetSalary($grossSalary, $statutoryDeductions);

            // 8. Calculate credit to bank (what client pays us)
            $creditToBank = $this->calculateCreditToBank($grossSalary, $statutoryDeductions);

            $result = [
                'employee_id' => $employee->id,
                'employee_name' => $employee->full_name,
                'employee_code' => $employee->employee_code,
                'pay_grade' => $employee->pay_grade,
                'days_worked' => $daysWorked,
                'total_days' => $totalDays,
                'attendance_factor' => round($attendanceFactor, 4),
                'attendance_percentage' => round($attendanceFactor * 100, 2),
                'base_components' => $baseSalaryComponents,
                'adjusted_components' => $adjustedComponents,
                'gross_salary' => round($grossSalary, 2),
                'statutory_deductions' => $statutoryDeductions,
                'net_salary' => round($netSalary, 2),
                'credit_to_bank' => round($creditToBank, 2),
                'calculation_basis' => $clientPayBasis,
                'calculated_at' => now()->toDateTimeString()
            ];

            Log::info("Attendance-based salary calculation completed successfully", [
                'employee_id' => $employee->id,
                'gross_salary' => $grossSalary,
                'net_salary' => $netSalary,
                'credit_to_bank' => $creditToBank
            ]);

            return $result;
        } catch (\Exception $e) {
            Log::error("Error in attendance-based salary calculation", [
                'employee_id' => $employee->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }

    /**
     * Get total days based on client pay calculation basis
     * 
     * @param string $payBasis
     * @return int
     */
    private function getTotalDays(string $payBasis): int
    {
        $currentMonth = now();

        switch ($payBasis) {
            case 'working_days':
                // Calculate working days (excluding weekends)
                $startOfMonth = $currentMonth->copy()->startOfMonth();
                $endOfMonth = $currentMonth->copy()->endOfMonth();
                $workingDays = 0;

                while ($startOfMonth->lte($endOfMonth)) {
                    if ($startOfMonth->isWeekday()) {
                        $workingDays++;
                    }
                    $startOfMonth->addDay();
                }

                return $workingDays;

            case 'calendar_days':
            default:
                // All days in the month
                return $currentMonth->daysInMonth;
        }
    }

    /**
     * Calculate attendance factor
     * 
     * @param int $daysWorked
     * @param int $totalDays
     * @return float
     */
    private function calculateAttendanceFactor(int $daysWorked, int $totalDays): float
    {
        if ($totalDays === 0) {
            return 0;
        }

        // Cap at 100% (can't work more than total days)
        return min($daysWorked / $totalDays, 1.0);
    }

    /**
     * Get base salary components from employee pay grade
     * 
     * @param Staff $employee
     * @return array
     */
    private function getBaseSalaryComponents(Staff $employee): array
    {
        // Get basic salary and allowances from employee record
        $components = [
            'basic_salary' => floatval($employee->basic_salary ?? 0),
        ];

        // Add standard allowances if they exist
        $allowanceFields = [
            'housing_allowance',
            'transport_allowance',
            'meal_allowance',
            'medical_allowance',
            'utility_allowance',
            'telephone_allowance',
            'education_allowance',
            'leave_allowance',
            'overtime_allowance'
        ];

        foreach ($allowanceFields as $field) {
            if (isset($employee->$field) && $employee->$field > 0) {
                $components[$field] = floatval($employee->$field);
            }
        }

        return $components;
    }

    /**
     * Apply attendance factor to allowance components
     * 
     * @param array $baseSalaryComponents
     * @param float $attendanceFactor
     * @return array
     */
    private function adjustAllowanceComponents(array $baseSalaryComponents, float $attendanceFactor): array
    {
        $adjustedComponents = [];

        foreach ($baseSalaryComponents as $component => $amount) {
            $adjustedAmount = $amount * $attendanceFactor;
            $adjustedComponents[$component] = [
                'base_amount' => round($amount, 2),
                'adjusted_amount' => round($adjustedAmount, 2),
                'attendance_factor' => $attendanceFactor,
                'adjustment' => round($adjustedAmount - $amount, 2)
            ];
        }

        return $adjustedComponents;
    }

    /**
     * Calculate gross salary (sum of adjusted allowances)
     * 
     * @param array $adjustedComponents
     * @return float
     */
    private function calculateGross(array $adjustedComponents): float
    {
        $gross = 0;

        foreach ($adjustedComponents as $component) {
            $gross += $component['adjusted_amount'];
        }

        return $gross;
    }

    /**
     * Calculate statutory deductions based on template settings
     * 
     * @param float $grossSalary
     * @param array $adjustedComponents
     * @param array $templateSettings
     * @return array
     */
    private function calculateStatutoryDeductions(float $grossSalary, array $adjustedComponents, array $templateSettings): array
    {
        $deductions = [
            'paye' => 0,
            'pension' => 0,
            'nhf' => 0,
            'nsitf' => 0,
            'itf' => 0
        ];

        // Use template settings if provided, otherwise use default rates
        $statutoryRates = $templateSettings['statutory'] ?? [];

        // PAYE (Pay As You Earn) - Based on annual gross
        if (isset($statutoryRates['paye']) && $statutoryRates['paye']['enabled']) {
            $deductions['paye'] = $this->calculatePAYE($grossSalary, $statutoryRates['paye']);
        } else {
            $deductions['paye'] = $this->calculatePAYE($grossSalary);
        }

        // Pension - Usually 8% of basic + housing + transport
        if (isset($statutoryRates['pension']) && $statutoryRates['pension']['enabled']) {
            $pensionBase = $this->getPensionBase($adjustedComponents);
            $deductions['pension'] = $this->calculatePercentage($pensionBase, $statutoryRates['pension']['rate'] ?? 8);
        }

        // NHF (National Housing Fund) - 2.5% of monthly gross (if gross >= ₦3,000)
        if (isset($statutoryRates['nhf']) && $statutoryRates['nhf']['enabled']) {
            if ($grossSalary >= 3000) {
                $deductions['nhf'] = $this->calculatePercentage($grossSalary, $statutoryRates['nhf']['rate'] ?? 2.5);
            }
        }

        // NSITF (Nigeria Social Insurance Trust Fund) - 1% of monthly gross
        if (isset($statutoryRates['nsitf']) && $statutoryRates['nsitf']['enabled']) {
            $deductions['nsitf'] = $this->calculatePercentage($grossSalary, $statutoryRates['nsitf']['rate'] ?? 1);
        }

        // ITF (Industrial Training Fund) - 1% of annual payroll
        if (isset($statutoryRates['itf']) && $statutoryRates['itf']['enabled']) {
            $annualGross = $grossSalary * 12;
            $deductions['itf'] = $this->calculatePercentage($annualGross, $statutoryRates['itf']['rate'] ?? 1) / 12;
        }

        // Round all deductions
        foreach ($deductions as $key => $amount) {
            $deductions[$key] = round($amount, 2);
        }

        return $deductions;
    }

    /**
     * Calculate PAYE tax
     * 
     * @param float $grossSalary
     * @param array $payeSettings
     * @return float
     */
    private function calculatePAYE(float $grossSalary, array $payeSettings = []): float
    {
        $annualGross = $grossSalary * 12;
        $taxFreeAllowance = 200000 + min($annualGross * 0.01, 200000); // ₦200,000 + 1% of gross (max ₦200,000)

        if ($annualGross <= $taxFreeAllowance) {
            return 0;
        }

        $taxableIncome = $annualGross - $taxFreeAllowance;
        $annualTax = 0;

        // Nigerian tax brackets for 2025
        $brackets = [
            ['min' => 0, 'max' => 300000, 'rate' => 7],
            ['min' => 300000, 'max' => 600000, 'rate' => 11],
            ['min' => 600000, 'max' => 1100000, 'rate' => 15],
            ['min' => 1100000, 'max' => 1600000, 'rate' => 19],
            ['min' => 1600000, 'max' => 3200000, 'rate' => 21],
            ['min' => 3200000, 'max' => PHP_INT_MAX, 'rate' => 24]
        ];

        foreach ($brackets as $bracket) {
            if ($taxableIncome <= 0) break;

            $bracketMax = min($bracket['max'], $bracket['min'] + $taxableIncome);
            $bracketAmount = $bracketMax - $bracket['min'];

            if ($bracketAmount > 0) {
                $annualTax += $bracketAmount * ($bracket['rate'] / 100);
                $taxableIncome -= $bracketAmount;
            }
        }

        return $annualTax / 12; // Monthly PAYE
    }

    /**
     * Get pension base (typically basic + housing + transport)
     * 
     * @param array $adjustedComponents
     * @return float
     */
    private function getPensionBase(array $adjustedComponents): float
    {
        $pensionBase = 0;
        $pensionableComponents = ['basic_salary', 'housing_allowance', 'transport_allowance'];

        foreach ($pensionableComponents as $component) {
            if (isset($adjustedComponents[$component])) {
                $pensionBase += $adjustedComponents[$component]['adjusted_amount'];
            }
        }

        return $pensionBase;
    }

    /**
     * Calculate percentage
     * 
     * @param float $amount
     * @param float $percentage
     * @return float
     */
    private function calculatePercentage(float $amount, float $percentage): float
    {
        return $amount * ($percentage / 100);
    }

    /**
     * Calculate net salary
     * 
     * @param float $grossSalary
     * @param array $statutoryDeductions
     * @return float
     */
    private function calculateNetSalary(float $grossSalary, array $statutoryDeductions): float
    {
        $totalDeductions = array_sum($statutoryDeductions);
        return $grossSalary - $totalDeductions;
    }

    /**
     * Calculate credit to bank (what client pays us)
     * In our model: Credit to Bank = Gross Salary + Total Deductions
     * (Client pays us the full amount, we distribute salary and remit deductions)
     * 
     * @param float $grossSalary
     * @param array $statutoryDeductions
     * @return float
     */
    private function calculateCreditToBank(float $grossSalary, array $statutoryDeductions): float
    {
        $totalDeductions = array_sum($statutoryDeductions);
        return $grossSalary + $totalDeductions;
    }

    /**
     * Calculate attendance-based payroll for multiple employees
     * 
     * @param array $attendanceRecords
     * @param string $clientPayBasis
     * @param array $templateSettings
     * @return array
     */
    public function calculateBulkAttendancePayroll(array $attendanceRecords, string $clientPayBasis, array $templateSettings = []): array
    {
        $results = [];
        $summary = [
            'total_employees' => count($attendanceRecords),
            'total_gross' => 0,
            'total_deductions' => 0,
            'total_net' => 0,
            'total_credit_to_bank' => 0
        ];

        foreach ($attendanceRecords as $record) {
            try {
                $employee = Staff::find($record['employee_id']);
                if (!$employee) {
                    Log::warning("Employee not found for attendance calculation", ['employee_id' => $record['employee_id']]);
                    continue;
                }

                $calculation = $this->calculateAdjustedSalary(
                    $employee,
                    $record['days_worked'],
                    $clientPayBasis,
                    $templateSettings
                );

                $results[] = $calculation;

                // Update summary
                $summary['total_gross'] += $calculation['gross_salary'];
                $summary['total_deductions'] += array_sum($calculation['statutory_deductions']);
                $summary['total_net'] += $calculation['net_salary'];
                $summary['total_credit_to_bank'] += $calculation['credit_to_bank'];
            } catch (\Exception $e) {
                Log::error("Error calculating payroll for employee", [
                    'employee_id' => $record['employee_id'],
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Round summary totals
        foreach (['total_gross', 'total_deductions', 'total_net', 'total_credit_to_bank'] as $field) {
            $summary[$field] = round($summary[$field], 2);
        }

        return [
            'calculations' => $results,
            'summary' => $summary,
            'calculated_at' => now()->toDateTimeString()
        ];
    }
}
