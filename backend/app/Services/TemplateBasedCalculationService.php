<?php

namespace App\Services;

use App\Models\Staff;
use App\Models\InvoiceTemplate;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * TemplateBasedCalculationService
 * 
 * Handles template-driven salary calculations using invoice_templates as single source of truth
 * Replaces staff table salary dependencies with template-driven approach
 * 
 * Phase 0.3: Template-Based Calculation Implementation
 */
class TemplateBasedCalculationService
{
    /**
     * Calculate salary components from invoice template
     * 
     * @param Staff $employee
     * @param int $clientId
     * @param float $attendanceFactor
     * @param array $attendanceContext Optional attendance data for proration (days_worked, total_days)
     * @return array
     * @throws Exception
     */
    public function calculateFromTemplate(Staff $employee, int $clientId, float $attendanceFactor, array $attendanceContext = []): array
    {
        try {
            Log::info("Starting template-based calculation", [
                'employee_id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'client_id' => $clientId,
                'pay_grade_structure_id' => $employee->pay_grade_structure_id,
                'attendance_factor' => $attendanceFactor
            ]);

            // 1. Get template for client + pay grade structure
            $template = $this->getTemplateForEmployee($employee, $clientId);

            // 2. Validate template completeness
            $this->validateTemplateCompleteness($template);

            // 3. Extract base components from template
            $baseComponents = $this->extractCustomComponents($template);

            // 4. Apply attendance factor to components
            $adjustedComponents = $this->applyAttendanceFactor($baseComponents, $attendanceFactor);

            // 5. Calculate gross salary
            $grossSalary = $this->calculateGrossSalary($adjustedComponents);

            // 6. Extract and calculate statutory deductions
            $statutoryDeductions = $this->calculateStatutoryDeductions($template, $grossSalary, $adjustedComponents, $attendanceContext);

            // 6.5. Recalculate aggregate formulas now that we have all data
            $adjustedComponents = $this->recalculateAggregateFormulas($adjustedComponents, $grossSalary, $statutoryDeductions, $template);

            // 7. Calculate final amounts
            $netSalary = $grossSalary - array_sum($statutoryDeductions);
            $creditToBank = $grossSalary + array_sum($statutoryDeductions);

            $result = [
                'employee_id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'employee_name' => $employee->full_name,
                'client_id' => $clientId,
                'template_id' => $template->id,
                'template_name' => $template->template_name,
                'pay_grade_structure_id' => $employee->pay_grade_structure_id,
                'attendance_factor' => round($attendanceFactor, 4),
                'base_components' => $baseComponents,
                'adjusted_components' => $adjustedComponents,
                'gross_salary' => round($grossSalary, 2),
                'statutory_deductions' => $statutoryDeductions,
                'net_salary' => round($netSalary, 2),
                'credit_to_bank' => round($creditToBank, 2),
                'template_validation' => 'valid',
                'calculated_at' => now()->toDateTimeString()
            ];

            Log::info("Template-based calculation completed successfully", [
                'employee_id' => $employee->id,
                'template_id' => $template->id,
                'gross_salary' => $grossSalary,
                'net_salary' => $netSalary
            ]);

            return $result;
        } catch (Exception $e) {
            Log::error("Error in template-based calculation", [
                'employee_id' => $employee->id ?? null,
                'client_id' => $clientId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }

    /**
     * Get invoice template for employee and client
     * 
     * @param Staff $employee
     * @param int $clientId
     * @return InvoiceTemplate
     * @throws Exception
     */
    private function getTemplateForEmployee(Staff $employee, int $clientId): InvoiceTemplate
    {
        $template = InvoiceTemplate::where('client_id', $clientId)
            ->where('pay_grade_structure_id', $employee->pay_grade_structure_id)
            ->where('is_active', true)
            ->first();

        if (!$template) {
            $message = "No active template found for client {$clientId} and pay grade structure {$employee->pay_grade_structure_id}";
            Log::error($message, [
                'employee_id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'client_id' => $clientId,
                'pay_grade_structure_id' => $employee->pay_grade_structure_id
            ]);

            throw new Exception($message);
        }

        return $template;
    }

    /**
     * Validate template has all required components
     * 
     * @param InvoiceTemplate $template
     * @throws Exception
     */
    private function validateTemplateCompleteness(InvoiceTemplate $template): void
    {
        // Check custom_components (already cast as array in model)
        $customComponents = $template->custom_components;

        if (empty($customComponents)) {
            throw new Exception("Template {$template->id} has no custom components defined");
        }

        // Validate each component has required fields
        foreach ($customComponents as $component) {
            // Template can have either 'rate' or 'amount' field, or be a formula type
            if (!isset($component['name']) || !isset($component['type'])) {
                Log::warning("Invalid custom component structure - missing name or type", [
                    'component' => $component,
                    'template_id' => $template->id
                ]);
                throw new Exception("Template {$template->id} has invalid custom component structure");
            }

            // For non-formula types, require rate or amount
            if (
                $component['type'] !== 'formula' &&
                !isset($component['rate']) && !isset($component['amount'])
            ) {
                Log::warning("Invalid custom component structure - missing rate/amount for non-formula", [
                    'component' => $component,
                    'template_id' => $template->id
                ]);
                throw new Exception("Template {$template->id} has invalid custom component structure");
            }
        }

        // Check statutory_components (already cast as array in model)
        $statutoryComponents = $template->statutory_components;

        if (empty($statutoryComponents)) {
            throw new Exception("Template {$template->id} has no statutory components defined");
        }

        Log::info("Template validation passed", [
            'template_id' => $template->id,
            'custom_components_count' => count($customComponents),
            'statutory_components_count' => count($statutoryComponents)
        ]);
    }

    /**
     * Extract custom components from template JSON and convert annual to monthly rates
     * 
     * @param InvoiceTemplate $template
     * @return array
     */
    private function extractCustomComponents(InvoiceTemplate $template): array
    {
        $customComponents = $template->custom_components; // Already cast as array

        $components = [];

        foreach ($customComponents as $component) {
            // Convert component name to key format (e.g., "BASIC ALLOWANCE" -> "basic_allowance")
            $key = strtolower(str_replace([' ', '-'], '_', $component['name']));

            // Check if this component uses a formula
            if (isset($component['calculation_type']) && $component['calculation_type'] === 'formula' && isset($component['formula'])) {
                // Store formula-based component for later calculation
                $components[$key] = [
                    'name' => $component['name'],
                    'rate' => 0, // Will be calculated from formula
                    'annual_rate' => 0,
                    'type' => $component['type'],
                    'id' => $component['id'] ?? null,
                    'calculation_type' => 'formula',
                    'formula' => $component['formula'],
                    'components' => $component['components'] ?? []
                ];
            } else {
                // Handle both 'rate' and 'amount' fields
                $annualRate = floatval($component['rate'] ?? $component['amount'] ?? 0);
                $monthlyRate = $this->convertAnnualToMonthly($annualRate, $template->annual_division_factor ?? 12);

                $components[$key] = [
                    'name' => $component['name'],
                    'rate' => $monthlyRate, // Use monthly rate for calculations
                    'annual_rate' => $annualRate, // Keep original annual rate for reference
                    'type' => $component['type'],
                    'id' => $component['id'] ?? null,
                    'calculation_type' => 'fixed'
                ];
            }
        }

        // Calculate formula-based components after all fixed components are processed
        $components = $this->calculateFormulaComponents($components);

        return $components;
    }

    /**
     * Calculate formula-based components using other component values
     * 
     * @param array $components
     * @return array
     */
    private function calculateFormulaComponents(array $components): array
    {
        $maxIterations = 5; // Prevent infinite loops
        $iteration = 0;

        do {
            $formulasCalculated = 0;
            $iteration++;

            foreach ($components as $key => &$component) {
                if (
                    isset($component['calculation_type']) &&
                    $component['calculation_type'] === 'formula' &&
                    $component['rate'] == 0
                ) {

                    $calculatedRate = $this->evaluateFormula($component['formula'], $components);

                    if ($calculatedRate !== false) {
                        $component['rate'] = $calculatedRate;
                        $component['annual_rate'] = $calculatedRate * 12; // Convert monthly back to annual for consistency
                        $formulasCalculated++;

                        Log::info("Formula calculated for component", [
                            'component' => $component['name'],
                            'formula' => $component['formula'],
                            'calculated_rate' => $calculatedRate
                        ]);
                    }
                }
            }
        } while ($formulasCalculated > 0 && $iteration < $maxIterations);

        return $components;
    }

    /**
     * Evaluate a formula using component values
     * 
     * @param string $formula
     * @param array $components
     * @return float|false
     */
    private function evaluateFormula(string $formula, array $components, array $statutoryDeductions = []): float|false
    {
        try {
            $evaluableFormula = $formula;

            // Log formula evaluation for debugging
            Log::info("Starting formula evaluation", [
                'original_formula' => $formula
            ]);

            // Handle SUM() function - replace SUM(...) with just (...)
            $evaluableFormula = preg_replace('/SUM\s*\(\s*([^)]+)\s*\)/i', '($1)', $evaluableFormula);

            // Replace component names with their values (prioritize non-zero values)
            // Sort components to prioritize those with actual values over zero values
            $sortedComponents = $components;
            uasort($sortedComponents, function ($a, $b) {
                $valueA = isset($a['adjusted_amount']) ? $a['adjusted_amount'] : $a['rate'];
                $valueB = isset($b['adjusted_amount']) ? $b['adjusted_amount'] : $b['rate'];

                // Prioritize non-zero values
                if ($valueA > 0 && $valueB <= 0) return -1;
                if ($valueB > 0 && $valueA <= 0) return 1;
                return 0;
            });

            foreach ($sortedComponents as $name => $component) {
                $value = isset($component['adjusted_amount']) ? $component['adjusted_amount'] : $component['rate'];

                if ($value > 0 || (isset($component['adjusted_amount']) && $component['adjusted_amount'] >= 0)) {
                    // Try exact name matches first, then variations
                    $patterns = [
                        '/\b' . preg_quote($component['name'], '/') . '\b/',  // Exact case-sensitive match first
                        '/\b' . preg_quote($component['name'], '/') . '\b/i', // Case-insensitive exact match
                        '/\b' . preg_quote($name, '/') . '\b/i',
                        '/\b' . preg_quote(str_replace('_', ' ', $name), '/') . '\b/i',
                        '/\b' . preg_quote(ucwords(str_replace('_', ' ', $name)), '/') . '\b/i'
                    ];

                    foreach ($patterns as $pattern) {
                        $beforeReplacement = $evaluableFormula;
                        $evaluableFormula = preg_replace($pattern, (string)$value, $evaluableFormula);

                        // If replacement happened, break to avoid double replacement
                        if ($beforeReplacement !== $evaluableFormula) {
                            break;
                        }
                    }
                }
            }

            // Replace statutory deduction names with their values
            foreach ($statutoryDeductions as $name => $value) {
                $patterns = [
                    '/\b' . preg_quote(strtoupper($name), '/') . '\b/i',
                    '/\b' . preg_quote($name, '/') . '\b/i',
                    '/\b' . preg_quote(str_replace('_', ' ', strtoupper($name)), '/') . '\b/i'
                ];

                foreach ($patterns as $pattern) {
                    $evaluableFormula = preg_replace($pattern, (string)$value, $evaluableFormula);
                }
            }

            // Handle percentage conversion (e.g., "10 * (" becomes "0.10 * (")
            $evaluableFormula = preg_replace_callback('/(\d{1,2}(?:\.\d+)?)\s*\*\s*\(/', function ($matches) {
                $number = floatval($matches[1]);
                if ($number > 0 && $number <= 100) {
                    return ($number / 100) . ' * (';
                }
                return $matches[0];
            }, $evaluableFormula);

            // Handle standalone percentages at start of formula
            $evaluableFormula = preg_replace_callback('/^(\d{1,2}(?:\.\d+)?)\s*\*/', function ($matches) {
                $number = floatval($matches[1]);
                if ($number > 0 && $number <= 100) {
                    return ($number / 100) . ' *';
                }
                return $matches[0];
            }, $evaluableFormula);

            // Basic safety check - only allow numbers, operators, and parentheses
            if (!preg_match('/^[\d\.\+\-\*\/\(\)\s]+$/', $evaluableFormula)) {
                Log::warning("Formula contains invalid characters", [
                    'original_formula' => $formula,
                    'evaluable_formula' => $evaluableFormula
                ]);
                return false;
            }

            // Check for unmatched parentheses
            $openParens = substr_count($evaluableFormula, '(');
            $closeParens = substr_count($evaluableFormula, ')');
            if ($openParens !== $closeParens) {
                Log::warning("Formula has unmatched parentheses", [
                    'formula' => $evaluableFormula
                ]);
                return false;
            }

            // Evaluate the formula
            $result = eval("return $evaluableFormula;");

            if (is_numeric($result)) {
                return floatval($result);
            }

            return false;
        } catch (Exception $e) {
            Log::error("Formula evaluation error", [
                'formula' => $formula,
                'evaluable_formula' => $evaluableFormula ?? 'N/A',
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Apply attendance factor to base components
     * 
     * @param array $baseComponents
     * @param float $attendanceFactor
     * @return array
     */
    private function applyAttendanceFactor(array $baseComponents, float $attendanceFactor): array
    {
        $adjustedComponents = [];

        foreach ($baseComponents as $key => $component) {
            $baseAmount = $component['rate'];
            $adjustedAmount = $baseAmount * $attendanceFactor;

            $adjustedComponents[$key] = [
                'name' => $component['name'],
                'base_amount' => round($baseAmount, 2),
                'adjusted_amount' => round($adjustedAmount, 2),
                'attendance_factor' => $attendanceFactor,
                'adjustment' => round($adjustedAmount - $baseAmount, 2),
                'type' => $component['type']
            ];
        }

        return $adjustedComponents;
    }

    /**
     * Calculate gross salary from adjusted components
     * 
     * @param array $adjustedComponents
     * @return float
     */
    private function calculateGrossSalary(array $adjustedComponents): float
    {
        $gross = 0;
        foreach ($adjustedComponents as $component) {
            $gross += $component['adjusted_amount'];
        }
        return $gross;
    }

    /**
     * Calculate statutory deductions from template
     * 
     * @param InvoiceTemplate $template
     * @param float $grossSalary
     * @param array $adjustedComponents
     * @param array $attendanceContext
     * @return array
     */
    private function calculateStatutoryDeductions(InvoiceTemplate $template, float $grossSalary, array $adjustedComponents, array $attendanceContext = []): array
    {
        $statutoryComponents = $template->statutory_components; // Already cast as array

        $deductions = [];

        foreach ($statutoryComponents as $key => $deduction) {
            // Skip if deduction is invalid or has no amount
            if (!isset($deduction['type']) || !isset($deduction['amount'])) {
                continue;
            }

            $amount = 0;

            switch ($deduction['type']) {
                case 'fixed':
                    // Convert annual fixed amount to monthly
                    $annualAmount = floatval($deduction['rate'] ?? $deduction['amount'] ?? 0);
                    $amount = $this->convertAnnualToMonthly($annualAmount, $template->annual_division_factor ?? 12);
                    break;

                case 'fixed_monthly':
                    // Monthly fixed amount (no conversion needed)
                    $amount = floatval($deduction['rate'] ?? $deduction['amount'] ?? 0);
                    break;

                case 'percentage':
                    // Percentages remain the same (they're applied to monthly gross)
                    $amount = ($grossSalary * floatval($deduction['rate'] ?? $deduction['amount'] ?? 0)) / 100;
                    break;

                case 'formula':
                    $amount = $this->calculateFormulaDeduction($deduction, $grossSalary, $adjustedComponents);
                    break;

                case 'prorated_annual':
                    $amount = $this->calculateProratedAnnualDeduction($deduction, $attendanceContext);
                    break;

                default:
                    Log::warning("Unknown deduction type: {$deduction['type']}", [
                        'template_id' => $template->id,
                        'deduction_key' => $key
                    ]);
                    break;
            }

            $deductions[$key] = round($amount, 2);
        }

        return $deductions;
    }

    /**
     * Calculate formula-based deductions
     * 
     * @param array $deduction
     * @param float $grossSalary
     * @param array $adjustedComponents
     * @return float
     */
    private function calculateFormulaDeduction(array $deduction, float $grossSalary, array $adjustedComponents): float
    {
        $amount = 0;

        // Check if there's a formula field to evaluate
        if (isset($deduction['formula']) && !empty($deduction['formula'])) {
            // Ensure GROSS_SALARY is available for formula evaluation (use the template's naming convention)
            $componentsWithGross = $adjustedComponents;

            // Only add if not already present with a proper value
            $hasValidGrossSalary = false;
            foreach ($componentsWithGross as $key => $component) {
                if (
                    isset($component['name']) && strtoupper($component['name']) === 'GROSS_SALARY' &&
                    isset($component['adjusted_amount']) && $component['adjusted_amount'] > 0
                ) {
                    $hasValidGrossSalary = true;
                    break;
                }
            }

            if (!$hasValidGrossSalary) {
                $componentsWithGross['GROSS_SALARY'] = [
                    'name' => 'GROSS_SALARY',
                    'adjusted_amount' => $grossSalary,
                    'rate' => $grossSalary
                ];
            }

            // Use the formula with adjusted components (monthly amounts)
            $amount = $this->evaluateFormula($deduction['formula'], $componentsWithGross);

            return $amount !== false ? $amount : 0;
        }

        // Handle pension calculation (8% of basic + housing + transport)
        if (isset($deduction['components']) && is_array($deduction['components'])) {
            $pensionableAmount = 0;

            foreach ($deduction['components'] as $component) {
                // Check if this is a gross salary calculation component
                if (isset($component['id']) && $component['id'] === 'gross_salary') {
                    $pensionableAmount += $grossSalary;
                } else {
                    // Find matching component by ID or name
                    foreach ($adjustedComponents as $adjComponent) {
                        $componentName = $component['name'] ?? $component['originalName'] ?? '';
                        if (strpos(strtolower($adjComponent['name']), strtolower($componentName)) !== false) {
                            $pensionableAmount += $adjComponent['adjusted_amount'];
                            break;
                        }
                    }
                }
            }

            $amount = ($pensionableAmount * floatval($deduction['rate'])) / 100;
        } else {
            // Fallback to percentage of gross
            $amount = ($grossSalary * floatval($deduction['rate'])) / 100;
        }

        return $amount;
    }

    /**
     * Check if template exists for client and pay grade structure
     * 
     * @param int $clientId
     * @param int $payGradeStructureId
     * @return bool
     */
    public function templateExists(int $clientId, int $payGradeStructureId): bool
    {
        return InvoiceTemplate::where('client_id', $clientId)
            ->where('pay_grade_structure_id', $payGradeStructureId)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Get template coverage for client
     * 
     * @param int $clientId
     * @return array
     */
    public function getTemplateCoverage(int $clientId): array
    {
        // Get all pay grade structures used by client staff
        $clientPayGrades = Staff::where('client_id', $clientId)
            ->distinct()
            ->pluck('pay_grade_structure_id')
            ->filter();

        $coverage = [];
        foreach ($clientPayGrades as $payGradeId) {
            $hasTemplate = $this->templateExists($clientId, $payGradeId);
            $coverage[] = [
                'pay_grade_structure_id' => $payGradeId,
                'has_template' => $hasTemplate,
                'template_id' => $hasTemplate ?
                    InvoiceTemplate::where('client_id', $clientId)
                    ->where('pay_grade_structure_id', $payGradeId)
                    ->where('is_active', true)
                    ->value('id') : null
            ];
        }

        return $coverage;
    }

    /**
     * Calculate prorated annual deductions based on attendance
     * 
     * @param array $deduction
     * @param array $attendanceContext
     * @return float
     */
    private function calculateProratedAnnualDeduction(array $deduction, array $attendanceContext): float
    {
        $annualAmount = floatval($deduction['rate']);
        $monthlyMaxAmount = $annualAmount / 12; // Always divide annual amounts by 12

        // Check if we have attendance context for proration
        if (empty($attendanceContext) || !isset($attendanceContext['days_worked']) || !isset($attendanceContext['total_days'])) {
            // Fallback to full monthly amount if no attendance data
            Log::warning("No attendance context provided for prorated_annual deduction, using full monthly amount", [
                'deduction_name' => $deduction['name'],
                'annual_amount' => $annualAmount,
                'monthly_fallback' => $monthlyMaxAmount
            ]);
            return $monthlyMaxAmount;
        }

        $daysWorked = floatval($attendanceContext['days_worked']);
        $totalDays = floatval($attendanceContext['total_days']);

        if ($totalDays <= 0) {
            Log::warning("Invalid total_days for proration, using full monthly amount", [
                'deduction_name' => $deduction['name'],
                'total_days' => $totalDays
            ]);
            return $monthlyMaxAmount;
        }

        // Calculate proration factor
        $prorationFactor = min($daysWorked / $totalDays, 1.0); // Cap at 100%

        // Calculate prorated amount
        $proratedAmount = $monthlyMaxAmount * $prorationFactor;

        Log::info("Calculated prorated annual deduction", [
            'deduction_name' => $deduction['name'],
            'annual_amount' => $annualAmount,
            'monthly_max' => $monthlyMaxAmount,
            'days_worked' => $daysWorked,
            'total_days' => $totalDays,
            'proration_factor' => $prorationFactor,
            'prorated_amount' => $proratedAmount
        ]);

        return $proratedAmount;
    }

    /**
     * Convert annual rate to monthly rate
     * 
     * @param float $annualRate
     * @param float $divisionFactor
     * @return float
     */
    private function convertAnnualToMonthly(float $annualRate, float $divisionFactor = 12): float
    {
        return $annualRate / $divisionFactor;
    }

    /**
     * Recalculate aggregate formulas after statutory deductions are known
     */
    private function recalculateAggregateFormulas(array $adjustedComponents, float $grossSalary, array $statutoryDeductions, InvoiceTemplate $template): array
    {
        // Add gross salary to components for formula calculation
        if (isset($adjustedComponents['gross_salary'])) {
            $adjustedComponents['gross_salary']['adjusted_amount'] = $grossSalary;
        }

        // Calculate aggregate formulas with all available data
        $maxIterations = 3;
        $iteration = 0;

        do {
            $formulasCalculated = 0;
            $iteration++;

            foreach ($adjustedComponents as $key => &$component) {
                if (isset($component['type']) && $component['type'] === 'formula') {

                    // Get the formula from the current template (dynamic - passed as parameter)
                    $formula = $this->getComponentFormula($template, $key);

                    if ($formula) {
                        $calculatedValue = $this->evaluateFormula($formula, $adjustedComponents, $statutoryDeductions);

                        if ($calculatedValue !== false) {
                            $component['adjusted_amount'] = $calculatedValue;
                            $formulasCalculated++;

                            Log::info("Recalculated aggregate formula", [
                                'component' => $key,
                                'formula' => $formula,
                                'value' => $calculatedValue
                            ]);
                        }
                    }
                }
            }
        } while ($formulasCalculated > 0 && $iteration < $maxIterations);

        return $adjustedComponents;
    }

    /**
     * Get formula for a specific component from template
     */
    private function getComponentFormula(InvoiceTemplate $template, string $componentKey): ?string
    {
        foreach ($template->custom_components as $component) {
            $key = strtolower(str_replace([' ', '-'], '_', $component['name']));
            if ($key === $componentKey && isset($component['formula'])) {
                return $component['formula'];
            }
        }
        return null;
    }
}
