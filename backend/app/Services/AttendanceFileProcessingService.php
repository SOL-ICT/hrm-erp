<?php

namespace App\Services;

use App\Models\AttendanceUpload;
use App\Models\AttendanceRecord;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Carbon\Carbon;

class AttendanceFileProcessingService
{
    /**
     * Process uploaded attendance file and create attendance records
     */
    public function processAttendanceFile(UploadedFile $file, int $clientId, int $uploadedBy): array
    {
        try {
            DB::beginTransaction();

            // Create attendance upload record
            $upload = AttendanceUpload::create([
                'client_id' => $clientId,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'file_type' => $file->getClientOriginalExtension(),
                'uploaded_by' => $uploadedBy,
                'processing_status' => 'processing',
                'processing_started_at' => now()
            ]);

            // Store the file
            $filePath = $file->store('attendance_uploads', 'local');
            $upload->update(['file_path' => $filePath]);

            // Process the file based on type
            $results = $this->processFileByType($file, $upload);

            // Update upload status
            $upload->update([
                'processing_status' => $results['success'] ? 'completed' : 'failed',
                'records_processed' => $results['processed'],
                'records_failed' => $results['failed'],
                'error_details' => $results['errors'] ?? null,
                'processing_completed_at' => now()
            ]);

            DB::commit();

            return [
                'success' => $results['success'],
                'upload_id' => $upload->id,
                'processed' => $results['processed'],
                'failed' => $results['failed'],
                'errors' => $results['errors'] ?? [],
                'warnings' => $results['warnings'] ?? []
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Attendance file processing failed', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName(),
                'client_id' => $clientId
            ]);

            return [
                'success' => false,
                'error' => 'Failed to process file: ' . $e->getMessage(),
                'processed' => 0,
                'failed' => 0
            ];
        }
    }

    /**
     * Process file based on its type
     */
    private function processFileByType(UploadedFile $file, AttendanceUpload $upload): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        switch ($extension) {
            case 'xlsx':
            case 'xls':
                return $this->processExcelFile($file, $upload);
            case 'csv':
                return $this->processCsvFile($file, $upload);
            default:
                return [
                    'success' => false,
                    'processed' => 0,
                    'failed' => 0,
                    'errors' => ['Unsupported file type: ' . $extension]
                ];
        }
    }

    /**
     * Process Excel file
     */
    private function processExcelFile(UploadedFile $file, AttendanceUpload $upload): array
    {
        try {
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();

            // Get header row to map columns
            $headerRow = $worksheet->rangeToArray('A1:Z1')[0];
            $columnMap = $this->mapColumns($headerRow);

            if (empty($columnMap)) {
                return [
                    'success' => false,
                    'processed' => 0,
                    'failed' => 0,
                    'errors' => ['Could not identify required columns in the file. Expected: Employee ID/Code, Name, Date, Hours/Days']
                ];
            }

            $processed = 0;
            $failed = 0;
            $errors = [];
            $warnings = [];

            // Process data rows (starting from row 2)
            $highestRow = $worksheet->getHighestRow();

            for ($row = 2; $row <= $highestRow; $row++) {
                $rowData = $worksheet->rangeToArray("A{$row}:Z{$row}")[0];

                // Skip completely empty rows
                $isEmpty = true;
                foreach ($rowData as $cell) {
                    if (!empty(trim($cell))) {
                        $isEmpty = false;
                        break;
                    }
                }

                if ($isEmpty) {
                    continue; // Skip empty row, don't count as error
                }

                $result = $this->processAttendanceRow($rowData, $columnMap, $upload, $row);

                if ($result['success']) {
                    $processed++;
                } elseif (!isset($result['skip_count']) || !$result['skip_count']) {
                    // Only count as failed if it's not a skipped instruction row
                    $failed++;
                    $errors[] = "Row {$row}: " . $result['error'];
                }

                if (!empty($result['warning'])) {
                    $warnings[] = "Row {$row}: " . $result['warning'];
                }
            }

            return [
                'success' => $processed > 0,
                'processed' => $processed,
                'failed' => $failed,
                'errors' => $errors,
                'warnings' => $warnings
            ];
        } catch (\Exception $e) {
            Log::error('Excel processing failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'processed' => 0,
                'failed' => 0,
                'errors' => ['Failed to read Excel file: ' . $e->getMessage()]
            ];
        }
    }

    /**
     * Process CSV file
     */
    private function processCsvFile(UploadedFile $file, AttendanceUpload $upload): array
    {
        try {
            $handle = fopen($file->getPathname(), 'r');

            // Read header row
            $headerRow = fgetcsv($handle);
            $columnMap = $this->mapColumns($headerRow);

            if (empty($columnMap)) {
                fclose($handle);
                return [
                    'success' => false,
                    'processed' => 0,
                    'failed' => 0,
                    'errors' => ['Could not identify required columns in the file']
                ];
            }

            $processed = 0;
            $failed = 0;
            $errors = [];
            $warnings = [];
            $rowNumber = 1;

            while (($rowData = fgetcsv($handle)) !== false) {
                $rowNumber++;

                // Skip completely empty rows
                $isEmpty = true;
                foreach ($rowData as $cell) {
                    if (!empty(trim($cell))) {
                        $isEmpty = false;
                        break;
                    }
                }

                if ($isEmpty) {
                    continue; // Skip empty row, don't count as error
                }

                $result = $this->processAttendanceRow($rowData, $columnMap, $upload, $rowNumber);

                if ($result['success']) {
                    $processed++;
                } elseif (!isset($result['skip_count']) || !$result['skip_count']) {
                    // Only count as failed if it's not a skipped instruction row
                    $failed++;
                    $errors[] = "Row {$rowNumber}: " . $result['error'];
                }

                if (!empty($result['warning'])) {
                    $warnings[] = "Row {$rowNumber}: " . $result['warning'];
                }
            }

            fclose($handle);

            return [
                'success' => $processed > 0,
                'processed' => $processed,
                'failed' => $failed,
                'errors' => $errors,
                'warnings' => $warnings
            ];
        } catch (\Exception $e) {
            Log::error('CSV processing failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'processed' => 0,
                'failed' => 0,
                'errors' => ['Failed to read CSV file: ' . $e->getMessage()]
            ];
        }
    }

    /**
     * Map column headers to expected fields
     */
    private function mapColumns(array $headers): array
    {
        $map = [];

        foreach ($headers as $index => $header) {
            $header = strtolower(trim($header ?? ''));

            // Employee identification
            if (in_array($header, ['employee_id', 'emp_id', 'employee id', 'emp id', 'staff_id', 'staff id', 'employee_code', 'employee code', 'code'])) {
                $map['employee_id'] = $index;
            }

            // Employee name
            if (in_array($header, ['name', 'employee_name', 'employee name', 'full_name', 'full name', 'staff_name', 'staff name'])) {
                $map['name'] = $index;
            }

            // Date
            if (in_array($header, ['date', 'work_date', 'work date', 'attendance_date', 'attendance date', 'day', 'work_day'])) {
                $map['date'] = $index;
            }

            // Hours worked
            if (in_array($header, ['hours', 'hours_worked', 'hours worked', 'work_hours', 'work hours', 'total_hours', 'total hours'])) {
                $map['hours'] = $index;
            }

            // Days worked (alternative to hours)
            if (in_array($header, ['days', 'days_worked', 'days worked', 'days_present', 'days present', 'work_days', 'work days', 'attendance_days', 'attendance days'])) {
                $map['days'] = $index;
            }

            // Optional: Basic salary
            if (in_array($header, ['salary', 'basic_salary', 'basic salary', 'daily_rate', 'daily rate', 'hourly_rate', 'hourly rate'])) {
                $map['salary'] = $index;
            }
        }

        // Check if we have minimum required columns
        $hasEmployeeId = isset($map['employee_id']);
        $hasName = isset($map['name']);
        $hasDate = isset($map['date']);
        $hasTimeData = isset($map['hours']) || isset($map['days']);

        // Date is optional if we have days data (monthly summary format)
        $isValid = $hasEmployeeId && $hasName && $hasTimeData && ($hasDate || isset($map['days']));

        return $isValid ? $map : [];
    }

    /**
     * Process a single attendance row
     */
    private function processAttendanceRow(array $rowData, array $columnMap, AttendanceUpload $upload, int $rowNumber): array
    {
        try {
            // First, check if this row contains instruction/comment keywords in ANY cell
            $instructionKeywords = ['INSTRUCTIONS:', 'TEMPLATE COVERAGE:', 'Only fill', 'Do NOT', 'Enter the', 'Save the', 'Template generated', 'Export date:', 'Staff count:', 'Pay Grade', 'highlighted in blue', 'payroll processing', 'employees'];
            
            foreach ($rowData as $cellValue) {
                $cellText = trim(strtolower($cellValue ?? ''));
                foreach ($instructionKeywords as $keyword) {
                    if (stripos($cellText, strtolower($keyword)) !== false) {
                        // This is an instruction/comment row, skip it silently
                        return ['success' => false, 'error' => 'Skipped instruction/comment row', 'skip_count' => true];
                    }
                }
            }

            // Extract data from row
            $employeeId = trim($rowData[$columnMap['employee_id']] ?? '');
            $name = trim($rowData[$columnMap['name']] ?? '');
            $dateValue = $rowData[$columnMap['date']] ?? '';

            // Validate required fields
            if (empty($employeeId)) {
                return ['success' => false, 'error' => 'Missing employee ID'];
            }

            if (empty($name)) {
                return ['success' => false, 'error' => 'Missing employee name'];
            }

            // Date is optional for monthly summary format
            // If no date column exists, we'll use the current month
            if (empty($dateValue) && !isset($columnMap['days'])) {
                return ['success' => false, 'error' => 'Missing date'];
            }

            // Parse date (or use first day of current month for monthly summary)
            if (!empty($dateValue)) {
                $date = $this->parseDate($dateValue);
                if (!$date) {
                    return ['success' => false, 'error' => 'Invalid date format'];
                }
            } else {
                // Monthly summary format - use first day of current month
                $date = now()->startOfMonth();
            }

            // Get hours/days worked
            $hoursWorked = null;
            $daysWorked = null;

            if (isset($columnMap['hours']) && !empty($rowData[$columnMap['hours']])) {
                $hoursWorked = floatval($rowData[$columnMap['hours']]);
                $daysWorked = $hoursWorked / 8; // Assume 8 hours per day
            } elseif (isset($columnMap['days']) && !empty($rowData[$columnMap['days']])) {
                $daysWorked = floatval($rowData[$columnMap['days']]);
                $hoursWorked = $daysWorked * 8; // Assume 8 hours per day
            } else {
                return ['success' => false, 'error' => 'Missing hours or days worked'];
            }

            // Get salary if available
            $salary = null;
            if (isset($columnMap['salary']) && !empty($rowData[$columnMap['salary']])) {
                $salary = floatval($rowData[$columnMap['salary']]);
            }

            // Check for duplicate record
            $existing = AttendanceRecord::where([
                'upload_id' => $upload->id,
                'employee_id' => $employeeId,
                'work_date' => $date
            ])->first();

            if ($existing) {
                return [
                    'success' => false,
                    'error' => 'Duplicate record for employee ' . $employeeId . ' on ' . $date->format('Y-m-d')
                ];
            }

            // Create attendance record
            AttendanceRecord::create([
                'upload_id' => $upload->id,
                'client_id' => $upload->client_id,
                'employee_id' => $employeeId,
                'employee_name' => $name,
                'work_date' => $date,
                'hours_worked' => $hoursWorked,
                'days_worked' => $daysWorked,
                'basic_salary' => $salary,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $warning = '';
            if ($hoursWorked > 12) {
                $warning = 'High hours worked (' . $hoursWorked . ' hours) - please verify';
            } elseif ($daysWorked > 1) {
                $warning = 'High days worked (' . $daysWorked . ' days) - please verify';
            }

            return [
                'success' => true,
                'warning' => $warning
            ];
        } catch (\Exception $e) {
            Log::error('Row processing failed', [
                'row' => $rowNumber,
                'error' => $e->getMessage(),
                'data' => $rowData
            ]);

            return [
                'success' => false,
                'error' => 'Processing error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Parse various date formats
     */
    private function parseDate($dateValue): ?Carbon
    {
        if (empty($dateValue)) {
            return null;
        }

        try {
            // If it's a numeric value (Excel date serial)
            if (is_numeric($dateValue)) {
                return Carbon::instance(Date::excelToDateTimeObject($dateValue));
            }

            // Try common date formats
            $formats = [
                'Y-m-d',
                'Y/m/d',
                'd/m/Y',
                'm/d/Y',
                'd-m-Y',
                'm-d-Y',
                'Y-m-d H:i:s',
                'd/m/Y H:i:s',
                'm/d/Y H:i:s'
            ];

            foreach ($formats as $format) {
                try {
                    return Carbon::createFromFormat($format, $dateValue);
                } catch (\Exception $e) {
                    // Continue to next format
                }
            }

            // Try Carbon's flexible parsing
            return Carbon::parse($dateValue);
        } catch (\Exception $e) {
            Log::warning('Date parsing failed', [
                'value' => $dateValue,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get upload statistics
     */
    public function getUploadStatistics(int $uploadId): array
    {
        $upload = AttendanceUpload::findOrFail($uploadId);

        $stats = [
            'upload' => $upload,
            'total_records' => AttendanceRecord::where('upload_id', $uploadId)->count(),
            'unique_employees' => AttendanceRecord::where('upload_id', $uploadId)->distinct('employee_id')->count(),
            'date_range' => AttendanceRecord::where('upload_id', $uploadId)
                ->selectRaw('MIN(work_date) as start_date, MAX(work_date) as end_date')
                ->first(),
            'total_hours' => AttendanceRecord::where('upload_id', $uploadId)->sum('hours_worked'),
            'total_days' => AttendanceRecord::where('upload_id', $uploadId)->sum('days_worked')
        ];

        return $stats;
    }

    /**
     * Delete upload and associated records
     */
    public function deleteUpload(int $uploadId): bool
    {
        try {
            DB::beginTransaction();

            $upload = AttendanceUpload::findOrFail($uploadId);

            // Delete associated attendance records
            AttendanceRecord::where('upload_id', $uploadId)->delete();

            // Delete the file
            if ($upload->file_path && Storage::disk('local')->exists($upload->file_path)) {
                Storage::disk('local')->delete($upload->file_path);
            }

            // Delete the upload record
            $upload->delete();

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Upload deletion failed', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}
