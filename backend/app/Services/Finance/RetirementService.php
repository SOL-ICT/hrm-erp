<?php

namespace App\Services\Finance;

use App\Models\Retirement;
use App\Models\RetirementItem;
use App\Models\Advance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class RetirementService
{
    protected $advanceService;

    public function __construct(AdvanceService $advanceService)
    {
        $this->advanceService = $advanceService;
    }

    /**
     * Submit retirement
     */
    public function submitRetirement(array $data, int $advanceId, int $userId): Retirement
    {
        try {
            DB::beginTransaction();

            $advance = Advance::findOrFail($advanceId);

            // Verify advance belongs to user
            if ($advance->user_id !== $userId) {
                throw new \Exception('You can only submit retirement for your own advances');
            }

            // Verify advance status
            if ($advance->status !== 'disbursed' && $advance->status !== 'overdue') {
                throw new \Exception('Only disbursed or overdue advances can be retired');
            }

            // Check if retirement already exists
            if ($advance->retirement) {
                throw new \Exception('Retirement already submitted for this advance');
            }

            // Generate retirement code
            $retirementCode = $this->generateRetirementCode();

            // Calculate balance
            $balance = $advance->amount - $data['total_spent'];

            // Create retirement
            $retirement = Retirement::create([
                'advance_id' => $advanceId,
                'retirement_code' => $retirementCode,
                'advance_amount' => $advance->amount,
                'total_spent' => $data['total_spent'],
                'balance' => $balance,
                'receipt_documents' => $data['receipt_documents'] ?? [],
                'supporting_documents' => $data['supporting_documents'] ?? [],
                'retirement_summary' => $data['retirement_summary'],
                'status' => 'submitted',
            ]);

            // Create retirement items
            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $item) {
                    RetirementItem::create([
                        'retirement_id' => $retirement->id,
                        'description' => $item['description'],
                        'amount' => $item['amount'],
                        'receipt_reference' => $item['receipt_reference'] ?? null,
                        'transaction_date' => $item['transaction_date'],
                    ]);
                }
            }

            // Mark advance as retired
            $this->advanceService->markAsRetired($advanceId);

            DB::commit();

            Log::info('Retirement submitted', [
                'retirement_code' => $retirementCode,
                'advance_id' => $advanceId,
                'user_id' => $userId
            ]);

            return $retirement->load('advance', 'items');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error submitting retirement: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Review retirement
     */
    public function reviewRetirement(int $retirementId, int $reviewerId, string $action, ?string $comments = null): Retirement
    {
        try {
            $retirement = Retirement::findOrFail($retirementId);

            if ($retirement->status === 'approved' || $retirement->status === 'rejected') {
                throw new \Exception('Retirement has already been processed');
            }

            if ($action === 'approve') {
                $retirement->update([
                    'status' => 'approved',
                    'reviewed_by' => $reviewerId,
                    'reviewed_at' => now(),
                    'review_comments' => $comments,
                ]);

                Log::info('Retirement approved', [
                    'retirement_id' => $retirementId,
                    'reviewer_id' => $reviewerId
                ]);

            } elseif ($action === 'under_review') {
                $retirement->update([
                    'status' => 'under_review',
                    'reviewed_by' => $reviewerId,
                    'reviewed_at' => now(),
                    'review_comments' => $comments,
                ]);

                Log::info('Retirement under review', [
                    'retirement_id' => $retirementId,
                    'reviewer_id' => $reviewerId
                ]);
            }

            return $retirement->fresh()->load('advance', 'items', 'reviewer');

        } catch (\Exception $e) {
            Log::error('Error reviewing retirement: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Query retirement
     */
    public function queryRetirement(int $retirementId, int $reviewerId, string $queryReason): Retirement
    {
        try {
            $retirement = Retirement::findOrFail($retirementId);

            $retirement->update([
                'status' => 'queried',
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
                'query_reason' => $queryReason,
            ]);

            Log::info('Retirement queried', [
                'retirement_id' => $retirementId,
                'reviewer_id' => $reviewerId
            ]);

            return $retirement->fresh()->load('advance', 'items', 'reviewer');

        } catch (\Exception $e) {
            Log::error('Error querying retirement: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Reject retirement
     */
    public function rejectRetirement(int $retirementId, int $reviewerId, string $reason): Retirement
    {
        try {
            $retirement = Retirement::findOrFail($retirementId);

            $retirement->update([
                'status' => 'rejected',
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
                'rejection_reason' => $reason,
            ]);

            Log::info('Retirement rejected', [
                'retirement_id' => $retirementId,
                'reviewer_id' => $reviewerId
            ]);

            return $retirement->fresh()->load('advance', 'items', 'reviewer');

        } catch (\Exception $e) {
            Log::error('Error rejecting retirement: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Resubmit queried retirement
     */
    public function resubmitRetirement(int $retirementId, array $data, int $userId): Retirement
    {
        try {
            DB::beginTransaction();

            $retirement = Retirement::findOrFail($retirementId);

            // Verify ownership
            if ($retirement->advance->user_id !== $userId) {
                throw new \Exception('You can only resubmit your own retirements');
            }

            if ($retirement->status !== 'queried') {
                throw new \Exception('Only queried retirements can be resubmitted');
            }

            // Update retirement
            $balance = $retirement->advance_amount - $data['total_spent'];

            $retirement->update([
                'total_spent' => $data['total_spent'],
                'balance' => $balance,
                'receipt_documents' => array_merge($retirement->receipt_documents ?? [], $data['receipt_documents'] ?? []),
                'supporting_documents' => array_merge($retirement->supporting_documents ?? [], $data['supporting_documents'] ?? []),
                'retirement_summary' => $data['retirement_summary'],
                'status' => 'submitted',
                'query_reason' => null,
            ]);

            // Update retirement items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $retirement->items()->delete();

                // Create new items
                foreach ($data['items'] as $item) {
                    RetirementItem::create([
                        'retirement_id' => $retirement->id,
                        'description' => $item['description'],
                        'amount' => $item['amount'],
                        'receipt_reference' => $item['receipt_reference'] ?? null,
                        'transaction_date' => $item['transaction_date'],
                    ]);
                }
            }

            DB::commit();

            Log::info('Retirement resubmitted', [
                'retirement_id' => $retirementId,
                'user_id' => $userId
            ]);

            return $retirement->fresh()->load('advance', 'items');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error resubmitting retirement: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get retirements with filters
     */
    public function getRetirements(array $filters = [])
    {
        $query = Retirement::with(['advance.user', 'items', 'reviewer']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['user_id'])) {
            $query->whereHas('advance', function ($q) use ($filters) {
                $q->where('user_id', $filters['user_id']);
            });
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
     * Get pending review retirements
     */
    public function getPendingReview()
    {
        return Retirement::with(['advance.user', 'items'])
            ->whereIn('status', ['submitted', 'under_review'])
            ->latest()
            ->get();
    }

    /**
     * Get queried retirements
     */
    public function getQueriedRetirements(?int $userId = null)
    {
        $query = Retirement::with(['advance.user', 'items', 'reviewer'])
            ->where('status', 'queried');

        if ($userId) {
            $query->whereHas('advance', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
        }

        return $query->latest()->get();
    }

    /**
     * Upload document
     */
    public function uploadDocument($file, string $type = 'receipt'): string
    {
        try {
            $path = $file->store('retirements/' . $type, 'public');

            Log::info('Retirement document uploaded', [
                'type' => $type,
                'path' => $path
            ]);

            return $path;

        } catch (\Exception $e) {
            Log::error('Error uploading retirement document: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate retirement code
     */
    public function generateRetirementCode(): string
    {
        $year = date('Y');
        $lastRetirement = Retirement::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $lastRetirement ? ((int) substr($lastRetirement->retirement_code, -4)) + 1 : 1;

        return 'RET-' . $year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get single retirement by ID
     */
    public function getRetirementById(int $id): ?Retirement
    {
        return Retirement::with(['advance.user', 'items', 'reviewer'])
            ->find($id);
    }

    /**
     * Get all retirements with filters
     */
    public function getAllRetirements(array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        $query = Retirement::with(['advance.user', 'items', 'reviewer'])
            ->orderBy('created_at', 'desc');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['advance_id'])) {
            $query->where('advance_id', $filters['advance_id']);
        }

        if (!empty($filters['user_id'])) {
            $query->whereHas('advance', function ($q) use ($filters) {
                $q->where('user_id', $filters['user_id']);
            });
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        $perPage = $filters['per_page'] ?? 15;

        return $query->paginate($perPage);
    }

    /**
     * Get retirement statistics
     */
    public function getStatistics(): array
    {
        $query = Retirement::query();

        return [
            'total' => (clone $query)->count(),
            'submitted' => (clone $query)->where('status', 'submitted')->count(),
            'under_review' => (clone $query)->where('status', 'under_review')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'queried' => (clone $query)->where('status', 'queried')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'total_advances_retired' => (clone $query)->sum('advance_amount'),
            'total_amount_spent' => (clone $query)->sum('total_spent'),
            'total_balance_returned' => (clone $query)->where('balance', '>', 0)->sum('balance'),
            'total_excess_spent' => (clone $query)->where('balance', '<', 0)->sum('balance'),
        ];
    }
}
