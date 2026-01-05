<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\ChangePasswordController;

/*
|--------------------------------------------------------------------------
| Password Reset Routes
|--------------------------------------------------------------------------
| Routes for handling password reset functionality
|
*/

Route::prefix('password')->group(function () {
    // Send password reset link email (Forgot Password)
    Route::post('/forgot', [PasswordResetController::class, 'sendResetLinkEmail'])
        ->name('password.email');
    
    // Verify reset token
    Route::post('/verify-token', [PasswordResetController::class, 'verifyToken'])
        ->name('password.verify');
    
    // Reset password (using token from email)
    Route::post('/reset', [PasswordResetController::class, 'reset'])
        ->name('password.update');
    
    // Change password (using Staff ID + current password)
    Route::post('/change', [ChangePasswordController::class, 'changePassword'])
        ->name('password.change');
});
