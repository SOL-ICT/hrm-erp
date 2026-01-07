<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Staff\LeaveApplyController;

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
    
});