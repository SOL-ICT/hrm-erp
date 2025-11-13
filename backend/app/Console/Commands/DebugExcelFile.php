<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;

class DebugExcelFile extends Command
{
    protected $signature = 'debug:excel {file}';
    protected $description = 'Debug Excel file contents';

    public function handle()
    {
        $filePath = $this->argument('file');

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        try {
            $spreadsheet = IOFactory::load($filePath);
            $sheet = $spreadsheet->getActiveSheet();

            $this->info("📊 Excel File Debug:");
            $this->info("Rows: " . $sheet->getHighestRow());
            $this->info("Columns: " . $sheet->getHighestColumn());
            $this->info("");

            // Show first few rows
            for ($row = 1; $row <= min(5, $sheet->getHighestRow()); $row++) {
                $rowData = [];
                for ($col = 'A'; $col <= 'N'; $col++) {
                    $value = $sheet->getCell($col . $row)->getValue();
                    if ($value !== null && $value !== '') {
                        $rowData[] = "{$col}={$value}";
                    }
                }
                $this->line("Row {$row}: " . implode(' | ', $rowData));
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("Error reading Excel file: " . $e->getMessage());
            return 1;
        }
    }
}
