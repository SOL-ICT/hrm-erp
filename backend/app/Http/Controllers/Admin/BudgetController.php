<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Finance\BudgetService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BudgetController extends Controller
{
    protected $budgetService;

    public function __construct(BudgetService $budgetService)
    {
        $this->budgetService = $budgetService;
    }

    /**
     * Allocate budget
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'amount' => 'required|numeric|min:0',
                'fiscal_year' => 'required|integer|min:2020|max:2100',
                'budget_period' => 'required|in:annual,quarterly,monthly',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $budgetAllocation = $this->budgetService->allocateBudget(
                $request->user_id,
                $request->amount,
                $request->fiscal_year,
                $request->budget_period,
                auth()->id()
            );

            return response()->json([
                'success' => true,
                'message' => 'Budget allocated successfully',
                'data' => $budgetAllocation
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error allocating budget: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all budget allocations
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'fiscal_year' => $request->fiscal_year,
                'is_active' => $request->is_active,
                'user_id' => $request->user_id,
                'budget_period' => $request->budget_period,
                'per_page' => $request->per_page ?? 15,
            ];

            $budgets = $this->budgetService->getAllBudgetAllocations($filters);

            return response()->json([
                'success' => true,
                'message' => 'Budget allocations retrieved successfully',
                'data' => $budgets
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving budget allocations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's budget
     */
    public function myBudget(Request $request)
    {
        try {
            $fiscalYear = $request->fiscal_year ?? date('Y');
            $budget = $this->budgetService->getUserBudget(auth()->id(), $fiscalYear);

            if (!$budget) {
                return response()->json([
                    'success' => false,
                    'message' => 'No budget allocation found for the specified year'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Budget retrieved successfully',
                'data' => $budget
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving budget: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific user's budget
     */
    public function show($userId, Request $request)
    {
        try {
            $fiscalYear = $request->fiscal_year ?? date('Y');
            $budget = $this->budgetService->getUserBudget($userId, $fiscalYear);

            if (!$budget) {
                return response()->json([
                    'success' => false,
                    'message' => 'No budget allocation found for this user'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Budget retrieved successfully',
                'data' => $budget
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving budget: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update budget allocation
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'allocated_amount' => 'nullable|numeric|min:0',
                'is_active' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $budget = $this->budgetService->updateBudgetAllocation($id, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Budget updated successfully',
                'data' => $budget
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating budget: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get budget statistics
     */
    public function statistics(Request $request)
    {
        try {
            if ($request->user_id) {
                $statistics = $this->budgetService->getBudgetStatistics($request->user_id);
            } else {
                $statistics = $this->budgetService->getOverallStatistics($request->fiscal_year);
            }

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
