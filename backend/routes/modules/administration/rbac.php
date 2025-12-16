<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\RBACController;

/*
|--------------------------------------------------------------------------
| RBAC (Role-Based Access Control) Routes
|--------------------------------------------------------------------------
| These routes handle role and permission management for the admin dashboard
*/

Route::prefix('admin/rbac')->middleware(['auth:sanctum'])->group(function () {

    // Get modules structure for RBAC UI
    Route::get('/modules', [RBACController::class, 'getModulesStructure'])
        ->middleware('throttle:60,1');

    // Roles management
    Route::get('/roles', [RBACController::class, 'getRoles'])
        ->middleware('throttle:60,1');
    Route::get('/roles/{company_role}/permissions', [RBACController::class, 'getRolePermissions'])
        ->middleware('throttle:60,1');
    Route::put('/roles/{company_role}/permissions', [RBACController::class, 'updateRolePermissions'])
        ->middleware('throttle:60,1');

    // User permissions management
    Route::get('/users/{user}/permissions', [RBACController::class, 'getUserPermissions']);
    Route::post('/users/{user}/permissions', [RBACController::class, 'updateUserPermission']);

    // Current user permissions (for frontend RBAC)
    Route::get('/me/permissions', [RBACController::class, 'getCurrentUserPermissions']);

    // Permission checking
    Route::get('/users/{user}/check/{module}/{submodule}/{permission}', [RBACController::class, 'checkUserPermission']);
});
