<?php

use App\Http\Controllers\Admin\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'user-management', 'middleware' => ['auth:sanctum']], function () {
    
    // List SOL staff users
    Route::get('/staff-users', [UserManagementController::class, 'index'])
        ->name('admin.user-management.index');
    
    // Get available roles
    Route::get('/available-roles', [UserManagementController::class, 'availableRoles'])
        ->name('admin.user-management.available-roles');
    
    // Change user role
    Route::post('/users/{id}/change-role', [UserManagementController::class, 'changeRole'])
        ->name('admin.user-management.change-role');
    
    // Reset password
    Route::post('/users/{id}/reset-password', [UserManagementController::class, 'resetPassword'])
        ->name('admin.user-management.reset-password');
    
    // Role change history
    Route::get('/role-history', [UserManagementController::class, 'roleHistory'])
        ->name('admin.user-management.role-history');
});
