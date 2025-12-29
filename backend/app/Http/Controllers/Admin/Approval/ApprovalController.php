<?php

namespace App\Http\Controllers\Admin\Approval;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Services\Approval\ApprovalService;
use App\Http\Requests\Approval\ApproveApprovalRequest;
use App\Http\Requests\Approval\RejectApprovalRequest;
use App\Http\Requests\Approval\CommentApprovalRequest;
use App\Http\Requests\Approval\EscalateApprovalRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
    protected ApprovalService $approvalService;

    public function __construct(ApprovalService $approvalService)
    {
        $this->approvalService = $approvalService;
    }

    /**
     * Get all approvals with filters
     * GET /api/admin/approvals
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Approval::with([
                'requester:id,name,email',
                'currentApprover:id,name,email',
                'workflow:id,workflow_name,workflow_code,total_levels',
                'approvable'
            ]);

            // Filter by module
            if ($request->has('module_name')) {
                $query->where('module_name', $request->module_name);
            }

            // Filter by approval type
            if ($request->has('approval_type')) {
                $query->where('approval_type', $request->approval_type);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by priority
            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            // Filter by overdue
            if ($request->has('is_overdue')) {
                $query->where('is_overdue', $request->boolean('is_overdue'));
            }

            // Filter by date range
            if ($request->has('from_date')) {
                $query->whereDate('requested_at', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('requested_at', '<=', $request->to_date);
            }

            // Search by approvable ID or requester name
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('approvable_id', 'like', "%{$search}%")
                        ->orWhereHas('requester', function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
                        });
                });
            }

            // Order by
            $orderBy = $request->input('order_by', 'requested_at');
            $orderDir = $request->input('order_dir', 'desc');
            $query->orderBy($orderBy, $orderDir);

            // Pagination
            $perPage = $request->input('per_page', 20);
            $approvals = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $approvals
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch approvals', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch approvals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get my pending approvals
     * GET /api/admin/approvals/pending
     */
    public function pending(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();

            $query = Approval::with([
                'requester:id,name,email',
                'workflow:id,workflow_name,workflow_code,total_levels',
                'approvable'
            ])
                ->where('current_approver_id', $userId)
                ->where('status', 'pending');

            // Filter by module
            if ($request->has('module_name')) {
                $query->where('module_name', $request->module_name);
            }

            // Filter by priority
            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            // Filter by age (days pending)
            if ($request->has('age_days')) {
                $ageDays = $request->integer('age_days');
                $query->whereDate('requested_at', '<=', now()->subDays($ageDays));
            }

            $query->orderBy('priority', 'asc')
                ->orderBy('requested_at', 'asc');

            $perPage = $request->input('per_page', 20);
            $approvals = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $approvals,
                'summary' => [
                    'total_pending' => $approvals->total(),
                    'overdue_count' => Approval::where('current_approver_id', $userId)
                        ->where('status', 'pending')
                        ->where('is_overdue', true)
                        ->count(),
                    'high_priority_count' => Approval::where('current_approver_id', $userId)
                        ->where('status', 'pending')
                        ->where('priority', 'high')
                        ->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch pending approvals', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending approvals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get my submitted requests
     * GET /api/admin/approvals/submitted
     */
    public function submitted(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();

            $query = Approval::with([
                'currentApprover:id,name,email',
                'completedBy:id,name,email',
                'workflow:id,workflow_name,workflow_code,total_levels',
                'approvable'
            ])
                ->where('requested_by', $userId);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by module
            if ($request->has('module_name')) {
                $query->where('module_name', $request->module_name);
            }

            $query->orderBy('requested_at', 'desc');

            $perPage = $request->input('per_page', 20);
            $approvals = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $approvals,
                'summary' => [
                    'total_submitted' => $approvals->total(),
                    'pending_count' => Approval::where('requested_by', $userId)
                        ->where('status', 'pending')
                        ->count(),
                    'approved_count' => Approval::where('requested_by', $userId)
                        ->where('status', 'approved')
                        ->count(),
                    'rejected_count' => Approval::where('requested_by', $userId)
                        ->where('status', 'rejected')
                        ->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch submitted approvals', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch submitted approvals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get approvals delegated to me
     * GET /api/admin/approvals/delegated
     */
    public function delegated(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();

            // TODO: Implement delegation logic when ApprovalDelegation is fully implemented
            // For now, return empty result with proper structure

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => [],
                    'total' => 0,
                    'per_page' => 20,
                    'current_page' => 1
                ],
                'message' => 'Delegation feature coming soon'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch delegated approvals', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch delegated approvals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single approval details
     * GET /api/admin/approvals/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $approval = Approval::with([
                'requester:id,name,email',
                'currentApprover:id,name,email',
                'completedBy:id,name,email',
                'workflow:id,workflow_name,workflow_code,workflow_type,total_levels',
                'workflow.levels.approverRole:id,name',
                'workflow.levels.approverUser:id,name,email',
                'approvable',
                'history.actionBy:id,name,email'
            ])
                ->findOrFail($id);

            // If this is a batch approval, load all staff in the batch
            $batchData = null;
            if (isset($approval->metadata['is_batch']) && $approval->metadata['is_batch']) {
                // Try batch_id first (for new uploads with batch tracking)
                if (isset($approval->metadata['batch_id'])) {
                    $batchStaff = \App\Models\Staff::where('upload_batch_id', $approval->metadata['batch_id'])
                        ->with(['client:id,organisation_name', 'recruitmentRequest:id,ticket_id', 'personalInfo:staff_id,mobile_phone'])
                        ->get();
                }
                
                // Fallback to staff_ids array (for older uploads or if batch_id query fails)
                if ((!isset($batchStaff) || $batchStaff->isEmpty()) && isset($approval->metadata['staff_ids'])) {
                    $batchStaff = \App\Models\Staff::whereIn('id', $approval->metadata['staff_ids'])
                        ->with(['client:id,organisation_name', 'recruitmentRequest:id,ticket_id', 'personalInfo:staff_id,mobile_phone'])
                        ->get();
                }
                
                if (isset($batchStaff) && $batchStaff->isNotEmpty()) {
                    $batchData = [
                        'batch_id' => $approval->metadata['batch_id'] ?? null,
                        'staff_count' => $batchStaff->count(),
                        'staff_list' => $batchStaff->map(function ($staff) {
                            return [
                                'id' => $staff->id,
                                'staff_id' => $staff->staff_id,
                                'employee_code' => $staff->employee_code,
                                'first_name' => $staff->first_name,
                                'last_name' => $staff->last_name,
                                'email' => $staff->email,
                                'phone_number' => $staff->personalInfo->mobile_phone ?? null,
                                'boarding_approval_status' => $staff->boarding_approval_status,
                                'status' => $staff->status,
                                'entry_date' => $staff->entry_date,
                            ];
                        }),
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $approval,
                'batch_data' => $batchData
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch approval details', [
                'approval_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch approval details',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get approval history
     * GET /api/admin/approvals/{id}/history
     */
    public function history(int $id): JsonResponse
    {
        try {
            $approval = Approval::findOrFail($id);
            $history = $this->approvalService->getApprovalHistory($approval->id);

            return response()->json([
                'success' => true,
                'data' => $history
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch approval history', [
                'approval_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch approval history',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Approve request
     * POST /api/admin/approvals/{id}/approve
     */
    public function approve(ApproveApprovalRequest $request, int $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $approval = Approval::findOrFail($id);

            // Approve the request
            $result = $this->approvalService->approveRequest(
                $approval,
                $userId,
                $request->input('comments')
            );

            // If approval is now complete and it's a batch approval, activate all staff
            if ($result->status === 'approved' && isset($result->metadata['is_batch']) && $result->metadata['is_batch']) {
                $batchStaff = collect();
                
                // Try batch_id first
                if (isset($result->metadata['batch_id'])) {
                    $batchId = $result->metadata['batch_id'];
                    $batchStaff = \App\Models\Staff::where('upload_batch_id', $batchId)->get();
                }
                
                // Fallback to staff_ids if batch_id didn't find anything
                if ($batchStaff->isEmpty() && isset($result->metadata['staff_ids'])) {
                    $batchStaff = \App\Models\Staff::whereIn('id', $result->metadata['staff_ids'])->get();
                }
                
                if ($batchStaff->isNotEmpty()) {
                    $staffBoardingService = app(\App\Services\StaffBoardingService::class);
                    $userCreatedCount = 0;
                    
                    foreach ($batchStaff as $staff) {
                        // Update staff status
                        $staff->update([
                            'boarding_approval_status' => 'control_approved',
                            'control_approved_by' => $userId,
                            'control_approved_at' => now(),
                            'control_approval_notes' => $request->input('comments'),
                            'status' => $staff->offer_already_accepted ? 'active' : 'inactive',
                        ]);
                        
                        // Create user account for staff
                        $user = $staffBoardingService->createUserAccountForStaff($staff);
                        if ($user) {
                            $userCreatedCount++;
                        }
                        
                        // Update ticket counter if applicable
                        if ($staff->offer_already_accepted && $staff->recruitmentRequest) {
                            $ticket = $staff->recruitmentRequest;
                            $ticket->staff_accepted_offer = ($ticket->staff_accepted_offer ?? 0) + 1;
                            $ticket->save();
                        }
                    }
                    
                    Log::info("Batch approval completed - staff activated", [
                        'batch_id' => $result->metadata['batch_id'] ?? 'none',
                        'approval_id' => $id,
                        'staff_count' => $batchStaff->count(),
                        'users_created' => $userCreatedCount,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Approval processed successfully',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to approve request', [
                'approval_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to approve request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject request
     * POST /api/admin/approvals/{id}/reject
     */
    public function reject(RejectApprovalRequest $request, int $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $approval = Approval::findOrFail($id);

            // Reject the request
            $result = $this->approvalService->rejectRequest(
                $approval,
                $userId,
                $request->input('rejection_reason'),
                $request->input('comments')
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Request rejected successfully',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to reject request', [
                'approval_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reject request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add comment to approval
     * POST /api/admin/approvals/{id}/comment
     */
    public function comment(CommentApprovalRequest $request, int $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $approval = Approval::findOrFail($id);

            // Log comment in approval history
            $this->approvalService->logHistory(
                $approval,
                'commented',
                $userId,
                $approval->status,
                $approval->status,
                $request->input('comment')
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Comment added successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to add comment', [
                'approval_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Escalate approval to higher authority
     * POST /api/admin/approvals/{id}/escalate
     */
    public function escalate(EscalateApprovalRequest $request, int $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $approval = Approval::findOrFail($id);

            // Update current approver to escalated user
            $approval->update([
                'current_approver_id' => $request->input('escalate_to'),
                'status' => 'escalated'
            ]);

            // Log escalation
            $this->approvalService->logHistory(
                $approval,
                'escalated',
                $userId,
                'pending',
                'escalated',
                $request->input('reason')
            );

            // Send notification
            $this->approvalService->notificationService->notifyEscalation(
                $approval,
                $request->input('escalate_to')
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Approval escalated successfully',
                'data' => $approval->fresh([
                    'currentApprover:id,name,email'
                ])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to escalate approval', [
                'approval_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to escalate approval',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel approval request
     * DELETE /api/admin/approvals/{id}
     */
    public function cancel(int $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $approval = Approval::findOrFail($id);

            // Only requester can cancel
            if ($approval->requested_by !== $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only the requester can cancel this approval'
                ], 403);
            }

            // Can only cancel pending approvals
            if ($approval->status !== 'pending' && $approval->status !== 'escalated') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending approvals can be cancelled'
                ], 400);
            }

            // Update status to cancelled
            $approval->update(['status' => 'cancelled']);

            // Log cancellation
            $this->approvalService->logHistory(
                $approval,
                'cancelled',
                $userId,
                'pending',
                'cancelled',
                'Cancelled by requester'
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Approval cancelled successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel approval', [
                'approval_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel approval',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard data
     * GET /api/admin/approvals/dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();

            $dashboardData = [
                'total_pending' => Approval::where('status', 'pending')->count(),
                'awaiting_my_approval' => Approval::where('current_approver_id', $userId)
                    ->where('status', 'pending')
                    ->count(),
                'my_submitted' => Approval::where('requested_by', $userId)
                    ->where('status', 'pending')
                    ->count(),
                'delegated_to_me' => Approval::where('delegated_to', $userId)
                    ->where('status', 'pending')
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $dashboardData
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch dashboard data', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get module breakdown
     * GET /api/admin/approvals/dashboard/modules
     */
    public function moduleBreakdown(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();

            $breakdown = Approval::where('current_approver_id', $userId)
                ->where('status', 'pending')
                ->select('module_name', DB::raw('count(*) as count'))
                ->groupBy('module_name')
                ->get()
                ->map(function ($item) {
                    return [
                        'module' => $item->module_name,
                        'count' => $item->count
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $breakdown
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch module breakdown', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch module breakdown',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get approval statistics
     * GET /api/admin/approvals/stats
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();

            // Get stats for the current user
            $stats = [
                'pending_approvals' => Approval::where('current_approver_id', $userId)
                    ->where('status', 'pending')
                    ->count(),
                'my_pending_submissions' => Approval::where('requested_by', $userId)
                    ->where('status', 'pending')
                    ->count(),
                'overdue_approvals' => Approval::where('current_approver_id', $userId)
                    ->where('status', 'pending')
                    ->where('is_overdue', true)
                    ->count(),
                'high_priority_approvals' => Approval::where('current_approver_id', $userId)
                    ->where('status', 'pending')
                    ->where('priority', 'high')
                    ->count(),
                'module_breakdown' => Approval::where('current_approver_id', $userId)
                    ->where('status', 'pending')
                    ->select('module_name', DB::raw('count(*) as count'))
                    ->groupBy('module_name')
                    ->get(),
                'recent_activity' => Approval::where(function ($q) use ($userId) {
                    $q->where('requested_by', $userId)
                        ->orWhere('current_approver_id', $userId)
                        ->orWhere('completed_by', $userId);
                })
                    ->with(['requester:id,name', 'approvable'])
                    ->orderBy('updated_at', 'desc')
                    ->limit(10)
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch approval statistics', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch approval statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get overdue approvals
     * GET /api/admin/approvals/overdue
     */
    public function overdue(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();

            $query = Approval::with([
                'requester:id,name,email',
                'workflow:id,workflow_name,workflow_code',
                'approvable'
            ])
                ->where('current_approver_id', $userId)
                ->where('status', 'pending')
                ->where('is_overdue', true);

            // Filter by module
            if ($request->has('module_name')) {
                $query->where('module_name', $request->module_name);
            }

            $query->orderBy('due_date', 'asc');

            $perPage = $request->input('per_page', 20);
            $approvals = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $approvals
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch overdue approvals', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch overdue approvals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk approve multiple approvals
     * POST /api/admin/approvals/bulk-approve
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $request->validate([
            'approval_ids' => 'required|array',
            'approval_ids.*' => 'required|integer|exists:approvals,id',
            'comments' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $approvalIds = $request->input('approval_ids');
            $comments = $request->input('comments', '');
            
            $successCount = 0;
            $errors = [];

            foreach ($approvalIds as $approvalId) {
                try {
                    $approval = Approval::findOrFail($approvalId);
                    
                    // Check if user is authorized to approve
                    if ($approval->current_approver_id !== $userId) {
                        $errors[] = "Approval #{$approvalId}: Not authorized";
                        continue;
                    }
                    
                    if ($approval->status !== 'pending') {
                        $errors[] = "Approval #{$approvalId}: Not in pending status";
                        continue;
                    }

                    $this->approvalService->approveRequest($approval, $userId, $comments);
                    
                    // If this is a batch approval, update all staff in the batch
                    if (isset($approval->metadata['is_batch']) && $approval->metadata['is_batch']) {
                        $batchStaff = collect();
                        
                        // Try batch_id first
                        if (isset($approval->metadata['batch_id'])) {
                            $batchId = $approval->metadata['batch_id'];
                            $batchStaff = \App\Models\Staff::where('upload_batch_id', $batchId)->get();
                        }
                        
                        // Fallback to staff_ids if batch_id didn't find anything
                        if ($batchStaff->isEmpty() && isset($approval->metadata['staff_ids'])) {
                            $batchStaff = \App\Models\Staff::whereIn('id', $approval->metadata['staff_ids'])->get();
                        }
                        
                        if ($batchStaff->isNotEmpty()) {
                            $staffBoardingService = app(\App\Services\StaffBoardingService::class);
                            $userCreatedCount = 0;
                            
                            foreach ($batchStaff as $staff) {
                                // Update staff status
                                $staff->update([
                                    'boarding_approval_status' => 'approved',
                                    'status' => 'active',
                                    'approved_by' => $userId,
                                    'approved_at' => now(),
                                ]);
                                
                                // Create user account for staff
                                $user = $staffBoardingService->createUserAccountForStaff($staff);
                                if ($user) {
                                    $userCreatedCount++;
                                }
                            }
                            
                            Log::info("Batch approval completed", [
                                'batch_id' => $approval->metadata['batch_id'] ?? 'none',
                                'approval_id' => $approvalId,
                                'staff_activated' => $batchStaff->count(),
                                'users_created' => $userCreatedCount,
                            ]);
                        }
                    }
                    
                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = "Approval #{$approvalId}: {$e->getMessage()}";
                    Log::error("Bulk approve error for #{$approvalId}", ['error' => $e->getMessage()]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully approved {$successCount} of " . count($approvalIds) . " approvals",
                'data' => [
                    'success_count' => $successCount,
                    'total_count' => count($approvalIds),
                    'errors' => $errors
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk approve failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bulk approve failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk reject multiple approvals
     * POST /api/admin/approvals/bulk-reject
     */
    public function bulkReject(Request $request): JsonResponse
    {
        $request->validate([
            'approval_ids' => 'required|array',
            'approval_ids.*' => 'required|integer|exists:approvals,id',
            'rejection_reason' => 'required|string|max:500',
            'comments' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $approvalIds = $request->input('approval_ids');
            $rejectionReason = $request->input('rejection_reason');
            $comments = $request->input('comments', '');
            
            $successCount = 0;
            $errors = [];

            foreach ($approvalIds as $approvalId) {
                try {
                    $approval = Approval::findOrFail($approvalId);
                    
                    // Check if user is authorized to reject
                    if ($approval->current_approver_id !== $userId) {
                        $errors[] = "Approval #{$approvalId}: Not authorized";
                        continue;
                    }
                    
                    if ($approval->status !== 'pending') {
                        $errors[] = "Approval #{$approvalId}: Not in pending status";
                        continue;
                    }

                    $this->approvalService->rejectRequest($approval, $userId, $rejectionReason, $comments);
                    
                    // If this is a batch approval, update all staff in the batch
                    if (isset($approval->metadata['is_batch']) && $approval->metadata['is_batch']) {
                        // Try batch_id first
                        if (isset($approval->metadata['batch_id'])) {
                            $batchId = $approval->metadata['batch_id'];
                            $updated = \App\Models\Staff::where('upload_batch_id', $batchId)->update([
                                'boarding_approval_status' => 'rejected',
                                'status' => 'inactive',
                                'rejected_by' => $userId,
                                'rejected_at' => now(),
                                'rejection_reason' => $rejectionReason,
                            ]);
                        }
                        
                        // Fallback to staff_ids if batch_id didn't update anything
                        if ((!isset($updated) || $updated === 0) && isset($approval->metadata['staff_ids'])) {
                            \App\Models\Staff::whereIn('id', $approval->metadata['staff_ids'])->update([
                                'boarding_approval_status' => 'rejected',
                                'status' => 'inactive',
                                'rejected_by' => $userId,
                                'rejected_at' => now(),
                                'rejection_reason' => $rejectionReason,
                            ]);
                        }
                        
                        Log::info("Batch approval rejected {$approval->metadata['staff_count']} staff", [
                            'batch_id' => $approval->metadata['batch_id'] ?? 'none',
                            'approval_id' => $approvalId,
                        ]);
                    }
                    
                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = "Approval #{$approvalId}: {$e->getMessage()}";
                    Log::error("Bulk reject error for #{$approvalId}", ['error' => $e->getMessage()]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully rejected {$successCount} of " . count($approvalIds) . " approvals",
                'data' => [
                    'success_count' => $successCount,
                    'total_count' => count($approvalIds),
                    'errors' => $errors
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk reject failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bulk reject failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete multiple approvals
     * POST /api/admin/approvals/bulk-delete
     * 
     * Deletes approval requests and associated approvable records
     * Allows requester or approver to clean up and re-upload
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $request->validate([
            'approval_ids' => 'required|array',
            'approval_ids.*' => 'required|integer|exists:approvals,id',
        ]);

        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $approvalIds = $request->input('approval_ids');
            
            $successCount = 0;
            $errors = [];

            foreach ($approvalIds as $approvalId) {
                try {
                    $approval = Approval::with('approvable')->findOrFail($approvalId);
                    
                    // Check if user is authorized to delete (must be requester or current approver)
                    if ($approval->requested_by !== $userId && $approval->current_approver_id !== $userId) {
                        $errors[] = "Approval #{$approvalId}: Not authorized";
                        continue;
                    }

                    // If this is a batch approval, delete all staff in the batch
                    if (isset($approval->metadata['is_batch']) && $approval->metadata['is_batch']) {
                        $batchStaff = collect();
                        
                        // Try batch_id first
                        if (isset($approval->metadata['batch_id'])) {
                            $batchId = $approval->metadata['batch_id'];
                            $batchStaff = \App\Models\Staff::where('upload_batch_id', $batchId)->get();
                        }
                        
                        // Fallback to staff_ids if batch_id didn't find anything
                        if ($batchStaff->isEmpty() && isset($approval->metadata['staff_ids'])) {
                            $batchStaff = \App\Models\Staff::whereIn('id', $approval->metadata['staff_ids'])->get();
                        }
                        
                        foreach ($batchStaff as $staff) {
                            // Delete associated user if exists
                            if ($staff->user) {
                                $staff->user->delete();
                            }
                            // Delete staff record
                            $staff->delete();
                        }
                        
                        Log::info("Batch approval deleted {$batchStaff->count()} staff", [
                            'batch_id' => $approval->metadata['batch_id'] ?? 'none',
                            'approval_id' => $approvalId,
                        ]);
                    } else {
                        // Delete single staff/user if this is individual staff boarding approval
                        if ($approval->approvable_type === 'App\\Models\\Staff' && $approval->approvable) {
                            $staff = $approval->approvable;
                            
                            // Delete associated user if exists
                            if ($staff->user) {
                                $staff->user->delete();
                            }
                            
                            // Delete staff record
                            $staff->delete();
                        }
                    }

                    // Delete approval history
                    $approval->history()->delete();
                    
                    // Delete approval
                    $approval->delete();
                    
                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = "Approval #{$approvalId}: {$e->getMessage()}";
                    Log::error("Bulk delete error for #{$approvalId}", ['error' => $e->getMessage()]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$successCount} of " . count($approvalIds) . " approvals",
                'data' => [
                    'success_count' => $successCount,
                    'total_count' => count($approvalIds),
                    'errors' => $errors
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk delete failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Bulk delete failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
