<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Candidate\CandidateEducationController;


Route::middleware('auth:sanctum')
    ->prefix('candidates/{candidate_id}')
    ->where(['candidate_id' => '[0-9]+'])
    ->group(function () {

        // Primary Education Routes
        Route::get('primary-education', [CandidateEducationController::class, 'indexPrimary'])
            ->name('candidates.primary-education.index');
        Route::post('primary-education', [CandidateEducationController::class, 'storePrimary'])
            ->name('candidates.primary-education.store');
        Route::put('primary-education', [CandidateEducationController::class, 'updatePrimary'])
            ->name('candidates.primary-education.update');
        Route::delete('primary-education', [CandidateEducationController::class, 'deletePrimary'])
            ->name('candidates.primary-education.delete');

        // Secondary Education Routes
        Route::get('secondary-education', [CandidateEducationController::class, 'indexSecondary'])
            ->name('candidates.secondary-education.index');
        Route::post('secondary-education', [CandidateEducationController::class, 'storeSecondary'])
            ->name('candidates.secondary-education.store');
        Route::put('secondary-education/{id}', [CandidateEducationController::class, 'updateSecondary'])
            ->where('id', '[0-9]+')
            ->name('candidates.secondary-education.update');
        Route::delete('secondary-education/{id}', [CandidateEducationController::class, 'deleteSecondary'])
            ->where('id', '[0-9]+')
            ->name('candidates.secondary-education.delete');

        // Tertiary Education Routes
        Route::get('tertiary-education', [CandidateEducationController::class, 'indexTertiary'])
            ->name('candidates.tertiary-education.index');
        Route::post('tertiary-education', [CandidateEducationController::class, 'storeTertiary'])
            ->name('candidates.tertiary-education.store');
        Route::put('tertiary-education/{id}', [CandidateEducationController::class, 'updateTertiary'])
            ->where('id', '[0-9]+')
            ->name('candidates.tertiary-education.update');
        Route::delete('tertiary-education/{id}', [CandidateEducationController::class, 'deleteTertiary'])
            ->where('id', '[0-9]+')
            ->name('candidates.tertiary-education.delete');
    });
