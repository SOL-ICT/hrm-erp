<?php

use App\Http\Controllers\Admin\ClaimResolutionController;
use App\Http\Controllers\Admin\ClaimResolutionListController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Claims Module Routes
|--------------------------------------------------------------------------
|
| Routes for Fidelity Claims Management
| - Claims Resolution (dashboard & actions)
| - Claims Resolution List (comprehensive listing)
|
*/

Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    
    // Claims Resolution (Dashboard & Actions)
    Route::prefix('claims/resolution')->group(function () {
        Route::get('/', [ClaimResolutionController::class, 'index']); // Dashboard stats & active claims
        Route::get('/clients', [ClaimResolutionController::class, 'getClients']); // Get clients with policy info
        Route::get('/clients/{clientId}/staff', [ClaimResolutionController::class, 'getClientStaff']); // Get staff for client
        Route::post('/', [ClaimResolutionController::class, 'store']); // Create new claim
        Route::put('/{id}/accept', [ClaimResolutionController::class, 'accept']); // Accept claim
        Route::put('/{id}/decline', [ClaimResolutionController::class, 'decline']); // Decline claim
        Route::put('/{id}/file-insurer', [ClaimResolutionController::class, 'fileWithInsurer']); // File with insurer
        Route::put('/{id}/settle', [ClaimResolutionController::class, 'markAsSettled']); // Mark as settled
        Route::post('/{id}/evidence', [ClaimResolutionController::class, 'uploadEvidence']); // Upload evidence
        Route::get('/{id}/evidence', [ClaimResolutionController::class, 'getEvidence']); // Get evidence files
        Route::delete('/{id}/evidence/{evidenceId}', [ClaimResolutionController::class, 'deleteEvidence']); // Delete evidence
    });

    // Claims Resolution List (Comprehensive Listing)
    Route::prefix('claims/list')->group(function () {
        Route::get('/', [ClaimResolutionListController::class, 'index']); // Get all claims with filters
        Route::get('/filters', [ClaimResolutionListController::class, 'getFilterOptions']); // Get filter options
        Route::get('/{id}', [ClaimResolutionListController::class, 'show']); // Get single claim details
    });

    // Claims Export
    Route::get('claims/export', [ClaimResolutionListController::class, 'export']); // Export claims data
});
