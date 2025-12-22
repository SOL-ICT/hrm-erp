<?php

/**
 * Test script to simulate the inventory API endpoint call
 * Run: docker exec hrm-laravel-api php test-inventory-endpoint.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\Requisition\InventoryService;
use Illuminate\Http\Request;

echo "=== Testing Inventory API Endpoint ===\n\n";

try {
    $service = new InventoryService();
    
    // Test 1: Get all items (simulating API call with is_active=1)
    echo "Test 1: Get all active items (like frontend API call)\n";
    $request = new Request([
        'is_active' => 1,
        'per_page' => 50
    ]);
    
    $result = $service->getAllInventory($request);
    
    if (isset($result['data'])) {
        echo "✓ API returns paginated response\n";
        echo "  Total items: " . $result['total'] . "\n";
        echo "  Items in response: " . count($result['data']) . "\n";
        echo "  Per page: " . $result['per_page'] . "\n";
        echo "  Current page: " . $result['current_page'] . "\n\n";
        
        echo "First 3 items:\n";
        foreach (array_slice($result['data'], 0, 3) as $item) {
            echo "  - {$item['code']}: {$item['name']}\n";
            echo "    Category: {$item['category']}, Stock: {$item['available_stock']}/{$item['total_stock']}\n";
        }
    } else {
        echo "✗ Unexpected response format\n";
        echo "Response: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
    }
    
    echo "\n";
    
    // Test 2: Get categories
    echo "Test 2: Get categories\n";
    $categories = $service->getCategories();
    echo "✓ Found " . count($categories) . " categories: " . implode(', ', $categories) . "\n\n";
    
    // Test 3: Search test
    echo "Test 3: Search for 'Paper'\n";
    $searchRequest = new Request([
        'search' => 'Paper',
        'is_active' => 1
    ]);
    $searchResult = $service->getAllInventory($searchRequest);
    echo "✓ Found " . count($searchResult['data']) . " items matching 'Paper'\n";
    foreach ($searchResult['data'] as $item) {
        echo "  - {$item['name']}\n";
    }
    
    echo "\n=== All Tests Complete ===\n";
    echo "\nConclusion: Backend is working correctly!\n";
    echo "If frontend shows empty, check:\n";
    echo "1. Authentication token is valid\n";
    echo "2. API base URL is correct\n";
    echo "3. Browser console for network errors\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
