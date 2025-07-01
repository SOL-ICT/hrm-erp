<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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

            // Regenerate session for security
            $request->session()->regenerate();

            // Get final preferences
            $preferences = $this->getUserPreferences($user);

            // ✅ FIXED: Determine dashboard type based on SOL staff and admin access
            if ($data['login_type'] === 'candidate') {
                // Route 1: Candidate login -> candidate dashboard
                $dashboardType = 'candidate';
            } elseif ($data['login_type'] === 'staff') {
                // Staff login - check if admin access is requested
                if (isset($data['is_admin']) && $data['is_admin'] === true) {
                    // Admin toggle is ON - verify if user is SOL staff
                    $isSOLStaff = DB::table('staff')
                        ->where('email', $user->email)
                        ->where('client_id', 1) // SOL Nigeria client_id
                        ->where('status', 'active')
                        ->exists();

                    Log::info('Admin access check', [
                        'user_email' => $user->email,
                        'is_sol_staff' => $isSOLStaff,
                        'admin_requested' => true
                    ]);

                    if ($isSOLStaff) {
                        // SOL staff with admin toggle -> admin dashboard
                        $dashboardType = 'admin';

                        // Also assign admin role if not already assigned
                        $staff = DB::table('staff')->where('email', $user->email)->first();
                        if ($staff) {
                            // Check if admin role is already assigned
                            $hasAdminRole = DB::table('staff_roles')
                                ->join('roles', 'staff_roles.role_id', '=', 'roles.id')
                                ->where('staff_roles.staff_id', $staff->id)
                                ->whereIn('roles.slug', ['super-admin', 'admin'])
                                ->exists();

                            if (!$hasAdminRole) {
                                // Assign admin role to SOL staff
                                DB::table('staff_roles')->insert([
                                    'staff_id' => $staff->id,
                                    'role_id' => 2, // Admin role ID
                                    'assigned_at' => now(),
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);

                                Log::info('Admin role assigned to SOL staff', [
                                    'staff_id' => $staff->id,
                                    'staff_email' => $staff->email
                                ]);
                            }
                        }
                    } else {
                        // Not SOL staff but tried admin toggle -> staff dashboard
                        $dashboardType = 'staff';
                        Log::warning('Non-SOL staff attempted admin access', [
                            'user_email' => $user->email
                        ]);
                    }
                } else {
                    // No admin toggle -> regular staff dashboard (including SOL staff)
                    $dashboardType = 'staff';
                }
            } else {
                // Fallback
                $dashboardType = $user->user_type ?? $user->role ?? 'candidate';
            }

            // Log the final decision
            Log::info('Dashboard routing decision', [
                'login_type' => $data['login_type'] ?? 'not_set',
                'is_admin_requested' => $data['is_admin'] ?? false,
                'user_email' => $user->email,
                'final_dashboard_type' => $dashboardType
            ]);

            // Build response payload
            $responseData = [
                'id'             => $user->id,
                'username'       => $user->{$field},
                'name'           => $user->name,
                'email'          => $user->email,
                'user_role'      => $user->role,
                'user_type'      => $user->user_type,
                'dashboard_type' => $dashboardType,
                'is_active'      => $user->is_active,
                'preferences'    => $preferences,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'user'    => $responseData,
            ]);
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

            return response()->json([
                'status' => 'success',
                'user'   => [
                    'id'             => $user->id,
                    'username'       => $user->username ?? $user->email,
                    'name'           => $user->name,
                    'email'          => $user->email,
                    'user_role'      => $user->role,
                    'user_type'      => $user->user_type,
                    'dashboard_type' => $user->user_type ?? $user->role ?? 'candidate',
                    'is_active'      => $user->is_active,
                    'preferences'    => $this->getUserPreferences($user),
                ],
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
                'message' => 'Logged out successfully'
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
                'email'    => 'required|email|unique:candidates,email',
                'password' => 'required|string|min:8|confirmed',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'phone' => 'sometimes|string|max:20',
                'date_of_birth' => 'sometimes|date',
                // Theme preferences (optional)
                'theme' => 'sometimes|string|in:light,dark,transparent',
                'language' => 'sometimes|string',
                'primary_color' => 'sometimes|string',
            ]);

            DB::beginTransaction();

            // Create candidate record
            $candidateId = DB::table('candidates')->insertGetId([
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

            // Create candidate_profile record  
            DB::table('candidate_profiles')->insert([
                'candidate_id' => $candidateId,
                'nationality' => 'Nigeria',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // ✅ FIXED: Prepare preferences as JSON for users table
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
                'profile_id' => $candidateId,
                'is_active' => true,
                'preferences' => json_encode($preferences), // ✅ Store as JSON
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
