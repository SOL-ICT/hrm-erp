<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Permission;
use App\Models\CompanyRole;
use App\Models\Submodule;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RBACController extends Controller
{
    /**
     * Get all modules with submodules and permissions for RBAC management
     */
    public function getModulesStructure(): JsonResponse
    {
        try {
            $modules = Module::with(['submodules.permissions'])
                ->active()
                ->orderBy('sort_order')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $modules
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch modules structure',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all roles with their permissions
     */
    public function getRoles(): JsonResponse
    {
        try {
            // Start simple - just get roles without complex relationships for now
            $roles = CompanyRole::where('is_active', true)
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get permissions for a specific role
     */
    public function getRolePermissions(CompanyRole $company_role): JsonResponse
    {
        try {
            $rolePermissions = $company_role->permissions()
                ->with(['submodule.module'])
                ->get()
                ->groupBy('submodule.module.slug');

            return response()->json([
                'success' => true,
                'data' => [
                    'role' => $company_role,
                    'permissions' => $rolePermissions
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch role permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update permissions for a role
     */
    public function updateRolePermissions(Request $request, CompanyRole $company_role): JsonResponse
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'integer|exists:permissions,id'
        ]);

        try {
            // Sync role permissions
            $company_role->permissions()->sync($request->permissions);

            return response()->json([
                'success' => true,
                'message' => 'Role permissions updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update role permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user permissions (role-based + direct)
     */
    public function getUserPermissions(User $user): JsonResponse
    {
        try {
            // Get role-based permissions
            $rolePermissions = collect();
            if ($user->staffProfile && $user->staffProfile->roles) {
                foreach ($user->staffProfile->roles as $role) {
                    $rolePermissions = $rolePermissions->merge($role->permissions);
                }
            }

            // Get direct user permissions
            $userPermissions = $user->permissions()
                ->with(['submodule.module'])
                ->wherePivot('granted', true)
                ->wherePivot(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                })
                ->get();

            // Get denied permissions
            $deniedPermissions = $user->permissions()
                ->with(['submodule.module'])
                ->wherePivot('granted', false)
                ->wherePivot(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                })
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user->load('staffProfile.roles'),
                    'rolePermissions' => $rolePermissions->unique('id'),
                    'userPermissions' => $userPermissions,
                    'deniedPermissions' => $deniedPermissions
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Grant or deny permission to a user
     */
    public function updateUserPermission(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'permission_id' => 'required|integer|exists:permissions,id',
            'granted' => 'required|boolean',
            'expires_at' => 'nullable|date'
        ]);

        try {
            UserPermission::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'permission_id' => $request->permission_id
                ],
                [
                    'granted' => $request->granted,
                    'granted_by' => Auth::id(),
                    'granted_at' => now(),
                    'expires_at' => $request->expires_at
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'User permission updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user permission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if user has specific permission
     */
    public function checkUserPermission(User $user, string $module, string $submodule, string $permission): JsonResponse
    {
        try {
            $hasPermission = $this->userHasPermission($user, $module, $submodule, $permission);

            return response()->json([
                'success' => true,
                'data' => [
                    'hasPermission' => $hasPermission,
                    'module' => $module,
                    'submodule' => $submodule,
                    'permission' => $permission
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check user permission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to check if user has specific permission
     */
    private function userHasPermission(User $user, string $module, string $submodule, string $permission): bool
    {
        // Check direct user permission first (overrides)
        $userPermission = UserPermission::where('user_id', $user->id)
            ->whereHas('permission', function ($query) use ($module, $submodule, $permission) {
                $query->where('slug', $permission)
                    ->whereHas('submodule', function ($q) use ($module, $submodule) {
                        $q->where('slug', $submodule)
                            ->whereHas('module', function ($mq) use ($module) {
                                $mq->where('slug', $module);
                            });
                    });
            })
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->first();

        if ($userPermission) {
            return $userPermission->granted;
        }

        // Check role-based permissions
        if ($user->staffProfile && $user->staffProfile->roles) {
            foreach ($user->staffProfile->roles as $role) {
                $hasRolePermission = $role->permissions()
                    ->where('slug', $permission)
                    ->whereHas('submodule', function ($query) use ($module, $submodule) {
                        $query->where('slug', $submodule)
                            ->whereHas('module', function ($q) use ($module) {
                                $q->where('slug', $module);
                            });
                    })
                    ->exists();

                if ($hasRolePermission) {
                    return true;
                }
            }
        }

        return false;
    }
}
