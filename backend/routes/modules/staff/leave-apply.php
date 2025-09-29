<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Staff\LeaveApplyController;

// Keep the auth middleware
Route::middleware(['auth:sanctum'])->prefix('staff')->group(function () {
    // Submit leave request
    Route::post('/leave-applications', [LeaveApplyController::class, 'store']);

    // View personal leave history
    Route::get('/leave-applications', [LeaveApplyController::class, 'index']);
});