<?php

namespace App\Services;

use Carbon\Carbon;

/**
 * AttendanceCalculationService
 * 
 * Handles attendance-based payroll calculations for invoicing system.
 * Implements proportional salary adjustments based on attendance data
 * and client pay calculation basis (working_days vs calendar_days).
 * 
 * @author HRM-ERP System
 * @version 1.0
 * @date September 29, 2025
 */
class AttendanceCalculationService
{
    /**
     * Calculate attendance factor based on client pay basis
     * 
     * @param int $daysWorked Number of days the employee worked
     * @param string $clientPayBasis 'working_days' or 'calendar_days'
     * @param int $month Month number (1-12)
     * @param int $year Year (e.g., 2025)
     * @return float Attendance factor (0.0 to 1.0)
     * @throws \InvalidArgumentException
     */
    public function calculateAttendanceFactor($daysWorked, $clientPayBasis, $month, $year)
    {
        try {
            // Validate inputs
            if ($daysWorked < 0) {
                throw new \InvalidArgumentException('Days worked cannot be negative');
            }

            if (!in_array($clientPayBasis, ['working_days', 'calendar_days'])) {
                throw new \InvalidArgumentException('Invalid pay calculation basis. Must be working_days or calendar_days');
            }

            $totalDays = $this->getTotalDaysForBasis($clientPayBasis, $month, $year);

            // Validate days worked doesn't exceed maximum
            if ($daysWorked > $totalDays) {
                $daysWorked = $totalDays; // Cap at maximum
            }

            // Calculate attendance factor
            $attendanceFactor = $totalDays > 0 ? $daysWorked / $totalDays : 0;

            return round($attendanceFactor, 4); // 4 decimal precision

        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Apply attendance factor to salary components only (not deductions)
     * 
     * @param array $salaryComponents Array of salary components with amounts
     * @param float $attendanceFactor Attendance factor (0.0 to 1.0)
     * @return array Adjusted salary components
     */
    public function adjustSalaryComponents($salaryComponents, $attendanceFactor)
    {
        try {
            if (!is_array($salaryComponents)) {
                throw new \InvalidArgumentException('Salary components must be an array');
            }

            if ($attendanceFactor < 0 || $attendanceFactor > 1) {
                throw new \InvalidArgumentException('Attendance factor must be between 0 and 1');
            }

            $adjustedComponents = [];
            $totalAdjustedGross = 0;

            foreach ($salaryComponents as $componentName => $componentData) {
                // Handle both simple amount and complex component structure
                $baseAmount = is_array($componentData) ? ($componentData['amount'] ?? 0) : $componentData;

                // Apply attendance factor to get adjusted amount
                $adjustedAmount = $baseAmount * $attendanceFactor;

                // Store adjusted component with metadata
                $adjustedComponents[$componentName] = [
                    'base_amount' => $baseAmount,
                    'adjusted_amount' => round($adjustedAmount, 2),
                    'attendance_factor' => $attendanceFactor,
                    'component_type' => $componentData['type'] ?? 'allowance'
                ];

                // Add to total if it's a positive allowance component
                if ($adjustedAmount > 0) {
                    $totalAdjustedGross += $adjustedAmount;
                }
            }

            // Add calculated gross to the result
            $adjustedComponents['_calculated_gross'] = round($totalAdjustedGross, 2);

            return $adjustedComponents;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Calculate deductions based on adjusted components and template rules
     * 
     * @param array $adjustedComponents Adjusted salary components
     * @param array $deductionRules Template deduction rules
     * @return array Calculated deductions with amounts
     */
    public function calculateDeductions($adjustedComponents, $deductionRules)
    {
        try {
            if (!is_array($adjustedComponents) || !is_array($deductionRules)) {
                throw new \InvalidArgumentException('Both adjusted components and deduction rules must be arrays');
            }

            $calculatedDeductions = [];
            $totalDeductions = 0;

            foreach ($deductionRules as $deductionName => $deductionRule) {
                $deductionAmount = $this->calculateSingleDeduction($adjustedComponents, $deductionRule);

                $calculatedDeductions[$deductionName] = [
                    'amount' => round($deductionAmount, 2),
                    'rule' => $deductionRule,
                    'calculation_base' => $this->getDeductionBase($adjustedComponents, $deductionRule)
                ];

                $totalDeductions += $deductionAmount;
            }

            // Add total deductions to result
            $calculatedDeductions['_total_deductions'] = round($totalDeductions, 2);

            return $calculatedDeductions;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Calculate final credit to bank (adjusted gross + total deductions)
     * 
     * @param float $adjustedGross Total adjusted gross salary
     * @param float $totalDeductions Total calculated deductions
     * @return float Credit to bank amount
     */
    public function calculateCreditToBank($adjustedGross, $totalDeductions)
    {
        try {
            if ($adjustedGross < 0 || $totalDeductions < 0) {
                throw new \InvalidArgumentException('Adjusted gross and total deductions must be non-negative');
            }

            // Credit to Bank = Adjusted Gross + Total Deductions
            // (Client pays us everything - we distribute salary and remit deductions)
            $creditToBank = $adjustedGross + $totalDeductions;

            return round($creditToBank, 2);
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Validate attendance data against pay basis limits
     * 
     * @param array $attendanceData Array of attendance records
     * @param string $clientPayBasis 'working_days' or 'calendar_days'
     * @return array Validation results with errors and warnings
     */
    public function validateAttendanceData($attendanceData, $clientPayBasis)
    {
        try {
            $validationResults = [
                'valid' => true,
                'errors' => [],
                'warnings' => [],
                'processed_records' => 0
            ];

            if (!is_array($attendanceData)) {
                $validationResults['valid'] = false;
                $validationResults['errors'][] = 'Attendance data must be an array';
                return $validationResults;
            }

            foreach ($attendanceData as $index => $record) {
                $recordValidation = $this->validateSingleAttendanceRecord($record, $clientPayBasis, $index);

                if (!$recordValidation['valid']) {
                    $validationResults['valid'] = false;
                    $validationResults['errors'] = array_merge($validationResults['errors'], $recordValidation['errors']);
                }

                if (!empty($recordValidation['warnings'])) {
                    $validationResults['warnings'] = array_merge($validationResults['warnings'], $recordValidation['warnings']);
                }

                $validationResults['processed_records']++;
            }

            return $validationResults;
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Get total days for the specified pay calculation basis
     * 
     * @param string $basis 'working_days' or 'calendar_days'
     * @param int $month Month number (1-12)
     * @param int $year Year
     * @return int Total days
     */
    private function getTotalDaysForBasis($basis, $month, $year)
    {
        $date = Carbon::create($year, $month, 1);

        if ($basis === 'calendar_days') {
            return $date->daysInMonth();
        } elseif ($basis === 'working_days') {
            return $this->getWorkingDaysInMonth($date);
        }

        throw new \InvalidArgumentException("Invalid basis: $basis");
    }

    /**
     * Calculate working days in a month (excludes weekends)
     * 
     * @param Carbon $date Date object for the month
     * @return int Number of working days
     */
    private function getWorkingDaysInMonth($date)
    {
        $workingDays = 0;
        $daysInMonth = $date->daysInMonth();

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $currentDate = $date->copy()->day($day);

            // Count Monday (1) through Friday (5) as working days
            if ($currentDate->dayOfWeek >= Carbon::MONDAY && $currentDate->dayOfWeek <= Carbon::FRIDAY) {
                $workingDays++;
            }
        }

        return $workingDays;
    }

    /**
     * Calculate a single deduction based on its rule
     * 
     * @param array $adjustedComponents Adjusted salary components
     * @param array $deductionRule Deduction calculation rule
     * @return float Calculated deduction amount
     */
    private function calculateSingleDeduction($adjustedComponents, $deductionRule)
    {
        $calculationBase = $this->getDeductionBase($adjustedComponents, $deductionRule);

        // Handle different deduction types
        $deductionType = $deductionRule['type'] ?? 'percentage';

        switch ($deductionType) {
            case 'percentage':
                $rate = $deductionRule['rate'] ?? 0;
                return $calculationBase * ($rate / 100);

            case 'fixed':
                return $deductionRule['amount'] ?? 0;

            case 'formula':
                // Handle complex formula-based deductions
                return $this->evaluateDeductionFormula($deductionRule['formula'], $adjustedComponents);

            default:
                return 0;
        }
    }

    /**
     * Get the calculation base for a deduction based on its rule
     * 
     * @param array $adjustedComponents Adjusted salary components
     * @param array $deductionRule Deduction calculation rule
     * @return float Calculation base amount
     */
    private function getDeductionBase($adjustedComponents, $deductionRule)
    {
        $baseComponents = $deductionRule['base_components'] ?? ['_calculated_gross'];
        $baseAmount = 0;

        foreach ($baseComponents as $componentName) {
            if ($componentName === '_calculated_gross') {
                $baseAmount += $adjustedComponents['_calculated_gross'] ?? 0;
            } elseif (isset($adjustedComponents[$componentName])) {
                $componentData = $adjustedComponents[$componentName];
                $baseAmount += is_array($componentData) ? $componentData['adjusted_amount'] : $componentData;
            }
        }

        return $baseAmount;
    }

    /**
     * Evaluate complex deduction formulas
     * 
     * @param string $formula Deduction formula
     * @param array $adjustedComponents Adjusted salary components
     * @return float Calculated amount
     */
    private function evaluateDeductionFormula($formula, $adjustedComponents)
    {
        // TODO: Implement complex formula evaluation
        // For now, return 0 - this will be enhanced in future phases
        return 0;
    }

    /**
     * Validate a single attendance record
     * 
     * @param array $record Attendance record
     * @param string $clientPayBasis Pay calculation basis
     * @param int $index Record index for error reporting
     * @return array Validation result
     */
    private function validateSingleAttendanceRecord($record, $clientPayBasis, $index)
    {
        $result = [
            'valid' => true,
            'errors' => [],
            'warnings' => []
        ];

        // Check required fields
        $requiredFields = ['employee_code', 'employee_name', 'designation', 'days_worked'];
        foreach ($requiredFields as $field) {
            if (!isset($record[$field]) || empty($record[$field])) {
                $result['valid'] = false;
                $result['errors'][] = "Record $index: Missing required field '$field'";
            }
        }

        // Validate days worked
        if (isset($record['days_worked'])) {
            $daysWorked = $record['days_worked'];

            if (!is_numeric($daysWorked) || $daysWorked < 0) {
                $result['valid'] = false;
                $result['errors'][] = "Record $index: Days worked must be a non-negative number";
            }

            // Check against basis limits if month/year provided
            if (isset($record['month']) && isset($record['year']) && is_numeric($daysWorked)) {
                $maxDays = $this->getTotalDaysForBasis($clientPayBasis, $record['month'], $record['year']);

                if ($daysWorked > $maxDays) {
                    $result['warnings'][] = "Record $index: Days worked ($daysWorked) exceeds maximum for $clientPayBasis basis ($maxDays)";
                }
            }
        }

        return $result;
    }
}
