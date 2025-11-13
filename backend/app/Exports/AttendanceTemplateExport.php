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

/**
 * AttendanceTemplateExport
 * 
 * Excel export class for attendance templates with pre-filled staff data
 * Generates user-friendly templates for attendance data collection
 * 
 * Phase 1.1: Staff Profile Export Functionality
 */
class AttendanceTemplateExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithMapping
{
    protected $staff;
    protected $client;
    protected $coverage;

    public function __construct($staff, $client, $coverage)
    {
        $this->staff = $staff;
        $this->client = $client;
        $this->coverage = $coverage;
    }

    /**
     * Return collection of staff for export
     */
    public function collection()
    {
        return $this->staff;
    }

    /**
     * Map staff data to export format
     */
    public function map($staff): array
    {
        return [
            $staff->employee_code,
            $staff->full_name,
            $staff->pay_grade_structure_id,
            null // days_worked - empty for user to fill
        ];
    }

    /**
     * Define column headings
     */
    public function headings(): array
    {
        return [
            'Employee Code',
            'Employee Name',
            'Pay Grade Structure ID',
            'Days Worked'
        ];
    }

    /**
     * Define column widths
     */
    public function columnWidths(): array
    {
        return [
            'A' => 15, // Employee Code
            'B' => 30, // Employee Name
            'C' => 25, // Pay Grade Structure ID
            'D' => 15, // Days Worked
        ];
    }

    /**
     * Style the worksheet
     */
    public function styles(Worksheet $sheet)
    {
        // Header row styling
        $sheet->getStyle('A1:D1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12
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

        // Data rows styling
        $lastRow = $this->staff->count() + 1;

        // Employee Code column (read-only appearance)
        $sheet->getStyle("A2:A{$lastRow}")->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F2F2F2']
            ],
            'font' => [
                'color' => ['rgb' => '666666']
            ]
        ]);

        // Employee Name column (read-only appearance)
        $sheet->getStyle("B2:B{$lastRow}")->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F2F2F2']
            ],
            'font' => [
                'color' => ['rgb' => '666666']
            ]
        ]);

        // Pay Grade Structure ID column (read-only appearance)
        $sheet->getStyle("C2:C{$lastRow}")->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F2F2F2']
            ],
            'font' => [
                'color' => ['rgb' => '666666']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER
            ]
        ]);

        // Days Worked column (editable appearance)
        $sheet->getStyle("D2:D{$lastRow}")->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E7F3FF']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER
            ]
        ]);

        // Add borders to all cells
        $sheet->getStyle("A1:D{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    'color' => ['rgb' => 'CCCCCC']
                ]
            ]
        ]);

        // Add instructions
        $this->addInstructions($sheet, $lastRow);

        return [];
    }

    /**
     * Add instructions to the worksheet
     */
    private function addInstructions(Worksheet $sheet, int $lastDataRow): void
    {
        $instructionRow = $lastDataRow + 3;

        // Add title
        $sheet->setCellValue("A{$instructionRow}", "INSTRUCTIONS:");
        $sheet->getStyle("A{$instructionRow}")->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 12,
                'color' => ['rgb' => '2F5F8F']
            ]
        ]);

        // Add instructions
        $instructions = [
            "1. Only fill the 'Days Worked' column (highlighted in blue)",
            "2. Do NOT modify Employee Code, Employee Name, or Pay Grade Structure ID",
            "3. Enter the number of days each employee worked (0-31)",
            "4. Save the file and upload it to the system for invoice generation",
            "5. Template generated for: {$this->client->organisation_name}",
            "6. Export date: " . date('Y-m-d H:i:s'),
            "7. Staff count: {$this->staff->count()} employees"
        ];

        foreach ($instructions as $index => $instruction) {
            $row = $instructionRow + 1 + $index;
            $sheet->setCellValue("A{$row}", $instruction);
            $sheet->getStyle("A{$row}")->applyFromArray([
                'font' => [
                    'size' => 10
                ]
            ]);
        }

        // Merge cells for instructions
        foreach ($instructions as $index => $instruction) {
            $row = $instructionRow + 1 + $index;
            $sheet->mergeCells("A{$row}:D{$row}");
        }

        // Add template coverage information
        $coverageRow = $instructionRow + count($instructions) + 3;
        $sheet->setCellValue("A{$coverageRow}", "TEMPLATE COVERAGE:");
        $sheet->getStyle("A{$coverageRow}")->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 11,
                'color' => ['rgb' => '2F5F8F']
            ]
        ]);

        foreach ($this->coverage as $index => $coverage) {
            if ($coverage['has_template']) {
                $row = $coverageRow + 1 + $index;
                $sheet->setCellValue("A{$row}", "✓ Pay Grade ID {$coverage['pay_grade_structure_id']}: Template Available");
                $sheet->getStyle("A{$row}")->applyFromArray([
                    'font' => [
                        'color' => ['rgb' => '008000'],
                        'size' => 10
                    ]
                ]);
                $sheet->mergeCells("A{$row}:D{$row}");
            }
        }
    }
}
