<?php

namespace App\Services;

use App\Models\ExportTemplate;
use App\Models\Client;
use App\Models\CalculationTemplate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ExportTemplateService
{
    /**
     * Create default export templates for all clients
     */
    public function createDefaultTemplatesForAllClients(): array
    {
        $results = [
            'created' => 0,
            'skipped' => 0,
            'errors' => [],
            'templates' => []
        ];

        $clients = Client::where('status', 'active')->get();

        Log::info("ExportTemplateService: Creating default templates for {$clients->count()} clients");

        foreach ($clients as $client) {
            try {
                // Check if client already has a default export template
                $existingTemplate = ExportTemplate::where('client_id', $client->id)
                    ->where('is_default', true)
                    ->first();

                if ($existingTemplate) {
                    $results['skipped']++;
                    Log::info("ExportTemplateService: Skipped client {$client->id} - default template already exists");
                    continue;
                }

                // Create default export template for this client
                $template = $this->createDefaultTemplateForClient($client);

                $results['created']++;
                $results['templates'][] = [
                    'client_id' => $client->id,
                    'client_name' => $client->organisation_name,
                    'template_id' => $template->id,
                    'template_name' => $template->name
                ];

                Log::info("ExportTemplateService: Created default template for client {$client->id}");
            } catch (\Exception $e) {
                $results['errors'][] = "Client {$client->organisation_name}: " . $e->getMessage();
                Log::error("ExportTemplateService: Failed to create template for client {$client->id}", [
                    'error' => $e->getMessage(),
                    'client' => $client->organisation_name
                ]);
            }
        }

        return $results;
    }

    /**
     * Create a default export template for a specific client
     */
    public function createDefaultTemplateForClient(Client $client): ExportTemplate
    {
        // Get client's calculation templates to understand their components
        $calculationTemplates = CalculationTemplate::where('pay_grade_code', 'LIKE', '%')
            ->active()
            ->take(1)
            ->first();

        // Build column mappings based on typical invoice requirements
        $columnMappings = $this->buildDefaultColumnMappings($client, $calculationTemplates);

        // Build formatting rules based on client preferences
        $formattingRules = $this->buildDefaultFormattingRules($client);

        // Build header configuration
        $headerConfig = $this->buildDefaultHeaderConfig($client);

        return ExportTemplate::create([
            'client_id' => $client->id,
            'name' => "Default Export Template - {$client->organisation_name}",
            'description' => "Default export template for {$client->organisation_name} payroll invoices",
            'version' => '1.0',
            'format' => 'excel',
            'column_mappings' => $columnMappings,
            'formatting_rules' => $formattingRules,
            'grouping_rules' => $this->buildDefaultGroupingRules(),
            'use_credit_to_bank_model' => $this->shouldUseCreditToBankModel($client),
            'service_fee_percentage' => $this->getDefaultServiceFeePercentage($client),
            'fee_calculation_rules' => $this->buildFeeCalculationRules($client),
            'header_config' => $headerConfig,
            'footer_config' => $this->buildDefaultFooterConfig($client),
            'styling_config' => $this->buildDefaultStylingConfig(),
            'is_active' => true,
            'is_default' => true,
            'created_by' => 'system_auto_generation',
            'updated_by' => null
        ]);
    }

    /**
     * Build default column mappings for a client
     */
    private function buildDefaultColumnMappings(Client $client, ?CalculationTemplate $sampleTemplate): array
    {
        $mappings = [
            'employee_name' => [
                'label' => 'Employee Name',
                'order' => 1,
                'width' => 25,
                'source' => 'employee_name',
                'required' => true
            ],
            'employee_code' => [
                'label' => 'Employee Code',
                'order' => 2,
                'width' => 15,
                'source' => 'employee_code',
                'required' => true
            ],
            'designation' => [
                'label' => 'Designation',
                'order' => 3,
                'width' => 20,
                'source' => 'designation',
                'required' => false
            ],
            'basic_salary' => [
                'label' => 'Basic Salary',
                'order' => 4,
                'width' => 15,
                'source' => 'basic_salary',
                'format' => 'currency',
                'required' => true
            ]
        ];

        // Add dynamic columns based on calculation template components
        if ($sampleTemplate) {
            $order = 5;

            // Add allowance components
            foreach ($sampleTemplate->allowance_components ?? [] as $key => $component) {
                $mappings[$key] = [
                    'label' => $component['display_name'] ?? ucwords(str_replace('_', ' ', $key)),
                    'order' => $order++,
                    'width' => 15,
                    'source' => $key,
                    'format' => 'currency',
                    'required' => false
                ];
            }

            // Add deduction components
            foreach ($sampleTemplate->deduction_components ?? [] as $key => $component) {
                $mappings[$key] = [
                    'label' => $component['display_name'] ?? ucwords(str_replace('_', ' ', $key)),
                    'order' => $order++,
                    'width' => 15,
                    'source' => $key,
                    'format' => 'currency',
                    'required' => false
                ];
            }

            // Add statutory components
            foreach ($sampleTemplate->statutory_components ?? [] as $key => $component) {
                $mappings[$key] = [
                    'label' => $component['display_name'] ?? ucwords(str_replace('_', ' ', $key)),
                    'order' => $order++,
                    'width' => 15,
                    'source' => $key,
                    'format' => 'currency',
                    'required' => false
                ];
            }
        }

        // Add summary columns
        $mappings['gross_salary'] = [
            'label' => 'Gross Salary',
            'order' => 900,
            'width' => 18,
            'source' => 'gross_salary',
            'format' => 'currency',
            'required' => true,
            'style' => ['font_weight' => 'bold']
        ];

        $mappings['total_deductions'] = [
            'label' => 'Total Deductions',
            'order' => 901,
            'width' => 18,
            'source' => 'total_deductions',
            'format' => 'currency',
            'required' => true,
            'style' => ['font_weight' => 'bold', 'color' => '#DC3545']
        ];

        $mappings['net_salary'] = [
            'label' => 'Net Salary',
            'order' => 902,
            'width' => 18,
            'source' => 'net_salary',
            'format' => 'currency',
            'required' => true,
            'style' => ['font_weight' => 'bold', 'color' => '#28A745']
        ];

        return $mappings;
    }

    /**
     * Build default formatting rules
     */
    private function buildDefaultFormattingRules(Client $client): array
    {
        return [
            'currency_symbol' => '₦',
            'number_format' => [
                'decimals' => 2,
                'decimal_separator' => '.',
                'thousands_separator' => ','
            ],
            'date_format' => 'd/m/Y',
            'header_style' => [
                'font_weight' => 'bold',
                'font_size' => 12,
                'background_color' => '#4472C4',
                'text_color' => '#FFFFFF',
                'alignment' => 'center'
            ],
            'data_style' => [
                'font_size' => 11,
                'row_height' => 22,
                'alignment' => 'left'
            ],
            'currency_style' => [
                'alignment' => 'right',
                'number_format' => '₦#,##0.00'
            ],
            'total_row_style' => [
                'font_weight' => 'bold',
                'background_color' => '#F8F9FA',
                'border_top' => 'thick'
            ]
        ];
    }

    /**
     * Build default header configuration
     */
    private function buildDefaultHeaderConfig(Client $client): array
    {
        return [
            'company_name' => $client->organisation_name,
            'report_title' => 'Payroll Invoice',
            'show_logo' => false, // Can be enabled later
            'show_period' => true,
            'show_generated_date' => true,
            'show_client_details' => true,
            'client_details' => [
                'address' => $client->head_office_address,
                'phone' => $client->phone,
                'cac_number' => $client->cac_registration_number
            ],
            'layout' => [
                'title_font_size' => 16,
                'subtitle_font_size' => 12,
                'spacing' => 2
            ]
        ];
    }

    /**
     * Build default grouping rules
     */
    private function buildDefaultGroupingRules(): array
    {
        return [
            'enable_grouping' => false,
            'group_by' => null, // Can be 'department', 'pay_grade', etc.
            'show_group_totals' => true,
            'show_grand_total' => true,
            'groups' => []
        ];
    }

    /**
     * Build default footer configuration
     */
    private function buildDefaultFooterConfig(Client $client): array
    {
        return [
            'show_generation_info' => true,
            'show_page_numbers' => true,
            'show_totals_summary' => true,
            'custom_text' => null,
            'contact_info' => [
                'show' => false,
                'email' => null,
                'phone' => null
            ]
        ];
    }

    /**
     * Build default styling configuration
     */
    private function buildDefaultStylingConfig(): array
    {
        return [
            'theme' => 'professional',
            'color_scheme' => [
                'primary' => '#4472C4',
                'secondary' => '#F8F9FA',
                'accent' => '#28A745',
                'danger' => '#DC3545'
            ],
            'fonts' => [
                'header' => 'Calibri',
                'body' => 'Calibri',
                'footer' => 'Calibri'
            ],
            'borders' => [
                'header' => 'medium',
                'data' => 'thin',
                'totals' => 'thick'
            ]
        ];
    }

    /**
     * Determine if client should use credit to bank model
     */
    private function shouldUseCreditToBankModel(Client $client): bool
    {
        // This could be based on client category, size, or specific agreement
        return in_array($client->client_category, ['enterprise', 'large']);
    }

    /**
     * Get default service fee percentage for client
     */
    private function getDefaultServiceFeePercentage(Client $client): float
    {
        // Different fee structures based on client category
        return match ($client->client_category) {
            'enterprise' => 5.0,
            'large' => 7.5,
            'medium' => 10.0,
            'small' => 12.5,
            default => 10.0
        };
    }

    /**
     * Build fee calculation rules
     */
    private function buildFeeCalculationRules(Client $client): array
    {
        return [
            'calculation_method' => 'percentage', // or 'fixed', 'tiered'
            'apply_to' => 'net_salary', // or 'gross_salary', 'total_allowances'
            'minimum_fee' => 0,
            'maximum_fee' => null,
            'tiers' => [], // For tiered pricing
            'excludes' => [] // Components to exclude from fee calculation
        ];
    }

    /**
     * Generate export template for specific calculation results
     */
    public function generateExport(ExportTemplate $template, array $calculationResults, array $metadata = []): array
    {
        switch ($template->format) {
            case 'excel':
                return $this->generateExcelExport($template, $calculationResults, $metadata);
            case 'csv':
                return $this->generateCsvExport($template, $calculationResults, $metadata);
            case 'pdf':
                return $this->generatePdfExport($template, $calculationResults, $metadata);
            case 'json':
                return $this->generateJsonExport($template, $calculationResults, $metadata);
            default:
                throw new \InvalidArgumentException("Unsupported export format: {$template->format}");
        }
    }

    /**
     * Generate Excel export
     */
    private function generateExcelExport(ExportTemplate $template, array $calculationResults, array $metadata): array
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set sheet title
        $sheet->setTitle('Payroll Invoice');

        // Add header
        $this->addExcelHeader($sheet, $template, $metadata);

        // Add data
        $dataStartRow = $this->addExcelData($sheet, $template, $calculationResults);

        // Add totals
        $this->addExcelTotals($sheet, $template, $calculationResults, $dataStartRow);

        // Apply styling
        $this->applyExcelStyling($sheet, $template, count($calculationResults), $dataStartRow);

        // Generate file
        $fileName = $this->generateFileName($template, $metadata, 'xlsx');
        $filePath = storage_path('app/exports/' . $fileName);

        // Ensure directory exists
        if (!file_exists(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }

        $writer = new Xlsx($spreadsheet);
        $writer->save($filePath);

        return [
            'file_path' => $filePath,
            'file_name' => $fileName,
            'format' => 'excel',
            'size' => filesize($filePath),
            'rows' => count($calculationResults)
        ];
    }

    /**
     * Add header to Excel sheet
     */
    private function addExcelHeader(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, ExportTemplate $template, array $metadata): int
    {
        $currentRow = 1;
        $headerConfig = $template->getHeaderConfigWithDefaults();

        // Company name
        $sheet->setCellValue('A' . $currentRow, $headerConfig['company_name']);
        $sheet->mergeCells('A' . $currentRow . ':J' . $currentRow);
        $currentRow++;

        // Report title
        $sheet->setCellValue('A' . $currentRow, $headerConfig['report_title']);
        $sheet->mergeCells('A' . $currentRow . ':J' . $currentRow);
        $currentRow++;

        // Period and generation date
        if ($headerConfig['show_period'] && isset($metadata['period'])) {
            $sheet->setCellValue('A' . $currentRow, 'Period: ' . $metadata['period']);
            $currentRow++;
        }

        if ($headerConfig['show_generated_date']) {
            $sheet->setCellValue('A' . $currentRow, 'Generated: ' . now()->format('d/m/Y H:i'));
            $currentRow++;
        }

        // Empty row
        $currentRow++;

        // Column headers
        $columns = $template->getExportColumns();
        $col = 'A';
        foreach ($columns as $column) {
            $sheet->setCellValue($col . $currentRow, $column['label']);
            $col++;
        }

        return $currentRow + 1; // Return data start row
    }

    /**
     * Add data to Excel sheet
     */
    private function addExcelData(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, ExportTemplate $template, array $calculationResults): int
    {
        $columns = $template->getExportColumns();
        $headerRow = 6; // Assuming header starts at row 6
        $currentRow = $headerRow + 1;

        foreach ($calculationResults as $result) {
            $col = 'A';
            foreach ($columns as $columnKey => $column) {
                $value = $result[$column['source']] ?? '';

                // Format currency values
                if (($column['format'] ?? '') === 'currency' && is_numeric($value)) {
                    $sheet->setCellValue($col . $currentRow, (float) $value);
                } else {
                    $sheet->setCellValue($col . $currentRow, $value);
                }

                $col++;
            }
            $currentRow++;
        }

        return $currentRow; // Return totals start row
    }

    /**
     * Add totals to Excel sheet
     */
    private function addExcelTotals(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, ExportTemplate $template, array $calculationResults, int $startRow): void
    {
        $columns = $template->getExportColumns();
        $totalsRow = $startRow;

        // Add "TOTAL" label in first column
        $sheet->setCellValue('A' . $totalsRow, 'TOTAL');

        // Calculate and add totals for currency columns
        $col = 'B'; // Start from second column
        foreach (array_slice($columns, 1, null, true) as $columnKey => $column) {
            if (($column['format'] ?? '') === 'currency') {
                $total = array_sum(array_column($calculationResults, $column['source']));
                $sheet->setCellValue($col . $totalsRow, $total);
            }
            $col++;
        }
    }

    /**
     * Apply styling to Excel sheet
     */
    private function applyExcelStyling(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, ExportTemplate $template, int $dataRows, int $dataStartRow): void
    {
        $formattingRules = $template->getFormattingRulesWithDefaults();
        $columns = $template->getExportColumns();

        // Auto-size columns
        foreach (range('A', chr(65 + count($columns) - 1)) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Header styling (row 6)
        $headerRange = 'A6:' . chr(65 + count($columns) - 1) . '6';
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => str_replace('#', '', $formattingRules['header_style']['text_color'])]
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => str_replace('#', '', $formattingRules['header_style']['background_color'])]
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER
            ]
        ]);

        // Data range formatting
        $dataRange = 'A' . $dataStartRow . ':' . chr(65 + count($columns) - 1) . ($dataStartRow + $dataRows - 1);

        // Currency formatting for currency columns
        foreach ($columns as $index => $column) {
            if (($column['format'] ?? '') === 'currency') {
                $colLetter = chr(65 + $index);
                $currencyRange = $colLetter . $dataStartRow . ':' . $colLetter . ($dataStartRow + $dataRows + 1); // Include totals
                $sheet->getStyle($currencyRange)->getNumberFormat()->setFormatCode($formattingRules['currency_style']['number_format']);
            }
        }
    }

    /**
     * Generate CSV export
     */
    private function generateCsvExport(ExportTemplate $template, array $calculationResults, array $metadata): array
    {
        $columns = $template->getExportColumns();
        $fileName = $this->generateFileName($template, $metadata, 'csv');
        $filePath = storage_path('app/exports/' . $fileName);

        // Ensure directory exists
        if (!file_exists(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }

        $file = fopen($filePath, 'w');

        // Add headers
        fputcsv($file, array_column($columns, 'label'));

        // Add data
        foreach ($calculationResults as $result) {
            $row = [];
            foreach ($columns as $column) {
                $value = $result[$column['source']] ?? '';

                // Format currency values
                if (($column['format'] ?? '') === 'currency' && is_numeric($value)) {
                    $value = number_format((float) $value, 2);
                }

                $row[] = $value;
            }
            fputcsv($file, $row);
        }

        fclose($file);

        return [
            'file_path' => $filePath,
            'file_name' => $fileName,
            'format' => 'csv',
            'size' => filesize($filePath),
            'rows' => count($calculationResults)
        ];
    }

    /**
     * Generate JSON export
     */
    private function generateJsonExport(ExportTemplate $template, array $calculationResults, array $metadata): array
    {
        $fileName = $this->generateFileName($template, $metadata, 'json');
        $filePath = storage_path('app/exports/' . $fileName);

        // Ensure directory exists
        if (!file_exists(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }

        $exportData = [
            'metadata' => array_merge($metadata, [
                'generated_at' => now()->toISOString(),
                'template_id' => $template->id,
                'template_name' => $template->name,
                'client' => $template->client->organisation_name,
                'format' => 'json'
            ]),
            'data' => $calculationResults,
            'summary' => [
                'total_employees' => count($calculationResults),
                'total_gross' => array_sum(array_column($calculationResults, 'gross_salary')),
                'total_deductions' => array_sum(array_column($calculationResults, 'total_deductions')),
                'total_net' => array_sum(array_column($calculationResults, 'net_salary'))
            ]
        ];

        file_put_contents($filePath, json_encode($exportData, JSON_PRETTY_PRINT));

        return [
            'file_path' => $filePath,
            'file_name' => $fileName,
            'format' => 'json',
            'size' => filesize($filePath),
            'rows' => count($calculationResults)
        ];
    }

    /**
     * Generate file name for export
     */
    private function generateFileName(ExportTemplate $template, array $metadata, string $extension): string
    {
        $clientName = str_replace(' ', '_', $template->client->organisation_name);
        $period = $metadata['period'] ?? date('Y-m');
        $timestamp = date('YmdHis');

        return "{$clientName}_Payroll_{$period}_{$timestamp}.{$extension}";
    }

    /**
     * Get all export templates with client information
     */
    public function getAllTemplatesWithClients(): array
    {
        return ExportTemplate::with('client')
            ->active()
            ->orderBy('client_id')
            ->orderBy('is_default', 'desc')
            ->get()
            ->map(function ($template) {
                return [
                    'id' => $template->id,
                    'name' => $template->name,
                    'client_id' => $template->client_id,
                    'client_name' => $template->client->organisation_name,
                    'format' => $template->format,
                    'is_default' => $template->is_default,
                    'last_used_at' => $template->last_used_at,
                    'created_at' => $template->created_at
                ];
            })
            ->toArray();
    }

    /**
     * Generate PDF export (placeholder for future implementation)
     */
    private function generatePdfExport($template, $calculationResults, $metadata)
    {
        throw new \InvalidArgumentException("PDF export not yet implemented");
    }
}
