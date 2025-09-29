<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Candidate\CandidateJobApplicationController;

/*
|--------------------------------------------------------------------------
| Public Job Application Routes
|--------------------------------------------------------------------------
|
| Public routes for job application submission that don't require authentication
|
*/

// Public route for job application submission (can be used by unauthenticated candidates)
Route::post('/apply-for-position', [CandidateJobApplicationController::class, 'submitApplication'])
    ->name('apply-for-position');
