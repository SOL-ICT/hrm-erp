<?php

namespace App\Services;

use App\Models\Staff;
use App\Models\User;
use App\Models\Recruitment\RecruitmentRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StaffBoardingService
{
    private RecruitmentHierarchyService $hierarchyService;

    public function __construct()
    {
        $this->hierarchyService = new RecruitmentHierarchyService();
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

            $staff = Staff::create(array_merge($staffData, [
                'recruitment_request_id' => $ticket->id,
                'onboarded_by' => $boardingUser->id,
                'boarding_approval_status' => $approvalStatus,
                'offer_acceptance_status' => $offerStatus,
                'offer_already_accepted' => $offerAlreadyAccepted,
                'status' => 'inactive', // Always inactive until Control approves
            ]));

            // If auto-approved, mark as pending Control approval
            if ($approvalStatus === 'auto_approved') {
                $staff->update([
                    'boarding_approval_status' => 'pending_control_approval',
                    'approved_by' => $boardingUser->id,
                    'approved_at' => now(),
                    'approval_notes' => 'Initial approval - awaiting Control compliance review',
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

        $staff->update([
            'boarding_approval_status' => 'rejected',
            'rejection_reason' => $reason,
            'status' => 'inactive',
        ]);

        return $staff->fresh();
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
     * - Password: mysolc3ntfi3ld@ (default for all staff)
     * - Role: Based on staff position or default to general staff
     * - Links staff_profile_id to staff record
     * 
     * @param Staff $staff
     * @return User|null
     */
    private function createUserAccountForStaff(Staff $staff): ?User
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

            // Determine role_id based on staff position or default
            // You can customize this logic based on your role structure
            $roleId = $this->determineStaffRole($staff);

            // Create user account
            $user = User::create([
                'name' => trim($staff->first_name . ' ' . $staff->last_name),
                'email' => $email,
                'username' => $username,
                'password' => bcrypt('mysolc3ntfi3ld@'), // Default password
                'role_id' => $roleId,
                'user_type' => 'staff',
                'staff_profile_id' => $staff->id,
                'is_active' => $staff->status === 'active',
            ]);

            Log::info('User account created for staff', [
                'staff_id' => $staff->id,
                'user_id' => $user->id,
                'username' => $username,
                'email' => $email,
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
     * 
     * @param Staff $staff
     * @return int
     */
    private function determineStaffRole(Staff $staff): int
    {
        // Default role for general staff
        // You can customize this based on staff.appointment_status, department, etc.

        // Example logic (customize as needed):
        // - If staff has 'Manager' in job title → Manager role (role_id = 5)
        // - If staff has 'HR' in department → HR role (role_id = 3)
        // - Default → General Staff role (role_id = 9)

        $defaultStaffRoleId = 9; // Adjust based on your roles table

        // You can add more sophisticated logic here
        // For now, return default staff role
        return $defaultStaffRoleId;
    }
}
