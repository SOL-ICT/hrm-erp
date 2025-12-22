<?php

namespace App\Services\Procurement;

use App\Models\ProcurementLog;
use App\Models\PurchaseRequest;
use App\Models\StoreInventory;
use App\Services\Requisition\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcurementService
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Log procurement entry
     */
    public function logProcurement(array $data, int $userId): ProcurementLog
    {
        try {
            DB::beginTransaction();

            // Create procurement log
            $procurementLog = ProcurementLog::create([
                'purchase_request_id' => $data['purchase_request_id'] ?? null,
                'inventory_item_id' => $data['inventory_item_id'],
                'quantity' => $data['quantity'],
                'unit_price' => $data['unit_price'],
                'total_amount' => $data['quantity'] * $data['unit_price'],
                'supplier_name' => $data['supplier_name'],
                'supplier_contact' => $data['supplier_contact'] ?? null,
                'invoice_number' => $data['invoice_number'] ?? null,
                'purchase_date' => $data['purchase_date'],
                'delivery_date' => $data['delivery_date'] ?? null,
                'logged_by' => $userId,
                'notes' => $data['notes'] ?? null,
            ]);

            // Update inventory stock levels
            $this->updateInventoryFromProcurement(
                $data['inventory_item_id'],
                $data['quantity'],
                $data['unit_price']
            );

            // If linked to purchase request, check if all items are procured
            if (isset($data['purchase_request_id'])) {
                $this->checkPurchaseRequestCompletion($data['purchase_request_id'], $userId);
            }

            DB::commit();

            Log::info('Procurement logged', [
                'procurement_id' => $procurementLog->id,
                'item_id' => $data['inventory_item_id'],
                'quantity' => $data['quantity'],
                'user_id' => $userId
            ]);

            return $procurementLog->load('inventoryItem', 'purchaseRequest', 'logger');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error logging procurement: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update inventory stock levels from procurement
     */
    public function updateInventoryFromProcurement(int $inventoryItemId, int $quantity, float $unitPrice): void
    {
        try {
            $item = StoreInventory::findOrFail($inventoryItemId);

            // Increase stock levels
            $item->total_stock += $quantity;
            $item->available_stock += $quantity;

            // Update unit price (use weighted average or latest price - using latest for simplicity)
            $item->unit_price = $unitPrice;

            $item->save();

            Log::info('Inventory updated from procurement', [
                'item_id' => $inventoryItemId,
                'quantity_added' => $quantity,
                'new_total_stock' => $item->total_stock,
                'new_available_stock' => $item->available_stock
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating inventory from procurement: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Link procurement to purchase request and check completion
     */
    protected function checkPurchaseRequestCompletion(int $purchaseRequestId, int $userId): void
    {
        try {
            $purchaseRequest = PurchaseRequest::with('items')->findOrFail($purchaseRequestId);

            // Check if all items have been procured
            $allItemsProcured = true;
            foreach ($purchaseRequest->items as $item) {
                if ($item->inventory_item_id) {
                    $procuredQuantity = ProcurementLog::where('purchase_request_id', $purchaseRequestId)
                        ->where('inventory_item_id', $item->inventory_item_id)
                        ->sum('quantity');

                    if ($procuredQuantity < $item->quantity) {
                        $allItemsProcured = false;
                        break;
                    }
                }
            }

            // If all items procured, mark purchase request as completed
            if ($allItemsProcured) {
                $purchaseRequest->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'completed_by' => $userId,
                ]);

                Log::info('Purchase request marked as completed', [
                    'purchase_request_id' => $purchaseRequestId
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error checking purchase request completion: ' . $e->getMessage());
            // Don't throw - this is not critical
        }
    }

    /**
     * Get procurement history with filters
     */
    public function getProcurementHistory(array $filters = [])
    {
        $query = ProcurementLog::with(['inventoryItem', 'purchaseRequest', 'logger']);

        if (isset($filters['inventory_item_id'])) {
            $query->where('inventory_item_id', $filters['inventory_item_id']);
        }

        if (isset($filters['purchase_request_id'])) {
            $query->where('purchase_request_id', $filters['purchase_request_id']);
        }

        if (isset($filters['supplier_name'])) {
            $query->where('supplier_name', 'like', '%' . $filters['supplier_name'] . '%');
        }

        if (isset($filters['from_date'])) {
            $query->whereDate('purchase_date', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->whereDate('purchase_date', '<=', $filters['to_date']);
        }

        if (isset($filters['logged_by'])) {
            $query->where('logged_by', $filters['logged_by']);
        }

        $perPage = $filters['per_page'] ?? 15;

        return $query->latest('purchase_date')->paginate($perPage);
    }

    /**
     * Get procurement statistics
     */
    public function getStatistics(array $filters = []): array
    {
        $query = ProcurementLog::query();

        if (isset($filters['from_date'])) {
            $query->whereDate('purchase_date', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->whereDate('purchase_date', '<=', $filters['to_date']);
        }

        return [
            'total_procurements' => (clone $query)->count(),
            'total_amount' => (clone $query)->sum('total_amount'),
            'total_items_procured' => (clone $query)->sum('quantity'),
            'unique_items' => (clone $query)->distinct('inventory_item_id')->count('inventory_item_id'),
            'unique_suppliers' => (clone $query)->distinct('supplier_name')->count('supplier_name'),
            'linked_to_requests' => (clone $query)->whereNotNull('purchase_request_id')->count(),
            'average_procurement_value' => (clone $query)->avg('total_amount'),
        ];
    }

    /**
     * Get procurement logs for specific purchase request
     */
    public function getProcurementsByRequest(int $purchaseRequestId)
    {
        return ProcurementLog::with(['inventoryItem', 'logger'])
            ->where('purchase_request_id', $purchaseRequestId)
            ->latest('purchase_date')
            ->get();
    }

    /**
     * Get recent procurement activities
     */
    public function getRecentProcurements(int $limit = 10)
    {
        return ProcurementLog::with(['inventoryItem', 'purchaseRequest', 'logger'])
            ->latest('created_at')
            ->limit($limit)
            ->get();
    }
}
