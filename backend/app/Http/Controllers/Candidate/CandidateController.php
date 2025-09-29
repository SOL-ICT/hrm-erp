<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CandidateController extends Controller
{
    /**
     * Get all Nigerian states and their LGAs
     */
    public function getStatesLgas()
    {
        try {
            // Get all states and LGAs from the states_lgas table, including zone and ID
            $statesData = DB::table('states_lgas')
                ->select('id', 'state_name', 'state_code', 'zone', 'lga_name', 'lga_code', 'is_capital')
                ->where('is_active', 1) // Only get active records
                ->orderBy('state_name')
                ->orderBy('lga_name')
                ->get();

            // Group LGAs by state, include zone
            $statesWithLgas = [];
            foreach ($statesData as $row) {
                $stateName = $row->state_name;
                if (!isset($statesWithLgas[$stateName])) {
                    $statesWithLgas[$stateName] = [
                        'state' => $stateName,
                        'code' => $row->state_code,
                        'zone' => $row->zone,
                        'lgas' => []
                    ];
                }
                $statesWithLgas[$stateName]['lgas'][] = [
                    'id' => $row->id, // Include the states_lgas ID
                    'name' => $row->lga_name,
                    'code' => $row->lga_code,
                    'isCapital' => (bool) $row->is_capital
                ];
            }

            // Convert to array format expected by frontend
            $states = array_values($statesWithLgas);

            // Also create a flat list of unique states for dropdowns
            $uniqueStates = [];
            foreach ($statesWithLgas as $stateData) {
                $uniqueStates[] = [
                    'name' => $stateData['state'],
                    'code' => $stateData['code']
                ];
            }

            return response()->json([
                'status' => 'success',
                'states' => $states,
                'uniqueStates' => $uniqueStates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch states and LGAs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get candidate profile (FIXED for field mapping)
     */
    public function getProfile($id)
    {
        try {
            // Get basic info from candidates table
            $candidate = DB::table('candidates')->find($id);
            if (!$candidate) {
                return response()->json(['error' => 'Candidate not found'], 404);
            }

            // Get extended info from candidate_profiles table
            $profile = DB::table('candidate_profiles')->where('candidate_id', $id)->first();

            // If no profile exists, create a basic one
            if (!$profile) {
                DB::table('candidate_profiles')->insert([
                    'candidate_id' => $id,
                    'nationality' => 'Nigeria',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
                $profile = DB::table('candidate_profiles')->where('candidate_id', $id)->first();
            }

            // ✅ FIXED: Correct field mapping based on actual database schema
            $mergedData = [
                // From candidates table
                'id' => $candidate->id,
                'first_name' => $candidate->first_name,
                'last_name' => $candidate->last_name,
                'email' => $candidate->email,
                'date_of_birth' => $candidate->date_of_birth,
                'phone_primary' => $candidate->phone, // ✅ candidates.phone maps to frontend phone_primary
                'status' => $candidate->status,

                // From candidate_profiles table - FIXED field names
                'candidate_id' => $profile->candidate_id ?? $id,
                'middle_name' => $profile->middle_name ?? '',
                'formal_name' => $profile->formal_name ?? '',
                'gender' => $profile->gender ?? '',
                'marital_status' => $profile->marital_status ?? '',
                'nationality' => $profile->nationality ?? 'Nigeria',
                'state_of_origin' => $profile->state_of_origin ?? '',
                'local_government' => $profile->local_government ?? '',
                'state_of_residence' => $profile->state_of_residence ?? '',
                'local_government_residence' => $profile->local_government_residence ?? '',
                'national_id_no' => $profile->national_id_no ?? '',
                'phone_secondary' => $profile->phone_secondary ?? '',
                // 'address_current' => $profile->address_current ?? '',
                // 'address_permanent' => $profile->address_permanent ?? '',
                'blood_group' => $profile->blood_group ?? '',

                // Default fields for frontend compatibility
                'position' => 'Candidate',
                'department' => 'Human Resources',
                'employee_id' => 'CAND' . $id,

                // Current address
                'state_of_residence_current'         => $profile->state_of_residence_current ?? '',
                'local_government_residence_current' => $profile->local_government_residence_current ?? '',
                'address_current'                    => $profile->address_current ?? '',
                'address_line_2_current'             => $profile->address_line_2_current ?? '',

                // Permanent address
                'state_of_residence_permanent'         => $profile->state_of_residence_permanent ?? '',
                'local_government_residence_permanent' => $profile->local_government_residence_permanent ?? '',
                'address_permanent'                     => $profile->address_permanent ?? '',
                'address_line_2_permanent'              => $profile->address_line_2_permanent ?? '',


            ];


            // Return the merged profile data
            // Now tack on the “full” current and permanent addresses:
            $mergedData['full_current_address'] = collect([
                $mergedData['state_of_residence_current'],
                $mergedData['local_government_residence_current'],
                $mergedData['address_current'],
                $mergedData['address_line_2_current'],
            ])
                ->filter()    // drop any empty values
                ->implode(', ');

            $mergedData['full_permanent_address'] = collect([
                $mergedData['state_of_residence_permanent'],
                $mergedData['local_government_residence_permanent'],
                $mergedData['address_permanent'],
                $mergedData['address_line_2_permanent'],
            ])
                ->filter()
                ->implode(', ');

            // Then return it as before:
            // return response()->json([
            //     'status'       => 'success',
            //     'profile'      => (object) $mergedData,
            //     'basic_info'   => $candidate,
            //     'extended_info'=> $profile,
            // ]);

            return response()->json([
                'status' => 'success',
                'profile' => (object) $mergedData,
                'basic_info' => $candidate,
                'extended_info' => $profile
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch profile: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Update candidate profile (FIXED for field mapping)
     */
    public function updateProfile(Request $request, $id)
    {
        // Add logging
        Log::info('Profile update attempt', [
            'candidate_id' => $id,
            'request_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            // Basic fields (go to candidates table)
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'date_of_birth' => 'nullable|date',
            'phone_primary' => 'required|string|max:255', // Frontend sends phone_primary

            // Extended fields (go to candidate_profiles table)
            'middle_name' => 'nullable|string|max:255',
            'formal_name' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female',
            'marital_status' => 'nullable|in:single,married,divorced,widowed',
            'nationality' => 'nullable|string|max:255',
            'state_of_origin' => 'nullable|string|max:255',
            'local_government' => 'nullable|string|max:255',
            'state_lga_id' => 'nullable|integer|exists:states_lgas,id', // Proper state/LGA reference for permanent address
            'current_address_state_lga_id' => 'nullable|integer|exists:states_lgas,id', // Proper state/LGA reference for current address
            'state_of_residence' => 'nullable|string|max:255',
            'local_government_residence' => 'nullable|string|max:255',
            'national_id_no' => 'nullable|string|max:255',
            'phone_secondary' => 'nullable|string|max:255',
            'address_current' => 'nullable|string',
            'address_permanent' => 'nullable|string',
            'blood_group' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            // Additional fields for frontend compatibility

            // → Current Address
            'state_of_residence_current'            => 'nullable|string|max:255',
            'local_government_residence_current'    => 'nullable|string|max:255',
            'address_current'                       => 'nullable|string',
            'address_line_2_current'                => 'nullable|string',

            // → Permanent Address
            'state_of_residence_permanent'          => 'nullable|string|max:255',
            'local_government_residence_permanent'  => 'nullable|string|max:255',
            'address_permanent'                     => 'nullable|string',
            'address_line_2_permanent'              => 'nullable|string',

        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $validated = $validator->validated();

            // ✅ FIXED: Correct field mapping - only use fields that exist in database
            $candidateFields = ['first_name', 'last_name', 'email', 'date_of_birth', 'phone_primary'];
            $profileFields = [
                'middle_name',
                'formal_name',
                'gender',
                'marital_status',
                'nationality',
                'state_of_origin',
                'local_government',
                'state_lga_id', // Primary state/LGA reference field for permanent address
                'current_address_state_lga_id', // Primary state/LGA reference field for current address
                'state_of_residence',
                'local_government_residence',
                'national_id_no',
                'phone_secondary',
                'address_current',
                'address_permanent',
                'blood_group',
                // Add permanent address fields - these DO exist in the table
                'state_of_residence_permanent',
                'local_government_residence_permanent',
                'address_line_2_permanent',
                // Add current address fields
                'state_of_residence_current',
                'local_government_residence_current',
                'address_line_2_current'
            ];
            // Prepare data for candidates and profiles tables
            $candidateData = [];
            $profileData = [];

            foreach ($validated as $key => $value) {
                if (in_array($key, $candidateFields)) {
                    // ✅ FIXED: phone_primary from frontend -> phone in candidates table
                    if ($key === 'phone_primary') {
                        $candidateData['phone'] = $value;
                    } else {
                        $candidateData[$key] = $value;
                    }
                } elseif (in_array($key, $profileFields)) {
                    $profileData[$key] = $value;
                }
            }

            // Update candidates table
            if (!empty($candidateData)) {
                DB::table('candidates')
                    ->where('id', $id)
                    ->update(array_merge($candidateData, ['updated_at' => now()]));
            }

            // Update candidate_profiles table
            $existingProfile = DB::table('candidate_profiles')->where('candidate_id', $id)->first();

            if ($existingProfile) {
                DB::table('candidate_profiles')
                    ->where('candidate_id', $id)
                    ->update(array_merge($profileData, ['updated_at' => now()]));
            } else {
                DB::table('candidate_profiles')->insert(
                    array_merge($profileData, [
                        'candidate_id' => $id,
                        'created_at' => now(),
                        'updated_at' => now()
                    ])
                );
            }

            // Return updated profile using getProfile method
            return $this->getProfile($id);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to save profile: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Get candidate education records
     */
    public function getEducation($id)
    {
        try {
            // Get primary education
            $primaryEducation = DB::table('candidate_primary_education')
                ->where('candidate_id', $id)
                ->first();

            // Get secondary education
            $secondaryEducation = DB::table('candidate_secondary_education')
                ->where('candidate_id', $id)
                ->get();

            // Get tertiary education
            $tertiaryEducation = DB::table('candidate_tertiary_education')
                ->where('candidate_id', $id)
                ->get();

            return response()->json([
                'status' => 'success',
                'education' => [
                    'primary' => $primaryEducation,
                    'secondary' => $secondaryEducation,
                    'tertiary' => $tertiaryEducation
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch education records: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get candidate experience records
     */
    public function getExperience($id)
    {
        try {
            $experience = DB::table('candidate_experience')
                ->where('candidate_id', $id)
                ->orderBy('start_date', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $experience
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch experience records: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get candidate emergency contacts
     */
    public function getEmergencyContacts($id)
    {
        try {
            $contacts = DB::table('candidate_emergency_contacts')
                ->where('candidate_id', $id)
                ->orderBy('is_primary', 'desc')
                ->orderBy('contact_type')
                ->get();

            return response()->json([
                'status' => 'success',
                'contacts' => $contacts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch emergency contacts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard statistics for candidate
     */
    public function getDashboardStats($id)
    {
        try {
            $candidate = DB::table('candidates')->find($id);
            if (!$candidate) {
                return response()->json(['error' => 'Candidate not found'], 404);
            }

            $profile = DB::table('candidate_profiles')->where('candidate_id', $id)->first();

            // Calculate profile completion
            $completedFields = 0;
            $totalFields = 10; // Adjust based on required fields

            // Check basic fields from candidates
            if ($candidate->first_name) $completedFields++;
            if ($candidate->last_name) $completedFields++;
            if ($candidate->phone) $completedFields++;
            if ($candidate->email) $completedFields++;

            // Check extended fields from profiles
            if ($profile) {
                if ($profile->gender) $completedFields++;
                if ($profile->nationality) $completedFields++;
                if ($profile->state_of_origin) $completedFields++;
                if ($profile->address_current) $completedFields++;
            }

            // Check related data
            $hasEducation = DB::table('candidate_education')->where('candidate_id', $id)->exists();
            $hasExperience = DB::table('candidate_experience')->where('candidate_id', $id)->exists();

            if ($hasEducation) $completedFields++;
            if ($hasExperience) $completedFields++;

            $completionPercentage = round(($completedFields / $totalFields) * 100);

            return response()->json([
                'status' => 'success',
                'stats' => [
                    'profile_completion' => $completionPercentage,
                    'application_status' => $candidate->status ?? 'pending',
                    'total_education_records' => DB::table('candidate_education')->where('candidate_id', $id)->count(),
                    'total_experience_records' => DB::table('candidate_experience')->where('candidate_id', $id)->count(),
                    'total_emergency_contacts' => DB::table('candidate_emergency_contacts')->where('candidate_id', $id)->count(),
                    'days_since_registration' => now()->diffInDays($candidate->created_at),
                    'last_profile_update' => $profile ? $profile->updated_at : null
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store new education record
     */
    public function storeEducation(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'institution_name' => 'required|string|max:255',
            'qualification_type' => 'required|string|max:255',
            'field_of_study' => 'nullable|string|max:255',
            'grade_result' => 'nullable|string|max:255',
            'start_year' => 'required|integer|min:1950|max:' . (date('Y') + 10),
            'end_year' => 'nullable|integer|min:1950|max:' . (date('Y') + 10),
            'is_current' => 'boolean',
            'certificate_file' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $validated = $validator->validated();

            // If is_current is true, set end_year to null
            if ($validated['is_current']) {
                $validated['end_year'] = null;
            }

            $educationId = DB::table('candidate_education')->insertGetId(
                array_merge($validated, [
                    'candidate_id' => $id,
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );

            $education = DB::table('candidate_education')->find($educationId);

            return response()->json([
                'status' => 'success',
                'message' => 'Education record created successfully',
                'education' => $education
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update education record
     */
    public function updateEducation(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'institution_name' => 'required|string|max:255',
            'qualification_type' => 'required|string|max:255',
            'field_of_study' => 'nullable|string|max:255',
            'grade_result' => 'nullable|string|max:255',
            'start_year' => 'required|integer|min:1950|max:' . (date('Y') + 10),
            'end_year' => 'nullable|integer|min:1950|max:' . (date('Y') + 10),
            'is_current' => 'boolean',
            'certificate_file' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $education = DB::table('candidate_education')->find($id);
            if (!$education) {
                return response()->json(['error' => 'Education record not found'], 404);
            }

            $validated = $validator->validated();

            // If is_current is true, set end_year to null
            if ($validated['is_current']) {
                $validated['end_year'] = null;
            }

            DB::table('candidate_education')
                ->where('id', $id)
                ->update(array_merge($validated, ['updated_at' => now()]));

            $updatedEducation = DB::table('candidate_education')->find($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Education record updated successfully',
                'education' => $updatedEducation
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete education record
     */
    public function deleteEducation($id)
    {
        try {
            $education = DB::table('candidate_education')->find($id);
            if (!$education) {
                return response()->json(['error' => 'Education record not found'], 404);
            }

            DB::table('candidate_education')->where('id', $id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Education record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store new experience record
     */
    public function storeExperience(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'job_description' => 'nullable|string',
            'start_date' => 'required|date|before_or_equal:today',
            'end_date' => 'nullable|date|after:start_date',
            'is_current' => 'boolean',
            'reason_for_leaving' => 'nullable|string|max:255',
            'last_salary' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $validated = $validator->validated();

            // If is_current is true, set end_date to null and clear reason_for_leaving
            if ($validated['is_current']) {
                $validated['end_date'] = null;
                $validated['reason_for_leaving'] = null;
            }

            $experienceId = DB::table('candidate_experience')->insertGetId(
                array_merge($validated, [
                    'candidate_id' => $id,
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );

            $experience = DB::table('candidate_experience')->find($experienceId);

            return response()->json([
                'status' => 'success',
                'message' => 'Experience record created successfully',
                'experience' => $experience
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create experience record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update experience record
     */
    public function updateExperience(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'job_description' => 'nullable|string',
            'start_date' => 'required|date|before_or_equal:today',
            'end_date' => 'nullable|date|after:start_date',
            'is_current' => 'boolean',
            'reason_for_leaving' => 'nullable|string|max:255',
            'last_salary' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $experience = DB::table('candidate_experience')->find($id);
            if (!$experience) {
                return response()->json(['error' => 'Experience record not found'], 404);
            }

            $validated = $validator->validated();

            // If is_current is true, set end_date to null and clear reason_for_leaving
            if ($validated['is_current']) {
                $validated['end_date'] = null;
                $validated['reason_for_leaving'] = null;
            }

            DB::table('candidate_experience')
                ->where('id', $id)
                ->update(array_merge($validated, ['updated_at' => now()]));

            $updatedExperience = DB::table('candidate_experience')->find($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Experience record updated successfully',
                'experience' => $updatedExperience
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update experience record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete experience record
     */
    public function deleteExperience($id)
    {
        try {
            $experience = DB::table('candidate_experience')->find($id);
            if (!$experience) {
                return response()->json(['error' => 'Experience record not found'], 404);
            }

            DB::table('candidate_experience')->where('id', $id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Experience record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete experience record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store new emergency contact
     */
    public function storeEmergencyContact(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'contact_type' => 'required|string|max:255',
            'full_name' => 'required|string|max:255',
            'relationship' => 'required|string|max:255',
            'phone_primary' => 'required|string|max:20',
            'phone_secondary' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'is_primary' => 'boolean',
            'emergency_state_of_residence' => 'nullable|string|max:100', // Maps to emergency_contacts_state_of_residence
            'emergency_local_government_residence' => 'nullable|string|max:100', // Maps to emergency_contacts_local_government_residence
            'emergency_address' => 'nullable|string|max:255', // Maps to emergency_contacts_address
            'emergency_address_line_2' => 'nullable|string|max:255', // Maps to emergency_contacts_address_line_2

        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $validated = $validator->validated();

            // If this is set as primary, remove primary status from other contacts
            if ($validated['is_primary']) {
                DB::table('candidate_emergency_contacts')
                    ->where('candidate_id', $id)
                    ->update(['is_primary' => false]);
            }

            $contactId = DB::table('candidate_emergency_contacts')->insertGetId(
                array_merge($validated, [
                    'candidate_id' => $id,
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );

            $contact = DB::table('candidate_emergency_contacts')->find($contactId);

            return response()->json([
                'status' => 'success',
                'message' => 'Emergency contact created successfully',
                'contact' => $contact
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create emergency contact: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update emergency contact
     */
    public function updateEmergencyContact(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'contact_type' => 'required|string|max:255',
            'full_name' => 'required|string|max:255',
            'relationship' => 'required|string|max:255',
            'phone_primary' => 'required|string|max:20',
            'phone_secondary' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'is_primary' => 'boolean',
            'emergency_state_of_residence' => 'nullable|string|max:100', // Maps to emergency_contacts_state_of_residence
            'emergency_local_government_residence' => 'nullable|string|max:100', // Maps to emergency_contacts_local_government_residence
            'emergency_address' => 'nullable|string|max:255', // Maps to emergency_contacts_address
            'emergency_address_line_2' => 'nullable|string|max:255', // Maps to emergency_contacts_address_line_2
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $contact = DB::table('candidate_emergency_contacts')->find($id);
            if (!$contact) {
                return response()->json(['error' => 'Emergency contact not found'], 404);
            }

            $validated = $validator->validated();

            // If this is set as primary, remove primary status from other contacts
            if ($validated['is_primary']) {
                DB::table('candidate_emergency_contacts')
                    ->where('candidate_id', $contact->candidate_id)
                    ->where('id', '!=', $id)
                    ->update(['is_primary' => false]);
            }

            DB::table('candidate_emergency_contacts')
                ->where('id', $id)
                ->update(array_merge($validated, ['updated_at' => now()]));

            $updatedContact = DB::table('candidate_emergency_contacts')->find($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Emergency contact updated successfully',
                'contact' => $updatedContact
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update emergency contact: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete emergency contact
     */
    public function deleteEmergencyContact($id)
    {
        try {
            $contact = DB::table('candidate_emergency_contacts')->find($id);
            if (!$contact) {
                return response()->json(['error' => 'Emergency contact not found'], 404);
            }

            DB::table('candidate_emergency_contacts')->where('id', $id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Emergency contact deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete emergency contact: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all candidates with detailed information for Applicants Profile module
     */
    public function getAllCandidatesProfile(Request $request)
    {
        try {
            $query = DB::table('candidates as c')
                ->leftJoin('candidate_profiles as cp', 'c.id', '=', 'cp.candidate_id')
                ->leftJoin('staff as s', 'c.id', '=', 's.candidate_id')
                ->leftJoin('candidate_tertiary_education as cte', function($join) {
                    $join->on('c.id', '=', 'cte.candidate_id')
                         ->whereRaw('cte.id = (SELECT MAX(id) FROM candidate_tertiary_education WHERE candidate_id = c.id)');
                })
                ->select([
                    'c.id',
                    'c.first_name',
                    'c.last_name',
                    'c.email',
                    'c.phone',
                    'c.date_of_birth',
                    'c.status as candidate_status',
                    'cp.middle_name',
                    'cp.gender',
                    'cp.marital_status',
                    'cp.nationality',
                    'cp.state_of_residence',
                    'cp.local_government_residence',
                    'cp.current_address_state_lga_id',
                    'cp.phone_primary',
                    'cp.phone_secondary',
                    'cp.address_current',
                    'cp.profile_picture',
                    'cte.qualification_type',
                    'cte.field_of_study',
                    'cte.institute_name',
                    's.id as staff_id',
                    's.status as employment_status',
                    's.job_title as current_job_title',
                    's.client_id as current_client_id',
                    DB::raw('CASE WHEN s.id IS NOT NULL AND s.status = "active" THEN 1 ELSE 0 END as is_currently_employed')
                ]);

            // Apply filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('c.first_name', 'LIKE', "%{$search}%")
                      ->orWhere('c.last_name', 'LIKE', "%{$search}%")
                      ->orWhere('c.email', 'LIKE', "%{$search}%")
                      ->orWhere(DB::raw('CONCAT(c.first_name, " ", c.last_name)'), 'LIKE', "%{$search}%");
                });
            }

            if ($request->has('state') && $request->state) {
                $query->where('cp.state_of_residence', $request->state);
            }

            if ($request->has('qualification') && $request->qualification) {
                $query->where('cte.qualification_type', 'LIKE', "%{$request->qualification}%");
            }

            if ($request->has('employment_status')) {
                if ($request->employment_status === 'available') {
                    // Not currently employed (available for new positions)
                    $query->where(function($q) {
                        $q->whereNull('s.id')
                          ->orWhere('s.status', '!=', 'active');
                    });
                } elseif ($request->employment_status === 'employed') {
                    // Currently employed
                    $query->where('s.status', 'active');
                }
            }

            // Pagination
            $limit = $request->get('limit', 25);
            $offset = $request->get('offset', 0);
            
            $totalCount = $query->count();
            $candidates = $query->offset($offset)->limit($limit)->get();

            // Get additional education details for each candidate
            foreach ($candidates as &$candidate) {
                // Get education from all three tables
                $candidate->education = [
                    'primary' => DB::table('candidate_primary_education')
                        ->where('candidate_id', $candidate->id)
                        ->first(),
                    'secondary' => DB::table('candidate_secondary_education')
                        ->where('candidate_id', $candidate->id)
                        ->get(),
                    'tertiary' => DB::table('candidate_tertiary_education')
                        ->where('candidate_id', $candidate->id)
                        ->orderBy('created_at', 'desc')
                        ->get()
                ];
                
                $candidate->full_name = trim($candidate->first_name . ' ' . $candidate->middle_name . ' ' . $candidate->last_name);
            }

            return response()->json([
                'success' => true,
                'data' => $candidates,
                'pagination' => [
                    'total' => $totalCount,
                    'limit' => $limit,
                    'offset' => $offset,
                    'has_more' => ($offset + $limit) < $totalCount
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching candidates profile: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch candidates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed candidate information for modal view
     */
    public function getCandidateDetails($id)
    {
        try {
            // Get basic candidate info with profile
            $candidate = DB::table('candidates as c')
                ->leftJoin('candidate_profiles as cp', 'c.id', '=', 'cp.candidate_id')
                ->leftJoin('staff as s', 'c.id', '=', 's.candidate_id')
                ->select([
                    'c.*',
                    'cp.*',
                    's.id as staff_id',
                    's.status as employment_status',
                    's.job_title as current_job_title',
                    's.client_id as current_client_id',
                    's.employee_code',
                    's.entry_date',
                    's.end_date'
                ])
                ->where('c.id', $id)
                ->first();

            if (!$candidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate not found'
                ], 404);
            }

            // Get education history from all three tables
            $primaryEducation = DB::table('candidate_primary_education')
                ->where('candidate_id', $id)
                ->first();

            $secondaryEducation = DB::table('candidate_secondary_education')
                ->where('candidate_id', $id)
                ->get();

            $tertiaryEducation = DB::table('candidate_tertiary_education')
                ->where('candidate_id', $id)
                ->orderBy('created_at', 'desc')
                ->get();

            $education = [
                'primary' => $primaryEducation,
                'secondary' => $secondaryEducation,
                'tertiary' => $tertiaryEducation
            ];

            // Get work experience
            $experience = DB::table('candidate_experience')
                ->where('candidate_id', $id)
                ->orderBy('end_date', 'desc')
                ->get();

            // Get job applications history
            $applications = DB::table('candidate_job_applications as cja')
                ->leftJoin('recruitment_requests as rr', 'cja.recruitment_request_id', '=', 'rr.id')
                ->leftJoin('clients as cl', 'rr.client_id', '=', 'cl.id')
                ->leftJoin('job_structures as js', 'rr.job_structure_id', '=', 'js.id')
                ->select([
                    'cja.*',
                    'rr.ticket_id',
                    'cl.organisation_name as client_name',
                    'js.job_title',
                    'js.job_code'
                ])
                ->where('cja.candidate_id', $id)
                ->orderBy('cja.applied_at', 'desc')
                ->get();

            // Get emergency contacts
            $emergencyContacts = DB::table('candidate_emergency_contacts')
                ->where('candidate_id', $id)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'candidate' => $candidate,
                    'education' => $education,
                    'experience' => $experience,
                    'applications' => $applications,
                    'emergency_contacts' => $emergencyContacts
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching candidate details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch candidate details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign candidate to recruitment request (push candidate to ticket)
     */
    public function assignCandidateToTicket(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'candidate_id' => 'required|exists:candidates,id',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'motivation' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if candidate is currently employed
            $isEmployed = DB::table('staff')
                ->where('candidate_id', $request->candidate_id)
                ->where('status', 'active')
                ->exists();

            if ($isEmployed) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot assign an actively employed candidate to a new position'
                ], 422);
            }

            // Check if already applied to this recruitment request
            $existingApplication = DB::table('candidate_job_applications')
                ->where('candidate_id', $request->candidate_id)
                ->where('recruitment_request_id', $request->recruitment_request_id)
                ->first();

            if ($existingApplication) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate has already been assigned to this recruitment request'
                ], 422);
            }

            // Create job application entry
            $applicationData = [
                'candidate_id' => $request->candidate_id,
                'recruitment_request_id' => $request->recruitment_request_id,
                'application_status' => 'under_review',
                'motivation' => $request->motivation,
                'applied_at' => now(),
                'last_status_change' => now(),
                'status_history' => json_encode([
                    [
                        'status' => 'under_review',
                        'changed_at' => now(),
                        'changed_by' => 1, // Admin user ID - could be made dynamic
                        'notes' => 'Manually assigned by admin'
                    ]
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ];

            DB::table('candidate_job_applications')->insert($applicationData);

            return response()->json([
                'success' => true,
                'message' => 'Candidate successfully assigned to recruitment request'
            ]);

        } catch (\Exception $e) {
            Log::error('Error assigning candidate to ticket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign candidate: ' . $e->getMessage()
            ], 500);
        }
    }
}
