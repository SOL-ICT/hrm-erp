<?php

namespace App\Http\Controllers\Api\RecruitmentManagement;

use App\Http\Controllers\Controller;
use App\Constants\DatabaseFields;
use App\Models\Client;
use App\Models\RecruitmentRequest;
use App\Models\PayGradeStructure;
use App\Models\Staff;
use App\Models\JobStructure;
use App\Models\ClientStaffType;
use App\Exports\StaffTemplateExport;
use App\Imports\StaffBulkImport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;

class ManualBoardingController extends Controller
{
    /**
     * Get clients with active recruitment requests for manual boarding
     */
    public function getClients(): JsonResponse
    {
        try {
            $clients = Client::where(DatabaseFields::CLIENTS['STATUS'], 'active')
                ->withCount(['recruitmentRequests' => function ($query) {
                    $query->where(DatabaseFields::RECRUITMENT_REQUESTS['STATUS'], 'active')
                        ->whereRaw(DatabaseFields::RECRUITMENT_REQUESTS['NUMBER_OF_VACANCIES'] . ' > ' . DatabaseFields::RECRUITMENT_REQUESTS['STAFF_ACCEPTED_OFFER']);
                }])
                ->having('recruitment_requests_count', '>', 0)
                ->orderBy(DatabaseFields::CLIENTS['ORGANISATION_NAME'])
                ->get([
                    DatabaseFields::CLIENTS['ID'],
                    DatabaseFields::CLIENTS['ORGANISATION_NAME'],
                    DatabaseFields::CLIENTS['PREFIX']
                ]);

            $transformedClients = $clients->map(function ($client) {
                return [
                    'id' => $client->{DatabaseFields::CLIENTS['ID']},
                    'client_name' => $client->{DatabaseFields::CLIENTS['ORGANISATION_NAME']},
                    'prefix' => $client->{DatabaseFields::CLIENTS['PREFIX']} ?? substr($client->{DatabaseFields::CLIENTS['ORGANISATION_NAME']}, 0, 3),
                    'active_tickets' => $client->recruitment_requests_count
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformedClients
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching clients for manual boarding: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching clients',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Get available recruitment tickets for a client
     */
    public function getTickets(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id'
        ]);

        try {
            $tickets = RecruitmentRequest::where('client_id', $request->client_id)
                ->where('status', 'active')
                ->whereRaw('number_of_vacancies > staff_accepted_offer')
                ->with(['jobStructure'])
                ->get()
                ->map(function ($ticket) {
                    $totalPositions = $ticket->number_of_vacancies;
                    $filledPositions = $ticket->staff_accepted_offer ?? 0;
                    $availablePositions = $totalPositions - $filledPositions;

                    return [
                        'id' => $ticket->id,
                        'ticket_code' => $ticket->ticket_id,
                        'job_title' => $ticket->jobStructure->job_title ?? 'N/A',
                        'job_structure_id' => $ticket->job_structure_id,
                        'total_positions' => $totalPositions,
                        'filled_positions' => $filledPositions,
                        'available_positions' => $availablePositions,
                        'service_location_id' => $ticket->service_location_id,
                        'description' => $ticket->description,
                        'status' => $ticket->status
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $tickets
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching tickets for manual boarding: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching recruitment tickets',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Get pay grades for a specific job structure or recruitment ticket
     */
    public function getPayGrades(Request $request): JsonResponse
    {
        // Accept either job_structure_id directly or ticket_id (recruitment_request_id)
        $request->validate([
            'job_structure_id' => 'sometimes|exists:job_structures,id',
            'ticket_id' => 'sometimes|exists:recruitment_requests,id'
        ]);

        try {
            $jobStructureId = null;

            if ($request->has('job_structure_id')) {
                $jobStructureId = $request->job_structure_id;
            } elseif ($request->has('ticket_id')) {
                // Resolve ticket_id to job_structure_id
                $recruitmentRequest = RecruitmentRequest::find($request->ticket_id);
                if (!$recruitmentRequest) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Recruitment request not found'
                    ], 404);
                }
                $jobStructureId = $recruitmentRequest->job_structure_id;
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Either job_structure_id or ticket_id is required'
                ], 422);
            }

            if (!$jobStructureId) {
                return response()->json([
                    'success' => false,
                    'message' => 'No job structure found for this request'
                ], 404);
            }

            $payGrades = PayGradeStructure::where(DatabaseFields::PAY_GRADE_STRUCTURES['JOB_STRUCTURE_ID'], $jobStructureId)
                ->where(DatabaseFields::PAY_GRADE_STRUCTURES['IS_ACTIVE'], true)
                ->orderBy(DatabaseFields::PAY_GRADE_STRUCTURES['GRADE_NAME'])
                ->get()
                ->map(function ($payGrade) {
                    // Get emoluments data - use actual configured fields dynamically
                    $emoluments = json_decode($payGrade->{DatabaseFields::PAY_GRADE_STRUCTURES['EMOLUMENTS']} ?? '{}', true) ?? [];

                    return [
                        'id' => $payGrade->{DatabaseFields::PAY_GRADE_STRUCTURES['ID']},
                        'grade_name' => $payGrade->{DatabaseFields::PAY_GRADE_STRUCTURES['GRADE_NAME']},
                        'grade_code' => $payGrade->{DatabaseFields::PAY_GRADE_STRUCTURES['GRADE_CODE']},
                        'total_compensation' => $payGrade->{DatabaseFields::PAY_GRADE_STRUCTURES['TOTAL_COMPENSATION']},
                        'currency' => $payGrade->{DatabaseFields::PAY_GRADE_STRUCTURES['CURRENCY']},
                        'emoluments' => $emoluments, // All actual configured fields
                        'pay_structure_type' => $payGrade->{DatabaseFields::PAY_GRADE_STRUCTURES['PAY_STRUCTURE_TYPE']}
                    ];
                });

            // Get job structure info
            $jobStructure = JobStructure::find($jobStructureId);

            return response()->json([
                'success' => true,
                'data' => $payGrades,
                'job_structure_info' => [
                    'job_title' => $jobStructure->{DatabaseFields::JOB_STRUCTURES['JOB_TITLE']} ?? 'N/A',
                    'job_code' => $jobStructure->{DatabaseFields::JOB_STRUCTURES['JOB_CODE']} ?? 'N/A'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pay grades for manual boarding: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching pay grades',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Create staff member manually
     */
    public function createStaff(Request $request): JsonResponse
    {
        try {
            Log::info('Manual boarding create staff attempt', [
                'request_data' => $request->all()
            ]);

            $validated = $request->validate([
                'client_id' => 'required|exists:clients,id',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'pay_grade_structure_id' => 'nullable|exists:pay_grade_structures,id',
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'nullable|email|unique:staff,email',
                'entry_date' => 'required|date',
                'gender' => 'nullable|in:male,female',
                'job_title' => 'nullable|string|max:255',
                'department' => 'nullable|string|max:255'
            ]);

            Log::info('Manual boarding validation passed', ['validated_data' => $validated]);

            DB::beginTransaction();

            // Validate ticket capacity
            $ticket = RecruitmentRequest::findOrFail($validated['recruitment_request_id']);
            $availablePositions = $ticket->number_of_vacancies - ($ticket->staff_accepted_offer ?? 0);

            if ($availablePositions <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No available positions for this recruitment request'
                ], 400);
            }

            // Validate pay grade belongs to job structure
            if (!empty($validated['pay_grade_structure_id'])) {
                $payGrade = PayGradeStructure::findOrFail($validated['pay_grade_structure_id']);
                if ($payGrade->job_structure_id !== $ticket->job_structure_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Selected pay grade does not match the job structure'
                    ], 400);
                }
            }

            // Get client and default staff type
            $client = Client::findOrFail($validated['client_id']);
            $defaultStaffType = ClientStaffType::where('client_id', $validated['client_id'])
                ->first();

            Log::info('Client staff type query result', [
                'client_id' => $validated['client_id'],
                'defaultStaffType' => $defaultStaffType ? $defaultStaffType->toArray() : 'null'
            ]);

            if (!$defaultStaffType) {
                // Use a fallback staff type
                $defaultStaffType = ClientStaffType::where('client_id', $validated['client_id'])->first();
                if (!$defaultStaffType) {
                    Log::error('No staff type found for client', ['client_id' => $validated['client_id']]);
                    return response()->json([
                        'success' => false,
                        'message' => 'No staff type found for this client'
                    ], 400);
                }
            }

            // Generate unique employee codes
            $employeeCode = $this->generateEmployeeCode($client);
            $staffId = $this->generateStaffId($employeeCode);

            // Determine sol_office_id from ticket or service location
            $solOfficeId = $ticket->sol_office_id;
            if (!$solOfficeId && $ticket->service_location_id) {
                $serviceLocation = \App\Models\ServiceLocation::find($ticket->service_location_id);
                $solOfficeId = $serviceLocation?->sol_office_id;
            }

            // Create staff record with complete job details
            $staff = Staff::create([
                'candidate_id' => null, // Manual entry has no candidate
                'client_id' => $validated['client_id'],
                'staff_type_id' => $defaultStaffType ? $defaultStaffType->id : 1, // Fallback to ID 1 if null
                'recruitment_request_id' => $ticket->id,
                'employee_code' => $employeeCode,
                'staff_id' => $staffId,
                'email' => $validated['email'],
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'],
                'last_name' => $validated['last_name'],
                'gender' => $validated['gender'],
                'entry_date' => $validated['entry_date'],
                'appointment_status' => 'probation',
                'employment_type' => 'full_time',
                'status' => 'active',
                // Job details from recruitment request
                'job_structure_id' => $ticket->job_structure_id,
                'job_title' => $validated['job_title'] ?? $ticket->jobStructure->job_title ?? 'Staff Member',
                'department' => $validated['department'] ?? null,
                'service_location_id' => $ticket->service_location_id,
                'sol_office_id' => $solOfficeId,
                'pay_grade_structure_id' => $validated['pay_grade_structure_id'],
                'salary_effective_date' => $validated['entry_date'],
                // Boarding metadata
                'onboarding_method' => 'manual_entry',
                'onboarded_by' => Auth::id() ?? 1
            ]);

            // Update recruitment request staff count
            $ticket->increment('staff_accepted_offer');

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'staff_id' => $staff->id,
                    'employee_code' => $staff->employee_code,
                    'staff_internal_id' => $staff->staff_id,
                    'full_name' => trim($staff->first_name . ' ' . ($staff->middle_name ? $staff->middle_name . ' ' : '') . $staff->last_name),
                    'remaining_positions' => $availablePositions - 1
                ],
                'message' => 'Staff member created successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error creating manual staff: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all(),
                'stack_trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error creating staff member',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Generate unique employee code for client using new format: SOL/CLIENT_PREFIX/XXX
     */
    private function generateEmployeeCode(Client $client): string
    {
        // Get outsourcing client (Client 1 - SOL)
        $outsourcingClient = Client::find(1);
        $outsourcingPrefix = $outsourcingClient ? $outsourcingClient->prefix : 'SOL';

        // Current client prefix
        $clientPrefix = $client->prefix ?? strtoupper(substr($client->{DatabaseFields::CLIENTS['ORGANISATION_NAME']}, 0, 3));

        // Get the last staff member for this specific client using new format
        $lastStaff = Staff::where('client_id', $client->id)
            ->where('employee_code', 'like', "{$outsourcingPrefix}/{$clientPrefix}/%")
            ->orderByRaw('CAST(SUBSTRING_INDEX(employee_code, "/", -1) AS UNSIGNED) DESC')
            ->first();

        if ($lastStaff && preg_match('/' . preg_quote($outsourcingPrefix) . '\/' . preg_quote($clientPrefix) . '\/(\d+)/', $lastStaff->employee_code, $matches)) {
            $sequence = intval($matches[1]) + 1;
        } else {
            $sequence = 1;
        }

        return "{$outsourcingPrefix}/{$clientPrefix}/" . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Generate staff ID from employee code (same as employee code for consistency)
     */
    private function generateStaffId(string $employeeCode): string
    {
        return $employeeCode; // Use same format as employee code
    }

    /**
     * Get or generate Staff ID - use provided value if available, otherwise use employee code
     */
    private function getOrGenerateStaffId($mappedData, string $employeeCode): string
    {
        // Check if Staff ID is provided in Excel (you might have a staff_id column)
        if (!empty($mappedData['staff_id'])) {
            return trim($mappedData['staff_id']);
        }

        // Otherwise, use same as employee code (current behavior)
        return $employeeCode;
    }

    /**
     * Get staff types for a client
     */
    public function getStaffTypes(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id'
        ]);

        try {
            $staffTypes = ClientStaffType::where('client_id', $request->client_id)
                ->where('is_active', true)
                ->orderBy('type_name')
                ->get(['id', 'type_name', 'type_code', 'description']);

            return response()->json([
                'success' => true,
                'data' => $staffTypes
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching staff types: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching staff types',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Generate Excel template for bulk staff upload
     */
    public function generateExcelTemplate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:clients,id',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $clientId = $request->client_id;
            $ticketId = $request->recruitment_request_id;

            // Get client and ticket information
            $client = Client::find($clientId);
            $ticket = RecruitmentRequest::find($ticketId);

            if (!$client || !$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client or recruitment ticket not found'
                ], 404);
            }

            // Get pay grades for this job structure
            $payGrades = PayGradeStructure::where(DatabaseFields::PAY_GRADE_STRUCTURES['JOB_STRUCTURE_ID'], $ticket->{DatabaseFields::RECRUITMENT_REQUESTS['JOB_STRUCTURE_ID']})
                ->where(DatabaseFields::PAY_GRADE_STRUCTURES['IS_ACTIVE'], true)
                ->get();

            // Generate template data
            $templateData = $this->generateTemplateData($client, $ticket, $payGrades);

            // Create client info for the export
            $clientInfo = [
                'name' => $client->client_name,
                'prefix' => $client->prefix,
                'ticket_code' => $ticket->ticket_id,
                'job_title' => $ticket->job_title ?? 'N/A'
            ];

            // Generate and download Excel file using Laravel Excel
            return Excel::download(
                new StaffTemplateExport($templateData, $clientInfo),
                'Staff_Upload_Template_' . $client->prefix . '_' . date('Y-m-d') . '.xlsx'
            );
        } catch (\Exception $e) {
            Log::error('Error generating Excel template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error generating Excel template',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Generate template data structure
     */
    private function generateTemplateData($client, $ticket, $payGrades)
    {
        // Define template headers with field mapping
        $templateHeaders = [
            'employee_code' => 'Employee Code *',
            'first_name' => 'First Name *',
            'middle_name' => 'Middle Name',
            'last_name' => 'Last Name *',
            'email' => 'Email Address *',
            'phone_number' => 'Phone Number *',
            'date_of_birth' => 'Date of Birth (YYYY-MM-DD) *',
            'gender' => 'Gender (Male/Female/Other) *',
            'national_id' => 'National ID',
            'passport_number' => 'Passport Number',
            'address' => 'Address',
            'hire_date' => 'Hire Date (YYYY-MM-DD) *',
            'contract_start_date' => 'Contract Start Date (YYYY-MM-DD)',
            'contract_end_date' => 'Contract End Date (YYYY-MM-DD)',
            'pay_grade_structure_id' => 'Pay Grade ID *',
            'emergency_contact_name' => 'Emergency Contact Name',
            'emergency_contact_phone' => 'Emergency Contact Phone',
            'emergency_contact_address' => 'Emergency Contact Address'
        ];

        // Create sample data
        $sampleData = [
            'employee_code' => 'EMP001',
            'first_name' => 'John',
            'middle_name' => 'Michael',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'phone_number' => '+1234567890',
            'date_of_birth' => '1990-01-15',
            'gender' => 'Male',
            'national_id' => 'ID123456789',
            'passport_number' => 'P123456789',
            'address' => '123 Main Street, City, Country',
            'hire_date' => now()->format('Y-m-d'),
            'contract_start_date' => now()->format('Y-m-d'),
            'contract_end_date' => now()->addYear()->format('Y-m-d'),
            'pay_grade_structure_id' => $payGrades->first()?->id ?? '',
            'emergency_contact_name' => 'Jane Doe',
            'emergency_contact_phone' => '+1234567891',
            'emergency_contact_address' => '456 Oak Street, City, Country'
        ];

        return [
            'template_headers' => $templateHeaders,
            'sample_data' => $sampleData,
            'pay_grades' => $payGrades->map(function ($pg) {
                return [
                    'id' => $pg->{DatabaseFields::PAY_GRADE_STRUCTURES['ID']},
                    'grade_name' => $pg->{DatabaseFields::PAY_GRADE_STRUCTURES['GRADE_NAME']},
                    'total_compensation' => $pg->{DatabaseFields::PAY_GRADE_STRUCTURES['TOTAL_COMPENSATION']}
                ];
            })->toArray(),
            'client_info' => [
                'id' => $client->id,
                'name' => $client->client_name,
                'prefix' => $client->prefix
            ],
            'ticket_info' => [
                'id' => $ticket->id,
                'ticket_code' => $ticket->ticket_id,
                'job_title' => $ticket->job_title ?? 'N/A',
                'available_slots' => ($ticket->number_of_vacancies ?? 0) - ($ticket->staff_accepted_offer ?? 0)
            ]
        ];
    }

    /**
     * Preview bulk staff upload from Excel file
     */
    public function previewBulkUpload(Request $request): JsonResponse
    {
        try {
            Log::info('Starting preview bulk upload', [
                'request_data' => $request->except(['excel_file']),
                'file_info' => $request->hasFile('excel_file') ? [
                    'name' => $request->file('excel_file')->getClientOriginalName(),
                    'size' => $request->file('excel_file')->getSize(),
                    'mime' => $request->file('excel_file')->getMimeType()
                ] : 'No file'
            ]);

            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:clients,id',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'excel_file' => 'required|file|mimes:xlsx,xls|max:10240'
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for preview bulk upload', [
                    'errors' => $validator->errors()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('excel_file');
            $clientId = $request->client_id;
            $ticketId = $request->recruitment_request_id;

            Log::info('Processing Excel file for preview', [
                'client_id' => $clientId,
                'ticket_id' => $ticketId,
                'filename' => $file->getClientOriginalName()
            ]);

            // Read Excel data directly using toArray without custom import class
            $rawData = Excel::toArray(new class implements \Maatwebsite\Excel\Concerns\ToArray {
                public function array(array $array): array
                {
                    return $array;
                }
            }, $file);

            Log::info('Raw Excel data extracted', [
                'sheets_count' => count($rawData),
                'first_sheet_rows' => count($rawData[0] ?? [])
            ]);

            // Get the first sheet data
            $sheetData = $rawData[0] ?? [];

            if (empty($sheetData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Excel file appears to be empty or corrupted'
                ], 400);
            }

            Log::info('Full sheet data for analysis', [
                'total_rows' => count($sheetData),
                'first_5_rows' => array_slice($sheetData, 0, 5)
            ]);

            // Find the actual headers row (skip title, client info, and instruction rows)
            $headersRowIndex = 0;
            $headers = [];

            for ($i = 0; $i < count($sheetData) && $i < 8; $i++) {
                $row = $sheetData[$i] ?? [];
                $firstCell = trim($row[0] ?? '');

                // Skip known template structure rows
                if (
                    stripos($firstCell, 'staff upload template') !== false ||
                    stripos($firstCell, 'client:') !== false ||
                    stripos($firstCell, 'instructions:') !== false ||
                    empty($firstCell)
                ) {
                    continue;
                }

                // Look for the headers row - should contain "Employee Code" and other field names
                if (
                    stripos($firstCell, 'employee code') !== false ||
                    (stripos($firstCell, 'employee') !== false && stripos($firstCell, 'code') !== false)
                ) {
                    $headers = array_map('trim', $row);
                    $headersRowIndex = $i;
                    Log::info('Found headers row', ['row_index' => $i, 'first_cell' => $firstCell]);
                    break;
                }

                // Fallback: if we see typical header patterns
                $rowString = strtolower(implode(' ', array_filter($row)));
                if ((strpos($rowString, 'first name') !== false && strpos($rowString, 'last name') !== false) ||
                    (strpos($rowString, 'employee') !== false && strpos($rowString, 'email') !== false)
                ) {
                    $headers = array_map('trim', $row);
                    $headersRowIndex = $i;
                    Log::info('Found headers row via fallback', ['row_index' => $i, 'pattern_match' => $rowString]);
                    break;
                }
            }

            if (empty($headers) || empty(array_filter($headers))) {
                // Fallback: use expected headers
                $headers = [
                    'employee_code',
                    'first_name',
                    'middle_name',
                    'last_name',
                    'email',
                    'phone_number',
                    'date_of_birth',
                    'gender',
                    'national_id',
                    'passport_number',
                    'address',
                    'hire_date',
                    'contract_start_date',
                    'contract_end_date',
                    'pay_grade_structure_id',
                    'emergency_contact_name',
                    'emergency_contact_phone',
                    'emergency_contact_address'
                ];
                $headersRowIndex = 0;
                Log::info('Using fallback headers', ['headers' => $headers]);
            }

            $dataRows = array_slice($sheetData, $headersRowIndex + 1);

            Log::info('Headers row found', [
                'headers_row_index' => $headersRowIndex,
                'headers' => $headers,
                'data_rows_count' => count($dataRows)
            ]);

            // Map column headers to expected field names (case insensitive and flexible)
            $headerMapping = [];
            $expectedFields = [
                'employee_code' => ['employee code *', 'employee_code', 'employee code', 'emp code', 'code'],
                'first_name' => ['first name *', 'first_name', 'first name', 'firstname', 'fname'],
                'middle_name' => ['middle name', 'middle_name', 'middlename', 'mname'],
                'last_name' => ['last name *', 'last_name', 'last name', 'lastname', 'lname', 'surname'],
                'email' => ['email address *', 'email', 'email address', 'e-mail'],
                'phone_number' => ['phone number *', 'phone_number', 'phone number', 'phone', 'mobile', 'telephone'],
                'date_of_birth' => ['date of birth (yyyy-mm-dd) *', 'date_of_birth', 'date of birth', 'dob', 'birth date'],
                'gender' => ['gender (male/female/other) *', 'gender', 'sex'],
                'national_id' => ['national id', 'national_id', 'id number', 'nin'],
                'passport_number' => ['passport number', 'passport_number', 'passport'],
                'address' => ['address', 'home address', 'residential address'],
                'hire_date' => ['hire date (yyyy-mm-dd) *', 'hire_date', 'hire date', 'start date', 'employment date'],
                'contract_start_date' => ['contract start date (yyyy-mm-dd)', 'contract_start_date', 'contract start', 'start date'],
                'contract_end_date' => ['contract end date (yyyy-mm-dd)', 'contract_end_date', 'contract end', 'end date'],
                'pay_grade_structure_id' => ['pay grade id *', 'pay_grade_structure_id', 'pay grade id', 'grade id', 'pay grade'],
                'emergency_contact_name' => ['emergency contact name', 'emergency_contact_name', 'emergency name'],
                'emergency_contact_phone' => ['emergency contact phone', 'emergency_contact_phone', 'emergency phone'],
                'emergency_contact_address' => ['emergency contact address', 'emergency_contact_address', 'emergency address']
            ];

            foreach ($headers as $index => $header) {
                $cleanHeader = strtolower(trim($header));
                foreach ($expectedFields as $field => $variants) {
                    foreach ($variants as $variant) {
                        if ($cleanHeader === $variant || strpos($cleanHeader, $variant) !== false) {
                            $headerMapping[$field] = $index;
                            break 2;
                        }
                    }
                }
            }

            Log::info('Header mapping created', ['header_mapping' => $headerMapping]);

            // Check for required fields
            $requiredFields = ['first_name', 'last_name', 'email'];
            $missingFields = [];

            foreach ($requiredFields as $field) {
                if (!isset($headerMapping[$field])) {
                    $missingFields[] = $field;
                }
            }

            if (!empty($missingFields)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot find required columns in Excel file. Missing: ' . implode(', ', $missingFields),
                    'detected_headers' => $headers,
                    'expected_headers' => array_keys($expectedFields)
                ], 400);
            }

            // Process rows for preview
            $validRecords = 0;
            $invalidRecords = 0;
            $previewData = [];
            $errors = [];

            foreach (array_slice($dataRows, 0, 10) as $index => $row) {
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Skip sample data rows (like john.doe@example.com)
                $firstEmail = '';
                if (isset($headerMapping['email']) && isset($row[$headerMapping['email']])) {
                    $firstEmail = strtolower(trim($row[$headerMapping['email']]));
                }

                if (
                    strpos($firstEmail, 'example.com') !== false ||
                    strpos($firstEmail, 'sample') !== false ||
                    $firstEmail === 'john.doe@example.com'
                ) {
                    Log::info('Skipping sample data row', ['row' => $row]);
                    continue;
                }

                // Map row data to expected fields
                $mappedData = [];
                foreach ($headerMapping as $field => $colIndex) {
                    $mappedData[$field] = isset($row[$colIndex]) ? trim($row[$colIndex]) : '';
                }

                // Add original row data for reference
                $mappedData['_original_row'] = array_combine($headers, $row);
                $mappedData['_row_number'] = $headersRowIndex + $index + 2; // +1 for headers, +1 for 1-based indexing

                Log::info('Processing row for preview', [
                    'row_number' => $mappedData['_row_number'],
                    'mapped_data' => $mappedData
                ]);

                // Basic validation for preview
                $rowErrors = [];
                if (empty($mappedData['first_name'])) {
                    $rowErrors[] = 'Missing first name';
                }
                if (empty($mappedData['last_name'])) {
                    $rowErrors[] = 'Missing last name';
                }
                if (empty($mappedData['email'])) {
                    $rowErrors[] = 'Missing email';
                } elseif (!filter_var($mappedData['email'], FILTER_VALIDATE_EMAIL)) {
                    $rowErrors[] = 'Invalid email format: ' . $mappedData['email'];
                }

                if (!empty($rowErrors)) {
                    $invalidRecords++;
                    $errors[] = "Row " . $mappedData['_row_number'] . ": " . implode(', ', $rowErrors);
                    $mappedData['_validation_errors'] = $rowErrors;
                    Log::info('Row validation failed', [
                        'row_number' => $mappedData['_row_number'],
                        'errors' => $rowErrors
                    ]);
                } else {
                    $validRecords++;
                    Log::info('Row validation passed', [
                        'row_number' => $mappedData['_row_number'],
                        'name' => $mappedData['first_name'] . ' ' . $mappedData['last_name']
                    ]);
                }

                $previewData[] = $mappedData;
            }

            $totalRecords = count($dataRows);

            Log::info('Preview processing completed', [
                'total_records' => $totalRecords,
                'valid_records' => $validRecords,
                'invalid_records' => $invalidRecords
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Excel file processed successfully',
                'data' => [
                    'total_rows' => $totalRecords,
                    'valid_rows' => $validRecords,
                    'invalid_rows' => $invalidRecords,
                    'warnings_count' => 0,
                    'preview_data' => $previewData,
                    'errors' => $errors,
                    'warnings' => [],
                    'headers' => $headers
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in preview bulk upload', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error processing Excel file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process bulk staff upload from Excel file
     */
    public function processBulkUpload(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:clients,id',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'excel_file' => 'required|file|mimes:xlsx,xls|max:10240'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('excel_file');
            $clientId = $request->client_id;
            $ticketId = $request->recruitment_request_id;

            // Parse and validate Excel data (similar to preview)
            $rawData = Excel::toArray(new class implements \Maatwebsite\Excel\Concerns\ToArray {
                public function array(array $array): array
                {
                    return $array;
                }
            }, $file);

            $sheetData = $rawData[0] ?? [];
            if (empty($sheetData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Excel file appears to be empty or corrupted'
                ], 400);
            }

            // Find headers row (same logic as preview)
            $headersRowIndex = 0;
            $headers = [];

            for ($i = 0; $i < count($sheetData) && $i < 8; $i++) {
                $row = $sheetData[$i] ?? [];
                $firstCell = trim($row[0] ?? '');

                if (
                    stripos($firstCell, 'staff upload template') !== false ||
                    stripos($firstCell, 'client:') !== false ||
                    stripos($firstCell, 'instructions:') !== false ||
                    empty($firstCell)
                ) {
                    continue;
                }

                if (
                    stripos($firstCell, 'employee code') !== false ||
                    (stripos($firstCell, 'employee') !== false && stripos($firstCell, 'code') !== false)
                ) {
                    $headers = array_map('trim', $row);
                    $headersRowIndex = $i;
                    break;
                }
            }

            $dataRows = array_slice($sheetData, $headersRowIndex + 1);

            // Map headers to fields (same as preview)
            $headerMapping = [];
            $expectedFields = [
                'employee_code' => ['employee code *', 'employee_code', 'employee code', 'emp code', 'code'],
                'first_name' => ['first name *', 'first_name', 'first name', 'firstname', 'fname'],
                'middle_name' => ['middle name', 'middle_name', 'middlename', 'mname'],
                'last_name' => ['last name *', 'last_name', 'last name', 'lastname', 'lname', 'surname'],
                'email' => ['email address *', 'email', 'email address', 'e-mail'],
                'phone_number' => ['phone number *', 'phone_number', 'phone number', 'phone', 'mobile', 'telephone'],
                'date_of_birth' => ['date of birth (yyyy-mm-dd) *', 'date_of_birth', 'date of birth', 'dob', 'birth date'],
                'gender' => ['gender (male/female/other) *', 'gender', 'sex'],
                'national_id' => ['national id', 'national_id', 'id number', 'nin'],
                'passport_number' => ['passport number', 'passport_number', 'passport'],
                'address' => ['address', 'home address', 'residential address'],
                'hire_date' => ['hire date (yyyy-mm-dd) *', 'hire_date', 'hire date', 'start date', 'employment date'],
                'contract_start_date' => ['contract start date (yyyy-mm-dd)', 'contract_start_date', 'contract start', 'start date'],
                'contract_end_date' => ['contract end date (yyyy-mm-dd)', 'contract_end_date', 'contract end', 'end date'],
                'pay_grade_structure_id' => ['pay grade id *', 'pay_grade_structure_id', 'pay grade id', 'grade id', 'pay grade'],
                'emergency_contact_name' => ['emergency contact name', 'emergency_contact_name', 'emergency name'],
                'emergency_contact_phone' => ['emergency contact phone', 'emergency_contact_phone', 'emergency phone'],
                'emergency_contact_address' => ['emergency contact address', 'emergency_contact_address', 'emergency address']
            ];

            foreach ($headers as $index => $header) {
                $cleanHeader = strtolower(trim($header));
                foreach ($expectedFields as $field => $variants) {
                    foreach ($variants as $variant) {
                        if ($cleanHeader === $variant || strpos($cleanHeader, $variant) !== false) {
                            $headerMapping[$field] = $index;
                            break 2;
                        }
                    }
                }
            }

            // Get client and ticket information for staff creation
            $client = Client::findOrFail($clientId);
            $ticket = RecruitmentRequest::findOrFail($ticketId);
            $defaultStaffType = ClientStaffType::where('client_id', $clientId)->first();

            // Process each row and create staff records
            $processedStaffIds = [];
            $successfulRecords = 0;
            $failedRecords = 0;
            $errors = [];
            $warnings = [];
            $warningsCount = 0;

            DB::beginTransaction();

            foreach ($dataRows as $index => $row) {
                if (empty(array_filter($row))) {
                    continue;
                }

                // Map row data to fields
                $mappedData = [];
                foreach ($headerMapping as $field => $colIndex) {
                    $mappedData[$field] = isset($row[$colIndex]) ? trim($row[$colIndex]) : '';
                }

                // Skip sample data
                if (strpos(strtolower($mappedData['email'] ?? ''), 'example.com') !== false) {
                    continue;
                }

                // Validate required fields
                if (empty($mappedData['first_name']) || empty($mappedData['last_name']) || empty($mappedData['email'])) {
                    $failedRecords++;
                    $errors[] = "Row " . ($headersRowIndex + $index + 2) . ": Missing required fields";
                    continue;
                }

                try {
                    // Check if Employee Code is provided in Excel, otherwise generate
                    if (!empty($mappedData['employee_code'])) {
                        // Use provided employee code from Excel
                        $employeeCode = trim($mappedData['employee_code']);

                        // Validate uniqueness
                        $existingStaff = Staff::where('employee_code', $employeeCode)->first();
                        if ($existingStaff) {
                            throw new \Exception("Employee code '{$employeeCode}' already exists");
                        }

                        Log::info('Using provided employee code from Excel', [
                            'provided_code' => $employeeCode,
                            'name' => $mappedData['first_name'] . ' ' . $mappedData['last_name']
                        ]);
                    } else {
                        // Generate unique employee code using new format
                        $employeeCode = $this->generateEmployeeCode($client);

                        Log::info('Generated new employee code', [
                            'generated_code' => $employeeCode,
                            'name' => $mappedData['first_name'] . ' ' . $mappedData['last_name']
                        ]);
                    }

                    $staffId = $this->getOrGenerateStaffId($mappedData, $employeeCode);

                    Log::info('Attempting to create staff', [
                        'employee_code' => $employeeCode,
                        'staff_id' => $staffId,
                        'name' => $mappedData['first_name'] . ' ' . $mappedData['last_name'],
                        'email' => $mappedData['email']
                    ]);

                    // Normalize gender value
                    $gender = null;
                    if (!empty($mappedData['gender'])) {
                        $genderValue = strtolower(trim($mappedData['gender']));
                        if (in_array($genderValue, ['male', 'm'])) {
                            $gender = 'male';
                        } elseif (in_array($genderValue, ['female', 'f'])) {
                            $gender = 'female';
                        }
                    }

                    // Create staff record
                    $staff = Staff::create([
                        'candidate_id' => null,
                        'client_id' => $clientId,
                        'staff_type_id' => $defaultStaffType ? $defaultStaffType->id : 1,
                        'employee_code' => $employeeCode,
                        'staff_id' => $staffId,
                        'email' => $mappedData['email'],
                        'first_name' => $mappedData['first_name'],
                        'middle_name' => $mappedData['middle_name'] ?? null,
                        'last_name' => $mappedData['last_name'],
                        'gender' => $gender,
                        'entry_date' => $mappedData['hire_date'] ?: now()->format('Y-m-d'),
                        'appointment_status' => 'probation',
                        'employment_type' => 'full_time',
                        'status' => 'active',
                        'pay_grade_structure_id' => !empty($mappedData['pay_grade_structure_id']) ? (int)$mappedData['pay_grade_structure_id'] : null,
                        'salary_effective_date' => $mappedData['hire_date'] ?: now()->format('Y-m-d'),
                        'job_title' => $ticket->jobStructure->job_title ?? 'Staff Member',
                        'department' => null,
                        'service_location_id' => $ticket->service_location_id,
                        'onboarding_method' => 'bulk_upload', // Use valid enum value
                        'onboarded_by' => Auth::id() ?? 1
                    ]);

                    $processedStaffIds[] = $staff->id;
                    $successfulRecords++;

                    Log::info('Staff created via Excel upload', [
                        'staff_id' => $staff->id,
                        'employee_code' => $staff->employee_code,
                        'name' => $staff->first_name . ' ' . $staff->last_name
                    ]);
                } catch (\Exception $e) {
                    $failedRecords++;
                    $errors[] = "Row " . ($headersRowIndex + $index + 2) . ": " . $e->getMessage();
                    Log::error('Failed to create staff from Excel row', [
                        'row_data' => $mappedData,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Update recruitment request staff count
            if ($successfulRecords > 0) {
                $ticket->increment('staff_accepted_offer', $successfulRecords);
            }

            DB::commit();

            $totalProcessed = $successfulRecords + $failedRecords;

            return response()->json([
                'success' => true,
                'message' => 'Bulk upload processed successfully',
                'data' => [
                    'total_processed' => $totalProcessed,
                    'successful_records' => $successfulRecords,
                    'failed_records' => $failedRecords,
                    'warnings_count' => $warningsCount,
                    'errors' => $errors,
                    'warnings' => $warnings,
                    'processed_staff_ids' => $processedStaffIds
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error processing bulk upload: ' . $e->getMessage()
            ], 500);
        }
    }
}
