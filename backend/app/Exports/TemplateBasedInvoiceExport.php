<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use App\Services\TemplateBasedCalculationService;
use App\Models\InvoiceTemplate;
use App\Models\ExportTemplate;

/**
 * TemplateBasedInvoiceExport
 * 
 * Multi-sheet Excel export class that creates:
 * 1. Summary sheet using export template line items (Total Cost, Management Fee, VAT, etc.)
 * 2. Breakdown sheet with individual employees and their salary components
 */
class TemplateBasedInvoiceExport implements WithMultipleSheets
{
    protected $attendanceRecords;
    protected $client;
    protected $attendanceUpload;

    public function __construct($attendanceRecords, $client, $attendanceUpload = null)
    {
        $this->attendanceRecords = $attendanceRecords;
        $this->client = $client;
        $this->attendanceUpload = $attendanceUpload;
    }

    /**
     * Return array of sheets
     */
    public function sheets(): array
    {
        return [
            new InvoiceSummarySheet($this->attendanceRecords, $this->client, $this->attendanceUpload),
            new EmployeeBreakdownSheet($this->attendanceRecords, $this->client, $this->attendanceUpload),
        ];
    }
}

/**
 * Invoice Summary Sheet
 * Uses export template line items to show invoice totals like Management Fee, VAT, etc.
 */
class InvoiceSummarySheet implements FromArray, WithTitle, WithStyles
{
    protected $attendanceRecords;
    protected $client;
    protected $attendanceUpload;
    protected $exportTemplate;
    protected $templateService;
    protected $summaryData;

    public function __construct($attendanceRecords, $client, $attendanceUpload = null)
    {
        $this->attendanceRecords = $attendanceRecords;
        $this->client = $client;
        $this->attendanceUpload = $attendanceUpload;
        $this->templateService = new TemplateBasedCalculationService();
        $this->loadExportTemplate();
        $this->prepareSummaryData();
    }

    /**
     * Load export template for this client
     */
    private function loadExportTemplate()
    {
        $this->exportTemplate = ExportTemplate::where('client_id', $this->client->id)
            ->where('format', 'invoice_line_items')
            ->first();
    }

    /**
     * Prepare summary data using export template line items
     */
    private function prepareSummaryData()
    {
        // Calculate totals from all employees first
        $totalEmployeeCosts = 0;
        $totalStatutoryCosts = 0;
        $totalManagementFees = 0;

        foreach ($this->attendanceRecords as $record) {
            // Get client's pay calculation basis
            $payBasis = $this->client->pay_calculation_basis ?? 'calendar_days';

            // Calculate total days based on client's pay calculation basis using invoice month
            $invoiceMonth = $this->attendanceUpload ?
                \Carbon\Carbon::parse($this->attendanceUpload->payroll_month) :
                now();
            $totalDays = $this->getTotalDaysForPayBasis($payBasis, $invoiceMonth->month, $invoiceMonth->year);

            // Calculate attendance factor
            $attendanceFactor = min($record->days_worked / $totalDays, 1.0);

            // Prepare attendance context
            $attendanceContext = [
                'days_worked' => $record->days_worked,
                'total_days' => $totalDays,
                'calculation_basis' => $payBasis
            ];

            // Calculate for this employee
            $calculationResult = $this->templateService->calculateFromTemplate(
                $record->staff,
                $this->client->id,
                $attendanceFactor,
                $attendanceContext
            );

            // Aggregate totals
            $totalEmployeeCosts += $calculationResult['gross_salary'] ?? 0;
            $totalStatutoryCosts += array_sum($calculationResult['statutory_deductions'] ?? []);
        }

        // Calculate management fees (typically percentage of total cost)
        $totalCostOfEmployment = $totalEmployeeCosts + $totalStatutoryCosts;

        // Build summary data array
        $summaryData = [];

        // Top-right header information
        $issueDate = now()->format('d/m/Y');
        $customerCode = $this->client->prefix ?? '';
        $payrollDate = $this->attendanceUpload ?
            \Carbon\Carbon::parse($this->attendanceUpload->payroll_month) :
            now();
        $externalOrder = $payrollDate->format('Y/m') . '/INV/' . $customerCode;
        $paymentTerms = $this->client->payment_terms ?? 'Net 30 days';

        // Header section with invoice details (top-right)
        $summaryData[] = ['', '', '', '', 'Issue Date:', $issueDate];
        $summaryData[] = ['', '', '', '', 'Customer Code:', $customerCode];
        $summaryData[] = ['', '', '', '', 'External Order:', $externalOrder];
        $summaryData[] = ['', '', '', '', 'Payment Terms:', $paymentTerms];
        $summaryData[] = ['', '', '', '', '', '']; // Empty row

        // Company branding section
        $summaryData[] = ['OUTSOURCED STAFF COST PAYMENT', '', '', '', '', ''];
        $summaryData[] = ['Description: Provision & Management of Staff', '', '', '', '', ''];
        $summaryData[] = ['', '', '', '', '', '']; // Empty row
        $summaryData[] = ['', '', '', '', '', '']; // Empty row

        // To and Attention section
        if ($this->client->contact_person_position || $this->client->contact_person_address) {
            $toLine = 'To: ';
            if ($this->client->contact_person_position) {
                $toLine .= $this->client->contact_person_position;
            }
            if ($this->client->contact_person_address) {
                $toLine .= ($this->client->contact_person_position ? ', ' : '') . $this->client->contact_person_address;
            }
            $summaryData[] = [$toLine, '', '', '', '', ''];
        }

        if ($this->client->contact_person_name) {
            $summaryData[] = ['Attention: ' . $this->client->contact_person_name, '', '', '', '', ''];
        }

        if ($this->client->contact_person_position || $this->client->contact_person_address || $this->client->contact_person_name) {
            $summaryData[] = ['', '', '', '', '', '']; // Empty row
            $summaryData[] = ['', '', '', '', '', '']; // Empty row
        }

        // Period header
        $summaryData[] = ['PERIOD: ' . $payrollDate->format('F, Y'), '', '', '', '', ''];
        $summaryData[] = ['', '', '', '', '', '']; // Empty row
        $summaryData[] = ['Item', 'Description', 'Amount', '', '', ''];

        if ($this->exportTemplate && isset($this->exportTemplate->column_mappings)) {
            $lineItems = $this->exportTemplate->column_mappings; // Already decoded by Laravel
            if (is_array($lineItems)) {
                // Sort line items by order
                usort($lineItems, function ($a, $b) {
                    return ($a['order'] ?? 0) <=> ($b['order'] ?? 0);
                });

                $calculatedValues = [
                    'TOTAL_EMPLOYER_COSTS' => $totalCostOfEmployment,
                    'TOTAL_STAFF_COUNT' => count($this->attendanceRecords), // Add staff count for per_staff calculations
                ];

                // First pass: Calculate base values and collect dependency information
                $dependencyMap = [];
                foreach ($lineItems as $lineItem) {
                    $dependsOn = $lineItem['depends_on'] ?? '';
                    if ($dependsOn) {
                        $dependencyMap[$dependsOn] = $lineItem;
                    }
                }

                // Calculate management fees if defined in template
                if (isset($dependencyMap['TOTAL_MANAGEMENT_FEES'])) {
                    $mgmtFeeConfig = $dependencyMap['TOTAL_MANAGEMENT_FEES'];
                    $percentage = ($mgmtFeeConfig['percentage'] ?? 0) / 100;
                    $calculatedValues['TOTAL_MANAGEMENT_FEES'] = $totalCostOfEmployment * $percentage;
                }

                // Calculate VAT on management fees
                if (isset($dependencyMap['VAT_ON_MGT_FEE'])) {
                    $vatConfig = $dependencyMap['VAT_ON_MGT_FEE'];
                    $managementFees = $calculatedValues['TOTAL_MANAGEMENT_FEES'] ?? 0;

                    // Check if VAT percentage is defined in template
                    $vatPercentage = ($vatConfig['percentage'] ?? 0) / 100;

                    // If no percentage in template, check client's default VAT rate or use fallback
                    if ($vatPercentage == 0) {
                        // Try to get VAT rate from client configuration or use standard 7.5%
                        $vatPercentage = $this->getClientVatRate() / 100;
                    }

                    $calculatedValues['VAT_ON_MGT_FEE'] = $managementFees * $vatPercentage;
                }

                foreach ($lineItems as $index => $lineItem) {
                    $itemNumber = $index + 1;
                    $value = $this->calculateLineItemValue($lineItem, $calculatedValues);

                    // Update calculated values for dependent calculations
                    $lineItemId = $lineItem['id'] ?? '';
                    if ($lineItemId) {
                        $calculatedValues[$lineItemId] = $value;
                    }

                    // Also store by depends_on key for cross-reference
                    if (isset($lineItem['depends_on']) && $lineItem['depends_on']) {
                        $calculatedValues[$lineItem['depends_on']] = $value;
                    }

                    $summaryData[] = [
                        $itemNumber,
                        $lineItem['name'] ?? 'Line Item',
                        '₦' . number_format($value, 2),
                        '',
                        '',
                        ''
                    ];
                }
            }
        } else {
            // Fallback to default structure if no export template
            $managementFeeRate = 0.10; // 10%
            $vatRate = 0.075; // 7.5%

            $managementFee = $totalCostOfEmployment * $managementFeeRate;
            $vatOnManagementFee = $managementFee * $vatRate;
            $totalInvoiceValue = $totalCostOfEmployment + $managementFee + $vatOnManagementFee;

            $summaryData[] = [1, 'Total Cost of Employment', '₦' . number_format($totalCostOfEmployment, 2), '', '', ''];
            $summaryData[] = [2, 'Management fee @10%', '₦' . number_format($managementFee, 2), '', '', ''];
            $summaryData[] = [3, 'VAT on Management fee @7.5%', '₦' . number_format($vatOnManagementFee, 2), '', '', ''];
            $summaryData[] = [4, 'Total Invoice Value', '₦' . number_format($totalInvoiceValue, 2), '', '', ''];
        }

        $this->summaryData = $summaryData;
    }

    /**
     * Calculate line item value based on formula type
     */
    private function calculateLineItemValue($lineItem, $calculatedValues)
    {
        $formulaType = $lineItem['formula_type'] ?? 'component';

        switch ($formulaType) {
            case 'component':
                $dependsOn = $lineItem['depends_on'] ?? '';
                return $calculatedValues[$dependsOn] ?? 0;

            case 'percentage':
                $baseComponent = $lineItem['base_component'] ?? $lineItem['depends_on'] ?? '';
                $percentage = ($lineItem['percentage'] ?? 0) / 100;
                $baseValue = $calculatedValues[$baseComponent] ?? 0;
                return $baseValue * $percentage;

            case 'percentage_subtraction':
                $baseComponent = $lineItem['base_component'] ?? $lineItem['depends_on'] ?? '';
                $percentage = ($lineItem['percentage'] ?? 0) / 100;
                $baseValue = $calculatedValues[$baseComponent] ?? 0;
                return - ($baseValue * $percentage); // Negative for subtraction

            case 'sum':
                $total = 0;
                if (isset($lineItem['sum_items']) && is_array($lineItem['sum_items'])) {
                    foreach ($lineItem['sum_items'] as $itemId) {
                        // Look for the value by item ID in calculated values
                        if (isset($calculatedValues[$itemId])) {
                            $total += $calculatedValues[$itemId];
                        } else {
                            // Also check by partial match for backwards compatibility
                            foreach ($calculatedValues as $key => $value) {
                                if (strpos($key, $itemId) !== false) {
                                    $total += $value;
                                    break;
                                }
                            }
                        }
                    }
                }
                return $total;

            case 'fixed_amount':
                return $lineItem['amount'] ?? 0;

            case 'per_staff':
                // Calculate based on number of staff members
                $amountPerStaff = $lineItem['amount_per_staff'] ?? 0;
                $staffCount = count($this->attendanceRecords);
                return $amountPerStaff * $staffCount;

            default:
                return 0;
        }
    }

    /**
     * Get total days for pay calculation basis
     */
    private function getTotalDaysForPayBasis(string $payBasis, int $month, int $year): int
    {
        if ($payBasis === 'working_days') {
            $date = \Carbon\Carbon::createFromDate($year, $month, 1);
            $daysInMonth = $date->daysInMonth;
            $workingDays = 0;

            for ($day = 1; $day <= $daysInMonth; $day++) {
                $currentDate = \Carbon\Carbon::createFromDate($year, $month, $day);
                if (!$currentDate->isWeekend()) {
                    $workingDays++;
                }
            }

            return $workingDays;
        } else {
            $date = \Carbon\Carbon::createFromDate($year, $month, 1);
            return $date->daysInMonth;
        }
    }

    public function array(): array
    {
        return $this->summaryData;
    }

    public function title(): string
    {
        return 'Invoice Summary';
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = count($this->summaryData);

        // Header information styling (top-right)
        $sheet->getStyle('E1:F4')->applyFromArray([
            'font' => ['bold' => true, 'size' => 10],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT]
        ]);

        // Find the row where "OUTSOURCED STAFF COST PAYMENT" appears
        $brandingRow = 0;
        $periodRow = 0;
        $tableHeaderRow = 0;

        for ($i = 0; $i < count($this->summaryData); $i++) {
            if (isset($this->summaryData[$i][0]) && strpos($this->summaryData[$i][0], 'OUTSOURCED STAFF COST PAYMENT') !== false) {
                $brandingRow = $i + 1; // Excel is 1-indexed
            }
            if (isset($this->summaryData[$i][0]) && strpos($this->summaryData[$i][0], 'PERIOD:') !== false) {
                $periodRow = $i + 1;
            }
            if (isset($this->summaryData[$i][0]) && $this->summaryData[$i][0] === 'Item') {
                $tableHeaderRow = $i + 1;
                break;
            }
        }

        // Company branding styling
        if ($brandingRow > 0) {
            $sheet->getStyle("A{$brandingRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 16],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT]
            ]);
        }

        // Period header styling
        if ($periodRow > 0) {
            $sheet->getStyle("A{$periodRow}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 14],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT]
            ]);
        }

        // Table headers styling
        if ($tableHeaderRow > 0) {
            $sheet->getStyle("A{$tableHeaderRow}:C{$tableHeaderRow}")->applyFromArray([
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4']
                ],
                'font' => ['color' => ['rgb' => 'FFFFFF']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ]);

            // Table data borders
            $tableDataStart = $tableHeaderRow + 1;
            $sheet->getStyle("A{$tableHeaderRow}:C{$lastRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CCCCCC']
                    ]
                ]
            ]);
        }

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(8);
        $sheet->getColumnDimension('B')->setWidth(35);
        $sheet->getColumnDimension('C')->setWidth(20);
        $sheet->getColumnDimension('D')->setWidth(5);
        $sheet->getColumnDimension('E')->setWidth(15);
        $sheet->getColumnDimension('F')->setWidth(25);

        return [];
    }

    /**
     * Get client-specific VAT rate or use default
     */
    private function getClientVatRate()
    {
        // Check if client has specific VAT rate configured
        if ($this->client && isset($this->client->vat_rate)) {
            return floatval($this->client->vat_rate);
        }

        // Check if there's a VAT rate in the export template configuration
        if ($this->exportTemplate && isset($this->exportTemplate->vat_rate)) {
            return floatval($this->exportTemplate->vat_rate);
        }

        // Default Nigerian VAT rate
        return 7.5;
    }
}

/**
 * Employee Breakdown Sheet
 * Shows individual employees with their salary components
 */
class EmployeeBreakdownSheet implements FromCollection, WithHeadings, WithStyles, WithMapping, WithColumnWidths, WithTitle
{
    protected $attendanceRecords;
    protected $client;
    protected $attendanceUpload;
    protected $template;
    protected $templateService;
    protected $calculations;
    protected $templateComponents;
    protected $headings;

    public function __construct($attendanceRecords, $client, $attendanceUpload = null)
    {
        $this->attendanceRecords = $attendanceRecords;
        $this->client = $client;
        $this->attendanceUpload = $attendanceUpload;
        $this->templateService = new TemplateBasedCalculationService();
        $this->calculations = [];
        $this->templateComponents = [];
        $this->headings = [];

        $this->loadTemplateStructure();
        $this->prepareCalculations();
    }

    /**
     * Load the client's template structure to determine export columns
     */
    private function loadTemplateStructure()
    {
        $firstRecord = $this->attendanceRecords->first();
        if (!$firstRecord) {
            return;
        }

        $payGradeId = $firstRecord->staff->pay_grade_structure_id ?? null;

        if ($payGradeId) {
            $this->template = InvoiceTemplate::where('client_id', $this->client->id)
                ->where('pay_grade_structure_id', $payGradeId)
                ->where('is_active', true)
                ->first();
        } else {
            $this->template = InvoiceTemplate::where('client_id', $this->client->id)
                ->where('is_active', true)
                ->first();
        }

        if (!$this->template) {
            $this->headings = ['Employee ID', 'Employee Name', 'Days Worked', 'Basic Salary', 'Gross Pay', 'Deductions', 'Net Pay'];
            return;
        }

        $this->headings = ['S/N', 'EMP. CODE', 'EMPLOYEE NAME', 'JOIN DATE', 'GRADE', 'LOCATION OF SERVICE'];

        // Add custom components
        $customComponents = $this->template->custom_components ?? [];
        foreach ($customComponents as $component) {
            $this->headings[] = $this->formatComponentName($component['name'] ?? 'Component');
            $this->templateComponents[] = [
                'type' => 'custom',
                'key' => $component['id'] ?? strtolower(str_replace(' ', '_', $component['name'] ?? 'component')),
                'name' => $component['name'] ?? 'Component'
            ];
        }

        // Add standard columns
        $this->headings[] = 'Operational Reimbursable';
        $this->headings[] = 'Total Outsourcing & Statutory Cost';
        $this->headings[] = 'Total Staff Cost';
        $this->headings[] = 'Agency Fee';
        $this->headings[] = 'VAT on Agency fee';
    }

    /**
     * Format component name for display
     */
    private function formatComponentName($name)
    {
        return ucwords(str_replace('_', ' ', $name));
    }

    /**
     * Pre-calculate all employee data
     */
    private function prepareCalculations()
    {
        foreach ($this->attendanceRecords as $index => $record) {
            $payBasis = $this->client->pay_calculation_basis ?? 'calendar_days';

            $invoiceMonth = $this->attendanceUpload ?
                \Carbon\Carbon::parse($this->attendanceUpload->payroll_month) :
                now();
            $totalDays = $this->getTotalDaysForPayBasis($payBasis, $invoiceMonth->month, $invoiceMonth->year);

            $attendanceFactor = min($record->days_worked / $totalDays, 1.0);

            $attendanceContext = [
                'days_worked' => $record->days_worked,
                'total_days' => $totalDays,
                'calculation_basis' => $payBasis
            ];

            $calculationResult = $this->templateService->calculateFromTemplate(
                $record->staff,
                $this->client->id,
                $attendanceFactor,
                $attendanceContext
            );

            $rowData = [
                'serial_number' => $index + 1,
                'employee_code' => $record->staff->employee_code,
                'employee_name' => $record->staff->full_name,
                'join_date' => $record->staff->employment_start_date ?
                    \Carbon\Carbon::parse($record->staff->employment_start_date)->format('j-M-y') : '-',
                'grade' => $record->staff->payGradeStructure->pay_grade_code ?? 'DRV1',
                'location' => 'LAGOS', // Default location
                'operational_reimbursable' => 0,
                'total_outsourcing_statutory' => array_sum($calculationResult['statutory_deductions'] ?? []),
                'total_staff_cost' => ($calculationResult['gross_salary'] ?? 0) + array_sum($calculationResult['statutory_deductions'] ?? []),
            ];

            // Add template component values
            foreach ($this->templateComponents as $component) {
                $value = 0;

                if ($component['type'] === 'custom' && isset($calculationResult['adjusted_components'])) {
                    foreach ($calculationResult['adjusted_components'] as $key => $adjComponent) {
                        if (
                            strcasecmp($key, $component['key']) === 0 ||
                            strcasecmp($adjComponent['name'] ?? '', $component['name']) === 0
                        ) {
                            $value = $adjComponent['adjusted_amount'] ?? 0;
                            break;
                        }
                    }
                }

                $rowData[$component['key']] = $value;
            }

            // Calculate agency fee (10% of total staff cost)
            $agencyFee = $rowData['total_staff_cost'] * 0.10;
            $vatOnAgencyFee = $agencyFee * 0.075; // 7.5% VAT

            $rowData['agency_fee'] = $agencyFee;
            $rowData['vat_on_agency_fee'] = $vatOnAgencyFee;

            $this->calculations[] = $rowData;
        }
    }

    private function getTotalDaysForPayBasis(string $payBasis, int $month, int $year): int
    {
        if ($payBasis === 'working_days') {
            $date = \Carbon\Carbon::createFromDate($year, $month, 1);
            $daysInMonth = $date->daysInMonth;
            $workingDays = 0;

            for ($day = 1; $day <= $daysInMonth; $day++) {
                $currentDate = \Carbon\Carbon::createFromDate($year, $month, $day);
                if (!$currentDate->isWeekend()) {
                    $workingDays++;
                }
            }

            return $workingDays;
        } else {
            $date = \Carbon\Carbon::createFromDate($year, $month, 1);
            return $date->daysInMonth;
        }
    }

    public function collection()
    {
        return collect($this->calculations);
    }

    public function map($calculation): array
    {
        $row = [
            $calculation['serial_number'],
            $calculation['employee_code'],
            $calculation['employee_name'],
            $calculation['join_date'],
            $calculation['grade'],
            $calculation['location']
        ];

        // Add template component values
        foreach ($this->templateComponents as $component) {
            $row[] = $calculation[$component['key']] ?? 0;
        }

        // Add standard columns
        $row[] = $calculation['operational_reimbursable'];
        $row[] = $calculation['total_outsourcing_statutory'];
        $row[] = $calculation['total_staff_cost'];
        $row[] = $calculation['agency_fee'];
        $row[] = $calculation['vat_on_agency_fee'];

        return $row;
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function title(): string
    {
        $clientName = $this->client->organisation_name;
        $payrollDate = $this->attendanceUpload ?
            \Carbon\Carbon::parse($this->attendanceUpload->payroll_month)->format('F, Y') :
            now()->format('F, Y');

        return $clientName . ' - ' . $payrollDate . ' Schedule';
    }

    public function columnWidths(): array
    {
        $widths = [
            'A' => 8,  // S/N
            'B' => 20, // EMP. CODE
            'C' => 25, // EMPLOYEE NAME
            'D' => 12, // JOIN DATE
            'E' => 10, // GRADE
            'F' => 20, // LOCATION
        ];

        // Dynamic widths for template components
        $column = 'G';
        foreach ($this->templateComponents as $component) {
            $widths[$column] = 18;
            $column++;
        }

        // Standard columns
        $widths[$column] = 18; // Operational Reimbursable
        $column++;
        $widths[$column] = 25; // Total Outsourcing & Statutory Cost
        $column++;
        $widths[$column] = 18; // Total Staff Cost
        $column++;
        $widths[$column] = 15; // Agency Fee
        $column++;
        $widths[$column] = 18; // VAT on Agency fee

        return $widths;
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = count($this->calculations) + 1;
        $lastColumn = chr(65 + count($this->headings) - 1);

        // Header row styling
        $sheet->getStyle("A1:{$lastColumn}1")->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ]);

        // Format currency columns (from column G onwards)
        $currencyStartColumn = 'G';
        $sheet->getStyle("{$currencyStartColumn}2:{$lastColumn}{$lastRow}")->getNumberFormat()
            ->setFormatCode('₦#,##0.00');

        // Center align numeric columns
        $sheet->getStyle("A2:{$lastColumn}{$lastRow}")->applyFromArray([
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER
            ]
        ]);

        // Add borders
        $sheet->getStyle("A1:{$lastColumn}{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CCCCCC']
                ]
            ]
        ]);

        return [];
    }
}
