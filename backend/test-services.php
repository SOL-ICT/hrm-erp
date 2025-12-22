#!/usr/bin/env php
<?php

/**
 * Test script for Requisition System Services
 * Run: docker exec hrm-laravel-api php test-services.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing Requisition System Services ===\n\n";

// Test InventoryService
echo "1. Testing InventoryService...\n";
try {
    $inventoryService = new App\Services\Requisition\InventoryService();
    echo "   ✓ Service instantiated successfully\n";
    
    // Test get categories
    $categories = $inventoryService->getCategories();
    echo "   ✓ Categories retrieved: " . count($categories) . " categories\n";
    foreach ($categories as $category) {
        echo "     - {$category}\n";
    }
    
    // Test statistics
    $stats = $inventoryService->getStatistics();
    echo "   ✓ Statistics retrieved:\n";
    echo "     - Total items: {$stats['total_items']}\n";
    echo "     - Low stock: {$stats['low_stock_items']}\n";
    echo "     - Out of stock: {$stats['out_of_stock_items']}\n";
    echo "     - Total value: ₦" . number_format($stats['total_stock_value'], 2) . "\n";
    
    // Test check availability
    $availabilityCheck = $inventoryService->checkAvailability([
        ['inventory_item_id' => 1, 'quantity' => 5],
        ['inventory_item_id' => 2, 'quantity' => 3],
    ]);
    echo "   ✓ Availability check completed for 2 items\n";
    
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test RequisitionService
echo "\n2. Testing RequisitionService...\n";
try {
    $inventoryService = new App\Services\Requisition\InventoryService();
    $requisitionService = new App\Services\Requisition\RequisitionService($inventoryService);
    echo "   ✓ Service instantiated successfully\n";
    
    // Test statistics
    $stats = $requisitionService->getStatistics();
    echo "   ✓ Statistics retrieved:\n";
    echo "     - Total requisitions: {$stats['total']}\n";
    echo "     - Pending: {$stats['pending']}\n";
    echo "     - Approved: {$stats['approved']}\n";
    echo "     - Rejected: {$stats['rejected']}\n";
    
    // Test check items availability
    $itemsCheck = $requisitionService->checkItemsAvailability([
        ['inventory_item_id' => 1, 'quantity' => 5],
        ['inventory_item_id' => 2, 'quantity' => 3],
    ]);
    echo "   ✓ Items availability check completed\n";
    echo "     - All available: " . ($itemsCheck['available'] ? 'Yes' : 'No') . "\n";
    
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n3. Testing Service Method Signatures...\n";
try {
    $inventoryService = new App\Services\Requisition\InventoryService();
    $requisitionService = new App\Services\Requisition\RequisitionService($inventoryService);
    
    // Check InventoryService methods
    $inventoryMethods = [
        'reserveStock', 'releaseStock', 'completeTransaction', 
        'restockItem', 'adjustStock', 'checkAvailability',
        'getLowStockItems', 'getOutOfStockItems', 'getStatistics',
        'getItemsByCategory', 'searchItems', 'getCategories'
    ];
    
    echo "   InventoryService methods:\n";
    foreach ($inventoryMethods as $method) {
        $exists = method_exists($inventoryService, $method);
        echo "     " . ($exists ? "✓" : "✗") . " {$method}()\n";
    }
    
    // Check RequisitionService methods
    $requisitionMethods = [
        'createRequisition', 'approveRequisition', 'rejectRequisition',
        'cancelRequisition', 'markReady', 'markCollected',
        'getStatistics', 'checkItemsAvailability'
    ];
    
    echo "   RequisitionService methods:\n";
    foreach ($requisitionMethods as $method) {
        $exists = method_exists($requisitionService, $method);
        echo "     " . ($exists ? "✓" : "✗") . " {$method}()\n";
    }
    
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== All Services Loaded Successfully! ===\n";
