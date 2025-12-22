<?php

namespace App\Services\Finance;

use App\Models\Advance;
use App\Models\AdvanceStatusLog;
use App\Models\BudgetAllocation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AdvanceService
{
    protected $budgetService;

    public function __construct(BudgetService $budgetService)
    {
        $this->budgetService = $budgetService;
    }

    /**
     * Create new advance request
     */
    public function createAdvance(array $data, int $userId): Advance
    {
        try {
            DB::beginTransaction();

            // Check budget availability
            $budgetCheck = $this->budgetService->checkBudgetAvailability($userId, $data['amount']);
            
            if (!$budgetCheck['available']) {
                throw new \Exception($budgetCheck['reason']);
            }

            // Generate advance code
            $advanceCode = $this->generateAdvanceCode();

            // Create advance
            $advance = Advance::create([
                'advance_code' => $advanceCode,
                'user_id' => $userId,
                'office' => $data['office'],
                'amount' => $data['amount'],
                'budget_line' => $data['budget_line'],
                'purpose' => $data['purpose'],
                'justification' => $data['justification'],
                'status' => 'pending',
            ]);

            // Log status change
            $this->logStatusChange($advance->id, null, 'pending', $userId, 'Advance request created');

            // Reserve budget (mark as utilized)
            $this->budgetService->updateUtilization($userId, $data['amount'], 'increase');

            DB::commit();

            Log::info('Advance created', [
                'advance_code' => $advanceCode,
                'user_id' => $userId,
                'amount' => $data['amount']
            ]);

            return $advance->load('user');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating advance: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Approve advance request
     */
    public function approveAdvance(int $advanceId, int $approverId, ?string $comments = null): Advance
    {
        try {
            $advance = Advance::findOrFail($advanceId);

            if ($advance->status !== 'pending') {
                throw new \Exception('Only pending advances can be approved');
            }

            $advance->update([
                'status' => 'approved',
                'approved_by' => $approverId,
                'approved_at' => now(),
                'approval_comments' => $comments,
            ]);

            $this->logStatusChange($advanceId, 'pending', 'approved', $approverId, $comments);

            Log::info('Advance approved', [
                'advance_id' => $advanceId,
                'approver_id' => $approverId
            ]);

            return $advance->fresh()->load('user', 'approver');

        } catch (\Exception $e) {
            Log::error('Error approving advance: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Reject advance request
     */
    public function rejectAdvance(int $advanceId, int $rejecterId, string $reason): Advance
    {
        try {
            DB::beginTransaction();

            $advance = Advance::findOrFail($advanceId);

            if ($advance->status !== 'pending') {
                throw new \Exception('Only pending advances can be rejected');
            }

            $advance->update([
                'status' => 'rejected',
                'rejected_by' => $rejecterId,
                'rejected_at' => now(),
                'rejection_reason' => $reason,
            ]);

            $this->logStatusChange($advanceId, 'pending', 'rejected', $rejecterId, $reason);

            // Release reserved budget
            $this->budgetService->updateUtilization($advance->user_id, $advance->amount, 'decrease');

            DB::commit();

            Log::info('Advance rejected', [
                'advance_id' => $advanceId,
                'rejecter_id' => $rejecterId
            ]);

            return $advance->fresh()->load('user', 'rejecter');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error rejecting advance: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Disburse advance
     */
    public function disburseAdvance(int $advanceId, int $disburserId, string $reference): Advance
    {
        try {
            $advance = Advance::findOrFail($advanceId);

            if ($advance->status !== 'approved') {
                throw new \Exception('Only approved advances can be disbursed');
            }

            // Calculate retirement due date (2 weeks from disbursement)
            $retirementDueDate = Carbon::now()->addWeeks(2)->toDateString();

            $advance->update([
                'status' => 'disbursed',
                'disbursed_by' => $disburserId,
                'disbursed_at' => now(),
                'disbursement_reference' => $reference,
                'retirement_due_date' => $retirementDueDate,
            ]);

            $this->logStatusChange($advanceId, 'approved', 'disbursed', $disburserId, 'Disbursed with reference: ' . $reference);

            Log::info('Advance disbursed', [
                'advance_id' => $advanceId,
                'disburser_id' => $disburserId,
                'retirement_due_date' => $retirementDueDate
            ]);

            return $advance->fresh()->load('user', 'approver', 'disburser');

        } catch (\Exception $e) {
            Log::error('Error disbursing advance: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cancel advance request
     */
    public function cancelAdvance(int $advanceId, int $userId): Advance
    {
        try {
            DB::beginTransaction();

            $advance = Advance::findOrFail($advanceId);

            if ($advance->user_id !== $userId) {
                throw new \Exception('You can only cancel your own advance requests');
            }

            if ($advance->status !== 'pending') {
                throw new \Exception('Can only cancel pending advances');
            }

            $advance->update(['status' => 'cancelled']);

            $this->logStatusChange($advanceId, 'pending', 'cancelled', $userId, 'Cancelled by requester');

            // Release reserved budget
            $this->budgetService->updateUtilization($userId, $advance->amount, 'decrease');

            DB::commit();

            Log::info('Advance cancelled', [
                'advance_id' => $advanceId,
                'user_id' => $userId
            ]);

            return $advance->fresh()->load('user');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error cancelling advance: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Mark advance as retired
     */
    public function markAsRetired(int $advanceId): Advance
    {
        try {
            $advance = Advance::findOrFail($advanceId);

            if ($advance->status !== 'disbursed' && $advance->status !== 'overdue') {
                throw new \Exception('Only disbursed or overdue advances can be marked as retired');
            }

            $advance->update([
                'status' => 'retired',
                'retired_at' => now(),
                'is_overdue' => false,
            ]);

            $this->logStatusChange($advanceId, $advance->status, 'retired', $advance->user_id, 'Retirement submitted');

            Log::info('Advance marked as retired', ['advance_id' => $advanceId]);

            return $advance->fresh();

        } catch (\Exception $e) {
            Log::error('Error marking advance as retired: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get advances with filters
     */
    public function getAdvances(array $filters = [])
    {
        $query = Advance::with(['user', 'approver', 'disburser']);

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['budget_line'])) {
            $query->where('budget_line', $filters['budget_line']);
        }

        if (isset($filters['office'])) {
            $query->where('office', $filters['office']);
        }

        if (isset($filters['is_overdue'])) {
            $query->where('is_overdue', $filters['is_overdue']);
        }

        if (isset($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest()->paginate($perPage);
    }

    /**
     * Get pending approvals for approver
     */
    public function getPendingApprovals(?int $approverId = null)
    {
        $query = Advance::with(['user'])
            ->where('status', 'pending');

        // Filter by approver role if needed (implement role-based filtering)
        
        return $query->latest()->get();
    }

    /**
     * Get advances pending disbursement
     */
    public function getPendingDisbursement()
    {
        return Advance::with(['user', 'approver'])
            ->where('status', 'approved')
            ->latest('approved_at')
            ->get();
    }

    /**
     * Get overdue retirements
     */
    public function getOverdueRetirements()
    {
        return Advance::with(['user', 'disburser'])
            ->where('status', 'disbursed')
            ->whereDate('retirement_due_date', '<', now())
            ->orWhere('status', 'overdue')
            ->latest('retirement_due_date')
            ->get();
    }

    /**
     * Mark overdue advances
     */
    public function markOverdueAdvances(): int
    {
        try {
            $count = Advance::where('status', 'disbursed')
                ->whereDate('retirement_due_date', '<', now())
                ->update([
                    'status' => 'overdue',
                    'is_overdue' => true,
                ]);

            Log::info('Marked overdue advances', ['count' => $count]);

            return $count;

        } catch (\Exception $e) {
            Log::error('Error marking overdue advances: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get single advance by ID
     */
    public function getAdvanceById(int $id): ?Advance
    {
        return Advance::with(['user', 'budget', 'retirement', 'statusLogs', 'approver', 'rejecter', 'disburser'])
            ->find($id);
    }

    /**
     * Get advances by status with filters
     */
    public function getAdvancesByStatus(?string $status = null, array $filters = [])
    {
        $query = Advance::with(['user', 'approver', 'rejecter']);

        if ($status) {
            $query->where('status', $status);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['office'])) {
            $query->where('office', $filters['office']);
        }

        if (!empty($filters['budget_line'])) {
            $query->where('budget_line', $filters['budget_line']);
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        $perPage = $filters['per_page'] ?? 15;
        
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get current user's advances
     */
    public function getMyAdvances(int $userId, array $filters = [])
    {
        $query = Advance::with(['user', 'approver', 'rejecter'])
            ->where('user_id', $userId);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        $perPage = $filters['per_page'] ?? 15;
        
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get advances ready for disbursement
     */
    public function getReadyForDisbursement(array $filters = [])
    {
        $query = Advance::with(['user', 'approver'])
            ->where('status', 'approved');

        if (!empty($filters['office'])) {
            $query->where('office', $filters['office']);
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('approved_at', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('approved_at', '<=', $filters['to_date']);
        }

        $perPage = $filters['per_page'] ?? 15;
        
        return $query->orderBy('approved_at', 'desc')->paginate($perPage);
    }

    /**
     * Get advance statistics
     */
    public function getStatistics(?int $userId = null, array $filters = []): array
    {
        $query = Advance::query();

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        if (!empty($filters['office'])) {
            $query->where('office', $filters['office']);
        }

        return [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'disbursed' => (clone $query)->where('status', 'disbursed')->count(),
            'retired' => (clone $query)->where('status', 'retired')->count(),
            'overdue' => (clone $query)->where('status', 'overdue')->count(),
            'total_amount_requested' => (clone $query)->sum('amount'),
            'total_amount_disbursed' => (clone $query)->where('status', 'disbursed')->orWhere('status', 'retired')->sum('amount'),
            'outstanding_amount' => (clone $query)->where('status', 'disbursed')->orWhere('status', 'overdue')->sum('amount'),
        ];
    }

    /**
     * Generate advance code
     */
    public function generateAdvanceCode(): string
    {
        $year = date('Y');
        $lastAdvance = Advance::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $lastAdvance ? ((int) substr($lastAdvance->advance_code, -4)) + 1 : 1;

        return 'ADV-' . $year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Log status change
     */
    protected function logStatusChange(int $advanceId, ?string $fromStatus, string $toStatus, int $changedBy, ?string $comments = null): void
    {
        AdvanceStatusLog::create([
            'advance_id' => $advanceId,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'changed_by' => $changedBy,
            'comments' => $comments,
        ]);
    }
}
