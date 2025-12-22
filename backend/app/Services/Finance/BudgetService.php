<?php

namespace App\Services\Finance;

use App\Models\BudgetAllocation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BudgetService
{
    /**
     * Allocate budget to a user
     */
    public function allocateBudget(int $userId, float $amount, int $fiscalYear, string $period, int $allocatedBy): BudgetAllocation
    {
        try {
            // Check if budget already exists
            $existingBudget = BudgetAllocation::where('user_id', $userId)
                ->where('fiscal_year', $fiscalYear)
                ->where('budget_period', $period)
                ->first();

            if ($existingBudget) {
                throw new \Exception('Budget allocation already exists for this user, year, and period');
            }

            $budgetAllocation = BudgetAllocation::create([
                'user_id' => $userId,
                'fiscal_year' => $fiscalYear,
                'budget_period' => $period,
                'allocated_amount' => $amount,
                'utilized_amount' => 0,
                'available_amount' => $amount,
                'is_active' => true,
                'allocated_by' => $allocatedBy,
            ]);

            Log::info('Budget allocated', [
                'user_id' => $userId,
                'amount' => $amount,
                'fiscal_year' => $fiscalYear,
                'allocated_by' => $allocatedBy
            ]);

            return $budgetAllocation->load('user', 'allocator');

        } catch (\Exception $e) {
            Log::error('Error allocating budget: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get user's active budget
     */
    public function getUserBudget(int $userId, ?int $fiscalYear = null): ?BudgetAllocation
    {
        $year = $fiscalYear ?? date('Y');

        return BudgetAllocation::where('user_id', $userId)
            ->where('fiscal_year', $year)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Update budget utilization
     */
    public function updateUtilization(int $userId, float $amount, string $operation = 'increase'): void
    {
        try {
            DB::beginTransaction();

            $budget = $this->getUserBudget($userId);

            if (!$budget) {
                throw new \Exception('No active budget allocation found for user');
            }

            if ($operation === 'increase') {
                // Check if sufficient budget available
                if ($budget->available_amount < $amount) {
                    throw new \Exception('Insufficient budget available');
                }

                $budget->utilized_amount += $amount;
                $budget->available_amount -= $amount;

            } elseif ($operation === 'decrease') {
                // Refund/return budget
                $budget->utilized_amount = max(0, $budget->utilized_amount - $amount);
                $budget->available_amount = $budget->allocated_amount - $budget->utilized_amount;
            }

            $budget->save();

            DB::commit();

            Log::info('Budget utilization updated', [
                'user_id' => $userId,
                'operation' => $operation,
                'amount' => $amount,
                'new_available' => $budget->available_amount
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating budget utilization: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Check if user has available budget
     */
    public function checkBudgetAvailability(int $userId, float $amount): array
    {
        $budget = $this->getUserBudget($userId);

        if (!$budget) {
            return [
                'available' => false,
                'reason' => 'No active budget allocation found',
                'budget' => null,
            ];
        }

        if ($budget->available_amount < $amount) {
            return [
                'available' => false,
                'reason' => 'Insufficient budget',
                'available_amount' => $budget->available_amount,
                'requested_amount' => $amount,
                'shortfall' => $amount - $budget->available_amount,
                'budget' => $budget,
            ];
        }

        return [
            'available' => true,
            'available_amount' => $budget->available_amount,
            'requested_amount' => $amount,
            'remaining_after' => $budget->available_amount - $amount,
            'budget' => $budget,
        ];
    }

    /**
     * Get budget statistics for user
     */
    public function getBudgetStatistics(int $userId): array
    {
        $budget = $this->getUserBudget($userId);

        if (!$budget) {
            return [
                'allocated_amount' => 0,
                'utilized_amount' => 0,
                'available_amount' => 0,
                'utilization_percentage' => 0,
            ];
        }

        return [
            'allocated_amount' => $budget->allocated_amount,
            'utilized_amount' => $budget->utilized_amount,
            'available_amount' => $budget->available_amount,
            'utilization_percentage' => $budget->utilizationPercentage(),
            'fiscal_year' => $budget->fiscal_year,
            'budget_period' => $budget->budget_period,
        ];
    }

    /**
     * Get all budget allocations with filters
     */
    public function getAllBudgetAllocations(array $filters = [])
    {
        $query = BudgetAllocation::with(['user', 'allocator']);

        if (isset($filters['fiscal_year'])) {
            $query->where('fiscal_year', $filters['fiscal_year']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['budget_period'])) {
            $query->where('budget_period', $filters['budget_period']);
        }

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
    }

    /**
     * Update budget allocation
     */
    public function updateBudgetAllocation(int $budgetId, array $data): BudgetAllocation
    {
        try {
            $budget = BudgetAllocation::findOrFail($budgetId);

            if (isset($data['allocated_amount'])) {
                $difference = $data['allocated_amount'] - $budget->allocated_amount;
                $budget->allocated_amount = $data['allocated_amount'];
                $budget->available_amount += $difference;
            }

            if (isset($data['is_active'])) {
                $budget->is_active = $data['is_active'];
            }

            $budget->save();

            Log::info('Budget allocation updated', [
                'budget_id' => $budgetId,
                'changes' => $data
            ]);

            return $budget->fresh()->load('user', 'allocator');

        } catch (\Exception $e) {
            Log::error('Error updating budget allocation: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Deactivate budget allocation
     */
    public function deactivateBudget(int $budgetId): BudgetAllocation
    {
        try {
            $budget = BudgetAllocation::findOrFail($budgetId);
            $budget->is_active = false;
            $budget->save();

            Log::info('Budget deactivated', ['budget_id' => $budgetId]);

            return $budget;

        } catch (\Exception $e) {
            Log::error('Error deactivating budget: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get users with low budget
     */
    public function getUsersWithLowBudget(float $threshold = 20): array
    {
        return BudgetAllocation::with('user')
            ->where('is_active', true)
            ->whereRaw('(available_amount / allocated_amount * 100) < ?', [$threshold])
            ->get()
            ->map(function ($budget) {
                return [
                    'user' => $budget->user,
                    'allocated_amount' => $budget->allocated_amount,
                    'available_amount' => $budget->available_amount,
                    'utilization_percentage' => $budget->utilizationPercentage(),
                ];
            })
            ->toArray();
    }

    /**
     * Get overall budget statistics
     */
    public function getOverallStatistics(?int $fiscalYear = null): array
    {
        $year = $fiscalYear ?? date('Y');

        $query = BudgetAllocation::where('fiscal_year', $year)->where('is_active', true);

        $totalAllocated = (clone $query)->sum('allocated_amount');
        $totalUtilized = (clone $query)->sum('utilized_amount');
        $totalAvailable = (clone $query)->sum('available_amount');

        return [
            'total_allocated' => $totalAllocated,
            'total_utilized' => $totalUtilized,
            'total_available' => $totalAvailable,
            'overall_utilization_percentage' => $totalAllocated > 0 ? ($totalUtilized / $totalAllocated * 100) : 0,
            'total_users_with_budget' => (clone $query)->count(),
            'fiscal_year' => $year,
        ];
    }
}
