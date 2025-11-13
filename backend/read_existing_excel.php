<?php

require __DIR__ . '/vendor/autoload.php';

// Initialize Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use PhpOffice\PhpSpreadsheet\IOFactory;

$filepath = '/var/www/storage/app/exports/FIDUCIA_Payroll_October 2025_20251014165626.xlsx';
if (file_exists($filepath)) {
    echo "Reading existing Excel file: " . basename($filepath) . "\n";

    $reader = IOFactory::createReader('Xlsx');
    $spreadsheet = $reader->load($filepath);

    echo "Sheets: " . $spreadsheet->getSheetCount() . "\n";

    for ($i = 0; $i < $spreadsheet->getSheetCount(); $i++) {
        $sheet = $spreadsheet->getSheet($i);
        echo "Sheet " . ($i + 1) . ": '" . $sheet->getTitle() . "'\n";

        // Show first few rows
        for ($row = 1; $row <= 5; $row++) {
            $rowData = [];
            for ($col = 'A'; $col <= 'F'; $col++) {
                $value = $sheet->getCell($col . $row)->getValue();
                if (!empty($value)) {
                    $rowData[] = $col . $row . ':' . $value;
                }
            }
            if ($rowData) {
                echo "  Row $row: " . implode(', ', $rowData) . "\n";
            }
        }
        echo "\n";
    }
} else {
    echo "File not found\n";
}
