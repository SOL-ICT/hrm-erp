<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Staff\NameChangeRequestController;
use App\Http\Controllers\Staff\ChangeRequestController;

// Keep the auth middleware

Route::middleware(['auth:sanctum'])->prefix('staff')->group(function () {
  //view own requests
    Route::get('/name-change-requests', [NameChangeRequestController::class, 'index']);
//submit new request
    Route::post('/name-change-requests', [NameChangeRequestController::class, 'store']);
    Route::get('/name-change-requests/{id}', [NameChangeRequestController::class, 'show']);

    // Admin/HR routes
    //Route::patch('/name-change-requests/{id}/status', [NameChangeRequestController::class, 'updateStatus']);

    // Misc routes

    //Route::get('/staff/profile', [ChangeRequestController::class, 'showProfile']);
    Route::post('/change-requests', [ChangeRequestController::class, 'store']);
    Route::get('/change-requests/history', [ChangeRequestController::class, 'getHistory']);
    Route::put('/change-requests/{id}', [ChangeRequestController::class, 'update']);
});
