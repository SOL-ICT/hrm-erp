<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class StaffTemplateExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $templateData;
    protected $clientInfo;

    public function __construct($templateData, $clientInfo)
    {
        $this->templateData = $templateData;
        $this->clientInfo = $clientInfo;
    }

    /**
     * Return the headings for the Excel file
     */
    public function headings(): array
    {
        return array_values($this->templateData['template_headers']);
    }

    /**
     * Return the data array for the Excel file
     */
    public function array(): array
    {
        // Return sample data and empty rows for user input
        return [
            // Sample row with example data
            array_values($this->templateData['sample_data']),
            // Add 4 empty rows for user input
            array_fill(0, count($this->templateData['template_headers']), ''),
            array_fill(0, count($this->templateData['template_headers']), ''),
            array_fill(0, count($this->templateData['template_headers']), ''),
            array_fill(0, count($this->templateData['template_headers']), ''),
        ];
    }

    /**
     * Apply styles to the worksheet
     */
    public function styles(Worksheet $sheet)
    {
        $headerRowIndex = 4; // After instructions
        $sampleRowIndex = 5;
        $lastColumn = chr(64 + count($this->templateData['template_headers'])); // Convert to letter

        // Header row styling
        $sheet->getStyle("A{$headerRowIndex}:{$lastColumn}{$headerRowIndex}")
            ->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 12,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5'], // Indigo background
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);

        // Sample row styling
        $sheet->getStyle("A{$sampleRowIndex}:{$lastColumn}{$sampleRowIndex}")
            ->applyFromArray([
                'font' => [
                    'italic' => true,
                    'color' => ['rgb' => '6B7280'], // Gray text
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'F3F4F6'], // Light gray background
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'D1D5DB'],
                    ],
                ],
            ]);

        // Data rows styling (empty rows for user input)
        for ($row = 6; $row <= 9; $row++) {
            $sheet->getStyle("A{$row}:{$lastColumn}{$row}")
                ->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'E5E7EB'],
                        ],
                    ],
                ]);
        }

        return $sheet;
    }

    /**
     * Set column widths
     */
    public function columnWidths(): array
    {
        $widths = [];
        $headers = array_keys($this->templateData['template_headers']);

        foreach ($headers as $index => $header) {
            $columnLetter = chr(65 + $index); // A, B, C, etc.

            // Set specific widths based on field type
            switch ($header) {
                case 'employee_code':
                case 'staff_id':
                    $widths[$columnLetter] = 15;
                    break;
                case 'first_name':
                case 'last_name':
                case 'middle_name':
                    $widths[$columnLetter] = 20;
                    break;
                case 'email':
                    $widths[$columnLetter] = 25;
                    break;
                case 'phone_number':
                case 'emergency_contact_phone':
                    $widths[$columnLetter] = 18;
                    break;
                case 'address':
                case 'emergency_contact_address':
                    $widths[$columnLetter] = 30;
                    break;
                case 'date_of_birth':
                case 'hire_date':
                case 'contract_start_date':
                case 'contract_end_date':
                    $widths[$columnLetter] = 15;
                    break;
                case 'national_id':
                case 'passport_number':
                    $widths[$columnLetter] = 20;
                    break;
                case 'pay_grade_structure_id':
                case 'service_location_id':
                    $widths[$columnLetter] = 18;
                    break;
                default:
                    $widths[$columnLetter] = 15;
            }
        }

        return $widths;
    }

    /**
     * Set the worksheet title
     */
    public function title(): string
    {
        return 'Staff Upload Template';
    }

    /**
     * Register events to customize the worksheet
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastColumn = chr(64 + count($this->templateData['template_headers']));

                // Insert instructions at the top
                $sheet->insertNewRowBefore(1, 3);

                // Add instructions
                $sheet->setCellValue('A1', 'STAFF UPLOAD TEMPLATE');
                $sheet->setCellValue('A2', "Client: {$this->clientInfo['name']} | Ticket: {$this->clientInfo['ticket_code']} - {$this->clientInfo['job_title']}");
                $sheet->setCellValue('A3', 'Instructions: Row 5 contains sample data. Delete this row and add your staff data starting from row 5.');

                // Style instructions
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => '1F2937']],
                ]);
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '059669']],
                ]);
                $sheet->getStyle('A3')->applyFromArray([
                    'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => 'DC2626']],
                ]);

                // Merge cells for instructions
                $sheet->mergeCells("A1:{$lastColumn}1");
                $sheet->mergeCells("A2:{$lastColumn}2");
                $sheet->mergeCells("A3:{$lastColumn}3");

                // Add pay grades information starting from row 11
                $startRow = 11;
                $sheet->setCellValue('A' . $startRow, 'AVAILABLE PAY GRADES (Use Pay Grade ID in column O above):');
                $sheet->setCellValue('A' . ($startRow + 1), 'Pay Grade ID');
                $sheet->setCellValue('B' . ($startRow + 1), 'Pay Grade Name');
                $sheet->setCellValue('C' . ($startRow + 1), 'Total Compensation');

                // Style pay grades header
                $sheet->getStyle('A' . $startRow)->applyFromArray([
                    'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '1F2937']],
                ]);
                $sheet->getStyle('A' . ($startRow + 1) . ':C' . ($startRow + 1))->applyFromArray([
                    'font' => ['bold' => true],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'E5E7EB'],
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000'],
                        ],
                    ],
                ]);

                // Add pay grade data
                $row = $startRow + 2;
                foreach ($this->templateData['pay_grades'] as $pg) {
                    $sheet->setCellValue('A' . $row, $pg['id']);
                    $sheet->setCellValue('B' . $row, $pg['name'] ?? $pg['grade_name']);
                    $sheet->setCellValue('C' . $row, '₦' . number_format($pg['total_compensation'] ?? 0));
                    $row++;
                }

                // Add service locations information after pay grades
                $locationStartRow = $row + 2;
                $sheet->setCellValue('A' . $locationStartRow, 'AVAILABLE SERVICE LOCATIONS (Use Location ID in column P above):');
                $sheet->setCellValue('A' . ($locationStartRow + 1), 'Location ID');
                $sheet->setCellValue('B' . ($locationStartRow + 1), 'Location Name');
                $sheet->setCellValue('C' . ($locationStartRow + 1), 'City');
                $sheet->setCellValue('D' . ($locationStartRow + 1), 'State');

                // Style service locations header
                $sheet->getStyle('A' . $locationStartRow)->applyFromArray([
                    'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '1F2937']],
                ]);
                $sheet->getStyle('A' . ($locationStartRow + 1) . ':D' . ($locationStartRow + 1))->applyFromArray([
                    'font' => ['bold' => true],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'E5E7EB'],
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000'],
                        ],
                    ],
                ]);

                // Add service location data
                $locRow = $locationStartRow + 2;
                foreach ($this->templateData['service_locations'] as $location) {
                    $sheet->setCellValue('A' . $locRow, $location['id']);
                    $sheet->setCellValue('B' . $locRow, $location['location_name']);
                    $sheet->setCellValue('C' . $locRow, $location['city']);
                    $sheet->setCellValue('D' . $locRow, $location['state'] ?? 'N/A');
                    $locRow++;
                }
            },
        ];
    }
}
