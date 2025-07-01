<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdminController; // ✅ ADD THIS

/*
|--------------------------------------------------------------------------
| API Routes - Custom Middleware Stack Without CSRF
|--------------------------------------------------------------------------
*/

// Health check (public)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'environment' => app()->environment()
    ]);
});

// Public endpoints
Route::get('/states-lgas', [CandidateController::class, 'getStatesLgas']);

// Auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ✅ SOLUTION: Custom middleware stack that excludes CSRF but includes session
Route::middleware([
    'web',
    'auth:sanctum',
    // Explicitly exclude CSRF by not including it
])->group(function () {

    // Auth routes
    Route::put('/user/preferences', [AuthController::class, 'updatePreferences']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard routes
    Route::get('/dashboard/candidate', [DashboardController::class, 'candidateDashboard']);

    // Candidate routes
    Route::prefix('candidates')->group(function () {
        // Profile routes
        Route::get('/{id}/profile', [CandidateController::class, 'getProfile'])->where('id', '[0-9]+');
        Route::put('/{id}/profile', [CandidateController::class, 'updateProfile'])->where('id', '[0-9]+');

        // Education routes
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
    });

    // ✅ NEW: Admin routes
    Route::prefix('admin')->group(function () {
        // Dashboard & Statistics
        Route::get('/stats', [AdminController::class, 'getStats']);

        // Client Management
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
});

// ✅ FIXED: Additional routes that need web middleware for session handling
Route::middleware(['web', 'auth:sanctum'])->group(function () {
    // Only routes that specifically need session/CSRF should be here
    // Most API operations should use the auth:sanctum only group above
});
