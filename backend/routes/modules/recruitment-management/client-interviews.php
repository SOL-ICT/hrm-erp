<?php

use App\Http\Controllers\ClientInterviewController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'client-interviews'], function () {
    // Get active tickets with candidates for interview invitation
    Route::get('/active-tickets-with-candidates', [ClientInterviewController::class, 'getActiveTicketsWithCandidates']);
    
    // Get clients dropdown
    Route::get('/clients/dropdown', [ClientInterviewController::class, 'getClientsDropdown']);
    
    // CRUD operations
    Route::get('/', [ClientInterviewController::class, 'index']);
    Route::post('/', [ClientInterviewController::class, 'store']);
    Route::get('/{id}', [ClientInterviewController::class, 'show']);
    Route::put('/{id}', [ClientInterviewController::class, 'update']);
    Route::delete('/{id}', [ClientInterviewController::class, 'destroy']);
});