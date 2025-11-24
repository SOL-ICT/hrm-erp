<?php

namespace App\Exports;

use App\Models\PayrollRun;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use Carbon\Carbon;

/**
 * Payroll Run Export
 * 
 * Exports payroll run data to Excel with proper formatting
 * Uses Laravel Excel (maatwebsite/excel) package
 */
class PayrollRunExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles, WithColumnWidths
{
    protected $payrollRun;

    public function __construct(PayrollRun $payrollRun)
    {
        $this->payrollRun = $payrollRun;
    }

    /**
     * Get the collection of payroll items
     */
    public function collection()
    {
        return $this->payrollRun->payrollItems;
    }

    /**
     * Define the headings for the Excel sheet
     */
    public function headings(): array
    {
        $period = Carbon::create($this->payrollRun->year, $this->payrollRun->month)->format('F Y');
        $client = $this->payrollRun->client->organisation_name ?? 'N/A';

        return [
            ["Payroll Export"],
            ["Client: {$client}"],
            ["Period: {$period}"],
            ["Generated: " . now()->format('Y-m-d H:i:s')],
            [], // Empty row
            [ // Column headers
                'Staff Name',
                'Staff Code',
                'Bank Name',
                'Account Number',
                'Days Present',
                'Days Absent',
                'Annual Gross',
                'Monthly Gross',
                'Taxable Income',
                'PAYE Tax',
                'Pension',
                'Leave Allowance',
                '13th Month',
                'Other Deductions',
                'Total Deductions',
                'Net Pay',
                'Reimbursables',
                'Credit to Bank',
            ]
        ];
    }

    /**
     * Map each payroll item to a row
     */
    public function map($item): array
    {
        return [
            $item->staff_name,
            $item->staff_code,
            $item->bank_name,
            $item->account_number,
            $item->days_present,
            $item->days_absent,
            (float) $item->annual_gross_salary,
            (float) $item->monthly_gross,
            (float) $item->taxable_income,
            (float) $item->paye_tax,
            (float) $item->pension_deduction,
            (float) $item->leave_allowance_deduction,
            (float) $item->thirteenth_month_deduction,
            (float) $item->other_deductions,
            (float) $item->total_deductions,
            (float) $item->net_pay,
            (float) $item->monthly_reimbursables,
            (float) $item->credit_to_bank,
        ];
    }

    /**
     * Sheet title
     */
    public function title(): string
    {
        return 'Payroll Details';
    }

    /**
     * Apply styles to the worksheet
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Style the title row (row 1)
            1 => [
                'font' => ['bold' => true, 'size' => 14],
            ],
            // Style the header row (row 6)
            6 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4']
                ],
            ],
        ];
    }

    /**
     * Define column widths
     */
    public function columnWidths(): array
    {
        return [
            'A' => 25, // Staff Name
            'B' => 15, // Staff Code
            'C' => 20, // Bank Name
            'D' => 18, // Account Number
            'E' => 12, // Days Present
            'F' => 12, // Days Absent
            'G' => 18, // Annual Gross
            'H' => 15, // Monthly Gross
            'I' => 15, // Taxable Income
            'J' => 12, // PAYE Tax
            'K' => 12, // Pension
            'L' => 15, // Leave Allowance
            'M' => 12, // 13th Month
            'N' => 15, // Other Deductions
            'O' => 15, // Total Deductions
            'P' => 15, // Net Pay
            'Q' => 15, // Reimbursables
            'R' => 15, // Credit to Bank
        ];
    }
}
