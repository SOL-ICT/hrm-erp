<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\Approval\ApprovalController;

/*
|--------------------------------------------------------------------------
| Approval Management Routes
|--------------------------------------------------------------------------
| Centralized approval system routes
| Handles cross-module approval workflows
*/

Route::prefix('admin/approvals')->middleware(['auth:sanctum'])->group(function () {
    
    // Dashboard routes
    Route::get('/dashboard', [ApprovalController::class, 'dashboard']); // Dashboard data
    Route::get('/dashboard/modules', [ApprovalController::class, 'moduleBreakdown']); // Module breakdown
    
    // List and filter routes
    Route::get('/', [ApprovalController::class, 'index']); // Get all approvals with filters
    Route::get('/pending', [ApprovalController::class, 'pending']); // My pending approvals
    Route::get('/submitted', [ApprovalController::class, 'submitted']); // My submitted requests
    Route::get('/delegated', [ApprovalController::class, 'delegated']); // Approvals delegated to me
    Route::get('/stats', [ApprovalController::class, 'stats']); // Approval statistics
    Route::get('/overdue', [ApprovalController::class, 'overdue']); // Overdue approvals
    
    // Individual approval routes
    Route::get('/{id}', [ApprovalController::class, 'show']); // Get single approval details
    Route::get('/{id}/history', [ApprovalController::class, 'history']); // Get approval history
    
    // Action routes
    Route::post('/{id}/approve', [ApprovalController::class, 'approve']); // Approve request
    Route::post('/{id}/reject', [ApprovalController::class, 'reject']); // Reject request
    Route::post('/{id}/comment', [ApprovalController::class, 'comment']); // Add comment
    Route::post('/{id}/escalate', [ApprovalController::class, 'escalate']); // Escalate to higher authority
    Route::delete('/{id}', [ApprovalController::class, 'cancel']); // Cancel approval (requester only)
    
    // Bulk action routes
    Route::post('/bulk-approve', [ApprovalController::class, 'bulkApprove']); // Bulk approve
    Route::post('/bulk-reject', [ApprovalController::class, 'bulkReject']); // Bulk reject
    Route::post('/bulk-delete', [ApprovalController::class, 'bulkDelete']); // Bulk delete
});
