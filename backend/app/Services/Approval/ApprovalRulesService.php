<?php

namespace App\Services\Approval;

use App\Models\ApprovalWorkflow;
use App\Models\ApprovalWorkflowLevel;
use App\Models\ApprovalPolicy;
use App\Models\User;
use App\Services\RecruitmentHierarchyService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApprovalRulesService
{
    protected $hierarchyService;

    public function __construct(RecruitmentHierarchyService $hierarchyService)
    {
        $this->hierarchyService = $hierarchyService;
    }

    /**
     * Evaluate policies to find matching approval policy
     *
     * @param string $approvalType
     * @param array $context
     * @return ApprovalPolicy|null
     */
    public function evaluatePolicies(string $approvalType, array $context): ?ApprovalPolicy
    {
        // TODO: Implement when ApprovalPolicy model is created
        // For now, return null
        return null;
    }

    /**
     * Select appropriate workflow for approval type
     *
     * @param string $approvalType
     * @param array $context
     * @return ApprovalWorkflow|null
     */
    public function selectWorkflow(string $approvalType, array $context): ?ApprovalWorkflow
    {
        $moduleName = $context['module_name'] ?? null;

        // Find active workflow matching module and type
        $workflow = ApprovalWorkflow::active()
            ->where('module_name', $moduleName)
            ->where('approval_type', $approvalType)
            ->first();

        if (!$workflow) {
            Log::warning("No workflow found", [
                'module' => $moduleName,
                'type' => $approvalType,
            ]);
            return null;
        }

        // Validate workflow conditions
        if (!$this->validateWorkflowConditions($workflow, $context)) {
            return null;
        }

        return $workflow;
    }

    /**
     * Validate if workflow conditions are met
     *
     * @param ApprovalWorkflow $workflow
     * @param array $context
     * @return bool
     */
    public function validateWorkflowConditions(ApprovalWorkflow $workflow, array $context): bool
    {
        if (!$workflow->activation_conditions) {
            return true; // No conditions means always active
        }

        $conditions = $workflow->activation_conditions;

        // Check user permissions if specified
        if (isset($conditions['user_can_create_without_approval']) && isset($context['user_id'])) {
            $user = User::find($context['user_id']);
            if ($user) {
                $permissions = $this->hierarchyService->getUserPermissions($user);
                $canCreate = $permissions['can_create_without_approval'] ?? false;
                
                // If user can create without approval, workflow should not be triggered
                if ($conditions['user_can_create_without_approval'] === false && $canCreate) {
                    return false;
                }
            }
        }

        // Check user boarding permissions
        if (isset($conditions['user_can_board_without_approval']) && isset($context['user_id'])) {
            $user = User::find($context['user_id']);
            if ($user) {
                $permissions = $this->hierarchyService->getUserPermissions($user);
                $canBoard = $permissions['can_board_without_approval'] ?? false;
                
                if ($conditions['user_can_board_without_approval'] === false && $canBoard) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Determine approvers for specific workflow level
     *
     * @param ApprovalWorkflow $workflow
     * @param int $level
     * @param array $context
     * @return array Array of user IDs
     */
    public function determineApprovers(ApprovalWorkflow $workflow, int $level, array $context): array
    {
        $workflowLevel = $workflow->levels()->where('level_number', $level)->first();

        if (!$workflowLevel) {
            Log::error("Workflow level not found", [
                'workflow_id' => $workflow->id,
                'level' => $level,
            ]);
            return [];
        }

        // Direct user assignment
        if ($workflowLevel->approver_user_id) {
            return [$workflowLevel->approver_user_id];
        }

        // Role-based assignment
        if ($workflowLevel->approver_role_id) {
            $users = User::whereHas('roles', function ($query) use ($workflowLevel) {
                $query->where('roles.id', $workflowLevel->approver_role_id);
            })->pluck('id')->toArray();
            
            return $users;
        }

        // Criteria-based assignment
        if ($workflowLevel->approver_criteria) {
            return $this->resolveApproverCriteria($workflowLevel->approver_criteria, $context);
        }

        return [];
    }

    /**
     * Resolve approvers based on criteria
     *
     * @param array $criteria
     * @param array $context
     * @return array Array of user IDs
     */
    public function resolveApproverCriteria(array $criteria, array $context): array
    {
        $approvers = [];

        // Handle hierarchy-based approval
        if (isset($criteria['hierarchy_check'])) {
            $requestedBy = $context['requested_by'] ?? null;
            if (!$requestedBy) {
                return [];
            }

            $requester = User::find($requestedBy);
            if (!$requester) {
                return [];
            }

            $requesterPermissions = $this->hierarchyService->getUserPermissions($requester);
            $requesterLevel = $requesterPermissions['hierarchy_level'] ?? 99;

            if ($criteria['hierarchy_check'] === 'higher_than_requester') {
                // Find users with higher authority (lower hierarchy number)
                // Via: users → staff → staff_roles → recruitment_hierarchy
                $roleQuery = DB::table('recruitment_hierarchy')
                    ->where('hierarchy_level', '<', $requesterLevel);
                
                if (isset($criteria['permission_required'])) {
                    $roleQuery->where($criteria['permission_required'], true);
                }
                
                $roleIds = $roleQuery->pluck('role_id')->toArray();
                
                if (!empty($roleIds)) {
                    $approvers = DB::table('users')
                        ->join('staff', 'users.staff_profile_id', '=', 'staff.id')
                        ->join('staff_roles', 'staff.id', '=', 'staff_roles.staff_id')
                        ->whereIn('staff_roles.role_id', $roleIds)
                        ->where('users.is_active', true)
                        ->distinct()
                        ->pluck('users.id')
                        ->toArray();
                }
            }
        }

        // Handle Control Department approval (hierarchy_level = 0)
        if (isset($criteria['hierarchy_level']) && $criteria['hierarchy_level'] === 0) {
            // Find users via: users → staff → staff_roles → recruitment_hierarchy
            $roleIds = DB::table('recruitment_hierarchy')
                ->where('hierarchy_level', 0);
            
            if (isset($criteria['permission_required'])) {
                $roleIds->where($criteria['permission_required'], true);
            }
            
            $roleIds = $roleIds->pluck('role_id')->toArray();
            
            if (!empty($roleIds)) {
                $approvers = DB::table('users')
                    ->join('staff', 'users.staff_profile_id', '=', 'staff.id')
                    ->join('staff_roles', 'staff.id', '=', 'staff_roles.staff_id')
                    ->whereIn('staff_roles.role_id', $roleIds)
                    ->where('users.is_active', true)
                    ->distinct()
                    ->pluck('users.id')
                    ->toArray();
            }
        }

        // Handle assignee acceptance
        if (isset($criteria['approver_type']) && $criteria['approver_type'] === 'assignee') {
            // Context should contain assignee ID
            $assigneeId = $context['assignee_id'] ?? null;
            if ($assigneeId) {
                $approvers = [$assigneeId];
            }
        }

        return $approvers;
    }

    /**
     * Check if user can bypass approval requirements
     *
     * @param int $userId
     * @param string $approvalType
     * @return bool
     */
    public function checkBypassRules(int $userId, string $approvalType): bool
    {
        $user = User::find($userId);
        if (!$user) {
            return false;
        }

        $permissions = $this->hierarchyService->getUserPermissions($user);

        // Check type-specific bypass permissions
        if ($approvalType === 'staff_boarding') {
            return $permissions['can_board_without_approval'] ?? false;
        }

        if ($approvalType === 'recruitment_request') {
            return $permissions['can_create_without_approval'] ?? false;
        }

        return false;
    }
}
