<?php

namespace App\Services\Procurement;

use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PurchaseRequestService
{
    /**
     * Create a new purchase request
     */
    public function createPurchaseRequest(array $data, int $userId): PurchaseRequest
    {
        try {
            DB::beginTransaction();

            // Generate request code
            $requestCode = $this->generateRequestCode();

            // Calculate total amount
            $totalAmount = collect($data['items'])->sum('total');

            // Create purchase request
            $purchaseRequest = PurchaseRequest::create([
                'request_code' => $requestCode,
                'requested_by' => $userId,
                'branch' => $data['branch'],
                'priority' => $data['priority'] ?? 'medium',
                'justification' => $data['justification'] ?? null,
                'total_amount' => $totalAmount,
                'required_date' => $data['required_date'],
            ]);

            // Create purchase request items
            foreach ($data['items'] as $item) {
                PurchaseRequestItem::create([
                    'purchase_request_id' => $purchaseRequest->id,
                    'inventory_item_id' => $item['inventory_item_id'] ?? null,
                    'item_name' => $item['item_name'],
                    'item_category' => $item['item_category'] ?? null,
                    'item_code' => $item['item_code'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $item['total'],
                    'justification' => $item['justification'] ?? null,
                ]);
            }

            DB::commit();

            Log::info('Purchase request created', [
                'request_code' => $requestCode,
                'user_id' => $userId,
                'total_amount' => $totalAmount
            ]);

            return $purchaseRequest->load('items', 'requester');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating purchase request: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Review purchase request (Admin Officer)
     */
    public function reviewPurchaseRequest(int $requestId, int $reviewerId, string $action, ?string $comments = null): PurchaseRequest
    {
        try {
            $purchaseRequest = PurchaseRequest::findOrFail($requestId);

            if ($purchaseRequest->admin_status !== 'pending') {
                throw new \Exception('Purchase request has already been reviewed');
            }

            if ($action === 'approve') {
                $purchaseRequest->update([
                    'admin_status' => 'reviewed',
                    'reviewed_by' => $reviewerId,
                    'reviewed_at' => now(),
                    'review_comments' => $comments,
                ]);

                Log::info('Purchase request reviewed and forwarded to finance', [
                    'request_id' => $requestId,
                    'reviewer_id' => $reviewerId
                ]);
            } elseif ($action === 'reject') {
                $purchaseRequest->update([
                    'status' => 'rejected',
                    'admin_status' => 'rejected',
                    'reviewed_by' => $reviewerId,
                    'reviewed_at' => now(),
                    'review_comments' => $comments,
                ]);

                Log::info('Purchase request rejected by admin officer', [
                    'request_id' => $requestId,
                    'reviewer_id' => $reviewerId
                ]);
            }

            return $purchaseRequest->fresh()->load('items', 'requester', 'reviewer');

        } catch (\Exception $e) {
            Log::error('Error reviewing purchase request: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Approve purchase request (Finance Director)
     */
    public function approvePurchaseRequest(int $requestId, int $approverId, ?string $comments = null): PurchaseRequest
    {
        try {
            $purchaseRequest = PurchaseRequest::findOrFail($requestId);

            if ($purchaseRequest->admin_status !== 'reviewed') {
                throw new \Exception('Purchase request must be reviewed by Admin Officer first');
            }

            if ($purchaseRequest->finance_status !== 'pending') {
                throw new \Exception('Purchase request has already been processed by finance');
            }

            $purchaseRequest->update([
                'status' => 'approved',
                'finance_status' => 'approved',
                'approved_by' => $approverId,
                'approved_at' => now(),
                'approval_comments' => $comments,
            ]);

            Log::info('Purchase request approved by finance', [
                'request_id' => $requestId,
                'approver_id' => $approverId
            ]);

            return $purchaseRequest->fresh()->load('items', 'requester', 'reviewer', 'approver');

        } catch (\Exception $e) {
            Log::error('Error approving purchase request: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Reject purchase request
     */
    public function rejectPurchaseRequest(int $requestId, int $rejecterId, string $reason): PurchaseRequest
    {
        try {
            $purchaseRequest = PurchaseRequest::findOrFail($requestId);

            if ($purchaseRequest->status === 'completed' || $purchaseRequest->status === 'cancelled') {
                throw new \Exception('Cannot reject a completed or cancelled purchase request');
            }

            $purchaseRequest->update([
                'status' => 'rejected',
                'finance_status' => 'rejected',
                'rejected_by' => $rejecterId,
                'rejected_at' => now(),
                'rejection_reason' => $reason,
            ]);

            Log::info('Purchase request rejected', [
                'request_id' => $requestId,
                'rejecter_id' => $rejecterId
            ]);

            return $purchaseRequest->fresh()->load('items', 'requester', 'rejecter');

        } catch (\Exception $e) {
            Log::error('Error rejecting purchase request: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cancel purchase request (Requester)
     */
    public function cancelPurchaseRequest(int $requestId, int $userId): PurchaseRequest
    {
        try {
            $purchaseRequest = PurchaseRequest::findOrFail($requestId);

            if ($purchaseRequest->requested_by !== $userId) {
                throw new \Exception('You can only cancel your own purchase requests');
            }

            if ($purchaseRequest->status !== 'pending') {
                throw new \Exception('Can only cancel pending purchase requests');
            }

            $purchaseRequest->update([
                'status' => 'cancelled',
            ]);

            Log::info('Purchase request cancelled', [
                'request_id' => $requestId,
                'user_id' => $userId
            ]);

            return $purchaseRequest->fresh()->load('items', 'requester');

        } catch (\Exception $e) {
            Log::error('Error cancelling purchase request: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get purchase requests with filters
     */
    public function getPurchaseRequests(array $filters = [])
    {
        $query = PurchaseRequest::with(['items', 'requester', 'reviewer', 'approver']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['admin_status'])) {
            $query->where('admin_status', $filters['admin_status']);
        }

        if (isset($filters['finance_status'])) {
            $query->where('finance_status', $filters['finance_status']);
        }

        if (isset($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (isset($filters['requested_by'])) {
            $query->where('requested_by', $filters['requested_by']);
        }

        if (isset($filters['branch'])) {
            $query->where('branch', $filters['branch']);
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
     * Get pending review requests (Admin Officer)
     */
    public function getPendingReview()
    {
        return PurchaseRequest::with(['items', 'requester'])
            ->where('admin_status', 'pending')
            ->where('status', 'pending')
            ->latest()
            ->get();
    }

    /**
     * Get pending finance approval (Finance Director)
     */
    public function getPendingFinance()
    {
        return PurchaseRequest::with(['items', 'requester', 'reviewer'])
            ->where('admin_status', 'reviewed')
            ->where('finance_status', 'pending')
            ->latest()
            ->get();
    }

    /**
     * Get statistics
     */
    public function getStatistics(?int $userId = null): array
    {
        $query = PurchaseRequest::query();

        if ($userId) {
            $query->where('requested_by', $userId);
        }

        return [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'reviewed' => (clone $query)->where('status', 'reviewed')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
            'pending_review' => (clone $query)->where('admin_status', 'pending')->count(),
            'pending_finance' => (clone $query)->where('admin_status', 'reviewed')
                ->where('finance_status', 'pending')->count(),
            'total_amount' => (clone $query)->where('status', 'approved')->sum('total_amount'),
        ];
    }

    /**
     * Generate purchase request code
     */
    public function generateRequestCode(): string
    {
        $year = date('Y');
        $lastRequest = PurchaseRequest::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = $lastRequest ? ((int) substr($lastRequest->request_code, -4)) + 1 : 1;

        return 'PR-' . $year . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}
