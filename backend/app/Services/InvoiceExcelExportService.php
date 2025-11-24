<?php

namespace App\Services;

use App\Models\GeneratedInvoice;
use App\Models\InvoiceTemplate;
use App\Services\TemplateBasedCalculationService;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class InvoiceExcelExportService
{
    /**
     * Export invoice to Excel file and return StreamedResponse
     */
    public static function exportInvoice($invoiceId)
    {
        $invoice = GeneratedInvoice::with(['client', 'lineItems', 'attendanceUpload'])
            ->findOrFail($invoiceId);

        try {
            // Create spreadsheet directly using PhpSpreadsheet
            $spreadsheet = self::createSpreadsheet($invoice);

            // Generate filename
            $filename = self::generateFilename($invoice);

            // Create writer
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);

            // Create a streamed response
            $response = response()->stream(
                function () use ($writer) {
                    $writer->save('php://output');
                },
                200,
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                    'Cache-Control' => 'max-age=0',
                ]
            );

            Log::info('Invoice exported to Excel', [
                'invoice_id' => $invoiceId,
                'filename' => $filename
            ]);

            return $response;
        } catch (\Exception $e) {
            Log::error("Excel export failed for invoice {$invoiceId}: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
    }

    /**
     * Create PhpSpreadsheet object for the invoice
     */
    private static function createSpreadsheet($invoice)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();

        // Remove default worksheet
        $spreadsheet->removeSheetByIndex(0);

        // Add invoice summary sheet
        $summarySheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, 'Invoice Summary');
        $spreadsheet->addSheet($summarySheet);

        self::populateInvoiceSummarySheet($summarySheet, $invoice);

        // Add calculation breakdown sheet
        $breakdownSheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, 'Calculation Breakdown');
        $spreadsheet->addSheet($breakdownSheet);

        self::populateCalculationBreakdownSheet($breakdownSheet, $invoice);

        // If detailed invoice, add employee details sheet
        if ($invoice->invoice_type === 'with_schedule') {
            $employeeSheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, 'Employee Details');
            $spreadsheet->addSheet($employeeSheet);

            self::populateEmployeeDetailsSheet($employeeSheet, $invoice);
        }

        // Set active sheet to summary
        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    /**
     * Populate the invoice summary sheet
     */
    private static function populateInvoiceSummarySheet($sheet, $invoice)
    {
        $row = 1;

        // Header
        $sheet->setCellValue('A' . $row, 'INVOICE');
        $sheet->mergeCells('A' . $row . ':B' . $row);
        $sheet->getStyle('A' . $row)->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
        $row += 2;

        // Invoice details
        $details = [
            ['Invoice Number:', $invoice->invoice_number],
            ['Client:', $invoice->client->organisation_name],
            ['Invoice Month:', \Carbon\Carbon::parse($invoice->invoice_month)->format('F Y')],
            ['Generated Date:', $invoice->generated_at->format('Y-m-d H:i:s')],
            ['Invoice Type:', ucwords(str_replace('_', ' ', $invoice->invoice_type))],
        ];

        foreach ($details as $detail) {
            $sheet->setCellValue('A' . $row, $detail[0]);
            $sheet->setCellValue('B' . $row, $detail[1]);
            $row++;
        }
        $row++;

        // Payroll Summary
        $sheet->setCellValue('A' . $row, 'PAYROLL SUMMARY');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true)->setSize(12);
        $row++;

        $payrollData = [
            ['Total Employees:', $invoice->total_employees],
            ['Gross Payroll:', '₦' . number_format((float)($invoice->gross_payroll ?? 0), 2)],
            ['Total Deductions:', '₦' . number_format((float)($invoice->total_deductions ?? 0), 2)],
            ['Net Payroll:', '₦' . number_format((float)($invoice->net_payroll ?? 0), 2)],
        ];

        foreach ($payrollData as $data) {
            $sheet->setCellValue('A' . $row, $data[0]);
            $sheet->setCellValue('B' . $row, $data[1]);
            $row++;
        }
        $row++;

        // Final total
        $sheet->setCellValue('A' . $row, 'INVOICE TOTAL');
        $sheet->setCellValue('B' . $row, '₦' . number_format((float)($invoice->total_invoice_amount ?? 0), 2));
        $sheet->getStyle('A' . $row . ':B' . $row)->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A' . $row . ':B' . $row)->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('4472C4');
        $sheet->getStyle('A' . $row . ':B' . $row)->getFont()->getColor()->setRGB('FFFFFF');

        // Auto-size columns
        $sheet->getColumnDimension('A')->setAutoSize(true);
        $sheet->getColumnDimension('B')->setAutoSize(true);
    }

    /**
     * Populate the calculation breakdown sheet
     */
    private static function populateCalculationBreakdownSheet($sheet, $invoice)
    {
        $breakdown = $invoice->calculation_breakdown;
        $row = 1;

        if (is_array($breakdown) && isset($breakdown[0])) {
            $employeeData = $breakdown[0];

            // Employee Information
            $sheet->setCellValue('A' . $row, 'EMPLOYEE DETAILS');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true)->setSize(12);
            $row++;

            $employeeInfo = [
                ['Staff Name:', $employeeData['staff_name'] ?? 'N/A'],
                ['Staff Number:', $employeeData['staff_number'] ?? 'N/A'],
                ['Days Worked:', $employeeData['days_worked'] ?? 'N/A'],
                ['Attendance Factor:', number_format($employeeData['attendance_factor'] ?? 0, 4)],
            ];

            foreach ($employeeInfo as $info) {
                $sheet->setCellValue('A' . $row, $info[0]);
                $sheet->setCellValue('B' . $row, $info[1]);
                $row++;
            }
            $row++;

            // Salary breakdown
            $sheet->setCellValue('A' . $row, 'SALARY BREAKDOWN');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true)->setSize(12);
            $row++;

            $salaryData = [
                ['Gross Amount:', '₦' . number_format((float)($employeeData['gross_amount'] ?? 0), 2)],
                ['Deductions:', '₦' . number_format((float)($employeeData['deductions'] ?? 0), 2)],
                ['Net Amount:', '₦' . number_format((float)($employeeData['net_amount'] ?? 0), 2)],
            ];

            foreach ($salaryData as $data) {
                $sheet->setCellValue('A' . $row, $data[0]);
                $sheet->setCellValue('B' . $row, $data[1]);
                $row++;
            }
        }

        // Auto-size columns
        $sheet->getColumnDimension('A')->setAutoSize(true);
        $sheet->getColumnDimension('B')->setAutoSize(true);
    }

    /**
     * Populate employee details sheet (for detailed invoices)
     */
    private static function populateEmployeeDetailsSheet($sheet, $invoice)
    {
        $row = 1;

        // Get template structure and calculate data
        $templateData = self::getTemplateBasedEmployeeData($invoice);

        if (empty($templateData['headers']) || empty($templateData['rows'])) {
            // Fallback to old format if template data not available
            self::populateEmployeeDetailsSheetFallback($sheet, $invoice);
            return;
        }

        // Headers from template structure
        $col = 'A';
        foreach ($templateData['headers'] as $header) {
            $sheet->setCellValue($col . $row, $header);
            $sheet->getStyle($col . $row)->getFont()->setBold(true);
            $sheet->getStyle($col . $row)->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('4472C4');
            $sheet->getStyle($col . $row)->getFont()->getColor()->setRGB('FFFFFF');
            $col++;
        }
        $row++;

        // Employee data with template components
        foreach ($templateData['rows'] as $rowData) {
            $col = 'A';
            foreach ($rowData as $value) {
                $sheet->setCellValue($col . $row, $value);
                $col++;
            }
            $row++;
        }

        // Auto-size columns - handle multi-letter columns (AA, AB, etc.)
        $headerCount = count($templateData['headers']);
        for ($i = 1; $i <= $headerCount; $i++) {
            $columnLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i);
            $sheet->getColumnDimension($columnLetter)->setAutoSize(true);
        }
    }

    /**
     * Get template-based employee data for the invoice
     */
    private static function getTemplateBasedEmployeeData($invoice)
    {
        try {
            if (!$invoice->attendanceUpload || !$invoice->attendanceUpload->attendanceRecords) {
                return ['headers' => [], 'rows' => []];
            }

            $attendanceRecords = $invoice->attendanceUpload->attendanceRecords()->with('staff')->get();
            $client = $invoice->client;

            if ($attendanceRecords->isEmpty()) {
                return ['headers' => [], 'rows' => []];
            }

            // Get template structure from first employee
            $firstRecord = $attendanceRecords->first();
            $payGradeId = $firstRecord->staff->pay_grade_structure_id ?? null;

            $template = null;
            if ($payGradeId) {
                $template = InvoiceTemplate::where('client_id', $client->id)
                    ->where('pay_grade_structure_id', $payGradeId)
                    ->where('is_active', true)
                    ->first();
            }

            if (!$template) {
                $template = InvoiceTemplate::where('client_id', $client->id)
                    ->where('is_active', true)
                    ->first();
            }

            if (!$template) {
                return ['headers' => [], 'rows' => []];
            }

            // Build headers based on template
            $headers = ['Employee ID', 'Employee Name', 'Days Worked'];
            $templateComponents = [];

            // Add custom components (salary components)
            $customComponents = $template->custom_components ?? [];
            foreach ($customComponents as $component) {
                $componentName = $component['name'] ?? 'Component';
                $headers[] = strtoupper(str_replace('_', ' ', $componentName));
                $templateComponents[] = [
                    'type' => 'custom',
                    'key' => $component['id'] ?? strtolower(str_replace(' ', '_', $componentName)),
                    'name' => $componentName
                ];
            }

            // Add statutory components
            $statutoryComponents = $template->statutory_components ?? [];
            foreach ($statutoryComponents as $component) {
                $componentName = $component['name'] ?? 'Statutory Component';
                $headers[] = strtoupper(str_replace('_', ' ', $componentName));
                $templateComponents[] = [
                    'type' => 'statutory',
                    'key' => $component['id'] ?? strtolower(str_replace(' ', '_', $componentName)),
                    'name' => $componentName
                ];
            }

            // Add summary columns
            $headers[] = 'GROSS TOTAL';
            $headers[] = 'TOTAL DEDUCTIONS';
            $headers[] = 'NET AMOUNT';

            if ($template->service_fee_percentage > 0) {
                $headers[] = 'SERVICE FEE (' . $template->service_fee_percentage . '%)';
                $headers[] = 'TOTAL COST';
            }

            // Calculate employee data
            $templateService = new TemplateBasedCalculationService();
            $rows = [];

            foreach ($attendanceRecords as $record) {
                // Get client's pay calculation basis
                $payBasis = $client->pay_calculation_basis ?? 'calendar_days';

                // Calculate total days using the invoice/payroll month, not current month
                $invoiceMonth = \Carbon\Carbon::parse($invoice->attendanceUpload->payroll_month ?? $invoice->invoice_month);
                $totalDays = self::getTotalDaysForPayBasis($payBasis, $invoiceMonth->month, $invoiceMonth->year);

                $attendanceFactor = min($record->days_worked / $totalDays, 1.0);

                $attendanceContext = [
                    'days_worked' => $record->days_worked,
                    'total_days' => $totalDays,
                    'calculation_basis' => $payBasis
                ];

                // Calculate using template service
                $calculationResult = $templateService->calculateFromTemplate(
                    $record->staff,
                    $client->id,
                    $attendanceFactor,
                    $attendanceContext
                );

                // Build row data
                $rowData = [
                    $record->staff->employee_code,
                    $record->staff->full_name,
                    $record->days_worked
                ];

                $grossTotal = 0;
                $totalDeductions = 0;

                // Add component values
                foreach ($templateComponents as $component) {
                    $value = 0;

                    if ($component['type'] === 'custom') {
                        // Look in adjusted_components
                        if (isset($calculationResult['adjusted_components'])) {
                            foreach ($calculationResult['adjusted_components'] as $key => $adjComponent) {
                                if (
                                    strcasecmp($key, $component['key']) === 0 ||
                                    strcasecmp($adjComponent['name'] ?? '', $component['name']) === 0
                                ) {
                                    $value = $adjComponent['adjusted_amount'] ?? 0;

                                    // Only add base salary components to grossTotal, not calculated aggregates
                                    // Base components are those with type 'fixed' (not 'formula')
                                    $isBaseComponent = $adjComponent['type'] === 'fixed';
                                    if ($isBaseComponent) {
                                        $grossTotal += $value;
                                    }
                                    break;
                                }
                            }
                        }
                    } elseif ($component['type'] === 'statutory') {
                        // Look in statutory_deductions
                        if (isset($calculationResult['statutory_deductions']) && is_array($calculationResult['statutory_deductions'])) {
                            foreach ($calculationResult['statutory_deductions'] as $key => $deductionValue) {
                                if (
                                    strcasecmp($key, $component['key']) === 0 ||
                                    stripos($key, $component['name']) !== false
                                ) {
                                    $value = $deductionValue;
                                    $totalDeductions += $value;
                                    break;
                                }
                            }
                        }
                    }

                    $rowData[] = number_format($value, 2);
                }

                // Add summary values
                $grossTotal = $grossTotal ?: ($calculationResult['gross_salary'] ?? 0);
                $totalDeductions = $totalDeductions ?: array_sum($calculationResult['statutory_deductions'] ?? []);
                $netAmount = $calculationResult['net_salary'] ?? 0;

                $rowData[] = number_format($grossTotal, 2);
                $rowData[] = number_format($totalDeductions, 2);
                $rowData[] = number_format($netAmount, 2);

                // Add service fee if configured
                if ($template->service_fee_percentage > 0) {
                    $serviceFee = ($grossTotal + $totalDeductions) * ($template->service_fee_percentage / 100);
                    $totalCost = $grossTotal + $totalDeductions + $serviceFee;
                    $rowData[] = number_format($serviceFee, 2);
                    $rowData[] = number_format($totalCost, 2);
                }

                $rows[] = $rowData;
            }

            return ['headers' => $headers, 'rows' => $rows];
        } catch (\Exception $e) {
            Log::error('Error generating template-based employee data', [
                'error' => $e->getMessage(),
                'invoice_id' => $invoice->id
            ]);
            return ['headers' => [], 'rows' => []];
        }
    }

    /**
     * Fallback to old employee details format
     */
    private static function populateEmployeeDetailsSheetFallback($sheet, $invoice)
    {
        $row = 1;

        // Headers
        $headers = [
            'Employee ID',
            'Employee Name',
            'Designation',
            'Days Worked',
            'Basic Salary (₦)',
            'Gross Pay (₦)',
            'PAYE (₦)',
            'Pension (₦)',
            'NSITF (₦)',
            'Total Deductions (₦)',
            'Net Pay (₦)'
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . $row, $header);
            $sheet->getStyle($col . $row)->getFont()->setBold(true);
            $col++;
        }
        $row++;

        // Employee data
        if ($invoice->lineItems) {
            foreach ($invoice->lineItems as $item) {
                $col = 'A';
                $data = [
                    $item->employee_id,
                    $item->employee_name,
                    $item->designation,
                    $item->days_worked,
                    number_format((float)($item->basic_salary ?? 0), 2),
                    number_format((float)($item->gross_pay ?? 0), 2),
                    number_format((float)($item->paye_deduction ?? 0), 2),
                    number_format((float)($item->pension_deduction ?? 0), 2),
                    number_format((float)($item->nsitf_deduction ?? 0), 2),
                    number_format((float)($item->total_deductions ?? 0), 2),
                    number_format((float)($item->net_pay ?? 0), 2)
                ];

                foreach ($data as $value) {
                    $sheet->setCellValue($col . $row, $value);
                    $col++;
                }
                $row++;
            }
        }

        // Auto-size columns
        foreach (range('A', 'K') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Get total days for pay calculation basis
     */
    private static function getTotalDaysForPayBasis(string $payBasis, int $month, int $year): int
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

    /**
     * Generate filename for invoice
     */
    private static function generateFilename($invoice)
    {
        $clientName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $invoice->client->organisation_name);
        $month = Carbon::parse($invoice->invoice_month)->format('Y_m');
        $type = $invoice->invoice_type === 'with_schedule' ? 'Detailed' : 'Summary';

        return "{$invoice->invoice_number}_{$clientName}_{$month}_{$type}.xlsx";
    }
}

/**
 * Summary Invoice Export (without employee details)
 */
class SummaryInvoiceExport implements WithMultipleSheets
{
    private $invoice;

    public function __construct(GeneratedInvoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function sheets(): array
    {
        return [
            new InvoiceSummarySheet($this->invoice),
            new CalculationBreakdownSheet($this->invoice)
        ];
    }
}

/**
 * Detailed Invoice Export (with employee details)
 */
class DetailedInvoiceExport implements WithMultipleSheets
{
    private $invoice;

    public function __construct(GeneratedInvoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function sheets(): array
    {
        return [
            new InvoiceSummarySheet($this->invoice),
            new EmployeeDetailsSheet($this->invoice),
            new CalculationBreakdownSheet($this->invoice)
        ];
    }
}

/**
 * Invoice Summary Sheet
 */
class InvoiceSummarySheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    private $invoice;

    public function __construct(GeneratedInvoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function collection()
    {
        $invoice = $this->invoice;

        return collect([
            // Header Information
            ['INVOICE', ''],
            ['', ''],
            ['Invoice Number:', $invoice->invoice_number],
            ['Client:', $invoice->client->organisation_name],
            ['Invoice Month:', Carbon::parse($invoice->invoice_month)->format('F Y')],
            ['Generated Date:', $invoice->generated_at->format('Y-m-d H:i:s')],
            ['Invoice Type:', ucwords(str_replace('_', ' ', $invoice->invoice_type))],
            ['', ''],

            // Payroll Summary
            ['PAYROLL SUMMARY', ''],
            ['Total Employees:', $invoice->total_employees],
            ['Gross Payroll:', '₦' . number_format((float)($invoice->gross_payroll ?? 0), 2)],
            ['Total Deductions:', '₦' . number_format((float)($invoice->total_deductions ?? 0), 2)],
            ['Net Payroll:', '₦' . number_format((float)($invoice->net_payroll ?? 0), 2)],
            ['', ''],

            // Fees and Charges
            ['FEES & CHARGES', ''],
            ['Management Fee (7%):', '₦' . number_format((float)($invoice->management_fee ?? 0), 2)],
            ['VAT on Management Fee (7.5%):', '₦' . number_format((float)($invoice->vat_amount ?? 0), 2)],
            ['WHT Deduction:', '₦' . number_format((float)($invoice->wht_amount ?? 0), 2)],
            ['', ''],

            // Total
            ['INVOICE TOTAL', '₦' . number_format((float)($invoice->total_invoice_amount ?? 0), 2)],
            ['', ''],

            // Payment Instructions
            ['PAYMENT INSTRUCTIONS', ''],
            ['Account Name:', 'Strategic Outsourcing Limited'],
            ['Bank:', 'Access Bank PLC'],
            ['Account Number:', '1234567890'],
            ['Sort Code:', '044150149'],
        ]);
    }

    public function headings(): array
    {
        return ['Description', 'Amount'];
    }

    public function title(): string
    {
        return 'Invoice Summary';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Header styling
            1 => [
                'font' => ['bold' => true, 'size' => 16],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ],

            // Section headers
            '9:9' => ['font' => ['bold' => true, 'size' => 12]],
            '15:15' => ['font' => ['bold' => true, 'size' => 12]],
            '20:20' => [
                'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4']
                ]
            ],
            '22:22' => ['font' => ['bold' => true, 'size' => 12]],

            // Currency amounts alignment
            'B:B' => ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]],
        ];
    }
}

/**
 * Employee Details Sheet (for detailed invoices)
 */
class EmployeeDetailsSheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    private $invoice;

    public function __construct(GeneratedInvoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function collection()
    {
        return $this->invoice->lineItems->map(function ($item) {
            return [
                'employee_id' => $item->employee_id,
                'employee_name' => $item->employee_name,
                'designation' => $item->designation,
                'days_worked' => $item->days_worked,
                'basic_salary' => number_format((float)($item->basic_salary ?? 0), 2),
                'gross_pay' => number_format((float)($item->gross_pay ?? 0), 2),
                'paye_deduction' => number_format((float)($item->paye_deduction ?? 0), 2),
                'nhf_deduction' => number_format((float)($item->nhf_deduction ?? 0), 2),
                'nsitf_deduction' => number_format((float)($item->nsitf_deduction ?? 0), 2),
                'other_deductions' => number_format((float)($item->other_deductions ?? 0), 2),
                'total_deductions' => number_format((float)($item->total_deductions ?? 0), 2),
                'net_pay' => number_format((float)($item->net_pay ?? 0), 2)
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Employee ID',
            'Employee Name',
            'Designation',
            'Days Worked',
            'Basic Salary (₦)',
            'Gross Pay (₦)',
            'PAYE (₦)',
            'NHF (₦)',
            'NSITF (₦)',
            'Other Deductions (₦)',
            'Total Deductions (₦)',
            'Net Pay (₦)'
        ];
    }

    public function title(): string
    {
        return 'Employee Details';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Header row
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E2EFDA']
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN
                    ]
                ]
            ],

            // All cells alignment
            'A:L' => [
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN
                    ]
                ]
            ],

            // Currency columns right alignment
            'E:L' => ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]],
        ];
    }
}

/**
 * Calculation Breakdown Sheet
 */
class CalculationBreakdownSheet implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    private $invoice;

    public function __construct(GeneratedInvoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function collection()
    {
        $breakdown = $this->invoice->calculation_breakdown;

        // Handle the case where calculation_breakdown is an array of employee data
        if (is_array($breakdown) && isset($breakdown[0])) {
            $employeeData = $breakdown[0];

            return collect([
                // Employee Information
                ['EMPLOYEE DETAILS', ''],
                ['Staff Name', $employeeData['staff_name'] ?? 'N/A'],
                ['Staff Number', $employeeData['staff_number'] ?? 'N/A'],
                ['Staff ID', $employeeData['staff_id'] ?? 'N/A'],
                ['Pay Grade', $employeeData['pay_grade'] ?? 'N/A'],
                ['Days Worked', $employeeData['days_worked'] ?? 'N/A'],
                ['Attendance Factor', number_format($employeeData['attendance_factor'] ?? 0, 4)],
                ['', ''],

                // Salary Breakdown
                ['SALARY BREAKDOWN', ''],
                ['Basic Amount', '₦' . number_format((float)($employeeData['basic_amount'] ?? 0), 2)],
                ['Gross Amount', '₦' . number_format((float)($employeeData['gross_amount'] ?? 0), 2)],
                ['Deductions', '₦' . number_format((float)($employeeData['deductions'] ?? 0), 2)],
                ['Net Amount', '₦' . number_format((float)($employeeData['net_amount'] ?? 0), 2)],
                ['Total Amount', '₦' . number_format((float)($employeeData['total_amount'] ?? 0), 2)],
                ['', ''],

                // Template Information
                ['TEMPLATE INFORMATION', ''],
                ['Template ID', $employeeData['calculation_breakdown']['template_id'] ?? 'N/A'],
                ['Template Name', $employeeData['calculation_breakdown']['template_name'] ?? 'N/A'],
                ['Employee Code', $employeeData['calculation_breakdown']['employee_code'] ?? 'N/A'],
                ['Calculated At', $employeeData['calculation_breakdown']['calculated_at'] ?? 'N/A'],
                ['', ''],

                // Statutory Deductions
                ['STATUTORY DEDUCTIONS', ''],
                ['PAYE', '₦' . number_format((float)($employeeData['calculation_breakdown']['statutory_deductions']['paye'] ?? 0), 2)],
                ['NSITF', '₦' . number_format((float)($employeeData['calculation_breakdown']['statutory_deductions']['nsitf'] ?? 0), 2)],
                ['Pension', '₦' . number_format((float)($employeeData['calculation_breakdown']['statutory_deductions']['pension'] ?? 0), 2)],
                ['', ''],

                // Final Totals
                ['FINAL CALCULATION', ''],
                ['Gross Salary', '₦' . number_format((float)($employeeData['calculation_breakdown']['gross_salary'] ?? 0), 2)],
                ['Net Salary', '₦' . number_format((float)($employeeData['calculation_breakdown']['net_salary'] ?? 0), 2)],
                ['Credit to Bank', '₦' . number_format((float)($employeeData['calculation_breakdown']['credit_to_bank'] ?? 0), 2)]
            ]);
        }

        // Fallback for unknown structure
        return collect([
            ['CALCULATION BREAKDOWN', ''],
            ['No detailed breakdown available', ''],
            ['Gross Payroll', '₦' . number_format((float)$this->invoice->gross_payroll, 2)],
            ['Net Payroll', '₦' . number_format((float)$this->invoice->net_payroll, 2)],
            ['Total Invoice Amount', '₦' . number_format((float)$this->invoice->total_invoice_amount, 2)]
        ]);
    }

    public function headings(): array
    {
        return ['Description', 'Amount'];
    }

    public function title(): string
    {
        return 'Calculation Breakdown';
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Section headers
            '1:1' => ['font' => ['bold' => true, 'size' => 12]],
            '11:11' => ['font' => ['bold' => true, 'size' => 12]],
            '21:21' => ['font' => ['bold' => true, 'size' => 12]],

            // Total row
            '26:26' => [
                'font' => ['bold' => true, 'size' => 12],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'FFFF00']
                ]
            ],

            // Currency alignment
            'B:B' => ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]],
        ];
    }
}
