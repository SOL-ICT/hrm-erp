<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Staff\LeaveApplyController;
use App\Http\Controllers\Staff\SupervisorController;

// Keep the auth middleware
Route::middleware(['auth:sanctum'])->prefix('staff')->group(function () {
    // Submit leave request
    Route::post('/leave-applications', [LeaveApplyController::class, 'store']);

    // View personal leave history
    Route::get('/leave-applications', [LeaveApplyController::class, 'index']);

    //delete leave application
    Route::delete('/leave-applications/{id}', [LeaveApplyController::class, 'destroy']);

    Route::get('/profile', [LeaveApplyController::class, 'getProfile']);
    Route::get('/leave-balance', [LeaveApplyController::class, 'getLeaveBalance']);
    
    // Admin route (you may want to add additional middleware for admin check)
    Route::post('/process-carry-over', [LeaveApplyController::class, 'processCarryOver']);

    // Leave handover list
    Route::get('/leave-handover-list', [LeaveApplyController::class, 'handoverList']);

    // PHASE 3: Dynamic Leave Data Endpoints
    // Get available leave types for staff's job structure
    Route::get('/available-leave-types', [LeaveApplyController::class, 'getAvailableLeaveTypes']);
    
    // Get entitlements with current balances
    Route::get('/entitlements-with-balance', [LeaveApplyController::class, 'getEntitlementsWithBalance']);
    
    // Calculate leave days between two dates
    Route::post('/calculate-leave-days', [LeaveApplyController::class, 'calculateLeaveDays']);
    
    // Check if staff can apply for leave (pre-validation)
    Route::post('/check-leave-eligibility', [LeaveApplyController::class, 'checkLeaveEligibility']);
    
    // Get detailed balance for specific leave type
    Route::get('/leave-type-balance/{leaveTypeId}', [LeaveApplyController::class, 'getLeaveTypeBalance']);
    
    // Supervisor Management Routes
    Route::get('/supervisor', [SupervisorController::class, 'show']);
    Route::post('/supervisor', [SupervisorController::class, 'store']);
    Route::put('/supervisor/{id}', [SupervisorController::class, 'update']);
    Route::get('/supervisor/history', [SupervisorController::class, 'history']);
});
