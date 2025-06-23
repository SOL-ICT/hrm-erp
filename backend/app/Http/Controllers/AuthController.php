<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $loginType = $request->input('loginType', 'staff');
        $identifier = $request->input('identifier') ?: $request->input('email');
        $password = $request->input('password');
        $isAdminLogin = $request->input('isAdminLogin', false);
        $theme = $request->input('theme', 'light');
        $language = $request->input('language', 'en');

        if (!$identifier || !$password) {
            return response()->json([
                'status' => 'error',
                'message' => 'Identifier and password are required'
            ], 400);
        }

        // Handle candidate login - use candidates table
        if ($loginType === 'candidate') {
            $candidate = DB::table('candidates')->where('email', $identifier)->first();

            if (!$candidate || !Hash::check($password, $candidate->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Create session data for candidate
            $sessionData = [
                'user_id' => $candidate->id,
                'email' => $candidate->email,
                'login_type' => 'candidate',
                'user_role' => 'candidate',
                'dashboard_type' => 'candidate',
                'is_admin' => false,
                'preferences' => [
                    'theme' => $theme,
                    'language' => $language,
                    'primary_color' => $request->input('primaryColor', '#6366f1')
                ],
                'login_time' => now()
            ];

            session(['auth_user' => $sessionData]);

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'user' => [
                    'id' => $candidate->id,
                    'email' => $candidate->email,
                    'role' => 'candidate',
                    'dashboard_type' => 'candidate'
                ],
                'session' => $sessionData,
                'redirect_to' => "/dashboard/candidate"
            ]);
        }

        // Handle staff/admin login - use users table
        if ($loginType === 'staff') {
            $user = User::where('email', $identifier . '@sol.com')->first() ??
                User::where('name', $identifier)->first();

            if (!$user || !Hash::check($password, $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Determine user role
            $userRole = 'staff';
            $dashboardType = 'staff';

            if (str_contains($identifier, 'ADM') && $isAdminLogin) {
                $userRole = 'admin';
                $dashboardType = 'admin';
            }

            $sessionData = [
                'user_id' => $user->id,
                'email' => $user->email,
                'login_type' => 'staff',
                'user_role' => $userRole,
                'dashboard_type' => $dashboardType,
                'is_admin' => $isAdminLogin && $userRole === 'admin',
                'preferences' => [
                    'theme' => $theme,
                    'language' => $language,
                    'primary_color' => $request->input('primaryColor', '#6366f1')
                ],
                'login_time' => now(),
                'staff_id' => $identifier
            ];

            session(['auth_user' => $sessionData]);

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $userRole,
                    'dashboard_type' => $dashboardType,
                    'staff_id' => $identifier
                ],
                'session' => $sessionData,
                'redirect_to' => "/dashboard/{$dashboardType}"
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Invalid login type'
        ], 400);
    }

    public function register(Request $request)
    {
        $name = $request->input('name');
        $email = $request->input('email');
        $password = $request->input('password');
        $loginType = $request->input('loginType', 'candidate');

        if (!$name || !$email || !$password) {
            return response()->json([
                'status' => 'error',
                'message' => 'Name, email and password are required'
            ], 400);
        }

        if (strlen($password) < 8) {
            return response()->json([
                'status' => 'error',
                'message' => 'Password must be at least 8 characters'
            ], 400);
        }

        if (User::where('email', $email)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email already exists'
            ], 400);
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $loginType === 'staff' ? 'staff' : 'candidate'
            ]
        ]);
    }

    public function checkAuth(Request $request)
    {
        $authUser = session('auth_user');

        if (!$authUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'Not authenticated'
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'authenticated' => true,
            'user' => $authUser
        ]);
    }

    public function logout(Request $request)
    {
        session()->forget('auth_user');
        session()->flush();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ]);
    }

    public function health()
    {
        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
            'api' => 'running'
        ]);
    }

    public function index()
    {
        return response()->json([
            'message' => 'HRM ERP API',
            'status' => 'running'
        ]);
    }

    public function createTestCandidate()
    {
        try {
            // Check if candidates table exists
            if (!DB::getSchemaBuilder()->hasTable('candidates')) {
                // Create the table if it doesn't exist
                DB::statement('
                    CREATE TABLE candidates (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        first_name VARCHAR(255),
                        last_name VARCHAR(255),
                        phone VARCHAR(255),
                        status VARCHAR(255) DEFAULT "active",
                        email_verified_at TIMESTAMP NULL,
                        remember_token VARCHAR(100),
                        created_at TIMESTAMP,
                        updated_at TIMESTAMP
                    )
                ');
            }

            // Create test candidate
            DB::table('candidates')->insert([
                'email' => 'candidate@test.com',
                'password' => Hash::make('password123'),
                'first_name' => 'Test',
                'last_name' => 'Candidate',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Test candidate created successfully',
                'credentials' => [
                    'email' => 'candidate@test.com',
                    'password' => 'password123',
                    'login_type' => 'candidate'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create test candidate: ' . $e->getMessage()
            ], 500);
        }
    }
}
