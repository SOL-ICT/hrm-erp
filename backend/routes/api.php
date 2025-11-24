<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Candidate\CandidateController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UtilityController;
use App\Http\Controllers\OfferLetterTemplateController;
use App\Http\Controllers\PerformanceController;

/*
|--------------------------------------------------------------------------
| API Routes - Modular Entry Point
|--------------------------------------------------------------------------
| This file includes all module route files
| Each module is in its own file for better organization
*/

// Health check (public)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'environment' => app()->environment(),
        'database' => 'connected'
    ]);
});

// Public endpoints
Route::get('/states-lgas', [CandidateController::class, 'getStatesLgas']);
Route::get('/utilities/states-lgas', [CandidateController::class, 'getStatesLgas']);
Route::get('/utilities/industry-categories', [UtilityController::class, 'getIndustryCategories']);
Route::get('/utilities/client-categories', [UtilityController::class, 'getClientCategories']);

// Performance testing endpoints (development)
Route::get('/performance/diagnostics', [PerformanceController::class, 'diagnostics']);
Route::post('/performance/test-endpoint', [PerformanceController::class, 'testEndpoint']);

// Auth routes (public)
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);

// Staff self-registration (public)
require __DIR__ . '/modules/auth/staff-registration.php';

// Protected routes group

// TEMPORARY: Check service_locations table structure
Route::get('/test-table-structure/{table}', function ($table) {
    try {
        $columns = DB::select("DESCRIBE `{$table}`");
        return response()->json([
            'success' => true,
            'table' => $table,
            'columns' => $columns,
            'message' => 'Table structure retrieved successfully'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error retrieving table structure: ' . $e->getMessage(),
            'error' => $e->getMessage()
        ], 500);
    }
});

// TEMPORARY: Test service locations endpoint (REMOVE IN PRODUCTION)
Route::get('/test-service-locations/{clientId}', function ($clientId) {
    try {
        $serviceLocations = DB::table('service_locations')
            ->leftJoin('sol_offices', 'service_locations.sol_office_id', '=', 'sol_offices.id')
            ->where('service_locations.client_id', $clientId)
            ->where('service_locations.is_active', 1)
            ->select([
                'service_locations.id',
                'service_locations.location_name',
                'service_locations.city',
                'service_locations.lga',
                'service_locations.sol_zone',
                'service_locations.sol_office_id',
                'service_locations.full_address',
                'sol_offices.office_name',
                'sol_offices.office_code'
            ])
            ->orderBy('service_locations.location_name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $serviceLocations,
            'message' => 'Service locations retrieved successfully (TEST ENDPOINT)'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error retrieving service locations: ' . $e->getMessage(),
            'error' => $e->getMessage()
        ], 500);
    }
});

// TEMPORARY: Test database connection and table existence
Route::get('/test-db-structure', function () {
    try {
        $tables = DB::select('SHOW TABLES');
        $dbInfo = [
            'database_connected' => true,
            'tables' => collect($tables)->map(function ($table) {
                $tableName = array_values((array)$table)[0];
                return $tableName;
            }),
            'client_count' => DB::table('clients')->count(),
        ];

        // Check specific tables for recruitment requests
        $requiredTables = ['clients', 'service_requests', 'job_structures', 'service_locations', 'recruitment_requests'];
        foreach ($requiredTables as $table) {
            try {
                $count = DB::table($table)->count();
                $dbInfo['table_counts'][$table] = $count;
            } catch (\Exception $e) {
                $dbInfo['table_errors'][$table] = $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Database structure check completed',
            'data' => $dbInfo
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Database connection failed',
            'error' => $e->getMessage()
        ], 500);
    }
});

// TEMPORARY: Public client contracts for testing (REMOVE IN PRODUCTION)
Route::get('/test-client-contracts', function () {
    try {
        $contracts = DB::table('view_client_contracts_with_details')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $contracts,
            'message' => 'Client contracts retrieved successfully (TEST ENDPOINT)'
        ]);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ], 500);
    }
});

// TEMPORARY: Test database connection and table existence
Route::get('/test-db-structure', function () {
    try {
        $tables = DB::select('SHOW TABLES');
        $dbInfo = [
            'database_connected' => true,
            'tables' => collect($tables)->map(function ($table) {
                $tableName = array_values((array)$table)[0];
                return $tableName;
            }),
            'client_count' => DB::table('clients')->count(),
        ];

        // Check specific tables for recruitment requests
        $requiredTables = ['clients', 'service_requests', 'job_structures', 'service_locations', 'recruitment_requests'];
        foreach ($requiredTables as $table) {
            try {
                $count = DB::table($table)->count();
                $dbInfo['table_counts'][$table] = $count;
            } catch (\Exception $e) {
                $dbInfo['table_errors'][$table] = $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Database structure check completed',
            'data' => $dbInfo
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Database connection failed',
            'error' => $e->getMessage()
        ], 500);
    }
});

// TEMPORARY: Public client contracts for testing (REMOVE IN PRODUCTION)
Route::get('/test-client-contracts', function () {
    try {
        $contracts = DB::table('view_client_contracts_with_details')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $contracts,
            'message' => 'Client contracts retrieved successfully (TEST ENDPOINT)'
        ]);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ], 500);
    }
});

// TEMPORARY: Simple client test endpoint (REMOVE IN PRODUCTION)
Route::get('/test-simple', function () {
    return response()->json([
        'success' => true,
        'message' => 'Simple test endpoint working',
        'data' => ['test' => 'value']
    ]);
});

// TEMPORARY: Simple database query test (REMOVE IN PRODUCTION)
Route::get('/test-db-clients', function () {
    try {
        $clients = DB::select('SELECT * FROM clients ORDER BY created_at DESC');

        return response()->json([
            'success' => true,
            'count' => count($clients),
            'data' => $clients,
            'message' => 'Direct database query for all clients'
        ]);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ], 500);
    }
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes - Load All Modules
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {

    // Core routes
    Route::put('/user/preferences', [AuthController::class, 'updatePreferences']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard/candidate', [DashboardController::class, 'candidateDashboard']);

    // Cache management routes (Admin only)
    Route::prefix('cache')->group(function () {
        Route::post('/clear', [App\Http\Controllers\DashboardCacheController::class, 'clearAllCaches']);
        Route::post('/warmup', [App\Http\Controllers\DashboardCacheController::class, 'warmupCaches']);
        Route::get('/dashboard-stats', [App\Http\Controllers\DashboardCacheController::class, 'getDashboardStats']);
    });

    /*
    |--------------------------------------------------------------------------
    | Include All Module Route Files
    |--------------------------------------------------------------------------
    */

    // Client Contract Management Module
    require __DIR__ . '/modules/client-contract-management/client-master.php';
    require __DIR__ . '/modules/client-contract-management/service-locations.php';
    require __DIR__ . '/modules/client-contract-management/client-contracts.php';
    require __DIR__ . '/modules/client-contract-management/salary-structure.php';


    // Recruitment Management Module
    require __DIR__ . '/modules/recruitment-management/recruitment-requests.php';
    require __DIR__ . '/modules/recruitment-management/applicant-profiles.php';
    require __DIR__ . '/modules/recruitment-management/current-vacancies.php';
    require __DIR__ . '/modules/recruitment-management/test-management.php';
    require __DIR__ . '/modules/recruitment-management/candidate-tests.php';
    require __DIR__ . '/modules/recruitment-management/interview-management.php';
    require __DIR__ . '/modules/recruitment-management/client-interviews.php';
    require __DIR__ . '/modules/recruitment-management/client-interview-feedback.php';
    require __DIR__ . '/modules/recruitment-management/applicants-profile.php';
    require __DIR__ . '/modules/recruitment-management/boarding.php';
    require __DIR__ . '/modules/recruitment-management/manual-boarding.php';

    // Administration Module
    require __DIR__ . '/modules/administration/sol-master.php';
    require __DIR__ . '/modules/administration/stats.php';
    require __DIR__ . '/modules/administration/system-preferences.php';
    require __DIR__ . '/modules/administration/audit-logs.php';
    require __DIR__ . '/modules/administration/utilities.php';
    require __DIR__ . '/modules/administration/rbac.php';

    // Candidate Staff Management Module
    require __DIR__ . '/modules/candidate-staff-management/candidates.php';
    require __DIR__ . '/modules/candidate-staff-management/candidate-education.php';
    require __DIR__ . '/modules/candidate-staff-management/admin-management.php';
    require __DIR__ . '/modules/candidate-staff-management/candidate-tests.php';
    require __DIR__ . '/modules/candidate-staff-management/candidate-interviews.php';
    require __DIR__ . '/modules/candidate-staff-management/candidate-invitations.php';
    require __DIR__ . '/modules/candidate-staff-management/job-applications.php';

    // HR & Payroll Management Module
    require __DIR__ . '/modules/hr-payroll-management/employee-record.php';
    require __DIR__ . '/modules/hr-payroll-management/calculation-templates.php';
    require __DIR__ . '/modules/hr-payroll-management/payroll-processing.php';

    // Employee Management Module (HR Extension)
    require __DIR__ . '/modules/employee-management/employee-actions.php';

    // Invoicing Module - HR & Payroll Management Extension
    require __DIR__ . '/modules/invoicing/invoicing-routes.php';

    // New Template System (v2) - Separated Architecture
    require __DIR__ . '/modules/invoicing/new-template-system.php';

    // Attendance Export Module - HR & Payroll Management Extension
    require __DIR__ . '/modules/attendance/attendance-export-routes.php';
});

/*
|--------------------------------------------------------------------------
| Legacy & Webhook Routes
|--------------------------------------------------------------------------
*/

// Legacy API Support
Route::prefix('v1')->middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/clients', [\App\Http\Controllers\ClientController::class, 'index'])->name('v1.clients.index');
    Route::get('/clients/{id}', [\App\Http\Controllers\ClientController::class, 'show'])->name('v1.clients.show');
});

// Webhooks
Route::prefix('webhooks')->group(function () {
    Route::post('/client-updated/{clientId}', function ($clientId) {
        try {
            $client = DB::table('clients')->where('id', $clientId)->first();

            if (!$client) {
                return response()->json(['error' => 'Client not found'], 404);
            }

            Log::info('Client webhook triggered', [
                'client_id' => $clientId,
                'client_name' => $client->name,
                'timestamp' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Webhook processed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Webhook error: ' . $e->getMessage());
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    })->name('webhooks.client-updated');
});

// API Documentation
Route::get('/client-management/docs', function () {
    return response()->json([
        'title' => 'SOL Nigeria HRM - Client Management API',
        'version' => '2.0',
        'description' => 'Comprehensive API for managing clients, locations, and services',
        'base_url' => env('APP_URL') . '/api'
    ]);
})->name('docs.client-management');

/*
|--------------------------------------------------------------------------
| Offer Letter Template Routes
|--------------------------------------------------------------------------
*/

// Protected offer letter template routes
Route::middleware(['auth:sanctum'])->prefix('offer-letter-templates')->group(function () {
    // Get template for specific grade
    Route::get('/grade', [OfferLetterTemplateController::class, 'getForGrade']);

    // CRUD operations
    Route::post('/', [OfferLetterTemplateController::class, 'store']);
    Route::put('/{template}', [OfferLetterTemplateController::class, 'update']);
    Route::delete('/{template}', [OfferLetterTemplateController::class, 'destroy']);

    // Utilities
    Route::get('/salary-components', [OfferLetterTemplateController::class, 'getSalaryComponents']);
    Route::post('/preview', [OfferLetterTemplateController::class, 'generatePreview']);
});

/*
|--------------------------------------------------------------------------
| Phase 4.1: Service Integration Monitoring Routes
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\ServiceIntegrationController;

// Service health monitoring (protected)
Route::middleware(['auth:sanctum'])->prefix('services')->group(function () {
    // Comprehensive health check
    Route::get('/health', [ServiceIntegrationController::class, 'healthCheck']);

    // Performance metrics
    Route::get('/performance', [ServiceIntegrationController::class, 'performanceMetrics']);

    // Integration status summary
    Route::get('/integration-status', [ServiceIntegrationController::class, 'integrationStatus']);

    // Test specific service integration
    Route::post('/test-integration', [ServiceIntegrationController::class, 'testServiceIntegration']);
});


// Public health check (simplified)
Route::get('/health/services', function () {
    try {
        $monitor = app(\App\Services\ServiceIntegrationMonitor::class);
        $health = $monitor->performHealthCheck();

        return response()->json([
            'status' => $health['overall_status'],
            'timestamp' => $health['timestamp'],
            'services_count' => count($health['services']),
            'message' => 'Phase 4.1 Service Integration Status'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Service monitoring unavailable'
        ], 503);
    }
});

// ============================================================================
// PAYROLL PROCESSING ROUTES
// ============================================================================
// NOTE: Payroll routes are now defined in:
// routes/modules/hr-payroll-management/payroll-processing.php
// These routes use App\Http\Controllers\Api\PayrollRunController
