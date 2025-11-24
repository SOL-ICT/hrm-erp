<?php

namespace App\Services;

use App\Models\PayGradeStructure;
use App\Models\JobStructure;
use App\Models\EmolumentComponent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

/**
 * Pay Grade Excel Service
 * 
 * Handles Excel generation and parsing for bulk pay grade emolument setup
 * 
 * Workflow:
 * 1. generateTemplate() - Create Excel with pay grades as rows, components as columns
 * 2. User fills amounts in Excel
 * 3. parseUploadedFile() - Parse Excel and validate data
 * 4. saveEmoluments() - Save validated data to pay_grade_structures.emoluments JSON
 */
class PayGradeExcelService
{
    /**
     * Generate Excel template for bulk pay grade emolument setup
     * 
     * Template Structure:
     * - Column A: Grade Code
     * - Column B: Grade Name
     * - Columns C onwards: One column per emolument component
     * - Row 1: Headers (component codes)
     * - Row 2: Subheaders (component names)
     * - Row 3+: Pay grade data (one row per grade)
     * 
     * @param int $jobStructureId Job Structure (Category) ID
     * @param int $clientId Client ID (to get client-specific components)
     * @return array ['success' => bool, 'file_path' => string, 'message' => string]
     */
    public function generateTemplate($jobStructureId, $clientId)
    {
        try {
            // Validate job structure exists
            $jobStructure = JobStructure::find($jobStructureId);
            if (!$jobStructure) {
                return [
                    'success' => false,
                    'message' => 'Job structure not found',
                ];
            }

            // Get all pay grades for this job structure
            $payGrades = PayGradeStructure::where('job_structure_id', $jobStructureId)
                ->where('is_active', true)
                ->orderBy('grade_code')
                ->get();

            if ($payGrades->isEmpty()) {
                return [
                    'success' => false,
                    'message' => 'No pay grades found for this job structure',
                ];
            }

            // Get available components (universal + client-specific)
            // Include ALL categories: salary, allowance, deduction, reimbursable
            $components = EmolumentComponent::where(function ($query) use ($clientId) {
                $query->whereNull('client_id') // Universal components
                    ->orWhere('client_id', $clientId); // Client-specific
            })
                ->where('is_universal_template', true) // Only payroll components
                ->where('is_active', true)
                // Include all payroll categories for comprehensive pay grade definition
                ->whereIn('payroll_category', ['salary', 'allowance', 'deduction', 'reimbursable'])
                ->orderBy('payroll_category')
                ->orderBy('component_code')
                ->get();

            if ($components->isEmpty()) {
                return [
                    'success' => false,
                    'message' => 'No emolument components found',
                ];
            }

            // Create Spreadsheet object
            $spreadsheet = new Spreadsheet();
            $spreadsheet->getProperties()
                ->setCreator('HRM-ERP System')
                ->setTitle('Pay Grade Emoluments Template')
                ->setSubject('Bulk Pay Grade Emolument Setup')
                ->setDescription('Template for uploading pay grade emolument amounts');

            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Pay Grade Emoluments');

            // Set column widths
            $sheet->getColumnDimension('A')->setWidth(15); // Grade Code
            $sheet->getColumnDimension('B')->setWidth(25); // Grade Name

            // HEADER ROW 1: Component Codes
            $sheet->setCellValue('A1', 'Grade Code');
            $sheet->setCellValue('B1', 'Grade Name');

            $col = 'C';
            foreach ($components as $component) {
                $sheet->setCellValue($col . '1', $component->component_code);
                $sheet->getColumnDimension($col)->setWidth(15);
                $col++;
            }

            // HEADER ROW 2: Component Names (Subheader)
            $sheet->setCellValue('A2', '(Required)');
            $sheet->setCellValue('B2', '(Auto-filled)');

            $col = 'C';
            foreach ($components as $component) {
                $sheet->setCellValue($col . '2', $component->component_name);
                $col++;
            }

            // Style header rows
            $lastCol = chr(ord('B') + count($components));
            $headerRange = 'A1:' . $lastCol . '1';
            $subHeaderRange = 'A2:' . $lastCol . '2';

            // Header row 1 styling
            $sheet->getStyle($headerRange)->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 11,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ]);

            // Subheader row 2 styling
            $sheet->getStyle($subHeaderRange)->applyFromArray([
                'font' => [
                    'italic' => true,
                    'size' => 9,
                    'color' => ['rgb' => '666666'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E7E6E6'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CCCCCC'],
                    ],
                ],
            ]);

            // DATA ROWS: Pay Grades
            $row = 3;
            foreach ($payGrades as $grade) {
                // Grade Code (protected from editing)
                $sheet->setCellValue('A' . $row, $grade->grade_code);
                $sheet->getStyle('A' . $row)->getProtection()->setLocked('true');
                $sheet->getStyle('A' . $row)->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F2F2F2'],
                    ],
                    'font' => ['bold' => true],
                ]);

                // Grade Name (protected from editing)
                $sheet->setCellValue('B' . $row, $grade->grade_name);
                $sheet->getStyle('B' . $row)->getProtection()->setLocked('true');
                $sheet->getStyle('B' . $row)->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F2F2F2'],
                    ],
                ]);

                // Emolument amounts (editable - pre-fill if exists)
                $existingEmoluments = $grade->emoluments ?? [];
                $existingAmounts = [];
                foreach ($existingEmoluments as $emol) {
                    $existingAmounts[$emol['component_id']] = $emol['amount'] ?? 0;
                }

                $col = 'C';
                foreach ($components as $component) {
                    // Pre-fill with existing amount or 0
                    $amount = $existingAmounts[$component->id] ?? 0;
                    $sheet->setCellValue($col . $row, $amount);

                    // Format as currency (number with 2 decimals)
                    $sheet->getStyle($col . $row)->getNumberFormat()
                        ->setFormatCode('#,##0.00');

                    // Unlock for editing
                    $sheet->getStyle($col . $row)->getProtection()->setLocked('false');

                    $col++;
                }

                $row++;
            }

            // Add instructions sheet
            $instructionsSheet = $spreadsheet->createSheet(1);
            $instructionsSheet->setTitle('Instructions');
            $instructionsSheet->setCellValue('A1', 'HOW TO USE THIS TEMPLATE');
            $instructionsSheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $instructionsSheet->setCellValue('A3', 'Step 1: Review the pay grades listed in the "Pay Grade Emoluments" sheet');
            $instructionsSheet->setCellValue('A4', 'Step 2: Enter the amount for each emolument component (columns C onwards)');
            $instructionsSheet->setCellValue('A5', 'Step 3: Do NOT modify Grade Code or Grade Name columns (columns A & B)');
            $instructionsSheet->setCellValue('A6', 'Step 4: Leave amount as 0 if component does not apply to that grade');
            $instructionsSheet->setCellValue('A7', 'Step 5: Save the file and upload it back to the system');
            $instructionsSheet->setCellValue('A9', 'IMPORTANT NOTES:');
            $instructionsSheet->getStyle('A9')->getFont()->setBold(true);
            $instructionsSheet->setCellValue('A10', '• Amounts must be positive numbers');
            $instructionsSheet->setCellValue('A11', '• Do not delete or add rows');
            $instructionsSheet->setCellValue('A12', '• Do not modify column headers');
            $instructionsSheet->setCellValue('A13', '• Only fill in the amount cells (C3 onwards)');
            $instructionsSheet->getColumnDimension('A')->setWidth(80);

            // Protect sheet (allow editing only amount cells)
            $sheet->getProtection()->setSheet(true);
            $sheet->getProtection()->setPassword('hrm2024');

            // Save file
            $writer = new Xlsx($spreadsheet);
            $fileName = 'pay_grade_emoluments_' . $jobStructure->category_name . '_' . date('Y-m-d_His') . '.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), 'paygrade_');
            $writer->save($tempFile);

            return [
                'success' => true,
                'file_path' => $tempFile,
                'file_name' => $fileName,
                'grades_count' => count($payGrades),
                'components_count' => count($components),
                'message' => 'Template generated successfully',
            ];
        } catch (\Exception $e) {
            Log::error('PayGradeExcelService::generateTemplate error: ' . $e->getMessage(), [
                'job_structure_id' => $jobStructureId,
                'client_id' => $clientId,
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Error generating template: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Parse uploaded Excel file and extract pay grade emolument data
     * 
     * @param \Illuminate\Http\UploadedFile $file Uploaded Excel file
     * @param int $jobStructureId Job Structure ID (for validation)
     * @param int $clientId Client ID (for component validation)
     * @return array ['success' => bool, 'data' => array, 'errors' => array]
     */
    public function parseUploadedFile($file, $jobStructureId, $clientId)
    {
        try {
            // Load Excel file
            $spreadsheet = IOFactory::load($file->getPathname());
            // Always use the first sheet (index 0) - second sheet is instructions
            $sheet = $spreadsheet->getSheet(0);
            $rows = $sheet->toArray(null, true, true, true); // Keep column letters as keys

            if (count($rows) < 3) {
                return [
                    'success' => false,
                    'message' => 'Invalid file format: No data rows found',
                    'errors' => [],
                ];
            }

            // Extract headers (row 1)
            $headerRow = $rows[1];
            $componentCodes = [];
            foreach ($headerRow as $colLetter => $value) {
                if ($colLetter !== 'A' && $colLetter !== 'B' && !empty($value)) {
                    $componentCodes[$colLetter] = trim($value);
                }
            }

            // Validate components exist
            $components = EmolumentComponent::where(function ($query) use ($clientId) {
                $query->whereNull('client_id')
                    ->orWhere('client_id', $clientId);
            })
                ->whereIn('component_code', $componentCodes)
                ->where('is_active', true)
                ->get()
                ->keyBy('component_code');

            // Check for missing components
            $missingComponents = array_diff($componentCodes, $components->keys()->toArray());
            if (!empty($missingComponents)) {
                return [
                    'success' => false,
                    'message' => 'Invalid components found in template',
                    'errors' => ['Missing components: ' . implode(', ', $missingComponents)],
                ];
            }

            // Create component column mapping
            $componentMapping = []; // [colLetter => component object]
            foreach ($componentCodes as $colLetter => $code) {
                if (isset($components[$code])) {
                    $componentMapping[$colLetter] = $components[$code];
                }
            }

            // Parse data rows (from row 3 onwards)
            $parsedData = [];
            $errors = [];
            $rowNumber = 2; // For user-friendly error messages (skip header rows)

            foreach ($rows as $excelRow => $row) {
                if ($excelRow <= 2) continue; // Skip header rows

                $rowNumber++;
                $gradeCode = trim($row['A'] ?? '');

                // Skip empty rows
                if (empty($gradeCode)) continue;

                // Validate grade exists
                $payGrade = PayGradeStructure::where('job_structure_id', $jobStructureId)
                    ->where('grade_code', $gradeCode)
                    ->first();

                if (!$payGrade) {
                    $errors[] = "Row {$rowNumber}: Grade code '{$gradeCode}' not found";
                    continue;
                }

                // Extract emolument amounts
                $emoluments = [];
                foreach ($componentMapping as $colLetter => $component) {
                    $amount = $row[$colLetter] ?? 0;

                    // Clean amount: remove commas, spaces, currency symbols
                    if (is_string($amount)) {
                        $amount = str_replace([',', ' ', '₦', '$', '€', '£'], '', $amount);
                    }

                    // Validate amount is numeric
                    $amount = is_numeric($amount) ? floatval($amount) : 0;

                    if ($amount < 0) {
                        $errors[] = "Row {$rowNumber}, Column {$colLetter}: Amount cannot be negative";
                        continue;
                    }

                    // Only include non-zero amounts
                    if ($amount > 0) {
                        $emoluments[] = [
                            'component_id' => $component->id,
                            'component_code' => $component->component_code,
                            'component_name' => $component->component_name,
                            'payroll_category' => $component->payroll_category,
                            'is_pensionable' => $component->is_pensionable,
                            'amount' => $amount,
                        ];
                    }
                }

                $parsedData[] = [
                    'pay_grade_id' => $payGrade->id,
                    'grade_code' => $gradeCode,
                    'grade_name' => $payGrade->grade_name,
                    'emoluments' => $emoluments,
                ];
            }

            if (empty($parsedData)) {
                return [
                    'success' => false,
                    'message' => 'No valid data found in file',
                    'errors' => $errors,
                ];
            }

            return [
                'success' => true,
                'data' => $parsedData,
                'errors' => $errors,
                'rows_processed' => count($parsedData),
                'message' => count($errors) > 0
                    ? 'File parsed with warnings'
                    : 'File parsed successfully',
            ];
        } catch (\Exception $e) {
            Log::error('PayGradeExcelService::parseUploadedFile error: ' . $e->getMessage(), [
                'file_name' => $file->getClientOriginalName(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Error parsing file: ' . $e->getMessage(),
                'errors' => [$e->getMessage()],
            ];
        }
    }

    /**
     * Save parsed emolument data to pay_grade_structures
     * 
     * @param array $data Parsed data from parseUploadedFile()
     * @return array ['success' => bool, 'updated_count' => int, 'message' => string]
     */
    public function saveEmoluments(array $data)
    {
        DB::beginTransaction();

        try {
            $updatedCount = 0;

            foreach ($data as $gradeData) {
                $payGrade = PayGradeStructure::find($gradeData['pay_grade_id']);

                if (!$payGrade) {
                    Log::warning('PayGradeExcelService::saveEmoluments - Grade not found', [
                        'pay_grade_id' => $gradeData['pay_grade_id'],
                    ]);
                    continue;
                }

                // Update emoluments JSON
                $payGrade->emoluments = $gradeData['emoluments'];

                // Calculate total compensation from emoluments
                $totalCompensation = 0;
                foreach ($gradeData['emoluments'] as $emolument) {
                    if (isset($emolument['amount']) && is_numeric($emolument['amount'])) {
                        $totalCompensation += floatval($emolument['amount']);
                    }
                }
                $payGrade->total_compensation = $totalCompensation;

                $payGrade->save();

                $updatedCount++;
            }

            DB::commit();

            return [
                'success' => true,
                'updated_count' => $updatedCount,
                'message' => "Successfully updated {$updatedCount} pay grade(s)",
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('PayGradeExcelService::saveEmoluments error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Error saving emoluments: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Load universal template into a specific pay grade
     * Copies the 11 universal components with zero amounts
     * 
     * @param int $payGradeId Pay Grade Structure ID
     * @return array ['success' => bool, 'message' => string]
     */
    public function loadUniversalTemplate($payGradeId)
    {
        DB::beginTransaction();

        try {
            $payGrade = PayGradeStructure::find($payGradeId);

            if (!$payGrade) {
                return [
                    'success' => false,
                    'message' => 'Pay grade not found',
                ];
            }

            // Get universal components (11 components)
            $universalComponents = EmolumentComponent::whereNull('client_id')
                ->where('is_universal_template', true)
                ->where('is_active', true)
                ->whereIn('payroll_category', ['basic', 'allowance'])
                ->orderBy('payroll_category')
                ->orderBy('component_code')
                ->get();

            if ($universalComponents->isEmpty()) {
                return [
                    'success' => false,
                    'message' => 'No universal components found',
                ];
            }

            // Create emoluments array with zero amounts
            $emoluments = [];
            foreach ($universalComponents as $component) {
                $emoluments[] = [
                    'component_id' => $component->id,
                    'amount' => 0, // Zero amount - user will fill in later
                ];
            }

            // Update pay grade
            $payGrade->emoluments = $emoluments;
            $payGrade->save();

            DB::commit();

            return [
                'success' => true,
                'components_loaded' => count($emoluments),
                'message' => 'Universal template loaded successfully. Please update amounts.',
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('PayGradeExcelService::loadUniversalTemplate error: ' . $e->getMessage(), [
                'pay_grade_id' => $payGradeId,
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Error loading template: ' . $e->getMessage(),
            ];
        }
    }
}
