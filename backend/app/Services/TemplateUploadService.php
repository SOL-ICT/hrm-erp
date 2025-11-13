<?php

namespace App\Services;

use App\Models\CalculationTemplate;
use App\Models\Client;
use App\Services\SafeFormulaCalculator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TemplateUploadService
{
    private SafeFormulaCalculator $calculator;
    private array $validComponentTypes = [
        'basic_salary',
        'allowance',
        'deduction',
        'overtime',
        'bonus',
        'tax',
        'contribution'
    ];

    public function __construct()
    {
        $this->calculator = new SafeFormulaCalculator();
    }

    public function processExcelFile(string $filePath, array $options = []): array
    {
        $validateOnly = $options['validate_only'] ?? false;
        $dryRun = $options['dry_run'] ?? false;
        $progressCallback = $options['progress_callback'] ?? null;

        $result = [
            'success' => true,
            'processed' => 0,
            'failed' => 0,
            'warnings' => 0,
            'errors' => [],
            'warnings_list' => [],
            'created_templates' => []
        ];

        try {
            // Load Excel file
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();

            // Parse templates from Excel
            $templates = $this->parseTemplatesFromWorksheet($worksheet);

            Log::info("TemplateUpload: Found " . count($templates) . " templates in Excel file");

            if (empty($templates)) {
                $result['errors'][] = "No valid templates found in Excel file";
                $result['success'] = false;
                return $result;
            }

            // Process each template
            $current = 0;
            foreach ($templates as $templateData) {
                $current++;

                if ($progressCallback) {
                    $progressCallback($current, count($templates), $templateData['name'] ?? 'Unknown');
                }

                try {
                    // Validate template data
                    $validation = $this->validateTemplateData($templateData);

                    if (!$validation['valid']) {
                        $result['errors'][] = "Template '{$templateData['name']}': " . implode(', ', $validation['errors']);
                        $result['failed']++;
                        continue;
                    }

                    if (!empty($validation['warnings'])) {
                        $result['warnings_list'] = array_merge($result['warnings_list'], $validation['warnings']);
                        $result['warnings'] += count($validation['warnings']);
                    }

                    // Skip creation if validation-only mode
                    if ($validateOnly) {
                        $result['processed']++;
                        continue;
                    }

                    // Create template (with dry-run support)
                    if (!$dryRun) {
                        $template = $this->createCalculationTemplate($templateData);
                        $result['created_templates'][] = [
                            'id' => $template->id,
                            'name' => $template->name,
                            'client_name' => $template->client->name ?? 'Unknown'
                        ];
                    }

                    $result['processed']++;
                } catch (\Exception $e) {
                    $result['errors'][] = "Template '{$templateData['name']}': " . $e->getMessage();
                    $result['failed']++;
                    Log::error("TemplateUpload: Failed to process template", [
                        'template' => $templateData['name'] ?? 'Unknown',
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }
        } catch (\Exception $e) {
            $result['errors'][] = "Failed to process Excel file: " . $e->getMessage();
            $result['success'] = false;
            Log::error("TemplateUpload: Excel processing failed", [
                'file' => $filePath,
                'error' => $e->getMessage()
            ]);
        }

        return $result;
    }

    private function parseTemplatesFromWorksheet(Worksheet $worksheet): array
    {
        $templates = [];
        $highestRow = $worksheet->getHighestRow();
        $highestColumn = $worksheet->getHighestColumn();

        Log::info("TemplateUpload: Parsing worksheet", [
            'rows' => $highestRow,
            'columns' => $highestColumn
        ]);

        // Detect format and parse accordingly
        $format = $this->detectExcelFormat($worksheet);

        switch ($format) {
            case 'template_per_row':
                $templates = $this->parseTemplatePerRowFormat($worksheet);
                break;
            case 'template_per_sheet':
                $templates = $this->parseTemplatePerSheetFormat($worksheet);
                break;
            case 'component_matrix':
                $templates = $this->parseComponentMatrixFormat($worksheet);
                break;
            default:
                throw new \Exception("Unsupported Excel format detected");
        }

        return $templates;
    }

    private function detectExcelFormat(Worksheet $worksheet): string
    {
        // Check first row for headers to determine format
        $firstRow = [];
        $highestColumn = $worksheet->getHighestColumn();

        for ($col = 'A'; $col <= $highestColumn; $col++) {
            $firstRow[] = strtolower(trim($worksheet->getCell($col . '1')->getValue() ?? ''));
        }

        // Template per row format (most common)
        if (in_array('template_name', $firstRow) && in_array('client_name', $firstRow)) {
            return 'template_per_row';
        }

        // Component matrix format
        if (in_array('component_name', $firstRow) && in_array('component_type', $firstRow)) {
            return 'component_matrix';
        }

        // Default to template per sheet
        return 'template_per_sheet';
    }

    private function parseTemplatePerRowFormat(Worksheet $worksheet): array
    {
        $templates = [];
        $headers = [];
        $highestRow = $worksheet->getHighestRow();
        $highestColumn = $worksheet->getHighestColumn();

        // Get headers from first row
        for ($col = 'A'; $col <= $highestColumn; $col++) {
            $headers[$col] = strtolower(trim($worksheet->getCell($col . '1')->getValue() ?? ''));
        }

        // Find required columns
        $requiredColumns = [
            'template_name' => null,
            'client_name' => null,
            'pay_grade_code' => null,
            'description' => null
        ];

        foreach ($headers as $col => $header) {
            foreach ($requiredColumns as $required => $value) {
                if (str_contains($header, $required) || str_contains($header, str_replace('_', ' ', $required))) {
                    $requiredColumns[$required] = $col;
                }
            }
        }

        // Check if we have minimum required columns
        if (!$requiredColumns['template_name'] || !$requiredColumns['client_name']) {
            throw new \Exception("Required columns 'template_name' and 'client_name' not found");
        }

        // Parse each row as a template
        for ($row = 2; $row <= $highestRow; $row++) {
            $templateName = trim($worksheet->getCell($requiredColumns['template_name'] . $row)->getValue() ?? '');

            if (empty($templateName)) {
                continue; // Skip empty rows
            }

            $template = [
                'name' => $templateName,
                'client_name' => trim($worksheet->getCell($requiredColumns['client_name'] . $row)->getValue() ?? ''),
                'pay_grade_code' => $requiredColumns['pay_grade_code'] ?
                    trim($worksheet->getCell($requiredColumns['pay_grade_code'] . $row)->getValue() ?? '') :
                    'GRADE_' . $row,
                'description' => $requiredColumns['description'] ?
                    trim($worksheet->getCell($requiredColumns['description'] . $row)->getValue() ?? '') : '',
                'components' => [],
                'metadata' => [
                    'source' => 'excel_upload',
                    'row' => $row,
                    'uploaded_at' => now()->toISOString()
                ]
            ];

            // Parse components from remaining columns
            foreach ($headers as $col => $header) {
                if (!in_array($header, array_keys($requiredColumns)) && !empty($header)) {
                    $value = trim($worksheet->getCell($col . $row)->getValue() ?? '');

                    if (!empty($value)) {
                        $template['components'][] = $this->parseComponentFromCell($header, $value);
                    }
                }
            }

            $templates[] = $template;
        }

        return $templates;
    }

    private function parseTemplatePerSheetFormat(Worksheet $worksheet): array
    {
        // Implementation for single template per sheet
        // This format would have template metadata at the top and components below
        return [];
    }

    private function parseComponentMatrixFormat(Worksheet $worksheet): array
    {
        // Implementation for component matrix format
        // This format would have all components with their formulas in a matrix
        return [];
    }

    private function parseComponentFromCell(string $header, string $value): array
    {
        // Determine component type from header
        $componentType = $this->determineComponentType($header);

        // Parse value (could be amount, formula, or percentage)
        $parsedValue = $this->parseComponentValue($value);

        return [
            'name' => $this->normalizeComponentName($header),
            'display_name' => ucwords(str_replace('_', ' ', $header)),
            'type' => $componentType,
            'value_type' => $parsedValue['type'],
            'fixed_amount' => $parsedValue['type'] === 'fixed' ? $parsedValue['value'] : null,
            'percentage' => $parsedValue['type'] === 'percentage' ? $parsedValue['value'] : null,
            'formula' => $parsedValue['type'] === 'formula' ? $parsedValue['value'] : null,
            'is_taxable' => $this->isTaxableComponent($componentType),
            'metadata' => [
                'original_header' => $header,
                'original_value' => $value
            ]
        ];
    }

    private function determineComponentType(string $header): string
    {
        $header = strtolower($header);

        $typeMap = [
            'basic_salary' => ['basic', 'salary', 'base'],
            'allowance' => ['allowance', 'housing', 'transport', 'medical', 'education'],
            'deduction' => ['deduction', 'loan', 'advance'],
            'tax' => ['tax', 'income_tax', 'paye'],
            'contribution' => ['pension', 'nhis', 'nsitf', 'itf'],
            'bonus' => ['bonus', '13th_month', 'leave'],
            'overtime' => ['overtime', 'ot']
        ];

        foreach ($typeMap as $type => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($header, $keyword)) {
                    return $type;
                }
            }
        }

        return 'allowance'; // Default type
    }

    private function parseComponentValue(string $value): array
    {
        $value = trim($value);

        // Check if it's a percentage
        if (str_contains($value, '%')) {
            return [
                'type' => 'percentage',
                'value' => (float) str_replace('%', '', $value)
            ];
        }

        // Check if it's a formula (starts with =)
        if (str_starts_with($value, '=')) {
            return [
                'type' => 'formula',
                'value' => substr($value, 1) // Remove the = sign
            ];
        }

        // Check if it contains formula-like syntax
        if (preg_match('/[+\-*\/\(\)]/', $value) || str_contains($value, 'basic_salary')) {
            return [
                'type' => 'formula',
                'value' => $value
            ];
        }

        // Otherwise, treat as fixed amount
        return [
            'type' => 'fixed',
            'value' => (float) preg_replace('/[^\d.]/', '', $value)
        ];
    }

    private function normalizeComponentName(string $header): string
    {
        return strtolower(str_replace([' ', '-'], '_', trim($header)));
    }

    private function isTaxableComponent(string $type): bool
    {
        return in_array($type, ['basic_salary', 'allowance', 'bonus', 'overtime']);
    }

    private function validateTemplateData(array $templateData): array
    {
        $errors = [];
        $warnings = [];

        // Required fields validation
        if (empty($templateData['name'])) {
            $errors[] = "Template name is required";
        }

        if (empty($templateData['client_name'])) {
            $errors[] = "Client name is required";
        }

        if (empty($templateData['components'])) {
            $errors[] = "At least one component is required";
        }

        // Validate client exists or can be created
        if (!empty($templateData['client_name'])) {
            $client = Client::where('organisation_name', $templateData['client_name'])->first();
            if (!$client) {
                $warnings[] = "Client '{$templateData['client_name']}' will be created";
            }
        }

        // Validate components
        $hasBasicSalary = false;
        foreach ($templateData['components'] as $component) {
            if ($component['name'] === 'basic_salary') {
                $hasBasicSalary = true;
            }

            // Validate component type
            if (!in_array($component['type'], $this->validComponentTypes)) {
                $warnings[] = "Unknown component type: {$component['type']}";
            }

            // Validate formula if present
            if (!empty($component['formula'])) {
                try {
                    // Provide sample variables for validation
                    $sampleVariables = [
                        'basic_salary' => 100000,
                        'housing_allowance' => 20000,
                        'transport_allowance' => 10000,
                        'medical_allowance' => 5000,
                        'education_allowance' => 5000
                    ];
                    $this->calculator->evaluate($component['formula'], $sampleVariables);
                } catch (\Exception $e) {
                    $errors[] = "Invalid formula for {$component['name']}: " . $e->getMessage();
                }
            }
        }

        if (!$hasBasicSalary) {
            $warnings[] = "No basic_salary component found - this may cause calculation issues";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings
        ];
    }

    private function createCalculationTemplate(array $templateData): CalculationTemplate
    {
        return DB::transaction(function () use ($templateData) {
            // Get or create client
            $client = Client::firstOrCreate(
                ['organisation_name' => $templateData['client_name']],
                [
                    'description' => 'Auto-created during template upload',
                    'status' => 'active',
                    'slug' => \Illuminate\Support\Str::slug($templateData['client_name']),
                    'prefix' => strtoupper(substr($templateData['client_name'], 0, 3))
                ]
            );

            // Organize components by type for JSON storage
            $salaryComponents = [];
            $allowanceComponents = [];
            $deductionComponents = [];
            $statutoryComponents = [];

            foreach ($templateData['components'] as $component) {
                $componentData = [
                    'display_name' => $component['display_name'],
                    'value_type' => $component['value_type'],
                    'fixed_amount' => $component['fixed_amount'],
                    'percentage' => $component['percentage'],
                    'formula' => $component['formula'],
                    'is_taxable' => $component['is_taxable'],
                    'metadata' => $component['metadata'] ?? []
                ];

                // Categorize components based on type
                switch ($component['type']) {
                    case 'basic_salary':
                        $salaryComponents[$component['name']] = $componentData;
                        break;
                    case 'allowance':
                    case 'bonus':
                    case 'overtime':
                        $allowanceComponents[$component['name']] = $componentData;
                        break;
                    case 'deduction':
                        $deductionComponents[$component['name']] = $componentData;
                        break;
                    case 'tax':
                    case 'contribution':
                        $statutoryComponents[$component['name']] = $componentData;
                        break;
                    default:
                        // Default to allowance for unknown types
                        $allowanceComponents[$component['name']] = $componentData;
                }
            }

            // Create calculation template using existing structure
            $template = CalculationTemplate::create([
                'name' => $templateData['name'],
                'pay_grade_code' => $templateData['pay_grade_code'] ?? 'IMPORTED_' . time(),
                'description' => $templateData['description'] ?? 'Imported from Excel upload',
                'version' => '1.0',
                'salary_components' => $salaryComponents,
                'allowance_components' => $allowanceComponents,
                'deduction_components' => $deductionComponents,
                'statutory_components' => $statutoryComponents,
                'calculation_rules' => $templateData['calculation_rules'] ?? [],
                'annual_division_factor' => $templateData['annual_division_factor'] ?? 12.00,
                'attendance_calculation_method' => $templateData['attendance_calculation_method'] ?? 'working_days',
                'prorate_salary' => $templateData['prorate_salary'] ?? true,
                'minimum_attendance_factor' => $templateData['minimum_attendance_factor'] ?? 0.50,
                'is_active' => true,
                'is_default' => false,
                'created_by' => 'excel_upload',
                'updated_by' => null
            ]);

            Log::info("TemplateUpload: Created calculation template", [
                'template_id' => $template->id,
                'template_name' => $template->name,
                'client_name' => $client->name,
                'components_count' => count($templateData['components']),
                'salary_components' => count($salaryComponents),
                'allowance_components' => count($allowanceComponents),
                'deduction_components' => count($deductionComponents),
                'statutory_components' => count($statutoryComponents)
            ]);

            return $template;
        });
    }
}
