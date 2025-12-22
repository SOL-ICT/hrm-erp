<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Finance\AdvanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdvanceController extends Controller
{
    protected $advanceService;

    public function __construct(AdvanceService $advanceService)
    {
        $this->advanceService = $advanceService;
    }

    /**
     * Get all advances
     */
    public function index(Request $request)
    {
        try {
            // Debug: Auth and request info
            \Log::info('AdvanceController@index called');
            \Log::info('Auth user ID: ' . (auth()->id() ?? 'null'));
            \Log::info('Auth check: ' . (auth()->check() ? 'true' : 'false'));
            \Log::info('Request headers: ', $request->headers->all());
            
            // Debug: Direct count
            $directCount = \App\Models\Advance::count();
            \Log::info('AdvanceController@index - Direct Advance count: ' . $directCount);
            
            $filters = [
                'status' => $request->status,
                'user_id' => $request->user_id,
                'office' => $request->office,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'budget_line' => $request->budget_line,
                'per_page' => $request->per_page ?? 15,
            ];

            \Log::info('AdvanceController@index filters:', $filters);

            $advances = $this->advanceService->getAdvancesByStatus($request->status, $filters);

            \Log::info('AdvanceController@index - Service returned total: ' . $advances->total());

            return response()->json([
                'success' => true,
                'message' => 'Advances retrieved successfully',
                'data' => $advances
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving advances: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new advance request
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:1',
                'purpose' => 'required|string|max:1000',
                'office' => 'required|string|max:100',
                'budget_line' => 'required|in:operational,capital,emergency,training,travel,miscellaneous',
                'supporting_documents' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $advance = $this->advanceService->create([
                'user_id' => auth()->id(),
                'amount' => $request->amount,
                'purpose' => $request->purpose,
                'office' => $request->office,
                'budget_line' => $request->budget_line,
                'supporting_documents' => $request->supporting_documents ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Advance request created successfully',
                'data' => $advance
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating advance request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single advance
     */
    public function show($id)
    {
        try {
            $advance = $this->advanceService->getAdvanceById($id);

            if (!$advance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Advance not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Advance retrieved successfully',
                'data' => $advance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving advance: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel advance request
     */
    public function cancel(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $advance = $this->advanceService->cancel($id, auth()->id(), $request->reason);

            return response()->json([
                'success' => true,
                'message' => 'Advance cancelled successfully',
                'data' => $advance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error cancelling advance: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve advance
     */
    public function approve(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'comments' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $advance = $this->advanceService->approve($id, auth()->id(), $request->comments);

            return response()->json([
                'success' => true,
                'message' => 'Advance approved successfully',
                'data' => $advance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error approving advance: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject advance
     */
    public function reject(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $advance = $this->advanceService->reject($id, auth()->id(), $request->reason);

            return response()->json([
                'success' => true,
                'message' => 'Advance rejected successfully',
                'data' => $advance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error rejecting advance: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Disburse advance
     */
    public function disburse(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'disbursement_reference' => 'required|string|max:200',
                'disbursement_notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $advance = $this->advanceService->disburse(
                $id,
                auth()->id(),
                $request->disbursement_reference,
                $request->disbursement_notes
            );

            return response()->json([
                'success' => true,
                'message' => 'Advance disbursed successfully',
                'data' => $advance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error disbursing advance: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's advances
     */
    public function myAdvances(Request $request)
    {
        try {
            $authId = auth()->id();
            $authUser = auth()->user();
            \Log::info('[MyAdvances] Auth ID: ' . ($authId ?? 'NULL'));
            \Log::info('[MyAdvances] Auth user: ' . ($authUser ? json_encode(['id' => $authUser->id, 'email' => $authUser->email]) : 'NULL'));
            \Log::info('[MyAdvances] Request headers: ' . json_encode($request->headers->all()));
            
            // Check database directly
            $dbCount = \DB::table('advances')->where('user_id', $authId)->count();
            \Log::info('[MyAdvances] DB count for user ' . $authId . ': ' . $dbCount);
            
            $filters = [
                'status' => $request->status,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'per_page' => $request->per_page ?? 15,
            ];

            $advances = $this->advanceService->getMyAdvances($authId, $filters);
            \Log::info('[MyAdvances] Service returned advances count: ' . $advances->total());

            return response()->json([
                'success' => true,
                'message' => 'Your advances retrieved successfully',
                'data' => $advances
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving advances: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending approvals
     */
    public function pendingApprovals()
    {
        try {
            $advances = $this->advanceService->getPendingApprovals();

            return response()->json([
                'success' => true,
                'message' => 'Pending approvals retrieved successfully',
                'data' => $advances
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving pending approvals: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get advances ready for disbursement
     */
    public function readyForDisbursement(Request $request)
    {
        try {
            $filters = [
                'office' => $request->office,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'per_page' => $request->per_page ?? 15,
            ];

            $advances = $this->advanceService->getReadyForDisbursement($filters);

            return response()->json([
                'success' => true,
                'message' => 'Advances ready for disbursement retrieved successfully',
                'data' => $advances
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving advances: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get overdue retirements
     */
    public function overdueRetirements()
    {
        try {
            // Mark overdue before fetching
            $this->advanceService->markOverdueAdvances();
            $advances = $this->advanceService->getOverdueRetirements();

            return response()->json([
                'success' => true,
                'message' => 'Overdue retirements retrieved successfully',
                'data' => $advances
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving overdue retirements: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get advance statistics
     */
    public function statistics(Request $request)
    {
        try {
            $filters = [
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'office' => $request->office,
            ];

            $userId = $request->user_id ?? null;
            $statistics = $this->advanceService->getStatistics($userId, $filters);

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
