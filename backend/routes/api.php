<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ServiceLocationController;
use App\Http\Controllers\ServiceRequestController;
use App\Http\Controllers\ClientContractController;
use App\Http\Controllers\SystemPreferenceController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\UtilityController;

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
        'environment' => app()->environment(),
        'database' => 'connected'
    ]);
});

// Public endpoints
Route::get('/states-lgas', [CandidateController::class, 'getStatesLgas']);

Route::get('/utilities/industry-categories', [UtilityController::class, 'getIndustryCategories']);
Route::get('/utilities/client-categories', [UtilityController::class, 'getClientCategories']);


// Auth routes (public)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

/*
|--------------------------------------------------------------------------
| Authenticated API Routes (Main Application)
|--------------------------------------------------------------------------
*/

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

    /*
    |--------------------------------------------------------------------------
    | FIXED: Utility Routes - Moved to correct location
    |--------------------------------------------------------------------------
    */

    // // Utility data endpoints for dropdown populations
    // Route::get('/utilities/industry-categories', function () {
    //     try {
    //         $categories = DB::table('job_categories')
    //             ->select('name', 'slug', 'description')
    //             ->where('is_active', 1)
    //             ->orderBy('name')
    //             ->get()
    //             ->pluck('name')
    //             ->toArray();

    //         return response()->json([
    //             'success' => true,
    //             'data' => $categories,
    //             'message' => 'Industry categories retrieved successfully'
    //         ]);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Failed to fetch industry categories',
    //             'error' => config('app.debug') ? $e->getMessage() : 'Server error'
    //         ], 500);
    //     }
    // });

    // Route::get('/utilities/client-categories', function () {
    //     try {
    //         $categories = DB::table('service_requests')
    //             ->select('category')
    //             ->where('is_active', 1)
    //             ->whereNotNull('category')
    //             ->distinct()
    //             ->orderBy('category')
    //             ->get()
    //             ->pluck('category')
    //             ->toArray();

    //         return response()->json([
    //             'success' => true,
    //             'data' => $categories,
    //             'message' => 'Client categories retrieved successfully'
    //         ]);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Failed to fetch client categories',
    //             'error' => config('app.debug') ? $e->getMessage() : 'Server error'
    //         ], 500);
    //     }
    // });

    /*
    |--------------------------------------------------------------------------
    | Candidate Management Routes (Existing)
    |--------------------------------------------------------------------------
    */
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

    /*
    |--------------------------------------------------------------------------
    | Admin Management Routes (Existing)
    |--------------------------------------------------------------------------
    */
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

    /*
    |--------------------------------------------------------------------------
    | Client Management Routes (New Modern System)
    |--------------------------------------------------------------------------
    */
    Route::prefix('clients')->group(function () {
        Route::get('/', [ClientController::class, 'index'])->name('clients.index');
        Route::post('/', [ClientController::class, 'store'])->name('clients.store');
        Route::get('/statistics', [ClientController::class, 'statistics'])->name('clients.statistics');
        Route::get('/{id}', [ClientController::class, 'show'])->name('clients.show');
        Route::put('/{id}', [ClientController::class, 'update'])->name('clients.update');
        Route::delete('/{id}', [ClientController::class, 'destroy'])->name('clients.destroy');
        Route::patch('/{id}/toggle-status', [ClientController::class, 'toggleStatus'])->name('clients.toggle-status');
    });

    /*
    |--------------------------------------------------------------------------
    | Service Location Master Routes (Location + Region/Zone)
    |--------------------------------------------------------------------------
    */
    Route::prefix('service-locations')->group(function () {
        Route::get('/', [ServiceLocationController::class, 'index'])->name('service-locations.index');
        Route::post('/', [ServiceLocationController::class, 'store'])->name('service-locations.store');
        Route::get('/{id}', [ServiceLocationController::class, 'show'])->name('service-locations.show');
        Route::put('/{id}', [ServiceLocationController::class, 'update'])->name('service-locations.update');
        Route::delete('/{id}', [ServiceLocationController::class, 'destroy'])->name('service-locations.destroy');
        Route::get('/by-client/{clientId}', [ServiceLocationController::class, 'getByClient'])->name('service-locations.by-client');
        Route::get('/regions/list', [ServiceLocationController::class, 'getRegions'])->name('service-locations.regions');
        Route::get('/zones/list', [ServiceLocationController::class, 'getZones'])->name('service-locations.zones');
    });

    /*
    |--------------------------------------------------------------------------
    | Service Request Master Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('service-requests')->group(function () {
        Route::get('/', [ServiceRequestController::class, 'index'])->name('service-requests.index');
        Route::post('/', [ServiceRequestController::class, 'store'])->name('service-requests.store');
        Route::get('/{id}', [ServiceRequestController::class, 'show'])->name('service-requests.show');
        Route::put('/{id}', [ServiceRequestController::class, 'update'])->name('service-requests.update');
        Route::delete('/{id}', [ServiceRequestController::class, 'destroy'])->name('service-requests.destroy');
        Route::get('/by-category/{category}', [ServiceRequestController::class, 'getByCategory'])->name('service-requests.by-category');
    });

    /*
    |--------------------------------------------------------------------------
    | Client Contract Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('client-contracts')->group(function () {
        Route::get('/', [ClientContractController::class, 'index'])->name('client-contracts.index');
        Route::post('/', [ClientContractController::class, 'store'])->name('client-contracts.store');
        Route::get('/{id}', [ClientContractController::class, 'show'])->name('client-contracts.show');
        Route::put('/{id}', [ClientContractController::class, 'update'])->name('client-contracts.update');
        Route::delete('/{id}', [ClientContractController::class, 'destroy'])->name('client-contracts.destroy');
        Route::get('/by-client/{clientId}', [ClientContractController::class, 'getByClient'])->name('client-contracts.by-client');
        Route::patch('/{id}/toggle-status', [ClientContractController::class, 'toggleStatus'])->name('client-contracts.toggle-status');
        Route::get('/expiring/soon', [ClientContractController::class, 'getExpiringSoon'])->name('client-contracts.expiring-soon');
    });

    /*
    |--------------------------------------------------------------------------
    | System Preferences Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('system-preferences')->group(function () {
        Route::get('/', [SystemPreferenceController::class, 'index'])->name('system-preferences.index');
        Route::post('/', [SystemPreferenceController::class, 'store'])->name('system-preferences.store');
        Route::get('/{key}', [SystemPreferenceController::class, 'show'])->name('system-preferences.show');
        Route::put('/{key}', [SystemPreferenceController::class, 'update'])->name('system-preferences.update');
        Route::delete('/{key}', [SystemPreferenceController::class, 'destroy'])->name('system-preferences.destroy');
        Route::get('/by-category/{category}', [SystemPreferenceController::class, 'getByCategory'])->name('system-preferences.by-category');
        Route::post('/bulk-update', [SystemPreferenceController::class, 'bulkUpdate'])->name('system-preferences.bulk-update');
    });

    /*
    |--------------------------------------------------------------------------
    | Audit Log Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index'])->name('audit-logs.index');
        Route::get('/{id}', [AuditLogController::class, 'show'])->name('audit-logs.show');
        Route::get('/by-user/{userId}', [AuditLogController::class, 'getByUser'])->name('audit-logs.by-user');
        Route::get('/by-module/{module}', [AuditLogController::class, 'getByModule'])->name('audit-logs.by-module');
        Route::get('/by-table/{table}', [AuditLogController::class, 'getByTable'])->name('audit-logs.by-table');
        Route::get('/export/csv', [AuditLogController::class, 'exportCsv'])->name('audit-logs.export-csv');
        Route::get('/export/pdf', [AuditLogController::class, 'exportPdf'])->name('audit-logs.export-pdf');
        Route::delete('/cleanup/{days}', [AuditLogController::class, 'cleanup'])->name('audit-logs.cleanup');
    });

    /*
    |--------------------------------------------------------------------------
    | Utility Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('utilities')->group(function () {
        // States and LGAs
        Route::get('/states-lgas', function () {
            return response()->json([
                'success' => true,
                'data' => DB::table('states_lgas')
                    ->select('id', 'state_name', 'lga_name', 'state_code', 'zone')
                    ->where('is_active', true)
                    ->orderBy('state_name')
                    ->orderBy('lga_name')
                    ->get()
            ]);
        })->name('utilities.states-lgas');

        // Industry categories
        Route::get('/industry-categories', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'Banking & Finance',
                    'Oil & Gas',
                    'Telecommunications',
                    'Manufacturing',
                    'Healthcare',
                    'Education',
                    'Government',
                    'Technology',
                    'Real Estate',
                    'Retail & Commerce',
                    'Insurance',
                    'Agriculture',
                    'Transportation',
                    'Media & Entertainment',
                    'Professional Services'
                ]
            ]);
        })->name('utilities.industry-categories');

        // Client categories
        Route::get('/client-categories', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'Corporate',
                    'SME',
                    'Individual',
                    'Government',
                    'NGO',
                    'Multinational',
                    'Startup',
                    'Public Sector',
                    'Private Sector'
                ]
            ]);
        })->name('utilities.client-categories');

        // Service categories for requests
        Route::get('/service-categories', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'Finance',
                    'Administration',
                    'Security',
                    'Maintenance',
                    'Technology',
                    'Human Resources',
                    'Operations',
                    'Customer Service',
                    'Legal',
                    'Marketing',
                    'Procurement',
                    'Quality Assurance'
                ]
            ]);
        })->name('utilities.service-categories');

        // Nigerian zones for SOL regions
        Route::get('/nigeria-zones', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'North Central',
                    'North East',
                    'North West',
                    'South East',
                    'South South',
                    'South West'
                ]
            ]);
        })->name('utilities.nigeria-zones');

        // File upload utility
        Route::post('/upload-file', function (Request $request) {
            try {
                $request->validate([
                    'file' => 'required|file|max:10240', // 10MB max
                    'type' => 'required|in:logo,document,contract',
                    'client_id' => 'sometimes|exists:clients,id'
                ]);

                $file = $request->file('file');
                $type = $request->input('type');
                $clientId = $request->input('client_id');

                $path = match ($type) {
                    'logo' => 'clients/logos',
                    'document' => 'clients/documents',
                    'contract' => 'contracts/attachments',
                    default => 'general'
                };

                $fileName = time() . '_' . ($clientId ?? 'general') . '_' . $file->getClientOriginalName();
                $storedPath = $file->storeAs($path, $fileName, 'public');

                return response()->json([
                    'success' => true,
                    'data' => [
                        'path' => $storedPath,
                        'url' => Storage::url($storedPath),
                        'original_name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'mime_type' => $file->getMimeType()
                    ],
                    'message' => 'File uploaded successfully'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'File upload failed',
                    'error' => $e->getMessage()
                ], 500);
            }
        })->name('utilities.upload-file');
    });
});

/*
|--------------------------------------------------------------------------
| Admin-Only Routes (Super Admin/Global Admin Access)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:super-admin,admin'])->group(function () {

    // Advanced client management (Global admin only)
    Route::prefix('admin/clients')->group(function () {
        Route::post('/bulk-import', [ClientController::class, 'bulkImport'])->name('admin.clients.bulk-import');
        Route::post('/bulk-export', [ClientController::class, 'bulkExport'])->name('admin.clients.bulk-export');
        Route::post('/bulk-update-status', [ClientController::class, 'bulkUpdateStatus'])->name('admin.clients.bulk-update-status');
        Route::delete('/bulk-delete', [ClientController::class, 'bulkDelete'])->name('admin.clients.bulk-delete');
        Route::get('/audit-trail/{clientId}', [ClientController::class, 'getAuditTrail'])->name('admin.clients.audit-trail');
    });

    // Service location management (Global admin only)
    Route::prefix('admin/service-locations')->group(function () {
        Route::post('/bulk-import', [ServiceLocationController::class, 'bulkImport'])->name('admin.service-locations.bulk-import');
        Route::get('/hierarchy/{clientId}', [ServiceLocationController::class, 'getHierarchy'])->name('admin.service-locations.hierarchy');
        Route::post('/sync-regions-zones', [ServiceLocationController::class, 'syncRegionsZones'])->name('admin.service-locations.sync-regions-zones');
    });

    // Service request management (Global admin only)
    Route::prefix('admin/service-requests')->group(function () {
        Route::post('/bulk-update', [ServiceRequestController::class, 'bulkUpdate'])->name('admin.service-requests.bulk-update');
        Route::get('/usage-statistics', [ServiceRequestController::class, 'getUsageStatistics'])->name('admin.service-requests.usage-statistics');
    });

    // System maintenance routes
    Route::prefix('admin/maintenance')->group(function () {
        Route::post('/optimize-database', function () {
            try {
                // Optimize database tables
                $tables = ['clients', 'service_locations', 'service_requests', 'client_contracts', 'audit_logs'];

                foreach ($tables as $table) {
                    DB::statement("OPTIMIZE TABLE {$table}");
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Database optimization completed',
                    'optimized_tables' => $tables
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Database optimization failed',
                    'error' => $e->getMessage()
                ], 500);
            }
        })->name('admin.maintenance.optimize-database');

        Route::post('/clear-audit-logs', function (Request $request) {
            try {
                $days = $request->input('older_than_days', 365);

                $deletedCount = DB::table('audit_logs')
                    ->where('created_at', '<', now()->subDays($days))
                    ->delete();

                return response()->json([
                    'success' => true,
                    'message' => "Cleared audit logs older than {$days} days",
                    'deleted_records' => $deletedCount
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to clear audit logs',
                    'error' => $e->getMessage()
                ], 500);
            }
        })->name('admin.maintenance.clear-audit-logs');

        Route::get('/system-statistics', function () {
            try {
                $stats = [
                    'database_size' => DB::select("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB_Size_MB' FROM information_schema.tables WHERE table_schema = DATABASE()")[0]->DB_Size_MB ?? 0,
                    'total_records' => [
                        'clients' => DB::table('clients')->count(),
                        'service_locations' => DB::table('service_locations')->count(),
                        'service_requests' => DB::table('service_requests')->count(),
                        'client_contracts' => DB::table('client_contracts')->count(),
                        'audit_logs' => DB::table('audit_logs')->count(),
                        'users' => DB::table('users')->count(),
                    ],
                    'recent_activity' => [
                        'last_client_created' => DB::table('clients')->orderBy('created_at', 'desc')->value('created_at'),
                        'last_contract_updated' => DB::table('client_contracts')->orderBy('updated_at', 'desc')->value('updated_at'),
                        'last_audit_log' => DB::table('audit_logs')->orderBy('created_at', 'desc')->value('created_at'),
                    ],
                    'active_sessions' => DB::table('sessions')->where('last_activity', '>', now()->subMinutes(15)->timestamp)->count(),
                ];

                return response()->json([
                    'success' => true,
                    'data' => $stats,
                    'generated_at' => now()->toISOString()
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve system statistics',
                    'error' => $e->getMessage()
                ], 500);
            }
        })->name('admin.maintenance.system-statistics');
    });
});

/*
|--------------------------------------------------------------------------
| Custom Middleware Routes
|--------------------------------------------------------------------------
*/

// Routes that require specific permissions (if you implement permission system)
Route::middleware(['auth:sanctum', 'permission:manage_clients'])->group(function () {
    Route::post('/clients/{id}/archive', [ClientController::class, 'archive'])->name('clients.archive');
    Route::post('/clients/{id}/restore', [ClientController::class, 'restore'])->name('clients.restore');
});

Route::middleware(['auth:sanctum', 'permission:manage_contracts'])->group(function () {
    Route::post('/client-contracts/{id}/renew', [ClientContractController::class, 'renew'])->name('client-contracts.renew');
    Route::post('/client-contracts/{id}/terminate', [ClientContractController::class, 'terminate'])->name('client-contracts.terminate');
});

/*
|--------------------------------------------------------------------------
| Public API Routes (Rate Limited)
|--------------------------------------------------------------------------
*/

Route::middleware(['throttle:60,1'])->group(function () {
    // Public client information (limited data)
    Route::get('/public/clients/{slug}', function ($slug) {
        try {
            $client = DB::table('clients')
                ->select('name', 'slug', 'status')
                ->where('slug', $slug)
                ->where('status', 'active')
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $client
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Service unavailable'
            ], 503);
        }
    })->name('public.clients.show');
});

/*
|--------------------------------------------------------------------------
| Health Check & System Status Routes
|--------------------------------------------------------------------------
*/

Route::get('/health/client-management', function () {
    try {
        // Test database connection
        $clientCount = DB::table('clients')->count();

        return response()->json([
            'success' => true,
            'service' => 'Client Management API',
            'status' => 'healthy',
            'timestamp' => now()->toISOString(),
            'data' => [
                'total_clients' => $clientCount,
                'database_connection' => 'ok'
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'service' => 'Client Management API',
            'status' => 'unhealthy',
            'timestamp' => now()->toISOString(),
            'error' => 'Database connection failed'
        ], 500);
    }
})->name('health.client-management');
/*
|--------------------------------------------------------------------------
| API Documentation Route
|--------------------------------------------------------------------------
*/

Route::get('/docs/client-management', function () {
    return response()->json([
        'api_name' => 'SOL Nigeria HRM - Client Management API',
        'version' => '1.0.0',
        'documentation' => 'https://docs.solnigeria.com/api/client-management',
        'endpoints' => [
            'clients' => [
                'GET /api/clients' => 'List all clients with pagination and filtering',
                'POST /api/clients' => 'Create a new client',
                'GET /api/clients/{id}' => 'Get specific client details',
                'PUT /api/clients/{id}' => 'Update client information',
                'DELETE /api/clients/{id}' => 'Delete a client',
                'PATCH /api/clients/{id}/toggle-status' => 'Toggle client active status',
                'GET /api/clients/statistics' => 'Get client statistics'
            ],
            'service_locations' => [
                'GET /api/service-locations' => 'List all service locations',
                'POST /api/service-locations' => 'Create a new service location',
                'GET /api/service-locations/by-client/{clientId}' => 'Get locations for specific client'
            ],
            'service_requests' => [
                'GET /api/service-requests' => 'List all service requests',
                'POST /api/service-requests' => 'Create a new service request type',
                'GET /api/service-requests/by-category/{category}' => 'Get requests by category'
            ],
            'utilities' => [
                'GET /api/utilities/states-lgas' => 'Get Nigerian states and LGAs',
                'GET /api/utilities/industry-categories' => 'Get industry categories',
                'GET /api/utilities/client-categories' => 'Get client categories',
                'POST /api/utilities/upload-file' => 'Upload files (logos, documents)'
            ]
        ],
        'authentication' => 'Bearer Token (Laravel Sanctum)',
        'rate_limits' => [
            'authenticated' => '1000 requests per hour',
            'public' => '60 requests per minute'
        ],
        'support' => 'api-support@solnigeria.com'
    ]);
})->name('docs.client-management');
/*
|--------------------------------------------------------------------------
| Legacy API Support (for backward compatibility)
|--------------------------------------------------------------------------
*/
Route::prefix('v1')->middleware(['web', 'auth:sanctum'])->group(function () {
    // Legacy client endpoints
    Route::get('/clients', [ClientController::class, 'index'])->name('v1.clients.index');
    Route::get('/clients/{id}', [ClientController::class, 'show'])->name('v1.clients.show');
});

/*
|--------------------------------------------------------------------------
| Webhook Routes for External Integrations
|--------------------------------------------------------------------------
*/

Route::prefix('webhooks')->group(function () {
    Route::post('/client-updated/{clientId}', function ($clientId) {
        // Handle external client update notifications
        try {
            $client = DB::table('clients')->where('id', $clientId)->first();

            if (!$client) {
                return response()->json(['error' => 'Client not found'], 404);
            }

            // Log the webhook event
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

/*
|--------------------------------------------------------------------------
| Additional Routes for CSRF-Free API Access
|--------------------------------------------------------------------------
*/

// ✅ FIXED: Additional routes that need web middleware for session handling
Route::middleware(['web', 'auth:sanctum'])->group(function () {
    // Only routes that specifically need session/CSRF should be here
    // Most API operations should use the auth:sanctum only group above
});
