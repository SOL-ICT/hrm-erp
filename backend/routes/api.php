<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CandidateController;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Http\Controllers\CsrfCookieController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| No inline Closures in any middleware() call—only string middleware names
| and controller actions. This guarantees Laravel never tries to cast a
| Closure to a string.
|
*/

// Helper function for next steps calculation
if (!function_exists('getNextSteps')) {
    function getNextSteps($profile, $hasEducation, $hasExperience, $hasEmergencyContact)
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
}

// Routes that need CSRF protection (stateful)
Route::middleware(['web'])->group(function () {
    // 1) Sanctum CSRF endpoint (must come before any stateful routes)
    Route::get('/sanctum/csrf-cookie', [CsrfCookieController::class, 'show']);

    // 3) Public auth endpoints
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// 2) Health check (no CSRF needed)
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Public endpoints (no authentication required)
Route::get('/states-lgas', [CandidateController::class, 'getStatesLgas']);

// 4) All protected routes live here
Route::middleware('auth:sanctum')->group(function () {
    Route::put('/user/preferences', [AuthController::class, 'updatePreferences']);

    // "Am I logged in?" endpoint 
    Route::get('/user', [AuthController::class, 'user']);

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard routes
    Route::get('/dashboard/admin', function (Request $request) {
        $authUser = $request->auth_user;

        if ($authUser['user_role'] !== 'admin') {
            return response()->json(['error' => 'Admin access required'], 403);
        }

        return response()->json([
            'dashboard_type' => 'admin',
            'user' => $authUser,
            'stats' => [
                'total_employees' => DB::table('staff')->count(),
                'total_candidates' => DB::table('candidates')->count(),
                'active_clients' => DB::table('clients')->where('status', 'active')->count(),
                'pending_approvals' => DB::table('candidates')->where('status', 'pending')->count()
            ],
            'recent_activities' => [],
            'permissions' => ['full_access']
        ]);
    });

    Route::get('/dashboard/staff', function (Request $request) {
        $authUser = $request->auth_user;

        if ($authUser['user_role'] !== 'staff') {
            return response()->json(['error' => 'Staff access required'], 403);
        }

        return response()->json([
            'dashboard_type' => 'staff',
            'user' => $authUser,
            'stats' => [
                'my_candidates' => 0,
                'pending_tasks' => 0,
                'completed_this_month' => 0
            ],
            'recent_activities' => [],
            'permissions' => ['view_candidates', 'edit_assigned']
        ]);
    });

    Route::get('/dashboard/candidate', function (Request $request) {
        $authUser = $request->auth_user;

        if ($authUser['user_role'] !== 'candidate') {
            return response()->json(['error' => 'Candidate access required'], 403);
        }

        // Calculate profile completion
        $profile = DB::table('candidate_profiles')->where('candidate_id', $authUser['user_id'])->first();
        $completedFields = 0;
        $totalFields = 8; // Basic profile fields + education + experience + emergency contact

        if ($profile) {
            if ($profile->first_name) $completedFields++;
            if ($profile->last_name) $completedFields++;
            if ($profile->phone_primary) $completedFields++;
            if ($profile->date_of_birth) $completedFields++;
            if ($profile->gender) $completedFields++;
        }

        // Check for education, experience, and emergency contacts
        $hasEducation = DB::table('candidate_education')
            ->where('candidate_id', $authUser['user_id'])
            ->exists();
        $hasExperience = DB::table('candidate_experience')
            ->where('candidate_id', $authUser['user_id'])
            ->exists();
        $hasEmergencyContact = DB::table('candidate_emergency_contacts')
            ->where('candidate_id', $authUser['user_id'])
            ->exists();

        if ($hasEducation) $completedFields++;
        if ($hasExperience) $completedFields++;
        if ($hasEmergencyContact) $completedFields++;

        $completionPercentage = round(($completedFields / $totalFields) * 100);

        // Update profile_completed status in candidates table
        DB::table('candidates')
            ->where('id', $authUser['user_id'])
            ->update(['profile_completed' => $completionPercentage >= 100]);

        return response()->json([
            'dashboard_type' => 'candidate',
            'user' => $authUser,
            'profile_completion' => $completionPercentage,
            'application_status' => 'In Review',
            'next_steps' => getNextSteps($profile, $hasEducation, $hasExperience, $hasEmergencyContact),
            'permissions' => ['view_profile', 'edit_profile']
        ]);
    });

    // Candidate Profile Management
    Route::prefix('candidate')->group(function () {

        // Get complete profile
        Route::get('/profile', function (Request $request) {
            $authUser = $request->auth_user;

            try {
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
                        'status' => $candidate->status,
                        'profile_completed' => $candidate->profile_completed,
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
        });

        // Create or Update profile
        Route::post('/profile', function (Request $request) {
            $authUser = $request->auth_user;

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
                    // Update existing profile
                    DB::table('candidate_profiles')
                        ->where('candidate_id', $authUser['user_id'])
                        ->update(array_merge($validated, ['updated_at' => now()]));

                    $message = 'Profile updated successfully';
                } else {
                    // Create new profile
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
        });

        // Education endpoints
        Route::get('/education', function (Request $request) {
            $authUser = $request->auth_user;

            $education = DB::table('candidate_education')
                ->where('candidate_id', $authUser['user_id'])
                ->orderBy('end_year', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'education' => $education
            ]);
        });

        Route::post('/education', function (Request $request) {
            $authUser = $request->auth_user;

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
        });

        Route::put('/education/{id}', function (Request $request, $id) {
            $authUser = $request->auth_user;

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
                $updated = DB::table('candidate_education')
                    ->where('id', $id)
                    ->where('candidate_id', $authUser['user_id'])
                    ->update(array_merge($validated, ['updated_at' => now()]));

                if (!$updated) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Education record not found'
                    ], 404);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Education record updated successfully'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to update education: ' . $e->getMessage()
                ], 500);
            }
        });

        Route::delete('/education/{id}', function ($id, Request $request) {
            $authUser = $request->auth_user;

            try {
                $deleted = DB::table('candidate_education')
                    ->where('id', $id)
                    ->where('candidate_id', $authUser['user_id'])
                    ->delete();

                if (!$deleted) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Education record not found'
                    ], 404);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Education record deleted successfully'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to delete education: ' . $e->getMessage()
                ], 500);
            }
        });

        // Experience endpoints
        Route::get('/experience', function (Request $request) {
            $authUser = $request->auth_user;

            $experience = DB::table('candidate_experience')
                ->where('candidate_id', $authUser['user_id'])
                ->orderBy('start_date', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'experience' => $experience
            ]);
        });

        Route::post('/experience', function (Request $request) {
            $authUser = $request->auth_user;

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
                // If is_current is true, clear end_date
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
        });

        Route::put('/experience/{id}', function (Request $request, $id) {
            $authUser = $request->auth_user;

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
                // If is_current is true, clear end_date
                if ($validated['is_current'] ?? false) {
                    $validated['end_date'] = null;
                }

                $updated = DB::table('candidate_experience')
                    ->where('id', $id)
                    ->where('candidate_id', $authUser['user_id'])
                    ->update(array_merge($validated, ['updated_at' => now()]));

                if (!$updated) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Experience record not found'
                    ], 404);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Experience record updated successfully'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to update experience: ' . $e->getMessage()
                ], 500);
            }
        });

        Route::delete('/experience/{id}', function ($id, Request $request) {
            $authUser = $request->auth_user;

            try {
                $deleted = DB::table('candidate_experience')
                    ->where('id', $id)
                    ->where('candidate_id', $authUser['user_id'])
                    ->delete();

                if (!$deleted) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Experience record not found'
                    ], 404);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Experience record deleted successfully'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to delete experience: ' . $e->getMessage()
                ], 500);
            }
        });

        // Emergency contacts endpoints
        Route::get('/emergency-contacts', function (Request $request) {
            $authUser = $request->auth_user;

            $contacts = DB::table('candidate_emergency_contacts')
                ->where('candidate_id', $authUser['user_id'])
                ->orderBy('is_primary', 'desc')
                ->orderBy('contact_type')
                ->get();

            return response()->json([
                'status' => 'success',
                'contacts' => $contacts
            ]);
        });

        Route::post('/emergency-contacts', function (Request $request) {
            $authUser = $request->auth_user;

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
                // If this is marked as primary, unset other primary contacts
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
        });

        Route::put('/emergency-contacts/{id}', function (Request $request, $id) {
            $authUser = $request->auth_user;

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
                // If this is marked as primary, unset other primary contacts
                if ($validated['is_primary'] ?? false) {
                    DB::table('candidate_emergency_contacts')
                        ->where('candidate_id', $authUser['user_id'])
                        ->where('id', '!=', $id)
                        ->update(['is_primary' => false]);
                }

                $updated = DB::table('candidate_emergency_contacts')
                    ->where('id', $id)
                    ->where('candidate_id', $authUser['user_id'])
                    ->update(array_merge($validated, ['updated_at' => now()]));

                if (!$updated) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Emergency contact not found'
                    ], 404);
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Emergency contact updated successfully'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to update emergency contact: ' . $e->getMessage()
                ], 500);
            }
        });

        Route::delete('/emergency-contacts/{id}', function ($id, Request $request) {
            $authUser = $request->auth_user;

            try {
                $deleted = DB::table('candidate_emergency_contacts')
                    ->where('id', $id)
                    ->where('candidate_id', $authUser['user_id'])
                    ->delete();

                if (!$deleted) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Emergency contact not found'
                    ], 404);
                }

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
        });

        // Profile completion status
        Route::get('/profile-completion', function (Request $request) {
            $authUser = $request->auth_user;

            try {
                $profile = DB::table('candidate_profiles')->where('candidate_id', $authUser['user_id'])->first();
                $sections = [
                    'basic_info' => false,
                    'education' => false,
                    'experience' => false,
                    'emergency_contacts' => false
                ];

                // Check basic info
                if (
                    $profile && $profile->first_name && $profile->last_name && $profile->date_of_birth &&
                    $profile->gender && $profile->phone_primary
                ) {
                    $sections['basic_info'] = true;
                }

                // Check education
                $sections['education'] = DB::table('candidate_education')
                    ->where('candidate_id', $authUser['user_id'])
                    ->exists();

                // Check experience
                $sections['experience'] = DB::table('candidate_experience')
                    ->where('candidate_id', $authUser['user_id'])
                    ->exists();

                // Check emergency contacts
                $sections['emergency_contacts'] = DB::table('candidate_emergency_contacts')
                    ->where('candidate_id', $authUser['user_id'])
                    ->exists();

                $completedSections = array_filter($sections);
                $completionPercentage = round((count($completedSections) / count($sections)) * 100);

                // Update profile_completed status
                DB::table('candidates')
                    ->where('id', $authUser['user_id'])
                    ->update(['profile_completed' => $completionPercentage >= 100]);

                return response()->json([
                    'status' => 'success',
                    'completion_percentage' => $completionPercentage,
                    'sections' => $sections,
                    'completed' => count($completedSections),
                    'total' => count($sections)
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to calculate completion: ' . $e->getMessage()
                ], 500);
            }
        });

        // Upload profile picture
        Route::post('/profile-picture', function (Request $request) {
            $authUser = $request->auth_user;

            $request->validate([
                'profile_picture' => 'required|image|mimes:jpeg,png,jpg|max:2048'
            ]);

            try {
                if ($request->hasFile('profile_picture')) {
                    $file = $request->file('profile_picture');
                    $filename = 'profile_' . $authUser['user_id'] . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('profile_pictures', $filename, 'public');

                    DB::table('candidate_profiles')
                        ->where('candidate_id', $authUser['user_id'])
                        ->update([
                            'profile_picture' => $path,
                            'updated_at' => now()
                        ]);

                    return response()->json([
                        'status' => 'success',
                        'message' => 'Profile picture uploaded successfully',
                        'path' => $path
                    ]);
                }

                return response()->json([
                    'status' => 'error',
                    'message' => 'No file uploaded'
                ], 400);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to upload profile picture: ' . $e->getMessage()
                ], 500);
            }
        });

        // Dashboard stats for candidate
        Route::get('/dashboard-stats', function (Request $request) {
            $authUser = $request->auth_user;

            try {
                $profile = DB::table('candidate_profiles')->where('candidate_id', $authUser['user_id'])->first();
                $candidate = DB::table('candidates')->find($authUser['user_id']);

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
                    'next_steps' => getNextSteps($profile, $hasEducation, $hasExperience, $hasEmergencyContact)
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
                ], 500);
            }
        });

        // Document upload routes
        Route::post('/documents', function (Request $request) {
            $authUser = $request->auth_user;

            $request->validate([
                'document' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120', // 5MB max
                'document_type' => 'required|string|in:cv,certificate,id_card,passport,cover_letter,transcript'
            ]);

            try {
                if ($request->hasFile('document')) {
                    $file = $request->file('document');
                    $filename = $request->document_type . '_' . $authUser['user_id'] . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('candidate_documents', $filename, 'public');

                    // Store document info in database (if table exists)
                    try {
                        DB::table('candidate_documents')->insert([
                            'candidate_id' => $authUser['user_id'],
                            'document_type' => $request->document_type,
                            'file_path' => $path,
                            'original_name' => $file->getClientOriginalName(),
                            'file_size' => $file->getSize(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    } catch (\Exception $e) {
                        // Table might not exist yet, that's ok
                    }

                    return response()->json([
                        'status' => 'success',
                        'message' => 'Document uploaded successfully',
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName()
                    ]);
                }

                return response()->json([
                    'status' => 'error',
                    'message' => 'No file uploaded'
                ], 400);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to upload document: ' . $e->getMessage()
                ], 500);
            }
        });

        Route::get('/documents', function (Request $request) {
            $authUser = $request->auth_user;

            try {
                $documents = DB::table('candidate_documents')
                    ->where('candidate_id', $authUser['user_id'])
                    ->orderBy('created_at', 'desc')
                    ->get();

                return response()->json([
                    'status' => 'success',
                    'documents' => $documents
                ]);
            } catch (\Exception $e) {
                // Table might not exist yet
                return response()->json([
                    'status' => 'success',
                    'documents' => []
                ]);
            }
        });

        Route::delete('/documents/{id}', function ($id, Request $request) {
            $authUser = $request->auth_user;

            try {
                $document = DB::table('candidate_documents')
                    ->where('id', $id)
                    ->where('candidate_id', $authUser['user_id'])
                    ->first();

                if (!$document) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Document not found'
                    ], 404);
                }

                // Delete file from storage
                if (Storage::disk('public')->exists($document->file_path)) {
                    Storage::disk('public')->delete($document->file_path);
                }

                // Delete from database
                DB::table('candidate_documents')
                    ->where('id', $id)
                    ->where('candidate_id', $authUser['user_id'])
                    ->delete();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Document deleted successfully'
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to delete document: ' . $e->getMessage()
                ], 500);
            }
        });
    });

    // Admin routes for managing candidates
    Route::prefix('admin')->middleware(function ($request, $next) {
        if ($request->auth_user['user_role'] !== 'admin') {
            return response()->json(['error' => 'Admin access required'], 403);
        }
        return $next($request);
    })->group(function () {

        // Get all candidates
        Route::get('/candidates', function (Request $request) {
            $candidates = DB::table('candidates')
                ->leftJoin('candidate_profiles', 'candidates.id', '=', 'candidate_profiles.candidate_id')
                ->select(
                    'candidates.*',
                    'candidate_profiles.first_name',
                    'candidate_profiles.last_name',
                    'candidate_profiles.phone_primary'
                )
                ->orderBy('candidates.created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'status' => 'success',
                'candidates' => $candidates
            ]);
        });

        // Get single candidate details
        Route::get('/candidates/{id}', function ($id) {
            $candidate = DB::table('candidates')->find($id);
            if (!$candidate) {
                return response()->json(['error' => 'Candidate not found'], 404);
            }

            $profile = DB::table('candidate_profiles')->where('candidate_id', $id)->first();
            $education = DB::table('candidate_education')->where('candidate_id', $id)->get();
            $experience = DB::table('candidate_experience')->where('candidate_id', $id)->get();
            $emergencyContacts = DB::table('candidate_emergency_contacts')->where('candidate_id', $id)->get();

            return response()->json([
                'status' => 'success',
                'candidate' => $candidate,
                'profile' => $profile,
                'education' => $education,
                'experience' => $experience,
                'emergency_contacts' => $emergencyContacts
            ]);
        });

        // Update candidate status
        Route::put('/candidates/{id}/status', function (Request $request, $id) {
            $validated = $request->validate([
                'status' => 'required|in:pending,approved,rejected,interview,hired'
            ]);

            $updated = DB::table('candidates')
                ->where('id', $id)
                ->update([
                    'status' => $validated['status'],
                    'updated_at' => now()
                ]);

            if (!$updated) {
                return response()->json(['error' => 'Candidate not found'], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Candidate status updated successfully'
            ]);
        });
    });

    // Staff routes
    Route::prefix('staff')->middleware(function ($request, $next) {
        if (!in_array($request->auth_user['user_role'], ['staff', 'admin'])) {
            return response()->json(['error' => 'Staff access required'], 403);
        }
        return $next($request);
    })->group(function () {

        // Get assigned candidates
        Route::get('/candidates', function (Request $request) {
            $authUser = $request->auth_user;

            // If admin, show all candidates. If staff, show only assigned ones
            $query = DB::table('candidates')
                ->leftJoin('candidate_profiles', 'candidates.id', '=', 'candidate_profiles.candidate_id')
                ->select(
                    'candidates.*',
                    'candidate_profiles.first_name',
                    'candidate_profiles.last_name',
                    'candidate_profiles.phone_primary'
                );

            if ($authUser['user_role'] === 'staff') {
                // Add condition for assigned candidates (you'll need to implement assignment logic)
                // $query->where('candidates.assigned_to', $authUser['user_id']);
            }

            $candidates = $query->orderBy('candidates.created_at', 'desc')->paginate(20);

            return response()->json([
                'status' => 'success',
                'candidates' => $candidates
            ]);
        });
    });
});
