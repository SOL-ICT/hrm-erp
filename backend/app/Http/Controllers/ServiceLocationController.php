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

    public function store(Request $request)
    {
        try {
            // Validation rules - updated to match new requirements
            $validator = Validator::make($request->all(), [
                'location_code' => 'nullable|string|max:20|unique:service_locations,location_code',
                'location_name' => 'required|string|max:255',
                'unique_id' => 'nullable|string|max:100',
                'short_name' => 'nullable|string|max:100',
                'city' => 'required|string|max:100',
                'full_address' => 'nullable|string',
                'contact_person_name' => 'nullable|string|max:255',
                'contact_person_phone' => 'nullable|string|max:20',
                'contact_person_email' => 'nullable|email|max:255',
                'client_id' => 'required|integer|exists:clients,id',
                'sol_office_id' => 'nullable|integer|exists:sol_offices,id',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation errors',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Generate location code if not provided
            if (empty($request->location_code)) {
                $client = DB::table('clients')->where('id', $request->client_id)->first();
                $cityCode = strtoupper(substr($request->city, 0, 3));
                $timestamp = now()->format('His');
                $locationCode = $client->client_code . '-' . $cityCode . '-' . $timestamp;
            } else {
                $locationCode = $request->location_code;
            }

            // Create service location
            $locationId = DB::table('service_locations')->insertGetId([
                'location_code' => $locationCode,
                'location_name' => $request->location_name,
                'unique_id' => $request->unique_id,
                'short_name' => $request->short_name,
                'city' => $request->city,
                'full_address' => $request->full_address,
                'contact_person_name' => $request->contact_person_name,
                'contact_person_phone' => $request->contact_person_phone,
                'contact_person_email' => $request->contact_person_email,
                'client_id' => $request->client_id,
                'sol_office_id' => $request->sol_office_id,
                'country' => 'Nigeria',
                'is_active' => $request->boolean('is_active', true),
                'created_by' => Auth::id(),
                'created_at' => now(),
                'updated_at' => now(),

                // Set old fields to null or default values
                'state' => null,
                'address' => $request->full_address, // Copy to old address field
                'pin_code' => null,
                'phone' => null,
                'fax' => null,
                'contact_name' => $request->contact_person_name, // Copy to old field
                'contact_phone' => $request->contact_person_phone, // Copy to old field
                'contact_email' => $request->contact_person_email, // Copy to old field
                'sol_region' => null,
                'sol_zone' => null,
                'client_region' => null,
                'client_zone' => null,
                'notes' => null
            ]);

            // Get the created location with client and SOL office info
            $location = DB::table('service_locations')
                ->join('clients', 'service_locations.client_id', '=', 'clients.id')
                ->leftJoin('sol_offices', 'service_locations.sol_office_id', '=', 'sol_offices.id')
                ->select(
                    'service_locations.*',
                    'clients.name as client_name',
                    'clients.client_code',
                    'sol_offices.office_name as sol_office_name',
                    'sol_offices.state_name as sol_office_state'
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
            $location = DB::table('service_locations')->where('id', $id)->first();
            if (!$location) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service location not found'
                ], 404);
            }

            // Validation rules
            $validator = Validator::make($request->all(), [
                'location_code' => 'nullable|string|max:20|unique:service_locations,location_code,' . $id,
                'location_name' => 'required|string|max:255',
                'unique_id' => 'nullable|string|max:100',
                'short_name' => 'nullable|string|max:100',
                'city' => 'required|string|max:100',
                'full_address' => 'nullable|string',
                'contact_person_name' => 'nullable|string|max:255',
                'contact_person_phone' => 'nullable|string|max:20',
                'contact_person_email' => 'nullable|email|max:255',
                'client_id' => 'required|integer|exists:clients,id',
                'sol_office_id' => 'nullable|integer|exists:sol_offices,id',
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
            DB::table('service_locations')->where('id', $id)->update([
                'location_code' => $request->location_code ?? $location->location_code,
                'location_name' => $request->location_name,
                'unique_id' => $request->unique_id,
                'short_name' => $request->short_name,
                'city' => $request->city,
                'full_address' => $request->full_address,
                'contact_person_name' => $request->contact_person_name,
                'contact_person_phone' => $request->contact_person_phone,
                'contact_person_email' => $request->contact_person_email,
                'client_id' => $request->client_id,
                'sol_office_id' => $request->sol_office_id,
                'is_active' => $request->boolean('is_active', true),
                'updated_at' => now(),

                // Update old fields
                'address' => $request->full_address,
                'contact_name' => $request->contact_person_name,
                'contact_phone' => $request->contact_person_phone,
                'contact_email' => $request->contact_person_email,
            ]);

            // Get updated location with relationships
            $updatedLocation = DB::table('service_locations')
                ->join('clients', 'service_locations.client_id', '=', 'clients.id')
                ->leftJoin('sol_offices', 'service_locations.sol_office_id', '=', 'sol_offices.id')
                ->select(
                    'service_locations.*',
                    'clients.name as client_name',
                    'clients.client_code',
                    'sol_offices.office_name as sol_office_name',
                    'sol_offices.state_name as sol_office_state'
                )
                ->where('service_locations.id', $id)
                ->first();

            return response()->json([
                'success' => true,
                'data' => $updatedLocation,
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

    /**
     * Bulk import service locations from CSV
     */
    public function bulkImport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|integer|exists:clients,id',
            'sol_office_id' => 'required|integer|exists:sol_offices,id',
            'file' => 'required|file|mimes:csv,txt|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $clientId = $request->client_id;
            $solOfficeId = $request->sol_office_id;

            // Get client info for code generation
            $client = DB::table('clients')->where('id', $clientId)->first();
            if (!$client) {
                throw new Exception('Client not found');
            }

            // Read CSV file
            $csvData = array_map('str_getcsv', file($file->getPathname()));
            $headers = array_map('trim', array_shift($csvData)); // Remove header row and trim

            $totalProcessed = 0;
            $successCount = 0;
            $errorCount = 0;
            $errors = [];

            DB::beginTransaction();

            foreach ($csvData as $index => $row) {
                $totalProcessed++;
                $rowNumber = $index + 2; // Account for header row

                try {
                    // Skip empty rows
                    if (empty(array_filter($row))) {
                        continue;
                    }

                    // Map CSV data to fields
                    $data = array_combine($headers, $row);

                    // Clean and validate data
                    $uniqueId = trim($data['unique_id'] ?? '');
                    $locationName = trim($data['location_name'] ?? '');
                    $shortName = trim($data['short_name'] ?? '');
                    $city = trim($data['city'] ?? '');
                    $fullAddress = trim($data['full_address'] ?? '');
                    $contactPersonName = trim($data['contact_person_name'] ?? '');
                    $contactPersonPhone = trim($data['contact_person_phone'] ?? '');
                    $contactPersonEmail = trim($data['contact_person_email'] ?? '');

                    // Validate required fields
                    if (empty($locationName) || empty($city)) {
                        $errors[] = [
                            'row' => $rowNumber,
                            'message' => 'Location name and city are required'
                        ];
                        $errorCount++;
                        continue;
                    }

                    // Generate location code
                    $cityCode = strtoupper(substr($city, 0, 3));
                    $timestamp = now()->format('His');
                    $locationCode = $client->client_code . '-' . $cityCode . '-' . $timestamp . $rowNumber;

                    // Check if location already exists
                    $existingLocation = DB::table('service_locations')
                        ->where('client_id', $clientId)
                        ->where(function ($query) use ($uniqueId, $locationCode) {
                            $query->where('unique_id', $uniqueId)
                                ->orWhere('location_code', $locationCode);
                        })
                        ->first();

                    if ($existingLocation) {
                        // Update existing location
                        DB::table('service_locations')
                            ->where('id', $existingLocation->id)
                            ->update([
                                'location_name' => $locationName,
                                'short_name' => $shortName,
                                'city' => $city,
                                'full_address' => $fullAddress,
                                'contact_person_name' => $contactPersonName,
                                'contact_person_phone' => $contactPersonPhone,
                                'contact_person_email' => $contactPersonEmail,
                                'sol_office_id' => $solOfficeId,
                                'updated_at' => now()
                            ]);
                    } else {
                        // Insert new location
                        DB::table('service_locations')->insert([
                            'location_code' => $locationCode,
                            'location_name' => $locationName,
                            'unique_id' => $uniqueId,
                            'short_name' => $shortName,
                            'city' => $city,
                            'full_address' => $fullAddress,
                            'contact_person_name' => $contactPersonName,
                            'contact_person_phone' => $contactPersonPhone,
                            'contact_person_email' => $contactPersonEmail,
                            'client_id' => $clientId,
                            'sol_office_id' => $solOfficeId,
                            'country' => 'Nigeria',
                            'is_active' => 1,
                            'created_by' => Auth::id(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }

                    $successCount++;
                } catch (Exception $e) {
                    $errors[] = [
                        'row' => $rowNumber,
                        'message' => 'Error processing row: ' . $e->getMessage()
                    ];
                    $errorCount++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bulk import completed',
                'data' => [
                    'total_processed' => $totalProcessed,
                    'success_count' => $successCount,
                    'error_count' => $errorCount,
                    'errors' => $errors
                ]
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error processing bulk import: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate location code
     */
    public function generateLocationCode(Request $request)
    {
        try {
            $clientCode = $request->client_code;
            $city = $request->city;

            if (!$clientCode || !$city) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client code and city are required'
                ], 422);
            }

            // Generate code format: CLIENT_CODE-CITY-XXX
            $cityCode = strtoupper(substr($city, 0, 3));
            $timestamp = now()->format('His');
            $locationCode = $clientCode . '-' . $cityCode . '-' . $timestamp;

            return response()->json([
                'success' => true,
                'data' => [
                    'location_code' => $locationCode
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating location code: ' . $e->getMessage()
            ], 500);
        }
    }
}
