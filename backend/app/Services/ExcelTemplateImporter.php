<?php

namespace App\Services;

use App\Models\InvoiceTemplate;
use App\Models\Client;
use App\Models\PayGradeStructure;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

/**
 * Service for importing Excel templates and converting them to InvoiceTemplate format
 * 
 * This service handles:
 * - Parsing Excel files with payroll templates
 * - Identifying different sections (allowances, statutory deductions, etc.)
 * - Converting Excel formulas to template calculation format
 * - Extracting component definitions and relationships
 * - Validating template structure and completeness
 */
class ExcelTemplateImporter
{
    // Standard column headers we look for in Excel templates
    private const COMPONENT_HEADERS = [
        'component',
        'description',
        'amount',
        'rate',
        'percentage',
        'formula',
        'type'
    ];

    // Section identifiers for different parts of the template
    private const SECTION_IDENTIFIERS = [
        'allowances' => ['allowance', 'earning', 'basic', 'gross', 'salary', 'transport', 'housing', 'utility', 'medical', 'education'],
        'statutory' => ['tax', 'pension', 'nhis', 'itf', 'nsitf', 'deduction', 'paye', 'eca', 'statutory'],
        'management' => ['management', 'service', 'fee', 'mgt', 'vat'],
        'expenses' => ['expense', 'operational', 'fidelity', 'guarantee', 'insurance', 'background', 'check'],
        'summary' => ['total', 'net', 'summary', 'final']
    ];

    // Formula patterns for conversion
    private const FORMULA_PATTERNS = [
        '/=([A-Z]+[0-9]*)\*1(\s|$)/' => 'Basic_Salary',               // =B2*1 -> Basic_Salary (self-reference)
        '/=([A-Z]+[0-9]*)\*([0-9.]+)/' => '$1 * $2',                  // =B1*0.07 -> B1 * 0.07
        '/=([A-Z]+[0-9]*)\*([0-9.]+)%/' => '$1 * $2 / 100',          // =B1*7% -> B1 * 7 / 100
        '/=SUM\(([^)]+)\)/' => 'SUM($1)',                             // =SUM(B1:B10) -> SUM(B1:B10)
        '/=([A-Z]+[0-9]*)-([A-Z]+[0-9]*)/' => '$1 - $2',             // =B1-C1 -> B1 - C1
        '/=([A-Z]+[0-9]*)\+([A-Z]+[0-9]*)/' => '$1 + $2',            // =B1+C1 -> B1 + C1
        '/=GROSS_PAY\*([0-9.]+)/' => 'Gross_Salary * $1',             // =GROSS_PAY*0.07 -> Gross_Salary * 0.07
    ];

    private Spreadsheet $spreadsheet;
    private array $validationErrors = [];
    private array $validationWarnings = [];
    private array $extractedData = [];

    /**
     * Import an Excel template and create an InvoiceTemplate
     */
    public function importFromExcel(
        UploadedFile $file,
        int $clientId,
        int $payGradeStructureId,
        string $templateName,
        ?string $description = null,
        bool $setAsDefault = false
    ): array {
        try {
            Log::info("Starting Excel template import", [
                'filename' => $file->getClientOriginalName(),
                'client_id' => $clientId,
                'pay_grade_structure_id' => $payGradeStructureId
            ]);

            // Reset state
            $this->resetState();

            // Validate file
            $this->validateFile($file);
            if (!empty($this->validationErrors)) {
                return $this->buildErrorResponse('File validation failed');
            }

            // Parse Excel file
            $this->parseExcelFile($file);
            if (!empty($this->validationErrors)) {
                return $this->buildErrorResponse('Excel parsing failed');
            }

            // Extract components
            $this->extractComponents();
            if (!empty($this->validationErrors)) {
                return $this->buildErrorResponse('Component extraction failed');
            }

            // Validate template structure
            $this->validateTemplateStructure();
            if (!empty($this->validationErrors)) {
                return $this->buildErrorResponse('Template validation failed');
            }

            // Create the template
            $template = $this->createInvoiceTemplate(
                $clientId,
                $payGradeStructureId,
                $templateName,
                $description,
                $setAsDefault,
                $file->getClientOriginalName()
            );

            Log::info("Excel template import completed successfully", [
                'template_id' => $template->id,
                'filename' => $file->getClientOriginalName()
            ]);

            return [
                'success' => true,
                'template' => $template,
                'warnings' => $this->validationWarnings,
                'extracted_data' => $this->extractedData,
                'message' => 'Excel template imported successfully'
            ];
        } catch (\Exception $e) {
            Log::error("Excel template import failed", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Excel template import failed: ' . $e->getMessage(),
                'errors' => array_merge($this->validationErrors, [$e->getMessage()])
            ];
        }
    }

    /**
     * Parse and preview Excel template without saving
     */
    public function previewExcelTemplate(UploadedFile $file): array
    {
        try {
            $this->resetState();
            $this->validateFile($file);

            if (!empty($this->validationErrors)) {
                return $this->buildErrorResponse('File validation failed');
            }

            $this->parseExcelFile($file);
            if (!empty($this->validationErrors)) {
                return $this->buildErrorResponse('Excel parsing failed');
            }

            $this->extractComponents();
            $this->validateTemplateStructure();

            return [
                'success' => true,
                'preview_data' => $this->extractedData,
                'validation_errors' => $this->validationErrors,
                'validation_warnings' => $this->validationWarnings,
                'structure_analysis' => $this->analyzeTemplateStructure()
            ];
        } catch (\Exception $e) {
            Log::error("Excel template preview failed", [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Excel template preview failed: ' . $e->getMessage(),
                'errors' => array_merge($this->validationErrors, [$e->getMessage()])
            ];
        }
    }

    /**
     * Generate a sample Excel template for download
     */
    public function generateSampleTemplate(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Payroll Template');

        // Header
        $sheet->setCellValue('A1', 'SOL-ICT PAYROLL TEMPLATE');
        $sheet->mergeCells('A1:D1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);

        // Instructions
        $sheet->setCellValue('A3', 'Instructions:');
        $sheet->setCellValue('A4', '1. Enter component names in Column A');
        $sheet->setCellValue('A5', '2. Enter amounts/formulas in Column B');
        $sheet->setCellValue('A6', '3. Use formulas like =B8*0.07 for percentages');
        $sheet->setCellValue('A7', '4. Clearly separate sections (Allowances, Statutory, Management)');

        // Allowances Section
        $row = 9;
        $sheet->setCellValue("A{$row}", 'ALLOWANCES & EARNINGS');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        $allowances = [
            ['Basic Salary', '50000'],
            ['Transport Allowance', '15000'],
            ['Lunch Allowance', '10000'],
            ['Gross Salary', '=SUM(B10:B12)'],
        ];

        foreach ($allowances as $allowance) {
            $sheet->setCellValue("A{$row}", $allowance[0]);
            $sheet->setCellValue("B{$row}", $allowance[1]);
            $row++;
        }

        // Statutory Deductions
        $row += 2;
        $sheet->setCellValue("A{$row}", 'STATUTORY DEDUCTIONS');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        $statutory = [
            ['Pension (8%)', '=B13*0.08'],
            ['NHIS (1.75%)', '=B13*0.0175'],
            ['ITF (1%)', '=B13*0.01'],
            ['NSITF (1%)', '=B13*0.01'],
            ['PAYE Tax', '=B13*0.07'],
        ];

        foreach ($statutory as $deduction) {
            $sheet->setCellValue("A{$row}", $deduction[0]);
            $sheet->setCellValue("B{$row}", $deduction[1]);
            $row++;
        }

        // Management Fees
        $row += 2;
        $sheet->setCellValue("A{$row}", 'MANAGEMENT FEES');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        $management = [
            ['Management Fee (7%)', '=B13*0.07'],
            ['VAT on Mgt Fee (7.5%)', '=B' . ($row) . '*0.075'],
            ['WHT on Mgt Fee (5%)', '=B' . ($row) . '*0.05'],
        ];

        foreach ($management as $fee) {
            $sheet->setCellValue("A{$row}", $fee[0]);
            $sheet->setCellValue("B{$row}", $fee[1]);
            $row++;
        }

        // Summary
        $row += 2;
        $sheet->setCellValue("A{$row}", 'SUMMARY');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue("A{$row}", 'Total Deductions');
        $sheet->setCellValue("B{$row}", '=SUM(B16:B20)');
        $row++;
        $sheet->setCellValue("A{$row}", 'Net Salary');
        $sheet->setCellValue("B{$row}", '=B13-B' . ($row - 1));

        // Format columns
        $sheet->getColumnDimension('A')->setWidth(25);
        $sheet->getColumnDimension('B')->setWidth(15);

        return $spreadsheet;
    }

    /**
     * Reset internal state for new import
     */
    private function resetState(): void
    {
        $this->validationErrors = [];
        $this->validationWarnings = [];
        $this->extractedData = [];
    }

    /**
     * Validate uploaded Excel file
     */
    private function validateFile(UploadedFile $file): void
    {
        // Check file extension
        $allowedExtensions = ['xlsx', 'xls', 'csv'];
        $extension = strtolower($file->getClientOriginalExtension());

        if (!in_array($extension, $allowedExtensions)) {
            $this->validationErrors[] = "Invalid file type. Allowed: " . implode(', ', $allowedExtensions);
            return;
        }

        // Check file size (max 5MB)
        if ($file->getSize() > 5 * 1024 * 1024) {
            $this->validationErrors[] = "File size too large. Maximum 5MB allowed.";
            return;
        }

        // Try to load the file
        try {
            $reader = IOFactory::createReaderForFile($file->getPathname());
            $reader->setReadDataOnly(true);
            $this->spreadsheet = $reader->load($file->getPathname());
        } catch (\Exception $e) {
            $this->validationErrors[] = "Could not read Excel file: " . $e->getMessage();
        }
    }

    /**
     * Parse Excel file and extract basic structure
     */
    private function parseExcelFile(UploadedFile $file): void
    {
        $worksheet = $this->spreadsheet->getActiveSheet();
        $highestRow = $worksheet->getHighestRow();
        $highestColumn = $worksheet->getHighestColumn();

        Log::info("Parsing Excel file", [
            'highest_row' => $highestRow,
            'highest_column' => $highestColumn
        ]);

        $this->extractedData['file_info'] = [
            'filename' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'highest_row' => $highestRow,
            'highest_column' => $highestColumn,
            'sheet_name' => $worksheet->getTitle()
        ];

        // Extract all non-empty cells
        $this->extractedData['raw_data'] = [];
        for ($row = 1; $row <= $highestRow; $row++) {
            for ($col = 'A'; $col <= $highestColumn; $col++) {
                $cellValue = $worksheet->getCell($col . $row)->getCalculatedValue();
                $cellFormula = $worksheet->getCell($col . $row)->getValue();

                if (!empty($cellValue) || !empty($cellFormula)) {
                    $this->extractedData['raw_data'][] = [
                        'cell' => $col . $row,
                        'value' => $cellValue,
                        'formula' => $cellFormula !== $cellValue ? $cellFormula : null,
                        'row' => $row,
                        'column' => $col
                    ];
                }
            }
        }
    }

    /**
     * Extract components from parsed Excel data
     */
    private function extractComponents(): void
    {
        $rawData = $this->extractedData['raw_data'];
        $components = [
            'custom_components' => [],      // Salary & Allowances
            'employer_costs' => [],          // Outsourcing & Employer Statutory Costs (Medical, ITF, ECA, etc.)
            'statutory_components' => [],    // Employee Statutory Deductions (Pension, PAYE, etc.)
            'management_fees' => []          // Management/Service Fees & VAT
        ];

        // Check if we have a tabular format (headers in row 1)
        $hasHeaders = $this->detectTabularFormat($rawData);

        if ($hasHeaders) {
            $this->extractComponentsFromTable($rawData, $components);
        } else {
            $this->extractComponentsFromFreeForm($rawData, $components);
        }

        $this->extractedData['components'] = $components;

        // Post-process formulas to resolve cell references to component names
        $this->resolveFormulaCellReferences();

        Log::info("Extracted components", [
            'custom_count' => count($components['custom_components']),
            'employer_costs_count' => count($components['employer_costs']),
            'statutory_count' => count($components['statutory_components']),
            'management_fees_count' => count($components['management_fees']),
            'format_detected' => $hasHeaders ? 'tabular' : 'free-form'
        ]);
    }

    /**
     * Detect if the Excel file uses a tabular format with headers
     */
    private function detectTabularFormat(array $rawData): bool
    {
        // Look for header-like values in row 1
        $row1Cells = array_filter($rawData, function ($cell) {
            return $cell['row'] == 1;
        });

        $headerPatterns = ['section', 'component', 'name', 'type', 'formula', 'rate', 'amount'];
        $headerCount = 0;

        foreach ($row1Cells as $cell) {
            $value = strtolower(trim($cell['value']));
            foreach ($headerPatterns as $pattern) {
                if (strpos($value, $pattern) !== false) {
                    $headerCount++;
                    break;
                }
            }
        }

        return $headerCount >= 3; // If we find 3+ header-like cells, assume tabular format
    }

    /**
     * Extract components from tabular format (with headers)
     */
    private function extractComponentsFromTable(array $rawData, array &$components): void
    {
        // Group data by rows
        $rowData = [];
        foreach ($rawData as $cell) {
            $rowData[$cell['row']][$cell['column']] = $cell;
        }

        // Find column mappings from row 1 (headers)
        $columnMapping = [];
        if (isset($rowData[1])) {
            foreach ($rowData[1] as $col => $cell) {
                $value = strtolower(trim($cell['value']));
                if (strpos($value, 'section') !== false) $columnMapping['section'] = $col;
                if (strpos($value, 'component') !== false || strpos($value, 'name') !== false) $columnMapping['name'] = $col;
                if (strpos($value, 'type') !== false) $columnMapping['type'] = $col;
                if (strpos($value, 'formula') !== false || strpos($value, 'rate') !== false) $columnMapping['formula'] = $col;
                if (strpos($value, 'amount') !== false) $columnMapping['amount'] = $col;
                if (strpos($value, 'note') !== false || strpos($value, 'description') !== false) $columnMapping['notes'] = $col;
            }
        }

        Log::info("Column mapping detected", $columnMapping);

        // Process data rows (skip header row)
        for ($row = 2; $row <= max(array_keys($rowData)); $row++) {
            if (!isset($rowData[$row])) continue;

            $rowCells = $rowData[$row];

            // Extract component data from this row
            $component = $this->extractComponentFromTableRow($rowCells, $columnMapping);
            if ($component) {
                $sectionType = $this->mapSectionToComponentType($component['section']);
                $targetArray = $this->getSectionArrayKey($sectionType);

                if (isset($components[$targetArray])) {
                    $components[$targetArray][] = $component;
                }
            }
        }
    }

    /**
     * Extract component from a table row
     */
    private function extractComponentFromTableRow(array $rowCells, array $columnMapping): ?array
    {
        $sectionCol = $columnMapping['section'] ?? 'A';
        $nameCol = $columnMapping['name'] ?? 'B';
        $formulaCol = $columnMapping['formula'] ?? 'D';

        // Get basic component info
        $section = isset($rowCells[$sectionCol]) ? trim($rowCells[$sectionCol]['value']) : '';
        $name = isset($rowCells[$nameCol]) ? trim($rowCells[$nameCol]['value']) : '';

        if (empty($section) || empty($name)) {
            return null;
        }

        $component = [
            'name' => $this->cleanComponentName($name),
            'description' => $name,
            'section' => strtolower($section),
            'source_cell' => $nameCol . $rowCells[$nameCol]['row']
        ];

        // Extract formula/amount
        if (isset($rowCells[$formulaCol])) {
            $formulaCell = $rowCells[$formulaCol];

            if ($formulaCell['formula'] && strpos($formulaCell['formula'], '=') === 0) {
                // It's a formula
                $component['type'] = 'formula';
                $component['formula'] = $this->convertExcelFormula($formulaCell['formula']);
                $component['calculated_value'] = $formulaCell['value'];
            } elseif (is_numeric($formulaCell['value'])) {
                // It's a fixed amount
                $component['type'] = 'fixed';
                $component['amount'] = (float) $formulaCell['value'];
            } else {
                // Try to parse as percentage
                $percentage = $this->extractPercentage($formulaCell['value']);
                if ($percentage !== null) {
                    $component['type'] = 'percentage';
                    $component['rate'] = $percentage;
                } else {
                    $this->validationWarnings[] = "Could not parse amount for component: {$name}";
                    return null;
                }
            }
        }

        return $component;
    }

    /**
     * Map section name to component type
     */
    private function mapSectionToComponentType(string $section): string
    {
        $section = strtolower($section);

        // Map to the 4 distinct categories
        if (
            strpos($section, 'allowance') !== false ||
            strpos($section, 'earning') !== false ||
            strpos($section, 'salary') !== false
        ) {
            return 'custom';
        }

        // Employer costs: Medical Insurance, ITF, ECA, Fidelity, etc.
        if (
            strpos($section, 'outsourcing') !== false ||
            strpos($section, 'employer') !== false
        ) {
            return 'employer_costs';
        }

        // Employee statutory deductions: Pension, PAYE, NHIS, etc.
        if (
            strpos($section, 'statutory') !== false ||
            strpos($section, 'deduction') !== false ||
            strpos($section, 'tax') !== false ||
            strpos($section, 'pension') !== false
        ) {
            return 'statutory';
        }

        // Management fees: Service fee, VAT, WHT
        if (
            strpos($section, 'management') !== false ||
            strpos($section, 'mgt') !== false ||
            strpos($section, 'service') !== false
        ) {
            return 'management_fees';
        }

        return 'custom'; // Default fallback to salary/allowances
    }

    /**
     * Extract components from free-form format (legacy logic)
     */
    private function extractComponentsFromFreeForm(array $rawData, array &$components): void
    {
        $currentSection = null;
        $componentIndex = 0;

        Log::info("[Excel Import] Starting free-form component extraction");

        foreach ($rawData as $cell) {
            $value = trim($cell['value']);
            $formula = $cell['formula'];

            // Skip empty values
            if (empty($value)) continue;

            // Identify section headers
            $section = $this->identifySection($value);
            if ($section) {
                $currentSection = $section;
                Log::info("[Excel Import] Section detected", [
                    'header' => $value,
                    'section' => $section,
                    'cell' => $cell['cell']
                ]);
                continue;
            }

            // Extract component if we have a section and this looks like a component
            if ($currentSection && $this->looksLikeComponent($value)) {
                $component = $this->extractComponent($cell, $rawData, $currentSection);
                if ($component) {
                    // Map section to correct array key
                    $targetArray = $this->getSectionArrayKey($currentSection);

                    if (isset($components[$targetArray])) {
                        $components[$targetArray][] = $component;
                        Log::info("[Excel Import] Component extracted", [
                            'name' => $component['name'],
                            'section' => $currentSection,
                            'target_array' => $targetArray
                        ]);
                    } else {
                        Log::warning("[Excel Import] Unknown target array", [
                            'section' => $currentSection,
                            'target_array' => $targetArray,
                            'available_keys' => array_keys($components)
                        ]);
                    }
                    $componentIndex++;
                }
            }
        }

        Log::info("[Excel Import] Free-form extraction complete", [
            'custom_components' => count($components['custom_components']),
            'employer_costs' => count($components['employer_costs']),
            'statutory_components' => count($components['statutory_components']),
            'management_fees' => count($components['management_fees'])
        ]);
    }

    /**
     * Get the correct array key for a section identifier
     */
    private function getSectionArrayKey(string $section): string
    {
        // Map section identifiers to component array keys
        $mapping = [
            'custom' => 'custom_components',
            'employer_costs' => 'employer_costs',
            'statutory' => 'statutory_components',
            'management_fees' => 'management_fees'
        ];

        return $mapping[$section] ?? $section . '_components';
    }

    /**
     * Identify which section a value belongs to
     */
    private function identifySection(string $value): ?string
    {
        $lowerValue = strtolower(trim($value));

        // Log the value being checked
        Log::debug("[Excel Import] Checking if section header", [
            'value' => $value,
            'lower_value' => $lowerValue
        ]);

        // Only detect actual section headers - these are the main section dividers
        // Be very specific to avoid treating component names as sections
        $sectionHeaders = [
            // Salary & Allowances section
            'allowances & earnings' => 'custom',
            'allowance & earning' => 'custom',
            'allowances and earnings' => 'custom',
            'earnings & allowances' => 'custom',
            'salary components' => 'custom',

            // Employer Costs section (Medical Insurance, ITF, ECA, Fidelity, etc.)
            'total outsourcing & statutory cost' => 'employer_costs',
            'total outsourcing and statutory cost' => 'employer_costs',
            'outsourcing & statutory cost' => 'employer_costs',
            'employer costs' => 'employer_costs',
            'employer contributions' => 'employer_costs',
            'employer statutory costs' => 'employer_costs',

            // Employee Statutory Deductions section (Pension, PAYE, etc.)
            'statutory deductions' => 'statutory',
            'statutory deduction' => 'statutory',
            'employee deductions' => 'statutory',
            'employee statutory deductions' => 'statutory',

            // Management Fees section
            'management fees' => 'management_fees',
            'management fee' => 'management_fees',
            'service fees' => 'management_fees',

            // Special sections to skip
            'expenses' => null,      // Skip standalone "Expenses" as it might be employer costs subsection
            'summary' => null        // Summary is not a component section
        ];

        // Check for exact section header matches
        foreach ($sectionHeaders as $header => $section) {
            if ($lowerValue === $header) {
                Log::info("[Excel Import] ✓ Section header matched", [
                    'header' => $value,
                    'matched_pattern' => $header,
                    'section' => $section
                ]);
                return $section;
            }
        }

        // Check for section headers with extra whitespace or formatting
        if (
            preg_match('/^allowances?\s*(&|and)\s*earnings?$/i', $value) ||
            preg_match('/^earnings?\s*(&|and)\s*allowances?$/i', $value)
        ) {
            Log::info("[Excel Import] ✓ Section header matched (regex)", ['header' => $value, 'section' => 'custom']);
            return 'custom';
        }

        // "Total Outsourcing & Statutory Cost" header (employer costs)
        if (
            preg_match('/total\s+outsourcing.*statutory.*cost/i', $value) ||
            preg_match('/outsourcing.*statutory.*cost/i', $value)
        ) {
            Log::info("[Excel Import] ✓ Section header matched (regex)", ['header' => $value, 'section' => 'employer_costs']);
            return 'employer_costs';
        }

        // Statutory Deductions headers
        if (
            preg_match('/^(employee\s+)?statutory\s*deductions?$/i', $value) ||
            preg_match('/^(employee\s+)?statutory\s*contributions?$/i', $value)
        ) {
            Log::info("[Excel Import] ✓ Section header matched (regex)", ['header' => $value, 'section' => 'statutory']);
            return 'statutory';
        }

        // Management Fees headers
        if (
            preg_match('/^management\s*fees?$/i', $value) ||
            preg_match('/^service\s*fees?$/i', $value)
        ) {
            Log::info("[Excel Import] ✓ Section header matched (regex)", ['header' => $value, 'section' => 'management_fees']);
            return 'management_fees';
        }

        return null;
    }

    /**
     * Check if a value looks like a component name
     */
    private function looksLikeComponent(string $value): bool
    {
        // Skip obvious headers or section titles
        $lowerValue = strtolower($value);
        $skipPatterns = [
            'allowances & earnings',
            'allowances and earnings',
            'statutory deductions',
            'employee deductions',
            'management fees',
            'service fees',
            'total outsourcing',
            'outsourcing & statutory cost',
            'employer costs',
            'summary',
            'expenses',
            'total staff cost',
            'sol-ict payroll template',
            'net payable'
        ];

        foreach ($skipPatterns as $pattern) {
            if (strpos($lowerValue, $pattern) !== false) {
                return false;
            }
        }

        // Must have some alphabetic characters and not be empty
        return preg_match('/[a-zA-Z]/', $value) > 0 && strlen(trim($value)) > 2;
    }

    /**
     * Extract component details from cell and surrounding data
     */
    private function extractComponent(array $cell, array $allData, string $section): ?array
    {
        $name = trim($cell['value']);
        $row = $cell['row'];

        // Look for amount/formula in adjacent cells (prioritize monthly amounts in column B)
        $amountCell = $this->findAdjacentValue($allData, $row, ['B']) ?:
            $this->findAdjacentValue($allData, $row, ['C', 'D']);

        if (!$amountCell) {
            $this->validationWarnings[] = "No amount found for component: {$name}";
            return null;
        }

        $component = [
            'name' => $this->cleanComponentName($name),
            'description' => $name,
            'section' => $section,
            'source_cell' => $cell['cell'],
            'amount_cell' => $amountCell['cell']
        ];

        // Handle different value types
        if ($amountCell['formula'] && strpos($amountCell['formula'], '=') === 0) {
            // It's a formula
            $component['type'] = 'formula';
            $component['formula'] = $this->convertExcelFormula($amountCell['formula']);
            $component['calculated_value'] = $amountCell['value'];
        } elseif (is_numeric($amountCell['value'])) {
            // It's a fixed amount
            $component['type'] = 'fixed';
            $component['amount'] = (float) $amountCell['value'];
        } else {
            // Try to parse as percentage
            $percentage = $this->extractPercentage($amountCell['value']);
            if ($percentage !== null) {
                $component['type'] = 'percentage';
                $component['rate'] = $percentage;
            } else {
                $this->validationWarnings[] = "Could not parse amount for component: {$name}";
                return null;
            }
        }

        return $component;
    }

    /**
     * Find adjacent cell value in specified columns
     */
    private function findAdjacentValue(array $allData, int $targetRow, array $columns): ?array
    {
        foreach ($columns as $column) {
            foreach ($allData as $cell) {
                if ($cell['row'] === $targetRow && $cell['column'] === $column) {
                    // Accept numeric values, formulas, or non-empty strings that look like amounts
                    $value = $cell['value'];
                    $formula = $cell['formula'];

                    if (
                        !empty($formula) || is_numeric($value) ||
                        (!empty($value) && preg_match('/[0-9,.]/', $value))
                    ) {
                        return $cell;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Convert Excel formula to template format
     */
    private function convertExcelFormula(string $formula): string
    {
        $converted = $formula;

        foreach (self::FORMULA_PATTERNS as $pattern => $replacement) {
            $converted = preg_replace($pattern, $replacement, $converted);
        }

        // Remove leading = sign
        $converted = ltrim($converted, '=');

        // Replace common cell references with component names
        $converted = $this->replaceCellReferences($converted);

        return $converted;
    }

    /**
     * Replace cell references with meaningful component names
     */
    private function replaceCellReferences(string $formula): string
    {
        // For self-references (like =B2*1 where B2 is the current cell), convert to fixed amount
        if (preg_match('/([A-Z]+)([0-9]+)\s*\*\s*1(\s|$)/', $formula)) {
            return 'Basic_Salary'; // =B2*1 typically means "use basic salary value"
        }

        // Build cell-to-component mapping from extracted data
        $cellToComponentMap = $this->buildCellToComponentMapping();

        // Replace cell references with actual component names
        foreach ($cellToComponentMap as $cellRef => $componentName) {
            $formula = str_replace($cellRef, $componentName, $formula);
        }

        // Common mappings for payroll templates
        $commonMappings = [
            'GROSS_PAY' => 'Gross_Salary',
            'BASIC_PAY' => 'Basic_Salary',
        ];

        foreach ($commonMappings as $cellRef => $componentName) {
            $formula = str_replace($cellRef, $componentName, $formula);
        }

        // Replace any remaining cell references with descriptive format
        $formula = preg_replace('/([A-Z]+)([0-9]+)/', 'Cell_$1$2', $formula);

        return $formula;
    }

    /**
     * Build a mapping of cell references to component names
     */
    private function buildCellToComponentMapping(): array
    {
        $mapping = [];

        if (!isset($this->extractedData['components'])) {
            return $mapping;
        }

        $components = $this->extractedData['components'];

        // Get all components and their cell locations from all 4 categories
        $allComponents = array_merge(
            $components['custom_components'] ?? [],
            $components['employer_costs'] ?? [],
            $components['statutory_components'] ?? [],
            $components['management_fees'] ?? []
        );

        foreach ($allComponents as $component) {
            if (isset($component['amount_cell'])) {
                $cellRef = str_replace(':', '', $component['amount_cell']); // Remove : from A1:A1 format
                $componentName = $component['name'] ?? 'Unknown';
                $mapping[$cellRef] = $componentName;
            }
        }

        return $mapping;
    }

    /**
     * Post-process all component formulas to resolve cell references to component names
     */
    private function resolveFormulaCellReferences(): void
    {
        if (!isset($this->extractedData['components'])) {
            return;
        }

        $components = &$this->extractedData['components'];
        $cellToComponentMap = $this->buildCellToComponentMapping();

        // Process each component type (all 4 categories)
        foreach (['custom_components', 'employer_costs', 'statutory_components', 'management_fees'] as $componentType) {
            if (isset($components[$componentType])) {
                foreach ($components[$componentType] as &$component) {
                    if (isset($component['formula']) && !empty($component['formula'])) {
                        $originalFormula = $component['formula'];
                        $resolvedFormula = $this->resolveFormulaCellReferencesInString($originalFormula, $cellToComponentMap);

                        if ($originalFormula !== $resolvedFormula) {
                            $component['formula'] = $resolvedFormula;

                            // Remove or reduce validation warnings for resolved formulas
                            $this->removeFormulaCellReferenceWarning($component['name']);
                        }
                    }
                }
            }
        }
    }

    /**
     * Resolve cell references in a formula string using the component mapping
     */
    private function resolveFormulaCellReferencesInString(string $formula, array $cellToComponentMap): string
    {
        $resolved = $formula;

        // Replace cell references with component names
        foreach ($cellToComponentMap as $cellRef => $componentName) {
            // Replace direct cell references (e.g., B4 -> BASIC_SALARY)
            $resolved = str_replace($cellRef, $componentName, $resolved);

            // Also replace the Cell_ prefixed versions (e.g., Cell_B4 -> BASIC_SALARY)
            $resolved = str_replace("Cell_$cellRef", $componentName, $resolved);
        }

        // Remove any remaining Cell_ prefixes that might have been added by the initial conversion
        $resolved = preg_replace('/Cell_([A-Z_]+)/', '$1', $resolved);

        return $resolved;
    }

    /**
     * Remove validation warnings for formulas that have been resolved
     */
    private function removeFormulaCellReferenceWarning(string $componentName): void
    {
        $this->validationWarnings = array_filter($this->validationWarnings, function ($warning) use ($componentName) {
            return !preg_match("/Formula for ['\"]?" . preg_quote($componentName, '/') . "['\"]? contains unresolved cell references/", $warning);
        });

        // Reindex array to avoid gaps
        $this->validationWarnings = array_values($this->validationWarnings);
    }

    /**
     * Extract percentage from string
     */
    private function extractPercentage(string $value): ?float
    {
        // Look for patterns like "7%", "0.07", "(8%)"
        if (preg_match('/([0-9.]+)%/', $value, $matches)) {
            return (float) $matches[1];
        }

        if (preg_match('/0\.([0-9]+)/', $value, $matches)) {
            return (float) ($matches[1] . '.' . substr($matches[1], -2));
        }

        return null;
    }

    /**
     * Clean component name for database storage
     */
    private function cleanComponentName(string $name): string
    {
        // Remove common suffixes and clean up
        $name = preg_replace('/\s*\([^)]*\)\s*/', '', $name); // Remove parentheses
        $name = trim($name);
        $name = preg_replace('/\s+/', '_', $name); // Replace spaces with underscores
        $name = strtoupper($name);

        return $name;
    }

    /**
     * Validate extracted template structure
     */
    private function validateTemplateStructure(): void
    {
        $components = $this->extractedData['components'] ?? [];

        // Check for minimum required components
        if (empty($components['custom_components'])) {
            $this->validationErrors[] = "No allowance/earning components found";
        }

        if (empty($components['statutory_components'])) {
            $this->validationWarnings[] = "No statutory deduction components found";
        }

        // Check for common required components
        $this->validateRequiredComponents();

        // Validate formulas
        $this->validateFormulas();
    }

    /**
     * Validate required components exist
     */
    private function validateRequiredComponents(): void
    {
        $components = $this->extractedData['components'];
        $allComponents = array_merge(
            $components['custom_components'] ?? [],
            $components['employer_costs'] ?? [],
            $components['statutory_components'] ?? [],
            $components['management_fees'] ?? []
        );

        $requiredPatterns = [
            'basic' => ['basic', 'base'],
            'gross' => ['gross', 'total'],
        ];

        foreach ($requiredPatterns as $type => $patterns) {
            $found = false;
            foreach ($allComponents as $component) {
                $name = strtolower($component['name']);
                $description = strtolower($component['description'] ?? '');
                foreach ($patterns as $pattern) {
                    if (strpos($name, $pattern) !== false || strpos($description, $pattern) !== false) {
                        $found = true;
                        break 2;
                    }
                }
            }

            if (!$found) {
                $this->validationWarnings[] = "No {$type} salary component found";
            }
        }
    }

    /**
     * Validate extracted formulas
     */
    private function validateFormulas(): void
    {
        $components = $this->extractedData['components'];
        $allComponents = array_merge(
            $components['custom_components'] ?? [],
            $components['employer_costs'] ?? [],
            $components['statutory_components'] ?? [],
            $components['management_fees'] ?? []
        );

        foreach ($allComponents as $component) {
            if ($component['type'] === 'formula') {
                $formula = $component['formula'];

                // Check for unresolved cell references (only Cell_ patterns that couldn't be resolved)
                if (preg_match('/Cell_[A-Z]+[0-9]+/', $formula)) {
                    $this->validationWarnings[] = "Formula for '{$component['name']}' contains unresolved cell references: {$formula}";
                }

                if (empty($formula)) {
                    $this->validationErrors[] = "Empty formula for component: '{$component['name']}'";
                }
            }
        }
    }

    /**
     * Create InvoiceTemplate from extracted data
     */
    private function createInvoiceTemplate(
        int $clientId,
        int $payGradeStructureId,
        string $templateName,
        ?string $description,
        bool $setAsDefault,
        string $filename
    ): InvoiceTemplate {
        $components = $this->extractedData['components'];

        // Convert extracted components to template format for all 4 categories
        $customComponents = $this->convertToTemplateFormat($components['custom_components'] ?? []);
        $employerCosts = $this->convertToTemplateFormat($components['employer_costs'] ?? []);
        $statutoryComponents = $this->convertToTemplateFormat($components['statutory_components'] ?? []);
        $managementFees = $this->convertToTemplateFormat($components['management_fees'] ?? []);

        $templateData = [
            'client_id' => $clientId,
            'pay_grade_structure_id' => $payGradeStructureId,
            'template_name' => $templateName,
            'description' => $description ?? "Imported from Excel file: {$filename}",
            'custom_components' => $customComponents,
            'employer_costs' => $employerCosts,
            'statutory_components' => $statutoryComponents,
            'management_fees' => $managementFees,
            'calculation_rules' => $this->generateCalculationRules(),
            'annual_division_factor' => 12,
            'use_credit_to_bank_model' => false,
            'service_fee_percentage' => 0,
            'attendance_calculation_method' => 'working_days',
            'prorate_salary' => true,
            'minimum_attendance_factor' => 0.5,
            'is_active' => true,
            'is_default' => $setAsDefault,
            'created_by' => 'excel_import',
        ];

        // Handle default template logic
        if ($setAsDefault) {
            InvoiceTemplate::where('client_id', $clientId)
                ->where('pay_grade_structure_id', $payGradeStructureId)
                ->update(['is_default' => false]);
        }

        return InvoiceTemplate::create($templateData);
    }

    /**
     * Convert extracted components to template format
     */
    private function convertToTemplateFormat(array $components): array
    {
        $templateComponents = [];

        foreach ($components as $component) {
            $templateComponent = [
                'name' => $component['name'],
                'description' => $component['description'],
                'type' => $component['type'],
            ];

            switch ($component['type']) {
                case 'fixed':
                    $templateComponent['amount'] = $component['amount'];
                    break;
                case 'percentage':
                    $templateComponent['rate'] = $component['rate'];
                    break;
                case 'formula':
                    $templateComponent['formula'] = $component['formula'];
                    if (isset($component['calculated_value'])) {
                        $templateComponent['sample_value'] = $component['calculated_value'];
                    }
                    break;
            }

            // Add metadata
            $templateComponent['imported_from_excel'] = true;
            $templateComponent['source_cell'] = $component['source_cell'];

            $templateComponents[] = $templateComponent;
        }

        return $templateComponents;
    }

    /**
     * Generate calculation rules from extracted data
     */
    private function generateCalculationRules(): array
    {
        return [
            'calculation_order' => [
                'custom_components',
                'statutory_components'
            ],
            'imported_from_excel' => true,
            'import_date' => now()->toISOString(),
            'requires_manual_review' => !empty($this->validationWarnings)
        ];
    }

    /**
     * Analyze template structure for reporting
     */
    private function analyzeTemplateStructure(): array
    {
        $components = $this->extractedData['components'] ?? [];

        return [
            'total_components' => array_sum(array_map('count', $components)),
            'component_breakdown' => array_map('count', $components),
            'has_formulas' => $this->hasFormulas($components),
            'has_percentages' => $this->hasPercentages($components),
            'complexity_score' => $this->calculateComplexityScore($components),
            'completion_status' => empty($this->validationErrors) ? 'valid' : 'invalid',
            'warnings_count' => count($this->validationWarnings),
            'errors_count' => count($this->validationErrors)
        ];
    }

    /**
     * Check if components contain formulas
     */
    private function hasFormulas(array $components): bool
    {
        foreach ($components as $componentGroup) {
            foreach ($componentGroup as $component) {
                if ($component['type'] === 'formula') {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check if components contain percentages
     */
    private function hasPercentages(array $components): bool
    {
        foreach ($components as $componentGroup) {
            foreach ($componentGroup as $component) {
                if ($component['type'] === 'percentage') {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Calculate complexity score
     */
    private function calculateComplexityScore(array $components): int
    {
        $score = 0;
        $totalComponents = 0;
        $formulaComponents = 0;

        foreach ($components as $componentGroup) {
            $totalComponents += count($componentGroup);
            foreach ($componentGroup as $component) {
                if ($component['type'] === 'formula') {
                    $formulaComponents++;
                    $score += 2; // Formulas add complexity
                } else {
                    $score += 1; // Fixed amounts are simpler
                }
            }
        }

        // Bonus for having all three component types
        if (count($components) >= 3) {
            $score += 5;
        }

        return min($score, 100); // Cap at 100
    }

    /**
     * Build error response
     */
    private function buildErrorResponse(string $message): array
    {
        return [
            'success' => false,
            'message' => $message,
            'errors' => $this->validationErrors,
            'warnings' => $this->validationWarnings
        ];
    }
}
