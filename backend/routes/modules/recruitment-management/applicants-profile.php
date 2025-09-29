<?php
use App\Http\Controllers\Candidate\CandidateController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'applicants-profile'], function () {
    // Get all candidates with filtering and search
    Route::get('/', [CandidateController::class, 'getAllCandidatesProfile']);
    
    // Get detailed candidate information for modal
    Route::get('/{id}/details', [CandidateController::class, 'getCandidateDetails']);
    
    // Assign candidate to recruitment request (push to ticket)
    Route::post('/assign-to-ticket', [CandidateController::class, 'assignCandidateToTicket']);
});
