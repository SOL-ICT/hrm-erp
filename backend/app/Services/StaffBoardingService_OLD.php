<?php

namespace App\Legacy\Services;

use App\Models\Staff;
use App\Models\Client;
use App\Models\RecruitmentRequest;
use App\Models\PayGradeStructure;
use App\Models\ClientStaffType;
use App\Models\BoardingTimeline;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class StaffBoardingService
{
    /**
     * Validate if staff can be created for a recruitment request
     */
    public function validateStaffCreation(array $data): array
    {
        $errors = [];

        // Check recruitment request capacity
        $ticket = RecruitmentRequest::find($data['recruitment_request_id']);
        if (!$ticket) {
            $errors[] = 'Recruitment request not found';
            return $errors;
        }

        $availablePositions = $ticket->number_of_vacancies - ($ticket->staff_accepted_offer ?? 0);
        if ($availablePositions <= 0) {
            $errors[] = 'No available positions for this recruitment request';
        }

        // Validate pay grade belongs to job structure
        if (!empty($data['pay_grade_structure_id'])) {
            $payGrade = PayGradeStructure::find($data['pay_grade_structure_id']);
            if (!$payGrade) {
                $errors[] = 'Pay grade structure not found';
            } elseif ($payGrade->job_structure_id !== $ticket->job_structure_id) {
                $errors[] = 'Selected pay grade does not match the job structure';
            }
        }

        // Check if email is unique (if provided)
        if (!empty($data['email'])) {
            $existingStaff = Staff::where('email', $data['email'])->first();
            if ($existingStaff) {
                $errors[] = 'Email address already exists for another staff member';
            }
        }

        return $errors;
    }

    /**
     * Create staff member with all necessary relationships and logging
     */
    public function createStaffMember(array $data): Staff
    {
        DB::beginTransaction();

        try {
            // Get required related models
            $client = Client::findOrFail($data['client_id']);
            $ticket = RecruitmentRequest::findOrFail($data['recruitment_request_id']);

            // Get default staff type for client
            $staffType = ClientStaffType::where('client_id', $data['client_id'])
                ->where('is_active', true)
                ->first();

            if (!$staffType) {
                throw new \Exception('No active staff type found for this client');
            }

            // Generate unique codes
            $employeeCode = $this->generateEmployeeCode($client);
            $staffId = $this->generateStaffId($employeeCode);

            // Create staff record
            $staff = Staff::create([
                'candidate_id' => null, // Manual entry has no candidate
                'client_id' => $data['client_id'],
                'staff_type_id' => $staffType->id,
                'employee_code' => $employeeCode,
                'staff_id' => $staffId,
                'email' => $data['email'] ?? null,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'gender' => $data['gender'] ?? null,
                'entry_date' => $data['entry_date'],
                'appointment_status' => $data['appointment_status'] ?? 'probation',
                'employment_type' => $data['employment_type'] ?? 'full_time',
                'status' => 'active',
                'pay_grade_structure_id' => $data['pay_grade_structure_id'] ?? null,
                'salary_effective_date' => $data['entry_date'],
                'job_title' => $data['job_title'] ?? $ticket->jobStructure->job_title ?? 'Staff Member',
                'department' => $data['department'] ?? null,
                'service_location_id' => $ticket->service_location_id,
                'onboarding_method' => $data['onboarding_method'] ?? 'manual_entry',
                'onboarded_by' => Auth::id() ?? 1,
                'custom_fields' => $data['custom_fields'] ?? null
            ]);

            // Update recruitment request counter
            $ticket->increment('staff_accepted_offer');

            // Log the manual boarding action
            $this->logBoardingAction($staff, $ticket, $data['onboarding_method'] ?? 'manual_entry');

            DB::commit();

            Log::info('Manual staff boarding successful', [
                'staff_id' => $staff->id,
                'employee_code' => $staff->employee_code,
                'client_id' => $data['client_id'],
                'ticket_id' => $data['recruitment_request_id']
            ]);

            return $staff;
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Manual staff boarding failed: ' . $e->getMessage(), [
                'data' => $data,
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Generate unique employee code for client
     */
    public function generateEmployeeCode(Client $client): string
    {
        $prefix = $client->prefix ?? substr(strtoupper($client->organisation_name), 0, 3);

        // Get the last staff member for this client
        $lastStaff = Staff::where('client_id', $client->id)
            ->where('employee_code', 'like', "SOL-{$prefix}-%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastStaff && preg_match('/SOL-' . preg_quote($prefix) . '-(\d+)/', $lastStaff->employee_code, $matches)) {
            $sequence = intval($matches[1]) + 1;
        } else {
            $sequence = 1;
        }

        return "SOL-{$prefix}-" . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Generate staff ID from employee code
     */
    public function generateStaffId(string $employeeCode): string
    {
        return str_replace('-', '', $employeeCode);
    }

    /**
     * Get available positions for a recruitment request
     */
    public function getAvailablePositions(int $recruitmentRequestId): int
    {
        $ticket = RecruitmentRequest::find($recruitmentRequestId);
        if (!$ticket) {
            return 0;
        }

        return max(0, $ticket->number_of_vacancies - ($ticket->staff_accepted_offer ?? 0));
    }

    /**
     * Validate bulk staff creation data
     */
    public function validateBulkStaffData(array $staffData, int $recruitmentRequestId): array
    {
        $errors = [];
        $availablePositions = $this->getAvailablePositions($recruitmentRequestId);

        // Check total capacity
        if (count($staffData) > $availablePositions) {
            $errors[] = [
                'field' => 'capacity',
                'message' => "Cannot create {count($staffData)} staff. Only {$availablePositions} positions available."
            ];
        }

        // Validate each staff record
        foreach ($staffData as $index => $staff) {
            $staffErrors = $this->validateStaffCreation(array_merge($staff, [
                'recruitment_request_id' => $recruitmentRequestId
            ]));

            foreach ($staffErrors as $error) {
                $errors[] = [
                    'row' => $index + 1,
                    'field' => 'validation',
                    'message' => $error
                ];
            }
        }

        // Check for duplicate emails in the batch
        $emails = array_filter(array_column($staffData, 'email'));
        $duplicates = array_diff_assoc($emails, array_unique($emails));

        foreach ($duplicates as $index => $email) {
            $errors[] = [
                'row' => $index + 1,
                'field' => 'email',
                'message' => "Duplicate email address: {$email}"
            ];
        }

        return $errors;
    }

    /**
     * Create multiple staff members from bulk data
     */
    public function createBulkStaff(array $staffData, int $recruitmentRequestId): array
    {
        $results = [
            'created' => [],
            'failed' => [],
            'total_created' => 0,
            'total_failed' => 0
        ];

        foreach ($staffData as $index => $staffInfo) {
            try {
                $staff = $this->createStaffMember(array_merge($staffInfo, [
                    'recruitment_request_id' => $recruitmentRequestId,
                    'onboarding_method' => 'bulk_upload'
                ]));

                $results['created'][] = [
                    'row' => $index + 1,
                    'staff_id' => $staff->id,
                    'employee_code' => $staff->employee_code,
                    'name' => $staff->first_name . ' ' . $staff->last_name
                ];
                $results['total_created']++;
            } catch (\Exception $e) {
                $results['failed'][] = [
                    'row' => $index + 1,
                    'name' => ($staffInfo['first_name'] ?? '') . ' ' . ($staffInfo['last_name'] ?? ''),
                    'reason' => $e->getMessage()
                ];
                $results['total_failed']++;
            }
        }

        return $results;
    }

    /**
     * Log boarding action for audit trail
     */
    private function logBoardingAction(Staff $staff, RecruitmentRequest $ticket, string $method): void
    {
        try {
            // Create a timeline entry for manual boarding
            BoardingTimeline::create([
                'boarding_request_id' => null, // No boarding request for manual entry
                'action' => 'manual_staff_created',
                'description' => "Staff {$staff->employee_code} manually boarded for ticket {$ticket->ticket_id}",
                'details' => [
                    'staff_id' => $staff->id,
                    'employee_code' => $staff->employee_code,
                    'staff_name' => $staff->first_name . ' ' . $staff->last_name,
                    'ticket_id' => $ticket->id,
                    'ticket_code' => $ticket->ticket_id,
                    'client_id' => $staff->client_id,
                    'pay_grade_id' => $staff->pay_grade_structure_id,
                    'onboarding_method' => $method,
                    'entry_date' => $staff->entry_date
                ],
                'performed_by' => Auth::id() ?? 1,
                'performed_at' => now()
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the main process
            Log::warning('Failed to create boarding timeline entry: ' . $e->getMessage());
        }
    }
}
