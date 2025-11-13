<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Support\Facades\Validator;
use App\Models\PayGradeStructure;
use App\Models\Client;

class StaffBulkImport implements ToArray, WithHeadingRow, SkipsEmptyRows, WithChunkReading
{
    protected $clientId;
    protected $ticketId;
    protected $validationErrors = [];
    protected $validRows = [];
    protected $invalidRows = [];
    protected $payGradeIds = [];

    public function __construct($clientId, $ticketId)
    {
        $this->clientId = $clientId;
        $this->ticketId = $ticketId;

        // Preload valid pay grade IDs - PayGradeStructure doesn't have client_id, it's linked through job_structure
        // We'll get the job_structure_id from the recruitment_request and find valid pay grades for that job structure
        $recruitmentRequest = \App\Models\RecruitmentRequest::find($ticketId);
        if ($recruitmentRequest && $recruitmentRequest->job_structure_id) {
            $this->payGradeIds = PayGradeStructure::where('job_structure_id', $recruitmentRequest->job_structure_id)
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();
        } else {
            $this->payGradeIds = [];
        }
    }

    /**
     * Parse the imported data into an array
     */
    public function array(array $array): array
    {
        foreach ($array as $rowIndex => $row) {
            $actualRowNumber = $rowIndex + 2; // +1 for header, +1 for 0-based index

            // Skip empty rows or sample data rows
            if ($this->isEmptyOrSampleRow($row)) {
                continue;
            }

            // Validate the row
            $validationResult = $this->validateRow($row, $actualRowNumber);

            if ($validationResult['valid']) {
                $this->validRows[] = [
                    'row_number' => $actualRowNumber,
                    'data' => $this->normalizeRowData($row)
                ];
            } else {
                $this->invalidRows[] = [
                    'row_number' => $actualRowNumber,
                    'data' => $row,
                    'errors' => $validationResult['errors']
                ];
            }
        }

        return [
            'total_rows' => count($array),
            'valid_rows' => count($this->validRows),
            'invalid_rows' => count($this->invalidRows),
            'validation_errors' => $this->validationErrors,
            'valid_data' => $this->validRows,
            'invalid_data' => $this->invalidRows
        ];
    }

    /**
     * Check if row is empty or contains sample data
     */
    private function isEmptyOrSampleRow($row): bool
    {
        // Check if all values are empty
        $nonEmptyValues = array_filter($row, function ($value) {
            return !empty(trim($value));
        });

        if (empty($nonEmptyValues)) {
            return true;
        }

        // Check if it's sample data (contains "John", "Doe", or "example.com")
        $rowString = strtolower(implode(' ', $row));
        $sampleIndicators = ['john', 'doe', 'example.com', 'sample', 'emp001'];

        foreach ($sampleIndicators as $indicator) {
            if (strpos($rowString, $indicator) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Validate a single row of data
     */
    private function validateRow($row, $rowNumber): array
    {
        $errors = [];

        // Define validation rules
        $rules = [
            'employee_code' => 'required|string|max:50',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'phone_number' => 'required|string|max:20',
            'date_of_birth' => 'required|date|before:today',
            'gender' => 'required|in:Male,Female,Other',
            'hire_date' => 'required|date',
            'pay_grade_structure_id' => 'required|integer'
        ];

        // Create validator
        $validator = Validator::make($row, $rules);

        if ($validator->fails()) {
            $errors = array_merge($errors, $validator->errors()->all());
        }

        // Additional custom validations
        $customValidationErrors = $this->performCustomValidations($row, $rowNumber);
        $errors = array_merge($errors, $customValidationErrors);

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Perform custom validations
     */
    private function performCustomValidations($row, $rowNumber): array
    {
        $errors = [];

        // Check if pay grade ID exists for this client
        if (!empty($row['pay_grade_structure_id'])) {
            if (!in_array((int)$row['pay_grade_structure_id'], $this->payGradeIds)) {
                $errors[] = "Pay Grade ID {$row['pay_grade_structure_id']} is not valid for this client";
            }
        }

        // Check date formats
        if (!empty($row['date_of_birth'])) {
            if (!$this->isValidDate($row['date_of_birth'])) {
                $errors[] = "Date of birth must be in YYYY-MM-DD format";
            }
        }

        if (!empty($row['hire_date'])) {
            if (!$this->isValidDate($row['hire_date'])) {
                $errors[] = "Hire date must be in YYYY-MM-DD format";
            }
        }

        // Validate contract dates if provided
        if (!empty($row['contract_start_date'])) {
            if (!$this->isValidDate($row['contract_start_date'])) {
                $errors[] = "Contract start date must be in YYYY-MM-DD format";
            }
        }

        if (!empty($row['contract_end_date'])) {
            if (!$this->isValidDate($row['contract_end_date'])) {
                $errors[] = "Contract end date must be in YYYY-MM-DD format";
            }

            // Check if end date is after start date
            if (
                !empty($row['contract_start_date']) &&
                $this->isValidDate($row['contract_start_date']) &&
                $this->isValidDate($row['contract_end_date'])
            ) {
                if (strtotime($row['contract_end_date']) <= strtotime($row['contract_start_date'])) {
                    $errors[] = "Contract end date must be after start date";
                }
            }
        }

        // Check email uniqueness (simplified - in production you'd check database)
        if (!empty($row['email'])) {
            if (!filter_var($row['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Invalid email format";
            }
        }

        // Check phone number format
        if (!empty($row['phone_number'])) {
            if (!preg_match('/^[\+]?[0-9\-\s\(\)]+$/', $row['phone_number'])) {
                $errors[] = "Invalid phone number format";
            }
        }

        return $errors;
    }

    /**
     * Check if date string is valid
     */
    private function isValidDate($date): bool
    {
        if (empty($date)) {
            return false;
        }

        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    /**
     * Normalize row data for database insertion
     */
    private function normalizeRowData($row): array
    {
        return [
            'employee_code' => trim($row['employee_code']),
            'first_name' => trim($row['first_name']),
            'middle_name' => trim($row['middle_name'] ?? ''),
            'last_name' => trim($row['last_name']),
            'email' => strtolower(trim($row['email'])),
            'phone_number' => trim($row['phone_number']),
            'date_of_birth' => $row['date_of_birth'],
            'gender' => ucfirst(strtolower(trim($row['gender']))),
            'national_id' => trim($row['national_id'] ?? ''),
            'passport_number' => trim($row['passport_number'] ?? ''),
            'address' => trim($row['address'] ?? ''),
            'hire_date' => $row['hire_date'],
            'contract_start_date' => $row['contract_start_date'] ?? null,
            'contract_end_date' => $row['contract_end_date'] ?? null,
            'pay_grade_structure_id' => (int)$row['pay_grade_structure_id'],
            'emergency_contact_name' => trim($row['emergency_contact_name'] ?? ''),
            'emergency_contact_phone' => trim($row['emergency_contact_phone'] ?? ''),
            'emergency_contact_address' => trim($row['emergency_contact_address'] ?? ''),
            'client_id' => $this->clientId,
            'recruitment_request_id' => $this->ticketId
        ];
    }

    /**
     * Return validation summary
     */
    public function getValidationSummary(): array
    {
        return [
            'total_rows' => count($this->validRows) + count($this->invalidRows),
            'valid_rows' => count($this->validRows),
            'invalid_rows' => count($this->invalidRows),
            'validation_errors' => $this->validationErrors,
            'has_errors' => !empty($this->invalidRows)
        ];
    }

    /**
     * Get valid rows for processing
     */
    public function getValidRows(): array
    {
        return $this->validRows;
    }

    /**
     * Get invalid rows with errors
     */
    public function getInvalidRows(): array
    {
        return $this->invalidRows;
    }

    /**
     * Chunk size for reading large files
     */
    public function chunkSize(): int
    {
        return 500; // Process 500 rows at a time
    }
}
