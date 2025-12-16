<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\LeaveApprovalController;

Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    // Leave Management
    Route::get('/leave-approvals', [LeaveApprovalController::class, 'index']);
    Route::get('/leave-approvals/statistics', [LeaveApprovalController::class, 'statistics']);
    Route::post('/leave-approvals/{id}/approve', [LeaveApprovalController::class, 'approve']);
    Route::post('/leave-approvals/{id}/reject', [LeaveApprovalController::class, 'reject']);
    
    // Filter data
    Route::get('/leave-approvals/clients', [LeaveApprovalController::class, 'getClients']);
    Route::get('/leave-approvals/types', [LeaveApprovalController::class, 'getLeaveTypes']);
    
    // Reports
    Route::get('/leave-approvals/export', [LeaveApprovalController::class, 'exportReport']);
});
