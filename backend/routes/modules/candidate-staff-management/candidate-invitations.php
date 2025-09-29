<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Candidate\CandidateInvitationController;

/*
|--------------------------------------------------------------------------
| Candidate Invitation Routes
|--------------------------------------------------------------------------
|
| Routes for candidate invitation management functionality
| These routes handle test and interview invitations and responses
|
*/

Route::prefix('candidate-invitations')->name('candidate-invitations.')->group(function () {
    
    // Get all invitations for candidate
    Route::get('/', [CandidateInvitationController::class, 'getInvitations'])->name('index');
    
    // Get pending invitations
    Route::get('/pending', [CandidateInvitationController::class, 'getPendingInvitations'])->name('pending');
    
    // Respond to an invitation
    Route::post('/{invitationId}/respond', [CandidateInvitationController::class, 'respondToInvitation'])->name('respond');
    
    // Get invitation statistics
    Route::get('/stats', [CandidateInvitationController::class, 'getInvitationStats'])->name('stats');
    
});

/*
|--------------------------------------------------------------------------
| Public Invitation Routes (for unauthenticated candidates)
|--------------------------------------------------------------------------
*/

Route::prefix('public/candidate-invitations')->name('public.candidate-invitations.')->group(function () {
    
    // Public invitation routes for candidates with token access
    Route::middleware(['throttle:60,1'])->group(function () {
        
        // Get invitations with token
        Route::get('/token/{token}', [CandidateInvitationController::class, 'getInvitations'])->name('token.index');
        
        // Respond to invitation with token
        Route::post('/token/{token}/{invitationId}/respond', [CandidateInvitationController::class, 'respondToInvitation'])->name('token.respond');
        
    });
    
});
