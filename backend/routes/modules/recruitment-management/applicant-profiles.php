<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ApplicantProfileController;

/*
|--------------------------------------------------------------------------
| Applicant Profile Management Routes
|--------------------------------------------------------------------------
| 
| This file contains all routes for the Applicant Profile Management submodule.
| It follows the SOL Nigeria HRM modular routing structure.
|
*/

// Main CRUD operations
Route::apiResource('applicant-profiles', ApplicantProfileController::class)->only(['index', 'show']);

// Statistics endpoint
Route::get('applicant-profiles-statistics', [ApplicantProfileController::class, 'getStatistics'])
    ->name('applicant-profiles.statistics');
