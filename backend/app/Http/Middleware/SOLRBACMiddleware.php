<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SOLRBACMiddleware
{
    /**
     * Handle RBAC permission checking for SOL staff admin access
     * 
     * This middleware ensures:
     * 1. User is authenticated
     * 2. User is SOL staff (from staff table with sol_staff = 'YES')
     * 3. User has admin role
     * 4. User has required permission for the module/submodule
     */
    public function handle(Request $request, Closure $next, string $module, string $submodule = null, string $permission = 'read'): Response
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            Log::warning('RBAC: Unauthenticated access attempt', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'route' => $request->getPathInfo()
            ]);

            return response()->json([
                'error' => 'Authentication required',
                'message' => 'Please log in to access this resource'
            ], 401);
        }

        $user = Auth::user();

        // Check if user is SOL staff (client_id = 1)
        $solStaff = DB::table('staff')
            ->where('email', $user->email)
            ->where('client_id', 1)
            ->where('status', 'active')
            ->first();

        if (!$solStaff) {
            Log::warning('RBAC: Non-SOL staff attempted admin access', [
                'user_id' => $user->id,
                'email' => $user->email,
                'route' => $request->getPathInfo()
            ]);

            return response()->json([
                'error' => 'Access denied',
                'message' => 'Admin access is restricted to SOL staff members only'
            ], 403);
        }

        // Check if user has admin role
        $hasAdminRole = DB::table('staff_roles')
            ->join('roles', 'staff_roles.role_id', '=', 'roles.id')
            ->where('staff_roles.staff_id', $solStaff->id)
            ->whereIn('roles.slug', ['super-admin', 'admin', 'global-admin'])
            ->exists();

        if (!$hasAdminRole) {
            Log::warning('RBAC: SOL staff without admin role attempted access', [
                'user_id' => $user->id,
                'staff_id' => $solStaff->id,
                'route' => $request->getPathInfo()
            ]);

            return response()->json([
                'error' => 'Insufficient privileges',
                'message' => 'Admin role required for this resource'
            ], 403);
        }

        // Check specific module/submodule permission
        $hasPermission = $this->checkPermission($solStaff->id, $module, $submodule, $permission);

        if (!$hasPermission) {
            Log::warning('RBAC: Permission denied', [
                'user_id' => $user->id,
                'staff_id' => $solStaff->id,
                'module' => $module,
                'submodule' => $submodule,
                'permission' => $permission,
                'route' => $request->getPathInfo()
            ]);

            return response()->json([
                'error' => 'Permission denied',
                'message' => "You don't have {$permission} access to this resource"
            ], 403);
        }

        // Add staff info to request for controllers to use
        $request->merge([
            'sol_staff' => $solStaff,
            'rbac_module' => $module,
            'rbac_submodule' => $submodule,
            'rbac_permission' => $permission
        ]);

        Log::info('RBAC: Access granted', [
            'user_id' => $user->id,
            'staff_id' => $solStaff->id,
            'module' => $module,
            'submodule' => $submodule,
            'permission' => $permission,
            'route' => $request->getPathInfo()
        ]);

        return $next($request);
    }

    /**
     * Check if staff has specific permission
     */
    private function checkPermission(int $staffId, string $module, ?string $submodule, string $permission): bool
    {
        // If no submodule specified, check module-level permission
        $targetSlug = $submodule ?? $module;

        // Get staff roles
        $staffRoles = DB::table('staff_roles')
            ->join('roles', 'staff_roles.role_id', '=', 'roles.id')
            ->where('staff_roles.staff_id', $staffId)
            ->where('roles.is_active', true)
            ->pluck('roles.id')
            ->toArray();

        if (empty($staffRoles)) {
            return false;
        }

        // Check if any role has the required permission
        $hasRolePermission = DB::table('role_permissions')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->join('submodules', 'permissions.submodule_id', '=', 'submodules.id')
            ->join('modules', 'submodules.module_id', '=', 'modules.id')
            ->whereIn('role_permissions.role_id', $staffRoles)
            ->where(function ($query) use ($module, $targetSlug) {
                // Check both module and submodule matches
                if ($targetSlug !== $module) {
                    // Submodule specific permission
                    $query->where('submodules.slug', $targetSlug);
                } else {
                    // Module level permission
                    $query->where('modules.slug', $module);
                }
            })
            ->where(function ($query) use ($permission) {
                // Check for exact permission or 'full' permission
                $query->where('permissions.slug', $permission)
                    ->orWhere('permissions.slug', 'full');
            })
            ->exists();

        if ($hasRolePermission) {
            return true;
        }

        // Check direct user permissions (overrides)
        $user = Auth::user();

        $hasUserPermission = DB::table('user_permissions')
            ->join('permissions', 'user_permissions.permission_id', '=', 'permissions.id')
            ->join('submodules', 'permissions.submodule_id', '=', 'submodules.id')
            ->join('modules', 'submodules.module_id', '=', 'modules.id')
            ->where('user_permissions.user_id', $user->id)
            ->where('user_permissions.granted', true)
            ->where(function ($query) use ($module, $targetSlug) {
                if ($targetSlug !== $module) {
                    $query->where('submodules.slug', $targetSlug);
                } else {
                    $query->where('modules.slug', $module);
                }
            })
            ->where(function ($query) use ($permission) {
                $query->where('permissions.slug', $permission)
                    ->orWhere('permissions.slug', 'full');
            })
            ->where(function ($query) {
                // Check expiration
                $query->whereNull('user_permissions.expires_at')
                    ->orWhere('user_permissions.expires_at', '>', now());
            })
            ->exists();

        if ($hasUserPermission) {
            return true;
        }

        // Check if permission is explicitly denied
        $isDenied = DB::table('user_permissions')
            ->join('permissions', 'user_permissions.permission_id', '=', 'permissions.id')
            ->join('submodules', 'permissions.submodule_id', '=', 'submodules.id')
            ->join('modules', 'submodules.module_id', '=', 'modules.id')
            ->where('user_permissions.user_id', $user->id)
            ->where('user_permissions.granted', false)
            ->where(function ($query) use ($module, $targetSlug) {
                if ($targetSlug !== $module) {
                    $query->where('submodules.slug', $targetSlug);
                } else {
                    $query->where('modules.slug', $module);
                }
            })
            ->where('permissions.slug', $permission)
            ->where(function ($query) {
                $query->whereNull('user_permissions.expires_at')
                    ->orWhere('user_permissions.expires_at', '>', now());
            })
            ->exists();

        // If explicitly denied, return false regardless of role permissions
        if ($isDenied) {
            return false;
        }

        return false;
    }
}
