<?php

namespace App\Services;

use App\Models\User;
use App\Models\RecruitmentHierarchy;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * RecruitmentHierarchyService
 * 
 * Manages role-based permissions and hierarchy for recruitment and boarding operations.
 * Implements permission checking, hierarchy comparisons, and user assignment logic.
 * 
 * HIERARCHY LEVELS:
 * - Level 1: Global Admin, Super Admin (highest authority)
 * - Level 2: Recruitment, Regional Manager
 * - Level 3: HR
 * - Level 5: Assistants (lowest authority)
 * 
 * PERMISSIONS:
 * - can_create_request: Create recruitment requests without approval
 * - can_approve_request: Approve recruitment requests
 * - can_assign_ticket: Assign tickets to subordinates
 * - can_board_without_approval: Board staff without needing approval
 * - can_approve_boarding: Approve staff boarding
 */
class RecruitmentHierarchyService
{
    /**
     * Cache TTL in seconds (1 hour)
     */
    const CACHE_TTL = 3600;

    /**
     * Check if user can create recruitment request without approval
     *
     * @param User $user
     * @return bool
     */
    public function canCreateRequest(User $user): bool
    {
        $permissions = $this->getUserPermissions($user);

        if (!$permissions) {
            Log::info("User {$user->id} has no recruitment hierarchy permissions");
            return false;
        }

        return $permissions->can_create_request;
    }

    /**
     * Check if user can approve recruitment requests
     *
     * @param User $user
     * @return bool
     */
    public function canApproveRequest(User $user): bool
    {
        $permissions = $this->getUserPermissions($user);

        if (!$permissions) {
            return false;
        }

        return $permissions->can_approve_request;
    }

    /**
     * Check if user can assign tickets to subordinates
     *
     * @param User $user
     * @return bool
     */
    public function canAssignTicket(User $user): bool
    {
        $permissions = $this->getUserPermissions($user);

        if (!$permissions) {
            return false;
        }

        return $permissions->can_assign_ticket;
    }

    /**
     * Check if user can board staff without needing approval
     *
     * @param User $user
     * @return bool
     */
    public function canBoardWithoutApproval(User $user): bool
    {
        $permissions = $this->getUserPermissions($user);

        if (!$permissions) {
            return false;
        }

        return $permissions->can_board_without_approval;
    }

    /**
     * Check if user can approve staff boarding
     *
     * @param User $user
     * @return bool
     */
    public function canApproveBoarding(User $user): bool
    {
        $permissions = $this->getUserPermissions($user);

        if (!$permissions) {
            return false;
        }

        return $permissions->can_approve_boarding;
    }

    /**
     * Get user's hierarchy level (lower = higher authority)
     *
     * @param User $user
     * @return int Default 99 if no permissions found
     */
    public function getUserHierarchyLevel(User $user): int
    {
        $permissions = $this->getUserPermissions($user);

        if (!$permissions) {
            return 99; // Lowest level by default
        }

        return $permissions->hierarchy_level;
    }

    /**
     * Check if user1 has higher authority than user2
     * Lower hierarchy level = higher authority
     *
     * @param User $user1
     * @param User $user2
     * @return bool True if user1 has higher authority
     */
    public function hasHigherAuthority(User $user1, User $user2): bool
    {
        $level1 = $this->getUserHierarchyLevel($user1);
        $level2 = $this->getUserHierarchyLevel($user2);

        return $level1 < $level2;
    }

    /**
     * Get user's recruitment hierarchy permissions (cached)
     *
     * @param User $user
     * @return RecruitmentHierarchy|null
     */
    public function getUserPermissions(User $user): ?RecruitmentHierarchy
    {
        $cacheKey = "recruitment_hierarchy_user_{$user->id}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            // First, try to get permissions from staff_roles table (multi-role support)
            if ($user->staff_profile_id) {
                $staffRoles = DB::table('staff_roles')
                    ->where('staff_id', $user->staff_profile_id)
                    ->pluck('role_id')
                    ->toArray();

                if (!empty($staffRoles)) {
                    // Get the highest authority role (lowest hierarchy_level)
                    $permissions = RecruitmentHierarchy::whereIn('role_id', $staffRoles)
                        ->orderBy('hierarchy_level', 'asc')
                        ->first();

                    if ($permissions) {
                        Log::info("User {$user->id} permissions from staff_roles", [
                            'role_ids' => $staffRoles,
                            'selected_role_id' => $permissions->role_id,
                            'hierarchy_level' => $permissions->hierarchy_level
                        ]);
                        return $permissions;
                    }
                }
            }

            // Fallback: Map string role from users table to numeric role_id
            $roleMapping = [
                'super-admin' => 1,
                'admin' => 2,
                'recruitment' => 7,
                'staff' => null, // Staff don't have recruitment permissions
            ];

            $roleId = $roleMapping[$user->role] ?? null;

            if (!$roleId) {
                Log::warning("User {$user->id} has unmapped role: {$user->role}");
                return null;
            }

            // Find hierarchy permissions for this role
            $permissions = RecruitmentHierarchy::where('role_id', $roleId)->first();

            if (!$permissions) {
                Log::info("No recruitment hierarchy permissions found for role {$roleId}");
            }

            return $permissions;
        });
    }

    /**
     * Update role permissions (Super Admin only)
     * Clears cache for all users with this role
     *
     * @param int $roleId
     * @param array $permissions
     * @return bool
     */
    public function updateRolePermissions(int $roleId, array $permissions): bool
    {
        try {
            $hierarchy = RecruitmentHierarchy::where('role_id', $roleId)->first();

            if (!$hierarchy) {
                // Create new hierarchy record
                $hierarchy = RecruitmentHierarchy::create(array_merge(
                    ['role_id' => $roleId],
                    $permissions
                ));
            } else {
                // Update existing record
                $hierarchy->update($permissions);
            }

            // Clear cache for all users with this role
            $this->clearRoleCache($roleId);

            Log::info("Updated recruitment hierarchy permissions for role {$roleId}", $permissions);

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to update recruitment hierarchy permissions: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get list of users that the creator can assign tickets to
     * 
     * Rules:
     * 1. Can only assign to users with lower hierarchy level (higher number)
     * 2. Assigned user must have at least basic permissions or be trainable
     *
     * @param User $creator
     * @return Collection
     */
    public function getAssignableUsers(User $creator): Collection
    {
        $creatorLevel = $this->getUserHierarchyLevel($creator);

        // Get all users with hierarchy permissions lower than creator
        $assignableRoleIds = RecruitmentHierarchy::where('hierarchy_level', '>', $creatorLevel)
            ->pluck('role_id');

        if ($assignableRoleIds->isEmpty()) {
            return collect([]);
        }

        // Get users with these roles
        $users = User::whereIn('role', $assignableRoleIds)
            ->where('status', 'active')
            ->where('id', '!=', $creator->id)
            ->select('id', 'name', 'email', 'role')
            ->get();

        // Attach hierarchy level to each user
        $users = $users->map(function ($user) {
            $permissions = $this->getUserPermissions($user);
            $user->hierarchy_level = $permissions ? $permissions->hierarchy_level : 99;
            return $user;
        });

        return $users;
    }

    /**
     * Check if user needs approval for recruitment request creation
     *
     * @param User $user
     * @return bool True if user needs approval
     */
    public function needsApprovalForCreation(User $user): bool
    {
        return !$this->canCreateRequest($user);
    }

    /**
     * Check if user needs approval for staff boarding
     *
     * @param User $user
     * @return bool True if user needs approval
     */
    public function needsApprovalForBoarding(User $user): bool
    {
        return !$this->canBoardWithoutApproval($user);
    }

    /**
     * Clear cache for a specific user
     *
     * @param int $userId
     * @return void
     */
    public function clearUserCache(int $userId): void
    {
        $cacheKey = "recruitment_hierarchy_user_{$userId}";
        Cache::forget($cacheKey);
    }

    /**
     * Clear cache for all users with a specific role
     *
     * @param int $roleId
     * @return void
     */
    protected function clearRoleCache(int $roleId): void
    {
        // Get all users with this role
        $userIds = User::where('role', $roleId)->pluck('id');

        foreach ($userIds as $userId) {
            $this->clearUserCache($userId);
        }

        Log::info("Cleared recruitment hierarchy cache for all users with role {$roleId}");
    }

    /**
     * Get all hierarchy permissions (for admin view)
     *
     * @return Collection
     */
    public function getAllHierarchyPermissions(): Collection
    {
        return RecruitmentHierarchy::with('role')
            ->orderBy('hierarchy_level')
            ->get();
    }

    /**
     * Check if user can perform action on a ticket
     * Used for validation in controllers
     *
     * @param User $user
     * @param string $action 'create', 'approve', 'assign', 'board', 'approve_boarding'
     * @return bool
     */
    public function canPerformAction(User $user, string $action): bool
    {
        return match ($action) {
            'create' => $this->canCreateRequest($user),
            'approve' => $this->canApproveRequest($user),
            'assign' => $this->canAssignTicket($user),
            'board' => $this->canBoardWithoutApproval($user),
            'approve_boarding' => $this->canApproveBoarding($user),
            default => false,
        };
    }

    /**
     * Get permission summary for a user (for UI display)
     *
     * @param User $user
     * @return array
     */
    public function getUserPermissionSummary(User $user): array
    {
        $permissions = $this->getUserPermissions($user);

        if (!$permissions) {
            return [
                'has_permissions' => false,
                'hierarchy_level' => 99,
                'level_name' => 'No Permissions',
                'can_create_request' => false,
                'can_approve_request' => false,
                'can_assign_ticket' => false,
                'can_board_without_approval' => false,
                'can_approve_boarding' => false,
            ];
        }

        $levelName = match ($permissions->hierarchy_level) {
            1 => 'Administrator',
            2 => 'Manager',
            3 => 'Supervisor',
            5 => 'Assistant',
            default => 'Level ' . $permissions->hierarchy_level,
        };

        return [
            'has_permissions' => true,
            'hierarchy_level' => $permissions->hierarchy_level,
            'level_name' => $levelName,
            'can_create_request' => $permissions->can_create_request,
            'can_approve_request' => $permissions->can_approve_request,
            'can_assign_ticket' => $permissions->can_assign_ticket,
            'can_board_without_approval' => $permissions->can_board_without_approval,
            'can_approve_boarding' => $permissions->can_approve_boarding,
        ];
    }
}
