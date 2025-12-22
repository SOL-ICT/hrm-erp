<?php

use App\Http\Controllers\Admin\Requisition\StaffRequisitionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Staff Requisition Management Routes
|--------------------------------------------------------------------------
| Manages staff requisitions throughout their lifecycle
*/

Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::prefix('requisitions')->group(function () {
        // List requisitions (filtered by role/permissions)
        Route::get('/', [StaffRequisitionController::class, 'index']);
        
        // Create new requisition (Staff)
        Route::post('/', [StaffRequisitionController::class, 'store']);
        
        // Get single requisition details
        Route::get('/{id}', [StaffRequisitionController::class, 'show']);
        
        // Get current user's requisitions
        Route::get('/my/list', [StaffRequisitionController::class, 'myRequisitions']);
        
        // Get pending requisitions (Store Keeper)
        Route::get('/pending/approvals', [StaffRequisitionController::class, 'pendingApprovals']);
        
        // Get requisitions ready for collection
        Route::get('/ready/collection', [StaffRequisitionController::class, 'readyForCollection']);
        
        // Approve requisition (Store Keeper)
        Route::post('/{id}/approve', [StaffRequisitionController::class, 'approve']);
        
        // Reject requisition (Store Keeper)
        Route::post('/{id}/reject', [StaffRequisitionController::class, 'reject']);
        
        // Cancel requisition (Staff, if pending)
        Route::post('/{id}/cancel', [StaffRequisitionController::class, 'cancel']);
        
        // Mark items ready for collection (Store Keeper)
        Route::post('/{id}/mark-ready', [StaffRequisitionController::class, 'markReady']);
        
        // Mark items as collected (Store Keeper)
        Route::post('/{id}/mark-collected', [StaffRequisitionController::class, 'markCollected']);
        
        // Get requisition statistics
        Route::get('/stats/overview', [StaffRequisitionController::class, 'statistics']);
    });
});
