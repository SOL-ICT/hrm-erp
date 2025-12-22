<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\PurchaseRequestController;

/*
|--------------------------------------------------------------------------
| Purchase Request Routes
|--------------------------------------------------------------------------
|
| Routes for purchase request management
| Store Keeper creates requests, Admin Officer reviews, Finance approves
|
*/

Route::middleware(['auth:sanctum'])->prefix('purchase-requests')->group(function () {
    // List and create
    Route::get('/', [PurchaseRequestController::class, 'index']);
    Route::post('/', [PurchaseRequestController::class, 'store']);
    
    // Statistics
    Route::get('/statistics', [PurchaseRequestController::class, 'statistics']);
    
    // User-specific
    Route::get('/my-requests', [PurchaseRequestController::class, 'myRequests']);
    
    // Pending reviews (role-based)
    Route::get('/pending-admin-review', [PurchaseRequestController::class, 'pendingAdminReview']);
    Route::get('/pending-finance-approval', [PurchaseRequestController::class, 'pendingFinanceApproval']);
    
    // Single request
    Route::get('/{id}', [PurchaseRequestController::class, 'show']);
    
    // Actions
    Route::post('/{id}/cancel', [PurchaseRequestController::class, 'cancel']);
    Route::post('/{id}/review', [PurchaseRequestController::class, 'review']);
    Route::post('/{id}/approve', [PurchaseRequestController::class, 'approve']);
    Route::post('/{id}/reject', [PurchaseRequestController::class, 'reject']);
});
