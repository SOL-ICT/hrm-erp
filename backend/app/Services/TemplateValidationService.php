<?php

namespace App\Services;

use App\Models\CalculationTemplate;
use App\Models\InvoiceTemplate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class TemplateValidationService
{
    private SafeFormulaCalculator $formulaCalculator;

    public function __construct(SafeFormulaCalculator $formulaCalculator)
    {
        $this->formulaCalculator = $formulaCalculator;
    }

    /**
     * Validate new system against preserved legacy templates
     */
    public function validateAgainstLegacyTemplates(array $templateIds = [22, 13, 17]): array
    {
        $results = [];
        $overallAccuracy = 0;
        $totalTests = 0;

        foreach ($templateIds as $templateId) {
            $result = $this->validateSingleTemplate($templateId);
            $results[$templateId] = $result;

            if ($result['success']) {
                $overallAccuracy += $result['accuracy_percentage'];
                $totalTests++;
            }
        }

        $averageAccuracy = $totalTests > 0 ? ($overallAccuracy / $totalTests) : 0;

        return [
            'success' => $averageAccuracy >= 99.9, // Require 99.9% accuracy
            'overall_accuracy' => $averageAccuracy,
            'total_templates_tested' => $totalTests,
            'individual_results' => $results,
            'validation_timestamp' => now()->toISOString(),
            'is_production_ready' => $averageAccuracy >= 99.9
        ];
    }

    /**
     * Validate a single template against legacy system
     */
    public function validateSingleTemplate(int $legacyTemplateId): array
    {
        try {
            // Get the preserved legacy template
            $legacyTemplate = InvoiceTemplate::find($legacyTemplateId);
            if (!$legacyTemplate) {
                return [
                    'success' => false,
                    'error' => "Legacy template {$legacyTemplateId} not found"
                ];
            }

            // Find corresponding new calculation template by grade code
            $gradeCode = $legacyTemplate->payGradeStructure->grade_code;
            $newTemplate = CalculationTemplate::where('pay_grade_code', $gradeCode)->first();
            if (!$newTemplate) {
                return [
                    'success' => false,
                    'error' => "No new template found for grade code {$gradeCode}"
                ];
            }

            // Generate test data
            $gradeCode = $legacyTemplate->payGradeStructure->grade_code;
            $testEmployees = $this->generateTestEmployeeData($gradeCode);

            // Calculate using both systems
            $legacyResults = $this->calculateUsingLegacyTemplate($legacyTemplate, $testEmployees);
            $newResults = $this->calculateUsingNewTemplate($newTemplate, $testEmployees);

            // Compare results
            $comparison = $this->compareCalculationResults($legacyResults, $newResults);

            return [
                'success' => true,
                'legacy_template_id' => $legacyTemplateId,
                'new_template_id' => $newTemplate->id,
                'pay_grade' => $gradeCode,
                'test_employees_count' => count($testEmployees),
                'accuracy_percentage' => $comparison['accuracy_percentage'],
                'field_accuracy' => $comparison['field_accuracy'],
                'differences' => $comparison['differences'],
                'legacy_results' => $legacyResults,
                'new_results' => $newResults,
                'test_passed' => $comparison['accuracy_percentage'] >= 99.9
            ];
        } catch (\Exception $e) {
            Log::error("Template validation failed for {$legacyTemplateId}: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Generate test employee data for validation
     */
    private function generateTestEmployeeData(string $payGrade): array
    {
        $baseRanges = [
            'A' => [30000, 50000],
            'B' => [25000, 40000],
            'C' => [20000, 35000],
            'D' => [15000, 25000],
            'E' => [12000, 20000]
        ];

        $range = $baseRanges[$payGrade] ?? [20000, 40000];
        $testData = [];

        // Generate 10 test employees with varied salaries
        for ($i = 1; $i <= 10; $i++) {
            $basicSalary = rand($range[0], $range[1]);
            $testData[] = [
                'employee_id' => "TEST{$payGrade}" . sprintf('%03d', $i),
                'employee_name' => "Test Employee {$payGrade}{$i}",
                'grade' => $payGrade,
                'basic_salary' => $basicSalary,
                'pay_grade' => $payGrade
            ];
        }

        return $testData;
    }

    /**
     * Calculate using legacy template (with eval for comparison)
     */
    private function calculateUsingLegacyTemplate($legacyTemplate, array $employees): array
    {
        $results = [];

        foreach ($employees as $employee) {
            $calculations = [];
            $variables = $employee;

            // Recreate legacy calculation environment
            $basicSalary = $employee['basic_salary'];
            $payGrade = $employee['pay_grade'];

            // Parse and execute legacy formulas (carefully)
            foreach ($legacyTemplate->toArray() as $field => $value) {
                if (strpos($field, '_formula') !== false && !empty($value)) {
                    $calcField = str_replace('_formula', '', $field);

                    try {
                        // Replace legacy variables with actual values
                        $formula = $value;
                        $formula = str_replace('$basicSalary', $basicSalary, $formula);
                        $formula = str_replace('$payGrade', "'{$payGrade}'", $formula);

                        // Add calculated fields to variables for subsequent calculations
                        foreach ($calculations as $calcKey => $calcValue) {
                            $formula = str_replace('$' . $calcKey, $calcValue, $formula);
                        }

                        // WARNING: Using eval for legacy comparison only
                        // This is secured because we're only processing preserved test templates
                        $result = eval("return {$formula};");
                        $calculations[$calcField] = is_numeric($result) ? (float) $result : 0;
                    } catch (\Exception $e) {
                        Log::warning("Legacy calculation failed for {$field}: " . $e->getMessage());
                        $calculations[$calcField] = 0;
                    }
                }
            }

            $results[] = array_merge($employee, $calculations);
        }

        return $results;
    }

    /**
     * Calculate using new template system
     */
    private function calculateUsingNewTemplate(CalculationTemplate $template, array $employees): array
    {
        $results = [];

        // Debug: Check template data structure  
        $templateData = [
            'id' => $template->id,
            'salary_components' => $template->salary_components,
            'allowance_components' => $template->allowance_components,
            'deduction_components' => $template->deduction_components,
            'statutory_components' => $template->statutory_components,
            'formulas_count' => count($template->formulas),
            'formulas' => $template->formulas
        ];

        error_log("TEMPLATE DEBUG: " . json_encode($templateData, JSON_PRETTY_PRINT));

        foreach ($employees as $employee) {
            $variables = [
                'basic_salary' => (float) $employee['basic_salary'],
                'employee_id' => $employee['employee_id'],
                'employee_name' => $employee['employee_name'],
                'grade' => $employee['grade'],
                'pay_grade' => $employee['grade'],
                'annual_division_factor' => $template->annual_division_factor ?? 12
            ];

            // Add rates from calculation_rules if available
            if (isset($template->calculation_rules['rates'])) {
                $variables = array_merge($variables, $template->calculation_rules['rates']);
            }

            error_log("VARIABLES DEBUG: " . json_encode($variables, JSON_PRETTY_PRINT));

            $calculations = [];

            error_log("FORMULAS LOOP DEBUG: Starting foreach with " . count($template->formulas) . " formulas");

            foreach ($template->formulas as $field => $formula) {
                error_log("EVALUATING FIELD: {$field} = {$formula}");
                try {
                    // Check if the formula is just a number (fixed amount)
                    if (is_numeric($formula)) {
                        $result = (float) $formula;
                        error_log("NUMERIC RESULT: {$field} = {$result}");
                    } else {
                        error_log("CALLING FORMULA CALCULATOR for {$field}");

                        // Filter variables to only numeric ones for SafeFormulaCalculator
                        $numericVariables = array_filter($variables, function ($value) {
                            return is_numeric($value);
                        });

                        error_log("NUMERIC VARIABLES: " . json_encode($numericVariables));

                        $result = $this->formulaCalculator->evaluate($formula, $numericVariables);
                        error_log("CALCULATOR RESULT: {$field} = {$result}");
                    }
                    $calculations[$field] = $result;
                    $variables[$field] = $result; // Make available for subsequent calculations
                } catch (\Exception $e) {
                    error_log("EXCEPTION in {$field}: " . $e->getMessage());
                    $calculations[$field] = 0;
                }
            }

            $results[] = array_merge($employee, $calculations);
        }

        return $results;
    }

    /**
     * Compare calculation results between legacy and new system
     */
    private function compareCalculationResults(array $legacyResults, array $newResults): array
    {
        $differences = [];
        $fieldAccuracy = [];
        $totalFields = 0;
        $accurateFields = 0;

        // Get all calculation fields (excluding employee data fields)
        $calculationFields = [];
        if (!empty($legacyResults)) {
            $excludeFields = ['employee_id', 'employee_name', 'grade', 'basic_salary', 'pay_grade'];
            $calculationFields = array_diff(array_keys($legacyResults[0]), $excludeFields);
        }

        foreach ($calculationFields as $field) {
            $fieldDifferences = [];
            $matchCount = 0;

            for ($i = 0; $i < count($legacyResults); $i++) {
                $legacyValue = $legacyResults[$i][$field] ?? 0;
                $newValue = $newResults[$i][$field] ?? 0;

                $difference = abs($legacyValue - $newValue);
                $percentageDiff = $legacyValue != 0 ? ($difference / abs($legacyValue)) * 100 : 0;

                // Consider values as matching if difference is less than 0.01 (1 cent)
                $isMatch = $difference < 0.01;

                if ($isMatch) {
                    $matchCount++;
                } else {
                    $fieldDifferences[] = [
                        'employee_id' => $legacyResults[$i]['employee_id'],
                        'legacy_value' => $legacyValue,
                        'new_value' => $newValue,
                        'difference' => $difference,
                        'percentage_diff' => $percentageDiff
                    ];
                }

                $totalFields++;
                if ($isMatch) {
                    $accurateFields++;
                }
            }

            $fieldAccuracy[$field] = [
                'matches' => $matchCount,
                'total' => count($legacyResults),
                'accuracy_percentage' => (count($legacyResults) > 0) ? ($matchCount / count($legacyResults)) * 100 : 0,
                'differences' => $fieldDifferences
            ];

            if (!empty($fieldDifferences)) {
                $differences[$field] = $fieldDifferences;
            }
        }

        $overallAccuracy = $totalFields > 0 ? ($accurateFields / $totalFields) * 100 : 0;

        return [
            'accuracy_percentage' => $overallAccuracy,
            'field_accuracy' => $fieldAccuracy,
            'differences' => $differences,
            'total_comparisons' => $totalFields,
            'accurate_comparisons' => $accurateFields
        ];
    }

    /**
     * Generate detailed validation report
     */
    public function generateValidationReport(array $templateIds = [22, 13, 17]): array
    {
        $validationResults = $this->validateAgainstLegacyTemplates($templateIds);

        $report = [
            'validation_summary' => [
                'timestamp' => $validationResults['validation_timestamp'],
                'overall_accuracy' => $validationResults['overall_accuracy'],
                'is_production_ready' => $validationResults['is_production_ready'],
                'templates_tested' => $validationResults['total_templates_tested']
            ],
            'template_results' => [],
            'recommendations' => [],
            'next_steps' => []
        ];

        // Process individual template results
        foreach ($validationResults['individual_results'] as $templateId => $result) {
            if ($result['success']) {
                $report['template_results'][] = [
                    'legacy_template_id' => $templateId,
                    'pay_grade' => $result['pay_grade'],
                    'accuracy' => $result['accuracy_percentage'],
                    'test_passed' => $result['test_passed'],
                    'issues_count' => count($result['differences'])
                ];

                // Add recommendations based on accuracy
                if ($result['accuracy_percentage'] < 99.9) {
                    $report['recommendations'][] = "Template {$templateId} (Grade {$result['pay_grade']}) needs formula review - {$result['accuracy_percentage']}% accuracy";
                }
            } else {
                $report['template_results'][] = [
                    'legacy_template_id' => $templateId,
                    'error' => $result['error'],
                    'test_passed' => false
                ];
                $report['recommendations'][] = "Template {$templateId} validation failed: {$result['error']}";
            }
        }

        // Generate next steps
        if ($validationResults['is_production_ready']) {
            $report['next_steps'] = [
                'System is ready for production deployment',
                'Consider running additional edge case tests',
                'Prepare migration plan for remaining templates'
            ];
        } else {
            $report['next_steps'] = [
                'Review and fix formula discrepancies',
                'Re-run validation after corrections',
                'Investigate specific calculation differences',
                'Consider manual review of complex formulas'
            ];
        }

        return $report;
    }

    /**
     * Test specific calculation with detailed breakdown
     */
    public function testSpecificCalculation(int $templateId, array $employeeData): array
    {
        try {
            $legacyTemplate = InvoiceTemplate::find($templateId);
            $newTemplate = CalculationTemplate::where('grade', $legacyTemplate->pay_grade)->first();

            $legacyResult = $this->calculateUsingLegacyTemplate($legacyTemplate, [$employeeData]);
            $newResult = $this->calculateUsingNewTemplate($newTemplate, [$employeeData]);

            return [
                'success' => true,
                'employee_data' => $employeeData,
                'legacy_result' => $legacyResult[0] ?? [],
                'new_result' => $newResult[0] ?? [],
                'step_by_step_legacy' => $this->getStepByStepCalculation($legacyTemplate, $employeeData),
                'step_by_step_new' => $this->getStepByStepCalculationNew($newTemplate, $employeeData)
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get step-by-step calculation breakdown for new system
     */
    private function getStepByStepCalculationNew(CalculationTemplate $template, array $employeeData): array
    {
        $steps = [];
        $variables = [
            'basic_salary' => (float) $employeeData['basic_salary'],
            'employee_id' => $employeeData['employee_id'],
            'employee_name' => $employeeData['employee_name'],
            'grade' => $employeeData['grade']
        ];

        foreach ($template->formulas as $field => $formula) {
            try {
                // Check if the formula is just a number (fixed amount)
                if (is_numeric($formula)) {
                    $result = (float) $formula;
                } else {
                    $result = $this->formulaCalculator->evaluate($formula, $variables);
                }
                $steps[] = [
                    'field' => $field,
                    'formula' => $formula,
                    'variables_used' => $variables,
                    'result' => $result
                ];
                $variables[$field] = $result;
            } catch (\Exception $e) {
                $steps[] = [
                    'field' => $field,
                    'formula' => $formula,
                    'error' => $e->getMessage(),
                    'result' => 0
                ];
            }
        }

        return $steps;
    }

    /**
     * Get step-by-step calculation breakdown for legacy system
     */
    private function getStepByStepCalculation($legacyTemplate, array $employeeData): array
    {
        $steps = [];
        $variables = $employeeData;

        foreach ($legacyTemplate->toArray() as $field => $value) {
            if (strpos($field, '_formula') !== false && !empty($value)) {
                $calcField = str_replace('_formula', '', $field);

                try {
                    $formula = $value;
                    $originalFormula = $formula;

                    // Variable substitution tracking
                    $substitutions = [];
                    $formula = str_replace('$basicSalary', $employeeData['basic_salary'], $formula);
                    $substitutions['$basicSalary'] = $employeeData['basic_salary'];

                    foreach ($variables as $key => $val) {
                        if (is_numeric($val) && strpos($formula, '$' . $key) !== false) {
                            $formula = str_replace('$' . $key, $val, $formula);
                            $substitutions['$' . $key] = $val;
                        }
                    }

                    $result = eval("return {$formula};");
                    $variables[$calcField] = is_numeric($result) ? (float) $result : 0;

                    $steps[] = [
                        'field' => $calcField,
                        'original_formula' => $originalFormula,
                        'substituted_formula' => $formula,
                        'substitutions' => $substitutions,
                        'result' => $variables[$calcField]
                    ];
                } catch (\Exception $e) {
                    $steps[] = [
                        'field' => $calcField,
                        'original_formula' => $value,
                        'error' => $e->getMessage(),
                        'result' => 0
                    ];
                }
            }
        }

        return $steps;
    }
}
