<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Candidate\CandidateJobApplicationController;

/*
|--------------------------------------------------------------------------
| Candidate Job Application Routes
|--------------------------------------------------------------------------
|
| Routes for candidates to submit and manage job applications
|
*/

// Protected routes for authenticated candidates
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Get available jobs with application status
    Route::get('/available-jobs', [CandidateJobApplicationController::class, 'getAvailableJobs'])
        ->name('available-jobs');
    
    // Get candidate's job applications
    Route::get('/my-applications', [CandidateJobApplicationController::class, 'getMyApplications'])
        ->name('my-applications');
    
    // Get specific application details
    Route::get('/my-applications/{applicationId}', [CandidateJobApplicationController::class, 'getApplication'])
        ->name('application-details');
    
    // Withdraw application
    Route::put('/my-applications/{applicationId}/withdraw', [CandidateJobApplicationController::class, 'withdrawApplication'])
        ->name('withdraw-application');
    
    // Job application submission (requires authentication)
    Route::post('/apply-for-position', [CandidateJobApplicationController::class, 'submitApplication'])
        ->name('apply-for-position');
        
});
