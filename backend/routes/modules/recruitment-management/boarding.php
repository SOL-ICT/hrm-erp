<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RecruitmentManagement\BoardingController;
use App\Http\Controllers\Api\RecruitmentManagement\TestBoardingController;

/*
|--------------------------------------------------------------------------
| Boarding Module Routes
|--------------------------------------------------------------------------
| Routes for managing candidate boarding process - from offer letters
| to successful onboarding as staff members
*/

Route::prefix('recruitment-management/boarding')->group(function () {
    // Test route to verify routing works
    Route::get('/test', function () {
        return response()->json(['message' => 'Boarding routes working!', 'timestamp' => now()]);
    });

    // Separate test controller to isolate issues
    Route::get('/test-controller', [TestBoardingController::class, 'test']);

    // Get clients with active recruitment requests
    Route::get('/clients', [BoardingController::class, 'getClients']);

    // Get tickets for a specific client
    Route::get('/tickets', [BoardingController::class, 'getTickets']);

    // Get pay grades for a job structure
    Route::get('/pay-grades', [BoardingController::class, 'getPayGrades']);

    // Debug endpoint to check job structure data integrity
    Route::get('/debug/job-structure', [BoardingController::class, 'debugJobStructure']);

    // Get candidates for offer issuance (recommended but no offers yet)
    Route::get('/candidates/offer', [BoardingController::class, 'getCandidatesForOffer']);

    // Get candidates ready for boarding (accepted offers)
    Route::get('/candidates/boarding', [BoardingController::class, 'getCandidatesForBoarding']);

    // Send offers to multiple candidates (bulk operation)
    Route::post('/offers/send', [BoardingController::class, 'sendOffers']);

    // Board multiple candidates (bulk operation)
    Route::post('/candidates/board', [BoardingController::class, 'boardCandidates']);
});
