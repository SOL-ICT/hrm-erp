<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Exception;

class ServiceLocationController extends Controller
{
    /**
     * Display a listing of service locations
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('service_locations')
                ->join('clients', 'service_locations.client_id', '=', 'clients.id')
                ->select(
                    'service_locations.*',
                    'clients.name as client_name',
                    'clients.client_code'
                );

            // Apply filters
            if ($request->has('client_id') && $request->client_id) {
                $query->where('service_locations.client_id', $request->client_id);
            }

            if ($request->has('status') && $request->status !== 'all') {
                $isActive = $request->status === 'active' ? 1 : 0;
                $query->where('service_locations.is_active', $isActive);
            }

            if ($request->has('search') && $request->search) {
                $search = '%' . $request->search . '%';
                $query->where(function ($q) use ($search) {
                    $q->where('service_locations.location_name', 'like', $search)
                        ->orWhere('service_locations.location_code', 'like', $search)
                        ->orWhere('clients.name', 'like', $search);
                });
            }

            if ($request->has('sol_region') && $request->sol_region) {
                $query->where('service_locations.sol_region', $request->sol_region);
            }

            // Order by created_at desc
            $query->orderBy('service_locations.created_at', 'desc');

            // Pagination
            $perPage = $request->get('per_page', 15);
            $locations = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $locations->items(),
                'pagination' => [
                    'current_page' => $locations->currentPage(),
                    'total_pages' => $locations->lastPage(),
                    'per_page' => $locations->perPage(),
                    'total' => $locations->total(),
                ],
                'message' => 'Service locations retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving service locations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created service location
     */
    public function store(Request $request)
    {
        try {
            // Validation rules
            $validator = Validator::make($request->all(), [
                'location_code' => 'required|string|max:20|unique:service_locations,location_code',
                'location_name' => 'required|string|max:255',
                'client_id' => 'required|integer|exists:clients,id',
                'country' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:100',
                'city' => 'nullable|string|max:100',
                'address' => 'nullable|string',
                'pin_code' => 'nullable|string|max:10',
                'phone' => 'nullable|string|max:20',
                'fax' => 'nullable|string|max:20',
                'notes' => 'nullable|string',
                'contact_name' => 'nullable|string|max:255',
                'contact_phone' => 'nullable|string|max:20',
                'contact_email' => 'nullable|email|max:255',
                'sol_region' => 'nullable|string|max:100',
                'sol_zone' => 'nullable|string|max:100',
                'client_region' => 'nullable|string|max:100',
                'client_zone' => 'nullable|string|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create service location
            $locationId = DB::table('service_locations')->insertGetId([
                'location_code' => $request->location_code,
                'location_name' => $request->location_name,
                'client_id' => $request->client_id,
                'country' => $request->country ?? 'Nigeria',
                'state' => $request->state,
                'city' => $request->city,
                'address' => $request->address,
                'pin_code' => $request->pin_code,
                'phone' => $request->phone,
                'fax' => $request->fax,
                'notes' => $request->notes,
                'contact_name' => $request->contact_name,
                'contact_phone' => $request->contact_phone,
                'contact_email' => $request->contact_email,
                'sol_region' => $request->sol_region,
                'sol_zone' => $request->sol_zone,
                'client_region' => $request->client_region,
                'client_zone' => $request->client_zone,
                'is_active' => 1,
                'created_by' => Auth::id(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Get the created location with client info
            $location = DB::table('service_locations')
                ->join('clients', 'service_locations.client_id', '=', 'clients.id')
                ->select(
                    'service_locations.*',
                    'clients.name as client_name',
                    'clients.client_code'
                )
                ->where('service_locations.id', $locationId)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $location,
                'message' => 'Service location created successfully'
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating service location: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified service location
     */
    public function show($id)
    {
        try {
            $location = DB::table('service_locations')
                ->join('clients', 'service_locations.client_id', '=', 'clients.id')
                ->select(
                    'service_locations.*',
                    'clients.name as client_name',
                    'clients.client_code'
                )
                ->where('service_locations.id', $id)
                ->first();

            if (!$location) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service location not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $location,
                'message' => 'Service location retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving service location: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified service location
     */
    public function update(Request $request, $id)
    {
        try {
            // Check if location exists
            $existingLocation = DB::table('service_locations')->where('id', $id)->first();
            if (!$existingLocation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service location not found'
                ], 404);
            }

            // Validation rules
            $validator = Validator::make($request->all(), [
                'location_code' => 'required|string|max:20|unique:service_locations,location_code,' . $id,
                'location_name' => 'required|string|max:255',
                'client_id' => 'required|integer|exists:clients,id',
                'country' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:100',
                'city' => 'nullable|string|max:100',
                'address' => 'nullable|string',
                'pin_code' => 'nullable|string|max:10',
                'phone' => 'nullable|string|max:20',
                'fax' => 'nullable|string|max:20',
                'notes' => 'nullable|string',
                'contact_name' => 'nullable|string|max:255',
                'contact_phone' => 'nullable|string|max:20',
                'contact_email' => 'nullable|email|max:255',
                'sol_region' => 'nullable|string|max:100',
                'sol_zone' => 'nullable|string|max:100',
                'client_region' => 'nullable|string|max:100',
                'client_zone' => 'nullable|string|max:100',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update service location
            DB::table('service_locations')
                ->where('id', $id)
                ->update([
                    'location_code' => $request->location_code,
                    'location_name' => $request->location_name,
                    'client_id' => $request->client_id,
                    'country' => $request->country ?? 'Nigeria',
                    'state' => $request->state,
                    'city' => $request->city,
                    'address' => $request->address,
                    'pin_code' => $request->pin_code,
                    'phone' => $request->phone,
                    'fax' => $request->fax,
                    'notes' => $request->notes,
                    'contact_name' => $request->contact_name,
                    'contact_phone' => $request->contact_phone,
                    'contact_email' => $request->contact_email,
                    'sol_region' => $request->sol_region,
                    'sol_zone' => $request->sol_zone,
                    'client_region' => $request->client_region,
                    'client_zone' => $request->client_zone,
                    'is_active' => $request->is_active ?? 1,
                    'updated_at' => now()
                ]);

            // Get the updated location with client info
            $location = DB::table('service_locations')
                ->join('clients', 'service_locations.client_id', '=', 'clients.id')
                ->select(
                    'service_locations.*',
                    'clients.name as client_name',
                    'clients.client_code'
                )
                ->where('service_locations.id', $id)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $location,
                'message' => 'Service location updated successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating service location: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified service location
     */
    public function destroy($id)
    {
        try {
            $location = DB::table('service_locations')->where('id', $id)->first();

            if (!$location) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service location not found'
                ], 404);
            }

            // Soft delete by setting is_active to 0
            DB::table('service_locations')
                ->where('id', $id)
                ->update([
                    'is_active' => 0,
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Service location deleted successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting service location: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get locations by client
     */
    public function getByClient($clientId)
    {
        try {
            $locations = DB::table('service_locations')
                ->where('client_id', $clientId)
                ->where('is_active', 1)
                ->orderBy('location_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $locations,
                'message' => 'Client locations retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving client locations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available regions (renamed to match your routes)
     */
    public function getRegions()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'North Central',
                'North East',
                'North West',
                'South East',
                'South South',
                'South West'
            ],
            'message' => 'SOL regions retrieved successfully'
        ]);
    }

    /**
     * Get available zones (renamed to match your routes)
     */
    public function getZones()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'Lagos Zone',
                'FCT Zone',
                'Port Harcourt Zone',
                'Kano Zone',
                'Ibadan Zone',
                'Kaduna Zone',
                'Jos Zone',
                'Enugu Zone'
            ],
            'message' => 'SOL zones retrieved successfully'
        ]);
    }

    /**
     * Get dashboard statistics
     */
    public function getStats()
    {
        try {
            $stats = [
                'total_locations' => DB::table('service_locations')->count(),
                'active_locations' => DB::table('service_locations')->where('is_active', 1)->count(),
                'inactive_locations' => DB::table('service_locations')->where('is_active', 0)->count(),
                'sol_regions' => DB::table('service_locations')
                    ->whereNotNull('sol_region')
                    ->where('sol_region', '!=', '')
                    ->distinct('sol_region')
                    ->count('sol_region'),
                'client_zones' => DB::table('service_locations')
                    ->whereNotNull('client_zone')
                    ->where('client_zone', '!=', '')
                    ->distinct('client_zone')
                    ->count('client_zone'),
                'locations_by_region' => DB::table('service_locations')
                    ->select('sol_region', DB::raw('count(*) as count'))
                    ->where('is_active', 1)
                    ->whereNotNull('sol_region')
                    ->groupBy('sol_region')
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Service location statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving statistics: ' . $e->getMessage()
            ], 500);
        }
    }
}
