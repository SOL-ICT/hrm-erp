<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Procurement\PurchaseRequestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PurchaseRequestController extends Controller
{
    protected $purchaseRequestService;

    public function __construct(PurchaseRequestService $purchaseRequestService)
    {
        $this->purchaseRequestService = $purchaseRequestService;
    }

    /**
     * Get all purchase requests
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'status' => $request->status,
                'admin_status' => $request->admin_status,
                'finance_status' => $request->finance_status,
                'priority' => $request->priority,
                'requested_by' => $request->requested_by,
                'branch' => $request->branch,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'per_page' => $request->per_page ?? 15,
            ];

            $purchaseRequests = $this->purchaseRequestService->getPurchaseRequests($filters);

            return response()->json([
                'success' => true,
                'message' => 'Purchase requests retrieved successfully',
                'data' => $purchaseRequests
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving purchase requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single purchase request
     */
    public function show($id)
    {
        try {
            $purchaseRequest = \App\Models\PurchaseRequest::with([
                'items.inventoryItem',
                'requester',
                'reviewer',
                'approver',
                'rejecter',
                'completer',
                'procurementLogs'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Purchase request retrieved successfully',
                'data' => $purchaseRequest
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving purchase request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create purchase request
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'branch' => 'required|string|max:100',
                'priority' => 'nullable|in:low,medium,high,urgent',
                'justification' => 'nullable|string',
                'required_date' => 'required|date|after:today',
                'items' => 'required|array|min:1',
                'items.*.item_name' => 'required|string|max:200',
                'items.*.item_category' => 'nullable|string|max:100',
                'items.*.item_code' => 'nullable|string|max:50',
                'items.*.inventory_item_id' => 'nullable|exists:store_inventory,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.total' => 'required|numeric|min:0',
                'items.*.justification' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $purchaseRequest = $this->purchaseRequestService->createPurchaseRequest(
                $request->all(),
                auth()->id()
            );

            return response()->json([
                'success' => true,
                'message' => 'Purchase request created successfully',
                'data' => $purchaseRequest
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating purchase request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel purchase request
     */
    public function destroy($id)
    {
        try {
            $purchaseRequest = $this->purchaseRequestService->cancelPurchaseRequest(
                $id,
                auth()->id()
            );

            return response()->json([
                'success' => true,
                'message' => 'Purchase request cancelled successfully',
                'data' => $purchaseRequest
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cancelling purchase request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's own purchase requests
     */
    public function myRequests(Request $request)
    {
        try {
            $filters = [
                'requested_by' => auth()->id(),
                'status' => $request->status,
                'per_page' => $request->per_page ?? 15,
            ];

            $purchaseRequests = $this->purchaseRequestService->getPurchaseRequests($filters);

            return response()->json([
                'success' => true,
                'message' => 'Your purchase requests retrieved successfully',
                'data' => $purchaseRequests
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving your purchase requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Review purchase request (Admin Officer)
     */
    public function review(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'action' => 'required|in:approve,reject',
                'comments' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $purchaseRequest = $this->purchaseRequestService->reviewPurchaseRequest(
                $id,
                auth()->id(),
                $request->action,
                $request->comments
            );

            return response()->json([
                'success' => true,
                'message' => 'Purchase request ' . $request->action . 'd successfully',
                'data' => $purchaseRequest
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error reviewing purchase request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve purchase request (Finance Director)
     */
    public function approve(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'comments' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $purchaseRequest = $this->purchaseRequestService->approvePurchaseRequest(
                $id,
                auth()->id(),
                $request->comments
            );

            return response()->json([
                'success' => true,
                'message' => 'Purchase request approved successfully',
                'data' => $purchaseRequest
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error approving purchase request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject purchase request
     */
    public function reject(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $purchaseRequest = $this->purchaseRequestService->rejectPurchaseRequest(
                $id,
                auth()->id(),
                $request->reason
            );

            return response()->json([
                'success' => true,
                'message' => 'Purchase request rejected successfully',
                'data' => $purchaseRequest
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error rejecting purchase request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending review requests
     */
    public function pendingReview()
    {
        try {
            $purchaseRequests = $this->purchaseRequestService->getPendingReview();

            return response()->json([
                'success' => true,
                'message' => 'Pending review requests retrieved successfully',
                'data' => $purchaseRequests
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving pending review requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending finance approval
     */
    public function pendingFinance()
    {
        try {
            $purchaseRequests = $this->purchaseRequestService->getPendingFinance();

            return response()->json([
                'success' => true,
                'message' => 'Pending finance requests retrieved successfully',
                'data' => $purchaseRequests
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving pending finance requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics
     */
    public function statistics(Request $request)
    {
        try {
            $userId = $request->user_id ?? ($request->my_stats ? auth()->id() : null);
            $statistics = $this->purchaseRequestService->getStatistics($userId);

            return response()->json([
                'success' => true,
                'message' => 'Statistics retrieved successfully',
                'data' => $statistics
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving statistics: ' . $e->getMessage()
            ], 500);
        }
    }
}
