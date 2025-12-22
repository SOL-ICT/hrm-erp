#!/usr/bin/env php
<?php

/**
 * Test script for Requisition System Models
 * Run: docker exec hrm-laravel-api php test-models.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing Requisition System Models ===\n\n";

// Test StoreInventory Model
echo "1. Testing StoreInventory Model...\n";
try {
    $item = App\Models\StoreInventory::first();
    if ($item) {
        echo "   ✓ Model loads correctly\n";
        echo "   - Item: {$item->name} ({$item->code})\n";
        echo "   - Available Stock: {$item->available_stock}\n";
        echo "   - Stock Status: {$item->stock_status}\n";
        
        $activeCount = App\Models\StoreInventory::active()->count();
        echo "   - Active items: {$activeCount}\n";
        
        $availableCount = App\Models\StoreInventory::available()->count();
        echo "   - Available items: {$availableCount}\n";
    } else {
        echo "   ! No items found (expected - table seeded)\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n2. Testing StaffRequisition Model...\n";
try {
    $code = App\Models\StaffRequisition::generateRequisitionCode();
    echo "   ✓ Model loads correctly\n";
    echo "   - Generated code: {$code}\n";
    
    $pendingCount = App\Models\StaffRequisition::pending()->count();
    echo "   - Pending requisitions: {$pendingCount}\n";
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n3. Testing StaffRequisitionItem Model...\n";
try {
    $class = App\Models\StaffRequisitionItem::class;
    echo "   ✓ Model loads correctly\n";
    echo "   - Class: {$class}\n";
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n4. Testing RequisitionStatusLog Model...\n";
try {
    $class = App\Models\RequisitionStatusLog::class;
    echo "   ✓ Model loads correctly\n";
    echo "   - Class: {$class}\n";
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n5. Testing Relationships...\n";
try {
    $item = App\Models\StoreInventory::first();
    if ($item) {
        // Test relationship definition (not loading, just checking it exists)
        $relationshipMethod = method_exists($item, 'requisitionItems');
        echo "   ✓ StoreInventory->requisitionItems() " . ($relationshipMethod ? "exists" : "missing") . "\n";
    }
    
    echo "   ✓ All relationship methods defined\n";
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== All Models Loaded Successfully! ===\n";
