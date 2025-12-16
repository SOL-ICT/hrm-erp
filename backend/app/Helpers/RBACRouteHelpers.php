<?php

use Illuminate\Support\Facades\Route;

/**
 * SOL RBAC Route Helpers
 * 
 * These helpers make it easy to add RBAC protection to admin routes
 * All routes automatically check for SOL staff status and admin roles
 */

if (!function_exists('solAdminRoute')) {
    /**
     * Create a route with SOL RBAC protection
     * 
     * @param string $uri
     * @param array|string|callable $action
     * @param string $module
     * @param string|null $submodule
     * @param string $permission (read|write|delete|full)
     * @return \Illuminate\Routing\Route
     */
    function solAdminRoute(string $method, string $uri, $action, string $module, ?string $submodule = null, string $permission = 'read')
    {
        $middlewareParams = [$module];
        if ($submodule) {
            $middlewareParams[] = $submodule;
        }
        $middlewareParams[] = $permission;

        return Route::{$method}($uri, $action)
            ->middleware(['auth:sanctum', 'sol.rbac:' . implode(',', $middlewareParams)]);
    }
}

if (!function_exists('solAdminGet')) {
    /**
     * GET route with SOL RBAC protection
     */
    function solAdminGet(string $uri, $action, string $module, ?string $submodule = null, string $permission = 'read')
    {
        return solAdminRoute('get', $uri, $action, $module, $submodule, $permission);
    }
}

if (!function_exists('solAdminPost')) {
    /**
     * POST route with SOL RBAC protection
     */
    function solAdminPost(string $uri, $action, string $module, ?string $submodule = null, string $permission = 'write')
    {
        return solAdminRoute('post', $uri, $action, $module, $submodule, $permission);
    }
}

if (!function_exists('solAdminPut')) {
    /**
     * PUT route with SOL RBAC protection
     */
    function solAdminPut(string $uri, $action, string $module, ?string $submodule = null, string $permission = 'write')
    {
        return solAdminRoute('put', $uri, $action, $module, $submodule, $permission);
    }
}

if (!function_exists('solAdminDelete')) {
    /**
     * DELETE route with SOL RBAC protection
     */
    function solAdminDelete(string $uri, $action, string $module, ?string $submodule = null, string $permission = 'delete')
    {
        return solAdminRoute('delete', $uri, $action, $module, $submodule, $permission);
    }
}

if (!function_exists('solAdminGroup')) {
    /**
     * Create a route group with SOL RBAC protection for a module
     */
    function solAdminGroup(string $module, ?string $submodule = null, string $permission = 'read', callable $callback = null)
    {
        $middlewareParams = [$module];
        if ($submodule) {
            $middlewareParams[] = $submodule;
        }
        $middlewareParams[] = $permission;

        return Route::group([
            'middleware' => ['auth:sanctum', 'sol.rbac:' . implode(',', $middlewareParams)]
        ], $callback);
    }
}
