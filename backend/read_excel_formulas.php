<?php

require_once 'vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Read Excel formulas and calculations - not just the results
 */

try {
    echo "=== FIDUCIA TEMPLATE - FORMULAS AND CALCULATIONS ===\n\n";

    $excelPath = '../frontend/src/Fudicia template.xlsx';

    if (!file_exists($excelPath)) {
        echo "❌ Excel file not found at: {$excelPath}\n";
        exit(1);
    }

    echo "📁 Reading Excel file with formulas: {$excelPath}\n\n";

    $spreadsheet = IOFactory::load($excelPath);
    $worksheet = $spreadsheet->getActiveSheet();

    echo "📊 Sheet: " . $worksheet->getTitle() . "\n";
    echo "📏 Size: " . $worksheet->getHighestRow() . " rows × " . $worksheet->getHighestColumn() . " columns\n\n";

    $highestRow = $worksheet->getHighestRow();
    $highestCol = $worksheet->getHighestColumn();

    echo "=== ALL EXCEL DATA WITH FORMULAS ===\n";

    // Loop through all cells
    for ($row = 1; $row <= $highestRow; $row++) {
        echo "\n--- ROW $row ---\n";

        for ($col = 'A'; $col <= $highestCol; $col++) {
            $cellCoordinate = $col . $row;
            $cell = $worksheet->getCell($cellCoordinate, false);

            if ($cell !== null) {
                $calculatedValue = $cell->getCalculatedValue();
                $displayedValue = $cell->getFormattedValue();
                $formula = $cell->getValue();
                $dataType = $cell->getDataType();

                // Only show cells with content
                if (!empty($calculatedValue) || !empty($displayedValue) || !empty($formula)) {
                    echo "   $cellCoordinate:\n";
                    echo "      📊 Displayed: '$displayedValue'\n";
                    echo "      🔢 Calculated: '$calculatedValue'\n";
                    echo "      📝 Raw Formula: '$formula'\n";
                    echo "      🏷️  Data Type: $dataType\n";

                    // Check if this is a formula
                    if ($dataType === 'f') {
                        echo "      ⚡ FORMULA DETECTED: $formula\n";
                    }

                    // Check for specific calculations
                    if (is_string($formula)) {
                        if (strpos($formula, '=') === 0) {
                            echo "      🧮 CALCULATION: $formula\n";
                        }
                        if (strpos($formula, '+') !== false || strpos($formula, '*') !== false || strpos($formula, '/') !== false) {
                            echo "      🎯 MATH OPERATION DETECTED\n";
                        }
                    }
                    echo "\n";
                }
            }
        }
    }

    echo "\n=== FORMULA ANALYSIS ===\n";

    // Look specifically for formulas in key areas
    $keyAreas = [
        'G3' => 'Gross Monthly Salary',
        'H3' => 'Operational Reimbursable',
        'I3' => 'Total Outsourcing & Statutory Cost',
        'J3' => 'Total Staff Cost',
        'K3' => 'Agency Fee',
        'L3' => 'VAT on Agency fee',
        'M3' => 'Total Cost of Employment'
    ];

    foreach ($keyAreas as $cellRef => $description) {
        echo "\n🔍 Analyzing $cellRef ($description):\n";

        $cell = $worksheet->getCell($cellRef, false);
        if ($cell !== null) {
            $formula = $cell->getValue();
            $calculatedValue = $cell->getCalculatedValue();
            $dataType = $cell->getDataType();

            echo "   Value: " . number_format($calculatedValue, 2) . "\n";
            echo "   Formula: $formula\n";
            echo "   Type: $dataType\n";

            if ($dataType === 'f') {
                echo "   🎯 THIS IS A FORMULA: $formula\n";

                // Try to understand the formula
                if (strpos($formula, 'G3') !== false) echo "   📌 References G3 (Gross Salary)\n";
                if (strpos($formula, 'K3') !== false) echo "   📌 References K3 (Agency Fee)\n";
                if (strpos($formula, 'L3') !== false) echo "   📌 References L3 (VAT)\n";
                if (strpos($formula, 'J3') !== false) echo "   📌 References J3 (Total Staff Cost)\n";
                if (strpos($formula, '*') !== false) echo "   📌 Contains multiplication\n";
                if (strpos($formula, '+') !== false) echo "   📌 Contains addition\n";
                if (strpos($formula, '0.1') !== false || strpos($formula, '10%') !== false) echo "   📌 Contains 10% calculation\n";
                if (strpos($formula, '0.075') !== false || strpos($formula, '7.5%') !== false) echo "   📌 Contains 7.5% calculation\n";
            }
        } else {
            echo "   ❌ Cell $cellRef not found\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Formula Analysis Complete ===\n";
