<?php

// Add these routes to your routes/web.php or routes/api.php file
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Staff\MiscChangeRequestController;

// Staff change request routes (require authentication)
Route::middleware(['auth:sanctum'])->prefix('staff')->group(function () {
    
    // Change request endpoints
    Route::prefix('change-requests')->group(function () {
        Route::post('/', [MiscChangeRequestController::class, 'store']);
        Route::get('/history', [MiscChangeRequestController::class, 'getHistory']);
    });
    
    // Current values endpoint (mock for now)
    Route::get('/current-values/{userId}', [MiscChangeRequestController::class, 'getCurrentValues']);
});

// Admin routes for managing change requests (add when needed)
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    
    Route::prefix('change-requests')->group(function () {
        Route::get('/', [MiscChangeRequestController::class, 'getAllRequests']);
        Route::get('/{id}', [MiscChangeRequestController::class, 'getRequest']);
        Route::put('/{id}/approve', [MiscChangeRequestController::class, 'approve']);
        Route::put('/{id}/reject', [MiscChangeRequestController::class, 'reject']);
        Route::put('/{id}/status', [MiscChangeRequestController::class, 'updateStatus']);
    });
});