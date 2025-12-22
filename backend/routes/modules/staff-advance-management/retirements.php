<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\RetirementController;

/*
|--------------------------------------------------------------------------
| Retirement Routes
|--------------------------------------------------------------------------
|
| Routes for advance retirement management
| Officers submit retirements, Risk Management reviews
|
*/

Route::prefix('admin')->group(function () {
    Route::prefix('retirements')->group(function () {
    // List and submit
    Route::get('/', [RetirementController::class, 'index']);
    Route::post('/', [RetirementController::class, 'store']);
    
    // Statistics
    Route::get('/statistics', [RetirementController::class, 'statistics']);
    
    // Role-specific lists
    Route::get('/pending-reviews', [RetirementController::class, 'pendingReviews']);
    Route::get('/overdue', [RetirementController::class, 'overdueRetirements']);
    
    // Single retirement
    Route::get('/{id}', [RetirementController::class, 'show']);
    
    // Add items
    Route::post('/{id}/add-item', [RetirementController::class, 'addItem']);
    
    // Actions
    Route::post('/{id}/review', [RetirementController::class, 'review']);
    Route::post('/{id}/approve', [RetirementController::class, 'approve']);
    Route::post('/{id}/reject', [RetirementController::class, 'reject']);
    Route::post('/{id}/query', [RetirementController::class, 'query']);
    });
});
