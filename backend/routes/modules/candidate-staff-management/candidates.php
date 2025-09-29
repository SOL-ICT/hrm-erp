<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Candidate\CandidateController;


Route::prefix('candidates')->group(function () {

    // Profile routes
    Route::get('/{id}/profile', [CandidateController::class, 'getProfile'])->where('id', '[0-9]+');
    Route::put('/{id}/profile', [CandidateController::class, 'updateProfile'])->where('id', '[0-9]+');

    // Education routes (general)
    Route::get('/{id}/education', [CandidateController::class, 'getEducation'])->where('id', '[0-9]+');
    Route::post('/{id}/education', [CandidateController::class, 'storeEducation'])->where('id', '[0-9]+');
    Route::put('/education/{id}', [CandidateController::class, 'updateEducation'])->where('id', '[0-9]+');
    Route::delete('/education/{id}', [CandidateController::class, 'deleteEducation'])->where('id', '[0-9]+');

    // Experience routes
    Route::get('/{id}/experience', [CandidateController::class, 'getExperience'])->where('id', '[0-9]+');
    Route::post('/{id}/experience', [CandidateController::class, 'storeExperience'])->where('id', '[0-9]+');
    Route::put('/experience/{id}', [CandidateController::class, 'updateExperience'])->where('id', '[0-9]+');
    Route::delete('/experience/{id}', [CandidateController::class, 'deleteExperience'])->where('id', '[0-9]+');

    // Emergency contacts routes
    Route::get('/{id}/emergency-contacts', [CandidateController::class, 'getEmergencyContacts'])->where('id', '[0-9]+');
    Route::post('/{id}/emergency-contacts', [CandidateController::class, 'storeEmergencyContact'])->where('id', '[0-9]+');
    Route::put('/emergency-contacts/{id}', [CandidateController::class, 'updateEmergencyContact'])->where('id', '[0-9]+');
    Route::delete('/emergency-contacts/{id}', [CandidateController::class, 'deleteEmergencyContact'])->where('id', '[0-9]+');

    // Dashboard stats
    Route::get('/{id}/dashboard-stats', [CandidateController::class, 'getDashboardStats'])->where('id', '[0-9]+');

    // Status tracking routes
    Route::get('/{id}/status-history', [App\Http\Controllers\CandidateStatusController::class, 'getCandidateStatusHistory'])->where('id', '[0-9]+');
});

// Candidate status summary route (for admin)
Route::get('/candidates/status-summary', [App\Http\Controllers\CandidateStatusController::class, 'getCandidatesStatusSummary']);
