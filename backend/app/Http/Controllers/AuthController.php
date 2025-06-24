<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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
                'preferences' => 'sometimes|array',
                'preferences.theme' => 'sometimes|string|in:light,dark,transparent',
                'preferences.language' => 'sometimes|string',
                'preferences.primary_color' => 'sometimes|string',
            ]);

            // Decide whether they're logging in with email or username
            $field = filter_var($data['identifier'], FILTER_VALIDATE_EMAIL)
                ? 'email'
                : 'username';

            // Attempt authentication using the users table
            if (!Auth::attempt([$field => $data['identifier'], 'password' => $data['password']])) {
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

            // Determine dashboard type based on user_type or login_type
            $dashboardType = $data['login_type'] ?? $user->user_type ?? $user->role ?? 'candidate';

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
     * Register a new candidate.
     */
    public function register(Request $request)
    {
        try {
            $data = $request->validate([
                'email'    => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'phone' => 'sometimes|string|max:20',
            ]);

            DB::beginTransaction();

            // Create candidate record
            $candidateId = DB::table('candidates')->insertGetId([
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'] ?? null,
                'profile_completed' => false,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create user record
            $userId = DB::table('users')->insertGetId([
                'name' => $data['first_name'] . ' ' . $data['last_name'],
                'email' => $data['email'],
                'username' => strtolower($data['first_name'] . '.' . $data['last_name']),
                'password' => Hash::make($data['password']),
                'role' => 'candidate',
                'user_type' => 'candidate',
                'profile_id' => $candidateId,
                'is_active' => true,
                'preferences' => json_encode([
                    'theme' => 'light',
                    'language' => 'en',
                    'primary_color' => '#6366f1'
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $user = User::find($userId);
            Auth::login($user);
            $request->session()->regenerate();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'user_role' => $user->role,
                    'user_type' => $user->user_type,
                    'dashboard_type' => 'candidate',
                    'preferences' => $this->getUserPreferences($user),
                ],
            ]);
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
