<?php

require_once 'vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

echo "=== READING FIDUCIA TEMPLATE.XLSX STRUCTURE ===\n\n";

try {
    // Load the Excel file
    $excelFile = 'C:\Projects\hrm-erp\frontend\src\Fudicia template.xlsx';
    $spreadsheet = IOFactory::load($excelFile);
    $worksheet = $spreadsheet->getActiveSheet();

    echo "✅ Successfully loaded: " . basename($excelFile) . "\n";
    echo "📊 Sheet: " . $worksheet->getTitle() . "\n";
    echo "📏 Size: " . $worksheet->getHighestRow() . " rows × " . $worksheet->getHighestColumn() . " columns\n\n";

    echo "=== READING ALL CELL CONTENTS ===\n\n";

    // Read all data from the worksheet
    $highestRow = $worksheet->getHighestRow();
    $highestCol = $worksheet->getHighestColumn();

    for ($row = 1; $row <= $highestRow; $row++) {
        echo "--- ROW $row ---\n";
        for ($col = 'A'; $col <= $highestCol; $col++) {
            $cellCoordinate = $col . $row;
            $cell = $worksheet->getCell($cellCoordinate);

            // Get different representations of the cell
            $displayValue = $cell->getFormattedValue();
            $calculatedValue = $cell->getCalculatedValue();
            $rawValue = $cell->getValue();
            $dataType = $cell->getDataType();

            if ($displayValue !== null && $displayValue !== '') {
                echo "   $cellCoordinate:\n";
                echo "      📊 Display: '$displayValue'\n";
                echo "      🔢 Calculated: '$calculatedValue'\n";
                echo "      📝 Raw: '$rawValue'\n";
                echo "      🏷️  Type: $dataType\n";

                // Check if it's a formula
                if ($cell->getDataType() === 'f') {
                    echo "      ⚡ FORMULA: " . $rawValue . "\n";
                }
                echo "\n";
            }
        }
        echo "\n";
    }

    echo "=== ANALYZING STRUCTURE FOR DATABASE TEMPLATE ===\n\n";

    // Now let's interpret what we found and create the proper template structure
    echo "📋 Based on the Excel file analysis:\n";
    echo "   - This appears to be the same structure we analyzed before\n";
    echo "   - G3 contains the gross salary amount: " . $worksheet->getCell('G3')->getFormattedValue() . "\n";
    echo "   - K3 contains the agency fee: " . $worksheet->getCell('K3')->getFormattedValue() . "\n";
    echo "   - L3 contains the VAT: " . $worksheet->getCell('L3')->getFormattedValue() . "\n";
    echo "   - M3 contains the total: " . $worksheet->getCell('M3')->getFormattedValue() . "\n\n";

    // Extract the key values
    $grossFromExcel = $worksheet->getCell('G3')->getCalculatedValue();
    $agencyFeeFromExcel = $worksheet->getCell('K3')->getCalculatedValue();
    $vatFromExcel = $worksheet->getCell('L3')->getCalculatedValue();
    $totalFromExcel = $worksheet->getCell('M3')->getCalculatedValue();

    echo "📊 KEY AMOUNTS FROM EXCEL:\n";
    echo "   Gross Salary: ₦" . number_format($grossFromExcel, 2) . "\n";
    echo "   Agency Fee: ₦" . number_format($agencyFeeFromExcel, 2) . "\n";
    echo "   VAT: ₦" . number_format($vatFromExcel, 2) . "\n";
    echo "   Total: ₦" . number_format($totalFromExcel, 2) . "\n\n";

    echo "🎯 YOUR REQUIREMENTS:\n";
    echo "   - Gross should be calculated as sum of components, not hardcoded\n";
    echo "   - Components: BASIC(₦35,909.29) + HOUSING(₦17,575.96) + TRANSPORT(₦20,909.29) + UTILITY(₦40,409.29) + ANNUAL_LEAVE(₦2,500.00) + 13TH_MONTH(₦1,666.67)\n";
    echo "   - Total Outsourcing should include: ITF + Fidelity + Medical/Insurance + Background Check + Group Life + Employer's Contribution + ECA\n";
    echo "   - Service Fee: 10% of Total Staff Cost\n";
    echo "   - VAT: 7.5% of Service Fee\n";
    echo "   - Target Total: ₦147,413.28\n\n";

    // Calculate what it should be with your components
    $yourComponents = [
        'BASIC_SALARY' => 35909.29,
        'HOUSING' => 17575.96,
        'TRANSPORT_ALLOWANCE' => 20909.29,
        'UTILITY_ALLOWANCE' => 40409.29,
        'ANNUAL_LEAVE' => 2500.00,
        '13TH_MONTH' => 1666.67
    ];

    $yourGross = array_sum($yourComponents);

    echo "📊 CALCULATION WITH YOUR COMPONENTS:\n";
    echo "   Your Gross Total: ₦" . number_format($yourGross, 2) . "\n";
    echo "   Excel Gross: ₦" . number_format($grossFromExcel, 2) . "\n";
    echo "   Difference: ₦" . number_format(abs($yourGross - $grossFromExcel), 2) . "\n\n";

    if (abs($yourGross - $grossFromExcel) < 1) {
        echo "✅ Your component values match the Excel gross amount!\n";
    } else {
        echo "❌ Your component values don't match Excel gross. Need to adjust.\n";
    }

    echo "\n🔧 READY TO UPDATE DATABASE TEMPLATE WITH:\n";
    echo "   1. Custom Components (Gross Salary parts)\n";
    echo "   2. Statutory Components (Outsourcing obligations)\n";
    echo "   3. Service Fee: 10%\n";
    echo "   4. VAT: 7.5%\n";
} catch (Exception $e) {
    echo "❌ Error reading Excel file: " . $e->getMessage() . "\n";
}
