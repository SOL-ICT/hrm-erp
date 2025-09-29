<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Services\PayrollCalculationService;

/**
 * EnhancedTemplateSystemTest
 * 
 * Unit tests for enhanced template system with attendance-based calculations
 * Tests the new allowance component terminology and Credit to Bank calculations
 * 
 * @author HRM-ERP System
 * @version 1.0
 * @date September 29, 2025
 */
class EnhancedTemplateSystemTest extends TestCase
{
    /**
     * Test building allowance components from attendance record
     */
    public function test_build_allowance_components()
    {
        $attendanceRecord = [
            'basic_salary' => 400000,
            'allowances' => [
                'Housing Allowance' => 100000,
                'Transport Allowance' => 50000,
                'Medical Allowance' => 50000
            ]
        ];

        // Use reflection to test private method
        $reflection = new \ReflectionClass(PayrollCalculationService::class);
        $method = $reflection->getMethod('buildAllowanceComponents');
        $method->setAccessible(true);

        $result = $method->invoke(null, $attendanceRecord);

        // Test basic salary
        $this->assertEquals(400000, $result['basic_salary']['amount']);
        $this->assertEquals('allowance', $result['basic_salary']['type']);

        // Test allowance components (should be normalized to lowercase with underscores)
        $this->assertEquals(100000, $result['housing_allowance']['amount']);
        $this->assertEquals(50000, $result['transport_allowance']['amount']);
        $this->assertEquals(50000, $result['medical_allowance']['amount']);

        // All should be type 'allowance'
        foreach ($result as $component) {
            $this->assertEquals('allowance', $component['type']);
        }
    }

    /**
     * Test building deduction rules
     */
    public function test_build_deduction_rules()
    {
        // Create a mock client object
        $client = new \stdClass();
        $client->id = 1;

        // Use reflection to test private method
        $reflection = new \ReflectionClass(PayrollCalculationService::class);
        $method = $reflection->getMethod('buildDeductionRules');
        $method->setAccessible(true);

        $result = $method->invoke(null, $client);

        // Test that all required deduction rules are present
        $this->assertArrayHasKey('paye_tax', $result);
        $this->assertArrayHasKey('nhf_contribution', $result);
        $this->assertArrayHasKey('nsitf_contribution', $result);
        $this->assertArrayHasKey('pension_contribution', $result);

        // Test PAYE tax rule
        $this->assertEquals('percentage', $result['paye_tax']['type']);
        $this->assertEquals(10, $result['paye_tax']['rate']);
        $this->assertEquals(['_calculated_gross'], $result['paye_tax']['base_components']);

        // Test pension contribution rule (should use specific components)
        $this->assertEquals('percentage', $result['pension_contribution']['type']);
        $this->assertEquals(8, $result['pension_contribution']['rate']);
        $this->assertEquals(['basic_salary', 'housing_allowance', 'transport_allowance'], $result['pension_contribution']['base_components']);

        // Test NHF contribution
        $this->assertEquals(2.5, $result['nhf_contribution']['rate']);

        // Test NSITF contribution
        $this->assertEquals(1, $result['nsitf_contribution']['rate']);
    }

    /**
     * Test allowance components with JSON string format
     */
    public function test_build_allowance_components_json_format()
    {
        $attendanceRecord = [
            'basic_salary' => 300000,
            'allowances' => '{"housing_allowance": 80000, "transport_allowance": 40000}'
        ];

        // Use reflection to test private method
        $reflection = new \ReflectionClass(PayrollCalculationService::class);
        $method = $reflection->getMethod('buildAllowanceComponents');
        $method->setAccessible(true);

        $result = $method->invoke(null, $attendanceRecord);

        $this->assertEquals(300000, $result['basic_salary']['amount']);
        $this->assertEquals(80000, $result['housing_allowance']['amount']);
        $this->assertEquals(40000, $result['transport_allowance']['amount']);
    }

    /**
     * Test allowance components with empty allowances
     */
    public function test_build_allowance_components_empty_allowances()
    {
        $attendanceRecord = [
            'basic_salary' => 500000,
            'allowances' => []
        ];

        // Use reflection to test private method
        $reflection = new \ReflectionClass(PayrollCalculationService::class);
        $method = $reflection->getMethod('buildAllowanceComponents');
        $method->setAccessible(true);

        $result = $method->invoke(null, $attendanceRecord);

        // Should only have basic salary
        $this->assertCount(1, $result);
        $this->assertEquals(500000, $result['basic_salary']['amount']);
    }

    /**
     * Test component normalization (spaces to underscores, lowercase)
     */
    public function test_component_name_normalization()
    {
        $attendanceRecord = [
            'basic_salary' => 400000,
            'allowances' => [
                'Housing Allowance' => 100000,
                'Transport Allowance' => 50000,
                'MEDICAL ALLOWANCE' => 30000,
                'performance bonus' => 20000
            ]
        ];

        // Use reflection to test private method
        $reflection = new \ReflectionClass(PayrollCalculationService::class);
        $method = $reflection->getMethod('buildAllowanceComponents');
        $method->setAccessible(true);

        $result = $method->invoke(null, $attendanceRecord);

        // Test normalized component names
        $this->assertArrayHasKey('housing_allowance', $result);
        $this->assertArrayHasKey('transport_allowance', $result);
        $this->assertArrayHasKey('medical_allowance', $result);
        $this->assertArrayHasKey('performance_bonus', $result);

        // Test values are preserved
        $this->assertEquals(100000, $result['housing_allowance']['amount']);
        $this->assertEquals(50000, $result['transport_allowance']['amount']);
        $this->assertEquals(30000, $result['medical_allowance']['amount']);
        $this->assertEquals(20000, $result['performance_bonus']['amount']);
    }
}
