<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Client;
use App\Models\EmolumentComponent;
use App\Models\PayGrade;
use App\Models\PayrollRun;
use App\Models\PayrollItem;
use App\Models\Staff;
use App\Models\AttendanceRecord;
use App\Services\AttendanceCalculationService;
use App\Services\PayrollCalculationEngine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayrollCalculationService
{
    /**
     * Calculate the number of days for payroll based on client's pay calculation basis
     */
    public static function calculatePayrollDays($clientPayBasis, $month = null, $year = null)
    {
        // Use current month/year if not specified
        $month = $month ?? now()->month;
        $year = $year ?? now()->year;

        switch ($clientPayBasis) {
            case 'working_days':
                return self::calculateWorkingDays($month, $year);

            case 'calendar_days':
                return self::calculateCalendarDays($month, $year);

            default:
                throw new \InvalidArgumentException("Invalid pay calculation basis: {$clientPayBasis}");
        }
    }

    /**
     * Calculate working days (Monday-Friday) in a month
     */
    private static function calculateWorkingDays($month, $year)
    {
        $startDate = Carbon::create($year, $month, 1);
        $endDate = $startDate->copy()->endOfMonth();

        $workingDays = 0;
        $current = $startDate->copy();

        while ($current <= $endDate) {
            // Monday = 1, Sunday = 7
            if ($current->dayOfWeek >= 1 && $current->dayOfWeek <= 5) {
                $workingDays++;
            }
            $current->addDay();
        }

        return $workingDays;
    }

    /**
     * Calculate calendar days in a month
     */
    private static function calculateCalendarDays($month, $year)
    {
        return Carbon::create($year, $month, 1)->daysInMonth();
    }

    /**
     * Get detailed breakdown of days in a month
     */
    public static function getMonthDaysBreakdown($clientPayBasis, $month = null, $year = null)
    {
        $month = $month ?? now()->month;
        $year = $year ?? now()->year;

        $startDate = Carbon::create($year, $month, 1);
        $monthName = $startDate->format('F Y');

        $workingDays = self::calculateWorkingDays($month, $year);
        $calendarDays = self::calculateCalendarDays($month, $year);
        $weekends = $calendarDays - $workingDays;

        $payrollDays = self::calculatePayrollDays($clientPayBasis, $month, $year);

        return [
            'month' => $monthName,
            'calendar_days' => $calendarDays,
            'working_days' => $workingDays,
            'weekends' => $weekends,
            'payroll_days' => $payrollDays,
            'pay_basis' => $clientPayBasis,
            'daily_rate_divisor' => $payrollDays // For calculating daily rates from monthly salaries
        ];
    }

    /**
     * Calculate payroll for an employee using existing emolument components
     * This leverages the sophisticated payroll infrastructure already in place
     */
    public static function calculateEmployeePayroll($attendanceRecord, $clientId)
    {
        try {
            $client = Client::findOrFail($clientId);
            $payBasis = $client->pay_calculation_basis;

            // Get month details
            $payrollMonth = Carbon::parse($attendanceRecord['payroll_month']);
            $monthBreakdown = self::getMonthDaysBreakdown($payBasis, $payrollMonth->month, $payrollMonth->year);

            // Basic calculations
            $basicSalary = floatval($attendanceRecord['basic_salary']);
            $daysWorked = intval($attendanceRecord['days_worked']);
            $totalPayrollDays = $monthBreakdown['payroll_days'];

            // Calculate pro-rated basic salary if not full month
            $proRatedBasic = ($basicSalary / $totalPayrollDays) * $daysWorked;

            // Parse allowances and deductions from Excel data
            $allowances = is_array($attendanceRecord['allowances']) ?
                $attendanceRecord['allowances'] :
                json_decode($attendanceRecord['allowances'] ?? '[]', true);

            $deductions = is_array($attendanceRecord['deductions']) ?
                $attendanceRecord['deductions'] :
                json_decode($attendanceRecord['deductions'] ?? '[]', true);

            // Calculate total allowances
            $totalAllowances = 0;
            $allowanceBreakdown = [];

            if (!empty($allowances)) {
                foreach ($allowances as $allowanceName => $amount) {
                    $proRatedAllowance = (floatval($amount) / $totalPayrollDays) * $daysWorked;
                    $totalAllowances += $proRatedAllowance;
                    $allowanceBreakdown[$allowanceName] = [
                        'monthly' => floatval($amount),
                        'pro_rated' => round($proRatedAllowance, 2)
                    ];
                }
            }

            // Calculate gross pay
            $grossPay = $proRatedBasic + $totalAllowances;

            // Calculate statutory deductions using Nigeria rates
            $payeDeduction = self::calculatePAYE($grossPay);
            $nhfDeduction = self::calculateNHF($grossPay);
            $nsitfDeduction = self::calculateNSITF($grossPay);

            // Calculate other deductions from Excel
            $otherDeductions = 0;
            $deductionBreakdown = [];

            if (!empty($deductions)) {
                foreach ($deductions as $deductionName => $amount) {
                    $proRatedDeduction = (floatval($amount) / $totalPayrollDays) * $daysWorked;
                    $otherDeductions += $proRatedDeduction;
                    $deductionBreakdown[$deductionName] = [
                        'monthly' => floatval($amount),
                        'pro_rated' => round($proRatedDeduction, 2)
                    ];
                }
            }

            // Total deductions
            $totalDeductions = $payeDeduction + $nhfDeduction + $nsitfDeduction + $otherDeductions;

            // Calculate net pay
            $netPay = $grossPay - $totalDeductions;

            return [
                'basic_salary_monthly' => $basicSalary,
                'basic_salary_pro_rated' => round($proRatedBasic, 2),
                'total_allowances' => round($totalAllowances, 2),
                'allowances_breakdown' => $allowanceBreakdown,
                'gross_pay' => round($grossPay, 2),
                'paye_deduction' => round($payeDeduction, 2),
                'nhf_deduction' => round($nhfDeduction, 2),
                'nsitf_deduction' => round($nsitfDeduction, 2),
                'other_deductions' => round($otherDeductions, 2),
                'deductions_breakdown' => $deductionBreakdown,
                'total_deductions' => round($totalDeductions, 2),
                'net_pay' => round($netPay, 2),
                'days_calculation' => [
                    'total_payroll_days' => $totalPayrollDays,
                    'days_worked' => $daysWorked,
                    'pay_basis' => $payBasis,
                    'month' => $monthBreakdown['month']
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Payroll calculation error', [
                'employee_id' => $attendanceRecord['employee_id'] ?? 'unknown',
                'error' => $e->getMessage()
            ]);

            throw new \Exception("Failed to calculate payroll for employee: " . $e->getMessage());
        }
    }

    /**
     * Calculate PAYE tax using Nigeria tax brackets (2025)
     */
    private static function calculatePAYE($grossPay)
    {
        $annualGross = $grossPay * 12;
        $taxFreeAllowance = 200000; // ₦200,000 annual tax-free allowance

        if ($annualGross <= $taxFreeAllowance) {
            return 0;
        }

        $taxableIncome = $annualGross - $taxFreeAllowance;
        $annualTax = 0;

        // Nigeria PAYE tax brackets
        $brackets = [
            ['min' => 0, 'max' => 300000, 'rate' => 0.07],      // 7%
            ['min' => 300000, 'max' => 600000, 'rate' => 0.11], // 11%
            ['min' => 600000, 'max' => 1100000, 'rate' => 0.15], // 15%
            ['min' => 1100000, 'max' => 1600000, 'rate' => 0.19], // 19%
            ['min' => 1600000, 'max' => 3200000, 'rate' => 0.21], // 21%
            ['min' => 3200000, 'max' => PHP_INT_MAX, 'rate' => 0.24] // 24%
        ];

        foreach ($brackets as $bracket) {
            if ($taxableIncome > $bracket['min']) {
                $taxableAtThisBracket = min($taxableIncome, $bracket['max']) - $bracket['min'];
                $annualTax += $taxableAtThisBracket * $bracket['rate'];
            }
        }

        return $annualTax / 12; // Monthly PAYE
    }

    /**
     * Calculate National Housing Fund (2.5% of basic salary)
     */
    private static function calculateNHF($grossPay)
    {
        // NHF is typically 2.5% of basic salary with a minimum income threshold
        $minimumThreshold = 3000; // ₦3,000 minimum monthly salary for NHF

        if ($grossPay >= $minimumThreshold) {
            return $grossPay * 0.025; // 2.5%
        }

        return 0;
    }

    /**
     * Calculate NSITF (Nigeria Social Insurance Trust Fund) - 1% of monthly gross
     */
    private static function calculateNSITF($grossPay)
    {
        return $grossPay * 0.01; // 1%
    }

    /**
     * Batch calculate payroll for multiple employees
     */
    public static function batchCalculatePayroll($attendanceRecords, $clientId)
    {
        $results = [];
        $totalGross = 0;
        $totalNet = 0;
        $totalDeductions = 0;

        foreach ($attendanceRecords as $record) {
            try {
                $calculation = self::calculateEmployeePayroll($record, $clientId);
                $results[] = array_merge($record, ['calculated_payroll' => $calculation]);

                $totalGross += $calculation['gross_pay'];
                $totalNet += $calculation['net_pay'];
                $totalDeductions += $calculation['total_deductions'];
            } catch (\Exception $e) {
                Log::error('Batch payroll calculation failed', [
                    'employee_id' => $record['employee_id'] ?? 'unknown',
                    'error' => $e->getMessage()
                ]);

                // Add error record for failed calculations
                $results[] = array_merge($record, [
                    'calculation_error' => $e->getMessage(),
                    'status' => 'failed'
                ]);
            }
        }

        return [
            'calculations' => $results,
            'summary' => [
                'total_employees' => count($attendanceRecords),
                'successful_calculations' => count(array_filter($results, fn($r) => !isset($r['calculation_error']))),
                'failed_calculations' => count(array_filter($results, fn($r) => isset($r['calculation_error']))),
                'total_gross_payroll' => round($totalGross, 2),
                'total_net_payroll' => round($totalNet, 2),
                'total_deductions' => round($totalDeductions, 2)
            ]
        ];
    }

    /**
     * Enhanced attendance-based payroll calculation using AttendanceCalculationService
     * Implements the new allowance components and credit-to-bank calculation model
     * 
     * @param array $attendanceRecord Employee attendance data
     * @param int $clientId Client ID for pay calculation basis
     * @return array Enhanced calculation breakdown
     */
    public static function calculateAttendanceBasedPayroll($attendanceRecord, $clientId)
    {
        try {
            $client = Client::findOrFail($clientId);
            $attendanceService = new AttendanceCalculationService();

            // Get payroll month details
            $payrollMonth = Carbon::parse($attendanceRecord['payroll_month']);
            $monthBreakdown = self::getMonthDaysBreakdown(
                $client->pay_calculation_basis,
                $payrollMonth->month,
                $payrollMonth->year
            );

            // Step 1: Calculate attendance factor
            $attendanceFactor = $attendanceService->calculateAttendanceFactor(
                $attendanceRecord['days_worked'],
                $client->pay_calculation_basis,
                $payrollMonth->month,
                $payrollMonth->year
            );

            // Step 2: Build salary components (Allowance Components)
            $salaryComponents = self::buildAllowanceComponents($attendanceRecord);

            // Step 3: Adjust salary components based on attendance
            $adjustedComponents = $attendanceService->adjustSalaryComponents($salaryComponents, $attendanceFactor);

            // Step 4: Define deduction rules (template-based)
            $deductionRules = self::buildDeductionRules($client);

            // Step 5: Calculate deductions from adjusted components
            $calculatedDeductions = $attendanceService->calculateDeductions($adjustedComponents, $deductionRules);

            // Step 6: Calculate Credit to Bank (what client pays us)
            $creditToBank = $attendanceService->calculateCreditToBank(
                $adjustedComponents['_calculated_gross'],
                $calculatedDeductions['_total_deductions']
            );

            // Return enhanced breakdown with new terminology
            return [
                // Attendance Information
                'attendance_factor' => $attendanceFactor,
                'days_worked' => $attendanceRecord['days_worked'],
                'total_payroll_days' => $monthBreakdown['payroll_days'],
                'pay_calculation_basis' => $client->pay_calculation_basis,

                // Allowance Components (Adjusted)
                'allowance_components' => $adjustedComponents,
                'adjusted_gross' => $adjustedComponents['_calculated_gross'],

                // Deduction Components
                'deductions' => $calculatedDeductions,
                'total_deductions' => $calculatedDeductions['_total_deductions'],

                // Final Amounts
                'credit_to_bank' => $creditToBank, // What client pays us
                'net_to_employee' => $adjustedComponents['_calculated_gross'], // What employee receives

                // Metadata
                'calculation_method' => 'attendance_based',
                'month_breakdown' => $monthBreakdown,
                'employee_info' => [
                    'employee_id' => $attendanceRecord['employee_id'] ?? null,
                    'employee_name' => $attendanceRecord['employee_name'] ?? null,
                    'designation' => $attendanceRecord['designation'] ?? null
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Attendance-based payroll calculation error', [
                'employee_id' => $attendanceRecord['employee_id'] ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception("Failed to calculate attendance-based payroll: " . $e->getMessage());
        }
    }

    /**
     * Build allowance components from attendance record
     * Converts legacy format to new allowance component structure
     * 
     * @param array $attendanceRecord
     * @return array Allowance components
     */
    private static function buildAllowanceComponents($attendanceRecord)
    {
        $components = [];

        // Add basic salary
        if (isset($attendanceRecord['basic_salary'])) {
            $components['basic_salary'] = [
                'amount' => floatval($attendanceRecord['basic_salary']),
                'type' => 'allowance'
            ];
        }

        // Parse allowances from Excel data
        $allowances = is_array($attendanceRecord['allowances']) ?
            $attendanceRecord['allowances'] :
            json_decode($attendanceRecord['allowances'] ?? '[]', true);

        if (!empty($allowances)) {
            foreach ($allowances as $allowanceName => $amount) {
                $components[strtolower(str_replace(' ', '_', $allowanceName))] = [
                    'amount' => floatval($amount),
                    'type' => 'allowance'
                ];
            }
        }

        return $components;
    }

    /**
     * Build deduction rules based on client template or default Nigeria statutory rates
     * 
     * @param Client $client
     * @return array Deduction rules
     */
    private static function buildDeductionRules($client)
    {
        // TODO: In future phases, this will read from client's template configuration
        // For now, using Nigeria's standard statutory deduction rates

        return [
            'paye_tax' => [
                'type' => 'percentage',
                'rate' => 10, // Simplified 10% for now
                'base_components' => ['_calculated_gross']
            ],
            'nhf_contribution' => [
                'type' => 'percentage',
                'rate' => 2.5,
                'base_components' => ['_calculated_gross']
            ],
            'nsitf_contribution' => [
                'type' => 'percentage',
                'rate' => 1,
                'base_components' => ['_calculated_gross']
            ],
            'pension_contribution' => [
                'type' => 'percentage',
                'rate' => 8,
                'base_components' => ['basic_salary', 'housing_allowance', 'transport_allowance'] // Standard pensionable components
            ]
        ];
    }

    /**
     * Calculate payroll for all employees in a payroll run
     * 
     * @param int $runId Payroll run ID
     * @return array Result with success status and message
     */
    public static function calculatePayrollRun($runId)
    {
        \Log::info('===== CALCULATE PAYROLL RUN STARTED =====', ['run_id' => $runId]);

        try {
            // Start database transaction
            DB::beginTransaction();

            // Get payroll run
            $run = PayrollRun::with('client')->find($runId);
            if (!$run) {
                return [
                    'success' => false,
                    'message' => 'Payroll run not found'
                ];
            }

            // Validate status
            if ($run->status !== 'draft') {
                return [
                    'success' => false,
                    'message' => 'Can only calculate payroll runs in draft status'
                ];
            }

            // Get all active staff for the client
            $staff = Staff::where('client_id', $run->client_id)
                ->where('status', 'active')
                ->with(['payGradeStructure']) // Only load pay grade structure
                ->get();

            if ($staff->isEmpty()) {
                return [
                    'success' => false,
                    'message' => 'No active staff found for this client'
                ];
            }

            // Initialize calculation engine
            $engine = new PayrollCalculationEngine();

            // Get attendance records if attendance_upload_id is set
            $attendanceRecords = collect([]); // Initialize as empty collection
            if ($run->attendance_upload_id) {
                $attendanceRecords = AttendanceRecord::where('attendance_upload_id', $run->attendance_upload_id)
                    ->where('ready_for_calculation', true)
                    ->get()
                    ->keyBy('staff_id');

                // DEBUG: Log what we loaded
                \Log::info('Loaded attendance records', [
                    'count' => $attendanceRecords->count(),
                    'keys' => $attendanceRecords->keys()->toArray(),
                    'first_record' => $attendanceRecords->first() ? get_class($attendanceRecords->first()) : 'null'
                ]);
            } else {
                // Attendance is required for payroll calculation
                return [
                    'success' => false,
                    'message' => 'Attendance data is required for payroll calculation. Please upload and link attendance data first.'
                ];
            }

            // Track totals
            $totalGross = 0;
            $totalDeductions = 0;
            $totalNet = 0;
            $totalCredit = 0;
            $processedCount = 0;
            $skippedStaff = []; // Staff without attendance records
            $failedStaff = []; // Staff with calculation errors

            // Calculate for each staff member
            foreach ($staff as $employee) {
                try {
                    // Get attendance record - REQUIRED for calculation
                    $attendanceRecord = $attendanceRecords->get($employee->id);

                    // Attendance is mandatory - collect staff without attendance
                    if (!$attendanceRecord) {
                        $skippedStaff[] = [
                            'staff_id' => $employee->id,
                            'staff_name' => $employee->first_name . ' ' . $employee->last_name,
                            'employee_code' => $employee->employee_code ?? 'N/A'
                        ];
                        continue; // Skip this employee
                    }

                    // Check if pay grade structure is loaded
                    if (!$employee->payGradeStructure) {
                        $failedStaff[] = [
                            'staff_id' => $employee->id,
                            'staff_name' => $employee->first_name . ' ' . $employee->last_name,
                            'employee_code' => $employee->employee_code ?? 'N/A',
                            'error' => 'Pay grade structure not found for this employee'
                        ];

                        Log::error('Pay grade structure missing for staff', [
                            'staff_id' => $employee->id,
                            'pay_grade_structure_id' => $employee->pay_grade_structure_id
                        ]);
                        continue;
                    }

                    // Build attendance data
                    // Calculate total expected days if not set
                    $totalExpectedDays = $attendanceRecord->total_expected_days ?? $engine->calculateTotalDays(
                        $run->month,
                        $run->year,
                        $run->client->pay_calculation_basis ?? 'calendar_days'
                    );

                    // Calculate prorated percentage if not set
                    $proratedPercentage = $attendanceRecord->prorated_percentage
                        ?? (($attendanceRecord->days_worked / $totalExpectedDays) * 100);

                    // Engine expects: days_worked, total_expected_days, prorated_percentage
                    $attendance = [
                        'days_worked' => $attendanceRecord->days_worked,
                        'total_expected_days' => $totalExpectedDays,
                        'prorated_percentage' => $proratedPercentage,
                    ];

                    // Calculate payroll using existing engine
                    $calculation = $engine->calculateMonthlyPayroll(
                        $employee,
                        $employee->payGradeStructure,
                        (object) $attendance, // Convert array to object
                        $run->year
                    );

                    // Create payroll item
                    PayrollItem::create([
                        'payroll_run_id' => $run->id,
                        'staff_id' => $employee->id,
                        'client_id' => $run->client_id,
                        'pay_grade_structure_id' => $employee->pay_grade_structure_id,
                        'attendance_id' => $attendanceRecord ? $attendanceRecord->id : null,

                        // Staff snapshot
                        'staff_name' => $employee->first_name . ' ' . $employee->last_name,
                        'staff_code' => $employee->employee_code ?? $employee->staff_id,
                        'bank_name' => null, // Banking info not needed for calculation
                        'account_number' => null, // Banking info not needed for calculation
                        'pfa_code' => $employee->pfa_code ?? null,                        // Attendance (from calculation result)
                        'days_present' => $calculation['days_present'] ?? 0,
                        'days_absent' => $calculation['days_absent'] ?? 0,
                        'total_days' => $calculation['total_days'] ?? 0,
                        'proration_factor' => $calculation['proration_factor'] ?? 1,

                        // Annual amounts
                        'annual_gross_salary' => $calculation['annual_gross_salary'] ?? 0,
                        'annual_reimbursables' => $calculation['annual_reimbursables'] ?? 0,
                        'pensionable_amount' => $calculation['pensionable_amount'] ?? 0,

                        // Monthly amounts
                        'monthly_gross' => $calculation['monthly_gross'] ?? 0,
                        'monthly_reimbursables' => $calculation['monthly_reimbursables'] ?? 0,

                        // Tax
                        'taxable_income' => $calculation['taxable_income'] ?? 0,
                        'paye_tax' => $calculation['paye_tax'] ?? 0,

                        // Deductions
                        'pension_deduction' => $calculation['pension_deduction'] ?? 0,
                        'leave_allowance_deduction' => $calculation['leave_allowance_deduction'] ?? 0,
                        'thirteenth_month_deduction' => $calculation['thirteenth_month_deduction'] ?? 0,
                        'other_deductions' => $calculation['other_deductions'] ?? 0,
                        'total_deductions' => $calculation['total_deductions'] ?? 0,

                        // Final amounts
                        'net_pay' => $calculation['net_pay'] ?? 0,
                        'credit_to_bank' => $calculation['credit_to_bank'] ?? 0,

                        // Snapshot
                        'emoluments_snapshot' => $calculation['emoluments_snapshot'] ?? [],
                        'calculation_date' => now(),
                    ]);

                    // Update totals
                    $totalGross += $calculation['monthly_gross'] ?? 0;
                    $totalDeductions += $calculation['total_deductions'] ?? 0;
                    $totalNet += $calculation['net_pay'] ?? 0;
                    $totalCredit += $calculation['credit_to_bank'] ?? 0;
                    $processedCount++;
                } catch (\Exception $e) {
                    // Collect failed staff with error details
                    $failedStaff[] = [
                        'staff_id' => $employee->id,
                        'staff_name' => $employee->first_name . ' ' . $employee->last_name,
                        'employee_code' => $employee->employee_code ?? 'N/A',
                        'error' => $e->getMessage()
                    ];

                    Log::error('Payroll calculation failed for staff', [
                        'staff_id' => $employee->id,
                        'payroll_run_id' => $run->id,
                        'error' => $e->getMessage()
                    ]);
                    // Continue with other staff
                    continue;
                }
            }

            // Update payroll run with totals
            $run->update([
                'status' => 'calculated',
                'total_staff_count' => $processedCount,
                'total_gross_pay' => $totalGross,
                'total_deductions' => $totalDeductions,
                'total_net_pay' => $totalNet,
                'total_credit_to_bank' => $totalCredit,
                'calculation_date' => now(),
            ]);

            DB::commit();

            // Build response message
            $message = "Payroll calculated successfully for {$processedCount} employee(s)";
            $warnings = [];

            if (!empty($skippedStaff)) {
                $warnings[] = count($skippedStaff) . " staff member(s) skipped due to missing attendance records";
            }
            if (!empty($failedStaff)) {
                $warnings[] = count($failedStaff) . " staff member(s) failed calculation due to errors";
            }

            return [
                'success' => true,
                'message' => $message,
                'warnings' => $warnings,
                'data' => [
                    'processed_count' => $processedCount,
                    'skipped_count' => count($skippedStaff),
                    'failed_count' => count($failedStaff),
                    'skipped_staff' => $skippedStaff,
                    'failed_staff' => $failedStaff,
                    'total_gross' => $totalGross,
                    'total_deductions' => $totalDeductions,
                    'total_net' => $totalNet,
                ]
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Payroll run calculation failed', [
                'run_id' => $runId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Payroll calculation failed: ' . $e->getMessage()
            ];
        }
    }
}
