<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Candidate\CandidateTestController;

/*
|--------------------------------------------------------------------------
| Candidate Test Routes
|--------------------------------------------------------------------------
|
| Routes for candidate test management functionality
| These routes handle test assignments, taking tests, and viewing results
|
*/

Route::prefix('candidate-tests')->name('candidate-tests.')->group(function () {
    
    // Get available tests for candidate
    Route::get('/', [CandidateTestController::class, 'getAvailableTests'])->name('index');
    
    // Get available job positions
    Route::get('/available-jobs', [CandidateTestController::class, 'getAvailableJobs'])->name('available-jobs');
    
    // Apply for a job position
    Route::post('/apply-job', [CandidateTestController::class, 'applyForJob'])->name('apply-job');
    
    // Start a test assignment
    Route::post('/start/{assignmentId}', [CandidateTestController::class, 'startTest'])->name('start');
    
    // Submit test answers
    Route::post('/submit/{assignmentId}', [CandidateTestController::class, 'submitTest'])->name('submit');
    
    // Get test results for candidate
    Route::get('/results', [CandidateTestController::class, 'getTestResults'])->name('results');
    
    // Get detailed test result
    Route::get('/results/{resultId}', [CandidateTestController::class, 'getTestResult'])->name('result-detail');
    
});

/*
|--------------------------------------------------------------------------
| Public Test Routes (for unauthenticated candidates)
|--------------------------------------------------------------------------
*/

Route::prefix('public/candidate-tests')->name('public.candidate-tests.')->group(function () {
    
    // Public test routes for candidates with token access
    Route::middleware(['throttle:60,1'])->group(function () {
        
        // Get available tests with token
        Route::get('/token/{token}', [CandidateTestController::class, 'getAvailableTests'])->name('token.index');
        
        // Start test with token
        Route::post('/token/{token}/start/{assignmentId}', [CandidateTestController::class, 'startTest'])->name('token.start');
        
        // Submit test with token
        Route::post('/token/{token}/submit/{assignmentId}', [CandidateTestController::class, 'submitTest'])->name('token.submit');
        
    });
    
});
