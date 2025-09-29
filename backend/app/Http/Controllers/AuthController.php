<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    /**
     * Handle a login request for all user types.
     */
    public function login(Request $request)
    {
        try {
            $data = $request->validate([
                'identifier' => 'required|string',    // email or username
                'password'   => 'required|string',
                // Theme preference fields
                'login_type' => 'sometimes|in:candidate,staff,admin',
                'is_admin' => 'sometimes|boolean',
                'preferences' => 'sometimes|array',
                'preferences.theme' => 'sometimes|string|in:light,dark,transparent',
                'preferences.language' => 'sometimes|string',
                'preferences.primary_color' => 'sometimes|string',
            ]);

            // Debug logging
            Log::info('=== LOGIN ATTEMPT ===', [
                'identifier' => $data['identifier'],
                'login_type' => $data['login_type'] ?? 'not_set',
                'is_admin' => $data['is_admin'] ?? false,
            ]);

            // Decide whether they're logging in with email or username
            $field = filter_var($data['identifier'], FILTER_VALIDATE_EMAIL)
                ? 'email'
                : 'username';

            // Debug: Check if user exists
            $userExists = DB::table('users')->where($field, $data['identifier'])->first();
            Log::info('User lookup', [
                'field' => $field,
                'user_found' => $userExists ? 'YES' : 'NO',
                'user_data' => $userExists ? [
                    'id' => $userExists->id,
                    'email' => $userExists->email,
                    'role' => $userExists->role,
                    'user_type' => $userExists->user_type,
                    'profile_id' => $userExists->profile_id, // ✅ Key field for staff ID
                ] : null
            ]);

            // Attempt authentication using the users table
            if (!Auth::attempt([$field => $data['identifier'], 'password' => $data['password']])) {
                Log::error('Authentication failed', [
                    'field' => $field,
                    'identifier' => $data['identifier']
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials',
                ], 401);
            }

            $user = Auth::user();

            // Check if user is active
            if (!$user->is_active) {
                Auth::logout();
                return response()->json([
                    'success' => false,
                    'message' => 'Account is inactive. Please contact administrator.',
                ], 401);
            }

            // Handle theme preferences if provided
            if (isset($data['preferences'])) {
                $currentPreferences = $this->getUserPreferences($user);
                $newPreferences = array_merge($currentPreferences, $data['preferences']);

                // Save preferences using direct database update
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['preferences' => json_encode($newPreferences)]);
            }

            // Determine if this is an API request that needs a token
            $needsToken = $request->wantsJson() ||
                $request->header('Accept') === 'application/json' ||
                $request->has('api_login') ||
                str_starts_with($request->path(), 'api/') ||
                $request->is('api/*'); // Additional check for API routes

            // Only regenerate session for web requests, not API requests
            if (!$needsToken && $request->hasSession()) {
                $request->session()->regenerate();
            }

            // Get final preferences
            $preferences = $this->getUserPreferences($user);

            // ✅ ENHANCED: Determine dashboard type and include staff information
            $staffInfo = null;
            $loginType = $data['login_type'] ?? 'staff'; // Default to staff if not specified

            if ($loginType === 'candidate') {
                // Route 1: Candidate login -> candidate dashboard
                $dashboardType = 'candidate';
            } elseif ($loginType === 'staff') {
                // Staff login - check if admin access is requested
                if (isset($data['is_admin']) && $data['is_admin'] === true) {
                    // Admin toggle is ON - verify if user is SOL staff using profile_id
                    if (in_array($user->user_type, ['staff', 'admin']) && $user->profile_id) {

                        $solStaff = DB::table('staff')
                            ->where('id', $user->profile_id) // ✅ Direct lookup using profile_id
                            ->where('client_id', 1) // SOL Nigeria client_id
                            ->where('status', 'active')
                            ->first();

                        Log::info('Admin access check using profile_id', [
                            'user_id' => $user->id,
                            'profile_id' => $user->profile_id,
                            'is_sol_staff' => $solStaff ? 'YES' : 'NO',
                            'admin_requested' => true
                        ]);

                        if ($solStaff) {
                            // SOL staff with admin toggle -> admin dashboard
                            $dashboardType = 'admin';
                            $staffInfo = $solStaff; // ✅ Store staff info for session

                            // Check if admin role is already assigned
                            $hasAdminRole = DB::table('staff_roles')
                                ->join('roles', 'staff_roles.role_id', '=', 'roles.id')
                                ->where('staff_roles.staff_id', $user->profile_id) // ✅ Use profile_id directly
                                ->whereIn('roles.slug', ['super-admin', 'admin'])
                                ->exists();

                            if (!$hasAdminRole) {
                                // Assign admin role to SOL staff
                                DB::table('staff_roles')->insert([
                                    'staff_id' => $user->profile_id, // ✅ Use profile_id directly
                                    'role_id' => 2, // Admin role ID
                                    'assigned_at' => now(),
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);

                                Log::info('Admin role assigned to SOL staff', [
                                    'staff_id' => $user->profile_id,
                                    'user_id' => $user->id
                                ]);
                            }
                        } else {
                            // Not SOL staff but tried admin toggle -> staff dashboard
                            $dashboardType = 'staff';
                            Log::warning('Non-SOL staff attempted admin access', [
                                'user_id' => $user->id,
                                'profile_id' => $user->profile_id
                            ]);
                        }
                    } else {
                        // No profile_id or wrong user type -> staff dashboard
                        $dashboardType = 'staff';
                        Log::warning('Invalid user type or missing profile_id for admin access', [
                            'user_id' => $user->id,
                            'user_type' => $user->user_type,
                            'profile_id' => $user->profile_id
                        ]);
                    }
                } else {
                    // No admin toggle -> regular staff dashboard (including SOL staff)
                    $dashboardType = 'staff';

                    // Still get staff info for regular staff dashboard
                    if (in_array($user->user_type, ['staff', 'admin']) && $user->profile_id) {
                        $staffInfo = DB::table('staff')
                            ->where('id', $user->profile_id)
                            ->where('status', 'active')
                            ->first();
                    }
                }
            } else {
                // Fallback
                $dashboardType = $user->user_type ?? $user->role ?? 'candidate';
            }

            // Log the final decision
            Log::info('Dashboard routing decision', [
                'login_type' => $data['login_type'] ?? 'not_set',
                'is_admin_requested' => $data['is_admin'] ?? false,
                'user_id' => $user->id,
                'profile_id' => $user->profile_id,
                'final_dashboard_type' => $dashboardType,
                'staff_info_loaded' => $staffInfo ? 'YES' : 'NO'
            ]);

            // ✅ ENHANCED: Build response payload with staff information
            $responseData = [
                'id'             => $user->id,
                'username'       => $user->{$field},
                'name'           => $user->name,
                'email'          => $user->email,
                'user_role'      => $user->role,
                'user_type'      => $user->user_type,
                'profile_id'     => $user->profile_id, // ✅ Include profile_id for frontend
                'dashboard_type' => $dashboardType,
                'is_active'      => $user->is_active,
                'preferences'    => $preferences,
            ];

            // ✅ Add staff-specific information if available
            if ($staffInfo) {
                $responseData['staff_info'] = [
                    'staff_id' => $staffInfo->id,
                    'employee_code' => $staffInfo->employee_code,
                    'client_id' => $staffInfo->client_id,
                    'is_sol_staff' => $staffInfo->client_id == 1,
                    'department' => $staffInfo->department ?? null,
                    'designation' => $staffInfo->designation ?? null,
                ];
            }

            $finalResponse = [
                'success' => true,
                'message' => 'Login successful',
                'user'    => $responseData,
            ];

            // Generate API token - Force for all logins for now
            $needsToken = true; // Force token generation
            Log::info('Token generation needed', ['needs_token' => $needsToken]);
            
            if ($needsToken) {
                try {
                    // Ensure we have a fresh User model instance with the HasApiTokens trait
                    /** @var \App\Models\User $userModel */
                    $userModel = User::find($user->id);
                    $tokenResult = $userModel->createToken('api-access');
                    $token = $tokenResult->plainTextToken;
                    $finalResponse['access_token'] = $token;
                    $finalResponse['token_type'] = 'Bearer';
                    Log::info('Token generated successfully', ['token_length' => strlen($token)]);
                } catch (\Exception $tokenError) {
                    Log::error('Token generation failed: ' . $tokenError->getMessage());
                    // Continue without token for now
                }
            }

            Log::info('Final login response', [
                'response_keys' => array_keys($finalResponse),
                'has_access_token' => isset($finalResponse['access_token']),
                'access_token_length' => isset($finalResponse['access_token']) ? strlen($finalResponse['access_token']) : 0
            ]);

            return response()->json($finalResponse);
        } catch (ValidationException $e) {
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Login exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Login failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    // /**
    //  * Handle user registration (candidates only).
    //  */
    // public function register(Request $request)
    // {
    //     try {
    //         $data = $request->validate([
    //             'first_name' => 'required|string|max:255',
    //             'last_name' => 'required|string|max:255',
    //             'email' => 'required|email|unique:users,email|unique:candidates,email',
    //             'phone' => 'required|string|max:20|unique:candidates,phone',
    //             'password' => 'required|string|min:8|confirmed',
    //             'date_of_birth' => 'required|date|before:today',
    //             'gender' => 'required|in:male,female',
    //             'state_lga_id' => 'required|exists:states_lgas,id',
    //             // Theme preferences
    //             'theme' => 'sometimes|string|in:light,dark,transparent',
    //             'language' => 'sometimes|string',
    //             'primary_color' => 'sometimes|string',
    //         ]);

    //         DB::beginTransaction();

    //         // Create candidate profile first
    //         $candidateId = DB::table('candidates')->insertGetId([
    //             'first_name' => $data['first_name'],
    //             'last_name' => $data['last_name'],
    //             'email' => $data['email'],
    //             'phone' => $data['phone'],
    //             'date_of_birth' => $data['date_of_birth'],
    //             'gender' => $data['gender'],
    //             'state_lga_id' => $data['state_lga_id'],
    //             'registration_status' => 'active',
    //             'created_at' => now(),
    //             'updated_at' => now(),
    //         ]);

    //         // Prepare preferences
    //         $preferences = [
    //             'theme' => $data['theme'] ?? 'light',
    //             'language' => $data['language'] ?? 'en',
    //             'primary_color' => $data['primary_color'] ?? '#6366f1',
    //         ];

    //         // ✅ Create user record with candidate profile_id
    //         $userId = DB::table('users')->insertGetId([
    //             'name' => $data['first_name'] . ' ' . $data['last_name'],
    //             'email' => $data['email'],
    //             'username' => strtolower($data['first_name'] . '.' . $data['last_name']),
    //             'email_verified_at' => now(),
    //             'password' => Hash::make($data['password']),
    //             'role' => 'candidate',
    //             'user_type' => 'candidate',
    //             'profile_id' => $candidateId, // ✅ Link to candidate profile
    //             'is_active' => true,
    //             'preferences' => json_encode($preferences),
    //             'created_at' => now(),
    //             'updated_at' => now(),
    //         ]);

    //         // Create user model instance for authentication
    //         $user = User::find($userId);
    //         Auth::login($user);
    //         $request->session()->regenerate();

    //         DB::commit();

    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Registration successful',
    //             'user' => [
    //                 'id' => $user->id,
    //                 'user_id' => $userId,
    //                 'profile_id' => $candidateId, // ✅ Return profile_id
    //                 'name' => $data['first_name'] . ' ' . $data['last_name'],
    //                 'email' => $data['email'],
    //                 'user_type' => 'candidate',
    //                 'dashboard_type' => 'candidate',
    //                 'preferences' => $preferences,
    //             ],
    //             'candidate_id' => $candidateId,
    //         ], 201);
    //     } catch (ValidationException $e) {
    //         DB::rollBack();
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Validation failed',
    //             'errors' => $e->errors(),
    //         ], 422);
    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Registration failed: ' . $e->getMessage(),
    //         ], 500);
    //     }
    // }

    /**
     * Return the currently authenticated user.
     */
    public function user(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Unauthenticated',
                ], 401);
            }

            // ✅ Get additional profile information based on user type
            $profileInfo = null;
            if (in_array($user->user_type, ['staff', 'admin']) && $user->profile_id) {
                $profileInfo = DB::table('staff')
                    ->where('id', $user->profile_id)
                    ->select('id', 'employee_code', 'client_id', 'department', 'status')
                    ->first();
            } elseif ($user->user_type === 'candidate' && $user->profile_id) {
                $profileInfo = DB::table('candidates')
                    ->where('id', $user->profile_id)
                    ->select('id', 'first_name', 'last_name', 'phone', 'registration_status')
                    ->first();
            }

            $responseData = [
                'id'             => $user->id,
                'username'       => $user->username ?? $user->email,
                'name'           => $user->name,
                'email'          => $user->email,
                'user_role'      => $user->role,
                'user_type'      => $user->user_type,
                'profile_id'     => $user->profile_id, // ✅ Include profile_id
                'dashboard_type' => $user->user_type ?? $user->role ?? 'candidate',
                'is_active'      => $user->is_active,
                'preferences'    => $this->getUserPreferences($user),
            ];

            // ✅ Add profile-specific information
            if ($profileInfo) {
                $responseData['profile_info'] = $profileInfo;

                // Add SOL staff flag for staff users
                if (in_array($user->user_type, ['staff', 'admin'])) {
                    $responseData['is_sol_staff'] = $profileInfo->client_id == 1;
                }
            }

            return response()->json([
                'status' => 'success',
                'user'   => $responseData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update user preferences.
     */
    public function updatePreferences(Request $request)
    {
        try {
            $request->validate([
                'theme' => 'sometimes|string|in:light,dark,transparent',
                'language' => 'sometimes|string',
                'primary_color' => 'sometimes|string',
            ]);

            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not authenticated'
                ], 401);
            }

            $currentPreferences = $this->getUserPreferences($user);
            $newPreferences = array_merge($currentPreferences, $request->only(['theme', 'language', 'primary_color']));

            // Update preferences in database
            DB::table('users')
                ->where('id', $user->id)
                ->update(['preferences' => json_encode($newPreferences)]);

            return response()->json([
                'success' => true,
                'message' => 'Preferences updated successfully',
                'preferences' => $newPreferences
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update preferences: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Log the user out and invalidate the session.
     */
    public function logout(Request $request)
    {
        try {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed: ' . $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Register a new candidate - FIXED for current database schema
     */
    public function register(Request $request)
    {
        try {
            $data = $request->validate([
                'email'    => 'required|email|unique:candidates,email|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
                'first_name' => 'required|string|max:255',
                'last_name'  => 'required|string|max:255',
                'phone'      => 'sometimes|string|max:20',
                'date_of_birth' => 'sometimes|date',
                // Theme preferences (optional)
                'theme' => 'sometimes|string|in:light,dark,transparent',
                'language' => 'sometimes|string',
                'primary_color' => 'sometimes|string',
            ]);

            DB::beginTransaction();

            // ✅ Create users record first
            $preferences = [
                'theme' => $data['theme'] ?? 'light',
                'language' => $data['language'] ?? 'en',
                'primary_color' => $data['primary_color'] ?? '#6366f1',
            ];

            // ✅ FIXED: Create users record with correct field mapping
            $userId = DB::table('users')->insertGetId([
                'name' => $data['first_name'] . ' ' . $data['last_name'],
                'email' => $data['email'],
                'username' => strtolower($data['first_name'] . '.' . $data['last_name']),
                'email_verified_at' => now(),
                'password' => Hash::make($data['password']),
                'role' => 'candidate',
                'user_type' => 'candidate',
                'profile_id' => null,
                'is_active' => true,
                'preferences' => json_encode($preferences), // ✅ Store as JSON
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // ✅Create candidate record using same ID as user
            DB::table('candidates')->insert([
                'id' => $userId, // shared PK
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'profile_completed' => false,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $candidateId = $userId; // Use the same ID for candidate

            // update user's profile_id to point to candidate
            // DB::table('users')->where('id', $userId)->update(['profile_id' => $candidateId]);

            // ✅Create candidate profile
            DB::table('candidate_profiles')->insert([
                'candidate_id' => $candidateId, // Use the same ID as user
                'nationality' => 'Nigeria',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            // Create user model instance for authentication
            $user = User::find($userId);
            Auth::login($user);
            $request->session()->regenerate();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'user' => [
                    'id' => $candidateId, // Return candidate ID for frontend
                    'user_id' => $userId,
                    'name' => $data['first_name'] . ' ' . $data['last_name'],
                    'email' => $data['email'],
                    'user_type' => 'candidate',
                    'dashboard_type' => 'candidate',
                    'preferences' => $preferences,
                ],
                'candidate_id' => $candidateId, // Explicitly return candidate ID
            ], 201);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user preferences with defaults.
     */
    private function getUserPreferences($user)
    {
        $defaults = [
            'theme' => 'light',
            'language' => 'en',
            'primary_color' => '#6366f1',
        ];

        // Get fresh preferences from database
        $freshUser = DB::table('users')->where('id', $user->id)->first();

        if (empty($freshUser->preferences)) {
            return $defaults;
        }

        $preferences = json_decode($freshUser->preferences, true);
        return array_merge($defaults, $preferences ?: []);
    }
}
