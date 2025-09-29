<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Candidate\CandidateTestController;

/*
|--------------------------------------------------------------------------
| Candidate Test Routes
|--------------------------------------------------------------------------
| Routes for candidates to take tests and manage job applications
*/

// Test taking routes for candidates (these routes are also available in candidate-staff-management module)
Route::prefix('candidate/tests')->name('candidate.tests.')->group(function () {
    Route::get('/available', [CandidateTestController::class, 'getAvailableTests'])->name('available');
    Route::post('/{assignmentId}/start', [CandidateTestController::class, 'startTest'])->name('start');
    Route::post('/{assignmentId}/submit', [CandidateTestController::class, 'submitTest'])->name('submit');
    Route::get('/results', [CandidateTestController::class, 'getTestResults'])->name('results');
    Route::get('/results/{resultId}', [CandidateTestController::class, 'getTestResult'])->name('result');
});

// Job application routes for candidates
Route::prefix('candidate/jobs')->name('candidate.jobs.')->group(function () {
    Route::get('/available', [CandidateTestController::class, 'getAvailableJobs'])->name('available');
    Route::post('/apply', [CandidateTestController::class, 'applyForJob'])->name('apply');
});
