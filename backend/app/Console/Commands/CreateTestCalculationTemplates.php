<?php

namespace App\Console\Commands;

use App\Models\CalculationTemplate;
use App\Models\InvoiceTemplate;
use App\Services\TemplateFormulaConverter;
use Illuminate\Console\Command;

class CreateTestCalculationTemplates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'templates:create-test-templates {--force : Force recreation of existing templates}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create test calculation templates for validation based on preserved legacy templates';

    private TemplateFormulaConverter $converter;

    public function __construct(TemplateFormulaConverter $converter)
    {
        parent::__construct();
        $this->converter = $converter;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔨 Creating Test Calculation Templates...');
        $this->newLine();

        $preservedTemplateIds = [22, 13, 17];
        $created = 0;
        $errors = [];

        foreach ($preservedTemplateIds as $templateId) {
            try {
                $result = $this->createCalculationTemplateFromLegacy($templateId);
                if ($result['success']) {
                    $created++;
                    $this->info("✅ Created template for {$result['grade_code']} (ID: {$result['template_id']})");
                } else {
                    $errors[] = "❌ Failed to create template {$templateId}: {$result['error']}";
                    $this->error($errors[count($errors) - 1]);
                }
            } catch (\Exception $e) {
                $errors[] = "❌ Exception creating template {$templateId}: {$e->getMessage()}";
                $this->error($errors[count($errors) - 1]);
            }
        }

        $this->newLine();
        $this->info("Summary: {$created} templates created, " . count($errors) . " errors");

        if ($created > 0) {
            $this->info('🎉 Test templates ready for validation!');
            $this->line('Run: php artisan templates:validate-accuracy --detailed');
        }

        return count($errors) === 0 ? 0 : 1;
    }

    /**
     * Create calculation template from legacy template
     */
    private function createCalculationTemplateFromLegacy(int $legacyTemplateId): array
    {
        try {
            $legacyTemplate = InvoiceTemplate::with('payGradeStructure')->find($legacyTemplateId);
            if (!$legacyTemplate) {
                return [
                    'success' => false,
                    'error' => "Legacy template {$legacyTemplateId} not found"
                ];
            }

            $gradeCode = $legacyTemplate->payGradeStructure->grade_code;

            // Check if template already exists
            $existing = CalculationTemplate::where('pay_grade_code', $gradeCode)->first();
            if ($existing && !$this->option('force')) {
                return [
                    'success' => false,
                    'error' => "Template for {$gradeCode} already exists (use --force to recreate)"
                ];
            }

            if ($existing && $this->option('force')) {
                $existing->delete();
                $this->warn("Deleted existing template for {$gradeCode}");
            }

            // Create simplified formulas structure for testing
            $formulas = $this->createSimplifiedFormulas($legacyTemplate);

            // Create calculation template
            $template = CalculationTemplate::create([
                'name' => "Test Template - {$gradeCode}",
                'pay_grade_code' => $gradeCode,
                'description' => "Test calculation template converted from legacy template {$legacyTemplateId}",
                'version' => '1.0',
                'salary_components' => $formulas['salary_components'] ?? [],
                'allowance_components' => $formulas['allowance_components'] ?? [],
                'deduction_components' => $formulas['deduction_components'] ?? [],
                'statutory_components' => $formulas['statutory_components'] ?? [],
                'calculation_rules' => [
                    'calculation_order' => ['salary', 'allowances', 'gross', 'deductions', 'statutory', 'net'],
                    'legacy_template_id' => $legacyTemplateId,
                    'rates' => $formulas['rates'] ?? [],
                    'annual_division_factor' => 12
                ],
                'is_active' => true,
                'is_default' => true,
                'created_by' => 'test_generator'
            ]);

            return [
                'success' => true,
                'template_id' => $template->id,
                'grade_code' => $gradeCode,
                'formulas_count' => count($formulas['all_formulas'] ?? [])
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Create simplified formulas structure from legacy template
     */
    private function createSimplifiedFormulas($legacyTemplate): array
    {
        $gradeCode = $legacyTemplate->payGradeStructure->grade_code;

        // Extract formulas from custom_components and statutory_components
        $allFormulas = [];
        $formulaComponents = [
            'salary_components' => [],
            'allowance_components' => [],
            'deduction_components' => [],
            'statutory_components' => []
        ];

        // Process custom components
        if (!empty($legacyTemplate->custom_components)) {
            $components = is_string($legacyTemplate->custom_components) ?
                json_decode($legacyTemplate->custom_components, true) :
                $legacyTemplate->custom_components;

            if (is_array($components)) {
                foreach ($components as $component) {
                    $name = strtolower($component['name']);

                    if ($component['type'] === 'formula' && isset($component['formula']) && !empty($component['formula'])) {
                        $formula = $this->convertLegacyFormula($component['formula']);
                        $allFormulas[$name] = $formula;

                        // Categorize components
                        if (in_array($name, ['basic_salary'])) {
                            $formulaComponents['salary_components'][$name] = [
                                'formula' => $formula,
                                'description' => $component['description'] ?? ucfirst(str_replace('_', ' ', $name))
                            ];
                        } elseif (strpos($name, 'allowance') !== false || in_array($name, ['housing', 'transport_allowance', 'utility_allowance', 'entertainment', 'dressing', 'annual_leave', '13th_month'])) {
                            $formulaComponents['allowance_components'][$name] = [
                                'formula' => $formula,
                                'description' => $component['description'] ?? ucfirst(str_replace('_', ' ', $name))
                            ];
                        } else {
                            $formulaComponents['salary_components'][$name] = [
                                'formula' => $formula,
                                'description' => $component['description'] ?? ucfirst(str_replace('_', ' ', $name))
                            ];
                        }
                    } elseif ($component['type'] === 'fixed') {
                        // Handle different legacy template structures for fixed components
                        $annualAmount = null;
                        if (isset($component['rate']) && !empty($component['rate'])) {
                            $annualAmount = (float) $component['rate'];
                        } elseif (isset($component['amount']) && !empty($component['amount'])) {
                            $annualAmount = (float) $component['amount'];
                        }

                        if ($annualAmount !== null) {
                            if ($name === 'basic_salary') {
                                // Special handling for basic_salary - it should preserve input
                                $allFormulas[$name] = 'basic_salary';
                                $formulaComponents['salary_components'][$name] = [
                                    'formula' => 'basic_salary',
                                    'description' => 'Basic salary input'
                                ];
                            } else {
                                // Store as monthly calculation using template's division factor
                                $allFormulas[$name] = $annualAmount . ' / annual_division_factor';
                                $formulaComponents['allowance_components'][$name] = [
                                    'formula' => $annualAmount . ' / annual_division_factor',
                                    'description' => $component['description'] ?? ucfirst(str_replace('_', ' ', $name))
                                ];
                            }
                        }
                    }
                }
            }
        }

        // Process statutory components
        if (!empty($legacyTemplate->statutory_components)) {
            $components = is_string($legacyTemplate->statutory_components) ?
                json_decode($legacyTemplate->statutory_components, true) :
                $legacyTemplate->statutory_components;

            if (is_array($components)) {
                foreach ($components as $key => $component) {
                    $name = strtolower($component['name']);

                    // Handle different legacy template structures for statutory components
                    $annualAmount = null;
                    if (isset($component['rate']) && !empty($component['rate'])) {
                        $annualAmount = (float) $component['rate'];
                    } elseif (isset($component['amount']) && !empty($component['amount'])) {
                        $annualAmount = (float) $component['amount'];
                    }

                    if ($component['type'] === 'fixed' && $annualAmount !== null) {
                        $allFormulas[$name] = $annualAmount . ' / annual_division_factor';
                    } elseif ($component['type'] === 'formula' && isset($component['formula']) && !empty($component['formula'])) {
                        $allFormulas[$name] = $this->convertLegacyFormula($component['formula']);
                    } else {
                        // Skip components without proper data
                        continue;
                    }

                    if (strpos($name, 'pension') !== false || strpos($name, 'tax') !== false || in_array($name, ['eca', 'itf'])) {
                        $formulaComponents['statutory_components'][$name] = [
                            'formula' => $allFormulas[$name],
                            'description' => $component['description'] ?? ucfirst(str_replace('_', ' ', $name))
                        ];
                    } else {
                        $formulaComponents['deduction_components'][$name] = [
                            'formula' => $allFormulas[$name],
                            'description' => $component['description'] ?? ucfirst(str_replace('_', ' ', $name))
                        ];
                    }
                }
            }
        }

        // Ensure basic_salary is always preserved as input
        if (!isset($allFormulas['basic_salary'])) {
            $allFormulas['basic_salary'] = 'basic_salary';
            $formulaComponents['salary_components']['basic_salary'] = [
                'formula' => 'basic_salary',
                'description' => 'Basic salary input'
            ];
        }

        // If no formulas were found, create basic test formulas
        if (empty($allFormulas) || count($allFormulas) <= 1) {
            return $this->createBasicTestFormulas();
        }

        $formulaComponents['all_formulas'] = $allFormulas;
        return $formulaComponents;
    }

    /**
     * Convert legacy formula syntax to new system
     */
    private function convertLegacyFormula($formula): string
    {
        // Convert basic formula syntax
        $converted = $formula;

        // Handle SUM function with range syntax (A:B) - convert to addition of all components
        $converted = preg_replace_callback('/SUM\(([^:]+):([^)]+)\)/', function ($matches) {
            $start = trim($matches[1]);
            $end = trim($matches[2]);

            // For the specific case of SUM(BASIC_SALARY:PARLLIATIVE), this should be all salary components
            if (strtoupper($start) === 'BASIC_SALARY' && strtoupper($end) === 'PARLLIATIVE') {
                return 'basic_salary + housing + transport_allowance + utility_allowance + education + leave + 13th_month + xmas_bonus + lunch_allowance + medical + entertainment + parlliative';
            }

            // For other cases, convert to proper variable names
            $startVar = strtolower(str_replace(' ', '_', $start));
            $endVar = strtolower(str_replace(' ', '_', $end));
            return "{$startVar} + {$endVar}";
        }, $converted);

        // Handle SUM function with addition syntax
        $converted = preg_replace_callback('/SUM\(([^)]+)\)/', function ($matches) {
            $items = $matches[1];
            // If it contains +, just return the addition
            if (strpos($items, '+') !== false) {
                // Convert variable names in the addition
                $items = preg_replace_callback('/([A-Z_]+[A-Z0-9_]*)/', function ($varMatches) {
                    return strtolower(str_replace(' ', '_', $varMatches[1]));
                }, $items);
                return $items;
            }
            return $items;
        }, $converted);

        // Convert percentage syntax (7.5%*B32 -> (7.5 / 100) * b32)
        $converted = preg_replace('/(\d+(?:\.\d+)?)%\*(.+)/', '($1 / 100) * $2', $converted);
        $converted = preg_replace('/(.+)\*(\d+(?:\.\d+)?)%/', '$1 * ($2 / 100)', $converted);

        // Handle undefined Excel cell references by setting them to 0 for now
        // TODO: These should be mapped to actual components or made configurable
        $converted = preg_replace('/\bb\d+\b/i', '0', $converted);

        // Convert variable names to lowercase (but preserve operators and parentheses)
        $converted = preg_replace_callback('/([A-Z_]+[A-Z0-9_]*)/', function ($matches) {
            return strtolower(str_replace(' ', '_', $matches[1]));
        }, $converted);

        // Clean up and standardize operators
        $converted = str_replace(['( ', ' )', ' + ', ' - ', ' * ', ' / '], ['(', ')', '+', '-', '*', '/'], $converted);
        $converted = preg_replace('/\s+/', '', $converted); // Remove all spaces
        $converted = str_replace(['+', '-', '*', '/'], [' + ', ' - ', ' * ', ' / '], $converted); // Add proper spacing around operators

        return trim($converted);
    }

    /**
     * Create basic test formulas when no real formulas are found
     */
    private function createBasicTestFormulas(): array
    {
        // Define configurable rates that can be adjusted without hardcoding
        $rates = [
            'housing_allowance_rate' => 0.75,
            'transport_allowance_rate' => 0.50,
            'utility_allowance_rate' => 0.875,
            'entertainment_allowance_rate' => 0.75,
            'dressing_allowance_rate' => 0.75,
            'annual_leave_rate' => 0.175,
            'thirteenth_month_rate' => 0.20,
            'pension_employee_rate' => 0.08,
            'pension_employer_rate' => 0.10,
            'tax_rate' => 0.24,
            'annual_division_factor' => 12
        ];

        return [
            'salary_components' => [
                'basic_salary' => [
                    'formula' => 'basic_salary',
                    'description' => 'Basic salary input'
                ]
            ],
            'allowance_components' => [
                'housing_allowance' => [
                    'formula' => 'basic_salary * housing_allowance_rate',
                    'description' => 'Housing allowance'
                ],
                'transport_allowance' => [
                    'formula' => 'basic_salary * transport_allowance_rate',
                    'description' => 'Transport allowance'
                ],
                'utility_allowance' => [
                    'formula' => 'basic_salary * utility_allowance_rate',
                    'description' => 'Utility allowance'
                ],
                'entertainment_allowance' => [
                    'formula' => 'basic_salary * entertainment_allowance_rate',
                    'description' => 'Entertainment allowance'
                ],
                'dressing_allowance' => [
                    'formula' => 'basic_salary * dressing_allowance_rate',
                    'description' => 'Dressing allowance'
                ],
                'annual_leave' => [
                    'formula' => 'basic_salary * annual_leave_rate',
                    'description' => 'Annual leave'
                ],
                'thirteenth_month' => [
                    'formula' => 'basic_salary * thirteenth_month_rate',
                    'description' => 'Thirteenth month'
                ]
            ],
            'deduction_components' => [
                'pension_employee' => [
                    'formula' => 'basic_salary * pension_employee_rate',
                    'description' => 'Employee pension'
                ],
                'tax_deduction' => [
                    'formula' => 'gross_salary * tax_rate',
                    'description' => 'Tax deduction'
                ],
                'total_deductions' => [
                    'formula' => 'pension_employee + tax_deduction',
                    'description' => 'Total deductions'
                ]
            ],
            'statutory_components' => [
                'pension_employer' => [
                    'formula' => 'basic_salary * pension_employer_rate',
                    'description' => 'Employer pension'
                ]
            ],
            'all_formulas' => array_merge([
                'basic_salary' => 'basic_salary',
                'housing_allowance' => 'basic_salary * housing_allowance_rate',
                'transport_allowance' => 'basic_salary * transport_allowance_rate',
                'utility_allowance' => 'basic_salary * utility_allowance_rate',
                'entertainment_allowance' => 'basic_salary * entertainment_allowance_rate',
                'dressing_allowance' => 'basic_salary * dressing_allowance_rate',
                'annual_leave' => 'basic_salary * annual_leave_rate',
                'thirteenth_month' => 'basic_salary * thirteenth_month_rate',
                'gross_salary' => 'basic_salary + housing_allowance + transport_allowance + utility_allowance + entertainment_allowance + dressing_allowance + annual_leave + thirteenth_month',
                'pension_employee' => 'basic_salary * pension_employee_rate',
                'pension_employer' => 'basic_salary * pension_employer_rate',
                'tax_deduction' => 'gross_salary * tax_rate',
                'total_deductions' => 'pension_employee + tax_deduction',
                'net_salary' => 'gross_salary - total_deductions'
            ], $rates),
            'rates' => $rates
        ];
    }
}
