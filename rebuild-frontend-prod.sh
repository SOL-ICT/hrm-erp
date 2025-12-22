#!/bin/bash

# Production Frontend Rebuild Script
# This script rebuilds the Next.js frontend container with the corrected Dockerfile

echo "=========================================="
echo "Frontend Container Rebuild - Tailwind v4 Fix"
echo "=========================================="
echo ""

cd /root/hris-app

# Step 1: Stop the current container
echo "Step 1: Stopping current frontend container..."
docker compose -f docker-compose.prod.yml stop nextjs-frontend
echo "✓ Container stopped"
echo ""

# Step 2: Remove the container
echo "Step 2: Removing container..."
docker compose -f docker-compose.prod.yml rm -f nextjs-frontend
echo "✓ Container removed"
echo ""

# Step 3: Remove the old image
echo "Step 3: Removing old image..."
docker rmi hris-app-nextjs-frontend 2>/dev/null && echo "✓ Image removed" || echo "✓ No old image to remove"
echo ""

# Step 4: Rebuild with no cache
echo "Step 4: Building new image (this may take 2-3 minutes)..."
docker compose -f docker-compose.prod.yml build --no-cache nextjs-frontend
if [ $? -eq 0 ]; then
    echo "✓ Build successful"
else
    echo "✗ Build failed!"
    exit 1
fi
echo ""

# Step 5: Start the container
echo "Step 5: Starting frontend container..."
docker compose -f docker-compose.prod.yml up -d nextjs-frontend
if [ $? -eq 0 ]; then
    echo "✓ Container started"
else
    echo "✗ Failed to start container!"
    exit 1
fi
echo ""

# Step 6: Wait for startup
echo "Step 6: Waiting for Next.js to start (20 seconds)..."
sleep 20
echo ""

# Step 7: Verify the process
echo "Step 7: Verifying container process..."
echo "---"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ps aux | head -5
echo "---"
echo ""

if docker compose -f docker-compose.prod.yml exec nextjs-frontend ps aux | grep -q "node"; then
    echo "✓ Node.js process is running (CORRECT)"
else
    echo "✗ WARNING: Node.js process not detected!"
fi

if docker compose -f docker-compose.prod.yml exec nextjs-frontend ps aux | grep -q "nginx"; then
    echo "✗ WARNING: Nginx process detected (SHOULD NOT BE RUNNING)"
else
    echo "✓ Nginx process not running (CORRECT)"
fi
echo ""

# Step 8: Check logs for errors
echo "Step 8: Checking logs for startup errors..."
echo "---"
docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail=30 | grep -i "error\|ready"
echo "---"
echo ""

# Step 9: Final status
echo "=========================================="
echo "Rebuild Complete!"
echo "=========================================="
echo ""
echo "Final Checks:"
echo "  1. Visit https://mysol360.com to verify site loads"
echo "  2. Check for new features in the UI"
echo "  3. Look for Tailwind CSS styling (should work now)"
echo ""
echo "If you see errors about Tailwind, check:"
echo "  docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail=50"
echo ""
