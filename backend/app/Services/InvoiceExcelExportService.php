<?php

namespace App\Services;

use App\Models\GeneratedInvoice;
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
use Carbon\Carbon;

class InvoiceExcelExportService
{
    /**
     * Export invoice to Excel file
     */
    public static function exportInvoice($invoiceId, $savePath = null)
    {
        $invoice = GeneratedInvoice::with(['client', 'lineItems', 'attendanceUpload'])
            ->findOrFail($invoiceId);

        $filename = self::generateFilename($invoice);
        $filePath = $savePath ?? storage_path("app/invoices/{$filename}");

        // Ensure directory exists
        $directory = dirname($filePath);
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        if ($invoice->invoice_type === 'with_schedule') {
            // Multi-sheet workbook for detailed invoice
            Excel::store(new DetailedInvoiceExport($invoice), $filePath);
        } else {
            // Single sheet for summary invoice
            Excel::store(new SummaryInvoiceExport($invoice), $filePath);
        }

        // Update invoice record with file path
        $invoice->update(['excel_file_path' => $filePath]);

        return $filePath;
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
            '20:20' => ['font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']]],
            '22:22' => ['font' => ['bold' => true, 'size' => 12]],

            // Total row background
            '20:20' => [
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4']
                ]
            ],

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

        return collect([
            // Payroll Summary
            ['PAYROLL SUMMARY', ''],
            ['Total Employees', $breakdown['payroll_summary']['total_employees']],
            ['Gross Payroll', '₦' . number_format((float)($breakdown['payroll_summary']['gross_payroll'] ?? 0), 2)],
            ['Total PAYE', '₦' . number_format((float)($breakdown['payroll_summary']['total_paye'] ?? 0), 2)],
            ['Total NHF', '₦' . number_format((float)($breakdown['payroll_summary']['total_nhf'] ?? 0), 2)],
            ['Total NSITF', '₦' . number_format((float)($breakdown['payroll_summary']['total_nsitf'] ?? 0), 2)],
            ['Other Deductions', '₦' . number_format((float)($breakdown['payroll_summary']['total_other_deductions'] ?? 0), 2)],
            ['Total Deductions', '₦' . number_format((float)($breakdown['payroll_summary']['total_deductions'] ?? 0), 2)],
            ['Net Payroll', '₦' . number_format($breakdown['payroll_summary']['net_payroll'], 2)],
            ['', ''],

            // Fees Calculation
            ['FEES CALCULATION', ''],
            ['Management Fee Rate', $breakdown['fees_and_taxes']['management_fee']['rate']],
            ['Management Fee Calculation', $breakdown['fees_and_taxes']['management_fee']['calculation']],
            ['Management Fee Amount', '₦' . number_format($breakdown['fees_and_taxes']['management_fee']['amount'], 2)],
            ['', ''],
            ['VAT Rate', $breakdown['fees_and_taxes']['vat']['rate']],
            ['VAT Calculation', $breakdown['fees_and_taxes']['vat']['calculation']],
            ['VAT Amount', '₦' . number_format($breakdown['fees_and_taxes']['vat']['amount'], 2)],
            ['', ''],
            ['WHT Amount', '₦' . number_format($breakdown['fees_and_taxes']['wht']['amount'], 2)],
            ['', ''],

            // Final Calculation
            ['INVOICE CALCULATION', ''],
            ['Net Payroll', '₦' . number_format($breakdown['invoice_calculation']['net_payroll'], 2)],
            ['Add: Management Fee', '₦' . number_format($breakdown['invoice_calculation']['add_management_fee'], 2)],
            ['Add: VAT', '₦' . number_format($breakdown['invoice_calculation']['add_vat'], 2)],
            ['Less: WHT', '₦' . number_format($breakdown['invoice_calculation']['less_wht'], 2)],
            ['TOTAL INVOICE AMOUNT', '₦' . number_format($breakdown['invoice_calculation']['total_invoice_amount'], 2)]
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
