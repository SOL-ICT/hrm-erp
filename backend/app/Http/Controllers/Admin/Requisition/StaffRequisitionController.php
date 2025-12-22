<?php

namespace App\Http\Controllers\Admin\Requisition;

use App\Http\Controllers\Controller;
use App\Services\Requisition\RequisitionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Models\StaffRequisition;

/**
 * Staff Requisition Controller
 * 
 * Manages staff requisitions throughout their lifecycle.
 * Handles creation, approval, rejection, collection, and tracking.
 */
class StaffRequisitionController extends Controller
{
    protected $requisitionService;

    public function __construct(RequisitionService $requisitionService)
    {
        $this->requisitionService = $requisitionService;
    }

    /**
     * Get requisitions (filtered by role)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = StaffRequisition::with(['user', 'items.inventoryItem', 'approver']);

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Filter by collection status
            if ($request->has('collection_status') && $request->collection_status) {
                $query->where('collection_status', $request->collection_status);
            }

            // Filter by department
            if ($request->has('department') && $request->department) {
                $query->byDepartment($request->department);
            }

            // Filter by branch
            if ($request->has('branch') && $request->branch) {
                $query->byBranch($request->branch);
            }

            // Filter by date range
            if ($request->has('date_from') && $request->has('date_to')) {
                $query->dateRange($request->date_from, $request->date_to);
            }

            // Filter by user (for staff viewing their own)
            if ($request->has('user_id') && $request->user_id) {
                $query->forUser($request->user_id);
            }

            // Search by requisition code
            if ($request->has('search') && $request->search) {
                $query->where('requisition_code', 'like', '%' . $request->search . '%');
            }

            // Sort
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate
            $perPage = $request->input('per_page', 15);
            $requisitions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Requisitions retrieved successfully',
                'data' => $requisitions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve requisitions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new requisition (Staff)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'department' => 'required|string|max:100',
            'branch' => 'required|string|max:100',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|integer|exists:store_inventory,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.purpose' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $requisition = $this->requisitionService->createRequisition($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Requisition created successfully',
                'data' => $requisition
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create requisition',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get requisition details
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $requisition = StaffRequisition::with([
                'user',
                'items.inventoryItem',
                'approver',
                'collector',
                'statusLogs.user'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Requisition retrieved successfully',
                'data' => $requisition
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Requisition not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get current user's requisitions
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function myRequisitions(Request $request)
    {
        try {
            $query = StaffRequisition::with(['items.inventoryItem', 'approver'])
                ->forUser(Auth::id());

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            // Sort
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate
            $perPage = $request->input('per_page', 15);
            $requisitions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Your requisitions retrieved successfully',
                'data' => $requisitions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve requisitions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending requisitions (Store Keeper)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function pendingApprovals(Request $request)
    {
        try {
            $query = StaffRequisition::with(['user', 'items.inventoryItem'])
                ->pending();

            // Filter by department
            if ($request->has('department') && $request->department) {
                $query->byDepartment($request->department);
            }

            // Filter by branch
            if ($request->has('branch') && $request->branch) {
                $query->byBranch($request->branch);
            }

            // Sort
            $sortBy = $request->input('sort_by', 'request_date');
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate
            $perPage = $request->input('per_page', 15);
            $requisitions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Pending requisitions retrieved successfully',
                'data' => $requisitions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pending requisitions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve requisition (Store Keeper)
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function approve(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'comments' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $requisition = $this->requisitionService->approveRequisition(
                $id,
                $request->input('comments')
            );

            return response()->json([
                'success' => true,
                'message' => 'Requisition approved successfully',
                'data' => $requisition
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve requisition',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject requisition (Store Keeper)
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function reject(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $requisition = $this->requisitionService->rejectRequisition(
                $id,
                $request->reason
            );

            return response()->json([
                'success' => true,
                'message' => 'Requisition rejected successfully',
                'data' => $requisition
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject requisition',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel requisition (Staff, if pending)
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $requisition = $this->requisitionService->cancelRequisition(
                $id,
                $request->input('reason')
            );

            return response()->json([
                'success' => true,
                'message' => 'Requisition cancelled successfully',
                'data' => $requisition
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel requisition',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark items ready for collection (Store Keeper)
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markReady(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'comments' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $requisition = $this->requisitionService->markReady(
                $id,
                $request->input('comments')
            );

            return response()->json([
                'success' => true,
                'message' => 'Items marked as ready for collection',
                'data' => $requisition
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark items as ready',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark items as collected (Store Keeper)
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markCollected(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'comments' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $requisition = $this->requisitionService->markCollected(
                $id,
                $request->input('comments')
            );

            return response()->json([
                'success' => true,
                'message' => 'Items marked as collected successfully',
                'data' => $requisition
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark items as collected',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get requisition statistics
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics(Request $request)
    {
        try {
            $filters = [];

            // Filter by user (for staff viewing their own stats)
            if ($request->has('user_id') && $request->user_id) {
                $filters['user_id'] = $request->user_id;
            }

            // Filter by department
            if ($request->has('department') && $request->department) {
                $filters['department'] = $request->department;
            }

            // Filter by date range
            if ($request->has('date_from') && $request->has('date_to')) {
                $filters['date_from'] = $request->date_from;
                $filters['date_to'] = $request->date_to;
            }

            $stats = $this->requisitionService->getStatistics($filters);

            return response()->json([
                'success' => true,
                'message' => 'Statistics retrieved successfully',
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get requisitions ready for collection
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function readyForCollection(Request $request)
    {
        try {
            $query = StaffRequisition::with(['user', 'items.inventoryItem', 'approver'])
                ->readyForCollection();

            // Filter by department
            if ($request->has('department') && $request->department) {
                $query->byDepartment($request->department);
            }

            // Filter by branch
            if ($request->has('branch') && $request->branch) {
                $query->byBranch($request->branch);
            }

            // Sort
            $sortBy = $request->input('sort_by', 'approval_date');
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate
            $perPage = $request->input('per_page', 15);
            $requisitions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Requisitions ready for collection retrieved successfully',
                'data' => $requisitions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve requisitions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
