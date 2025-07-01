<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CandidateController extends Controller
{
    /**
     * Get all Nigerian states and their LGAs
     */
    public function getStatesLgas()
    {
        try {
            // Get all states and LGAs from the states_lgas table
            $statesData = DB::table('states_lgas')
                ->select('state_name', 'state_code', 'lga_name', 'lga_code', 'is_capital')
                ->where('is_active', 1) // Only get active records
                ->orderBy('state_name')
                ->orderBy('lga_name')
                ->get();

            // Group LGAs by state
            $statesWithLgas = [];
            foreach ($statesData as $row) {
                $stateName = $row->state_name;
                if (!isset($statesWithLgas[$stateName])) {
                    $statesWithLgas[$stateName] = [
                        'state' => $stateName,
                        'code' => $row->state_code,
                        'lgas' => []
                    ];
                }
                $statesWithLgas[$stateName]['lgas'][] = [
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
                'address_current' => $profile->address_current ?? '',
                'address_permanent' => $profile->address_permanent ?? '',
                'blood_group' => $profile->blood_group ?? '',

                // Default fields for frontend compatibility
                'position' => 'Candidate',
                'department' => 'Human Resources',
                'employee_id' => 'CAND' . $id,
            ];

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
            'state_of_residence' => 'nullable|string|max:255',
            'local_government_residence' => 'nullable|string|max:255',
            'national_id_no' => 'nullable|string|max:255',
            'phone_secondary' => 'nullable|string|max:255',
            'address_current' => 'nullable|string',
            'address_permanent' => 'nullable|string',
            'blood_group' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $validated = $validator->validated();

            // ✅ FIXED: Correct field mapping
            $candidateFields = ['first_name', 'last_name', 'email', 'date_of_birth', 'phone_primary'];
            $profileFields = [
                'middle_name',
                'formal_name',
                'gender',
                'marital_status',
                'nationality',
                'state_of_origin',
                'local_government',
                'state_of_residence',
                'local_government_residence',
                'national_id_no',
                'phone_secondary', // ✅ This exists in candidate_profiles table
                'address_current',
                'address_permanent',
                'blood_group'
            ];

            // Prepare data for candidates table
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
            $education = DB::table('candidate_education')
                ->where('candidate_id', $id)
                ->orderBy('end_year', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'education' => $education
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
                'experience' => $experience
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
}
