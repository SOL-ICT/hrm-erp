<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;

Route::prefix('admin')->group(function () {

    // Dashboard & Statistics
    Route::get('/stats', [AdminController::class, 'getStats']);

    // Client Management (Legacy - keeping for backward compatibility)
    Route::get('/clients', [AdminController::class, 'getClients']);
    Route::post('/clients', [AdminController::class, 'createClient']);
    Route::get('/clients/{id}/dashboard', [AdminController::class, 'getClientDashboard'])->where('id', '[0-9]+');

    // Job Management
    Route::get('/jobs', [AdminController::class, 'getJobs']);
    Route::post('/jobs', [AdminController::class, 'createJob']);
    Route::get('/job-categories', [AdminController::class, 'getJobCategories']);

    // Application Management
    Route::get('/applications', [AdminController::class, 'getApplications']);
    Route::put('/applications/{id}/status', [AdminController::class, 'updateApplicationStatus'])->where('id', '[0-9]+');
    Route::post('/applications/{id}/interview', [AdminController::class, 'scheduleInterview'])->where('id', '[0-9]+');

    // Staff Management
    Route::get('/staff', [AdminController::class, 'getStaff']);
});
