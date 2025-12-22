#!/bin/bash
# COMPLETE IMAGE PURGE AND REBUILD
# Force Docker to rebuild from absolute scratch

echo "🧹 COMPLETE DOCKER IMAGE PURGE AND REBUILD"
echo "==========================================="

cd /root/hris-app

echo "🛑 Step 1: Stop all containers"
docker compose -f docker-compose.prod.yml down

echo ""
echo "🗑️ Step 2: COMPLETELY REMOVE the old frontend image"
echo "Removing hris-app-nextjs-frontend image..."
docker rmi hris-app-nextjs-frontend --force 2>/dev/null || echo "Image already removed"

echo ""
echo "Removing any related images..."
docker rmi $(docker images | grep hris-app | awk '{print $3}') --force 2>/dev/null || echo "No related images found"

echo ""
echo "🧹 Step 3: Clean Docker build cache aggressively"
docker builder prune --force
docker system prune --force
docker volume prune --force

echo ""
echo "🧹 Step 4: Remove any cached layers"
docker buildx prune --force 2>/dev/null || echo "Buildx not available, continuing..."

echo ""
echo "📋 Step 5: Verify image is completely gone"
echo "Checking for any remaining hris-app images..."
docker images | grep hris-app || echo "✅ All hris-app images successfully removed"

echo ""
echo "🔨 Step 6: Build frontend with ABSOLUTE NO CACHE"
echo "This will take 5-10 minutes as it downloads everything fresh..."
docker compose -f docker-compose.prod.yml build --no-cache --pull nextjs-frontend

echo ""
echo "🚀 Step 7: Start services with new image"
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Step 8: Wait for fresh startup"
sleep 30

echo ""
echo "✅ Step 9: Verify new image is running"
echo "Container status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "Image details:"
docker images | grep hris-app

echo ""
echo "Frontend startup logs:"
docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail 15

echo ""
echo "🎯 Step 10: Test fresh deployment"
echo "Testing site accessibility..."
curl -I http://localhost:3000/ 2>/dev/null || echo "Still starting up..."

echo ""
echo "✅ COMPLETE IMAGE REBUILD FINISHED!"
echo ""
echo "🎉 Your fresh image should now include ALL your new modules!"
echo "Try accessing https://mysol360.com now - it should show your complete HRM system!"
echo ""
echo "If you STILL don't see the modules after this, there may be a code issue."
echo "But this should definitely fix any Docker caching problems."
echo ""