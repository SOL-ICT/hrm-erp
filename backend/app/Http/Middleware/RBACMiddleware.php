<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\UserPermission;
use App\Models\Permission;
use App\Models\Submodule;
use App\Models\Module;

class RBACMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $module
     * @param  string  $submodule
     * @param  string  $permission (read|write|delete|full)
     */
    public function handle(Request $request, Closure $next, string $module, string $submodule, string $permission): Response
    {
        // Allow unauthenticated access for now - we'll tighten this later
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $user = Auth::user();

        // Super admin bypass (Global Admin role)
        if ($user->company_role === 'global-admin') {
            return $next($request);
        }

        // Check if user has specific permission
        if ($this->hasPermission($user, $module, $submodule, $permission)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Insufficient permissions',
            'required' => "{$module}.{$submodule}.{$permission}"
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
