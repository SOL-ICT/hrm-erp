<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Candidate\CandidateInterviewController;

/*
|--------------------------------------------------------------------------
| Candidate Interview Routes
|--------------------------------------------------------------------------
|
| Routes for candidate interview management functionality
| These routes handle interview schedules, confirmations, and responses
|
*/

Route::prefix('candidate-interviews')->name('candidate-interviews.')->group(function () {
    
    // Get all interviews for candidate
    Route::get('/', [CandidateInterviewController::class, 'getCandidateInterviews'])->name('index');
    
    // Get upcoming interviews
    Route::get('/upcoming', [CandidateInterviewController::class, 'getUpcomingInterviews'])->name('upcoming');
    
    // Get specific interview details
    Route::get('/{interviewId}', [CandidateInterviewController::class, 'getInterviewDetails'])->name('details');
    
    // Confirm attendance for interview
    Route::post('/{interviewId}/confirm-attendance', [CandidateInterviewController::class, 'confirmAttendance'])->name('confirm-attendance');
    
    // Request interview reschedule
    Route::post('/{interviewId}/request-reschedule', [CandidateInterviewController::class, 'requestReschedule'])->name('request-reschedule');
    
    // Respond to interview invitation (accept/decline)
    Route::post('/{interviewId}/respond', [CandidateInterviewController::class, 'respondToInterview'])->name('respond');
    
    // Get candidate's job applications
    Route::get('/applications/all', [CandidateInterviewController::class, 'getJobApplications'])->name('applications');
    
});

/*
|--------------------------------------------------------------------------
| Public Interview Routes (for unauthenticated candidates)
|--------------------------------------------------------------------------
*/

Route::prefix('public/candidate-interviews')->name('public.candidate-interviews.')->group(function () {
    
    // Public interview routes for candidates with token access
    Route::middleware(['throttle:60,1'])->group(function () {
        
        // Get interviews with token
        Route::get('/token/{token}', [CandidateInterviewController::class, 'getCandidateInterviews'])->name('token.index');
        
        // Confirm attendance with token
        Route::post('/token/{token}/{interviewId}/confirm', [CandidateInterviewController::class, 'confirmAttendance'])->name('token.confirm');
        
    });
    
});
