<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Staff\StaffProfileController;

Route::middleware(['auth:sanctum'])->prefix('staff')->group(function () {
    Route::get('/staff-profiles', [StaffProfileController::class, 'index']);
    // 'me' must be declared before the {id} wildcard to avoid 'me' being treated as an id
    Route::get('/staff-profiles/me', [StaffProfileController::class, 'me']); // ✅ This one
    // Constrain {id} to numeric to avoid accidental matches like 'me'
    Route::get('/staff-profiles/{id}', [StaffProfileController::class, 'show'])->where('id', '[0-9]+');
});


