<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Staff\StaffOfferController;

// Staff offer acceptance routes with Sanctum authentication
Route::middleware(['auth:sanctum'])->prefix('staff')->group(function () {
    // Get authenticated staff's offer status
    Route::get('/offer-status', [StaffOfferController::class, 'getOfferStatus']);

    // Accept offer
    Route::post('/accept-offer', [StaffOfferController::class, 'acceptOffer']);

    // Reject offer with reason
    Route::post('/reject-offer', [StaffOfferController::class, 'rejectOffer']);
});
