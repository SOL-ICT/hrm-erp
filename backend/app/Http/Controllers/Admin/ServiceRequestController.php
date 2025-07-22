<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Exception;

class ServiceRequestController extends Controller
{
    /**
     * Display a listing of service requests
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);
            $search = $request->get('search');
            $clientId = $request->get('client_id');
            $serviceType = $request->get('service_type');
            $status = $request->get('status', 'all');

            // Build query with client information
            $query = DB::table('service_requests as sr')
                ->leftJoin('clients as c', 'sr.client_id', '=', 'c.id')
                ->select([
                    'sr.*',
                    'c.name as client_name',
                    'c.client_code'
                ])
                ->where('sr.is_active', 1);

            // Apply filters
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('sr.service_type', 'like', "%{$search}%")
                        ->orWhere('sr.service_name', 'like', "%{$search}%")
                        ->orWhere('sr.service_code', 'like', "%{$search}%")
                        ->orWhere('sr.description', 'like', "%{$search}%")
                        ->orWhere('c.name', 'like', "%{$search}%");
                });
            }

            if ($clientId) {
                $query->where('sr.client_id', $clientId);
            }

            if ($serviceType) {
                $query->where('sr.service_type', 'like', "%{$serviceType}%");
            }

            if ($status !== 'all') {
                if ($status === 'active') {
                    $query->where('sr.is_active', 1);
                } else {
                    $query->where('sr.is_active', 0);
                }
            }

            // Get total count for pagination
            $total = $query->count();

            // Apply pagination
            $services = $query
                ->orderBy('c.name')
                ->orderBy('sr.service_type')
                ->orderBy('sr.service_name')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get();

            // Calculate statistics
            $stats = [
                'total_services' => DB::table('service_requests')->where('is_active', 1)->count(),
                'total_clients' => DB::table('service_requests')
                    ->join('clients', 'service_requests.client_id', '=', 'clients.id')
                    ->where('service_requests.is_active', 1)
                    ->distinct('client_id')
                    ->count(),
                'total_service_types' => DB::table('service_requests')
                    ->where('is_active', 1)
                    ->distinct('service_type')
                    ->count(),
                'active_services' => DB::table('service_requests')->where('is_active', 1)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $services,
                'pagination' => [
                    'current_page' => (int) $page,
                    'per_page' => (int) $perPage,
                    'total' => $total,
                    'total_pages' => ceil($total / $perPage),
                ],
                'statistics' => $stats,
                'message' => 'Service requests retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving service requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created service request
     */
    public function store(Request $request)
    {
        try {
            // Validation rules for new structure
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|integer|exists:clients,id',
                'service_type' => 'required|string|max:255',
                'service_name' => 'required|string|max:255',
                'service_code' => 'required|string|max:20|unique:service_requests,service_code',
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create service request
            $serviceId = DB::table('service_requests')->insertGetId([
                'client_id' => $request->client_id,
                'service_type' => $request->service_type,
                'service_name' => $request->service_name,
                'service_code' => $request->service_code,
                'description' => $request->description,
                'is_active' => 1,
                'created_by' => Auth::id(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Get the created service with client info
            $service = DB::table('service_requests as sr')
                ->leftJoin('clients as c', 'sr.client_id', '=', 'c.id')
                ->select([
                    'sr.*',
                    'c.name as client_name',
                    'c.client_code'
                ])
                ->where('sr.id', $serviceId)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $service,
                'message' => 'Service request created successfully'
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating service request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified service request
     */
    public function show($id)
    {
        try {
            $service = DB::table('service_requests as sr')
                ->leftJoin('clients as c', 'sr.client_id', '=', 'c.id')
                ->select([
                    'sr.*',
                    'c.name as client_name',
                    'c.client_code'
                ])
                ->where('sr.id', $id)
                ->first();

            if (!$service) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service request not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $service,
                'message' => 'Service request retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving service request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified service request
     */
    public function update(Request $request, $id)
    {
        try {
            // Check if service exists
            $service = DB::table('service_requests')->where('id', $id)->first();
            if (!$service) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service request not found'
                ], 404);
            }

            // Validation rules
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|integer|exists:clients,id',
                'service_type' => 'required|string|max:255',
                'service_name' => 'required|string|max:255',
                'service_code' => 'required|string|max:20|unique:service_requests,service_code,' . $id,
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update service request
            DB::table('service_requests')
                ->where('id', $id)
                ->update([
                    'client_id' => $request->client_id,
                    'service_type' => $request->service_type,
                    'service_name' => $request->service_name,
                    'service_code' => $request->service_code,
                    'description' => $request->description,
                    'updated_at' => now()
                ]);

            // Get updated service with client info
            $updatedService = DB::table('service_requests as sr')
                ->leftJoin('clients as c', 'sr.client_id', '=', 'c.id')
                ->select([
                    'sr.*',
                    'c.name as client_name',
                    'c.client_code'
                ])
                ->where('sr.id', $id)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $updatedService,
                'message' => 'Service request updated successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating service request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified service request (soft delete)
     */
    public function destroy($id)
    {
        try {
            $service = DB::table('service_requests')->where('id', $id)->first();

            if (!$service) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service request not found'
                ], 404);
            }

            // Soft delete by setting is_active to 0
            DB::table('service_requests')
                ->where('id', $id)
                ->update([
                    'is_active' => 0,
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Service request deleted successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting service request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get service types for a specific client
     */
    public function getServiceTypes(Request $request)
    {
        try {
            $clientId = $request->get('client_id');

            $query = DB::table('service_requests')
                ->select('service_type')
                ->where('is_active', 1)
                ->distinct();

            if ($clientId) {
                $query->where('client_id', $clientId);
            }

            $serviceTypes = $query->pluck('service_type');

            return response()->json([
                'success' => true,
                'data' => $serviceTypes,
                'message' => 'Service types retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving service types: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get services grouped by client
     */
    public function getByClient()
    {
        try {
            $services = DB::table('service_requests as sr')
                ->leftJoin('clients as c', 'sr.client_id', '=', 'c.id')
                ->select([
                    'sr.*',
                    'c.name as client_name',
                    'c.client_code'
                ])
                ->where('sr.is_active', 1)
                ->orderBy('c.name')
                ->orderBy('sr.service_type')
                ->orderBy('sr.service_name')
                ->get()
                ->groupBy('client_name');

            return response()->json([
                'success' => true,
                'data' => $services,
                'message' => 'Services grouped by client retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving services by client: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate service code automatically
     */
    public function generateServiceCode(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|integer|exists:clients,id',
                'service_type' => 'required|string',
                'service_name' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get client code
            $client = DB::table('clients')->where('id', $request->client_id)->first();
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            $clientCode = substr($client->client_code, 0, 3);
            $typeCode = substr(str_replace(' ', '', $request->service_type), 0, 3);
            $nameCode = substr(str_replace(' ', '', $request->service_name), 0, 3);

            $serviceCode = strtoupper($clientCode . '-' . $typeCode . '-' . $nameCode);

            // Check if code exists and make it unique
            $originalCode = $serviceCode;
            $counter = 1;
            while (DB::table('service_requests')->where('service_code', $serviceCode)->exists()) {
                $serviceCode = $originalCode . $counter;
                $counter++;
            }

            return response()->json([
                'success' => true,
                'data' => ['service_code' => $serviceCode],
                'message' => 'Service code generated successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating service code: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStats()
    {
        try {
            $stats = [
                'total_services' => DB::table('service_requests')->where('is_active', 1)->count(),
                'total_clients' => DB::table('service_requests')
                    ->join('clients', 'service_requests.client_id', '=', 'clients.id')
                    ->where('service_requests.is_active', 1)
                    ->distinct('client_id')
                    ->count(),
                'total_service_types' => DB::table('service_requests')
                    ->where('is_active', 1)
                    ->distinct('service_type')
                    ->count(),
                'services_by_client' => DB::table('service_requests as sr')
                    ->join('clients as c', 'sr.client_id', '=', 'c.id')
                    ->select('c.name as client_name', DB::raw('count(*) as service_count'))
                    ->where('sr.is_active', 1)
                    ->groupBy('c.id', 'c.name')
                    ->orderBy('service_count', 'desc')
                    ->get(),
                'recent_services' => DB::table('service_requests as sr')
                    ->leftJoin('clients as c', 'sr.client_id', '=', 'c.id')
                    ->select([
                        'sr.service_code',
                        'sr.service_type',
                        'sr.service_name',
                        'c.name as client_name',
                        'sr.created_at'
                    ])
                    ->where('sr.is_active', 1)
                    ->orderBy('sr.created_at', 'desc')
                    ->limit(10)
                    ->get(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Dashboard statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving dashboard statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk operations for service requests
     */
    public function bulkUpdate(Request $request)
    {
        try {
            $action = $request->get('action');
            $serviceIds = $request->get('service_ids', []);

            if (empty($serviceIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No services selected'
                ], 422);
            }

            switch ($action) {
                case 'activate':
                    DB::table('service_requests')
                        ->whereIn('id', $serviceIds)
                        ->update(['is_active' => 1, 'updated_at' => now()]);
                    $message = 'Services activated successfully';
                    break;

                case 'deactivate':
                    DB::table('service_requests')
                        ->whereIn('id', $serviceIds)
                        ->update(['is_active' => 0, 'updated_at' => now()]);
                    $message = 'Services deactivated successfully';
                    break;

                case 'delete':
                    DB::table('service_requests')
                        ->whereIn('id', $serviceIds)
                        ->update(['is_active' => 0, 'updated_at' => now()]);
                    $message = 'Services deleted successfully';
                    break;

                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid action'
                    ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => $message
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error performing bulk operation: ' . $e->getMessage()
            ], 500);
        }
    }
}
