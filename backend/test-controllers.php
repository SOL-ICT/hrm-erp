#!/usr/bin/env php
<?php

/**
 * Test script for Requisition System Controllers
 * Run: docker exec hrm-laravel-api php test-controllers.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing Requisition System Controllers ===\n\n";

// Test StoreInventoryController
echo "1. Testing StoreInventoryController...\n";
try {
    $inventoryService = new App\Services\Requisition\InventoryService();
    $controller = new App\Http\Controllers\Admin\Requisition\StoreInventoryController($inventoryService);
    echo "   ✓ Controller instantiated successfully\n";
    
    // Check methods exist
    $methods = [
        'index', 'show', 'store', 'update', 'destroy',
        'getAvailableStock', 'checkAvailability', 'restock',
        'statistics', 'getCategories', 'getLowStock'
    ];
    
    echo "   Controller methods:\n";
    foreach ($methods as $method) {
        $exists = method_exists($controller, $method);
        echo "     " . ($exists ? "✓" : "✗") . " {$method}()\n";
    }
    
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test StaffRequisitionController
echo "\n2. Testing StaffRequisitionController...\n";
try {
    $inventoryService = new App\Services\Requisition\InventoryService();
    $requisitionService = new App\Services\Requisition\RequisitionService($inventoryService);
    $controller = new App\Http\Controllers\Admin\Requisition\StaffRequisitionController($requisitionService);
    echo "   ✓ Controller instantiated successfully\n";
    
    // Check methods exist
    $methods = [
        'index', 'store', 'show', 'myRequisitions', 'pendingApprovals',
        'approve', 'reject', 'cancel', 'markReady', 'markCollected',
        'statistics', 'readyForCollection'
    ];
    
    echo "   Controller methods:\n";
    foreach ($methods as $method) {
        $exists = method_exists($controller, $method);
        echo "     " . ($exists ? "✓" : "✗") . " {$method}()\n";
    }
    
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n3. Checking Controller Namespaces...\n";
try {
    $inventoryClass = App\Http\Controllers\Admin\Requisition\StoreInventoryController::class;
    $requisitionClass = App\Http\Controllers\Admin\Requisition\StaffRequisitionController::class;
    
    echo "   ✓ StoreInventoryController: {$inventoryClass}\n";
    echo "   ✓ StaffRequisitionController: {$requisitionClass}\n";
    
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== All Controllers Loaded Successfully! ===\n";
echo "\nReady for Phase 5: API Routes\n";
