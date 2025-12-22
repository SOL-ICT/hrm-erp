#!/bin/bash
# Production Deployment Fix Script
# Run this on the production server to ensure all local changes are reflected

echo "🔧 PRODUCTION DEPLOYMENT FIX - Complete Frontend Activation"
echo "========================================================="

# Navigate to application directory
cd /root/hris-app

echo "📊 Step 1: Verify current git status"
git status
git log --oneline -3

echo ""
echo "🧹 Step 2: Clear all caches and temporary files"

# Stop containers first
echo "Stopping containers..."
docker compose -f docker-compose.prod.yml down

# Clear Docker build cache
echo "Clearing Docker build cache..."
docker system prune -f
docker builder prune -f

# Clear any Node.js cache in the host system
echo "Clearing Node.js caches..."
rm -rf frontend/node_modules/.cache/
rm -rf frontend/.next/
rm -rf frontend/dist/
rm -rf frontend/build/

echo ""
echo "🔧 Step 3: Force rebuild frontend container from scratch"

# Remove the current frontend image
docker rmi hris-app-nextjs-frontend 2>/dev/null || true

# Build with no cache
echo "Building frontend container with --no-cache..."
docker compose -f docker-compose.prod.yml build --no-cache nextjs-frontend

echo ""
echo "🚀 Step 4: Start all services"
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Step 5: Wait for services to be ready"
sleep 30

echo ""
echo "📋 Step 6: Verify container status"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📝 Step 7: Check frontend container logs"
echo "Last 20 lines of frontend logs:"
docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail 20

echo ""
echo "🔍 Step 8: Test frontend accessibility"
echo "Testing if frontend is responding..."
curl -I http://localhost:3000/ || echo "Frontend not responding on port 3000"

echo ""
echo "✅ DEPLOYMENT FIX COMPLETE!"
echo ""
echo "🎯 Next Steps:"
echo "1. Visit https://mysol360.com in your browser"
echo "2. Hard refresh (Ctrl+F5 or Cmd+Shift+R)"
echo "3. Clear browser cache if needed"
echo "4. Login and check if payroll modules are now visible"
echo ""
echo "💡 If still not working, run this additional check:"
echo "docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/"
echo ""