<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\UserRoleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserManagementController extends Controller
{
    protected $userRoleService;

    public function __construct(UserRoleService $userRoleService)
    {
        $this->userRoleService = $userRoleService;
    }

    /**
     * Get SOL staff users
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'search' => $request->input('search'),
                'role_id' => $request->input('role_id'),
                'status' => $request->input('status'),
                'per_page' => $request->input('per_page', 15)
            ];

            $users = $this->userRoleService->getSOLStaffUsers($filters);

            return response()->json([
                'success' => true,
                'message' => 'SOL staff users retrieved successfully',
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available roles
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function availableRoles()
    {
        try {
            $roles = $this->userRoleService->getAvailableRoles();

            return response()->json([
                'success' => true,
                'message' => 'Available roles retrieved successfully',
                'data' => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change user role
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function changeRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'role_id' => 'required|integer|exists:roles,id',
            'reason' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $result = $this->userRoleService->changeUserRole(
                $id,
                $request->role_id,
                $request->reason,
                auth()->user()->id
            );

            return response()->json([
                'success' => true,
                'message' => 'User role changed successfully',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Reset user password
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'send_email' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $result = $this->userRoleService->resetPassword(
                $id,
                $request->input('send_email', true)
            );

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully',
                'data' => [
                    'email_sent' => $result['email_sent'],
                    // Don't return password in production
                    'temporary_password' => $result['password']
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get role change history
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function roleHistory(Request $request)
    {
        try {
            $userId = $request->input('user_id');
            $perPage = $request->input('per_page', 20);

            $history = $this->userRoleService->getRoleChangeHistory($userId, $perPage);

            return response()->json([
                'success' => true,
                'message' => 'Role change history retrieved successfully',
                'data' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve history',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
