<?php

namespace App\Services;

use App\Models\PayrollRun;
use App\Models\PayrollItem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use PHPExcel;
use PHPExcel_Writer_Excel2007;
use PHPExcel_Style_Fill;
use PHPExcel_Style_Alignment;
use PHPExcel_Style_Border;
use PHPExcel_Style_NumberFormat;
use Carbon\Carbon;

/**
 * Payroll Export Service
 * 
 * Generates Excel workbook for payroll runs with multiple sheets:
 * 1. Summary - Payroll run overview and totals
 * 2. Employee Details - Complete payroll breakdown per staff
 * 3. Statutory Deductions - PAYE, Pension, NHF summary
 * 4. Bank Transfer - Account numbers and net pay for bank upload
 */
class PayrollExportService
{
    /**
     * Generate Excel export for payroll run
     * 
     * @param PayrollRun $run Payroll run with items
     * @return array ['success' => bool, 'file_path' => string, 'download' => Response]
     */
    public function generatePayrollExcel(PayrollRun $run)
    {
        try {
            // Load payroll items with staff relationship
            $run->load(['payrollItems.staff', 'client']);

            // Create new PHPExcel object
            $excel = new PHPExcel();
            $excel->getProperties()
                ->setCreator('HRM-ERP System')
                ->setTitle('Payroll Export - ' . Carbon::create($run->year, $run->month)->format('F Y'))
                ->setSubject('Payroll Run #' . $run->id)
                ->setDescription('Generated on ' . now()->format('Y-m-d H:i:s'));

            // Generate each sheet
            $this->generateSummarySheet($excel, $run);
            $this->generateEmployeeDetailsSheet($excel, $run);
            $this->generateStatutoryDeductionsSheet($excel, $run);
            $this->generateBankTransferSheet($excel, $run);

            // Set active sheet to first
            $excel->setActiveSheetIndex(0);

            // Generate filename
            $clientName = str_replace(' ', '_', $run->client->client_name ?? 'Unknown');
            $period = Carbon::create($run->year, $run->month)->format('Y_m');
            $filename = "Payroll_{$clientName}_{$period}_{$run->id}.xlsx";
            $filePath = "payroll_exports/{$filename}";

            // Save to storage
            $writer = new PHPExcel_Writer_Excel2007($excel);
            $tempFile = storage_path('app/' . $filePath);

            // Create directory if not exists
            $directory = dirname($tempFile);
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            $writer->save($tempFile);

            // Create download response
            $download = response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(false); // Keep file for records

            return [
                'success' => true,
                'file_path' => $filePath,
                'download' => $download,
                'message' => 'Payroll Excel generated successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Payroll Excel generation failed', [
                'run_id' => $run->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate Excel: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Sheet 1: Summary
     * Overview of payroll run with key metrics
     */
    private function generateSummarySheet(PHPExcel $excel, PayrollRun $run)
    {
        $sheet = $excel->getActiveSheet();
        $sheet->setTitle('Summary');

        $period = Carbon::create($run->year, $run->month)->format('F Y');

        // Title
        $sheet->setCellValue('A1', 'PAYROLL RUN SUMMARY');
        $sheet->mergeCells('A1:D1');
        $this->styleHeader($sheet, 'A1:D1');

        // Payroll details
        $row = 3;
        $data = [
            ['Client:', $run->client->client_name ?? 'N/A'],
            ['Period:', $period],
            ['Run ID:', $run->id],
            ['Status:', strtoupper($run->status)],
            ['Calculated On:', $run->calculation_date ? $run->calculation_date->format('Y-m-d H:i:s') : 'N/A'],
            ['Approved On:', $run->approved_at ? $run->approved_at->format('Y-m-d H:i:s') : 'N/A'],
            [''],
            ['PAYROLL TOTALS', ''],
            ['Total Staff Count:', $run->total_staff_count],
            ['Total Gross Pay:', '₦' . number_format($run->total_gross_pay, 2)],
            ['Total Deductions:', '₦' . number_format($run->total_deductions, 2)],
            ['Total Net Pay:', '₦' . number_format($run->total_net_pay, 2)],
            ['Total Credit to Bank:', '₦' . number_format($run->total_credit_to_bank, 2)],
        ];

        foreach ($data as $rowData) {
            $sheet->setCellValue('A' . $row, $rowData[0]);
            $sheet->setCellValue('B' . $row, $rowData[1] ?? '');

            // Bold labels
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);

            $row++;
        }

        // Auto-size columns
        $sheet->getColumnDimension('A')->setWidth(25);
        $sheet->getColumnDimension('B')->setWidth(40);
    }

    /**
     * Sheet 2: Employee Details
     * Complete breakdown for each employee
     */
    private function generateEmployeeDetailsSheet(PHPExcel $excel, PayrollRun $run)
    {
        $sheet = $excel->createSheet();
        $sheet->setTitle('Employee Details');

        // Headers
        $headers = [
            'S/N',
            'Staff Code',
            'Staff Name',
            'Pay Grade',
            'Bank Name',
            'Account Number',
            'Days Present',
            'Days Absent',
            'Total Days',
            'Proration %',
            'Annual Gross',
            'Monthly Gross',
            'Taxable Income',
            'PAYE Tax',
            'Pension',
            'Leave Deduction',
            '13th Month Deduction',
            'Other Deductions',
            'Total Deductions',
            'Net Pay',
            'Credit to Bank'
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }
        $this->styleHeader($sheet, 'A1:U1');

        // Data rows
        $row = 2;
        $sn = 1;

        foreach ($run->payrollItems as $item) {
            $sheet->setCellValue('A' . $row, $sn++);
            $sheet->setCellValue('B' . $row, $item->staff_code);
            $sheet->setCellValue('C' . $row, $item->staff_name);
            $sheet->setCellValue('D' . $row, $item->staff && $item->staff->payGrade ? $item->staff->payGrade->grade_name : 'N/A');
            $sheet->setCellValue('E' . $row, $item->bank_name ?? 'N/A');
            $sheet->setCellValue('F' . $row, $item->account_number ?? 'N/A');
            $sheet->setCellValue('G' . $row, $item->days_present);
            $sheet->setCellValue('H' . $row, $item->days_absent);
            $sheet->setCellValue('I' . $row, $item->total_days);
            $sheet->setCellValue('J' . $row, $item->proration_factor * 100);
            $sheet->setCellValue('K' . $row, $item->annual_gross_salary);
            $sheet->setCellValue('L' . $row, $item->monthly_gross);
            $sheet->setCellValue('M' . $row, $item->taxable_income);
            $sheet->setCellValue('N' . $row, $item->paye_tax);
            $sheet->setCellValue('O' . $row, $item->pension_deduction);
            $sheet->setCellValue('P' . $row, $item->leave_allowance_deduction);
            $sheet->setCellValue('Q' . $row, $item->thirteenth_month_deduction);
            $sheet->setCellValue('R' . $row, $item->other_deductions);
            $sheet->setCellValue('S' . $row, $item->total_deductions);
            $sheet->setCellValue('T' . $row, $item->net_pay);
            $sheet->setCellValue('U' . $row, $item->credit_to_bank);

            // Format currency columns
            $currencyCols = ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'];
            foreach ($currencyCols as $currCol) {
                $sheet->getStyle($currCol . $row)->getNumberFormat()
                    ->setFormatCode('₦#,##0.00');
            }

            // Format percentage
            $sheet->getStyle('J' . $row)->getNumberFormat()->setFormatCode('0.00"%"');

            $row++;
        }

        // Totals row
        $sheet->setCellValue('A' . $row, 'TOTAL');
        $sheet->mergeCells('A' . $row . ':F' . $row);
        $sheet->setCellValue('L' . $row, $run->total_gross_pay);
        $sheet->setCellValue('S' . $row, $run->total_deductions);
        $sheet->setCellValue('T' . $row, $run->total_net_pay);
        $sheet->setCellValue('U' . $row, $run->total_credit_to_bank);

        $this->styleTotalsRow($sheet, 'A' . $row . ':U' . $row);

        // Auto-size columns
        for ($col = 'A'; $col <= 'U'; $col++) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Sheet 3: Statutory Deductions
     * Summary of PAYE, Pension, NHF, etc.
     */
    private function generateStatutoryDeductionsSheet(PHPExcel $excel, PayrollRun $run)
    {
        $sheet = $excel->createSheet();
        $sheet->setTitle('Statutory Deductions');

        // Headers
        $headers = ['S/N', 'Staff Code', 'Staff Name', 'Gross Pay', 'PAYE Tax', 'Pension (Employee)', 'NHF', 'Total Statutory'];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }
        $this->styleHeader($sheet, 'A1:H1');

        // Data rows
        $row = 2;
        $sn = 1;
        $totalPaye = 0;
        $totalPension = 0;
        $totalNhf = 0;

        foreach ($run->payrollItems as $item) {
            // Calculate NHF (2.5% of basic salary - stored in emoluments_snapshot)
            $nhf = 0; // Placeholder - would need to calculate from snapshot

            $sheet->setCellValue('A' . $row, $sn++);
            $sheet->setCellValue('B' . $row, $item->staff_code);
            $sheet->setCellValue('C' . $row, $item->staff_name);
            $sheet->setCellValue('D' . $row, $item->monthly_gross);
            $sheet->setCellValue('E' . $row, $item->paye_tax);
            $sheet->setCellValue('F' . $row, $item->pension_deduction);
            $sheet->setCellValue('G' . $row, $nhf);
            $sheet->setCellValue('H' . $row, $item->paye_tax + $item->pension_deduction + $nhf);

            // Track totals
            $totalPaye += $item->paye_tax;
            $totalPension += $item->pension_deduction;
            $totalNhf += $nhf;

            // Format currency
            for ($currCol = 'D'; $currCol <= 'H'; $currCol++) {
                $sheet->getStyle($currCol . $row)->getNumberFormat()
                    ->setFormatCode('₦#,##0.00');
            }

            $row++;
        }

        // Totals row
        $sheet->setCellValue('A' . $row, 'TOTAL');
        $sheet->mergeCells('A' . $row . ':C' . $row);
        $sheet->setCellValue('D' . $row, $run->total_gross_pay);
        $sheet->setCellValue('E' . $row, $totalPaye);
        $sheet->setCellValue('F' . $row, $totalPension);
        $sheet->setCellValue('G' . $row, $totalNhf);
        $sheet->setCellValue('H' . $row, $totalPaye + $totalPension + $totalNhf);

        $this->styleTotalsRow($sheet, 'A' . $row . ':H' . $row);

        // Auto-size columns
        for ($col = 'A'; $col <= 'H'; $col++) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Sheet 4: Bank Transfer
     * Simple format for bank upload - account numbers and net pay only
     */
    private function generateBankTransferSheet(PHPExcel $excel, PayrollRun $run)
    {
        $sheet = $excel->createSheet();
        $sheet->setTitle('Bank Transfer');

        // Headers
        $headers = ['S/N', 'Staff Code', 'Staff Name', 'Bank Name', 'Account Number', 'Credit Amount'];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }
        $this->styleHeader($sheet, 'A1:F1');

        // Data rows
        $row = 2;
        $sn = 1;

        foreach ($run->payrollItems as $item) {
            $sheet->setCellValue('A' . $row, $sn++);
            $sheet->setCellValue('B' . $row, $item->staff_code);
            $sheet->setCellValue('C' . $row, $item->staff_name);
            $sheet->setCellValue('D' . $row, $item->bank_name ?? 'N/A');
            $sheet->setCellValue('E' . $row, $item->account_number ?? 'N/A');
            $sheet->setCellValue('F' . $row, $item->credit_to_bank);

            // Format currency
            $sheet->getStyle('F' . $row)->getNumberFormat()->setFormatCode('₦#,##0.00');

            $row++;
        }

        // Totals row
        $sheet->setCellValue('A' . $row, 'TOTAL TRANSFER AMOUNT');
        $sheet->mergeCells('A' . $row . ':E' . $row);
        $sheet->setCellValue('F' . $row, $run->total_credit_to_bank);

        $this->styleTotalsRow($sheet, 'A' . $row . ':F' . $row);

        // Auto-size columns
        for ($col = 'A'; $col <= 'F'; $col++) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Apply header styling
     */
    private function styleHeader(PHPExcel_Worksheet $sheet, $range)
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'fill' => [
                'type' => PHPExcel_Style_Fill::FILL_SOLID,
                'color' => ['rgb' => '4472C4']
            ],
            'alignment' => [
                'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
                'vertical' => PHPExcel_Style_Alignment::VERTICAL_CENTER
            ],
            'borders' => [
                'allborders' => [
                    'style' => PHPExcel_Style_Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);

        $sheet->getRowDimension('1')->setRowHeight(25);
    }

    /**
     * Apply totals row styling
     */
    private function styleTotalsRow(PHPExcel_Worksheet $sheet, $range)
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true
            ],
            'fill' => [
                'type' => PHPExcel_Style_Fill::FILL_SOLID,
                'color' => ['rgb' => 'E7E6E6']
            ],
            'borders' => [
                'allborders' => [
                    'style' => PHPExcel_Style_Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);
    }
}
