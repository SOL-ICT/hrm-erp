<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Finance\RetirementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RetirementController extends Controller
{
    protected $retirementService;

    public function __construct(RetirementService $retirementService)
    {
        $this->retirementService = $retirementService;
    }

    /**
     * Get all retirements
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'status' => $request->status,
                'advance_id' => $request->advance_id,
                'user_id' => $request->user_id,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'per_page' => $request->per_page ?? 15,
            ];

            $retirements = $this->retirementService->getAllRetirements($filters);

            return response()->json([
                'success' => true,
                'message' => 'Retirements retrieved successfully',
                'data' => $retirements
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving retirements: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit retirement
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'advance_id' => 'required|exists:advances,id',
                'actual_amount_spent' => 'required|numeric|min:0',
                'supporting_documents' => 'nullable|array',
                'supporting_documents.*' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.description' => 'required|string|max:500',
                'items.*.category' => 'required|string|max:100',
                'items.*.amount' => 'required|numeric|min:0',
                'items.*.receipt_reference' => 'nullable|string|max:100',
                'items.*.receipt_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $retirement = $this->retirementService->submit([
                'advance_id' => $request->advance_id,
                'actual_amount_spent' => $request->actual_amount_spent,
                'supporting_documents' => $request->supporting_documents ?? [],
            ], $request->items);

            return response()->json([
                'success' => true,
                'message' => 'Retirement submitted successfully',
                'data' => $retirement
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error submitting retirement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single retirement
     */
    public function show($id)
    {
        try {
            $retirement = $this->retirementService->getRetirementById($id);

            if (!$retirement) {
                return response()->json([
                    'success' => false,
                    'message' => 'Retirement not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Retirement retrieved successfully',
                'data' => $retirement
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving retirement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add item to retirement
     */
    public function addItem(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'description' => 'required|string|max:500',
                'category' => 'required|string|max:100',
                'amount' => 'required|numeric|min:0',
                'receipt_reference' => 'nullable|string|max:100',
                'receipt_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $item = $this->retirementService->addItem($id, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Item added successfully',
                'data' => $item
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error adding item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Review retirement
     */
    public function review(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'comments' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $retirement = $this->retirementService->review($id, auth()->id(), $request->comments);

            return response()->json([
                'success' => true,
                'message' => 'Retirement reviewed successfully',
                'data' => $retirement
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error reviewing retirement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve retirement
     */
    public function approve(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'comments' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $retirement = $this->retirementService->approve($id, auth()->id(), $request->comments);

            return response()->json([
                'success' => true,
                'message' => 'Retirement approved successfully',
                'data' => $retirement
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error approving retirement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject retirement
     */
    public function reject(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $retirement = $this->retirementService->reject($id, auth()->id(), $request->reason);

            return response()->json([
                'success' => true,
                'message' => 'Retirement rejected successfully',
                'data' => $retirement
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error rejecting retirement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Query retirement
     */
    public function query(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'query_reason' => 'required|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $retirement = $this->retirementService->query($id, auth()->id(), $request->query_reason);

            return response()->json([
                'success' => true,
                'message' => 'Retirement queried successfully',
                'data' => $retirement
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error querying retirement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending reviews
     */
    public function pendingReviews()
    {
        try {
            $retirements = $this->retirementService->getPendingReviews();

            return response()->json([
                'success' => true,
                'message' => 'Pending reviews retrieved successfully',
                'data' => $retirements
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving pending reviews: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get overdue retirements
     */
    public function overdueRetirements()
    {
        try {
            $retirements = $this->retirementService->getOverdueRetirements();

            return response()->json([
                'success' => true,
                'message' => 'Overdue retirements retrieved successfully',
                'data' => $retirements
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving overdue retirements: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get retirement statistics
     */
    public function statistics(Request $request)
    {
        try {
            $filters = [
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'user_id' => $request->user_id,
            ];

            $statistics = $this->retirementService->getStatistics($filters);

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
