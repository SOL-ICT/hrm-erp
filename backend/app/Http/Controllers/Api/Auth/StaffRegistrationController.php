<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Staff;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Constants\DatabaseFields;

class StaffRegistrationController extends Controller
{
    /**
     * Get available clients for staff registration
     */
    public function getClients(): JsonResponse
    {
        try {
            $clients = Client::where(DatabaseFields::CLIENTS['STATUS'], 'active')
                ->select([
                    DatabaseFields::CLIENTS['ID'],
                    DatabaseFields::CLIENTS['ORGANISATION_NAME'],
                    DatabaseFields::CLIENTS['PREFIX']
                ])
                ->orderBy(DatabaseFields::CLIENTS['ORGANISATION_NAME'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $clients
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching clients for staff registration: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching clients'
            ], 500);
        }
    }

    /**
     * Search for staff member by email and client
     */
    public function searchStaff(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'client_id' => 'required|exists:clients,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $staff = Staff::where('email', $request->email)
                ->where('client_id', $request->client_id)
                ->where('status', 'active')
                ->first();

            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active staff record found with this email for the selected client'
                ], 404);
            }

            // Check if user account already exists
            $existingUser = User::where('email', $request->email)->first();
            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User account already exists for this email. Please use the login page instead.'
                ], 409);
            }

            // Return staff information for confirmation
            return response()->json([
                'success' => true,
                'data' => [
                    'staff_id' => $staff->id,
                    'employee_code' => $staff->employee_code,
                    'staff_internal_id' => $staff->staff_id,
                    'first_name' => $staff->first_name,
                    'middle_name' => $staff->middle_name,
                    'last_name' => $staff->last_name,
                    'email' => $staff->email,
                    'gender' => $staff->gender,
                    'client_id' => $staff->client_id,
                    'department' => $staff->department,
                    'job_title' => $staff->job_title
                ],
                'message' => 'Staff record found. Please confirm your details and create your password.'
            ]);
        } catch (\Exception $e) {
            Log::error('Error searching for staff: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error searching for staff record'
            ], 500);
        }
    }

    /**
     * Create user account for existing staff member
     */
    public function createUserAccount(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:staff,id',
            'password' => 'required|min:8|confirmed',
            'password_confirmation' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $staff = Staff::find($request->staff_id);

            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff record not found'
                ], 404);
            }

            // Check if user already exists
            $existingUser = User::where('email', $staff->email)->first();
            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User account already exists for this email'
                ], 409);
            }

            // Determine user_type based on client_id
            // SOL Nigeria (client_id = 1) staff get 'admin' user_type, others get 'staff'
            $userType = ($staff->client_id == 1) ? 'admin' : 'staff';

            // Create user account
            $user = User::create([
                'name' => trim($staff->first_name . ' ' . ($staff->middle_name ? $staff->middle_name . ' ' : '') . $staff->last_name),
                'email' => $staff->email,
                'username' => $staff->staff_id, // Use staff_id as username (e.g., SOL-2025-0001)
                'password' => Hash::make($request->password),
                'user_type' => $userType, // Set user_type based on client affiliation
                'role' => 'staff', // Default role (can be different from user_type)
                'staff_profile_id' => $staff->id, // ✅ CRITICAL: Link user to staff record using staff_profile_id
                'client_id' => $staff->client_id,
                'is_active' => true,
                'email_verified_at' => now(), // Auto-verify since they have staff record
                'profile_data' => json_encode([
                    'employee_code' => $staff->employee_code,
                    'staff_internal_id' => $staff->staff_id,
                    'department' => $staff->department,
                    'job_title' => $staff->job_title
                ])
            ]);

            // Create access token
            $token = $user->createToken('staff-registration')->plainTextToken;

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user,
                    'staff' => $staff,
                    'token' => $token,
                    'login_credentials' => [
                        'username' => $staff->staff_id,
                        'email' => $staff->email,
                        'display_name' => trim($staff->first_name . ' ' . ($staff->middle_name ? $staff->middle_name . ' ' : '') . $staff->last_name)
                    ]
                ],
                'message' => 'User account created successfully. Your username is: ' . $staff->staff_id
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating user account for staff: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating user account'
            ], 500);
        }
    }
}
