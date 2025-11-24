<?php

namespace App\Services;

use App\Models\Staff;
use App\Models\Client;
use App\Models\JobStructure;
use App\Models\PayGradeStructure;
use App\Models\ServiceLocation;
use App\Models\StaffTermination;
use App\Models\StaffPromotion;
use App\Models\StaffRedeployment;
use App\Models\StaffCaution;
use App\Models\StaffWarning;
use App\Models\StaffSuspension;
use App\Models\StaffBlacklist;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class EmployeeManagementBulkUploadService
{
    /**
     * Parse uploaded Excel file and return structured data.
     */
    public function parseExcel($file, string $actionType): array
    {
        try {
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            // Remove header row
            $headers = array_shift($rows);

            $data = [];
            foreach ($rows as $index => $row) {
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                $rowData = array_combine($headers, $row);
                $rowData['_row_number'] = $index + 2; // Excel row number (header is row 1)
                $data[] = $rowData;
            }

            return [
                'success' => true,
                'data' => $data,
                'total_rows' => count($data)
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to parse Excel file: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Match staff from Excel data using staff_id (exact) or name (fuzzy).
     */
    public function matchStaff(array $excelData, int $clientId): array
    {
        $matched = [];
        $unmatched = [];

        foreach ($excelData as $row) {
            $employeeCode = $row['employee_code'] ?? $row['Employee Code'] ?? null;
            $firstName = $row['first_name'] ?? $row['First Name'] ?? null;
            $lastName = $row['last_name'] ?? $row['Last Name'] ?? null;

            $staff = null;

            // Try exact match by employee_code first
            if ($employeeCode) {
                $staff = Staff::where('employee_code', $employeeCode)
                    ->where('client_id', $clientId)
                    ->first();
            }

            // If not found, try fuzzy name match
            if (!$staff && $firstName && $lastName) {
                $fullName = trim($firstName . ' ' . $lastName);

                $staff = Staff::where('client_id', $clientId)
                    ->where(function ($query) use ($firstName, $lastName, $fullName) {
                        $query->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$fullName}%"])
                            ->orWhereRaw("CONCAT(last_name, ' ', first_name) LIKE ?", ["%{$fullName}%"]);
                    })
                    ->first();
            }

            if ($staff) {
                $matched[] = [
                    'excel_row' => $row,
                    'staff' => $staff,
                    'match_type' => $staffId && $staff->staff_id === $staffId ? 'exact' : 'fuzzy'
                ];
            } else {
                $unmatched[] = $row;
            }
        }

        return [
            'matched' => $matched,
            'unmatched' => $unmatched,
            'matched_count' => count($matched),
            'unmatched_count' => count($unmatched)
        ];
    }

    /**
     * Process matched staff for bulk termination.
     */
    public function processBulkTerminations(array $matchedData, int $processedBy): array
    {
        $created = [];
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($matchedData as $item) {
                $staff = $item['staff'];
                $row = $item['excel_row'];

                // Validate termination data
                $validator = Validator::make($row, [
                    'termination_type' => 'required|in:terminated,death,resignation',
                    'termination_date' => 'required|date',
                    'transaction_date' => 'required|date',
                    'actual_relieving_date' => 'required|date',
                    'reason' => 'required|string',
                    'notice_period_days' => 'nullable|integer|min:0|max:30',
                    'exit_penalty' => 'nullable|in:yes,no',
                    'ppe_return' => 'nullable|in:n/a,yes,no',
                    'exit_interview' => 'nullable|in:n/a,yes,no',
                    'is_blacklisted' => 'nullable|boolean',
                ]);

                if ($validator->fails()) {
                    $errors[] = [
                        'row' => $row['_row_number'],
                        'staff_id' => $staff->staff_id,
                        'errors' => $validator->errors()->toArray()
                    ];
                    continue;
                }

                // Create termination
                $termination = StaffTermination::create([
                    'staff_id' => $staff->id,
                    'client_id' => $staff->client_id,
                    'termination_type' => $row['termination_type'],
                    'termination_date' => $row['termination_date'],
                    'notice_period_days' => $row['notice_period_days'] ?? null,
                    'transaction_date' => $row['transaction_date'],
                    'actual_relieving_date' => $row['actual_relieving_date'],
                    'reason' => $row['reason'],
                    'exit_penalty' => $row['exit_penalty'] ?? 'no',
                    'ppe_return' => $row['ppe_return'] ?? 'n/a',
                    'exit_interview' => $row['exit_interview'] ?? 'n/a',
                    'is_blacklisted' => filter_var($row['is_blacklisted'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'processed_by' => $processedBy,
                ]);

                // Update staff status
                $staff->update(['status' => 'terminated']);

                // Create blacklist if needed
                if ($termination->is_blacklisted) {
                    StaffBlacklist::create([
                        'staff_id' => $staff->id,
                        'client_id' => $staff->client_id,
                        'termination_id' => $termination->id,
                        'blacklist_date' => $termination->termination_date,
                        'reason' => $termination->reason,
                        'staff_details_snapshot' => [
                            'staff_id' => $staff->staff_id,
                            'first_name' => $staff->first_name,
                            'last_name' => $staff->last_name,
                            'department' => $staff->department,
                            'job_title' => $staff->job_title,
                            'client_id' => $staff->client_id,
                            'termination_type' => $termination->termination_type,
                        ],
                    ]);
                }

                $created[] = $termination;
            }

            DB::commit();

            return [
                'success' => true,
                'created_count' => count($created),
                'error_count' => count($errors),
                'created' => $created,
                'errors' => $errors
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Bulk termination failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process matched staff for bulk promotions.
     */
    public function processBulkPromotions(array $matchedData, int $processedBy): array
    {
        $created = [];
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($matchedData as $item) {
                $staff = $item['staff'];
                $row = $item['excel_row'];

                // Validate promotion data
                $validator = Validator::make($row, [
                    'new_job_structure_id' => 'required|exists:job_structures,id',
                    'new_pay_grade_structure_id' => 'required|exists:pay_grade_structures,id',
                    'effective_date' => 'required|date',
                    'reason' => 'nullable|string',
                ]);

                if ($validator->fails()) {
                    $errors[] = [
                        'row' => $row['_row_number'],
                        'staff_id' => $staff->staff_id,
                        'errors' => $validator->errors()->toArray()
                    ];
                    continue;
                }

                // Get old and new pay grades
                $oldPayGrade = PayGradeStructure::find($staff->pay_grade_structure_id);
                $newPayGrade = PayGradeStructure::find($row['new_pay_grade_structure_id']);

                // Validate new grade belongs to client
                if ($newPayGrade->jobStructure->client_id != $staff->client_id) {
                    $errors[] = [
                        'row' => $row['_row_number'],
                        'staff_id' => $staff->staff_id,
                        'errors' => ['new_pay_grade' => 'New pay grade does not belong to staff client']
                    ];
                    continue;
                }

                // Create promotion
                $promotion = StaffPromotion::create([
                    'staff_id' => $staff->id,
                    'client_id' => $staff->client_id,
                    'old_job_structure_id' => $oldPayGrade->job_structure_id,
                    'old_pay_grade_structure_id' => $staff->pay_grade_structure_id,
                    'new_job_structure_id' => $row['new_job_structure_id'],
                    'new_pay_grade_structure_id' => $row['new_pay_grade_structure_id'],
                    'effective_date' => $row['effective_date'],
                    'old_emoluments' => $oldPayGrade->emoluments,
                    'new_emoluments' => $newPayGrade->emoluments,
                    'reason' => $row['reason'] ?? null,
                    'processed_by' => $processedBy,
                ]);

                // Update staff pay grade
                $staff->update([
                    'pay_grade_structure_id' => $row['new_pay_grade_structure_id']
                ]);

                $created[] = $promotion;
            }

            DB::commit();

            return [
                'success' => true,
                'created_count' => count($created),
                'error_count' => count($errors),
                'created' => $created,
                'errors' => $errors
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Bulk promotion failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process matched staff for bulk redeployments.
     */
    public function processBulkRedeployments(array $matchedData, int $processedBy): array
    {
        $created = [];
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($matchedData as $item) {
                $staff = $item['staff'];
                $row = $item['excel_row'];

                // Validate redeployment data
                $validator = Validator::make($row, [
                    'redeployment_type' => 'required|in:department,service_location,client',
                    'effective_date' => 'required|date',
                    'reason' => 'required|string',
                ]);

                if ($validator->fails()) {
                    $errors[] = [
                        'row' => $row['_row_number'],
                        'staff_id' => $staff->staff_id,
                        'errors' => $validator->errors()->toArray()
                    ];
                    continue;
                }

                $redeploymentType = $row['redeployment_type'];

                // Create redeployment record
                $redeployment = StaffRedeployment::create([
                    'staff_id' => $staff->id,
                    'client_id' => $staff->client_id,
                    'redeployment_type' => $redeploymentType,
                    'old_department' => $staff->department,
                    'new_department' => $row['new_department'] ?? $staff->department,
                    'old_service_location_id' => $staff->service_location_id,
                    'new_service_location_id' => $row['new_service_location_id'] ?? $staff->service_location_id,
                    'old_client_id' => $staff->client_id,
                    'new_client_id' => $row['new_client_id'] ?? $staff->client_id,
                    'effective_date' => $row['effective_date'],
                    'reason' => $row['reason'],
                    'processed_by' => $processedBy,
                ]);

                // Update staff based on redeployment type
                $updates = [];

                if ($redeploymentType === 'department' && isset($row['new_department'])) {
                    $updates['department'] = $row['new_department'];
                }

                if ($redeploymentType === 'service_location' && isset($row['new_service_location_id'])) {
                    $updates['service_location_id'] = $row['new_service_location_id'];
                }

                if ($redeploymentType === 'client' && isset($row['new_client_id'])) {
                    // Cross-client redeployment - validate new pay grade
                    if (isset($row['new_pay_grade_structure_id'])) {
                        $newPayGrade = PayGradeStructure::find($row['new_pay_grade_structure_id']);

                        if ($newPayGrade->jobStructure->client_id != $row['new_client_id']) {
                            $errors[] = [
                                'row' => $row['_row_number'],
                                'staff_id' => $staff->staff_id,
                                'errors' => ['new_pay_grade' => 'New pay grade does not belong to new client']
                            ];
                            continue;
                        }

                        $updates['pay_grade_structure_id'] = $row['new_pay_grade_structure_id'];
                    }

                    $updates['client_id'] = $row['new_client_id'];
                    $updates['department'] = $row['new_department'] ?? null;
                    $updates['service_location_id'] = $row['new_service_location_id'] ?? null;
                }

                $staff->update($updates);

                $created[] = $redeployment;
            }

            DB::commit();

            return [
                'success' => true,
                'created_count' => count($created),
                'error_count' => count($errors),
                'created' => $created,
                'errors' => $errors
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Bulk redeployment failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate Excel template for specific action type.
     */
    public function generateTemplate(string $actionType): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set header style
        $headerStyle = [
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
        ];

        $headers = $this->getTemplateHeaders($actionType);

        // Set headers
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->applyFromArray($headerStyle);
            $sheet->getColumnDimension($col)->setWidth(20);
            $col++;
        }

        // Add sample data row with instructions
        $this->addSampleDataRow($sheet, $actionType);

        // Create temp file
        $tempFile = tempnam(sys_get_temp_dir(), 'employee_mgmt_') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);

        return $tempFile;
    }

    /**
     * Get template headers for action type.
     */
    private function getTemplateHeaders(string $actionType): array
    {
        $commonHeaders = ['staff_id', 'first_name', 'last_name'];

        switch ($actionType) {
            case 'termination':
                return array_merge($commonHeaders, [
                    'termination_type',
                    'termination_date',
                    'transaction_date',
                    'actual_relieving_date',
                    'notice_period_days',
                    'reason',
                    'exit_penalty',
                    'ppe_return',
                    'exit_interview',
                    'is_blacklisted'
                ]);

            case 'promotion':
                return array_merge($commonHeaders, [
                    'new_job_structure_id',
                    'new_pay_grade_structure_id',
                    'effective_date',
                    'reason'
                ]);

            case 'redeployment':
                return array_merge($commonHeaders, [
                    'redeployment_type',
                    'new_department',
                    'new_service_location_id',
                    'new_client_id',
                    'new_pay_grade_structure_id',
                    'effective_date',
                    'reason'
                ]);

            case 'caution':
                return array_merge($commonHeaders, [
                    'issued_date',
                    'reason',
                    'status'
                ]);

            case 'warning':
                return array_merge($commonHeaders, [
                    'warning_level',
                    'issued_date',
                    'reason',
                    'status'
                ]);

            case 'suspension':
                return array_merge($commonHeaders, [
                    'suspension_start_date',
                    'suspension_end_date',
                    'suspension_days',
                    'reason',
                    'status'
                ]);

            default:
                return $commonHeaders;
        }
    }

    /**
     * Add sample data row to template.
     */
    private function addSampleDataRow($sheet, string $actionType): void
    {
        $row = 2;
        $col = 'A';

        // Common sample data
        $sheet->setCellValue($col++ . $row, 'SOL001');
        $sheet->setCellValue($col++ . $row, 'John');
        $sheet->setCellValue($col++ . $row, 'Doe');

        // Action-specific sample data
        switch ($actionType) {
            case 'termination':
                $sheet->setCellValue($col++ . $row, 'resignation');
                $sheet->setCellValue($col++ . $row, '2025-01-15');
                $sheet->setCellValue($col++ . $row, '2025-01-15');
                $sheet->setCellValue($col++ . $row, '2025-01-31');
                $sheet->setCellValue($col++ . $row, '14');
                $sheet->setCellValue($col++ . $row, 'Better opportunity');
                $sheet->setCellValue($col++ . $row, 'no');
                $sheet->setCellValue($col++ . $row, 'yes');
                $sheet->setCellValue($col++ . $row, 'yes');
                $sheet->setCellValue($col++ . $row, 'false');
                break;

            case 'promotion':
                $sheet->setCellValue($col++ . $row, '17');
                $sheet->setCellValue($col++ . $row, '19');
                $sheet->setCellValue($col++ . $row, '2025-02-01');
                $sheet->setCellValue($col++ . $row, 'Outstanding performance');
                break;

            case 'redeployment':
                $sheet->setCellValue($col++ . $row, 'department');
                $sheet->setCellValue($col++ . $row, 'IT Department');
                $sheet->setCellValue($col++ . $row, 'Senior Developer');
                $sheet->setCellValue($col++ . $row, '5');
                $sheet->setCellValue($col++ . $row, '');
                $sheet->setCellValue($col++ . $row, '');
                $sheet->setCellValue($col++ . $row, '2025-02-01');
                $sheet->setCellValue($col++ . $row, 'Organizational restructure');
                break;
        }
    }
}
