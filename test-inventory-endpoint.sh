#!/bin/bash

echo "=== Testing Inventory API Endpoint ==="
echo ""
echo "Testing: GET /api/admin/inventory?active=1"
echo ""

# Test the endpoint with curl
docker exec hrm-laravel-api curl -s -X GET "http://localhost:8000/api/admin/inventory?active=1&per_page=5" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" | php -r 'echo json_encode(json_decode(file_get_contents("php://stdin")), JSON_PRETTY_PRINT);'

echo ""
echo ""
echo "=== Test Complete ==="
