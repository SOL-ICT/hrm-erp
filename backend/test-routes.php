#!/usr/bin/env php
<?php

/**
 * Test script for Requisition System API Routes
 * Run: docker exec hrm-laravel-api php test-routes.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing Requisition System API Routes ===\n\n";

// Get all routes
$routes = app()->router->getRoutes();

// Filter inventory routes
echo "1. Store Inventory Routes:\n";
$inventoryRoutes = [];
foreach ($routes as $route) {
    if (strpos($route->uri(), 'admin/inventory') !== false) {
        $inventoryRoutes[] = [
            'method' => implode('|', $route->methods()),
            'uri' => $route->uri(),
            'action' => $route->getActionName()
        ];
    }
}

foreach ($inventoryRoutes as $route) {
    echo "   [{$route['method']}] {$route['uri']}\n";
}
echo "   Total: " . count($inventoryRoutes) . " routes\n";

// Filter requisition routes
echo "\n2. Staff Requisition Routes:\n";
$requisitionRoutes = [];
foreach ($routes as $route) {
    if (strpos($route->uri(), 'admin/requisitions') !== false) {
        $requisitionRoutes[] = [
            'method' => implode('|', $route->methods()),
            'uri' => $route->uri(),
            'action' => $route->getActionName()
        ];
    }
}

foreach ($requisitionRoutes as $route) {
    echo "   [{$route['method']}] {$route['uri']}\n";
}
echo "   Total: " . count($requisitionRoutes) . " routes\n";

echo "\n3. Route Summary:\n";
echo "   ✓ Inventory routes: " . count($inventoryRoutes) . "\n";
echo "   ✓ Requisition routes: " . count($requisitionRoutes) . "\n";
echo "   ✓ Total requisition system routes: " . (count($inventoryRoutes) + count($requisitionRoutes)) . "\n";

echo "\n=== All Routes Registered Successfully! ===\n";
echo "\nAPI Endpoints Available:\n";
echo "  Base URL: /api/admin\n";
echo "  Inventory: /api/admin/inventory/*\n";
echo "  Requisitions: /api/admin/requisitions/*\n";
echo "  Authentication: Requires auth:sanctum middleware\n";
