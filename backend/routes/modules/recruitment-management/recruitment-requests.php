<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RecruitmentRequestController;

/*
|--------------------------------------------------------------------------
| Recruitment Request Management Routes
|--------------------------------------------------------------------------
| 
| This file contains all routes for the Recruitment Request Management module.
| It follows the SOL Nigeria HRM modular routing structure.
|
*/

// IMPORTANT: Define specific routes BEFORE apiResource to avoid route conflicts

// Dashboard and statistics endpoints
Route::get('recruitment-requests-dashboard', [RecruitmentRequestController::class, 'dashboard'])
    ->name('recruitment-requests.dashboard');

Route::get('recruitment-requests/statistics/summary', [RecruitmentRequestController::class, 'getStatistics'])
    ->name('recruitment-requests.statistics');

Route::get('recruitment-requests/tickets/next-id', [RecruitmentRequestController::class, 'getNextTicketId'])
    ->name('recruitment-requests.next-ticket');

// Delegation endpoints (must be before apiResource)
Route::get('recruitment-requests/assignable-users', [RecruitmentRequestController::class, 'getAssignableUsers'])
    ->name('recruitment-requests.assignable-users');

Route::post('recruitment-requests/{id}/assign', [RecruitmentRequestController::class, 'assignTicket'])
    ->name('recruitment-requests.assign');

// Status management endpoints (must be before apiResource)
Route::post('recruitment-requests/{id}/close', [RecruitmentRequestController::class, 'close'])
    ->name('recruitment-requests.close');

Route::post('recruitment-requests/{id}/reopen', [RecruitmentRequestController::class, 'reopen'])
    ->name('recruitment-requests.reopen');

Route::post('recruitment-requests/{id}/approve', [RecruitmentRequestController::class, 'approve'])
    ->name('recruitment-requests.approve');

// Main CRUD operations (must be AFTER specific routes)
Route::apiResource('recruitment-requests', RecruitmentRequestController::class);

// Helper endpoints for form data population
Route::get('recruitment-requests/job-structures/client/{clientId}', [RecruitmentRequestController::class, 'getJobStructuresByClient'])
    ->name('recruitment-requests.job-structures-by-client');

Route::get('recruitment-requests/service-locations/client/{clientId}', [RecruitmentRequestController::class, 'getServiceLocationsByClient'])
    ->name('recruitment-requests.service-locations-by-client');

// Additional utility endpoints (for future expansion)
Route::prefix('recruitment-requests')->name('recruitment-requests.')->group(function () {

    // Bulk operations (for future implementation)
    Route::post('bulk/close', [RecruitmentRequestController::class, 'bulkClose'])
        ->name('bulk.close');

    Route::post('bulk/approve', [RecruitmentRequestController::class, 'bulkApprove'])
        ->name('bulk.approve');

    // Export functionality (for future implementation)
    Route::get('export/{format}', [RecruitmentRequestController::class, 'export'])
        ->name('export')
        ->where('format', 'csv|xlsx|pdf');

    // Search and filtering (for advanced dashboard)
    Route::get('search', [RecruitmentRequestController::class, 'search'])
        ->name('search');

    // Analytics endpoints (for future dashboard enhancements)
    Route::get('analytics/trends', [RecruitmentRequestController::class, 'getTrends'])
        ->name('analytics.trends');

    Route::get('analytics/performance', [RecruitmentRequestController::class, 'getPerformanceMetrics'])
        ->name('analytics.performance');
});

/*
|--------------------------------------------------------------------------
| Route Debugging & Documentation
|--------------------------------------------------------------------------
*/

// Development route for testing (remove in production)
if (app()->environment('local')) {
    Route::get('recruitment-requests/debug/routes', function () {
        return response()->json([
            'module' => 'Recruitment Request Management',
            'routes_loaded' => 'success',
            'timestamp' => now(),
            'available_routes' => [
                'GET /recruitment-requests' => 'List all recruitment requests',
                'POST /recruitment-requests' => 'Create new recruitment request',
                'GET /recruitment-requests/{id}' => 'Show specific recruitment request',
                'PUT /recruitment-requests/{id}' => 'Update recruitment request',
                'DELETE /recruitment-requests/{id}' => 'Delete recruitment request',
                'GET /recruitment-requests-dashboard' => 'Dashboard with statistics',
                'GET /recruitment-requests/tickets/next-id' => 'Get next ticket ID',
                'POST /recruitment-requests/{id}/close' => 'Close recruitment request',
                'POST /recruitment-requests/{id}/reopen' => 'Reopen recruitment request',
                'POST /recruitment-requests/{id}/approve' => 'Approve recruitment request',
                'GET /recruitment-requests/job-structures/client/{clientId}' => 'Get job structures by client',
                'GET /recruitment-requests/service-locations/client/{clientId}' => 'Get service locations by client'
            ]
        ]);
    })->name('recruitment-requests.debug.routes');
}
