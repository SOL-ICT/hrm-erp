<?php

use App\Http\Controllers\Admin\Requisition\StoreInventoryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Store Inventory Management Routes
|--------------------------------------------------------------------------
| Manages inventory items for the requisition system
*/

Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::prefix('inventory')->group(function () {
        // List and filter inventory items
        Route::get('/', [StoreInventoryController::class, 'index']);
        
        // Get single item details
        Route::get('/{id}', [StoreInventoryController::class, 'show']);
        
        // Create new inventory item (Admin only)
        Route::post('/', [StoreInventoryController::class, 'store']);
        
        // Update inventory item (Admin only)
        Route::put('/{id}', [StoreInventoryController::class, 'update']);
        
        // Delete inventory item (Admin only)
        Route::delete('/{id}', [StoreInventoryController::class, 'destroy']);
        
        // Get items with available stock
        Route::get('/available/items', [StoreInventoryController::class, 'getAvailableStock']);
        
        // Check availability for specific items
        Route::post('/check-availability', [StoreInventoryController::class, 'checkAvailability']);
        
        // Restock item (Admin only)
        Route::post('/{id}/restock', [StoreInventoryController::class, 'restock']);
        
        // Get inventory statistics
        Route::get('/stats/overview', [StoreInventoryController::class, 'statistics']);
        
        // Get all categories
        Route::get('/categories/list', [StoreInventoryController::class, 'getCategories']);
        
        // Get low stock items
        Route::get('/alerts/low-stock', [StoreInventoryController::class, 'getLowStock']);
    });
});
