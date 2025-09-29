<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApplicantProfileController extends Controller
{
    /**
     * Get all applicant profiles with search functionality
     */
    public function index(Request $request)
    {
        try {
            $query = Candidate::query();

            // Search functionality
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'LIKE', "%{$search}%")
                        ->orWhere('last_name', 'LIKE', "%{$search}%")
                        ->orWhere('email', 'LIKE', "%{$search}%")
                        ->orWhere('phone', 'LIKE', "%{$search}%")
                        ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
                });
            }

            // Filter by profile completion status
            if ($request->filled('profile_status')) {
                $profileStatus = $request->profile_status;
                if ($profileStatus === 'completed') {
                    $query->where('profile_completed', true);
                } elseif ($profileStatus === 'incomplete') {
                    $query->where('profile_completed', false);
                }
            }

            // Sorting - support both parameter formats
            $sortBy = $request->get('sort_by') ?? $request->get('sort', 'created_at');
            $sortOrder = $request->get('sort_order') ?? $request->get('order', 'desc');

            // Ensure sort column exists in candidates table
            $allowedSortColumns = ['id', 'first_name', 'last_name', 'email', 'phone', 'status', 'created_at', 'updated_at'];
            if (!in_array($sortBy, $allowedSortColumns)) {
                $sortBy = 'created_at';
            }

            $query->orderBy($sortBy, $sortOrder);

            // Pagination - support both parameter formats
            $perPage = $request->get('per_page') ?? $request->get('limit', 15);
            $applicants = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $applicants
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applicant profiles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific applicant profile with all related data
     */
    public function show($id)
    {
        try {
            // Get candidate with profile data
            $candidate = DB::table('candidates')
                ->leftJoin('candidate_profiles', 'candidates.id', '=', 'candidate_profiles.candidate_id')
                ->where('candidates.id', $id)
                ->select([
                    'candidates.*',
                    'candidate_profiles.middle_name',
                    'candidate_profiles.formal_name',
                    'candidate_profiles.gender',
                    'candidate_profiles.marital_status',
                    'candidate_profiles.nationality',
                    'candidate_profiles.state_of_origin',
                    'candidate_profiles.local_government',
                    'candidate_profiles.national_id_no',
                    'candidate_profiles.phone_primary',
                    'candidate_profiles.phone_secondary',
                    'candidate_profiles.address_current',
                    'candidate_profiles.address_line_2_current',
                    'candidate_profiles.state_of_residence_current',
                    'candidate_profiles.local_government_residence_current',
                    'candidate_profiles.address_permanent',
                    'candidate_profiles.address_line_2_permanent',
                    'candidate_profiles.state_of_residence_permanent',
                    'candidate_profiles.local_government_residence_permanent',
                    'candidate_profiles.profile_picture',
                    'candidate_profiles.blood_group'
                ])
                ->first();

            if (!$candidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Applicant profile not found'
                ], 404);
            }

            // Get education records from all education tables
            $primaryEducation = DB::table('candidate_primary_education')
                ->where('candidate_id', $id)
                ->first();

            $secondaryEducation = DB::table('candidate_secondary_education')
                ->where('candidate_id', $id)
                ->get();

            $tertiaryEducation = DB::table('candidate_tertiary_education')
                ->where('candidate_id', $id)
                ->get();

            // Combine all education data
            $education = [
                'primary' => $primaryEducation,
                'secondary' => $secondaryEducation,
                'tertiary' => $tertiaryEducation
            ];

            // Get experience records
            $experience = DB::table('candidate_experience')
                ->where('candidate_id', $id)
                ->orderBy('start_date', 'desc')
                ->get();

            // Get emergency contacts
            $emergencyContacts = DB::table('candidate_emergency_contacts')
                ->where('candidate_id', $id)
                ->get();

            // Get documents
            $documents = DB::table('candidate_documents')
                ->where('candidate_id', $id)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'profile' => $candidate,
                    'education' => $education,
                    'experience' => $experience,
                    'emergency_contacts' => $emergencyContacts,
                    'documents' => $documents
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applicant profile details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard statistics for applicant profiles
     */
    public function getStatistics()
    {
        try {
            $stats = [
                'total_applicants' => Candidate::count(),
                'completed_profiles' => Candidate::where('profile_completed', true)->count(),
                'incomplete_profiles' => Candidate::where('profile_completed', false)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
