<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class SOLOfficeController extends Controller
{
    /**
     * ✅ FIX 2: Enhanced permission check using profile_id approach
     */
    private function checkSOLAdminAccess(): array
    {
        $user = Auth::user();

        if (!$user) {
            throw new \Exception('Authentication required', 401);
        }

        // Check if user is staff/admin type with staff_profile_id
        if (!in_array($user->user_type, ['staff', 'admin']) || !$user->staff_profile_id) {
            throw new \Exception('Only staff/admin users can access SOL offices', 403);
        }

        // Verify SOL staff using direct staff_profile_id (staff ID)
        $solStaff = DB::table('staff')
            ->where('id', $user->staff_profile_id)
            ->where('client_id', 1) // SOL Nigeria only
            ->where('status', 'active')
            ->first();

        if (!$solStaff) {
            throw new \Exception('Only SOL staff can manage SOL offices', 403);
        }

        // Check admin permissions
        $hasAdminRole = DB::table('staff_roles')
            ->join('roles', 'staff_roles.role_id', '=', 'roles.id')
            ->where('staff_roles.staff_id', $user->staff_profile_id)
            ->whereIn('roles.slug', ['super-admin', 'admin'])
            ->exists();

        if (!$hasAdminRole) {
            throw new \Exception('Insufficient permissions for SOL office management', 403);
        }

        return [
            'user' => $user,
            'staff_id' => $user->staff_profile_id,
            'staff' => $solStaff
        ];
    }

    /**
     * ✅ FIX 3: Fixed index method to actually return SOL offices
     */
    public function index(Request $request)
    {
        try {
            // Check permissions
            $authData = $this->checkSOLAdminAccess();

            // Build query with filters
            $query = DB::table('sol_offices')
                ->whereNull('deleted_at'); // Only non-deleted offices

            // Search filter
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('office_name', 'like', "%{$search}%")
                        ->orWhere('office_code', 'like', "%{$search}%")
                        ->orWhere('state_name', 'like', "%{$search}%")
                        ->orWhere('manager_name', 'like', "%{$search}%");
                });
            }

            // State filter
            if ($request->has('state') && $request->state !== 'all') {
                $query->where('state_code', $request->state);
            }

            // Status filter
            if ($request->has('status')) {
                $query->where('is_active', $request->boolean('status'));
            }

            // Control type filter
            if ($request->has('control_type') && $request->control_type !== 'all') {
                $query->where('control_type', $request->control_type);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'office_name');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 20);
            $currentPage = $request->get('page', 1);
            $offset = ($currentPage - 1) * $perPage;

            $totalRecords = $query->count();
            $offices = $query->offset($offset)->limit($perPage)->get();

            // Add controlled areas details to each office
            foreach ($offices as $office) {
                if ($office->controlled_areas) {
                    $controlledAreas = json_decode($office->controlled_areas, true);

                    if ($office->control_type === 'lga') {
                        $office->controlled_areas_details = DB::table('states_lgas')
                            ->whereIn('lga_code', $controlledAreas)
                            ->select('lga_name as name', 'lga_code as code', 'state_name')
                            ->get();
                    } else {
                        $office->controlled_areas_details = DB::table('states_lgas')
                            ->whereIn('state_code', $controlledAreas)
                            ->select('state_name as name', 'state_code as code')
                            ->distinct()
                            ->get();
                    }
                } else {
                    $office->controlled_areas_details = collect();
                }
            }

            return response()->json([
                'success' => true,
                'data' => $offices,
                'pagination' => [
                    'current_page' => $currentPage,
                    'per_page' => $perPage,
                    'total' => $totalRecords,
                    'last_page' => ceil($totalRecords / $perPage),
                    'from' => $offset + 1,
                    'to' => min($offset + $perPage, $totalRecords)
                ]
            ]);
        } catch (\Exception $e) {
            $statusCode = 500; // Default server error

            if ($e->getCode() == 401) {
                $statusCode = 401; // Unauthorized
            } elseif ($e->getCode() == 403) {
                $statusCode = 403; // Forbidden
            } elseif ($e->getCode() == 404) {
                $statusCode = 404; // Not found
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * ✅ FIX 2 & 4: Enhanced store method with profile_id approach
     */
    public function store(Request $request)
    {

        try {
            // Check permissions first
            $authData = $this->checkSOLAdminAccess();

            $validator = Validator::make($request->all(), [
                'office_name' => 'required|string|max:255',
                'office_code' => 'required|string|max:20|unique:sol_offices,office_code',
                'zone' => 'required|in:north_central,north_east,north_west,south_east,south_south,south_west',
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

            DB::beginTransaction();

            // Auto-get zone from states_lgas table based on state_code
            $stateInfo = DB::table('states_lgas')
                ->where('state_code', $request->state_code)
                ->select('zone')
                ->first();

            $zone = $stateInfo ? $stateInfo->zone : null;
            $zoneName = $zone ? ucwords(str_replace('_', ' ', $zone)) : null;

            // ✅ SOLUTION: Use staff ID directly from profile_id (no created_by from frontend needed)
            $officeId = DB::table('sol_offices')->insertGetId([
                'office_name' => $request->office_name,
                'office_code' => $request->office_code,
                'zone' => $zone,
                'zone_name' => $zoneName,
                'state_name' => $request->state_name,
                'state_code' => $request->state_code,
                'control_type' => $request->control_type,
                'controlled_areas' => json_encode($request->controlled_areas ?? []),
                'office_address' => $request->office_address,
                'office_phone' => $request->office_phone,
                'office_email' => $request->office_email,
                'manager_name' => $request->manager_name,
                'is_active' => $request->boolean('is_active', true),
                'created_by' => $authData['staff_id'], // ✅ Direct staff ID from profile_id
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
            // Map exception codes to proper HTTP status codes
            $statusCode = 500; // Default server error

            if ($e->getCode() == 401) {
                $statusCode = 401; // Unauthorized
            } elseif ($e->getCode() == 403) {
                $statusCode = 403; // Forbidden
            } elseif ($e->getCode() == 404) {
                $statusCode = 404; // Not found
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Display the specified SOL office
     */
    public function show($office)
    {
        try {
            // Check permissions
            $authData = $this->checkSOLAdminAccess();

            $office = DB::table('sol_offices')
                ->where('id', $office)
                ->whereNull('deleted_at')
                ->first();

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
                        ->select('lga_name as name', 'lga_code as code', 'state_name')
                        ->get();
                } else {
                    $office->controlled_areas_details = DB::table('states_lgas')
                        ->whereIn('state_code', $controlledAreas)
                        ->select('state_name as name', 'state_code as code')
                        ->distinct()
                        ->get();
                }
            }

            return response()->json([
                'success' => true,
                'data' => $office
            ]);
        } catch (\Exception $e) {
            // Map exception codes to proper HTTP status codes
            $statusCode = 500; // Default server error

            if ($e->getCode() == 401) {
                $statusCode = 401; // Unauthorized
            } elseif ($e->getCode() == 403) {
                $statusCode = 403; // Forbidden
            } elseif ($e->getCode() == 404) {
                $statusCode = 404; // Not found
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Update the specified SOL office
     */
    public function update(Request $request, $office)
    {
        try {
            // Check permissions
            $authData = $this->checkSOLAdminAccess();

            $validator = Validator::make($request->all(), [
                'office_name' => 'required|string|max:255',
                'office_code' => 'required|string|max:20|unique:sol_offices,office_code,' . $office,
                'zone' => 'required|in:north_central,north_east,north_west,south_east,south_south,south_west',
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

            DB::beginTransaction();

            $updated = DB::table('sol_offices')
                ->where('id', $office)
                ->whereNull('deleted_at')
                ->update([
                    'office_name' => $request->office_name,
                    'office_code' => $request->office_code,
                    'zone' => $request->zone,
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

            if ($updated === 0) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'SOL office not found or no changes made'
                ], 404);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'SOL office updated successfully'
            ]);
        } catch (\Exception $e) {
            // Map exception codes to proper HTTP status codes
            $statusCode = 500; // Default server error

            if ($e->getCode() == 401) {
                $statusCode = 401; // Unauthorized
            } elseif ($e->getCode() == 403) {
                $statusCode = 403; // Forbidden
            } elseif ($e->getCode() == 404) {
                $statusCode = 404; // Not found
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Remove the specified SOL office
     */
    public function destroy($office)
    {
        try {
            // Check permissions
            $authData = $this->checkSOLAdminAccess();

            // Check if office has any service locations assigned
            $serviceLocationCount = DB::table('service_locations')
                ->where('sol_office_id', $office)
                ->count();

            if ($serviceLocationCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete office. It has {$serviceLocationCount} service location(s) assigned."
                ], 400);
            }

            // Soft delete the office
            $deleted = DB::table('sol_offices')
                ->where('id', $office)
                ->whereNull('deleted_at')
                ->update(['deleted_at' => now()]);

            if ($deleted === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'SOL office not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'SOL office deleted successfully'
            ]);
        } catch (\Exception $e) {
            // Map exception codes to proper HTTP status codes
            $statusCode = 500; // Default server error

            if ($e->getCode() == 401) {
                $statusCode = 401; // Unauthorized
            } elseif ($e->getCode() == 403) {
                $statusCode = 403; // Forbidden
            } elseif ($e->getCode() == 404) {
                $statusCode = 404; // Not found
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Get states and LGAs for form options
     */
    public function getStatesAndLGAs()
    {
        try {
            // Check permissions
            $authData = $this->checkSOLAdminAccess();

            $states = DB::table('states_lgas')
                ->select('state_name as name', 'state_code as code', 'zone')
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
            // Map exception codes to proper HTTP status codes
            $statusCode = 500; // Default server error

            if ($e->getCode() == 401) {
                $statusCode = 401; // Unauthorized
            } elseif ($e->getCode() == 403) {
                $statusCode = 403; // Forbidden
            } elseif ($e->getCode() == 404) {
                $statusCode = 404; // Not found
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Get office statistics
     */
    public function getStatistics()
    {
        try {
            // Check permissions
            $authData = $this->checkSOLAdminAccess();

            $totalOffices = DB::table('sol_offices')->whereNull('deleted_at')->count();
            $activeOffices = DB::table('sol_offices')->whereNull('deleted_at')->where('is_active', true)->count();
            $statesCovered = DB::table('sol_offices')->whereNull('deleted_at')->distinct('state_code')->count();

            $officesByState = DB::table('sol_offices')
                ->whereNull('deleted_at')
                ->selectRaw('state_name, count(*) as count')
                ->groupBy('state_name')
                ->orderBy('count', 'desc')
                ->get();

            $officesByControlType = DB::table('sol_offices')
                ->whereNull('deleted_at')
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
            // Map exception codes to proper HTTP status codes
            $statusCode = 500; // Default server error

            if ($e->getCode() == 401) {
                $statusCode = 401; // Unauthorized
            } elseif ($e->getCode() == 403) {
                $statusCode = 403; // Forbidden
            } elseif ($e->getCode() == 404) {
                $statusCode = 404; // Not found
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }

    /**
     * Bulk update offices status
     */
    public function bulkUpdateStatus(Request $request)
    {
        try {
            // Check permissions
            $authData = $this->checkSOLAdminAccess();

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

            $updatedCount = DB::table('sol_offices')
                ->whereIn('id', $request->office_ids)
                ->whereNull('deleted_at')
                ->update(['is_active' => $request->boolean('is_active')]);

            return response()->json([
                'success' => true,
                'message' => "Successfully updated {$updatedCount} office(s)",
                'updated_count' => $updatedCount
            ]);
        } catch (\Exception $e) {
            // Map exception codes to proper HTTP status codes
            $statusCode = 500; // Default server error

            if ($e->getCode() == 401) {
                $statusCode = 401; // Unauthorized
            } elseif ($e->getCode() == 403) {
                $statusCode = 403; // Forbidden
            } elseif ($e->getCode() == 404) {
                $statusCode = 404; // Not found
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $statusCode);
        }
    }
}
