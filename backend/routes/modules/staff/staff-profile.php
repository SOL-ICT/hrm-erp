<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Staff\StaffProfileController;

Route::middleware(['auth:sanctum'])->prefix('staff')->group(function () {
    Route::get('/staff-profiles', [StaffProfileController::class, 'index']);
    Route::get('/staff-profiles/{id}', [StaffProfileController::class, 'show']);
    Route::get('/staff-profiles/me', [StaffProfileController::class, 'me']); // ✅ This one
});


