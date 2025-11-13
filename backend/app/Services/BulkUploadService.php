<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\CalculationTemplate;
use App\Models\ExportTemplate;
use App\Models\Client;

class BulkUploadService
{
    private SafeFormulaCalculator $formulaCalculator;
    private TemplateFormulaConverter $formulaConverter;

    public function __construct(
        SafeFormulaCalculator $formulaCalculator,
        TemplateFormulaConverter $formulaConverter
    ) {
        $this->formulaCalculator = $formulaCalculator;
        $this->formulaConverter = $formulaConverter;
    }

    /**
     * Process bulk calculation template upload
     */
    public function processCalculationTemplateUpload(UploadedFile $file, array $options = []): array
    {
        try {
            // Validate file
            $fileValidation = $this->validateUploadFile($file, ['csv', 'xlsx', 'xls']);
            if (!$fileValidation['valid']) {
                return $fileValidation;
            }

            // Parse file data
            $data = $this->parseFile($file);
            if (!$data['success']) {
                return $data;
            }

            // Validate data structure
            $validation = $this->validateCalculationTemplateData($data['data']);
            if (!$validation['valid']) {
                return $validation;
            }

            // Process templates with rollback capability
            return $this->processCalculationTemplates($validation['data'], $options);
        } catch (\Exception $e) {
            Log::error('Bulk calculation template upload failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Upload processing failed',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process bulk export template upload
     */
    public function processExportTemplateUpload(UploadedFile $file, array $options = []): array
    {
        try {
            // Validate file
            $fileValidation = $this->validateUploadFile($file, ['csv', 'xlsx', 'xls']);
            if (!$fileValidation['valid']) {
                return $fileValidation;
            }

            // Parse file data
            $data = $this->parseFile($file);
            if (!$data['success']) {
                return $data;
            }

            // Validate data structure
            $validation = $this->validateExportTemplateData($data['data']);
            if (!$validation['valid']) {
                return $validation;
            }

            // Process templates with rollback capability
            return $this->processExportTemplates($validation['data'], $options);
        } catch (\Exception $e) {
            Log::error('Bulk export template upload failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Upload processing failed',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Process bulk employee data upload for payroll calculation
     */
    public function processEmployeeDataUpload(UploadedFile $file, int $calculationTemplateId, array $options = []): array
    {
        try {
            // Validate file
            $fileValidation = $this->validateUploadFile($file, ['csv', 'xlsx', 'xls']);
            if (!$fileValidation['valid']) {
                return $fileValidation;
            }

            // Get calculation template
            $template = CalculationTemplate::find($calculationTemplateId);
            if (!$template) {
                return [
                    'success' => false,
                    'message' => 'Calculation template not found',
                    'errors' => ['template' => 'Invalid calculation template ID']
                ];
            }

            // Parse file data
            $data = $this->parseFile($file);
            if (!$data['success']) {
                return $data;
            }

            // Validate employee data structure
            $validation = $this->validateEmployeeData($data['data']);
            if (!$validation['valid']) {
                return $validation;
            }

            // Process payroll calculations
            return $this->processPayrollCalculations($template, $validation['data'], $options);
        } catch (\Exception $e) {
            Log::error('Bulk employee data upload failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Upload processing failed',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate uploaded file
     */
    private function validateUploadFile(UploadedFile $file, array $allowedExtensions): array
    {
        $validator = Validator::make([
            'file' => $file
        ], [
            'file' => 'required|file|max:10240|mimes:' . implode(',', $allowedExtensions)
        ]);

        if ($validator->fails()) {
            return [
                'success' => false,
                'valid' => false,
                'message' => 'File validation failed',
                'errors' => $validator->errors()->toArray()
            ];
        }

        return ['valid' => true];
    }

    /**
     * Parse file data (CSV/Excel)
     */
    private function parseFile(UploadedFile $file): array
    {
        try {
            $extension = $file->getClientOriginalExtension();

            if ($extension === 'csv') {
                return $this->parseCsvFile($file);
            } else {
                return $this->parseExcelFile($file);
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'File parsing failed',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Parse CSV file
     */
    private function parseCsvFile(UploadedFile $file): array
    {
        $data = [];
        $headers = [];
        $rowIndex = 0;

        if (($handle = fopen($file->getPathname(), 'r')) !== false) {
            while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                if ($rowIndex === 0) {
                    $headers = array_map('trim', $row);
                } else {
                    $rowData = array_combine($headers, array_map('trim', $row));
                    if (array_filter($rowData)) { // Skip empty rows
                        $data[] = $rowData;
                    }
                }
                $rowIndex++;
            }
            fclose($handle);
        }

        return [
            'success' => true,
            'data' => $data,
            'headers' => $headers,
            'row_count' => count($data)
        ];
    }

    /**
     * Parse Excel file
     */
    private function parseExcelFile(UploadedFile $file): array
    {
        $data = Excel::toArray([], $file);

        if (empty($data) || empty($data[0])) {
            return [
                'success' => false,
                'message' => 'Excel file is empty or invalid'
            ];
        }

        $rows = $data[0]; // First sheet
        $headers = array_map('trim', array_shift($rows)); // First row as headers

        $processedData = [];
        foreach ($rows as $row) {
            $rowData = array_combine($headers, array_map('trim', $row));
            if (array_filter($rowData)) { // Skip empty rows
                $processedData[] = $rowData;
            }
        }

        return [
            'success' => true,
            'data' => $processedData,
            'headers' => $headers,
            'row_count' => count($processedData)
        ];
    }

    /**
     * Validate calculation template data structure
     */
    private function validateCalculationTemplateData(array $data): array
    {
        $errors = [];
        $validData = [];
        $requiredFields = ['name', 'grade', 'description', 'formulas'];

        foreach ($data as $index => $row) {
            $rowErrors = [];

            // Check required fields
            foreach ($requiredFields as $field) {
                if (empty($row[$field])) {
                    $rowErrors[] = "Missing required field: {$field}";
                }
            }

            // Validate formulas JSON
            if (!empty($row['formulas'])) {
                $formulas = json_decode($row['formulas'], true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $rowErrors[] = "Invalid JSON format in formulas field";
                } else {
                    // Validate each formula
                    foreach ($formulas as $field => $formula) {
                        try {
                            // Test formula syntax
                            $this->formulaCalculator->validateFormula($formula);
                        } catch (\Exception $e) {
                            $rowErrors[] = "Invalid formula for {$field}: " . $e->getMessage();
                        }
                    }
                }
            }

            if (empty($rowErrors)) {
                $validData[] = $row;
            } else {
                $errors["row_" . ($index + 1)] = $rowErrors;
            }
        }

        return [
            'valid' => empty($errors),
            'data' => $validData,
            'errors' => $errors,
            'total_rows' => count($data),
            'valid_rows' => count($validData)
        ];
    }

    /**
     * Validate export template data structure
     */
    private function validateExportTemplateData(array $data): array
    {
        $errors = [];
        $validData = [];
        $requiredFields = ['client_id', 'name', 'format', 'column_mappings', 'formatting_rules'];

        foreach ($data as $index => $row) {
            $rowErrors = [];

            // Check required fields
            foreach ($requiredFields as $field) {
                if (empty($row[$field])) {
                    $rowErrors[] = "Missing required field: {$field}";
                }
            }

            // Validate client exists
            if (!empty($row['client_id'])) {
                if (!Client::find($row['client_id'])) {
                    $rowErrors[] = "Client ID {$row['client_id']} not found";
                }
            }

            // Validate format
            if (!empty($row['format']) && !in_array($row['format'], ['excel', 'pdf', 'csv', 'json'])) {
                $rowErrors[] = "Invalid format: {$row['format']}";
            }

            // Validate JSON fields
            foreach (['column_mappings', 'formatting_rules', 'grouping_rules'] as $jsonField) {
                if (!empty($row[$jsonField])) {
                    $decoded = json_decode($row[$jsonField], true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        $rowErrors[] = "Invalid JSON format in {$jsonField} field";
                    }
                }
            }

            if (empty($rowErrors)) {
                $validData[] = $row;
            } else {
                $errors["row_" . ($index + 1)] = $rowErrors;
            }
        }

        return [
            'valid' => empty($errors),
            'data' => $validData,
            'errors' => $errors,
            'total_rows' => count($data),
            'valid_rows' => count($validData)
        ];
    }

    /**
     * Validate employee data structure
     */
    private function validateEmployeeData(array $data): array
    {
        $errors = [];
        $validData = [];
        $requiredFields = ['employee_id', 'employee_name', 'grade', 'basic_salary'];

        foreach ($data as $index => $row) {
            $rowErrors = [];

            // Check required fields
            foreach ($requiredFields as $field) {
                if (empty($row[$field])) {
                    $rowErrors[] = "Missing required field: {$field}";
                }
            }

            // Validate numeric fields
            if (!empty($row['basic_salary']) && !is_numeric($row['basic_salary'])) {
                $rowErrors[] = "Basic salary must be numeric";
            }

            // Validate employee_id uniqueness within the batch
            $duplicateCheck = array_filter($validData, function ($item) use ($row) {
                return $item['employee_id'] === $row['employee_id'];
            });

            if (!empty($duplicateCheck)) {
                $rowErrors[] = "Duplicate employee_id: {$row['employee_id']}";
            }

            if (empty($rowErrors)) {
                $validData[] = $row;
            } else {
                $errors["row_" . ($index + 1)] = $rowErrors;
            }
        }

        return [
            'valid' => empty($errors),
            'data' => $validData,
            'errors' => $errors,
            'total_rows' => count($data),
            'valid_rows' => count($validData)
        ];
    }

    /**
     * Process calculation templates with rollback capability
     */
    private function processCalculationTemplates(array $data, array $options): array
    {
        $created = [];
        $errors = [];
        $dryRun = $options['dry_run'] ?? false;

        try {
            foreach ($data as $index => $templateData) {
                try {
                    if (!$dryRun) {
                        $template = CalculationTemplate::create([
                            'name' => $templateData['name'],
                            'grade' => $templateData['grade'],
                            'description' => $templateData['description'],
                            'formulas' => json_decode($templateData['formulas'], true),
                            'version' => $templateData['version'] ?? '1.0',
                            'is_active' => $templateData['is_active'] ?? true,
                            'created_by' => $templateData['created_by'] ?? 'bulk_upload'
                        ]);
                        $created[] = $template;
                    }
                } catch (\Exception $e) {
                    $errors["row_" . ($index + 1)] = $e->getMessage();

                    // Rollback on error
                    if (!$dryRun) {
                        foreach ($created as $createdTemplate) {
                            $createdTemplate->delete();
                        }
                        throw $e;
                    }
                }
            }

            return [
                'success' => true,
                'created_count' => count($created),
                'created_templates' => $created,
                'errors' => $errors,
                'dry_run' => $dryRun
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Bulk creation failed',
                'error' => $e->getMessage(),
                'created_before_error' => count($created),
                'errors' => $errors
            ];
        }
    }

    /**
     * Process export templates with rollback capability
     */
    private function processExportTemplates(array $data, array $options): array
    {
        $created = [];
        $errors = [];
        $dryRun = $options['dry_run'] ?? false;

        try {
            foreach ($data as $index => $templateData) {
                try {
                    if (!$dryRun) {
                        $template = ExportTemplate::create([
                            'client_id' => $templateData['client_id'],
                            'name' => $templateData['name'],
                            'description' => $templateData['description'] ?? null,
                            'format' => $templateData['format'],
                            'column_mappings' => json_decode($templateData['column_mappings'], true),
                            'formatting_rules' => json_decode($templateData['formatting_rules'], true),
                            'grouping_rules' => !empty($templateData['grouping_rules']) ? json_decode($templateData['grouping_rules'], true) : null,
                            'version' => $templateData['version'] ?? '1.0',
                            'is_active' => $templateData['is_active'] ?? true,
                            'created_by' => $templateData['created_by'] ?? 'bulk_upload'
                        ]);
                        $created[] = $template;
                    }
                } catch (\Exception $e) {
                    $errors["row_" . ($index + 1)] = $e->getMessage();

                    // Rollback on error
                    if (!$dryRun) {
                        foreach ($created as $createdTemplate) {
                            $createdTemplate->delete();
                        }
                        throw $e;
                    }
                }
            }

            return [
                'success' => true,
                'created_count' => count($created),
                'created_templates' => $created,
                'errors' => $errors,
                'dry_run' => $dryRun
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Bulk creation failed',
                'error' => $e->getMessage(),
                'created_before_error' => count($created),
                'errors' => $errors
            ];
        }
    }

    /**
     * Process payroll calculations
     */
    private function processPayrollCalculations(CalculationTemplate $template, array $employeeData, array $options): array
    {
        $results = [];
        $errors = [];

        foreach ($employeeData as $index => $employee) {
            try {
                $variables = [
                    'basic_salary' => (float) $employee['basic_salary'],
                    'employee_id' => $employee['employee_id'],
                    'employee_name' => $employee['employee_name'],
                    'grade' => $employee['grade'],
                ];

                $calculations = [];

                foreach ($template->formulas as $field => $formula) {
                    try {
                        // Check if the formula is just a number (fixed amount)
                        if (is_numeric($formula)) {
                            $result = (float) $formula;
                        } else {
                            $result = $this->formulaCalculator->evaluate($formula, $variables);
                        }
                        $calculations[$field] = $result;
                        $variables[$field] = $result; // Make available for subsequent calculations
                    } catch (\Exception $e) {
                        $errors["row_" . ($index + 1)][] = "Error calculating {$field}: " . $e->getMessage();
                        $calculations[$field] = 0;
                    }
                }

                $results[] = array_merge($employee, $calculations);
            } catch (\Exception $e) {
                $errors["row_" . ($index + 1)][] = $e->getMessage();
            }
        }

        return [
            'success' => empty($errors),
            'data' => $results,
            'errors' => $errors,
            'template_used' => $template->name,
            'processed_count' => count($results)
        ];
    }

    /**
     * Generate sample template files
     */
    public function generateSampleFiles(): array
    {
        return [
            'calculation_template' => [
                'filename' => 'calculation_template_sample.csv',
                'headers' => ['name', 'grade', 'description', 'formulas', 'version', 'is_active'],
                'sample_data' => [
                    [
                        'name' => 'Grade A Template',
                        'grade' => 'A',
                        'description' => 'Calculation template for Grade A employees',
                        'formulas' => '{"allowance": "basic_salary * 0.2", "gross_salary": "basic_salary + allowance", "tax": "gross_salary * 0.1", "net_salary": "gross_salary - tax"}',
                        'version' => '1.0',
                        'is_active' => 'true'
                    ]
                ]
            ],
            'export_template' => [
                'filename' => 'export_template_sample.csv',
                'headers' => ['client_id', 'name', 'format', 'column_mappings', 'formatting_rules', 'description'],
                'sample_data' => [
                    [
                        'client_id' => '1',
                        'name' => 'Standard Excel Export',
                        'format' => 'excel',
                        'column_mappings' => '{"employee_id": {"label": "Employee ID", "type": "text"}, "employee_name": {"label": "Name", "type": "text"}, "net_salary": {"label": "Net Salary", "type": "currency"}}',
                        'formatting_rules' => '{"number_format": "0.00", "currency_symbol": "$"}',
                        'description' => 'Standard export format for client reports'
                    ]
                ]
            ],
            'employee_data' => [
                'filename' => 'employee_data_sample.csv',
                'headers' => ['employee_id', 'employee_name', 'grade', 'basic_salary'],
                'sample_data' => [
                    [
                        'employee_id' => 'EMP001',
                        'employee_name' => 'John Doe',
                        'grade' => 'A',
                        'basic_salary' => '50000'
                    ],
                    [
                        'employee_id' => 'EMP002',
                        'employee_name' => 'Jane Smith',
                        'grade' => 'B',
                        'basic_salary' => '45000'
                    ]
                ]
            ]
        ];
    }
}
