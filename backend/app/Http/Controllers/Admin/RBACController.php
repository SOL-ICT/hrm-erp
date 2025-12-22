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
use Illuminate\Support\Facades\DB;

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

            // Debug: Log Claims module submodules
            $claimsModule = $modules->where('slug', 'claims')->first();
            if ($claimsModule) {
                \Log::info('Claims Module Submodules:', [
                    'count' => $claimsModule->submodules->count(),
                    'submodules' => $claimsModule->submodules->map(function($s) {
                        return [
                            'id' => $s->id,
                            'slug' => $s->slug,
                            'name' => $s->name,
                            'is_active' => $s->is_active,
                            'permissions_count' => $s->permissions->count()
                        ];
                    })
                ]);
            }

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
            ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
              ->header('Pragma', 'no-cache')
              ->header('Expires', '0');
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
        \Log::info('🔄 RBAC: Updating permissions for role', [
            'role_id' => $company_role->id,
            'role_name' => $company_role->name,
            'permissions_received' => $request->permissions,
            'permissions_count' => count($request->permissions ?? [])
        ]);

        $request->validate([
            'permissions' => 'array',  // Allow empty array to remove all permissions
            'permissions.*' => 'integer|exists:permissions,id'
        ]);

        try {
            // Get current permissions before sync
            $currentPermissions = $company_role->permissions()->pluck('permissions.id')->toArray();
            \Log::info('📦 Current permissions before sync', [
                'count' => count($currentPermissions),
                'ids' => $currentPermissions
            ]);

            // Sync role permissions
            $syncResult = $company_role->permissions()->sync($request->permissions);
            
            \Log::info('✅ Permissions synced successfully', [
                'attached' => $syncResult['attached'] ?? [],
                'detached' => $syncResult['detached'] ?? [],
                'updated' => $syncResult['updated'] ?? []
            ]);

            // Get updated permissions after sync
            $updatedPermissions = $company_role->permissions()->pluck('permissions.id')->toArray();
            \Log::info('📦 Updated permissions after sync', [
                'count' => count($updatedPermissions),
                'ids' => $updatedPermissions
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Role permissions updated successfully',
                'data' => [
                    'role_id' => $company_role->id,
                    'permissions_count' => count($updatedPermissions),
                    'sync_result' => $syncResult
                ]
            ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
              ->header('Pragma', 'no-cache')
              ->header('Expires', '0');
        } catch (\Exception $e) {
            \Log::error('❌ Failed to update role permissions', [
                'role_id' => $company_role->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

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

    /**
     * Get current user's permissions for frontend RBAC
     */
    public function getCurrentUserPermissions(Request $request)
    {
        $user = Auth::user();

        // Get staff record - must be SOL staff (client_id = 1)
        $staff = DB::table('staff')
            ->where('email', $user->email)
            ->where('client_id', 1) // SOL staff only
            ->where('status', 'active')
            ->first();

        if (!$staff) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Access restricted to SOL staff only'
            ], 403);
        }

        // Get user's roles
        $userRoles = DB::table('staff_roles as sr')
            ->join('roles as r', 'sr.role_id', '=', 'r.id')
            ->where('sr.staff_id', $staff->id)
            ->where('r.is_active', true)
            ->select('r.id', 'r.name', 'r.slug')
            ->get();

        // Get role-based permissions
        $rolePermissions = DB::table('role_permissions as rp')
            ->join('permissions as p', 'rp.permission_id', '=', 'p.id')
            ->join('submodules as s', 'p.submodule_id', '=', 's.id')
            ->join('modules as m', 's.module_id', '=', 'm.id')
            ->whereIn('rp.role_id', $userRoles->pluck('id'))
            ->select(
                'm.slug as module_slug',
                's.slug as submodule_slug',
                'p.slug as permission_slug'
            )
            ->get();

        // Build permission map
        $permissions = [];

        // Add role-based permissions
        foreach ($rolePermissions as $permission) {
            // Check if permission slug already includes submodule prefix
            if (strpos($permission->permission_slug, $permission->submodule_slug . '.') === 0) {
                // Permission slug already prefixed (e.g., 'inventory-management.read')
                $key = "{$permission->module_slug}.{$permission->permission_slug}";
            } else {
                // Permission slug is simple (e.g., 'read')
                $key = "{$permission->module_slug}.{$permission->submodule_slug}.{$permission->permission_slug}";
            }
            $permissions[$key] = true;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user_id' => $user->id,
                'staff_id' => $staff->id,
                'roles' => $userRoles,
                'permissions' => $permissions,
                'is_sol_staff' => true
            ]
        ]);
    }
}
