<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InterviewManagementController;
use App\Http\Controllers\Candidate\CandidateInterviewController;

/*
|--------------------------------------------------------------------------
| Interview Management Routes
|--------------------------------------------------------------------------
| Routes for managing interviews and candidate meetings
*/

// Admin interview management routes
Route::prefix('interview-management')->name('interview-management.')->group(function () {
    Route::get('/', [InterviewManagementController::class, 'index'])->name('index');
    Route::post('/', [InterviewManagementController::class, 'store'])->name('store');
    Route::get('/upcoming', [InterviewManagementController::class, 'getUpcomingInterviews'])->name('upcoming');
    Route::get('/{id}', [InterviewManagementController::class, 'show'])->name('show');
    Route::put('/{id}', [InterviewManagementController::class, 'update'])->name('update');
    Route::post('/{id}/complete', [InterviewManagementController::class, 'completeInterview'])->name('complete');
    Route::post('/{id}/reschedule', [InterviewManagementController::class, 'rescheduleInterview'])->name('reschedule');
    Route::post('/{id}/cancel', [InterviewManagementController::class, 'cancelInterview'])->name('cancel');
});

// Candidate interview routes (also available in candidate-staff-management module)
Route::prefix('candidate/interviews')->name('candidate.interviews.')->group(function () {
    Route::get('/', [CandidateInterviewController::class, 'getCandidateInterviews'])->name('index');
    Route::get('/upcoming', [CandidateInterviewController::class, 'getUpcomingInterviews'])->name('upcoming');
    Route::get('/{interviewId}', [CandidateInterviewController::class, 'getInterviewDetails'])->name('details');
});
