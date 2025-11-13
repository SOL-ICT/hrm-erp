<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithMapping;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use App\Services\TemplateBasedCalculationService;

/**
 * FiduciaInvoiceExport
 * 
 * Excel export class for FIDUCIA template-based invoice results
 * Shows individual employees with FIDUCIA template column structure
 * 
 * Columns: Employee ID, Employee Name, Days Worked, Gross Monthly Salary, 
 *         Operational Reimbursable, Total Outsourcing & Statutory Cost, 
 *         Total Staff Cost, Agency Fee, VAT on Agency fee, Total Cost of Employment
 */
class FiduciaInvoiceExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithMapping
{
    protected $attendanceRecords;
    protected $client;
    protected $templateService;
    protected $calculations;

    public function __construct($attendanceRecords, $client)
    {
        $this->attendanceRecords = $attendanceRecords;
        $this->client = $client;
        $this->templateService = new TemplateBasedCalculationService();
        $this->calculations = [];

        // Pre-calculate all employee data
        $this->prepareCalculations();
    }

    /**
     * Pre-calculate all employee data with FIDUCIA template structure
     */
    private function prepareCalculations()
    {
        foreach ($this->attendanceRecords as $record) {
            // Get client's pay calculation basis
            $payBasis = $this->client->pay_calculation_basis ?? 'calendar_days';

            // Calculate total days based on client's pay calculation basis
            $currentMonth = now();
            $totalDays = $this->getTotalDaysForPayBasis($payBasis, $currentMonth->month, $currentMonth->year);

            // Calculate attendance factor
            $attendanceFactor = min($record->days_worked / $totalDays, 1.0);

            // Prepare attendance context for proration calculations
            $attendanceContext = [
                'days_worked' => $record->days_worked,
                'total_days' => $totalDays,
                'calculation_basis' => $payBasis
            ];

            // Use TemplateBasedCalculationService for actual calculations
            $calculationResult = $this->templateService->calculateFromTemplate(
                $record->staff,
                $this->client->id,
                $attendanceFactor,
                $attendanceContext
            );

            // Extract FIDUCIA template components
            $grossMonthlySalary = 0;
            $operationalReimbursable = 0;
            $totalOutsourcing = 0;

            // Use gross salary from calculation result (includes all salary components)
            $grossMonthlySalary = $calculationResult['gross_salary'] ?? 0;

            // Get outsourcing/statutory components from statutory_deductions
            if (isset($calculationResult['statutory_deductions']) && is_array($calculationResult['statutory_deductions'])) {
                $totalOutsourcing = array_sum($calculationResult['statutory_deductions']);
            }

            // Calculate other FIDUCIA columns
            $totalStaffCost = $grossMonthlySalary + $operationalReimbursable + $totalOutsourcing;

            // Agency Fee (10% of Total Staff Cost based on FIDUCIA template)
            $agencyFee = $totalStaffCost * 0.10;

            // VAT on Agency Fee (7.5% based on FIDUCIA template)
            $vatOnAgencyFee = $agencyFee * 0.075;

            // Total Cost of Employment
            $totalCostOfEmployment = $totalStaffCost + $agencyFee + $vatOnAgencyFee;

            $this->calculations[] = [
                'employee_id' => $record->staff->employee_code,
                'employee_name' => $record->staff->full_name,
                'days_worked' => $record->days_worked,
                'gross_monthly_salary' => $grossMonthlySalary,
                'operational_reimbursable' => $operationalReimbursable,
                'total_outsourcing' => $totalOutsourcing,
                'total_staff_cost' => $totalStaffCost,
                'agency_fee' => $agencyFee,
                'vat_on_agency_fee' => $vatOnAgencyFee,
                'total_cost_of_employment' => $totalCostOfEmployment
            ];
        }
    }

    /**
     * Get total days for pay calculation basis
     */
    private function getTotalDaysForPayBasis(string $payBasis, int $month, int $year): int
    {
        if ($payBasis === 'working_days') {
            // Calculate working days (exclude weekends)
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
            // Calendar days - all days in month
            $date = \Carbon\Carbon::createFromDate($year, $month, 1);
            return $date->daysInMonth;
        }
    }

    /**
     * Return collection of calculations
     */
    public function collection()
    {
        return collect($this->calculations);
    }

    /**
     * Map calculation data to export format
     */
    public function map($calculation): array
    {
        return [
            $calculation['employee_id'],
            $calculation['employee_name'],
            $calculation['days_worked'],
            $calculation['gross_monthly_salary'],
            $calculation['operational_reimbursable'],
            $calculation['total_outsourcing'],
            $calculation['total_staff_cost'],
            $calculation['agency_fee'],
            $calculation['vat_on_agency_fee'],
            $calculation['total_cost_of_employment']
        ];
    }

    /**
     * Define column headings based on FIDUCIA template
     */
    public function headings(): array
    {
        return [
            'Employee ID',
            'Employee Name',
            'Days Worked',
            'Gross Monthly Salary',
            'Operational Reimbursable',
            'Total Outsourcing & Statutory Cost',
            'Total Staff Cost',
            'Agency Fee',
            'VAT on Agency fee',
            'Total Cost of Employment'
        ];
    }

    /**
     * Define column widths
     */
    public function columnWidths(): array
    {
        return [
            'A' => 15, // Employee ID
            'B' => 25, // Employee Name
            'C' => 12, // Days Worked
            'D' => 18, // Gross Monthly Salary
            'E' => 20, // Operational Reimbursable
            'F' => 25, // Total Outsourcing & Statutory Cost
            'G' => 15, // Total Staff Cost
            'H' => 15, // Agency Fee
            'I' => 18, // VAT on Agency fee
            'J' => 20, // Total Cost of Employment
        ];
    }

    /**
     * Style the worksheet
     */
    public function styles(Worksheet $sheet)
    {
        $lastRow = count($this->calculations) + 1;

        // Header row styling - FIDUCIA template colors
        $sheet->getStyle('A1:J1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ]);

        // Apply FIDUCIA template header colors
        // Gross Monthly Salary - Blue
        $sheet->getStyle('D1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '9DC3E6'] // Light blue
            ]
        ]);

        // Operational Reimbursable - Blue  
        $sheet->getStyle('E1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '9DC3E6'] // Light blue
            ]
        ]);

        // Total Outsourcing & Statutory Cost - Blue
        $sheet->getStyle('F1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '9DC3E6'] // Light blue  
            ]
        ]);

        // Total Staff Cost - Red
        $sheet->getStyle('G1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'C55A5A'] // Red
            ]
        ]);

        // Agency Fee - Gray
        $sheet->getStyle('H1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '7F7F7F'] // Gray
            ]
        ]);

        // VAT on Agency fee - Light Orange
        $sheet->getStyle('I1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F4B183'] // Light orange
            ]
        ]);

        // Total Cost of Employment - Dark Blue
        $sheet->getStyle('J1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '5B9BD5'] // Dark blue
            ]
        ]);

        // Employee info columns - standard styling
        $sheet->getStyle('A1:C1')->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4'] // Standard blue
            ]
        ]);

        // Format currency columns
        $currencyColumns = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
        foreach ($currencyColumns as $col) {
            $sheet->getStyle("{$col}2:{$col}{$lastRow}")->getNumberFormat()
                ->setFormatCode('₦#,##0.00');
        }

        // Center align numeric columns
        $sheet->getStyle("C2:J{$lastRow}")->applyFromArray([
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER
            ]
        ]);

        // Add borders to all cells
        $sheet->getStyle("A1:J{$lastRow}")->applyFromArray([
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
