<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class SOLOfficeController extends Controller
{
    /**
     * Display a listing of SOL offices
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('sol_offices');

            // Apply filters
            if ($request->filled('state_code')) {
                $query->where('state_code', $request->state_code);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('office_name', 'like', "%{$search}%")
                        ->orWhere('office_code', 'like', "%{$search}%");
                });
            }

            if ($request->filled('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $offices = $query->orderBy('state_name')
                ->orderBy('office_name')
                ->get();

            // Add controlled areas details
            foreach ($offices as $office) {
                if ($office->controlled_areas) {
                    $controlledAreas = json_decode($office->controlled_areas, true);
                    if ($office->control_type === 'lga') {
                        $office->controlled_areas_details = DB::table('states_lgas')
                            ->whereIn('lga_code', $controlledAreas)
                            ->select('lga_name', 'lga_code')
                            ->get();
                    } else {
                        $office->controlled_areas_details = DB::table('states_lgas')
                            ->whereIn('state_code', $controlledAreas)
                            ->select('state_name', 'state_code')
                            ->distinct()
                            ->get();
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $offices
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching SOL offices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created SOL office
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'office_name' => 'required|string|max:255',
            'office_code' => 'required|string|max:20|unique:sol_offices,office_code',
            'zone' => 'required|in:north_central,north_east,north_west,south_east,south_south,south_west', // Updated to 'zone'
            'state_name' => 'required|string|max:100',
            'state_code' => 'required|string|max:10',
            'control_type' => 'required|in:lga,state',
            'controlled_areas' => 'nullable|array',
            'controlled_areas.*' => 'string|max:20',
            'office_address' => 'nullable|string',
            'office_phone' => 'nullable|string|max:20',
            'office_email' => 'nullable|email|max:255',
            'manager_name' => 'nullable|string|max:255',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $officeId = DB::table('sol_offices')->insertGetId([
                'office_name' => $request->office_name,
                'office_code' => $request->office_code,
                'zone' => $request->zone, // Updated to 'zone'
                'state_name' => $request->state_name,
                'state_code' => $request->state_code,
                'control_type' => $request->control_type,
                'controlled_areas' => json_encode($request->controlled_areas ?? []),
                'office_address' => $request->office_address,
                'office_phone' => $request->office_phone,
                'office_email' => $request->office_email,
                'manager_name' => $request->manager_name,
                'is_active' => $request->boolean('is_active', true),
                'created_by' => Auth::check() ? Auth::id() : 1,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'SOL office created successfully',
                'data' => ['id' => $officeId]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error creating SOL office',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified SOL office
     */
    public function show($id)
    {
        try {
            $office = DB::table('sol_offices')->where('id', $id)->first();

            if (!$office) {
                return response()->json([
                    'success' => false,
                    'message' => 'SOL office not found'
                ], 404);
            }

            // Load controlled areas details
            if ($office->controlled_areas) {
                $controlledAreas = json_decode($office->controlled_areas, true);
                if ($office->control_type === 'lga') {
                    $office->controlled_areas_details = DB::table('states_lgas')
                        ->whereIn('lga_code', $controlledAreas)
                        ->select('lga_name', 'lga_code')
                        ->get();
                } else {
                    $office->controlled_areas_details = DB::table('states_lgas')
                        ->whereIn('state_code', $controlledAreas)
                        ->select('state_name', 'state_code')
                        ->distinct()
                        ->get();
                }
            }

            return response()->json([
                'success' => true,
                'data' => $office
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching SOL office',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified SOL office
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'office_name' => 'required|string|max:255',
            'office_code' => 'required|string|max:20|unique:sol_offices,office_code,' . $id,
            'zone' => 'required|in:north_central,north_east,north_west,south_east,south_south,south_west', // Updated to 'zone'
            'state_name' => 'required|string|max:100',
            'state_code' => 'required|string|max:10',
            'control_type' => 'required|in:lga,state',
            'controlled_areas' => 'nullable|array',
            'controlled_areas.*' => 'string|max:20',
            'office_address' => 'nullable|string',
            'office_phone' => 'nullable|string|max:20',
            'office_email' => 'nullable|email|max:255',
            'manager_name' => 'nullable|string|max:255',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $updated = DB::table('sol_offices')->where('id', $id)->update([
                'office_name' => $request->office_name,
                'office_code' => $request->office_code,
                'zone' => $request->zone, // Updated to 'zone'
                'state_name' => $request->state_name,
                'state_code' => $request->state_code,
                'control_type' => $request->control_type,
                'controlled_areas' => json_encode($request->controlled_areas ?? []),
                'office_address' => $request->office_address,
                'office_phone' => $request->office_phone,
                'office_email' => $request->office_email,
                'manager_name' => $request->manager_name,
                'is_active' => $request->boolean('is_active', true),
                'updated_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'SOL office updated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error updating SOL office',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified SOL office
     */
    public function destroy($id)
    {
        try {
            // Check if office has any service locations assigned
            $serviceLocationCount = DB::table('service_locations')
                ->where('sol_office_id', $id)
                ->count();

            if ($serviceLocationCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete office. It has {$serviceLocationCount} service location(s) assigned."
                ], 400);
            }

            DB::table('sol_offices')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'SOL office deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting SOL office',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get states and LGAs for form options
     */
    public function getStatesAndLGAs()
    {
        try {
            $states = DB::table('states_lgas')
                ->select('state_name as name', 'state_code as code')
                ->distinct()
                ->orderBy('state_name')
                ->get();

            $lgas = DB::table('states_lgas')
                ->select('lga_name as name', 'lga_code as code', 'state_code')
                ->orderBy('state_name')
                ->orderBy('lga_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'states' => $states,
                    'lgas' => $lgas
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching states and LGAs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get office statistics
     */
    public function getStatistics()
    {
        try {
            $totalOffices = DB::table('sol_offices')->count();
            $activeOffices = DB::table('sol_offices')->where('is_active', true)->count();
            $statesCovered = DB::table('sol_offices')->distinct('state_code')->count();

            $officesByState = DB::table('sol_offices')
                ->selectRaw('state_name, count(*) as count')
                ->groupBy('state_name')
                ->orderBy('count', 'desc')
                ->get();

            $officesByControlType = DB::table('sol_offices')
                ->selectRaw('control_type, count(*) as count')
                ->groupBy('control_type')
                ->get();

            $stats = [
                'total_offices' => $totalOffices,
                'active_offices' => $activeOffices,
                'states_covered' => $statesCovered,
                'offices_by_state' => $officesByState,
                'offices_by_control_type' => $officesByControlType
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk update offices status
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'office_ids' => 'required|array',
            'office_ids.*' => 'exists:sol_offices,id',
            'is_active' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updatedCount = DB::table('sol_offices')
                ->whereIn('id', $request->office_ids)
                ->update(['is_active' => $request->boolean('is_active')]);

            return response()->json([
                'success' => true,
                'message' => "Successfully updated {$updatedCount} office(s)",
                'updated_count' => $updatedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating offices',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
