<?php

/**
 * Test script to verify inventory API endpoint returns data
 * Run: docker exec hrm-laravel-api php test-inventory-api.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\StoreInventory;

echo "=== Testing Inventory API Data ===\n\n";

// Test 1: Check if StoreInventory model works
echo "Test 1: Querying StoreInventory model\n";
$items = StoreInventory::active()->get();
echo "✓ Found {$items->count()} active items\n\n";

// Test 2: Show first 5 items
echo "Test 2: First 5 active items:\n";
$sample = StoreInventory::active()->limit(5)->get();
foreach ($sample as $item) {
    echo "  - {$item->code}: {$item->name} (Category: {$item->category})\n";
    echo "    Stock: {$item->available_stock}/{$item->total_stock}, Price: ₦" . number_format($item->unit_price, 2) . "\n";
}
echo "\n";

// Test 3: Check categories
echo "Test 3: Available categories:\n";
$categories = StoreInventory::active()
    ->select('category')
    ->distinct()
    ->pluck('category');
echo "✓ Found " . $categories->count() . " categories: " . $categories->implode(', ') . "\n\n";

// Test 4: Low stock items
echo "Test 4: Low stock items:\n";
$lowStock = StoreInventory::lowStock()->get();
echo "✓ Found {$lowStock->count()} low stock items\n";
foreach ($lowStock as $item) {
    echo "  - {$item->name}: {$item->available_stock} units\n";
}
echo "\n";

echo "=== All Tests Complete ===\n";
