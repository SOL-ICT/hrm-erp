<?php

namespace App\Http\Controllers;

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
            $query = DB::table('service_requests');

            // Apply filters
            if ($request->has('category') && $request->category) {
                $query->where('category', $request->category);
            }

            if ($request->has('status') && $request->status !== 'all') {
                $isActive = $request->status === 'active' ? 1 : 0;
                $query->where('is_active', $isActive);
            }

            if ($request->has('search') && $request->search) {
                $search = '%' . $request->search . '%';
                $query->where(function ($q) use ($search) {
                    $q->where('service_name', 'like', $search)
                        ->orWhere('service_code', 'like', $search)
                        ->orWhere('description', 'like', $search);
                });
            }

            // Order by service_name
            $query->orderBy('service_name', 'asc');

            // Pagination
            $perPage = $request->get('per_page', 15);
            $services = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $services->items(),
                'pagination' => [
                    'current_page' => $services->currentPage(),
                    'total_pages' => $services->lastPage(),
                    'per_page' => $services->perPage(),
                    'total' => $services->total(),
                ],
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
            // Validation rules
            $validator = Validator::make($request->all(), [
                'service_code' => 'required|string|max:20|unique:service_requests,service_code',
                'service_name' => 'required|string|max:255|unique:service_requests,service_name',
                'description' => 'nullable|string',
                'category' => 'nullable|string|max:100',
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
                'service_code' => $request->service_code,
                'service_name' => $request->service_name,
                'description' => $request->description,
                'category' => $request->category,
                'is_active' => 1,
                'created_by' => Auth::id(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Get the created service
            $service = DB::table('service_requests')
                ->where('id', $serviceId)
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
            $service = DB::table('service_requests')
                ->where('id', $id)
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
            $existingService = DB::table('service_requests')->where('id', $id)->first();
            if (!$existingService) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service request not found'
                ], 404);
            }

            // Validation rules
            $validator = Validator::make($request->all(), [
                'service_code' => 'required|string|max:20|unique:service_requests,service_code,' . $id,
                'service_name' => 'required|string|max:255|unique:service_requests,service_name,' . $id,
                'description' => 'nullable|string',
                'category' => 'nullable|string|max:100',
                'is_active' => 'boolean'
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
                    'service_code' => $request->service_code,
                    'service_name' => $request->service_name,
                    'description' => $request->description,
                    'category' => $request->category,
                    'is_active' => $request->is_active ?? 1,
                    'updated_at' => now()
                ]);

            // Get the updated service
            $service = DB::table('service_requests')
                ->where('id', $id)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $service,
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
     * Remove the specified service request
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
     * Get service categories
     */
    public function getCategories()
    {
        try {
            $categories = DB::table('service_requests')
                ->select('category')
                ->whereNotNull('category')
                ->where('category', '!=', '')
                ->distinct()
                ->pluck('category');

            // Add default categories if none exist
            $defaultCategories = [
                'Finance',
                'Administration',
                'Security',
                'Maintenance',
                'Technology',
                'Human Resources',
                'Operations',
                'Customer Service',
                'Sales',
                'Marketing'
            ];

            $allCategories = $categories->merge($defaultCategories)->unique()->sort()->values();

            return response()->json([
                'success' => true,
                'data' => $allCategories,
                'message' => 'Service categories retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving categories: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get services by category
     */
    public function getByCategory($category)
    {
        try {
            $services = DB::table('service_requests')
                ->where('category', $category)
                ->where('is_active', 1)
                ->orderBy('service_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $services,
                'message' => 'Services by category retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving services by category: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard statistics
     */
    public function getStats()
    {
        try {
            $stats = [
                'total_services' => DB::table('service_requests')->count(),
                'active_services' => DB::table('service_requests')->where('is_active', 1)->count(),
                'inactive_services' => DB::table('service_requests')->where('is_active', 0)->count(),
                'total_categories' => DB::table('service_requests')
                    ->whereNotNull('category')
                    ->where('category', '!=', '')
                    ->distinct('category')
                    ->count('category'),
                'services_by_category' => DB::table('service_requests')
                    ->select('category', DB::raw('count(*) as count'))
                    ->where('is_active', 1)
                    ->whereNotNull('category')
                    ->groupBy('category')
                    ->get(),
                'recent_services' => DB::table('service_requests')
                    ->where('is_active', 1)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'service_name', 'service_code', 'category', 'created_at'])
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Service request statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk import service requests
     */
    public function bulkImport(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'services' => 'required|array',
                'services.*.service_code' => 'required|string|max:20',
                'services.*.service_name' => 'required|string|max:255',
                'services.*.description' => 'nullable|string',
                'services.*.category' => 'nullable|string|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            $services = $request->services;
            $imported = 0;
            $errors = [];

            foreach ($services as $index => $serviceData) {
                try {
                    // Check for duplicates
                    $exists = DB::table('service_requests')
                        ->where('service_code', $serviceData['service_code'])
                        ->orWhere('service_name', $serviceData['service_name'])
                        ->exists();

                    if ($exists) {
                        $errors[] = "Row " . ($index + 1) . ": Service code or name already exists";
                        continue;
                    }

                    DB::table('service_requests')->insert([
                        'service_code' => $serviceData['service_code'],
                        'service_name' => $serviceData['service_name'],
                        'description' => $serviceData['description'] ?? null,
                        'category' => $serviceData['category'] ?? null,
                        'is_active' => 1,
                        'created_by' => Auth::id(),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    $imported++;
                } catch (Exception $e) {
                    $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'imported' => $imported,
                    'total' => count($services),
                    'errors' => $errors
                ],
                'message' => "Successfully imported {$imported} service requests"
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error during bulk import: ' . $e->getMessage()
            ], 500);
        }
    }
}
