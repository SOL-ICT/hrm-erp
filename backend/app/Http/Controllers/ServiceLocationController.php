<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Exception;
use App\Models\SOLOffice;

class ServiceLocationController extends Controller
{
    /**
     * ✅ COMPLETE: Auto-assign SOL office based on city location
     */
    private function autoAssignSOLOffice($city)
    {
        try {
            // Step 1: Find city in states_lgas table to get LGA and state codes
            $locationInfo = DB::table('states_lgas')
                ->where('lga_name', 'LIKE', "%{$city}%")
                ->orWhere('state_name', 'LIKE', "%{$city}%")
                ->select('lga_code', 'state_code', 'lga_name', 'state_name')
                ->first();

            if (!$locationInfo) {
                // If no exact match, try to find by partial match or common city variations
                $locationInfo = $this->findCityByVariations($city);
            }

            if (!$locationInfo) {
                return [
                    'office' => null,
                    'assignment_type' => 'none',
                    'assignment_reason' => "No mapping found for city: {$city}",
                    'location_info' => null
                ];
            }

            // Step 2: Try LGA-level assignment first (highest priority)
            if ($locationInfo->lga_code) {
                $lgaOffice = DB::table('sol_offices')
                    ->where('control_type', 'lga')
                    ->where('is_active', true)
                    ->whereNull('deleted_at')
                    ->whereJsonContains('controlled_areas', $locationInfo->lga_code)
                    ->select('id', 'office_name', 'office_code', 'control_type', 'state_name')
                    ->first();

                if ($lgaOffice) {
                    return [
                        'office' => $lgaOffice,
                        'assignment_type' => 'lga',
                        'assignment_reason' => "Assigned to {$lgaOffice->office_name} (LGA-level control: {$locationInfo->lga_name})",
                        'location_info' => $locationInfo
                    ];
                }
            }

            // Step 3: Fall back to state-level assignment
            if ($locationInfo->state_code) {
                $stateOffice = DB::table('sol_offices')
                    ->where('control_type', 'state')
                    ->where('is_active', true)
                    ->whereNull('deleted_at')
                    ->whereJsonContains('controlled_areas', $locationInfo->state_code)
                    ->select('id', 'office_name', 'office_code', 'control_type', 'state_name')
                    ->first();

                if ($stateOffice) {
                    return [
                        'office' => $stateOffice,
                        'assignment_type' => 'state',
                        'assignment_reason' => "Assigned to {$stateOffice->office_name} (State-level control: {$locationInfo->state_name})",
                        'location_info' => $locationInfo
                    ];
                }
            }

            // Step 4: No assignment possible
            return [
                'office' => null,
                'assignment_type' => 'none',
                'assignment_reason' => "No SOL office controls {$locationInfo->lga_name}, {$locationInfo->state_name}",
                'location_info' => $locationInfo
            ];
        } catch (Exception $e) {
            return [
                'office' => null,
                'assignment_type' => 'error',
                'assignment_reason' => "Error during assignment: " . $e->getMessage(),
                'location_info' => null
            ];
        }
    }

    /**
     * ✅ COMPLETE: Find city by variations and common names
     */
    private function findCityByVariations($city)
    {
        $variations = [
            // Handle common variations
            strtolower(trim($city)),
            ucfirst(strtolower(trim($city))),
            strtoupper(trim($city)),

            // Handle common abbreviations and full names
            'lagos' => ['lagos', 'lag', 'lagos state'],
            'abuja' => ['abuja', 'fct', 'federal capital territory'],
            'kano' => ['kano', 'kn', 'kano state'],
            'ibadan' => ['ibadan', 'oyo', 'oyo state'],
            'ph' => ['port harcourt', 'ph', 'rivers', 'rivers state'],
            'warri' => ['warri', 'delta', 'delta state'],
            'benin' => ['benin city', 'benin', 'edo', 'edo state'],
            'jos' => ['jos', 'plateau', 'plateau state'],
            'kaduna' => ['kaduna', 'kaduna state', 'kd'],
            'maiduguri' => ['maiduguri', 'borno', 'borno state'],
            'calabar' => ['calabar', 'cross river', 'cross river state'],
            'uyo' => ['uyo', 'akwa ibom', 'akwa ibom state'],
            'asaba' => ['asaba', 'delta', 'delta state'],
            'awka' => ['awka', 'anambra', 'anambra state'],
            'owerri' => ['owerri', 'imo', 'imo state'],
            'abakaliki' => ['abakaliki', 'ebonyi', 'ebonyi state'],
            'lokoja' => ['lokoja', 'kogi', 'kogi state'],
            'minna' => ['minna', 'niger', 'niger state'],
            'ilorin' => ['ilorin', 'kwara', 'kwara state'],
            'akure' => ['akure', 'ondo', 'ondo state'],
            'abeokuta' => ['abeokuta', 'ogun', 'ogun state'],
            'osogbo' => ['osogbo', 'osun', 'osun state'],
            'ado ekiti' => ['ado ekiti', 'ekiti', 'ekiti state'],
            'yola' => ['yola', 'adamawa', 'adamawa state'],
            'gombe' => ['gombe', 'gombe state'],
            'jalingo' => ['jalingo', 'taraba', 'taraba state'],
            'makurdi' => ['makurdi', 'benue', 'benue state'],
            'lafia' => ['lafia', 'nasarawa', 'nasarawa state'],
            'bauchi' => ['bauchi', 'bauchi state'],
            'dutse' => ['dutse', 'jigawa', 'jigawa state'],
            'damaturu' => ['damaturu', 'yobe', 'yobe state'],
            'gusau' => ['gusau', 'zamfara', 'zamfara state'],
            'katsina' => ['katsina', 'katsina state'],
            'birnin kebbi' => ['birnin kebbi', 'kebbi', 'kebbi state'],
            'sokoto' => ['sokoto', 'sokoto state'],
        ];

        $searchCity = strtolower(trim($city));

        // Check direct variations first
        foreach ($variations as $key => $varList) {
            if (is_array($varList) && in_array($searchCity, $varList)) {
                $searchTerm = $key;
                break;
            }
        }

        if (!isset($searchTerm)) {
            $searchTerm = $searchCity;
        }

        // Try multiple search strategies
        $searchStrategies = [
            // Exact LGA match
            function ($term) {
                return DB::table('states_lgas')
                    ->where('lga_name', 'LIKE', $term)
                    ->select('lga_code', 'state_code', 'lga_name', 'state_name')
                    ->first();
            },
            // Partial LGA match
            function ($term) {
                return DB::table('states_lgas')
                    ->where('lga_name', 'LIKE', "%{$term}%")
                    ->select('lga_code', 'state_code', 'lga_name', 'state_name')
                    ->first();
            },
            // State name match
            function ($term) {
                return DB::table('states_lgas')
                    ->where('state_name', 'LIKE', "%{$term}%")
                    ->select('lga_code', 'state_code', 'lga_name', 'state_name')
                    ->first();
            },
            // Word boundary search
            function ($term) {
                return DB::table('states_lgas')
                    ->whereRaw("lga_name REGEXP '[[:<:]]{$term}[[:>:]]'")
                    ->select('lga_code', 'state_code', 'lga_name', 'state_name')
                    ->first();
            }
        ];

        foreach ($searchStrategies as $strategy) {
            $result = $strategy($searchTerm);
            if ($result) {
                return $result;
            }
        }

        return null;
    }

    /**
     * ✅ COMPLETE: Enhanced create method with auto-assignment
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|integer|exists:clients,id',
            'location_name' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'unique_id' => 'nullable|string|max:50',
            'short_name' => 'nullable|string|max:100',
            'full_address' => 'nullable|string',
            'contact_person_name' => 'nullable|string|max:255',
            'contact_person_phone' => 'nullable|string|max:20',
            'contact_person_email' => 'nullable|email|max:255',
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

            // Get client info for code generation
            $client = DB::table('clients')->where('id', $request->client_id)->first();
            if (!$client) {
                throw new Exception('Client not found');
            }

            // ✅ AUTO-ASSIGN SOL OFFICE
            $autoAssignment = $this->autoAssignSOLOffice($request->city);
            $solOfficeId = null;
            if (isset($autoAssignment['office']) && $autoAssignment['office'] !== null) {
                $solOfficeId = $autoAssignment['office']->id;
            }

            // Generate location code if not provided
            $locationCode = $request->unique_id ?: $this->generateLocationCode($client->prefix, $request->city);

            // Create the service location
            $locationId = DB::table('service_locations')->insertGetId([
                'client_id' => $request->client_id,
                'sol_office_id' => $solOfficeId,
                'location_name' => $request->location_name,
                'location_code' => $locationCode,
                'city' => $request->city,
                'unique_id' => $request->unique_id,
                'short_name' => $request->short_name,
                'full_address' => $request->full_address,
                'contact_person_name' => $request->contact_person_name,
                'contact_person_phone' => $request->contact_person_phone,
                'contact_person_email' => $request->contact_person_email,
                'is_active' => $request->boolean('is_active', true),
                'created_by' => Auth::id(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Service location created successfully',
                'data' => [
                    'id' => $locationId,
                    'auto_assignment' => $autoAssignment
                ]
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating service location: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ COMPLETE: Enhanced update method with auto-assignment
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|integer|exists:clients,id',
            'location_name' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'unique_id' => 'nullable|string|max:50',
            'short_name' => 'nullable|string|max:100',
            'full_address' => 'nullable|string',
            'contact_person_name' => 'nullable|string|max:255',
            'contact_person_phone' => 'nullable|string|max:20',
            'contact_person_email' => 'nullable|email|max:255',
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
            // Check if location exists
            $existingLocation = DB::table('service_locations')->where('id', $id)->first();
            if (!$existingLocation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service location not found'
                ], 404);
            }

            DB::beginTransaction();

            // ✅ AUTO-ASSIGN SOL OFFICE if city changed
            $autoAssignment = null;
            $solOfficeId = $existingLocation->sol_office_id;

            if ($existingLocation->city !== $request->city) {
                $autoAssignment = $this->autoAssignSOLOffice($request->city);
                if (isset($autoAssignment['office']) && $autoAssignment['office'] !== null) {
                    $solOfficeId = $autoAssignment['office']->id;
                } else {
                    $solOfficeId = null;
                }
            }

            // Update the service location
            DB::table('service_locations')
                ->where('id', $id)
                ->update([
                    'client_id' => $request->client_id,
                    'sol_office_id' => $solOfficeId,
                    'location_name' => $request->location_name,
                    'city' => $request->city,
                    'unique_id' => $request->unique_id,
                    'short_name' => $request->short_name,
                    'full_address' => $request->full_address,
                    'contact_person_name' => $request->contact_person_name,
                    'contact_person_phone' => $request->contact_person_phone,
                    'contact_person_email' => $request->contact_person_email,
                    'is_active' => $request->boolean('is_active'),
                    'updated_at' => now()
                ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Service location updated successfully',
                'data' => [
                    'id' => $id,
                    'auto_assignment' => $autoAssignment
                ]
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error updating service location: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ COMPLETE: Bulk import with auto-assignment logic
     */
    public function bulkImport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|integer|exists:clients,id',
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

            // Get client info for code generation
            $client = DB::table('clients')->where('id', $clientId)->first();
            if (!$client) {
                throw new Exception('Client not found');
            }

            // Read CSV file
            $csvData = array_map('str_getcsv', file($file->getPathname()));
            $headers = array_map('trim', array_shift($csvData));

            // Validate required headers
            $requiredHeaders = ['location_name', 'city'];
            $missingHeaders = array_diff($requiredHeaders, $headers);
            if (!empty($missingHeaders)) {
                throw new Exception('Missing required headers: ' . implode(', ', $missingHeaders));
            }

            $totalProcessed = 0;
            $successCount = 0;
            $errorCount = 0;
            $errors = [];
            $assignmentSummary = [
                'lga_assignments' => 0,
                'state_assignments' => 0,
                'no_assignments' => 0,
                'assignment_details' => []
            ];

            DB::beginTransaction();

            foreach ($csvData as $index => $row) {
                $totalProcessed++;
                $rowNumber = $index + 2; // +2 because we removed headers and start from 1

                try {
                    // Skip empty rows
                    if (empty(array_filter($row))) {
                        continue;
                    }

                    // Map CSV data to fields (handle missing columns gracefully)
                    $data = [];
                    foreach ($headers as $i => $header) {
                        $data[$header] = isset($row[$i]) ? trim($row[$i]) : '';
                    }

                    // Clean and validate required data
                    $locationName = $data['location_name'] ?? '';
                    $city = $data['city'] ?? '';

                    if (empty($locationName) || empty($city)) {
                        throw new Exception('Location name and city are required');
                    }

                    // ✅ AUTO-ASSIGN SOL OFFICE for each location
                    $autoAssignment = $this->autoAssignSOLOffice($city);
                    if (isset($autoAssignment['office']) && $autoAssignment['office'] !== null) {
                        $solOfficeId = $autoAssignment['office']->id;
                    } else {
                        $solOfficeId = null;
                    }

                    // Track assignment statistics
                    if ($autoAssignment['assignment_type'] === 'lga') {
                        $assignmentSummary['lga_assignments']++;
                    } elseif ($autoAssignment['assignment_type'] === 'state') {
                        $assignmentSummary['state_assignments']++;
                    } else {
                        $assignmentSummary['no_assignments']++;
                    }

                    // Store assignment details for reporting
                    $officeName = null;
                    if (isset($autoAssignment['office']) && $autoAssignment['office'] !== null) {
                        $officeName = $autoAssignment['office']->office_name;
                    }
                    $assignmentSummary['assignment_details'][] = [
                        'row' => $rowNumber,
                        'city' => $city,
                        'location_name' => $locationName,
                        'assignment_type' => $autoAssignment['assignment_type'],
                        'office_name' => $officeName,
                        'reason' => $autoAssignment['assignment_reason']
                    ];

                    // Generate location code
                    $locationCode = $data['unique_id'] ?? $this->generateLocationCode($client->prefix, $city);

                    // Get state from SOL office if assigned
                    $state = null;
                    if ($solOfficeId && isset($autoAssignment['office'])) {
                        $state = $autoAssignment['office']->state_name ?? null;
                    }

                    // Insert service location
                    $inserted = DB::table('service_locations')->insert([
                        'client_id' => $clientId,
                        'sol_office_id' => $solOfficeId,
                        'location_name' => $locationName,
                        'location_code' => $locationCode,
                        'city' => $city,
                        'state' => $state,
                        'unique_id' => $data['unique_id'] ?? null,
                        'short_name' => $data['short_name'] ?? null,
                        'full_address' => $data['full_address'] ?? null,
                        'contact_person_name' => $data['contact_person_name'] ?? null,
                        'contact_person_phone' => $data['contact_person_phone'] ?? null,
                        'contact_person_email' => $data['contact_person_email'] ?? null,
                        'is_active' => true,
                        'created_by' => Auth::id(),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    if (!$inserted) {
                        throw new Exception('Failed to insert location into database');
                    }

                    $successCount++;
                } catch (Exception $e) {
                    $errorCount++;
                    $errors[] = [
                        'row' => $rowNumber,
                        'message' => $e->getMessage(),
                        'data' => $data ?? []
                    ];

                    // Continue processing other rows
                    continue;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Bulk import completed. {$successCount} locations imported successfully.",
                'data' => [
                    'total_processed' => $totalProcessed,
                    'success_count' => $successCount,
                    'error_count' => $errorCount,
                    'errors' => $errors,
                    'assignment_summary' => $assignmentSummary
                ]
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error during bulk import: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ NEW: Test auto-assignment for a specific city
     */
    public function testAutoAssignment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'city' => 'required|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'City is required',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $assignment = $this->autoAssignSOLOffice($request->city);

            return response()->json([
                'success' => true,
                'data' => $assignment
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error testing auto-assignment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ NEW: Download CSV template for bulk upload
     */
    public function downloadTemplate(Request $request)
    {
        try {
            $headers = [
                'unique_id',
                'location_name',
                'short_name',
                'city',
                'full_address',
                'contact_person_name',
                'contact_person_phone',
                'contact_person_email'
            ];

            // Get client contact details if client_id is provided
            $contactPersonName = '';
            $contactPersonPhone = '';
            $contactPersonEmail = '';

            if ($request->has('client_id')) {
                $client = DB::table('clients')
                    ->where('id', $request->client_id)
                    ->select('contact_person_name', 'phone', 'firs_contact_email', 'organisation_name')
                    ->first();

                if ($client) {
                    $contactPersonName = $client->contact_person_name ?? '';
                    $contactPersonPhone = $client->phone ?? '';
                    $contactPersonEmail = $client->firs_contact_email ?? '';
                }
            }

            // Sample data with pre-filled contact details from client
            $sampleData = [
                [
                    'LOC001',
                    'Lagos Main Office',
                    'LMO',
                    'Ikeja',
                    '123 Allen Avenue, Ikeja, Lagos',
                    $contactPersonName ?: 'John Doe',
                    $contactPersonPhone ?: '08012345678',
                    $contactPersonEmail ?: 'john.doe@example.com'
                ],
                [
                    'LOC002',
                    'Abuja Branch',
                    'ABB',
                    'Abuja',
                    '456 Central Business District, Abuja',
                    $contactPersonName ?: 'Jane Smith',
                    $contactPersonPhone ?: '08087654321',
                    $contactPersonEmail ?: 'jane.smith@example.com'
                ],
                [
                    'LOC003',
                    'Port Harcourt Office',
                    'PHO',
                    'Port Harcourt',
                    '789 Aba Road, Port Harcourt, Rivers',
                    $contactPersonName ?: 'Mike Johnson',
                    $contactPersonPhone ?: '08011223344',
                    $contactPersonEmail ?: 'mike.johnson@example.com'
                ]
            ];

            $filename = 'service_locations_template.csv';
            $output = fopen('php://temp', 'r+');

            // Write headers
            fputcsv($output, $headers);

            // Write sample data
            foreach ($sampleData as $row) {
                fputcsv($output, $row);
            }

            rewind($output);
            $csvContent = stream_get_contents($output);
            fclose($output);

            return response($csvContent)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ NEW: Get client contact details for auto-fill
     */
    public function getClientContactDetails($clientId)
    {
        try {
            $client = DB::table('clients')
                ->where('id', $clientId)
                ->select('contact_person_name', 'phone', 'firs_contact_email')
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'contact_person_name' => $client->contact_person_name ?? '',
                    'contact_person_phone' => $client->phone ?? '',
                    'contact_person_email' => $client->firs_contact_email ?? ''
                ],
                'message' => 'Client contact details retrieved successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching client contact details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ NEW: Get assignment statistics
     */
    public function getAssignmentStats(Request $request)
    {
        try {
            $query = DB::table('service_locations as sl')
                ->leftJoin('sol_offices as so', 'sl.sol_office_id', '=', 'so.id')
                ->leftJoin('clients as c', 'sl.client_id', '=', 'c.id');

            // Filter by client if specified
            if ($request->filled('client_id')) {
                $query->where('sl.client_id', $request->client_id);
            }

            $stats = [
                'total_locations' => $query->count(),
                'assigned_locations' => $query->whereNotNull('sl.sol_office_id')->count(),
                'unassigned_locations' => $query->whereNull('sl.sol_office_id')->count(),
                'lga_assignments' => $query->where('so.control_type', 'lga')->count(),
                'state_assignments' => $query->where('so.control_type', 'state')->count(),
                'assignment_by_office' => $query->select('so.office_name', DB::raw('COUNT(*) as count'))
                    ->whereNotNull('sl.sol_office_id')
                    ->groupBy('so.id', 'so.office_name')
                    ->get(),
                'unassigned_cities' => $query->select('sl.city', DB::raw('COUNT(*) as count'))
                    ->whereNull('sl.sol_office_id')
                    ->groupBy('sl.city')
                    ->get(),
                'coverage_by_state' => DB::table('states_lgas as slg')
                    ->leftJoin('service_locations as sl', 'slg.state_code', '=', DB::raw('(SELECT state_code FROM states_lgas WHERE lga_name LIKE CONCAT("%", sl.city, "%") OR state_name LIKE CONCAT("%", sl.city, "%") LIMIT 1)'))
                    ->leftJoin('sol_offices as so', 'sl.sol_office_id', '=', 'so.id')
                    ->select(
                        'slg.state_name',
                        DB::raw('COUNT(DISTINCT sl.id) as total_locations'),
                        DB::raw('COUNT(DISTINCT CASE WHEN sl.sol_office_id IS NOT NULL THEN sl.id END) as assigned_locations')
                    )
                    ->groupBy('slg.state_code', 'slg.state_name')
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching assignment statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ NEW: Bulk reassign locations
     */
    public function bulkReassign(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'location_ids' => 'required|array|min:1',
            'location_ids.*' => 'integer|exists:service_locations,id',
            'new_sol_office_id' => 'nullable|integer|exists:sol_offices,id',
            'reason' => 'nullable|string|max:500'
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

            $updatedCount = DB::table('service_locations')
                ->whereIn('id', $request->location_ids)
                ->update([
                    'sol_office_id' => $request->new_sol_office_id,
                    'updated_at' => now()
                ]);

            // Log the reassignment for audit trail
            foreach ($request->location_ids as $locationId) {
                DB::table('audit_logs')->insert([
                    'table_name' => 'service_locations',
                    'record_id' => $locationId,
                    'action' => 'bulk_reassign',
                    'old_values' => json_encode(['reason' => $request->reason]),
                    'new_values' => json_encode(['new_sol_office_id' => $request->new_sol_office_id]),
                    'user_id' => Auth::check() ? Auth::id() : 1,
                    'created_at' => now()
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$updatedCount} locations reassigned successfully",
                'data' => [
                    'updated_count' => $updatedCount,
                    'new_sol_office_id' => $request->new_sol_office_id
                ]
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error during bulk reassignment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ HELPER: Generate location code
     */
    private function generateLocationCode($clientPrefix, $city)
    {
        // Create a simple location code: CLIENT_PREFIX-CITY_INITIALS-SEQUENCE
        $cityInitials = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $city), 0, 3));

        // Get next sequence number for this client and city combination
        $lastLocation = DB::table('service_locations')
            ->where('location_code', 'LIKE', "{$clientPrefix}-{$cityInitials}-%")
            ->orderBy('location_code', 'desc')
            ->first();

        $sequence = 1;
        if ($lastLocation) {
            $parts = explode('-', $lastLocation->location_code);
            if (count($parts) >= 3 && is_numeric(end($parts))) {
                $sequence = (int)end($parts) + 1;
            }
        }

        return sprintf('%s-%s-%03d', $clientPrefix, $cityInitials, $sequence);
    }

    /**
     * ✅ EXISTING METHODS: Keep all your existing methods
     * (index, show, destroy, getByClient, etc.)
     */

    public function index(Request $request)
    {
        try {
            $query = DB::table('service_locations as sl')
                ->leftJoin('clients as c', 'sl.client_id', '=', 'c.id')
                ->leftJoin('sol_offices as so', 'sl.sol_office_id', '=', 'so.id')
                ->select(
                    'sl.*',
                    'c.organisation_name as client_name',
                    'c.prefix as client_code',
                    'so.office_name as sol_office_name',
                    'so.office_code as sol_office_code'
                );

            // Apply filters
            if ($request->filled('client_id')) {
                $query->where('sl.client_id', $request->client_id);
            }

            if ($request->filled('sol_office_id')) {
                $query->where('sl.sol_office_id', $request->sol_office_id);
            }

            if ($request->filled('city')) {
                $query->where('sl.city', 'LIKE', '%' . $request->city . '%');
            }

            if ($request->filled('is_active')) {
                $query->where('sl.is_active', $request->boolean('is_active'));
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('sl.location_name', 'LIKE', "%{$search}%")
                        ->orWhere('sl.location_code', 'LIKE', "%{$search}%")
                        ->orWhere('sl.city', 'LIKE', "%{$search}%");
                });
            }

            $locations = $query->orderBy('sl.location_name')->get();

            return response()->json([
                'success' => true,
                'data' => $locations
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching service locations: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $location = DB::table('service_locations as sl')
                ->leftJoin('clients as c', 'sl.client_id', '=', 'c.id')
                ->leftJoin('sol_offices as so', 'sl.sol_office_id', '=', 'so.id')
                ->where('sl.id', $id)
                ->select(
                    'sl.*',
                    'c.organisation_name as client_name',
                    'c.prefix as client_code',
                    'so.office_name as sol_office_name',
                    'so.office_code as sol_office_code'
                )
                ->first();

            if (!$location) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service location not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $location
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching service location: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $deleted = DB::table('service_locations')->where('id', $id)->delete();

            if ($deleted === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service location not found'
                ], 404);
            }

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

    public function getByClient($clientId)
    {
        try {
            $locations = DB::table('service_locations')
                ->leftJoin('sol_offices', 'service_locations.sol_office_id', '=', 'sol_offices.id')
                ->where('service_locations.client_id', $clientId)
                ->select(
                    'service_locations.*',
                    'sol_offices.office_name as sol_office_name',
                    'sol_offices.office_code as sol_office_code'
                )
                ->orderBy('service_locations.location_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $locations
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching client locations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get service locations grouped by client
     */
    public function getGroupedByClient(Request $request)
    {
        try {
            $query = DB::table('service_locations as sl')
                ->leftJoin('clients as c', 'sl.client_id', '=', 'c.id')
                ->leftJoin('sol_offices as so', 'sl.sol_office_id', '=', 'so.id')
                ->select(
                    'sl.*',
                    'c.organisation_name as client_name',
                    'c.prefix as client_code',
                    'so.office_name as sol_office_name',
                    'so.office_code as sol_office_code'
                );

            // Apply filters
            if ($request->filled('client_id')) {
                $query->where('sl.client_id', $request->client_id);
            }

            if ($request->filled('status')) {
                if ($request->status === 'active') {
                    $query->where('sl.is_active', true);
                } elseif ($request->status === 'inactive') {
                    $query->where('sl.is_active', false);
                }
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('sl.location_name', 'LIKE', "%{$search}%")
                      ->orWhere('sl.city', 'LIKE', "%{$search}%")
                      ->orWhere('sl.lga', 'LIKE', "%{$search}%")
                      ->orWhere('c.organisation_name', 'LIKE', "%{$search}%");
                });
            }

            $locations = $query->orderBy('c.organisation_name')
                              ->orderBy('sl.location_name')
                              ->get();

            // Group locations by client
            $groupedData = [];
            $clientStats = [];

            foreach ($locations as $location) {
                $clientName = $location->client_name ?? 'Unknown Client';
                
                if (!isset($groupedData[$clientName])) {
                    $groupedData[$clientName] = [
                        'client_id' => $location->client_id,
                        'client_name' => $clientName,
                        'client_code' => $location->client_code,
                        'locations' => [],
                        'stats' => [
                            'total_locations' => 0,
                            'active_locations' => 0,
                            'inactive_locations' => 0,
                            'assigned_to_sol' => 0,
                            'cities' => []
                        ]
                    ];
                }

                // Add location to client group
                $groupedData[$clientName]['locations'][] = $location;
                
                // Update stats
                $groupedData[$clientName]['stats']['total_locations']++;
                
                if ($location->is_active) {
                    $groupedData[$clientName]['stats']['active_locations']++;
                } else {
                    $groupedData[$clientName]['stats']['inactive_locations']++;
                }
                
                if ($location->sol_office_id) {
                    $groupedData[$clientName]['stats']['assigned_to_sol']++;
                }
                
                if ($location->city && !in_array($location->city, $groupedData[$clientName]['stats']['cities'])) {
                    $groupedData[$clientName]['stats']['cities'][] = $location->city;
                }
            }

            // Return as object (associative array) for frontend Object.entries() usage
            return response()->json([
                'success' => true,
                'data' => $groupedData,
                'message' => 'Service locations grouped by client retrieved successfully'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching grouped service locations: ' . $e->getMessage()
            ], 500);
        }
    }
}
