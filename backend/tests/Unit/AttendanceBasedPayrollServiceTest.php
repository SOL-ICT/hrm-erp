<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\AttendanceBasedPayrollService;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use PHPUnit\Framework\Attributes\Test;

/**
 * AttendanceBasedPayrollServiceTest
 * 
 * Comprehensive unit tests for attendance-based payroll calculations
 * Phase 3.1: Attendance-Based Salary Calculation Testing
 */
class AttendanceBasedPayrollServiceTest extends TestCase
{
    use RefreshDatabase;

    private AttendanceBasedPayrollService $service;
    private $mockEmployee;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AttendanceBasedPayrollService();

        // Create mock employee
        $this->mockEmployee = Mockery::mock(Staff::class);
        $this->mockEmployee->id = 1;
        $this->mockEmployee->full_name = 'John Doe';
        $this->mockEmployee->employee_code = 'EMP001';
        $this->mockEmployee->pay_grade = 'GL-10';
        $this->mockEmployee->basic_salary = 400000;
        $this->mockEmployee->housing_allowance = 100000;
        $this->mockEmployee->transport_allowance = 50000;
        $this->mockEmployee->medical_allowance = 50000;
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_calculates_attendance_factor_correctly()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('calculateAttendanceFactor');
        $method->setAccessible(true);

        // Test normal attendance
        $factor = $method->invoke($this->service, 18, 22);
        $this->assertEquals(0.8182, round($factor, 4));

        // Test full attendance
        $factor = $method->invoke($this->service, 22, 22);
        $this->assertEquals(1.0, $factor);

        // Test over-attendance (should cap at 100%)
        $factor = $method->invoke($this->service, 25, 22);
        $this->assertEquals(1.0, $factor);

        // Test zero attendance
        $factor = $method->invoke($this->service, 0, 22);
        $this->assertEquals(0.0, $factor);
    }

    /** @test */
    public function it_gets_correct_total_days_for_working_days()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getTotalDays');
        $method->setAccessible(true);

        $workingDays = $method->invoke($this->service, 'working_days');

        // Should be between 20-23 working days in a typical month
        $this->assertGreaterThanOrEqual(20, $workingDays);
        $this->assertLessThanOrEqual(23, $workingDays);
    }

    /** @test */
    public function it_gets_correct_total_days_for_calendar_days()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getTotalDays');
        $method->setAccessible(true);

        $calendarDays = $method->invoke($this->service, 'calendar_days');

        // Should be between 28-31 days depending on month
        $this->assertGreaterThanOrEqual(28, $calendarDays);
        $this->assertLessThanOrEqual(31, $calendarDays);
    }

    /** @test */
    public function it_extracts_base_salary_components_correctly()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getBaseSalaryComponents');
        $method->setAccessible(true);

        $components = $method->invoke($this->service, $this->mockEmployee);

        $this->assertArrayHasKey('basic_salary', $components);
        $this->assertArrayHasKey('housing_allowance', $components);
        $this->assertArrayHasKey('transport_allowance', $components);
        $this->assertArrayHasKey('medical_allowance', $components);

        $this->assertEquals(400000, $components['basic_salary']);
        $this->assertEquals(100000, $components['housing_allowance']);
        $this->assertEquals(50000, $components['transport_allowance']);
        $this->assertEquals(50000, $components['medical_allowance']);
    }

    /** @test */
    public function it_adjusts_allowance_components_with_attendance_factor()
    {
        $baseSalary = [
            'basic_salary' => 400000,
            'housing_allowance' => 100000,
            'transport_allowance' => 50000
        ];

        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('adjustAllowanceComponents');
        $method->setAccessible(true);

        $adjusted = $method->invoke($this->service, $baseSalary, 0.8);

        // Check structure
        $this->assertArrayHasKey('basic_salary', $adjusted);
        $this->assertArrayHasKey('base_amount', $adjusted['basic_salary']);
        $this->assertArrayHasKey('adjusted_amount', $adjusted['basic_salary']);
        $this->assertArrayHasKey('attendance_factor', $adjusted['basic_salary']);
        $this->assertArrayHasKey('adjustment', $adjusted['basic_salary']);

        // Check calculations
        $this->assertEquals(400000, $adjusted['basic_salary']['base_amount']);
        $this->assertEquals(320000, $adjusted['basic_salary']['adjusted_amount']);
        $this->assertEquals(0.8, $adjusted['basic_salary']['attendance_factor']);
        $this->assertEquals(-80000, $adjusted['basic_salary']['adjustment']);
    }

    /** @test */
    public function it_calculates_gross_salary_correctly()
    {
        $adjustedComponents = [
            'basic_salary' => ['adjusted_amount' => 320000],
            'housing_allowance' => ['adjusted_amount' => 80000],
            'transport_allowance' => ['adjusted_amount' => 40000]
        ];

        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('calculateGross');
        $method->setAccessible(true);

        $gross = $method->invoke($this->service, $adjustedComponents);

        $this->assertEquals(440000, $gross);
    }

    /** @test */
    public function it_calculates_paye_correctly_for_low_income()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('calculatePAYE');
        $method->setAccessible(true);

        // Low income - should be tax-free
        $paye = $method->invoke($this->service, 30000); // ₦30,000 monthly = ₦360,000 annually
        $this->assertEquals(0, $paye);
    }

    /** @test */
    public function it_calculates_paye_correctly_for_taxable_income()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('calculatePAYE');
        $method->setAccessible(true);

        // Higher income - should have tax
        $paye = $method->invoke($this->service, 100000); // ₦100,000 monthly = ₦1,200,000 annually
        $this->assertGreaterThan(0, $paye);
    }

    /** @test */
    public function it_calculates_pension_base_correctly()
    {
        $adjustedComponents = [
            'basic_salary' => ['adjusted_amount' => 320000],
            'housing_allowance' => ['adjusted_amount' => 80000],
            'transport_allowance' => ['adjusted_amount' => 40000],
            'medical_allowance' => ['adjusted_amount' => 40000] // Should not be included in pension
        ];

        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getPensionBase');
        $method->setAccessible(true);

        $pensionBase = $method->invoke($this->service, $adjustedComponents);

        // Should only include basic + housing + transport
        $this->assertEquals(440000, $pensionBase);
    }

    /** @test */
    public function it_calculates_percentage_correctly()
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('calculatePercentage');
        $method->setAccessible(true);

        $result = $method->invoke($this->service, 100000, 8);
        $this->assertEquals(8000, $result);

        $result = $method->invoke($this->service, 500000, 2.5);
        $this->assertEquals(12500, $result);
    }

    /** @test */
    public function it_calculates_net_salary_correctly()
    {
        $grossSalary = 440000;
        $deductions = [
            'paye' => 15000,
            'pension' => 35200,
            'nhf' => 11000,
            'nsitf' => 4400
        ];

        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('calculateNetSalary');
        $method->setAccessible(true);

        $netSalary = $method->invoke($this->service, $grossSalary, $deductions);

        $expectedNet = 440000 - (15000 + 35200 + 11000 + 4400);
        $this->assertEquals($expectedNet, $netSalary);
    }

    /** @test */
    public function it_calculates_credit_to_bank_correctly()
    {
        $grossSalary = 440000;
        $deductions = [
            'paye' => 15000,
            'pension' => 35200,
            'nhf' => 11000,
            'nsitf' => 4400
        ];

        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('calculateCreditToBank');
        $method->setAccessible(true);

        $creditToBank = $method->invoke($this->service, $grossSalary, $deductions);

        // Credit to Bank = Gross + Total Deductions
        $expectedCredit = 440000 + (15000 + 35200 + 11000 + 4400);
        $this->assertEquals($expectedCredit, $creditToBank);
    }

    /** @test */
    public function it_calculates_complete_adjusted_salary()
    {
        $result = $this->service->calculateAdjustedSalary(
            $this->mockEmployee,
            18, // days worked
            'working_days',
            []
        );

        // Check structure
        $this->assertArrayHasKey('employee_id', $result);
        $this->assertArrayHasKey('employee_name', $result);
        $this->assertArrayHasKey('days_worked', $result);
        $this->assertArrayHasKey('attendance_factor', $result);
        $this->assertArrayHasKey('base_components', $result);
        $this->assertArrayHasKey('adjusted_components', $result);
        $this->assertArrayHasKey('gross_salary', $result);
        $this->assertArrayHasKey('statutory_deductions', $result);
        $this->assertArrayHasKey('net_salary', $result);
        $this->assertArrayHasKey('credit_to_bank', $result);

        // Check values
        $this->assertEquals(1, $result['employee_id']);
        $this->assertEquals('John Doe', $result['employee_name']);
        $this->assertEquals(18, $result['days_worked']);
        $this->assertGreaterThan(0, $result['attendance_factor']);
        $this->assertLessThan(1, $result['attendance_factor']);
        $this->assertGreaterThan(0, $result['gross_salary']);
        $this->assertGreaterThan(0, $result['credit_to_bank']);

        // Credit to bank should be greater than gross (includes deductions)
        $this->assertGreaterThan($result['gross_salary'], $result['credit_to_bank']);
    }

    /** @test */
    public function it_handles_full_attendance_correctly()
    {
        $result = $this->service->calculateAdjustedSalary(
            $this->mockEmployee,
            22, // full working days
            'working_days',
            []
        );

        // Should have 100% attendance factor
        $this->assertEquals(1.0, $result['attendance_factor']);

        // Gross should equal sum of base components
        $expectedGross = 400000 + 100000 + 50000 + 50000; // basic + housing + transport + medical
        $this->assertEquals($expectedGross, $result['gross_salary']);
    }

    /** @test */
    public function it_handles_zero_attendance_correctly()
    {
        $result = $this->service->calculateAdjustedSalary(
            $this->mockEmployee,
            0, // no attendance
            'working_days',
            []
        );

        // Should have 0% attendance factor
        $this->assertEquals(0.0, $result['attendance_factor']);

        // Gross should be zero
        $this->assertEquals(0, $result['gross_salary']);

        // Net should be zero (no salary, no deductions)
        $this->assertEquals(0, $result['net_salary']);
    }

    /** @test */
    public function it_calculates_bulk_payroll_correctly()
    {
        // Create multiple attendance records
        $attendanceRecords = [
            ['employee_id' => 1, 'days_worked' => 18],
            ['employee_id' => 2, 'days_worked' => 22],
            ['employee_id' => 3, 'days_worked' => 15]
        ];

        // Mock Staff::find to return our mock employee for any ID
        Staff::shouldReceive('find')
            ->andReturn($this->mockEmployee);

        $result = $this->service->calculateBulkAttendancePayroll(
            $attendanceRecords,
            'working_days',
            []
        );

        // Check structure
        $this->assertArrayHasKey('calculations', $result);
        $this->assertArrayHasKey('summary', $result);
        $this->assertArrayHasKey('calculated_at', $result);

        // Should have 3 calculations
        $this->assertCount(3, $result['calculations']);

        // Summary should have totals
        $this->assertArrayHasKey('total_employees', $result['summary']);
        $this->assertArrayHasKey('total_gross', $result['summary']);
        $this->assertArrayHasKey('total_net', $result['summary']);
        $this->assertArrayHasKey('total_credit_to_bank', $result['summary']);

        $this->assertEquals(3, $result['summary']['total_employees']);
        $this->assertGreaterThan(0, $result['summary']['total_gross']);
    }

    /** @test */
    public function it_handles_template_settings_for_statutory_calculations()
    {
        $templateSettings = [
            'statutory' => [
                'pension' => ['enabled' => true, 'rate' => 10], // Custom 10% instead of default 8%
                'nhf' => ['enabled' => true, 'rate' => 3], // Custom 3% instead of default 2.5%
                'nsitf' => ['enabled' => false], // Disabled
                'paye' => ['enabled' => true]
            ]
        ];

        $result = $this->service->calculateAdjustedSalary(
            $this->mockEmployee,
            22, // full attendance
            'working_days',
            $templateSettings
        );

        // Pension should use custom 10% rate
        $pensionBase = 400000 + 100000 + 50000; // basic + housing + transport
        $expectedPension = $pensionBase * 0.10;
        $this->assertEquals($expectedPension, $result['statutory_deductions']['pension']);

        // NSITF should be disabled (zero)
        $this->assertEquals(0, $result['statutory_deductions']['nsitf']);

        // NHF should use custom 3% rate
        $expectedNhf = $result['gross_salary'] * 0.03;
        $this->assertEquals($expectedNhf, $result['statutory_deductions']['nhf']);
    }
}
