<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\PasswordResetController;

/*
|--------------------------------------------------------------------------
| Password Reset Routes
|--------------------------------------------------------------------------
| Routes for handling password reset functionality
|
*/

Route::prefix('password')->group(function () {
    // Send password reset link email
    Route::post('/forgot', [PasswordResetController::class, 'sendResetLinkEmail'])
        ->name('password.email');
    
    // Verify reset token
    Route::post('/verify-token', [PasswordResetController::class, 'verifyToken'])
        ->name('password.verify');
    
    // Reset password
    Route::post('/reset', [PasswordResetController::class, 'reset'])
        ->name('password.update');
});
