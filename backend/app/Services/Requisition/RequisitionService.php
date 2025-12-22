<?php

namespace App\Services\Requisition;

use App\Models\StaffRequisition;
use App\Models\StaffRequisitionItem;
use App\Models\RequisitionStatusLog;
use App\Models\StoreInventory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

/**
 * Requisition Service
 * 
 * Handles business logic for staff requisitions including:
 * - Requisition creation with stock validation
 * - Stock reservation/release
 * - Approval/rejection workflow
 * - Collection management
 * - Status tracking and logging
 */
class RequisitionService
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Create a new requisition
     * 
     * @param array $data ['items' => [['inventory_item_id' => 1, 'quantity' => 5, 'purpose' => '...']], 'department' => '...', 'branch' => '...', 'notes' => '...']
     * @return StaffRequisition
     * @throws Exception
     */
    public function createRequisition(array $data)
    {
        // Validate items and stock availability
        if (empty($data['items'])) {
            throw new Exception('Requisition must have at least one item');
        }

        DB::beginTransaction();

        try {
            // Check stock availability for all items first
            foreach ($data['items'] as $item) {
                $inventoryItem = StoreInventory::find($item['inventory_item_id']);
                
                if (!$inventoryItem) {
                    throw new Exception("Inventory item not found: {$item['inventory_item_id']}");
                }

                if (!$inventoryItem->hasAvailableQuantity($item['quantity'])) {
                    throw new Exception("Insufficient stock for {$inventoryItem->name}. Available: {$inventoryItem->available_stock}, Requested: {$item['quantity']}");
                }
            }

            // Create requisition
            $requisition = StaffRequisition::create([
                'user_id' => Auth::id(),
                'department' => $data['department'],
                'branch' => $data['branch'],
                'request_date' => now(),
                'status' => 'pending',
                'collection_status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);

            // Create requisition items and reserve stock
            foreach ($data['items'] as $item) {
                StaffRequisitionItem::create([
                    'requisition_id' => $requisition->id,
                    'inventory_item_id' => $item['inventory_item_id'],
                    'quantity' => $item['quantity'],
                    'purpose' => $item['purpose'],
                ]);

                // Reserve stock
                $this->inventoryService->reserveStock($item['inventory_item_id'], $item['quantity']);
            }

            // Log initial status
            $this->logStatusChange($requisition->id, null, 'pending', 'Requisition created');

            DB::commit();

            return $requisition->load(['items.inventoryItem', 'user']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Approve a requisition
     * 
     * @param int $requisitionId
     * @param string|null $comments
     * @return StaffRequisition
     * @throws Exception
     */
    public function approveRequisition($requisitionId, $comments = null)
    {
        DB::beginTransaction();

        try {
            $requisition = StaffRequisition::findOrFail($requisitionId);

            if (!$requisition->canBeApproved()) {
                throw new Exception('This requisition cannot be approved');
            }

            $oldStatus = $requisition->status;

            $requisition->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approval_date' => now(),
            ]);

            // Log status change
            $this->logStatusChange($requisitionId, $oldStatus, 'approved', $comments ?? 'Requisition approved');

            DB::commit();

            return $requisition->load(['items.inventoryItem', 'user', 'approver']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Reject a requisition
     * 
     * @param int $requisitionId
     * @param string $reason
     * @return StaffRequisition
     * @throws Exception
     */
    public function rejectRequisition($requisitionId, $reason)
    {
        DB::beginTransaction();

        try {
            $requisition = StaffRequisition::with('items')->findOrFail($requisitionId);

            if (!$requisition->canBeRejected()) {
                throw new Exception('This requisition cannot be rejected');
            }

            $oldStatus = $requisition->status;

            // Release reserved stock
            foreach ($requisition->items as $item) {
                $this->inventoryService->releaseStock($item->inventory_item_id, $item->quantity);
            }

            $requisition->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'approved_by' => Auth::id(),
                'approval_date' => now(),
            ]);

            // Log status change
            $this->logStatusChange($requisitionId, $oldStatus, 'rejected', $reason);

            DB::commit();

            return $requisition->load(['items.inventoryItem', 'user', 'approver']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cancel a requisition
     * 
     * @param int $requisitionId
     * @param string|null $reason
     * @return StaffRequisition
     * @throws Exception
     */
    public function cancelRequisition($requisitionId, $reason = null)
    {
        DB::beginTransaction();

        try {
            $requisition = StaffRequisition::with('items')->findOrFail($requisitionId);

            // Verify user can cancel (must be owner or admin)
            if ($requisition->user_id !== Auth::id() && !Auth::user()->hasRole('Super Admin')) {
                throw new Exception('Unauthorized to cancel this requisition');
            }

            if (!$requisition->canBeCancelled()) {
                throw new Exception('This requisition cannot be cancelled');
            }

            $oldStatus = $requisition->status;

            // Release reserved stock
            foreach ($requisition->items as $item) {
                $this->inventoryService->releaseStock($item->inventory_item_id, $item->quantity);
            }

            $requisition->update([
                'status' => 'cancelled',
                'collection_status' => 'cancelled',
            ]);

            // Log status change
            $this->logStatusChange($requisitionId, $oldStatus, 'cancelled', $reason ?? 'Cancelled by user');

            DB::commit();

            return $requisition->load(['items.inventoryItem', 'user']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Mark items as ready for collection
     * 
     * @param int $requisitionId
     * @param string|null $comments
     * @return StaffRequisition
     * @throws Exception
     */
    public function markReady($requisitionId, $comments = null)
    {
        DB::beginTransaction();

        try {
            $requisition = StaffRequisition::findOrFail($requisitionId);

            if (!$requisition->canBeMarkedReady()) {
                throw new Exception('This requisition cannot be marked as ready');
            }

            $oldCollectionStatus = $requisition->collection_status;

            $requisition->update([
                'collection_status' => 'ready',
            ]);

            // Log collection status change
            $this->logStatusChange(
                $requisitionId, 
                "collection:{$oldCollectionStatus}", 
                "collection:ready", 
                $comments ?? 'Items ready for collection'
            );

            DB::commit();

            return $requisition->load(['items.inventoryItem', 'user', 'approver']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Mark items as collected
     * 
     * @param int $requisitionId
     * @param string|null $comments
     * @return StaffRequisition
     * @throws Exception
     */
    public function markCollected($requisitionId, $comments = null)
    {
        DB::beginTransaction();

        try {
            $requisition = StaffRequisition::with('items')->findOrFail($requisitionId);

            if (!$requisition->canBeCollected()) {
                throw new Exception('This requisition cannot be marked as collected');
            }

            $oldCollectionStatus = $requisition->collection_status;

            // Complete stock transactions (move from reserved to actually consumed)
            foreach ($requisition->items as $item) {
                $this->inventoryService->completeTransaction($item->inventory_item_id, $item->quantity);
            }

            $requisition->update([
                'collection_status' => 'collected',
                'collection_date' => now(),
                'collected_by' => Auth::id(),
            ]);

            // Log collection status change
            $this->logStatusChange(
                $requisitionId, 
                "collection:{$oldCollectionStatus}", 
                "collection:collected", 
                $comments ?? 'Items collected successfully'
            );

            DB::commit();

            return $requisition->load(['items.inventoryItem', 'user', 'approver', 'collector']);

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get requisition statistics
     * 
     * @param array $filters ['user_id' => int, 'department' => string, 'date_from' => date, 'date_to' => date]
     * @return array
     */
    public function getStatistics($filters = [])
    {
        $query = StaffRequisition::query();

        // Apply filters
        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['department'])) {
            $query->where('department', $filters['department']);
        }

        if (isset($filters['date_from']) && isset($filters['date_to'])) {
            $query->whereBetween('request_date', [$filters['date_from'], $filters['date_to']]);
        }

        $total = $query->count();
        $pending = (clone $query)->where('status', 'pending')->count();
        $approved = (clone $query)->where('status', 'approved')->count();
        $rejected = (clone $query)->where('status', 'rejected')->count();
        $collected = (clone $query)->where('collection_status', 'collected')->count();

        return [
            'total' => $total,
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'collected' => $collected,
            'ready_for_collection' => (clone $query)
                ->where('status', 'approved')
                ->where('collection_status', 'ready')
                ->count(),
        ];
    }

    /**
     * Log status change
     * 
     * @param int $requisitionId
     * @param string|null $oldStatus
     * @param string $newStatus
     * @param string|null $comments
     * @return void
     */
    protected function logStatusChange($requisitionId, $oldStatus, $newStatus, $comments = null)
    {
        RequisitionStatusLog::create([
            'requisition_id' => $requisitionId,
            'changed_by' => Auth::id(),
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'comments' => $comments,
        ]);
    }

    /**
     * Check if items are available
     * 
     * @param array $items [['inventory_item_id' => 1, 'quantity' => 5], ...]
     * @return array ['available' => bool, 'items' => [...details...]]
     */
    public function checkItemsAvailability(array $items)
    {
        $result = [
            'available' => true,
            'items' => [],
        ];

        foreach ($items as $item) {
            $inventoryItem = StoreInventory::find($item['inventory_item_id']);
            
            $itemAvailable = $inventoryItem && $inventoryItem->hasAvailableQuantity($item['quantity']);
            
            $result['items'][] = [
                'inventory_item_id' => $item['inventory_item_id'],
                'name' => $inventoryItem?->name ?? 'Unknown',
                'requested' => $item['quantity'],
                'available' => $inventoryItem?->available_stock ?? 0,
                'is_available' => $itemAvailable,
            ];

            if (!$itemAvailable) {
                $result['available'] = false;
            }
        }

        return $result;
    }
}
