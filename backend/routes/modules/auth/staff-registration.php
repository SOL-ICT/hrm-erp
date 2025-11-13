<?php

use App\Http\Controllers\Api\Auth\StaffRegistrationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Staff Registration Routes
|--------------------------------------------------------------------------
|
| Routes for staff self-registration portal where existing staff members
| can create their user accounts using their staff records.
|
*/

Route::prefix('staff-registration')->group(function () {
    Route::get('/clients', [StaffRegistrationController::class, 'getClients']);
    Route::post('/search', [StaffRegistrationController::class, 'searchStaff']);
    Route::post('/create-account', [StaffRegistrationController::class, 'createUserAccount']);
});
