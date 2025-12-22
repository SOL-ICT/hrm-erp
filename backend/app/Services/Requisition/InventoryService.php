<?php

namespace App\Services\Requisition;

use App\Models\StoreInventory;
use Exception;
use Illuminate\Support\Facades\DB;

/**
 * Inventory Service
 * 
 * Handles stock management operations including:
 * - Stock reservation for pending requisitions
 * - Stock release for rejected/cancelled requisitions
 * - Stock transaction completion for collected items
 * - Stock level calculations and checks
 */
class InventoryService
{
    /**
     * Reserve stock for a requisition
     * Moves quantity from available_stock to reserved_stock
     * 
     * @param int $inventoryItemId
     * @param int $quantity
     * @return bool
     * @throws Exception
     */
    public function reserveStock($inventoryItemId, $quantity)
    {
        $item = StoreInventory::findOrFail($inventoryItemId);

        if (!$item->hasAvailableQuantity($quantity)) {
            throw new Exception("Insufficient stock for {$item->name}. Available: {$item->available_stock}, Requested: {$quantity}");
        }

        return $item->reserveStock($quantity);
    }

    /**
     * Release reserved stock back to available
     * Used when requisition is rejected or cancelled
     * 
     * @param int $inventoryItemId
     * @param int $quantity
     * @return bool
     * @throws Exception
     */
    public function releaseStock($inventoryItemId, $quantity)
    {
        $item = StoreInventory::findOrFail($inventoryItemId);

        if ($item->reserved_stock < $quantity) {
            throw new Exception("Cannot release {$quantity} units of {$item->name}. Only {$item->reserved_stock} reserved.");
        }

        return $item->releaseStock($quantity);
    }

    /**
     * Complete stock transaction
     * Moves quantity from reserved_stock and reduces total_stock
     * Used when items are collected
     * 
     * @param int $inventoryItemId
     * @param int $quantity
     * @return bool
     * @throws Exception
     */
    public function completeTransaction($inventoryItemId, $quantity)
    {
        $item = StoreInventory::findOrFail($inventoryItemId);

        if ($item->reserved_stock < $quantity) {
            throw new Exception("Cannot complete transaction for {$quantity} units of {$item->name}. Only {$item->reserved_stock} reserved.");
        }

        return $item->completeTransaction($quantity);
    }

    /**
     * Update stock levels (restocking)
     * 
     * @param int $inventoryItemId
     * @param int $additionalQuantity
     * @return StoreInventory
     * @throws Exception
     */
    public function restockItem($inventoryItemId, $additionalQuantity)
    {
        DB::beginTransaction();

        try {
            $item = StoreInventory::findOrFail($inventoryItemId);

            $item->update([
                'total_stock' => $item->total_stock + $additionalQuantity,
                'available_stock' => $item->available_stock + $additionalQuantity,
                'last_restocked' => now(),
            ]);

            DB::commit();

            return $item->fresh();

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Adjust stock levels manually (for corrections)
     * 
     * @param int $inventoryItemId
     * @param int $newTotalStock
     * @param int $newAvailableStock
     * @param int $newReservedStock
     * @return StoreInventory
     * @throws Exception
     */
    public function adjustStock($inventoryItemId, $newTotalStock, $newAvailableStock, $newReservedStock)
    {
        DB::beginTransaction();

        try {
            $item = StoreInventory::findOrFail($inventoryItemId);

            // Validate stock consistency
            if ($newTotalStock < 0 || $newAvailableStock < 0 || $newReservedStock < 0) {
                throw new Exception('Stock levels cannot be negative');
            }

            if (($newAvailableStock + $newReservedStock) > $newTotalStock) {
                throw new Exception('Available + Reserved stock cannot exceed total stock');
            }

            $item->update([
                'total_stock' => $newTotalStock,
                'available_stock' => $newAvailableStock,
                'reserved_stock' => $newReservedStock,
            ]);

            DB::commit();

            return $item->fresh();

        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Check stock availability for multiple items
     * 
     * @param array $items [['inventory_item_id' => 1, 'quantity' => 5], ...]
     * @return array
     */
    public function checkAvailability(array $items)
    {
        $result = [];

        foreach ($items as $item) {
            $inventoryItem = StoreInventory::find($item['inventory_item_id']);
            
            if (!$inventoryItem) {
                $result[] = [
                    'inventory_item_id' => $item['inventory_item_id'],
                    'available' => false,
                    'message' => 'Item not found',
                ];
                continue;
            }

            $isAvailable = $inventoryItem->hasAvailableQuantity($item['quantity']);

            $result[] = [
                'inventory_item_id' => $item['inventory_item_id'],
                'name' => $inventoryItem->name,
                'code' => $inventoryItem->code,
                'requested_quantity' => $item['quantity'],
                'available_stock' => $inventoryItem->available_stock,
                'available' => $isAvailable,
                'message' => $isAvailable 
                    ? 'Available' 
                    : "Insufficient stock. Available: {$inventoryItem->available_stock}, Requested: {$item['quantity']}",
            ];
        }

        return $result;
    }

    /**
     * Get low stock items
     * 
     * @param int $threshold Default 10
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getLowStockItems($threshold = 10)
    {
        return StoreInventory::active()
            ->where('available_stock', '<=', $threshold)
            ->orderBy('available_stock', 'asc')
            ->get();
    }

    /**
     * Get out of stock items
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getOutOfStockItems()
    {
        return StoreInventory::active()
            ->where('available_stock', '<=', 0)
            ->get();
    }

    /**
     * Get inventory statistics
     * 
     * @return array
     */
    public function getStatistics()
    {
        $totalItems = StoreInventory::active()->count();
        $lowStockItems = StoreInventory::lowStock()->count();
        $outOfStockItems = StoreInventory::active()->where('available_stock', '<=', 0)->count();

        $totalStockValue = StoreInventory::active()
            ->get()
            ->sum(function ($item) {
                return $item->total_stock * $item->unit_price;
            });

        $availableStockValue = StoreInventory::active()
            ->get()
            ->sum(function ($item) {
                return $item->available_stock * $item->unit_price;
            });

        $reservedStockValue = StoreInventory::active()
            ->get()
            ->sum(function ($item) {
                return $item->reserved_stock * $item->unit_price;
            });

        return [
            'total_items' => $totalItems,
            'low_stock_items' => $lowStockItems,
            'out_of_stock_items' => $outOfStockItems,
            'total_stock_value' => round($totalStockValue, 2),
            'available_stock_value' => round($availableStockValue, 2),
            'reserved_stock_value' => round($reservedStockValue, 2),
        ];
    }

    /**
     * Get items by category with stock info
     * 
     * @param string|null $category
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getItemsByCategory($category = null)
    {
        $query = StoreInventory::active();

        if ($category) {
            $query->byCategory($category);
        }

        return $query->orderBy('name', 'asc')->get();
    }

    /**
     * Search inventory items
     * 
     * @param string $searchTerm
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function searchItems($searchTerm)
    {
        return StoreInventory::active()
            ->search($searchTerm)
            ->get();
    }

    /**
     * Get available categories
     * 
     * @return array
     */
    public function getCategories()
    {
        return StoreInventory::active()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray();
    }
}
