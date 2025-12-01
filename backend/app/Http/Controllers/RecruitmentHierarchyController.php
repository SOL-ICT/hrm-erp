<?php

namespace App\Http\Controllers;

use App\Models\RecruitmentHierarchy;
use App\Services\RecruitmentHierarchyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class RecruitmentHierarchyController extends Controller
{
    private RecruitmentHierarchyService $hierarchyService;

    public function __construct(RecruitmentHierarchyService $hierarchyService)
    {
        $this->hierarchyService = $hierarchyService;
    }

    /**
     * Get all role permissions in the recruitment hierarchy
     * Accessible by Super Admin and Global Admin only
     * 
     * GET /api/recruitment-hierarchy
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            // Authorization check - only Super Admin and Global Admin
            if (!in_array($user->role_id, [1, 2])) { // 1 = Super Admin, 2 = Global Admin
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only Super Admin and Global Admin can view hierarchy settings.'
                ], 403);
            }

            // Get all recruitment hierarchy permissions
            $hierarchy = RecruitmentHierarchy::with('role:id,role_name')
                ->orderBy('hierarchy_level', 'asc')
                ->get();

            // Format response with descriptive information
            $formattedHierarchy = $hierarchy->map(function ($item) {
                return [
                    'role_id' => $item->role_id,
                    'role_name' => $item->role->role_name ?? 'Unknown',
                    'hierarchy_level' => $item->hierarchy_level,
                    'permissions' => [
                        'can_create_request' => $item->can_create_request,
                        'can_approve_request' => $item->can_approve_request,
                        'can_assign_ticket' => $item->can_assign_ticket,
                        'can_board_without_approval' => $item->can_board_without_approval,
                        'can_approve_boarding' => $item->can_approve_boarding,
                    ],
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Recruitment hierarchy retrieved successfully',
                'data' => $formattedHierarchy,
                'hierarchy_explanation' => [
                    'level_0' => 'Control Department (Final compliance approval)',
                    'level_1' => 'Highest authority (Super Admin, Global Admin)',
                    'level_2' => 'Management level (Recruitment, Regional Manager)',
                    'level_3' => 'HR Department',
                    'level_5' => 'Support/Assistant level',
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve recruitment hierarchy', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve recruitment hierarchy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update role permissions in the recruitment hierarchy
     * Super Admin and Global Admin only
     * 
     * PUT /api/recruitment-hierarchy/{roleId}
     */
    public function update(Request $request, $roleId)
    {
        try {
            $user = Auth::user();

            // Authorization check - only Super Admin and Global Admin
            if (!in_array($user->role_id, [1, 2])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only Super Admin and Global Admin can update hierarchy settings.'
                ], 403);
            }

            // Validation
            $validator = Validator::make($request->all(), [
                'can_create_request' => 'sometimes|boolean',
                'can_approve_request' => 'sometimes|boolean',
                'can_assign_ticket' => 'sometimes|boolean',
                'can_board_without_approval' => 'sometimes|boolean',
                'can_approve_boarding' => 'sometimes|boolean',
                'hierarchy_level' => 'sometimes|integer|min:0|max:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find hierarchy record
            $hierarchy = RecruitmentHierarchy::where('role_id', $roleId)->firstOrFail();

            // Prevent modifying Control Department (role_id = 6, level = 0)
            if ($hierarchy->role_id === 6) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot modify Control Department permissions. Control must always have final approval authority.'
                ], 403);
            }

            // Business rule validation: If can_approve_boarding is true, hierarchy_level must be <= 2
            if ($request->has('can_approve_boarding') && $request->can_approve_boarding) {
                $newLevel = $request->hierarchy_level ?? $hierarchy->hierarchy_level;
                if ($newLevel > 2 && $newLevel !== 0) { // Level 0 is Control (exception)
                    return response()->json([
                        'success' => false,
                        'message' => 'Boarding approval permission requires hierarchy level 0, 1, or 2'
                    ], 422);
                }
            }

            // Update only provided fields
            $updateData = $request->only([
                'can_create_request',
                'can_approve_request',
                'can_assign_ticket',
                'can_board_without_approval',
                'can_approve_boarding',
                'hierarchy_level',
            ]);

            $hierarchy->update($updateData);

            // Clear cache for this role
            Cache::forget("recruitment_hierarchy_role_{$roleId}");
            Cache::forget("recruitment_hierarchy_all");

            Log::info('Recruitment hierarchy updated', [
                'role_id' => $roleId,
                'updated_by' => $user->id,
                'changes' => $updateData,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Recruitment hierarchy updated successfully',
                'data' => $hierarchy->fresh()->load('role:id,role_name'),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => "No hierarchy configuration found for role ID {$roleId}"
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to update recruitment hierarchy', [
                'role_id' => $roleId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update recruitment hierarchy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get hierarchy permissions for current user
     * 
     * GET /api/recruitment-hierarchy/my-permissions
     */
    public function getMyPermissions()
    {
        try {
            $user = Auth::user();
            $permissions = $this->hierarchyService->getUserPermissions($user);

            if (!$permissions) {
                return response()->json([
                    'success' => false,
                    'message' => 'No recruitment hierarchy permissions found for your role',
                    'data' => [
                        'has_permissions' => false,
                        'can_create_request' => false,
                        'can_approve_request' => false,
                        'can_assign_ticket' => false,
                        'can_board_without_approval' => false,
                        'can_approve_boarding' => false,
                        'hierarchy_level' => null,
                    ]
                ], 200);
            }

            return response()->json([
                'success' => true,
                'message' => 'Your recruitment permissions retrieved successfully',
                'data' => [
                    'has_permissions' => true,
                    'role_id' => $user->role_id,
                    'role_name' => $user->role->role_name ?? 'Unknown',
                    'can_create_request' => $permissions->can_create_request,
                    'can_approve_request' => $permissions->can_approve_request,
                    'can_assign_ticket' => $permissions->can_assign_ticket,
                    'can_board_without_approval' => $permissions->can_board_without_approval,
                    'can_approve_boarding' => $permissions->can_approve_boarding,
                    'hierarchy_level' => $permissions->hierarchy_level,
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to get user permissions', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve your permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
