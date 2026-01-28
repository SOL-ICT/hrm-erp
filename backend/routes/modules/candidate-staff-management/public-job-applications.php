<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Candidate\CandidateJobApplicationController;
use App\Http\Controllers\CurrentVacanciesController;

/*
|--------------------------------------------------------------------------
| Public Job Application Routes
|--------------------------------------------------------------------------
|
| Public routes for job application submission and job listings that don't 
| require authentication
|
*/

// Public job board endpoints (no authentication required)
Route::get('/public/jobs', [CurrentVacanciesController::class, 'publicIndex'])
    ->name('public.jobs.index');
    
Route::get('/public/jobs/{ticketId}', [CurrentVacanciesController::class, 'publicShow'])
    ->name('public.jobs.show');

// Public route for job application submission (can be used by unauthenticated candidates)
Route::post('/apply-for-position', [CandidateJobApplicationController::class, 'submitApplication'])
    ->name('apply-for-position');

