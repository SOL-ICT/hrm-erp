<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RBACMiddleware
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

        // Check if user is SOL staff
        $solStaff = DB::table('staff')
            ->where('email', $user->email)
            ->where('sol_staff', 'YES')
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

    /**
     * Check if user has specific permission
     */
    private function hasPermission($user, string $moduleSlug, string $submoduleSlug, string $permissionType): bool
    {
        try {
            // Get the module
            $module = Module::where('slug', $moduleSlug)->first();
            if (!$module) {
                return false;
            }

            // Get the submodule
            $submodule = Submodule::where('slug', $submoduleSlug)
                ->where('module_id', $module->id)
                ->first();
            if (!$submodule) {
                return false;
            }

            // Get the permission
            $permission = Permission::where('submodule_id', $submodule->id)
                ->where('permission_type', $permissionType)
                ->first();
            if (!$permission) {
                return false;
            }

            // Check if user has this permission (either through role or direct assignment)
            $hasPermission = UserPermission::where('user_id', $user->id)
                ->where('permission_id', $permission->id)
                ->where('is_granted', true)
                ->exists();

            return $hasPermission;
        } catch (\Exception $e) {
            Log::error('RBAC Permission Check Error: ' . $e->getMessage());
            return false;
        }
    }
}
