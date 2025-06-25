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
     * Get candidate profile
     */
    public function getProfile($id)
    {
        try {
            $candidate = DB::table('candidates')->find($id);
            if (!$candidate) {
                return response()->json(['error' => 'Candidate not found'], 404);
            }

            $profile = DB::table('candidate_profiles')->where('candidate_id', $id)->first();

            return response()->json([
                'status' => 'success',
                'candidate' => $candidate,
                'profile' => $profile
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch profile: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update candidate profile
     */
    public function updateProfile(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'formal_name' => 'nullable|string|max:255',
            'gender' => 'required|in:male,female',
            'date_of_birth' => 'required|date|before:today',
            'marital_status' => 'nullable|in:single,married,divorced,widowed',
            'nationality' => 'nullable|string|max:255',
            'state_of_origin' => 'nullable|string|max:255',
            'local_government' => 'nullable|string|max:255',
            'state_of_residence' => 'nullable|string|max:255',
            'local_government_residence' => 'nullable|string|max:255',
            'national_id_no' => 'nullable|string|max:255',
            'phone_primary' => 'required|string|max:20',
            'phone_secondary' => 'nullable|string|max:20',
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
            $profile = DB::table('candidate_profiles')->where('candidate_id', $id)->first();

            if ($profile) {
                DB::table('candidate_profiles')
                    ->where('candidate_id', $id)
                    ->update(array_merge($validated, ['updated_at' => now()]));
                $message = 'Profile updated successfully';
            } else {
                DB::table('candidate_profiles')->insert(
                    array_merge($validated, [
                        'candidate_id' => $id,
                        'created_at' => now(),
                        'updated_at' => now()
                    ])
                );
                $message = 'Profile created successfully';
            }

            return response()->json([
                'status' => 'success',
                'message' => $message
            ]);
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
            $profile = DB::table('candidate_profiles')->where('candidate_id', $id)->first();
            $candidate = DB::table('candidates')->find($id);

            if (!$candidate) {
                return response()->json(['error' => 'Candidate not found'], 404);
            }

            // Calculate profile completion
            $completedFields = 0;
            $totalFields = 8;

            if ($profile) {
                if ($profile->first_name) $completedFields++;
                if ($profile->last_name) $completedFields++;
                if ($profile->phone_primary) $completedFields++;
                if ($profile->date_of_birth) $completedFields++;
                if ($profile->gender) $completedFields++;
            }

            $hasEducation = DB::table('candidate_education')->where('candidate_id', $id)->exists();
            $hasExperience = DB::table('candidate_experience')->where('candidate_id', $id)->exists();
            $hasEmergencyContact = DB::table('candidate_emergency_contacts')->where('candidate_id', $id)->exists();

            if ($hasEducation) $completedFields++;
            if ($hasExperience) $completedFields++;
            if ($hasEmergencyContact) $completedFields++;

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
}
