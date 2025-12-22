<?php

namespace App\Http\Controllers\Admin\Requisition;

use App\Http\Controllers\Controller;
use App\Services\Requisition\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\StoreInventory;

/**
 * Store Inventory Controller
 * 
 * Manages inventory items for the requisition system.
 * Handles CRUD operations, stock checks, and availability queries.
 */
class StoreInventoryController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Get all inventory items with pagination and filters
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            \Log::info('Inventory index called', [
                'params' => $request->all(),
                'has_active' => $request->has('active'),
                'active_value' => $request->active
            ]);
            
            $query = StoreInventory::query();

            // Filter by category
            if ($request->has('category') && $request->category) {
                $query->byCategory($request->category);
            }

            // Filter by active status
            if ($request->has('active') && $request->active !== null) {
                \Log::info('Active filter applied', ['value' => $request->active]);
                if ($request->active == 'true' || $request->active == 1) {
                    $query->active();
                } else {
                    $query->where('is_active', false);
                }
            } else {
                \Log::info('No active parameter, defaulting to active items');
                // Default to active items only
                $query->active();
            }

            // Filter by availability
            if ($request->has('available') && ($request->available == 'true' || $request->available == 1)) {
                $query->available();
            }

            // Search by name or code
            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            // Filter by stock status
            if ($request->has('stock_status')) {
                switch ($request->stock_status) {
                    case 'low':
                        $query->lowStock();
                        break;
                    case 'out':
                        $query->where('available_stock', '<=', 0);
                        break;
                }
            }

            // Sort
            $sortBy = $request->input('sort_by', 'name');
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Debug: Log the SQL query
            \Log::info('SQL Query', ['sql' => $query->toSql(), 'bindings' => $query->getBindings()]);

            // Paginate
            $perPage = $request->input('per_page', 15);
            $items = $query->paginate($perPage);

            \Log::info('Query result', ['total' => $items->total(), 'count' => $items->count()]);

            return response()->json([
                'success' => true,
                'message' => 'Inventory items retrieved successfully',
                'data' => $items
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve inventory items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single inventory item details
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $item = StoreInventory::with('requisitionItems.requisition')->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Inventory item retrieved successfully',
                'data' => $item
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Inventory item not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create new inventory item (Admin only)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:store_inventory,code|max:50',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'total_stock' => 'required|integer|min:0',
            'available_stock' => 'required|integer|min:0',
            'reserved_stock' => 'nullable|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'last_restocked' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validate stock consistency
            $totalStock = $request->total_stock;
            $availableStock = $request->available_stock;
            $reservedStock = $request->input('reserved_stock', 0);

            if (($availableStock + $reservedStock) > $totalStock) {
                return response()->json([
                    'success' => false,
                    'message' => 'Available + Reserved stock cannot exceed total stock'
                ], 422);
            }

            $item = StoreInventory::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Inventory item created successfully',
                'data' => $item
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update inventory item (Admin only)
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'sometimes|string|unique:store_inventory,code,' . $id . '|max:50',
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'total_stock' => 'sometimes|integer|min:0',
            'available_stock' => 'sometimes|integer|min:0',
            'reserved_stock' => 'sometimes|integer|min:0',
            'unit_price' => 'sometimes|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'last_restocked' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $item = StoreInventory::findOrFail($id);

            // If updating stock levels, validate consistency
            if ($request->has('total_stock') || $request->has('available_stock') || $request->has('reserved_stock')) {
                $totalStock = $request->input('total_stock', $item->total_stock);
                $availableStock = $request->input('available_stock', $item->available_stock);
                $reservedStock = $request->input('reserved_stock', $item->reserved_stock);

                if (($availableStock + $reservedStock) > $totalStock) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Available + Reserved stock cannot exceed total stock'
                    ], 422);
                }
            }

            $item->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Inventory item updated successfully',
                'data' => $item->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete inventory item (Admin only)
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $item = StoreInventory::findOrFail($id);

            // Check if item has pending requisitions
            $hasPendingRequisitions = $item->requisitionItems()
                ->whereHas('requisition', function ($query) {
                    $query->whereIn('status', ['pending', 'approved'])
                        ->whereIn('collection_status', ['pending', 'ready']);
                })
                ->exists();

            if ($hasPendingRequisitions) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete item with pending requisitions. Deactivate instead.'
                ], 422);
            }

            $item->delete();

            return response()->json([
                'success' => true,
                'message' => 'Inventory item deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get items with available stock
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAvailableStock(Request $request)
    {
        try {
            $category = $request->input('category');
            
            if ($category) {
                $items = $this->inventoryService->getItemsByCategory($category);
            } else {
                $items = StoreInventory::available()->get();
            }

            return response()->json([
                'success' => true,
                'message' => 'Available items retrieved successfully',
                'data' => $items
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve available items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check availability for specific items
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkAvailability(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|integer|exists:store_inventory,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $result = $this->inventoryService->checkAvailability($request->items);

            return response()->json([
                'success' => true,
                'message' => 'Availability check completed',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check availability',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restock item (Admin only)
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function restock(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $item = $this->inventoryService->restockItem($id, $request->quantity);

            return response()->json([
                'success' => true,
                'message' => 'Item restocked successfully',
                'data' => $item
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to restock item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get inventory statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics()
    {
        try {
            $stats = $this->inventoryService->getStatistics();

            return response()->json([
                'success' => true,
                'message' => 'Statistics retrieved successfully',
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all categories
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCategories()
    {
        try {
            $categories = $this->inventoryService->getCategories();

            return response()->json([
                'success' => true,
                'message' => 'Categories retrieved successfully',
                'data' => $categories
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve categories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get low stock items
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLowStock(Request $request)
    {
        try {
            $threshold = $request->input('threshold', 10);
            $items = $this->inventoryService->getLowStockItems($threshold);

            return response()->json([
                'success' => true,
                'message' => 'Low stock items retrieved successfully',
                'data' => $items
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve low stock items',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
