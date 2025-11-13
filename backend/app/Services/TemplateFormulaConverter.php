<?php

namespace App\Services;

use App\Models\InvoiceTemplate;
use App\Contracts\FormulaCalculatorInterface;
use Illuminate\Support\Facades\Log;

class TemplateFormulaConverter
{
    private FormulaCalculatorInterface $calculator;

    public function __construct(FormulaCalculatorInterface $calculator)
    {
        $this->calculator = $calculator;
    }

    /**
     * Convert all formulas in a preserved template for testing
     */
    public function convertPreservedTemplate(int $templateId): array
    {
        $template = InvoiceTemplate::find($templateId);
        if (!$template) {
            throw new \InvalidArgumentException("Template {$templateId} not found");
        }

        if (!str_contains($template->template_name, '[TEST PRESERVED]')) {
            throw new \InvalidArgumentException("Template {$templateId} is not marked as TEST PRESERVED");
        }

        $results = [
            'template_id' => $templateId,
            'template_name' => $template->template_name,
            'conversion_results' => [],
            'variable_mappings' => [],
            'issues' => []
        ];

        // Process custom components
        $customComponents = $template->custom_components ?? [];
        foreach ($customComponents as $index => $component) {
            if (isset($component['type']) && $component['type'] === 'formula') {
                $conversion = $this->convertSingleFormula(
                    $component['formula'] ?? '',
                    $component['name'] ?? "custom_component_{$index}"
                );
                $results['conversion_results']['custom'][] = $conversion;
            }
        }

        // Process statutory components
        $statutoryComponents = $template->statutory_components ?? [];
        foreach ($statutoryComponents as $index => $component) {
            if (isset($component['type']) && $component['type'] === 'formula') {
                $conversion = $this->convertSingleFormula(
                    $component['formula'] ?? '',
                    $component['name'] ?? "statutory_component_{$index}"
                );
                $results['conversion_results']['statutory'][] = $conversion;
            }
        }

        // Extract all variables used
        $allVariables = $this->extractAllVariables($results['conversion_results']);
        $results['variable_mappings'] = $this->createVariableMappings($allVariables);

        return $results;
    }

    /**
     * Convert a single formula from old eval format to safe format
     */
    private function convertSingleFormula(string $originalFormula, string $componentName): array
    {
        $result = [
            'component_name' => $componentName,
            'original_formula' => $originalFormula,
            'converted_formula' => '',
            'conversion_notes' => [],
            'validation_issues' => [],
            'variables_used' => []
        ];

        try {
            // Apply conversion rules
            $converted = $this->applyConversionRules($originalFormula);
            $result['converted_formula'] = $converted;

            // Extract variables
            $result['variables_used'] = $this->calculator->extractVariables($converted);

            // Test with sample data
            $sampleVariables = $this->generateSampleVariables($result['variables_used']);
            $validation = $this->calculator->validateFormula($converted, $sampleVariables);

            if (!empty($validation)) {
                $result['validation_issues'] = $validation;
            }

            // Test evaluation
            if (empty($validation)) {
                $testResult = $this->calculator->evaluate($converted, $sampleVariables);
                $result['conversion_notes'][] = "Successfully evaluated to: {$testResult}";
            }
        } catch (\Exception $e) {
            $result['validation_issues'][] = "Conversion failed: " . $e->getMessage();
        }

        return $result;
    }

    /**
     * Apply conversion rules to transform old formula syntax
     */
    private function applyConversionRules(string $formula): string
    {
        $converted = $formula;

        try {
            // Step 1: Convert percentage notation (10% -> (10/100))
            $converted = preg_replace('/(\d+(?:\.\d+)?)\s*%/', '($1/100)', $converted);

            // Step 2: Convert Excel cell references (B32 -> CELL_B32)
            $converted = preg_replace('/\bB(\d+)\b/', 'CELL_B$1', $converted);
            $converted = preg_replace('/\bA(\d+)\b/', 'CELL_A$1', $converted);

            // Step 3: Handle SUM with range notation
            // SUM(BASIC_SALARY:HOUSING) -> SUM([BASIC_SALARY, ..., HOUSING])
            $converted = preg_replace_callback('/SUM\(([A-Z_]+):([A-Z_]+)\)/', function ($matches) {
                return "SUM_RANGE('{$matches[1]}', '{$matches[2]}')";
            }, $converted);

            // Step 4: Handle SUM with explicit addition
            // SUM(A+B+C) -> SUM([A, B, C])
            $converted = preg_replace_callback('/SUM\(([^)]+)\)/', function ($matches) {
                $content = $matches[1];
                // If it contains + signs, convert to array notation
                if (strpos($content, '+') !== false) {
                    $parts = explode('+', $content);
                    $parts = array_map('trim', $parts);
                    return 'SUM([' . implode(', ', $parts) . '])';
                }
                return $matches[0]; // Return unchanged if no + signs
            }, $converted);

            // Step 5: Clean up spaces around operators
            $converted = preg_replace('/\s*([+\-*\/])\s*/', ' $1 ', $converted);

            // Step 6: Clean up multiple spaces
            $converted = preg_replace('/\s+/', ' ', $converted);
        } catch (\Exception $e) {
            throw new \InvalidArgumentException("Formula conversion failed: " . $e->getMessage());
        }

        return trim($converted);
    }

    /**
     * Generate sample variables for testing
     */
    private function generateSampleVariables(array $variables): array
    {
        $samples = [];

        foreach ($variables as $variable) {
            // Generate realistic sample values based on variable name
            $samples[$variable] = $this->getSampleValueForVariable($variable);
        }

        return $samples;
    }

    /**
     * Get realistic sample value for a variable based on its name
     */
    private function getSampleValueForVariable(string $variable): float
    {
        $variable = strtoupper($variable);

        // Common salary components with realistic values
        $commonValues = [
            'BASIC_SALARY' => 144000,
            'HOUSING' => 56400,
            'TRANSPORT_ALLOWANCE' => 56400,
            'UTILITY_ALLOWANCE' => 176400,
            'EDUCATION' => 120000,
            'LEAVE' => 17280,
            'LUNCH_ALLOWANCE' => 132000,
            'MEDICAL' => 60000,
            'ENTERTAINMENT' => 84000,
            'PENSION' => 20544,
            'PAYEE' => 72154.56,
            'GROSS_SALARY' => 1231831.944,
        ];

        if (isset($commonValues[$variable])) {
            return $commonValues[$variable];
        }

        // Generate based on patterns
        if (str_contains($variable, 'SALARY')) {
            return 100000 + rand(0, 500000);
        }

        if (str_contains($variable, 'ALLOWANCE')) {
            return 10000 + rand(0, 100000);
        }

        if (str_contains($variable, 'DEDUCTION') || str_contains($variable, 'TAX')) {
            return 5000 + rand(0, 50000);
        }

        if (str_contains($variable, 'CELL_')) {
            return 1000 + rand(0, 100000);
        }

        // Default value
        return 50000;
    }

    /**
     * Extract all variables from conversion results
     */
    private function extractAllVariables(array $conversionResults): array
    {
        $allVariables = [];

        foreach ($conversionResults as $category => $results) {
            foreach ($results as $result) {
                $allVariables = array_merge($allVariables, $result['variables_used'] ?? []);
            }
        }

        return array_unique($allVariables);
    }

    /**
     * Create variable mappings for new template structure
     */
    private function createVariableMappings(array $variables): array
    {
        $mappings = [];

        foreach ($variables as $variable) {
            $mappings[$variable] = [
                'new_name' => $variable,
                'type' => $this->classifyVariable($variable),
                'component_category' => $this->categorizeVariable($variable),
                'sample_value' => $this->getSampleValueForVariable($variable)
            ];
        }

        return $mappings;
    }

    /**
     * Classify variable type
     */
    private function classifyVariable(string $variable): string
    {
        $variable = strtoupper($variable);

        if (str_contains($variable, 'SALARY')) {
            return 'salary';
        }

        if (str_contains($variable, 'ALLOWANCE')) {
            return 'allowance';
        }

        if (str_contains($variable, 'DEDUCTION') || str_contains($variable, 'TAX') || str_contains($variable, 'PENSION')) {
            return 'deduction';
        }

        if (in_array($variable, ['PENSION', 'PAYEE', 'NHIS', 'NSITF'])) {
            return 'statutory';
        }

        return 'calculated';
    }

    /**
     * Categorize variable for new template structure
     */
    private function categorizeVariable(string $variable): string
    {
        $type = $this->classifyVariable($variable);

        switch ($type) {
            case 'salary':
                return 'salary_components';
            case 'allowance':
                return 'allowance_components';
            case 'deduction':
                return 'deduction_components';
            case 'statutory':
                return 'statutory_components';
            default:
                return 'calculated_components';
        }
    }

    /**
     * Convert all preserved templates and generate migration plan
     */
    public function convertAllPreservedTemplates(): array
    {
        $preservedTemplates = InvoiceTemplate::where('template_name', 'LIKE', '%[TEST PRESERVED]%')->get();

        $results = [
            'converted_templates' => [],
            'summary' => [
                'total_templates' => $preservedTemplates->count(),
                'total_formulas_converted' => 0,
                'total_variables_identified' => 0,
                'conversion_issues' => 0
            ],
            'global_variable_mappings' => []
        ];

        foreach ($preservedTemplates as $template) {
            try {
                $conversion = $this->convertPreservedTemplate($template->id);
                $results['converted_templates'][] = $conversion;

                // Update summary
                $formulaCount = count($conversion['conversion_results']['custom'] ?? []) +
                    count($conversion['conversion_results']['statutory'] ?? []);
                $results['summary']['total_formulas_converted'] += $formulaCount;

                $variableCount = count($conversion['variable_mappings']);
                $results['summary']['total_variables_identified'] += $variableCount;

                $issueCount = 0;
                foreach ($conversion['conversion_results'] as $category => $categoryResults) {
                    foreach ($categoryResults as $result) {
                        $issueCount += count($result['validation_issues'] ?? []);
                    }
                }
                $results['summary']['conversion_issues'] += $issueCount;

                // Merge variable mappings
                $results['global_variable_mappings'] = array_merge(
                    $results['global_variable_mappings'],
                    $conversion['variable_mappings']
                );
            } catch (\Exception $e) {
                Log::error("Failed to convert template {$template->id}: " . $e->getMessage());
                $results['summary']['conversion_issues']++;
            }
        }

        // Remove duplicates from global mappings
        $results['global_variable_mappings'] = array_unique($results['global_variable_mappings'], SORT_REGULAR);

        return $results;
    }
}
