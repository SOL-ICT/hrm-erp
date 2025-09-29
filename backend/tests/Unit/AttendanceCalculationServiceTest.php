<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Services\AttendanceCalculationService;

/**
 * AttendanceCalculationServiceTest
 * 
 * Unit tests for AttendanceCalculationService
 * Tests attendance factor calculations, salary adjustments, and deduction calculations
 * 
 * @author HRM-ERP System
 * @version 1.0
 * @date September 29, 2025
 */
class AttendanceCalculationServiceTest extends TestCase
{
    private AttendanceCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AttendanceCalculationService();
    }

    /**
     * Test attendance factor calculation for working days basis
     */
    public function test_calculate_attendance_factor_working_days()
    {
        // September 2025 has 22 working days (excluding weekends)
        $factor = $this->service->calculateAttendanceFactor(18, 'working_days', 9, 2025);

        $expected = round(18 / 22, 4); // 0.8182
        $this->assertEquals($expected, $factor);
    }

    /**
     * Test attendance factor calculation for calendar days basis
     */
    public function test_calculate_attendance_factor_calendar_days()
    {
        // September 2025 has 30 calendar days
        $factor = $this->service->calculateAttendanceFactor(28, 'calendar_days', 9, 2025);

        $expected = round(28 / 30, 4); // 0.9333
        $this->assertEquals($expected, $factor);
    }

    /**
     * Test attendance factor calculation with invalid basis
     */
    public function test_calculate_attendance_factor_invalid_basis()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid pay calculation basis');

        $this->service->calculateAttendanceFactor(20, 'invalid_basis', 9, 2025);
    }

    /**
     * Test attendance factor calculation with negative days
     */
    public function test_calculate_attendance_factor_negative_days()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Days worked cannot be negative');

        $this->service->calculateAttendanceFactor(-5, 'working_days', 9, 2025);
    }

    /**
     * Test attendance factor calculation with days exceeding maximum
     */
    public function test_calculate_attendance_factor_exceeds_maximum()
    {
        // 25 days exceeds 22 working days in September 2025
        $factor = $this->service->calculateAttendanceFactor(25, 'working_days', 9, 2025);

        // Should be capped at 1.0 (22/22)
        $this->assertEquals(1.0, $factor);
    }

    /**
     * Test salary components adjustment
     */
    public function test_adjust_salary_components()
    {
        $salaryComponents = [
            'basic_salary' => ['amount' => 400000, 'type' => 'allowance'],
            'housing_allowance' => ['amount' => 100000, 'type' => 'allowance'],
            'transport_allowance' => ['amount' => 50000, 'type' => 'allowance'],
            'medical_allowance' => ['amount' => 50000, 'type' => 'allowance']
        ];

        $attendanceFactor = 0.8182; // 18/22 days

        $adjustedComponents = $this->service->adjustSalaryComponents($salaryComponents, $attendanceFactor);

        // Test individual component adjustments
        $this->assertEquals(327280, $adjustedComponents['basic_salary']['adjusted_amount']); // 400000 * 0.8182
        $this->assertEquals(81820, $adjustedComponents['housing_allowance']['adjusted_amount']); // 100000 * 0.8182
        $this->assertEquals(40910, $adjustedComponents['transport_allowance']['adjusted_amount']); // 50000 * 0.8182
        $this->assertEquals(40910, $adjustedComponents['medical_allowance']['adjusted_amount']); // 50000 * 0.8182

        // Test calculated gross
        $expectedGross = 327280 + 81820 + 40910 + 40910; // 490920
        $this->assertEquals($expectedGross, $adjustedComponents['_calculated_gross']);
    }

    /**
     * Test salary components adjustment with simple array format
     */
    public function test_adjust_salary_components_simple_format()
    {
        $salaryComponents = [
            'basic_salary' => 400000,
            'housing_allowance' => 100000
        ];

        $attendanceFactor = 0.5;

        $adjustedComponents = $this->service->adjustSalaryComponents($salaryComponents, $attendanceFactor);

        $this->assertEquals(200000, $adjustedComponents['basic_salary']['adjusted_amount']);
        $this->assertEquals(50000, $adjustedComponents['housing_allowance']['adjusted_amount']);
        $this->assertEquals(250000, $adjustedComponents['_calculated_gross']);
    }

    /**
     * Test salary components adjustment with invalid attendance factor
     */
    public function test_adjust_salary_components_invalid_factor()
    {
        $salaryComponents = ['basic_salary' => 400000];

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Attendance factor must be between 0 and 1');

        $this->service->adjustSalaryComponents($salaryComponents, 1.5);
    }

    /**
     * Test deduction calculations
     */
    public function test_calculate_deductions()
    {
        $adjustedComponents = [
            'basic_salary' => ['adjusted_amount' => 327280],
            'housing_allowance' => ['adjusted_amount' => 81820],
            'transport_allowance' => ['adjusted_amount' => 40910],
            'medical_allowance' => ['adjusted_amount' => 40910],
            '_calculated_gross' => 490920
        ];

        $deductionRules = [
            'pension' => [
                'type' => 'percentage',
                'rate' => 8,
                'base_components' => ['basic_salary', 'housing_allowance', 'transport_allowance']
            ],
            'tax' => [
                'type' => 'percentage',
                'rate' => 10,
                'base_components' => ['_calculated_gross']
            ],
            'union_dues' => [
                'type' => 'fixed',
                'amount' => 5000
            ]
        ];

        $calculatedDeductions = $this->service->calculateDeductions($adjustedComponents, $deductionRules);

        // Test pension calculation: (327280 + 81820 + 40910) * 0.08 = 36000.8
        $this->assertEquals(36000.8, $calculatedDeductions['pension']['amount']);

        // Test tax calculation: 490920 * 0.10 = 49092
        $this->assertEquals(49092, $calculatedDeductions['tax']['amount']);

        // Test fixed deduction
        $this->assertEquals(5000, $calculatedDeductions['union_dues']['amount']);

        // Test total deductions
        $expectedTotal = 36000.8 + 49092 + 5000; // 90092.8
        $this->assertEquals($expectedTotal, $calculatedDeductions['_total_deductions']);
    }

    /**
     * Test credit to bank calculation
     */
    public function test_calculate_credit_to_bank()
    {
        $adjustedGross = 490920;
        $totalDeductions = 90092.8;

        $creditToBank = $this->service->calculateCreditToBank($adjustedGross, $totalDeductions);

        // Credit to Bank = Adjusted Gross + Total Deductions
        $expected = 490920 + 90092.8; // 581012.8
        $this->assertEquals($expected, $creditToBank);
    }

    /**
     * Test credit to bank calculation with negative values
     */
    public function test_calculate_credit_to_bank_negative_values()
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Adjusted gross and total deductions must be non-negative');

        $this->service->calculateCreditToBank(-100000, 50000);
    }

    /**
     * Test attendance data validation - valid data
     */
    public function test_validate_attendance_data_valid()
    {
        $attendanceData = [
            [
                'employee_code' => 'EMP001',
                'employee_name' => 'John Doe',
                'designation' => 'Senior Developer',
                'days_worked' => 18,
                'month' => 9,
                'year' => 2025
            ],
            [
                'employee_code' => 'EMP002',
                'employee_name' => 'Jane Smith',
                'designation' => 'Project Manager',
                'days_worked' => 20,
                'month' => 9,
                'year' => 2025
            ]
        ];

        $result = $this->service->validateAttendanceData($attendanceData, 'working_days');

        $this->assertTrue($result['valid']);
        $this->assertEmpty($result['errors']);
        $this->assertEquals(2, $result['processed_records']);
    }

    /**
     * Test attendance data validation - missing required fields
     */
    public function test_validate_attendance_data_missing_fields()
    {
        $attendanceData = [
            [
                'employee_code' => 'EMP001',
                // Missing employee_name, designation, days_worked
            ]
        ];

        $result = $this->service->validateAttendanceData($attendanceData, 'working_days');

        $this->assertFalse($result['valid']);
        $this->assertGreaterThan(0, count($result['errors']));
        $this->assertStringContainsString('Missing required field', $result['errors'][0]);
    }

    /**
     * Test attendance data validation - invalid days worked
     */
    public function test_validate_attendance_data_invalid_days()
    {
        $attendanceData = [
            [
                'employee_code' => 'EMP001',
                'employee_name' => 'John Doe',
                'designation' => 'Developer',
                'days_worked' => -5 // Invalid negative days
            ]
        ];

        $result = $this->service->validateAttendanceData($attendanceData, 'working_days');

        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('Days worked must be a non-negative number', $result['errors'][0]);
    }

    /**
     * Test attendance data validation - days exceeding maximum
     */
    public function test_validate_attendance_data_exceeds_maximum()
    {
        $attendanceData = [
            [
                'employee_code' => 'EMP001',
                'employee_name' => 'John Doe',
                'designation' => 'Developer',
                'days_worked' => 25, // Exceeds 22 working days in September 2025
                'month' => 9,
                'year' => 2025
            ]
        ];

        $result = $this->service->validateAttendanceData($attendanceData, 'working_days');

        $this->assertTrue($result['valid']); // Valid but with warnings
        $this->assertGreaterThan(0, count($result['warnings']));
        $this->assertStringContainsString('exceeds maximum', $result['warnings'][0]);
    }

    /**
     * Test complete calculation workflow
     */
    public function test_complete_calculation_workflow()
    {
        // Step 1: Calculate attendance factor
        $attendanceFactor = $this->service->calculateAttendanceFactor(18, 'working_days', 9, 2025);
        $this->assertEquals(0.8182, $attendanceFactor);

        // Step 2: Adjust salary components
        $salaryComponents = [
            'basic_salary' => ['amount' => 400000],
            'housing_allowance' => ['amount' => 100000],
            'transport_allowance' => ['amount' => 50000],
            'medical_allowance' => ['amount' => 50000]
        ];

        $adjustedComponents = $this->service->adjustSalaryComponents($salaryComponents, $attendanceFactor);
        $adjustedGross = $adjustedComponents['_calculated_gross'];

        // Step 3: Calculate deductions
        $deductionRules = [
            'pension' => [
                'type' => 'percentage',
                'rate' => 8,
                'base_components' => ['basic_salary', 'housing_allowance', 'transport_allowance']
            ],
            'tax' => [
                'type' => 'percentage',
                'rate' => 10,
                'base_components' => ['_calculated_gross']
            ]
        ];

        $calculatedDeductions = $this->service->calculateDeductions($adjustedComponents, $deductionRules);
        $totalDeductions = $calculatedDeductions['_total_deductions'];

        // Step 4: Calculate credit to bank
        $creditToBank = $this->service->calculateCreditToBank($adjustedGross, $totalDeductions);

        // Verify final result matches expected calculation
        $this->assertGreaterThan($adjustedGross, $creditToBank); // Credit should be gross + deductions
        $this->assertEquals($adjustedGross + $totalDeductions, $creditToBank);
    }
}
