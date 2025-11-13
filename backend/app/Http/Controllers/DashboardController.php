<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    // Helper function for next steps calculation
    private function getNextSteps($profile, $hasEducation, $hasExperience, $hasEmergencyContact)
    {
        $steps = [];

        if (!$profile || !$profile->first_name || !$profile->last_name) {
            $steps[] = "Complete basic profile information";
        }

        if (!$hasEducation) {
            $steps[] = "Add educational qualifications";
        }

        if (!$hasExperience) {
            $steps[] = "Add work experience";
        }

        if (!$hasEmergencyContact) {
            $steps[] = "Add emergency contact information";
        }

        if (empty($steps)) {
            $steps[] = "Profile complete! Wait for review.";
        }

        return $steps;
    }

    // Get authenticated user info in the format your frontend expects
    private function getAuthUser()
    {
        $user = Auth::user();

        // For candidates, the user_id should be the candidate ID from the candidates table
        // Your user table has candidate_profile_id that links to candidates.id
        $candidateId = $user->candidate_profile_id ?? $user->id;

        return [
            'id' => $user->id,
            'user_id' => $candidateId,  // This should match candidates.id
            'email' => $user->email,
            'user_role' => $user->role,
            'user_type' => $user->user_type,
            'name' => $user->name,
            'is_active' => $user->is_active
        ];
    }

    // Dashboard routes
    public function candidateDashboard(Request $request)
    {
        $authUser = $this->getAuthUser();

        if ($authUser['user_role'] !== 'candidate') {
            return response()->json(['error' => 'Candidate access required'], 403);
        }

        // Calculate profile completion
        $profile = DB::table('candidate_profiles')->where('candidate_id', $authUser['user_id'])->first();
        $completedFields = 0;
        $totalFields = 8;

        if ($profile) {
            if ($profile->first_name) $completedFields++;
            if ($profile->last_name) $completedFields++;
            if ($profile->phone_primary) $completedFields++;
            if ($profile->date_of_birth) $completedFields++;
            if ($profile->gender) $completedFields++;
        }

        $hasEducation = DB::table('candidate_education')->where('candidate_id', $authUser['user_id'])->exists();
        $hasExperience = DB::table('candidate_experience')->where('candidate_id', $authUser['user_id'])->exists();
        $hasEmergencyContact = DB::table('candidate_emergency_contacts')->where('candidate_id', $authUser['user_id'])->exists();

        if ($hasEducation) $completedFields++;
        if ($hasExperience) $completedFields++;
        if ($hasEmergencyContact) $completedFields++;

        $completionPercentage = round(($completedFields / $totalFields) * 100);

        DB::table('candidates')
            ->where('id', $authUser['user_id'])
            ->update(['profile_completed' => $completionPercentage >= 100]);

        return response()->json([
            'dashboard_type' => 'candidate',
            'user' => $authUser,
            'profile_completion' => $completionPercentage,
            'application_status' => 'In Review',
            'next_steps' => $this->getNextSteps($profile, $hasEducation, $hasExperience, $hasEmergencyContact),
            'permissions' => ['view_profile', 'edit_profile']
        ]);
    }

    // Profile routes
    public function getProfile(Request $request)
    {
        $authUser = $this->getAuthUser();

        try {
            // Debug: Log what we're looking for


            $candidate = DB::table('candidates')->find($authUser['user_id']);
            $profile = DB::table('candidate_profiles')->where('candidate_id', $authUser['user_id'])->first();




            if (!$candidate) {
                return response()->json(['error' => 'Candidate not found'], 404);
            }

            return response()->json([
                'status' => 'success',
                'candidate' => [
                    'id' => $candidate->id,
                    'email' => $candidate->email,
                    'status' => $candidate->status ?? 'pending',
                    'profile_completed' => $candidate->profile_completed ?? false,
                    'created_at' => $candidate->created_at,
                ],
                'profile' => $profile ? [
                    'candidate_id' => $profile->candidate_id,
                    'first_name' => $profile->first_name ?? '',
                    'middle_name' => $profile->middle_name ?? '',
                    'last_name' => $profile->last_name ?? '',
                    'formal_name' => $profile->formal_name ?? '',
                    'gender' => $profile->gender ?? '',
                    'date_of_birth' => $profile->date_of_birth ?? '',
                    'marital_status' => $profile->marital_status ?? '',
                    'nationality' => $profile->nationality ?? 'Nigeria',
                    'state_of_origin' => $profile->state_of_origin ?? '',
                    'local_government' => $profile->local_government ?? '',
                    'state_of_residence' => $profile->state_of_residence ?? '',
                    'local_government_residence' => $profile->local_government_residence ?? '',
                    'national_id_no' => $profile->national_id_no ?? '',
                    'phone_primary' => $profile->phone_primary ?? '',
                    'phone_secondary' => $profile->phone_secondary ?? '',
                    'address_current' => $profile->address_current ?? '',
                    'address_permanent' => $profile->address_permanent ?? '',
                    'blood_group' => $profile->blood_group ?? '',
                    'profile_picture' => $profile->profile_picture ?? null,
                ] : null
            ]);
        } catch (\Exception $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch profile: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        $authUser = $this->getAuthUser();

        $validated = $request->validate([
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

        try {
            $profile = DB::table('candidate_profiles')->where('candidate_id', $authUser['user_id'])->first();

            if ($profile) {
                DB::table('candidate_profiles')
                    ->where('candidate_id', $authUser['user_id'])
                    ->update(array_merge($validated, ['updated_at' => now()]));
                $message = 'Profile updated successfully';
            } else {
                DB::table('candidate_profiles')->insert(
                    array_merge($validated, [
                        'candidate_id' => $authUser['user_id'],
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

    // Education routes
    public function getEducation(Request $request)
    {
        $authUser = $this->getAuthUser();

        $education = DB::table('candidate_education')
            ->where('candidate_id', $authUser['user_id'])
            ->orderBy('end_year', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'education' => $education
        ]);
    }

    public function storeEducation(Request $request)
    {
        $authUser = $this->getAuthUser();

        $validated = $request->validate([
            'institution_name' => 'required|string|max:255',
            'qualification_type' => 'required|string|max:255',
            'field_of_study' => 'nullable|string|max:255',
            'grade_result' => 'nullable|string|max:255',
            'start_year' => 'required|integer|min:1950|max:' . date('Y'),
            'end_year' => 'nullable|integer|min:1950|max:' . (date('Y') + 10),
            'is_current' => 'boolean'
        ]);

        try {
            $id = DB::table('candidate_education')->insertGetId(
                array_merge($validated, [
                    'candidate_id' => $authUser['user_id'],
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Education record added successfully',
                'id' => $id
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to add education: ' . $e->getMessage()
            ], 500);
        }
    }

    // Experience routes
    public function getExperience(Request $request)
    {
        $authUser = $this->getAuthUser();

        $experience = DB::table('candidate_experience')
            ->where('candidate_id', $authUser['user_id'])
            ->orderBy('start_date', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'experience' => $experience
        ]);
    }

    public function storeExperience(Request $request)
    {
        $authUser = $this->getAuthUser();

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'job_description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'is_current' => 'boolean',
            'reason_for_leaving' => 'nullable|string|max:255',
            'last_salary' => 'nullable|numeric|min:0'
        ]);

        try {
            if ($validated['is_current'] ?? false) {
                $validated['end_date'] = null;
            }

            $id = DB::table('candidate_experience')->insertGetId(
                array_merge($validated, [
                    'candidate_id' => $authUser['user_id'],
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Experience record added successfully',
                'id' => $id
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to add experience: ' . $e->getMessage()
            ], 500);
        }
    }

    // Emergency contacts routes
    public function getEmergencyContacts(Request $request)
    {
        $authUser = $this->getAuthUser();

        $contacts = DB::table('candidate_emergency_contacts')
            ->where('candidate_id', $authUser['user_id'])
            ->orderBy('is_primary', 'desc')
            ->orderBy('contact_type')
            ->get();

        return response()->json([
            'status' => 'success',
            'contacts' => $contacts
        ]);
    }

    public function storeEmergencyContact(Request $request)
    {
        $authUser = $this->getAuthUser();

        $validated = $request->validate([
            'contact_type' => 'required|string|max:255',
            'full_name' => 'required|string|max:255',
            'relationship' => 'required|string|max:255',
            'phone_primary' => 'required|string|max:20',
            'phone_secondary' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'is_primary' => 'boolean'
        ]);

        try {
            if ($validated['is_primary'] ?? false) {
                DB::table('candidate_emergency_contacts')
                    ->where('candidate_id', $authUser['user_id'])
                    ->update(['is_primary' => false]);
            }

            $id = DB::table('candidate_emergency_contacts')->insertGetId(
                array_merge($validated, [
                    'candidate_id' => $authUser['user_id'],
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Emergency contact added successfully',
                'id' => $id
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to add emergency contact: ' . $e->getMessage()
            ], 500);
        }
    }

    // Dashboard stats
    public function getDashboardStats(Request $request)
    {
        $authUser = $this->getAuthUser();

        try {
            $profile = DB::table('candidate_profiles')->where('candidate_id', $authUser['user_id'])->first();
            $candidate = DB::table('candidates')->find($authUser['user_id']);

            $completedFields = 0;
            $totalFields = 8;

            if ($profile) {
                if ($profile->first_name) $completedFields++;
                if ($profile->last_name) $completedFields++;
                if ($profile->phone_primary) $completedFields++;
                if ($profile->date_of_birth) $completedFields++;
                if ($profile->gender) $completedFields++;
            }

            $hasEducation = DB::table('candidate_education')->where('candidate_id', $authUser['user_id'])->exists();
            $hasExperience = DB::table('candidate_experience')->where('candidate_id', $authUser['user_id'])->exists();
            $hasEmergencyContact = DB::table('candidate_emergency_contacts')->where('candidate_id', $authUser['user_id'])->exists();

            if ($hasEducation) $completedFields++;
            if ($hasExperience) $completedFields++;
            if ($hasEmergencyContact) $completedFields++;

            $completionPercentage = round(($completedFields / $totalFields) * 100);

            return response()->json([
                'status' => 'success',
                'stats' => [
                    'profile_completion' => $completionPercentage,
                    'application_status' => $candidate->status ?? 'pending',
                    'total_education_records' => DB::table('candidate_education')->where('candidate_id', $authUser['user_id'])->count(),
                    'total_experience_records' => DB::table('candidate_experience')->where('candidate_id', $authUser['user_id'])->count(),
                    'total_emergency_contacts' => DB::table('candidate_emergency_contacts')->where('candidate_id', $authUser['user_id'])->count(),
                    'days_since_registration' => now()->diffInDays($candidate->created_at),
                    'last_profile_update' => $profile ? $profile->updated_at : null
                ],
                'next_steps' => $this->getNextSteps($profile, $hasEducation, $hasExperience, $hasEmergencyContact)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }
}
