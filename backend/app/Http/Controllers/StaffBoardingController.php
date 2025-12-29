<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use App\Models\User;
use App\Services\StaffBoardingService;
use App\Services\RecruitmentHierarchyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class StaffBoardingController extends Controller
{
    private StaffBoardingService $boardingService;
    private RecruitmentHierarchyService $hierarchyService;

    public function __construct(
        StaffBoardingService $boardingService,
        RecruitmentHierarchyService $hierarchyService
    ) {
        $this->boardingService = $boardingService;
        $this->hierarchyService = $hierarchyService;
    }

    /**
     * Get pending approvals for current user
     * 
     * Returns:
     * - For ticket creators: Their own boarding tickets
     * - For approvers: All tickets they can approve
     * - For Control: All tickets pending final approval
     * 
     * GET /api/boarding/pending-approvals
     */
    public function getPendingApprovals(Request $request)
    {
        try {
            $user = Auth::user();
            $query = Staff::with([
                'recruitmentRequest.client:id,organisation_name',
                'recruitmentRequest.jobStructure:id,job_title',
                'onboardedBy:id,name,email',
                'approvedBy:id,name,email',
                'controlApprovedBy:id,name,email',
                'approval:id,status,current_approver_id,current_approval_level,total_approval_levels,requested_at,due_date,is_overdue,priority',
                'approval.currentApprover:id,first_name,last_name,email',
                'approval.workflow:id,workflow_name,total_levels'
            ]);

            // Determine what user can see based on their role
            $permissions = $this->hierarchyService->getUserPermissions($user);

            if ($permissions['can_approve_boarding']) {
                // User can approve - show all pending or pending_control_approval
                if ($permissions['hierarchy_level'] === 0) {
                    // Control Department - only show pending_control_approval
                    $query->where('boarding_approval_status', 'pending_control_approval');
                } else {
                    // Regular approvers - show 'pending' status
                    $query->where('boarding_approval_status', 'pending');
                }
            } else {
                // Non-approvers see only their own boarding tickets
                $query->where('onboarded_by', $user->id)
                    ->whereIn('boarding_approval_status', ['pending', 'pending_control_approval']);
            }

            // Apply additional filters
            if ($request->filled('status')) {
                $query->where('boarding_approval_status', $request->status);
            }

            if ($request->filled('client_id')) {
                $query->whereHas('recruitmentRequest', function ($q) use ($request) {
                    $q->where('client_id', $request->client_id);
                });
            }

            // Sorting
            $sortField = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortField, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $staff = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Pending approvals retrieved successfully',
                'data' => $staff->items(),
                'pagination' => [
                    'total' => $staff->total(),
                    'per_page' => $staff->perPage(),
                    'current_page' => $staff->currentPage(),
                    'last_page' => $staff->lastPage(),
                    'from' => $staff->firstItem(),
                    'to' => $staff->lastItem(),
                ],
                'user_permissions' => $permissions,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to get pending approvals', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pending approvals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve single staff boarding (supervisor level)
     * Moves from 'pending' to 'pending_control_approval'
     * 
     * POST /api/boarding/{staffId}/approve
     */
    public function approveBoarding(Request $request, $staffId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'approval_notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $staff = Staff::with('recruitmentRequest')->findOrFail($staffId);
            $user = Auth::user();

            // Attempt approval
            $approvedStaff = $this->boardingService->approveBoarding(
                $staff,
                $user,
                $request->approval_notes
            );

            return response()->json([
                'success' => true,
                'message' => 'Staff boarding approved successfully. Awaiting Control Department final approval.',
                'data' => $approvedStaff->load([
                    'recruitmentRequest.client',
                    'onboardedBy',
                    'approvedBy',
                    'approval:id,status,current_approver_id,current_approval_level,total_approval_levels,due_date,is_overdue',
                    'approval.currentApprover:id,first_name,last_name,email',
                    'approval.workflow:id,workflow_name,total_levels'
                ]),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to approve staff boarding', [
                'staff_id' => $staffId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Control Department final approval
     * Moves from 'pending_control_approval' to 'control_approved'
     * This activates the staff for payroll
     * 
     * POST /api/boarding/{staffId}/control-approve
     */
    public function controlApprove(Request $request, $staffId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'control_approval_notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $staff = Staff::with('recruitmentRequest')->findOrFail($staffId);
            $user = Auth::user();

            // Attempt Control approval
            $approvedStaff = $this->boardingService->controlApprove(
                $staff,
                $user,
                $request->control_approval_notes
            );

            return response()->json([
                'success' => true,
                'message' => 'Control Department approval completed. Staff is now active for payroll.',
                'data' => $approvedStaff->load([
                    'recruitmentRequest.client',
                    'onboardedBy',
                    'approvedBy',
                    'controlApprovedBy',
                    'approval:id,status,completed_at,completed_by',
                    'approval.completedBy:id,first_name,last_name,email',
                    'approval.workflow:id,workflow_name'
                ]),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to control-approve staff boarding', [
                'staff_id' => $staffId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Reject staff boarding (supervisor level)
     * 
     * POST /api/boarding/{staffId}/reject
     */
    public function rejectBoarding(Request $request, $staffId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'rejection_reason' => 'required|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $staff = Staff::with('recruitmentRequest')->findOrFail($staffId);
            $user = Auth::user();

            // Attempt rejection
            $rejectedStaff = $this->boardingService->rejectBoarding(
                $staff,
                $user,
                $request->rejection_reason
            );

            return response()->json([
                'success' => true,
                'message' => 'Staff boarding rejected successfully',
                'data' => $rejectedStaff->load([
                    'recruitmentRequest.client',
                    'onboardedBy'
                ]),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to reject staff boarding', [
                'staff_id' => $staffId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Control Department rejection
     * 
     * POST /api/boarding/{staffId}/control-reject
     */
    public function controlReject(Request $request, $staffId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'control_rejection_reason' => 'required|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $staff = Staff::with('recruitmentRequest')->findOrFail($staffId);
            $user = Auth::user();

            // Attempt Control rejection
            $rejectedStaff = $this->boardingService->controlReject(
                $staff,
                $user,
                $request->control_rejection_reason
            );

            return response()->json([
                'success' => true,
                'message' => 'Control Department rejected staff boarding due to compliance issues',
                'data' => $rejectedStaff->load([
                    'recruitmentRequest.client',
                    'onboardedBy',
                    'approvedBy',
                    'controlRejectedBy'
                ]),
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to control-reject staff boarding', [
                'staff_id' => $staffId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Bulk approve multiple staff
     * 
     * POST /api/boarding/bulk-approve
     */
    public function bulkApprove(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'staff_ids' => 'required|array|min:1',
                'staff_ids.*' => 'required|integer|exists:staff,id',
                'approval_notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $staffIds = $request->staff_ids;
            $notes = $request->approval_notes;

            $results = [
                'approved' => [],
                'failed' => [],
                'total' => count($staffIds),
            ];

            foreach ($staffIds as $staffId) {
                try {
                    $staff = Staff::findOrFail($staffId);
                    $approvedStaff = $this->boardingService->approveBoarding($staff, $user, $notes);

                    $results['approved'][] = [
                        'id' => $staffId,
                        'staff_name' => $staff->first_name . ' ' . $staff->last_name,
                        'status' => 'success',
                    ];
                } catch (\Exception $e) {
                    $results['failed'][] = [
                        'id' => $staffId,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            $results['approved_count'] = count($results['approved']);
            $results['failed_count'] = count($results['failed']);
            $results['success_rate'] = round(($results['approved_count'] / $results['total']) * 100, 2);

            return response()->json([
                'success' => true,
                'message' => "Bulk approval completed: {$results['approved_count']}/{$results['total']} staff approved",
                'data' => $results,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Bulk approval failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bulk approval operation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk Control approve multiple staff
     * 
     * POST /api/boarding/bulk-control-approve
     */
    public function bulkControlApprove(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'staff_ids' => 'required|array|min:1',
                'staff_ids.*' => 'required|integer|exists:staff,id',
                'control_approval_notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $staffIds = $request->staff_ids;
            $notes = $request->control_approval_notes;

            $results = [
                'approved' => [],
                'failed' => [],
                'total' => count($staffIds),
            ];

            foreach ($staffIds as $staffId) {
                try {
                    $staff = Staff::findOrFail($staffId);
                    $approvedStaff = $this->boardingService->controlApprove($staff, $user, $notes);

                    $results['approved'][] = [
                        'id' => $staffId,
                        'staff_name' => $staff->first_name . ' ' . $staff->last_name,
                        'status' => 'success',
                    ];
                } catch (\Exception $e) {
                    $results['failed'][] = [
                        'id' => $staffId,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            $results['approved_count'] = count($results['approved']);
            $results['failed_count'] = count($results['failed']);
            $results['success_rate'] = round(($results['approved_count'] / $results['total']) * 100, 2);

            return response()->json([
                'success' => true,
                'message' => "Bulk Control approval completed: {$results['approved_count']}/{$results['total']} staff approved",
                'data' => $results,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Bulk Control approval failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bulk Control approval operation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
