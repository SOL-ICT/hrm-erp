<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CurrentVacanciesController;

/*
|--------------------------------------------------------------------------
| Current Vacancies Management Routes
|--------------------------------------------------------------------------
| 
| This file contains all routes for the Current Vacancies module.
| Part of the Recruitment Management system.
|
*/

// Main endpoints for current vacancies (temporarily without auth for debugging)
Route::get('current-vacancies', [CurrentVacanciesController::class, 'getCurrentVacancies'])
    ->name('current-vacancies.index')->withoutMiddleware(['auth:sanctum']);

Route::middleware(['auth:sanctum'])->group(function () {
    // Interview invitation endpoints
    Route::post('current-vacancies/interview-invitations', [CurrentVacanciesController::class, 'sendInterviewInvitations'])
        ->name('current-vacancies.send-invitations');

    Route::get('current-vacancies/interview-invitations', [CurrentVacanciesController::class, 'getInterviewInvitations'])
        ->name('current-vacancies.get-invitations');

    // Test invitation endpoints
    Route::post('current-vacancies/test-invitations', [CurrentVacanciesController::class, 'sendTestInvitations'])
        ->name('current-vacancies.send-test-invitations');

    Route::get('current-vacancies/test-invitations', [CurrentVacanciesController::class, 'getTestInvitations'])
        ->name('current-vacancies.get-test-invitations');

    // Available tests for reuse
    Route::get('current-vacancies/available-tests', [CurrentVacanciesController::class, 'getAvailableTests'])
        ->name('current-vacancies.available-tests');
});

// Future endpoints for managing invitations
Route::prefix('current-vacancies')->name('current-vacancies.')->group(function () {

    // Individual invitation management
    Route::put('interview-invitations/{id}', [CurrentVacanciesController::class, 'updateInvitation'])
        ->name('update-invitation');

    Route::delete('interview-invitations/{id}', [CurrentVacanciesController::class, 'cancelInvitation'])
        ->name('cancel-invitation');

    // Bulk operations
    Route::post('bulk/send-invitations', [CurrentVacanciesController::class, 'bulkSendInvitations'])
        ->name('bulk-send-invitations');

    Route::post('bulk/cancel-invitations', [CurrentVacanciesController::class, 'bulkCancelInvitations'])
        ->name('bulk-cancel-invitations');
});
