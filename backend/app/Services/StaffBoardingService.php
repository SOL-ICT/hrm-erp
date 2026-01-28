<?php

namespace App\Services;

use App\Models\Staff;
use App\Models\User;
use App\Models\Recruitment\RecruitmentRequest;
use App\Services\Approval\ApprovalService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StaffBoardingService
{
    private RecruitmentHierarchyService $hierarchyService;
    private ApprovalService $approvalService;

    public function __construct(ApprovalService $approvalService)
    {
        $this->hierarchyService = new RecruitmentHierarchyService();
        $this->approvalService = $approvalService;
    }

    /**
     * Board staff with automatic approval determination
     * 
     * UPDATED WORKFLOW (Nov 26, 2025):
     * - If user has can_board_without_approval → status: pending_control_approval
     * - If user needs approval → status: pending (needs supervisor approval first)
     * - All boarding requires FINAL Control approval for compliance/audit
     */
    public function boardStaff(array $staffData, User $boardingUser, RecruitmentRequest $ticket): Staff
    {
        DB::beginTransaction();
        try {
            $approvalStatus = $this->determineApprovalStatus($boardingUser, $ticket);
            $offerAlreadyAccepted = $staffData['offer_already_accepted'] ?? false;
            $offerStatus = $offerAlreadyAccepted ? 'accepted' : 'pending';

            // Get pay_structure_types_id from the recruitment request's job structure
            $payStructureTypesId = null;
            if ($ticket->job_structure_id) {
                $jobStructure = DB::table('job_structures')->find($ticket->job_structure_id);
                if ($jobStructure && $jobStructure->pay_structures) {
                    $payStructures = json_decode($jobStructure->pay_structures, true);
                    if (!empty($payStructures)) {
                        // Get the first pay structure type ID (primary contract type)
                        $payStructureType = DB::table('pay_structure_types')
                            ->where('type_code', $payStructures[0])
                            ->first();
                        if ($payStructureType) {
                            $payStructureTypesId = $payStructureType->id;
                        }
                    }
                }
            }

            $staff = Staff::create(array_merge($staffData, [
                'recruitment_request_id' => $ticket->id,
                'onboarded_by' => $boardingUser->id,
                'boarding_approval_status' => $approvalStatus,
                'offer_acceptance_status' => $offerStatus,
                'offer_already_accepted' => $offerAlreadyAccepted,
                'pay_structure_types_id' => $payStructureTypesId,
                'status' => 'inactive', // Always inactive until Control approves
            ]));

            // Create centralized approval record if approval is required
            if ($approvalStatus === 'pending') {
                $approval = $this->approvalService->createApproval(
                    'App\\Models\\Staff',
                    $staff->id,
                    'staff_boarding',
                    $boardingUser->id,
                    [
                        'staff_id' => $staff->staff_id,
                        'employee_code' => $staff->employee_code,
                        'first_name' => $staff->first_name,
                        'last_name' => $staff->last_name,
                        'client_id' => $staff->client_id,
                        'recruitment_request_id' => $ticket->id,
                        'priority' => 'medium',
                    ]
                );

                // Submit for approval (assigns to Level 1 approver - Supervisor)
                $this->approvalService->submitForApproval($approval, 'Staff boarding submitted for supervisor approval');

                Log::info('Staff boarding created with centralized approval', [
                    'staff_id' => $staff->id,
                    'approval_id' => $approval->id,
                    'boarding_user_id' => $boardingUser->id,
                ]);
            }

            // If auto-approved, mark as pending Control approval
            if ($approvalStatus === 'auto_approved') {
                $staff->update([
                    'boarding_approval_status' => 'pending_control_approval',
                    'approved_by' => $boardingUser->id,
                    'approved_at' => now(),
                    'approval_notes' => 'Initial approval - awaiting Control compliance review',
                ]);

                // Create approval record directly at Level 2 (Control)
                $approval = $this->approvalService->createApproval(
                    'App\\Models\\Staff',
                    $staff->id,
                    'staff_boarding',
                    $boardingUser->id,
                    [
                        'staff_id' => $staff->staff_id,
                        'employee_code' => $staff->employee_code,
                        'first_name' => $staff->first_name,
                        'last_name' => $staff->last_name,
                        'client_id' => $staff->client_id,
                        'recruitment_request_id' => $ticket->id,
                        'priority' => 'medium',
                        'auto_approved_level_1' => true,
                    ]
                );

                // Manually advance to Level 2 for Control approval
                $approval->current_approval_level = 2;
                $approval->save();

                // Submit for Level 2 (Control) approval
                $this->approvalService->submitForApproval($approval, 'Level 1 auto-approved, submitted to Control for final approval');

                Log::info('Staff boarding auto-approved Level 1, submitted to Control', [
                    'staff_id' => $staff->id,
                    'approval_id' => $approval->id,
                    'boarding_user_id' => $boardingUser->id,
                ]);
            }

            if (!$offerAlreadyAccepted && $approvalStatus === 'auto_approved') {
                $this->sendOffer($staff);
            }

            DB::commit();
            return $staff->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Approve boarding (supervisor level)
     * Moves from 'pending' to 'pending_control_approval'
     * Now uses centralized ApprovalService
     */
    public function approveBoarding(Staff $staff, User $approvingUser, ?string $notes = null): Staff
    {
        if (!$this->canApproveStaff($staff, $approvingUser)) {
            throw new \Exception('You do not have permission to approve this staff boarding');
        }

        if ($staff->boarding_approval_status !== 'pending') {
            throw new \Exception("Staff is not in pending approval state");
        }

        DB::beginTransaction();
        try {
            // Get the approval record
            $approval = $staff->approval;
            
            if ($approval) {
                // Use centralized approval service
                $this->approvalService->approveRequest($approval, $approvingUser->id, $notes);
                
                // Approval service automatically advances to Level 2 and assigns Control approver
                // Refresh approval to get updated data
                $approval->refresh();
            }

            // Update staff boarding_approval_status for backward compatibility
            $staff->update([
                'boarding_approval_status' => 'pending_control_approval',
                'approved_by' => $approvingUser->id,
                'approved_at' => now(),
                'approval_notes' => $notes,
                'status' => 'inactive', // Still inactive until Control approves
            ]);

            if ($staff->offer_acceptance_status === 'pending') {
                $this->sendOffer($staff);
            }

            DB::commit();
            return $staff->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Control Department final approval (compliance/audit gate)
     * This is the FINAL step - activates staff for payroll
     * ALSO creates user account automatically
     * Now uses centralized ApprovalService
     */
    public function controlApprove(Staff $staff, User $controlUser, ?string $notes = null): Staff
    {
        // Verify user is from Control department
        if (!$this->hierarchyService->canApproveBoarding($controlUser)) {
            throw new \Exception('Only Control department can provide final approval');
        }

        if ($staff->boarding_approval_status !== 'pending_control_approval') {
            throw new \Exception("Staff must be in 'pending_control_approval' state");
        }

        DB::beginTransaction();
        try {
            // Get the approval record
            $approval = $staff->approval;
            
            if ($approval) {
                // Use centralized approval service for Level 2 (Control) approval
                $this->approvalService->approveRequest($approval, $controlUser->id, $notes);
                
                // This completes the workflow (Level 2 is final)
                // Approval status will be 'approved'
            }

            // Update staff status for backward compatibility
            $staff->update([
                'boarding_approval_status' => 'control_approved',
                'control_approved_by' => $controlUser->id,
                'control_approved_at' => now(),
                'control_approval_notes' => $notes,
                'status' => $staff->offer_already_accepted ? 'active' : 'inactive',
            ]);

            // Create user account automatically when staff is approved
            $this->createUserAccountForStaff($staff);

            // Only increment counter when Control finally approves
            $ticket = $staff->recruitmentRequest;
            if ($ticket && $staff->offer_already_accepted) {
                $ticket->staff_accepted_offer = ($ticket->staff_accepted_offer ?? 0) + 1;
                $ticket->save();
            }

            DB::commit();
            return $staff->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Control Department rejection (compliance issues found)
     */
    public function controlReject(Staff $staff, User $controlUser, string $reason): Staff
    {
        if (!$this->hierarchyService->canApproveBoarding($controlUser)) {
            throw new \Exception('Only Control department can reject at this stage');
        }

        if ($staff->boarding_approval_status !== 'pending_control_approval') {
            throw new \Exception("Staff must be in 'pending_control_approval' state");
        }

        $staff->update([
            'boarding_approval_status' => 'control_rejected',
            'control_rejection_reason' => $reason,
            'control_rejected_by' => $controlUser->id,
            'control_rejected_at' => now(),
            'status' => 'inactive',
        ]);

        return $staff->fresh();
    }

    public function rejectBoarding(Staff $staff, User $rejectingUser, string $reason): Staff
    {
        if (!$this->canApproveStaff($staff, $rejectingUser)) {
            throw new \Exception('You do not have permission to reject this staff boarding');
        }

        if ($staff->boarding_approval_status !== 'pending') {
            throw new \Exception("Staff is not in pending approval state");
        }

        DB::beginTransaction();
        try {
            // Get the approval record
            $approval = $staff->approval;
            
            if ($approval) {
                // Use centralized approval service
                $this->approvalService->rejectRequest($approval, $rejectingUser->id, $reason);
            }

            // Update staff status for backward compatibility
            $staff->update([
                'boarding_approval_status' => 'rejected',
                'rejection_reason' => $reason,
                'status' => 'inactive',
            ]);

            DB::commit();
            return $staff->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    private function sendOffer(Staff $staff): void
    {
        $expiryDate = now()->addDays(30);

        $staff->update([
            'offer_acceptance_status' => 'sent',
            'offer_sent_at' => now(),
            'offer_expires_at' => $expiryDate,
        ]);

        DB::table('staff_offer_acceptance_log')->insert([
            'staff_id' => $staff->id,
            'action' => 'sent',
            'actioned_at' => now(),
            'actioned_by' => null,
            'notes' => 'Offer letter sent automatically after boarding approval',
            'metadata' => json_encode([
                'expires_at' => $expiryDate->toDateTimeString(),
                'sent_via' => 'automatic',
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function completeAutoApproval(Staff $staff, User $boardingUser, RecruitmentRequest $ticket): void
    {
        $staff->update([
            'approved_by' => $boardingUser->id,
            'approved_at' => now(),
            'approval_notes' => 'Auto-approved based on user permissions',
        ]);

        if ($staff->offer_already_accepted) {
            $ticket->increment('staff_accepted_offer');
        }
    }

    private function determineApprovalStatus(User $boardingUser, RecruitmentRequest $ticket): string
    {
        if ($this->hierarchyService->canBoardWithoutApproval($boardingUser)) {
            return 'auto_approved';
        }

        if ($ticket->created_by === $boardingUser->id) {
            return 'auto_approved';
        }

        if (!$ticket->requires_approval) {
            return 'auto_approved';
        }

        if ($ticket->assigned_to === $boardingUser->id) {
            return 'pending';
        }

        return 'pending';
    }

    private function canApproveStaff(Staff $staff, User $user): bool
    {
        $ticket = $staff->recruitmentRequest;

        if ($ticket && $ticket->created_by === $user->id) {
            return true;
        }

        if ($this->hierarchyService->canApproveBoarding($user)) {
            return true;
        }

        return false;
    }

    public function getPendingStaffForUser(User $user)
    {
        $createdTicketIds = RecruitmentRequest::where('created_by', $user->id)->pluck('id');
        $query = Staff::where('boarding_approval_status', 'pending');

        if ($this->hierarchyService->canApproveBoarding($user)) {
            // Can approve all pending staff
        } else {
            $query->whereIn('recruitment_request_id', $createdTicketIds);
        }

        return $query->with([
            'client',
            'recruitmentRequest',
            'onboardedBy:id,name,email',
            'payGradeStructure'
        ])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Automatically create user account for approved staff
     * 
     * Business Rules:
     * - Username: staff_id (unique)
     * - Email: staff email or generated from staff_id
     * - Password: 12345678 (default for all staff)
     * - Role: Based on staff position or default to general staff
     * - Links staff_profile_id to staff record
     * 
     * @param Staff $staff
     * @return User|null
     */
    public function createUserAccountForStaff(Staff $staff): ?User
    {
        try {
            // Check if user already exists for this staff
            $existingUser = User::where('staff_profile_id', $staff->id)->first();
            if ($existingUser) {
                Log::info('User account already exists for staff', [
                    'staff_id' => $staff->id,
                    'user_id' => $existingUser->id
                ]);
                return $existingUser;
            }

            // Generate username from staff_id (ensure uniqueness)
            $username = $staff->staff_id;
            $counter = 1;
            while (User::where('username', $username)->exists()) {
                $username = $staff->staff_id . '_' . $counter;
                $counter++;
            }

            // Use staff email or generate one
            $email = $staff->email;
            if (empty($email)) {
                $email = strtolower($staff->staff_id) . '@solnigeria.com';
            }

            // Ensure email uniqueness
            $originalEmail = $email;
            $emailCounter = 1;
            while (User::where('email', $email)->exists()) {
                $email = str_replace('@', "+{$emailCounter}@", $originalEmail);
                $emailCounter++;
            }

            // Determine role_id for staff_roles table (optional - only for staff with specific system roles)
            $roleId = $this->determineStaffRole($staff);

            // Create user account
            $user = User::create([
                'name' => trim($staff->first_name . ' ' . $staff->last_name),
                'email' => $email,
                'username' => $username,
                'password' => bcrypt('12345678'), // Default password
                'role' => 'Staff',
                'user_type' => 'staff',
                'staff_profile_id' => $staff->id,
                'is_active' => $staff->status === 'active',
                'preferences' => new \stdClass(),
            ]);

            // Only create staff_roles entry if staff has a specific system role (not general staff)
            if ($roleId !== null) {
                DB::table('staff_roles')->insert([
                    'staff_id' => $staff->id,
                    'role_id' => $roleId,
                    'assigned_at' => now(),
                    'assigned_by' => Auth::id() ?? $staff->onboarded_by,
                    'reason' => 'Auto-assigned upon staff approval',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            Log::info('User account created for staff', [
                'staff_id' => $staff->id,
                'user_id' => $user->id,
                'username' => $username,
                'email' => $email,
                'role_id' => $roleId,
            ]);

            return $user;
        } catch (\Exception $e) {
            Log::error('Failed to create user account for staff', [
                'staff_id' => $staff->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Don't throw exception - user creation failure shouldn't block boarding
            return null;
        }
    }

    /**
     * Determine appropriate role_id for staff based on their position
     * Returns null - roles should be manually assigned by admins
     * 
     * IMPORTANT: Only SOL (client_id = 1) staff can have system roles
     * External client staff should never have admin access
     * 
     * @param Staff $staff
     * @return int|null
     */
    private function determineStaffRole(Staff $staff): ?int
    {
        // Default: No automatic role assignment
        // Roles should be manually assigned by admins through the role management interface
        // This prevents incorrect role assignments and gives full control to administrators
        
        return null;
        
        /* 
         * Future: Enable auto-assignment logic if needed
         * 
         * // Only SOL staff can have system roles
         * if ($staff->client_id != 1) {
         *     return null;
         * }
         * 
         * $jobTitle = strtolower($staff->job_title ?? '');
         * $department = strtolower($staff->department ?? '');
         * 
         * if (str_contains($department, 'hr')) return 3; // HR
         * if (str_contains($department, 'recruitment')) return 7; // Recruitment
         * if (str_contains($department, 'control')) return 6; // Control
         * if (str_contains($department, 'account')) return 5; // Accounts
         * if (str_contains($jobTitle, 'manager')) return 8; // Regional Manager
         * 
         * return null;
         */
    }

    /**
     * Board staff WITHOUT creating individual approval (for bulk uploads)
     * Approval will be created at batch level
     */
    public function boardStaffWithoutApproval(array $staffData, User $boardingUser, RecruitmentRequest $ticket): Staff
    {
        try {
            $approvalStatus = $this->determineApprovalStatus($boardingUser, $ticket);
            $offerAlreadyAccepted = $staffData['offer_already_accepted'] ?? false;
            $offerStatus = $offerAlreadyAccepted ? 'accepted' : 'pending';

            // Override approval status for batch uploads - will be handled by batch approval
            $approvalStatus = 'pending_control_approval';

            // Get pay_structure_types_id from the recruitment request's job structure
            $payStructureTypesId = null;
            if ($ticket->job_structure_id) {
                $jobStructure = DB::table('job_structures')->find($ticket->job_structure_id);
                if ($jobStructure && $jobStructure->pay_structures) {
                    $payStructures = json_decode($jobStructure->pay_structures, true);
                    if (!empty($payStructures)) {
                        // Get the first pay structure type ID (primary contract type)
                        $payStructureType = DB::table('pay_structure_types')
                            ->where('type_code', $payStructures[0])
                            ->first();
                        if ($payStructureType) {
                            $payStructureTypesId = $payStructureType->id;
                        }
                    }
                }
            }

            $staff = Staff::create(array_merge($staffData, [
                'recruitment_request_id' => $ticket->id,
                'onboarded_by' => $boardingUser->id,
                'boarding_approval_status' => $approvalStatus,
                'offer_acceptance_status' => $offerStatus,
                'offer_already_accepted' => $offerAlreadyAccepted,
                'pay_structure_types_id' => $payStructureTypesId,
                'status' => 'inactive', // Always inactive until Control approves
            ]));

            return $staff->fresh();
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Create ONE approval for an entire batch of staff uploads
     */
    public function createBatchApproval(
        string $uploadBatchId, 
        array $staffIds, 
        User $boardingUser, 
        RecruitmentRequest $ticket,
        int $staffCount
    ) {
        try {
            // Create batch approval record
            $approval = $this->approvalService->createApproval(
                'App\\Models\\Staff', // Still use Staff model but track by batch
                $staffIds[0], // Link to first staff as primary reference
                'staff_boarding', // Use same workflow as individual staff boarding
                $boardingUser->id,
                [
                    'batch_id' => $uploadBatchId,
                    'staff_count' => $staffCount,
                    'staff_ids' => $staffIds,
                    'recruitment_request_id' => $ticket->id,
                    'client_id' => $ticket->client_id,
                    'priority' => 'medium',
                    'is_batch' => true,
                ]
            );

            // Determine starting level based on boarder's permissions
            $hierarchyService = app(\App\Services\RecruitmentHierarchyService::class);
            $boarderPermissions = $hierarchyService->getUserPermissions($boardingUser);
            
            // If boarder can approve, skip level 1 (goes directly to Control)
            // If boarder cannot approve, start at level 1 (needs supervisor then Control)
            if ($boarderPermissions && $boarderPermissions->can_approve_boarding) {
                $startLevel = 2; // HR/Regional Manager: Skip to Control
                $comments = "Batch upload of {$staffCount} staff by authorized approver - submitted directly to Control for final approval";
            } else {
                $startLevel = 1; // Recruitment: Needs supervisor approval first
                $comments = "Batch upload of {$staffCount} staff - requires supervisor approval before Control";
            }
            
            // Set approval level and ensure total_levels is 2
            $approval->current_approval_level = $startLevel;
            $approval->total_approval_levels = 2; // Always 2 levels: Supervisor (optional) + Control (final)
            $approval->current_approver_id = null; // No specific approver - role-based
            $approval->save();

            // Log creation
            $this->approvalService->logHistory($approval, 'submitted', $boardingUser->id, [
                'from_status' => 'pending',
                'to_status' => 'pending',
                'comments' => $comments,
                'approval_level' => $startLevel,
            ]);

            Log::info('Batch approval created for staff upload', [
                'batch_id' => $uploadBatchId,
                'approval_id' => $approval->id,
                'staff_count' => $staffCount,
            ]);

            return $approval;
        } catch (\Exception $e) {
            Log::error('Failed to create batch approval', [
                'batch_id' => $uploadBatchId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
