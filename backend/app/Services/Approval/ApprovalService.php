<?php

namespace App\Services\Approval;

use App\Models\Approval;
use App\Models\ApprovalHistory;
use App\Models\ApprovalWorkflow;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ApprovalService
{
    protected $rulesService;
    protected $notificationService;

    public function __construct(
        ApprovalRulesService $rulesService,
        ApprovalNotificationService $notificationService
    ) {
        $this->rulesService = $rulesService;
        $this->notificationService = $notificationService;
    }

    /**
     * Create a new approval request
     *
     * @param string $approvableType Model class (e.g., 'App\Models\Staff')
     * @param int $approvableId ID of the approvable entity
     * @param string $approvalType Type of approval (e.g., 'staff_boarding', 'claim_submission')
     * @param int $requestedBy User ID of requester
     * @param array|null $metadata Additional data to store in request_data JSON field
     * @return Approval
     */
    public function createApproval(
        string $approvableType,
        int $approvableId,
        string $approvalType,
        int $requestedBy,
        ?array $metadata = null
    ): Approval {
        DB::beginTransaction();

        try {
            // Extract module name from approval type (e.g., 'staff_boarding' -> 'recruitment')
            $moduleName = $this->extractModuleName($approvalType);

            // Determine appropriate workflow
            $workflow = $this->determineWorkflow($approvalType, array_merge([
                'user_id' => $requestedBy,
                'module_name' => $moduleName,
            ], $metadata ?? []));

            // Create approval record
            $approval = new Approval();
            $approval->approvable_type = $approvableType;
            $approval->approvable_id = $approvableId;
            $approval->approval_type = $approvalType;
            $approval->module_name = $moduleName;
            $approval->requested_by = $requestedBy;
            $approval->requested_at = Carbon::now();
            $approval->status = 'pending';
            $approval->workflow_id = $workflow?->id;
            $approval->total_approval_levels = $workflow?->total_levels ?? 1;
            $approval->current_approval_level = 1;
            $approval->priority = $metadata['priority'] ?? 'medium';
            $approval->request_data = $metadata ? json_encode($metadata) : null;
            $approval->metadata = $metadata; // Store for easier access
            
            // Set due date based on SLA
            if ($workflow) {
                $firstLevel = $workflow->levels()->where('level_number', 1)->first();
                if ($firstLevel && $firstLevel->sla_hours) {
                    $approval->due_date = Carbon::now()->addHours($firstLevel->sla_hours);
                }
            }

            $approval->save();

            // Log creation in history
            $this->logHistory($approval, 'submitted', $requestedBy, [
                'from_status' => null,
                'to_status' => 'pending',
                'comments' => 'Approval request created',
            ]);

            DB::commit();

            Log::info("Approval created", [
                'approval_id' => $approval->id,
                'type' => $approvalType,
                'requested_by' => $requestedBy,
            ]);

            return $approval;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to create approval", [
                'error' => $e->getMessage(),
                'type' => $approvalType,
                'requested_by' => $requestedBy,
            ]);
            throw $e;
        }
    }

    /**
     * Submit approval for processing and assign to approver
     *
     * @param Approval $approval
     * @param string|null $notes
     * @return Approval
     */
    public function submitForApproval(Approval $approval, ?string $notes = null): Approval
    {
        DB::beginTransaction();

        try {
            // Determine next approver
            $approverId = $this->getNextApprover($approval);

            if (!$approverId) {
                throw new \Exception("Unable to determine approver for approval ID {$approval->id}");
            }

            // Assign to approver
            $this->assignApprover($approval, $approverId);

            // Log assignment
            $this->logHistory($approval, 'assigned', $approval->requested_by, [
                'from_status' => 'pending',
                'to_status' => 'pending',
                'comments' => $notes ?? "Assigned to approver (Level {$approval->current_approval_level})",
                'approval_level' => $approval->current_approval_level,
            ]);

            // Send notification
            $this->notificationService->notifyPendingApproval($approval, $approverId);

            DB::commit();

            return $approval->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to submit approval", [
                'approval_id' => $approval->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Assign approval to specific approver
     *
     * @param Approval $approval
     * @param int $approverId
     * @return void
     */
    public function assignApprover(Approval $approval, int $approverId): void
    {
        $approval->current_approver_id = $approverId;
        $approval->save();
    }

    /**
     * Approve a request
     *
     * @param Approval $approval
     * @param int $approverId
     * @param string|null $comments
     * @return Approval
     */
    public function approveRequest(Approval $approval, int $approverId, ?string $comments = null): Approval
    {
        DB::beginTransaction();

        try {
            // Verify approver has permission
            if (!$this->canApprove($approverId, $approval)) {
                throw new \Exception("User {$approverId} is not authorized to approve this request");
            }

            $previousStatus = $approval->status;
            $currentLevel = $approval->current_approval_level;

            // Log the approval action
            $this->logHistory($approval, 'approved', $approverId, [
                'from_status' => $previousStatus,
                'to_status' => $previousStatus, // Will be updated if workflow advances
                'comments' => $comments,
                'approval_level' => $currentLevel,
            ]);

            // Check if this completes the workflow
            if ($this->isWorkflowComplete($approval)) {
                // Final approval - mark as approved
                $approval->status = 'approved';
                $approval->completed_at = Carbon::now();
                $approval->completed_by = $approverId;
                $approval->save();

                // Log completion
                $this->logHistory($approval, 'level_completed', $approverId, [
                    'from_status' => $previousStatus,
                    'to_status' => 'approved',
                    'comments' => 'All approval levels completed',
                    'approval_level' => $currentLevel,
                ]);

                // Notify requester
                $this->notificationService->notifyApprovalCompleted($approval, 'approved');

            } else {
                // Advance to next level
                $this->advanceWorkflowLevel($approval);

                // Log level completion
                $this->logHistory($approval, 'level_completed', $approverId, [
                    'from_status' => $previousStatus,
                    'to_status' => 'pending',
                    'comments' => "Level {$currentLevel} approved, advancing to level {$approval->current_approval_level}",
                    'approval_level' => $currentLevel,
                ]);

                // Assign to next approver
                $nextApproverId = $this->getNextApprover($approval);
                if ($nextApproverId) {
                    $this->assignApprover($approval, $nextApproverId);
                    $this->notificationService->notifyPendingApproval($approval, $nextApproverId);
                }
            }

            DB::commit();

            Log::info("Approval request approved", [
                'approval_id' => $approval->id,
                'approver_id' => $approverId,
                'level' => $currentLevel,
                'final_status' => $approval->status,
            ]);

            return $approval->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to approve request", [
                'approval_id' => $approval->id,
                'approver_id' => $approverId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Reject a request
     *
     * @param Approval $approval
     * @param int $approverId
     * @param string $reason
     * @return Approval
     */
    public function rejectRequest(Approval $approval, int $approverId, string $reason): Approval
    {
        DB::beginTransaction();

        try {
            // Verify approver has permission
            if (!$this->canApprove($approverId, $approval)) {
                throw new \Exception("User {$approverId} is not authorized to reject this request");
            }

            $previousStatus = $approval->status;

            // Update approval status
            $approval->status = 'rejected';
            $approval->completed_at = Carbon::now();
            $approval->completed_by = $approverId;
            $approval->save();

            // For staff boarding approvals, update all staff in the batch
            if ($approval->approvable_type === 'App\\Models\\Staff') {
                $staff = $approval->approvable;
                if ($staff && $staff->upload_batch_id) {
                    // Get all staff in the same batch
                    $batchStaff = \App\Models\Staff::where('upload_batch_id', $staff->upload_batch_id)
                        ->where('boarding_approval_status', 'pending_control_approval')
                        ->get();
                    
                    foreach ($batchStaff as $batchStaffMember) {
                        // Update staff boarding status based on approval level
                        if ($approval->current_approval_level == 1) {
                            $batchStaffMember->boarding_approval_status = 'rejected';
                        } elseif ($approval->current_approval_level == 2) {
                            $batchStaffMember->boarding_approval_status = 'control_rejected';
                            $batchStaffMember->control_rejected_by = $approverId;
                            $batchStaffMember->control_rejected_at = Carbon::now();
                            $batchStaffMember->control_rejection_reason = $reason;
                        }
                        $batchStaffMember->save();
                    }
                    
                    Log::info("Batch staff records updated after approval rejection", [
                        'batch_id' => $staff->upload_batch_id,
                        'batch_size' => $batchStaff->count(),
                        'approval_level' => $approval->current_approval_level,
                    ]);
                } else {
                    // Single staff record (non-batch)
                    if ($staff) {
                        if ($approval->current_approval_level == 1) {
                            $staff->boarding_approval_status = 'rejected';
                        } elseif ($approval->current_approval_level == 2) {
                            $staff->boarding_approval_status = 'control_rejected';
                            $staff->control_rejected_by = $approverId;
                            $staff->control_rejected_at = Carbon::now();
                            $staff->control_rejection_reason = $reason;
                        }
                        $staff->save();
                        
                        Log::info("Single staff record updated after approval rejection", [
                            'staff_id' => $staff->id,
                            'staff_code' => $staff->staff_id,
                            'new_status' => $staff->boarding_approval_status,
                        ]);
                    }
                }
            }

            // Log rejection
            $this->logHistory($approval, 'rejected', $approverId, [
                'from_status' => $previousStatus,
                'to_status' => 'rejected',
                'comments' => null,
                'rejection_reason' => $reason,
                'approval_level' => $approval->current_approval_level,
            ]);

            // Notify requester
            $this->notificationService->notifyApprovalCompleted($approval, 'rejected');

            DB::commit();

            Log::info("Approval request rejected", [
                'approval_id' => $approval->id,
                'approver_id' => $approverId,
                'reason' => $reason,
            ]);

            return $approval->fresh();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to reject request", [
                'approval_id' => $approval->id,
                'approver_id' => $approverId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get approval history for a specific approval
     *
     * @param int $approvalId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getApprovalHistory(int $approvalId)
    {
        return ApprovalHistory::where('approval_id', $approvalId)
            ->with('actionBy:id,name,email')
            ->orderBy('action_at', 'asc')
            ->get();
    }

    /**
     * Determine appropriate workflow for approval type
     *
     * @param string $approvalType
     * @param array $context
     * @return ApprovalWorkflow|null
     */
    protected function determineWorkflow(string $approvalType, array $context): ?ApprovalWorkflow
    {
        return $this->rulesService->selectWorkflow($approvalType, $context);
    }

    /**
     * Get next approver for current workflow level
     *
     * @param Approval $approval
     * @return int|null
     */
    protected function getNextApprover(Approval $approval): ?int
    {
        if (!$approval->workflow_id) {
            return null;
        }

        $workflow = ApprovalWorkflow::with('levels')->find($approval->workflow_id);
        
        if (!$workflow) {
            return null;
        }

        $approvers = $this->rulesService->determineApprovers(
            $workflow,
            $approval->current_approval_level,
            [
                'approval_id' => $approval->id,
                'requested_by' => $approval->requested_by,
            ]
        );

        return $approvers[0] ?? null;
    }

    /**
     * Advance approval to next workflow level
     *
     * @param Approval $approval
     * @return void
     */
    protected function advanceWorkflowLevel(Approval $approval): void
    {
        $approval->current_approval_level++;
        
        // Update due date for new level
        if ($approval->workflow_id) {
            $workflow = ApprovalWorkflow::with('levels')->find($approval->workflow_id);
            $nextLevel = $workflow->levels()->where('level_number', $approval->current_approval_level)->first();
            
            if ($nextLevel && $nextLevel->sla_hours) {
                $approval->due_date = Carbon::now()->addHours($nextLevel->sla_hours);
            }
        }
        
        $approval->save();
    }

    /**
     * Check if workflow is complete
     *
     * @param Approval $approval
     * @return bool
     */
    protected function isWorkflowComplete(Approval $approval): bool
    {
        return $approval->current_approval_level >= $approval->total_approval_levels;
    }

    /**
     * Check if user can approve this request
     *
     * @param int $userId
     * @param Approval $approval
     * @return bool
     */
    protected function canApprove(int $userId, Approval $approval): bool
    {
        // For role-based approvals (current_approver_id is null), check role permissions
        if ($approval->current_approver_id === null) {
            $user = \App\Models\User::find($userId);
            if (!$user) {
                Log::warning("canApprove: User not found", ['user_id' => $userId]);
                return false;
            }

            $hierarchyService = app(\App\Services\RecruitmentHierarchyService::class);
            $permissions = $hierarchyService->getUserPermissions($user);
            
            if (!$permissions) {
                Log::warning("canApprove: No permissions found", ['user_id' => $userId]);
                return false;
            }

            // Approval must be pending
            if ($approval->status !== 'pending') {
                Log::warning("canApprove: Approval not pending", [
                    'approval_id' => $approval->id,
                    'status' => $approval->status
                ]);
                return false;
            }

            $level = $approval->current_approval_level;
            
            Log::info("canApprove: Checking permissions", [
                'user_id' => $userId,
                'approval_id' => $approval->id,
                'level' => $level,
                'hierarchy_level' => $permissions->hierarchy_level,
                'can_approve_boarding' => $permissions->can_approve_boarding
            ]);
            
            // Level 1: Supervisors and above can approve
            if ($level == 1) {
                $can = $permissions->hierarchy_level <= 2 && $permissions->can_approve_boarding;
                Log::info("canApprove: Level 1 check", ['can_approve' => $can]);
                return $can;
            }
            
            // Level 2: Control Department and Super Admin can approve
            if ($level == 2) {
                $can = $permissions->hierarchy_level <= 1 && $permissions->can_approve_boarding;
                Log::info("canApprove: Level 2 check", ['can_approve' => $can]);
                return $can;
            }
            
            // Control users can approve any level
            if ($permissions->hierarchy_level === 0) {
                Log::info("canApprove: Control user - can approve all levels");
                return true;
            }

            Log::warning("canApprove: No matching conditions", ['level' => $level]);
            return false;
        }

        // Original logic for user-assigned approvals
        if ($approval->current_approver_id === $userId) {
            return $approval->status === 'pending';
        }

        // For Control level approvals (level 2), check if user has Control role permissions
        if ($approval->current_approval_level == 2) {
            $user = \App\Models\User::find($userId);
            if ($user) {
                $hierarchyService = app(\App\Services\RecruitmentHierarchyService::class);
                $permissions = $hierarchyService->getUserPermissions($user);
                
                if ($permissions && $permissions->hierarchy_level === 0 && $permissions->can_approve_boarding) {
                    return $approval->status === 'pending';
                }
            }
        }

        // Check for delegation
        $delegateFor = $this->checkDelegation(
            $approval->current_approver_id,
            $approval->module_name,
            $approval->approval_type
        );
        
        if ($delegateFor === $userId) {
            return $approval->status === 'pending';
        }

        return false;
    }

    /**
     * Check if user has delegated authority
     *
     * @param int $approverId
     * @param string $moduleType
     * @param string $approvalType
     * @return int|null Delegate user ID if active delegation exists
     */
    protected function checkDelegation(int $approverId, string $moduleType, string $approvalType): ?int
    {
        // TODO: Implement delegation lookup
        // For now, return null (no delegation)
        return null;
    }

    /**
     * Log action in approval history
     *
     * @param Approval $approval
     * @param string $action
     * @param int $actionBy
     * @param array $data
     * @return void
     */
    public function logHistory(Approval $approval, string $action, int $actionBy, array $data): void
    {
        ApprovalHistory::create([
            'approval_id' => $approval->id,
            'action' => $action,
            'action_by' => $actionBy,
            'action_at' => Carbon::now(),
            'from_status' => $data['from_status'] ?? null,
            'to_status' => $data['to_status'] ?? null,
            'approval_level' => $data['approval_level'] ?? null,
            'comments' => $data['comments'] ?? null,
            'rejection_reason' => $data['rejection_reason'] ?? null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Extract module name from approval type
     *
     * @param string $approvalType
     * @return string
     */
    protected function extractModuleName(string $approvalType): string
    {
        // Map approval types to modules
        $typeModuleMap = [
            'staff_boarding' => 'recruitment',
            'recruitment_request' => 'recruitment',
            'ticket_assignment' => 'recruitment',
            'claim_submission' => 'claims',
            'contract_approval' => 'contracts',
        ];

        return $typeModuleMap[$approvalType] ?? 'general';
    }
}
