<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdvanceController;

/*
|--------------------------------------------------------------------------
| Advance Routes
|--------------------------------------------------------------------------
|
| Routes for advance request management
| Officers request advances, approvers approve, Accounts disburses
|
*/

Route::prefix('admin')->group(function () {
    Route::prefix('advances')->group(function () {
    // List and create
    Route::get('/', [AdvanceController::class, 'index']);
    Route::post('/', [AdvanceController::class, 'store']);
    
    // Statistics
    Route::get('/statistics', [AdvanceController::class, 'statistics']);
    
    // User-specific
    Route::get('/my-advances', [AdvanceController::class, 'myAdvances']);
    
    // Role-specific lists
    Route::get('/pending-approvals', [AdvanceController::class, 'pendingApprovals']);
    Route::get('/ready-for-disbursement', [AdvanceController::class, 'readyForDisbursement']);
    Route::get('/overdue-retirements', [AdvanceController::class, 'overdueRetirements']);
    
    // Single advance
    Route::get('/{id}', [AdvanceController::class, 'show']);
    
    // Actions
    Route::post('/{id}/cancel', [AdvanceController::class, 'cancel']);
    Route::post('/{id}/approve', [AdvanceController::class, 'approve']);
    Route::post('/{id}/reject', [AdvanceController::class, 'reject']);
    Route::post('/{id}/disburse', [AdvanceController::class, 'disburse']);
    });
});
