<?php

namespace App\Http\Controllers;

use App\Models\Recruitment\RecruitmentRequest;
use App\Models\Client;
use App\Models\Staff;
use App\Models\StaffBanking;
use App\Models\StaffPersonalInfo;
use App\Models\StaffLegalId;
use App\Models\StaffEducation;
use App\Models\StaffExperience;
use App\Models\StaffEmergencyContact;
use App\Models\StaffGuarantor;
use App\Models\PayGradeStructure;
use App\Services\StaffBoardingService;
use App\Services\RecruitmentHierarchyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class BulkStaffUploadController extends Controller
{
    private StaffBoardingService $boardingService;
    private RecruitmentHierarchyService $hierarchyService;

    public function __construct(
        StaffBoardingService $boardingService,
        RecruitmentHierarchyService $hierarchyService
    ) {
        $this->boardingService = $boardingService;
        $this->hierarchyService = $hierarchyService;
    }

    /**
     * Download comprehensive staff bulk upload template
     * 
     * GET /api/bulk-staff-upload/download-template
     */
    public function downloadTemplate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:clients,id',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $client = Client::findOrFail($request->client_id);
            $ticket = RecruitmentRequest::with('jobStructure')->findOrFail($request->recruitment_request_id);

            // Verify ticket belongs to client
            if ($ticket->client_id !== $client->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Recruitment request does not belong to this client'
                ], 400);
            }

            // Get available pay grades for this job structure
            $payGrades = PayGradeStructure::where('job_structure_id', $ticket->job_structure_id)
                ->where('is_active', true)
                ->get();

            if ($payGrades->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active pay grades found for this job structure'
                ], 400);
            }

            $spreadsheet = new Spreadsheet();

            // Remove default sheet
            $spreadsheet->removeSheetByIndex(0);

            // Sheet 1: Instructions
            $this->createInstructionsSheet($spreadsheet, $client, $ticket);

            // Sheet 2: Staff Data Template
            $this->createStaffDataSheet($spreadsheet, $client, $ticket, $payGrades);

            // Sheet 3: Pay Grades Reference
            $this->createPayGradeReferenceSheet($spreadsheet, $payGrades);

            // Sheet 4: Field Descriptions
            $this->createFieldDescriptionsSheet($spreadsheet);

            // Single tab design - all fields in Staff Data sheet (no child sheets)

            // Set active sheet to Staff Data
            $spreadsheet->setActiveSheetIndex(1);

            $filename = "Staff_Bulk_Upload_{$client->organisation_name}_{$ticket->ticket_id}_" . date('Ymd') . ".xlsx";

            $writer = new Xlsx($spreadsheet);
            $temp_file = tempnam(sys_get_temp_dir(), 'staff_template_');
            $writer->save($temp_file);

            return response()->download($temp_file, $filename)->deleteFileAfterSend();
        } catch (\Exception $e) {
            Log::error('Failed to generate bulk upload template', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview uploaded staff data with validation
     * 
     * POST /api/bulk-staff-upload/preview
     */
    public function previewUpload(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'excel_file' => 'required|file|mimes:xlsx,xls|max:10240',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $ticket = RecruitmentRequest::with('client')->findOrFail($request->recruitment_request_id);
            $user = Auth::user();

            // Permission check
            if (!$this->canUseTicket($user, $ticket)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to use this recruitment request'
                ], 403);
            }

            $file = $request->file('excel_file');
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getSheetByName('Staff Data') ?? $spreadsheet->getActiveSheet();

            $data = $sheet->toArray(null, true, true, true);

            // Find header row
            $headerRow = $this->findHeaderRow($data);
            if (!$headerRow) {
                return response()->json([
                    'success' => false,
                    'message' => 'Could not find header row. Ensure "Employee Code" is in the first row of data.'
                ], 400);
            }

            $headers = $data[$headerRow];
            $dataRows = array_slice($data, $headerRow + 1);

            // Map headers to field names
            $fieldMapping = $this->mapHeaders($headers);

            // Process and validate rows
            $validRecords = [];
            $invalidRecords = [];
            $allErrors = [];

            foreach ($dataRows as $rowIndex => $row) {
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                $mappedRow = $this->mapRowToFields($row, $fieldMapping);
                $validation = $this->validateRow($mappedRow, $ticket);

                if ($validation['valid']) {
                    $validRecords[] = array_merge($mappedRow, [
                        'row_number' => $rowIndex + 1
                    ]);
                } else {
                    $invalidRecords[] = [
                        'row_number' => $rowIndex + 1,
                        'data' => [
                            'employee_code' => $mappedRow['employee_code'] ?? '',
                            'first_name' => $mappedRow['first_name'] ?? '',
                            'last_name' => $mappedRow['last_name'] ?? '',
                        ],
                        'errors' => $validation['errors']
                    ];
                    $allErrors = array_merge($allErrors, $validation['errors']);
                }
            }

            $availableSlots = $ticket->number_of_vacancies - $ticket->staff_accepted_offer;

            return response()->json([
                'success' => true,
                'message' => 'Preview generated successfully',
                'data' => [
                    'total_rows' => count($dataRows),
                    'valid_rows' => count($validRecords),
                    'invalid_rows' => count($invalidRecords),
                    'available_slots' => max(0, $availableSlots),
                    'preview_data' => array_slice($validRecords, 0, 10), // First 10 for preview
                    'invalid_records' => array_slice($invalidRecords, 0, 20), // First 20 invalid
                    'error_summary' => array_slice($allErrors, 0, 50), // First 50 errors
                    'can_proceed' => count($invalidRecords) === 0 && count($validRecords) > 0 && count($validRecords) <= $availableSlots,
                    'warnings' => count($validRecords) > $availableSlots ?
                        ["You have " . count($validRecords) . " valid records but only {$availableSlots} available slots"] : []
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to preview bulk upload', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to parse file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process bulk staff upload
     * 
     * POST /api/bulk-staff-upload/process
     */
    public function processUpload(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'excel_file' => 'required|file|mimes:xlsx,xls|max:10240',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'offer_already_accepted' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $ticket = RecruitmentRequest::with('client')->findOrFail($request->recruitment_request_id);
            $user = Auth::user();

            if (!$this->canUseTicket($user, $ticket)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to use this recruitment request'
                ], 403);
            }

            DB::beginTransaction();
            try {
                $file = $request->file('excel_file');
                $spreadsheet = IOFactory::load($file->getRealPath());
                $sheet = $spreadsheet->getSheetByName('Staff Data') ?? $spreadsheet->getActiveSheet();

                $data = $sheet->toArray(null, true, true, true);

                // Find header row and process
                $headerRow = $this->findHeaderRow($data);
                if (!$headerRow) {
                    throw new \Exception('Could not find header row in uploaded file');
                }

                $headers = $data[$headerRow];
                $dataRows = array_slice($data, $headerRow + 1);
                $fieldMapping = $this->mapHeaders($headers);

                $successCount = 0;
                $failedCount = 0;
                $errors = [];
                $createdStaff = [];

                foreach ($dataRows as $rowIndex => $row) {
                    if (empty(array_filter($row))) continue;

                    try {
                        $mappedRow = $this->mapRowToFields($row, $fieldMapping);
                        $validation = $this->validateRow($mappedRow, $ticket);

                        if (!$validation['valid']) {
                            $failedCount++;
                            $errors[] = "Row " . ($rowIndex + 1) . ": " . implode(', ', $validation['errors']);
                            continue;
                        }

                        // Use the validated and modified data from validation
                        $validatedRow = $validation['data'];

                        // Prepare staff data
                        $staffData = $this->prepareStaffData($validatedRow, $ticket, $request->offer_already_accepted);

                        // Board staff using service
                        $staff = $this->boardingService->boardStaff($staffData, $user, $ticket);

                        // Create related records if data provided
                        $this->createRelatedRecords($staff, $validatedRow);

                        $successCount++;
                        $createdStaff[] = [
                            'id' => $staff->id,
                            'employee_code' => $staff->employee_code,
                            'name' => $staff->first_name . ' ' . $staff->last_name,
                            'status' => $staff->boarding_approval_status,
                        ];
                    } catch (\Exception $e) {
                        $failedCount++;
                        $errors[] = "Row " . ($rowIndex + 1) . ": " . $e->getMessage();
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => "Bulk upload completed: {$successCount} staff boarded successfully",
                    'data' => [
                        'successful_records' => $successCount,
                        'failed_records' => $failedCount,
                        'created_staff' => $createdStaff,
                        'errors' => $errors,
                        'ticket_status' => [
                            'filled' => $ticket->fresh()->staff_accepted_offer ?? 0,
                            'total' => $ticket->number_of_vacancies,
                        ],
                    ]
                ], 200);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Bulk upload processing failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // ================================================================
    // PRIVATE HELPER METHODS
    // ================================================================

    /**
     * Create instructions sheet
     */
    private function createInstructionsSheet(Spreadsheet $spreadsheet, Client $client, RecruitmentRequest $ticket)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Instructions');

        $row = 1;
        $sheet->setCellValue('A' . $row, 'STAFF BULK UPLOAD TEMPLATE');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true)->setSize(16);
        $row += 2;

        $sheet->setCellValue('A' . $row, 'Client:');
        $sheet->setCellValue('B' . $row, $client->organisation_name);
        $row++;

        $sheet->setCellValue('A' . $row, 'Recruitment Request:');
        $sheet->setCellValue('B' . $row, $ticket->ticket_id);
        $row++;

        $sheet->setCellValue('A' . $row, 'Job Title:');
        $sheet->setCellValue('B' . $row, $ticket->jobStructure->job_title ?? 'N/A');
        $row++;

        $sheet->setCellValue('A' . $row, 'Total Vacancies:');
        $sheet->setCellValue('B' . $row, $ticket->number_of_vacancies);
        $row++;

        $sheet->setCellValue('A' . $row, 'Already Filled:');
        $sheet->setCellValue('B' . $row, $ticket->staff_accepted_offer ?? 0);
        $row += 2;

        $sheet->setCellValue('A' . $row, 'MANDATORY FIELDS (marked with * in yellow):');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $mandatoryFields = [
            '1. Employee Code - Unique identifier for this client',
            '2. Staff ID - Global unique identifier',
            '3. First Name',
            '4. Last Name',
            '5. Pay Grade ID - Must match ID from "Pay Grades Reference" sheet',
            '6. Entry Date - Format: YYYY-MM-DD',
        ];

        foreach ($mandatoryFields as $field) {
            $sheet->setCellValue('A' . $row, $field);
            $row++;
        }

        $row++;
        $sheet->setCellValue('A' . $row, 'OPTIONAL FIELDS:');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;
        $sheet->setCellValue('A' . $row, 'All other fields are optional but recommended for complete records.');

        $sheet->getColumnDimension('A')->setWidth(80);
        $sheet->getColumnDimension('B')->setWidth(40);
    }

    /**
     * Create staff data sheet with all columns
     */
    private function createStaffDataSheet(Spreadsheet $spreadsheet, Client $client, RecruitmentRequest $ticket, $payGrades)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Staff Data');

        // Define all headers
        $headers = [
            // MANDATORY FIELDS (marked with *)
            'A' => 'Employee Code *',
            'B' => 'Staff ID *',
            'C' => 'First Name *',
            'D' => 'Middle Name',
            'E' => 'Last Name *',
            // Use grade_code (user friendly) rather than internal pay_grade_structure_id
            'F' => 'Pay Grade Code *',

            // PERSONAL INFO
            'G' => 'Email',
            'H' => 'Mobile Phone',
            'I' => 'Gender (male/female)',
            'J' => 'Date of Birth (YYYY-MM-DD)',
            'K' => 'Marital Status',
            'L' => 'Nationality',
            'M' => 'State of Origin',
            'N' => 'LGA of Origin',
            'O' => 'Current Address',
            'P' => 'Permanent Address',

            // EMPLOYMENT INFO
            'Q' => 'Entry Date (YYYY-MM-DD) *',
            'R' => 'Appointment Status',
            'S' => 'Employment Type',
            'T' => 'Department',

            // LEGAL IDs
            'U' => 'National ID No',
            'V' => 'Tax ID No',
            'W' => 'Pension PIN',
            'X' => 'PFA Name',
            'Y' => 'BVN',
            'Z' => 'NHF Account No',

            // BANKING
            'AA' => 'Payment Mode',
            'AB' => 'Bank Name',
            'AC' => 'Account Number',
            'AD' => 'Account Name',
            'AE' => 'Sort Code',

            // EMERGENCY CONTACT
            'AF' => 'Emergency Contact Name',
            'AG' => 'Emergency Contact Phone',
            'AH' => 'Emergency Contact Relationship',
            'AI' => 'Emergency Contact Address',

            // GUARANTOR
            'AJ' => 'Guarantor Name',
            'AK' => 'Guarantor Phone',
            'AL' => 'Guarantor Email',
            'AM' => 'Guarantor Relationship',

            // EDUCATION (single highest qualification entry)
            'AN' => 'Highest Institution',
            'AO' => 'Highest Qualification',
            'AP' => 'Field of Study',
            'AQ' => 'Graduation Year',

            // EXPERIENCE (most recent)
            'AR' => 'Last Employer',
            'AS' => 'Last Position',
            'AT' => 'Experience Start Date',
            'AU' => 'Experience End Date',
        ];

        // Set headers
        $row = 1;
        foreach ($headers as $col => $header) {
            $sheet->setCellValue($col . $row, $header);
            $sheet->getStyle($col . $row)->getFont()->setBold(true);

            // Highlight mandatory fields
            if (strpos($header, '*') !== false) {
                $sheet->getStyle($col . $row)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('FFD700'); // Gold
            }
        }

        // Add sample row
        $sampleRow = 2;
        $sheet->setCellValue('A' . $sampleRow, 'SOL/' . strtoupper(substr($client->organisation_name, 0, 4)) . '/001');
        $sheet->setCellValue('B' . $sampleRow, 'SOL/' . strtoupper(substr($client->organisation_name, 0, 4)) . '/001');
        $sheet->setCellValue('C' . $sampleRow, 'John');
        $sheet->setCellValue('D' . $sampleRow, 'Kofi');
        $sheet->setCellValue('E' . $sampleRow, 'Mensah');
        $sheet->setCellValue('F' . $sampleRow, $payGrades->first()->grade_code ?? '');
        $sheet->setCellValue('G' . $sampleRow, 'john.mensah@example.com');
        $sheet->setCellValue('H' . $sampleRow, '08012345678');
        $sheet->setCellValue('I' . $sampleRow, 'male');
        $sheet->setCellValue('J' . $sampleRow, '1990-01-15');
        $sheet->setCellValue('Q' . $sampleRow, date('Y-m-d'));

        // Style sample row
        $sheet->getStyle('A' . $sampleRow . ':AG' . $sampleRow)->getFont()->setItalic(true);
        $sheet->getStyle('A' . $sampleRow . ':AG' . $sampleRow)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('E0E0E0');

        // Auto-size columns (A through AU)
        $columns = array_merge(range('A', 'Z'), ['AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU']);
        foreach ($columns as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Create pay grade reference sheet
     */
    private function createPayGradeReferenceSheet(Spreadsheet $spreadsheet, $payGrades)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Pay Grades Reference');

        $sheet->setCellValue('A1', 'Pay Grade ID');
        $sheet->setCellValue('B1', 'Grade Name');
        $sheet->setCellValue('C1', 'Grade Code');
        $sheet->setCellValue('D1', 'Total Compensation');

        $sheet->getStyle('A1:D1')->getFont()->setBold(true);

        $row = 2;
        foreach ($payGrades as $grade) {
            $sheet->setCellValue('A' . $row, $grade->id);
            $sheet->setCellValue('B' . $row, $grade->grade_name);
            $sheet->setCellValue('C' . $row, $grade->grade_code);
            $sheet->setCellValue('D' . $row, number_format($grade->total_compensation ?? 0, 2));
            $row++;
        }

        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Create field descriptions sheet
     */
    private function createFieldDescriptionsSheet(Spreadsheet $spreadsheet)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Field Descriptions');

        $sheet->setCellValue('A1', 'Field Name');
        $sheet->setCellValue('B1', 'Description');
        $sheet->setCellValue('C1', 'Format/Example');
        $sheet->setCellValue('D1', 'Required');

        $sheet->getStyle('A1:D1')->getFont()->setBold(true);

        $descriptions = [
            ['Employee Code', 'Unique identifier for staff within client', 'SOL/CLIENT/001', 'Yes'],
            ['Staff ID', 'Global unique identifier', 'SOL/CLIENT/001', 'Yes'],
            ['First Name', 'Staff first name', 'John', 'Yes'],
            ['Last Name', 'Staff last name', 'Smith', 'Yes'],
            ['Pay Grade ID', 'ID from Pay Grades Reference sheet', '15', 'Yes'],
            ['Entry Date', 'Date staff joined', '2024-01-15', 'Yes'],
            ['Email', 'Work email address', 'john@company.com', 'No'],
            ['Mobile Phone', 'Contact number', '08012345678', 'No'],
            ['Gender', 'Male or Female', 'male', 'No'],
            ['Date of Birth', 'Birth date', '1990-05-20', 'No'],
        ];

        $row = 2;
        foreach ($descriptions as $desc) {
            $sheet->setCellValue('A' . $row, $desc[0]);
            $sheet->setCellValue('B' . $row, $desc[1]);
            $sheet->setCellValue('C' . $row, $desc[2]);
            $sheet->setCellValue('D' . $row, $desc[3]);
            $row++;
        }

        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Find header row in data
     */
    private function findHeaderRow(array $data): ?int
    {
        foreach ($data as $index => $row) {
            if (isset($row['A']) && (stripos($row['A'], 'employee') !== false || stripos($row['A'], 'Employee Code') !== false)) {
                return $index;
            }
        }
        return null;
    }

    /**
     * Map Excel headers to field names
     */
    private function mapHeaders(array $headers): array
    {
        $mapping = [];
        foreach ($headers as $col => $header) {
            $headerLower = strtolower(trim(str_replace('*', '', $header)));

            // Core staff fields
            if (strpos($headerLower, 'employee code') !== false) $mapping[$col] = 'employee_code';
            elseif (strpos($headerLower, 'staff id') !== false && strpos($headerLower, 'tax') === false) $mapping[$col] = 'staff_id';
            elseif (strpos($headerLower, 'first name') !== false) $mapping[$col] = 'first_name';
            elseif (strpos($headerLower, 'middle name') !== false) $mapping[$col] = 'middle_name';
            elseif (strpos($headerLower, 'last name') !== false) $mapping[$col] = 'last_name';
            elseif (strpos($headerLower, 'pay grade code') !== false || strpos($headerLower, 'grade code') !== false) $mapping[$col] = 'grade_code';
            elseif (strpos($headerLower, 'pay grade id') !== false) $mapping[$col] = 'pay_grade_structure_id';

            // Contact & Personal
            elseif (strpos($headerLower, 'email') !== false && strpos($headerLower, 'guarantor') === false) $mapping[$col] = 'email';
            elseif (strpos($headerLower, 'mobile') !== false || (strpos($headerLower, 'phone') !== false && strpos($headerLower, 'emergency') === false && strpos($headerLower, 'guarantor') === false && strpos($headerLower, 'next of kin') === false)) $mapping[$col] = 'mobile_phone';
            elseif (strpos($headerLower, 'gender') !== false) $mapping[$col] = 'gender';
            elseif (strpos($headerLower, 'date of birth') !== false || strpos($headerLower, 'dob') !== false) $mapping[$col] = 'date_of_birth';
            elseif (strpos($headerLower, 'marital status') !== false) $mapping[$col] = 'marital_status';
            elseif (strpos($headerLower, 'nationality') !== false) $mapping[$col] = 'nationality';
            elseif (strpos($headerLower, 'state of origin') !== false || strpos($headerLower, 'state') !== false) $mapping[$col] = 'state_of_origin';
            elseif (strpos($headerLower, 'lga') !== false) $mapping[$col] = 'lga_of_origin';
            elseif (strpos($headerLower, 'current address') !== false) $mapping[$col] = 'current_address';
            elseif (strpos($headerLower, 'permanent address') !== false) $mapping[$col] = 'permanent_address';

            // Employment
            elseif (strpos($headerLower, 'entry date') !== false) $mapping[$col] = 'entry_date';
            elseif (strpos($headerLower, 'appointment status') !== false) $mapping[$col] = 'appointment_status';
            elseif (strpos($headerLower, 'employment type') !== false) $mapping[$col] = 'employment_type';
            elseif (strpos($headerLower, 'department') !== false) $mapping[$col] = 'department';

            // Legal IDs
            elseif (strpos($headerLower, 'national id') !== false || strpos($headerLower, 'nin') !== false) $mapping[$col] = 'national_id_no';
            elseif (strpos($headerLower, 'tax id') !== false) $mapping[$col] = 'tax_id_no';
            elseif (strpos($headerLower, 'pension pin') !== false) $mapping[$col] = 'pension_pin';
            elseif (strpos($headerLower, 'pfa name') !== false) $mapping[$col] = 'pfa_name';
            elseif (strpos($headerLower, 'bvn') !== false) $mapping[$col] = 'bvn';
            elseif (strpos($headerLower, 'nhf') !== false) $mapping[$col] = 'nhf_account_no';

            // Banking
            elseif (strpos($headerLower, 'payment mode') !== false) $mapping[$col] = 'payment_mode';
            elseif (strpos($headerLower, 'bank name') !== false) $mapping[$col] = 'bank_name';
            elseif (strpos($headerLower, 'account number') !== false) $mapping[$col] = 'account_number';
            elseif (strpos($headerLower, 'account name') !== false) $mapping[$col] = 'account_name';
            elseif (strpos($headerLower, 'sort code') !== false) $mapping[$col] = 'sort_code';

            // Emergency Contact
            elseif (strpos($headerLower, 'emergency contact name') !== false) $mapping[$col] = 'emergency_contact_name';
            elseif (strpos($headerLower, 'emergency contact phone') !== false) $mapping[$col] = 'emergency_contact_phone';
            elseif (strpos($headerLower, 'emergency contact relationship') !== false) $mapping[$col] = 'emergency_contact_relationship';
            elseif (strpos($headerLower, 'emergency contact address') !== false) $mapping[$col] = 'emergency_contact_address';

            // Guarantor
            elseif (strpos($headerLower, 'guarantor name') !== false) $mapping[$col] = 'guarantor_name';
            elseif (strpos($headerLower, 'guarantor phone') !== false) $mapping[$col] = 'guarantor_phone';
            elseif (strpos($headerLower, 'guarantor email') !== false) $mapping[$col] = 'guarantor_email';
            elseif (strpos($headerLower, 'guarantor relationship') !== false) $mapping[$col] = 'guarantor_relationship';

            // Education
            elseif (strpos($headerLower, 'highest institution') !== false || strpos($headerLower, 'institution') !== false) $mapping[$col] = 'highest_institution';
            elseif (strpos($headerLower, 'highest qualification') !== false || strpos($headerLower, 'qualification') !== false) $mapping[$col] = 'highest_qualification';
            elseif (strpos($headerLower, 'field of study') !== false) $mapping[$col] = 'field_of_study';
            elseif (strpos($headerLower, 'graduation year') !== false) $mapping[$col] = 'graduation_year';

            // Experience
            elseif (strpos($headerLower, 'last employer') !== false) $mapping[$col] = 'last_employer';
            elseif (strpos($headerLower, 'last position') !== false) $mapping[$col] = 'last_position';
            elseif (strpos($headerLower, 'experience start date') !== false) $mapping[$col] = 'experience_start_date';
            elseif (strpos($headerLower, 'experience end date') !== false) $mapping[$col] = 'experience_end_date';
        }
        return $mapping;
    }

    /**
     * Map row data to fields
     */
    private function mapRowToFields(array $row, array $fieldMapping): array
    {
        $mapped = [];
        foreach ($fieldMapping as $col => $field) {
            $mapped[$field] = $row[$col] ?? null;
        }
        return $mapped;
    }

    /**
     * Validate single row with smart parsing
     */
    private function validateRow(array $row, RecruitmentRequest $ticket): array
    {
        $errors = [];

        // Mandatory fields
        if (empty($row['employee_code'])) $errors[] = 'Employee Code is required';
        if (empty($row['staff_id'])) $errors[] = 'Staff ID is required';
        if (empty($row['first_name'])) $errors[] = 'First Name is required';
        if (empty($row['last_name'])) $errors[] = 'Last Name is required';
        if (empty($row['grade_code'])) $errors[] = 'Pay Grade Code is required';
        if (empty($row['entry_date'])) $errors[] = 'Entry Date is required';

        // Check for duplicate employee_code within client
        if (!empty($row['employee_code'])) {
            $exists = Staff::where('employee_code', $row['employee_code'])
                ->whereHas('recruitmentRequest', function ($q) use ($ticket) {
                    $q->where('client_id', $ticket->client_id);
                })
                ->exists();

            if ($exists) {
                $errors[] = "Employee Code '{$row['employee_code']}' already exists for this client";
            }
        }

        // Check for duplicate staff_id globally
        if (!empty($row['staff_id'])) {
            if (Staff::where('staff_id', $row['staff_id'])->exists()) {
                $errors[] = "Staff ID '{$row['staff_id']}' already exists";
            }
        }

        // Smart grade_code resolution (case-insensitive)
        if (!empty($row['grade_code'])) {
            // Normalize grade code: trim whitespace and convert to uppercase for matching
            $normalizedGradeCode = strtoupper(trim($row['grade_code']));

            $payGrade = PayGradeStructure::whereRaw('UPPER(grade_code) = ?', [$normalizedGradeCode])
                ->where('job_structure_id', $ticket->job_structure_id)
                ->where('is_active', true)
                ->first();

            if (!$payGrade) {
                $errors[] = "Invalid Grade Code: '{$row['grade_code']}'. Check Pay Grades Reference sheet for valid codes.";
            } else {
                // Store resolved ID for use in prepareStaffData
                $row['pay_grade_structure_id'] = $payGrade->id;
                // Update row with normalized grade code
                $row['grade_code'] = $payGrade->grade_code;
            }
        }

        // Smart date parsing for entry_date
        if (!empty($row['entry_date'])) {
            $parsedDate = $this->parseDate($row['entry_date']);
            if ($parsedDate) {
                $row['entry_date'] = $parsedDate;
            } else {
                $errors[] = "Invalid Entry Date format: '{$row['entry_date']}'. Use YYYY-MM-DD or DD/MM/YYYY";
            }
        }

        // Smart date parsing for date_of_birth (optional field)
        if (!empty($row['date_of_birth'])) {
            $parsedDate = $this->parseDate($row['date_of_birth']);
            if ($parsedDate) {
                $row['date_of_birth'] = $parsedDate;
            } else {
                // Don't fail validation, just clear the field
                $row['date_of_birth'] = null;
                Log::warning('Invalid date_of_birth format, cleared', ['value' => $row['date_of_birth']]);
            }
        }

        // Smart date parsing for experience dates (optional fields)
        if (!empty($row['experience_start_date'])) {
            $parsedDate = $this->parseDate($row['experience_start_date']);
            $row['experience_start_date'] = $parsedDate ?: null;
        }
        if (!empty($row['experience_end_date'])) {
            $parsedDate = $this->parseDate($row['experience_end_date']);
            $row['experience_end_date'] = $parsedDate ?: null;
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'data' => $row  // Return modified row data
        ];
    }

    /**
     * Smart date parser - handles multiple formats
     * Supports: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, text dates, Excel numeric dates
     */
    private function parseDate($dateValue): ?string
    {
        if (empty($dateValue)) {
            return null;
        }

        // If already a DateTime object (from Excel)
        if ($dateValue instanceof \DateTime) {
            return $dateValue->format('Y-m-d');
        }

        // If it's an Excel numeric date (e.g., 44927 for 2023-01-01)
        if (is_numeric($dateValue)) {
            try {
                // Excel dates are days since 1900-01-01 (with leap year bug)
                $unixTimestamp = ($dateValue - 25569) * 86400;
                return date('Y-m-d', $unixTimestamp);
            } catch (\Exception $e) {
                // Fall through to other methods
            }
        }

        // Try common date formats
        $formats = [
            'Y-m-d',           // 2025-01-01
            'd/m/Y',           // 01/01/2025
            'm/d/Y',           // 01/01/2025 (US format)
            'd-m-Y',           // 01-01-2025
            'Y/m/d',           // 2025/01/01
            'd.m.Y',           // 01.01.2025
            'j F Y',           // 1 January 2025
            'F j, Y',          // January 1, 2025
            'd M Y',           // 01 Jan 2025
            'M d, Y',          // Jan 01, 2025
        ];

        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $dateValue);
            if ($date && $date->format($format) === $dateValue) {
                return $date->format('Y-m-d');
            }
        }

        // Try strtotime as last resort
        try {
            $timestamp = strtotime($dateValue);
            if ($timestamp !== false) {
                return date('Y-m-d', $timestamp);
            }
        } catch (\Exception $e) {
            // Failed to parse
        }

        return null;
    }

    /**
     * Map employment type from Excel to database ENUM values
     */
    private function mapEmploymentType(?string $type): string
    {
        if (empty($type)) {
            return 'full_time'; // default
        }

        $type = strtolower(trim($type));
        
        // Map common variations to ENUM values
        if (strpos($type, 'full') !== false || strpos($type, 'employment') !== false) {
            return 'full_time';
        } elseif (strpos($type, 'part') !== false) {
            return 'part_time';
        } elseif (strpos($type, 'contract') !== false) {
            return 'contract';
        } elseif (strpos($type, 'intern') !== false) {
            return 'internship';
        } elseif (strpos($type, 'temp') !== false) {
            return 'temporary';
        }

        return 'full_time'; // default
    }

    /**
     * Prepare staff data for boarding
     */
    private function prepareStaffData(array $row, RecruitmentRequest $ticket, bool $offerAccepted): array
    {
        // Get or create default staff type based on client
        // Client 1: Use "Professional", Others: Use "Associate"
        $staffTypeName = ($ticket->client_id == 1) ? 'Professional' : 'Associate';
        
        $staffType = \App\Models\ClientStaffType::where('client_id', $ticket->client_id)
            ->where('title', $staffTypeName)
            ->where('is_active', true)
            ->first();

        // If staff type doesn't exist, create it
        if (!$staffType) {
            $typeCode = ($ticket->client_id == 1) ? 'PROF' : 'ASSOC';
            $staffType = \App\Models\ClientStaffType::create([
                'client_id' => $ticket->client_id,
                'type_code' => $typeCode,
                'title' => $staffTypeName,
                'is_active' => true,
            ]);
        }

        return [
            'client_id' => $ticket->client_id,
            'staff_type_id' => $staffType->id,
            'employee_code' => $row['employee_code'],
            'staff_id' => $row['staff_id'],
            'first_name' => $row['first_name'],
            'middle_name' => $row['middle_name'] ?? null,
            'last_name' => $row['last_name'],
            'pay_grade_structure_id' => $row['pay_grade_structure_id'],
            'entry_date' => $row['entry_date'],
            'email' => $row['email'] ?? null,
            'mobile_phone' => $row['mobile_phone'] ?? null,
            'gender' => $row['gender'] ?? null,
            'date_of_birth' => $row['date_of_birth'] ?? null,
            
            // Employment details
            'appointment_status' => $row['appointment_status'] ?? 'probation',
            'employment_type' => $this->mapEmploymentType($row['employment_type'] ?? null),
            'department' => $row['department'] ?? null,
            'job_title' => $row['last_position'] ?? null, // Use last position as job title if available
            
            // Legal IDs that go in staff table
            'tax_id_no' => $row['tax_id_no'] ?? null,
            'pf_no' => $row['pension_pin'] ?? null,
            'pfa_code' => $row['pfa_name'] ?? null,
            'bv_no' => $row['bvn'] ?? null,
            'nhf_account_no' => $row['nhf_account_no'] ?? null,
            
            'offer_already_accepted' => $offerAccepted,
        ];
    }

    /**
     * Create related records (personal info, banking, etc.)
     */
    private function createRelatedRecords(Staff $staff, array $row)
    {
        try {
            // Banking - CORRECTED to match actual database schema
            if (!empty($row['bank_name']) || !empty($row['account_number'])) {
                // Map payment mode values to enum
                $paymentMode = 'bank_transfer'; // default
                if (!empty($row['payment_mode'])) {
                    $mode = strtolower(trim($row['payment_mode']));
                    if (strpos($mode, 'cash') !== false) {
                        $paymentMode = 'cash';
                    } elseif (strpos($mode, 'cheque') !== false || strpos($mode, 'check') !== false) {
                        $paymentMode = 'cheque';
                    } else {
                        $paymentMode = 'bank_transfer'; // for "Credit Transfer", "Bank Transfer", etc.
                    }
                }
                
                StaffBanking::create([
                    'staff_id' => $staff->id,
                    'payment_mode' => $paymentMode,
                    'bank_name' => $row['bank_name'] ?? null,
                    'account_number' => $row['account_number'] ?? null,
                    // NOTE: account_name, bvn, sort_code don't exist in staff_banking table
                ]);
                Log::info('Created banking record for staff', ['staff_id' => $staff->id]);
            }

            // Personal Info - CORRECTED to match actual database schema
            if (!empty($row['marital_status']) || !empty($row['nationality']) || !empty($row['current_address'])) {
                StaffPersonalInfo::create([
                    'staff_id' => $staff->id,
                    'middle_name' => $row['middle_name'] ?? null,
                    'marital_status' => $row['marital_status'] ?? null,
                    'nationality' => $row['nationality'] ?? 'Nigerian',
                    'state_of_origin' => $row['state_of_origin'] ?? null,
                    'local_government_of_origin' => $row['lga_of_origin'] ?? null, // CORRECTED: local_government_of_origin
                    'current_address' => $row['current_address'] ?? null, // CORRECTED: current_address (not residential_address)
                    'permanent_address' => $row['permanent_address'] ?? null,
                    'mobile_phone' => $row['mobile_phone'] ?? null,
                    'personal_email' => $row['email'] ?? null, // CORRECTED: personal_email
                    'blood_group' => null, // Database has this field
                    'state_of_residence' => null,
                    'lga_of_residence' => null,
                    'country' => 'Nigeria',
                    // NOTE: date_of_birth, gender, genotype, next_of_kin fields don't exist in staff_personal_info
                ]);
                Log::info('Created personal info record for staff', ['staff_id' => $staff->id]);
            }

            // Legal IDs - CORRECTED to match actual database schema
            if (!empty($row['national_id_no']) || !empty($row['tax_id_no']) || !empty($row['pension_pin'])) {
                StaffLegalId::create([
                    'staff_id' => $staff->id,
                    'national_id_no' => $row['national_id_no'] ?? null, // CORRECTED field name
                    'tax_id_no' => $row['tax_id_no'] ?? null,
                    'pension_pin' => $row['pension_pin'] ?? null, // CORRECTED field name
                    'pfa_name' => $row['pfa_name'] ?? null,
                    'bank_verification_no' => $row['bvn'] ?? null, // CORRECTED field name
                    'nhf_account_no' => $row['nhf_account_no'] ?? null,
                    // NOTE: drivers_license, international_passport, voters_card don't exist in staff_legal_ids
                ]);
                Log::info('Created legal IDs record for staff', ['staff_id' => $staff->id]);
            }

            // Emergency Contact - CORRECTED to match actual database schema
            if (!empty($row['emergency_contact_name']) && !empty($row['emergency_contact_phone'])) {
                StaffEmergencyContact::create([
                    'staff_id' => $staff->id,
                    'contact_type' => 'emergency', // REQUIRED field
                    'name' => $row['emergency_contact_name'],
                    'relationship' => $row['emergency_contact_relationship'] ?? 'Other', // REQUIRED field
                    'phone_number' => $row['emergency_contact_phone'], // CORRECTED: phone_number (not phone)
                    'address' => $row['emergency_contact_address'] ?? null,
                    'is_primary' => true,
                    'contact_order' => 1,
                ]);
                Log::info('Created emergency contact for staff', ['staff_id' => $staff->id]);
            }

            // Guarantor - CORRECTED to match actual database schema
            if (!empty($row['guarantor_name']) && !empty($row['guarantor_phone'])) {
                StaffGuarantor::create([
                    'staff_id' => $staff->id,
                    'name' => $row['guarantor_name'],
                    'phone_number' => $row['guarantor_phone'], // CORRECTED: phone_number (not phone)
                    'email' => $row['guarantor_email'] ?? null,
                    'relationship_to_applicant' => $row['guarantor_relationship'] ?? null, // CORRECTED field name
                    'address' => null, // Database has this field
                    'guarantor_order' => 1,
                    // NOTE: occupation doesn't exist; employer_details and bank_details exist but not populated
                ]);
                Log::info('Created guarantor record for staff', ['staff_id' => $staff->id]);
            }

            // Education - CORRECTED to match actual database schema
            if (!empty($row['highest_institution']) && !empty($row['highest_qualification'])) {
                StaffEducation::create([
                    'staff_id' => $staff->id,
                    'institution_name' => $row['highest_institution'], // CORRECTED: institution_name (not institution)
                    'certificate_type' => $row['highest_qualification'], // CORRECTED: certificate_type (not qualification)
                    'specialization' => $row['field_of_study'] ?? null, // CORRECTED: specialization (not field_of_study)
                    'start_year' => null,
                    'end_year' => $row['graduation_year'] ?? null,
                    'graduation_year' => $row['graduation_year'] ?? null,
                    'score_class' => null, // CORRECTED: score_class (not grade)
                    'education_order' => 1,
                ]);
                Log::info('Created education record for staff', ['staff_id' => $staff->id]);
            }

            // Experience - CORRECTED to match actual database schema
            if (!empty($row['last_employer']) && !empty($row['last_position'])) {
                StaffExperience::create([
                    'staff_id' => $staff->id,
                    'employer_name' => $row['last_employer'], // CORRECTED: employer_name (not company_name)
                    'designation' => $row['last_position'], // CORRECTED: designation (not position)
                    'start_date' => $row['experience_start_date'] ?? now()->subYear(), // REQUIRED field
                    'end_date' => $row['experience_end_date'] ?? null,
                    'job_description' => null,
                    'reason_for_leaving' => null,
                    'last_salary' => null, // CORRECTED: last_salary (not salary)
                    'experience_order' => 1,
                    // NOTE: is_current doesn't exist in database
                ]);
                Log::info('Created experience record for staff', ['staff_id' => $staff->id]);
            }
        } catch (\Exception $e) {
            Log::error('Error creating related records for staff', [
                'staff_id' => $staff->id,
                'error' => $e->getMessage()
            ]);
            // Don't throw - we still want the staff record to be created
        }
    }

    /**
     * Check if user can use this ticket
     */
    private function canUseTicket($user, RecruitmentRequest $ticket): bool
    {
        // Ticket creator
        if ($ticket->created_by === $user->id) return true;

        // Assigned user
        if ($ticket->assigned_to === $user->id) return true;

        // Users with board_without_approval permission
        if ($this->hierarchyService->canBoardWithoutApproval($user)) return true;

        return false;
    }
}
