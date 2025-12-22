#!/bin/bash
# Next.js Production Build Debug Script
# Force complete rebuild and check for build issues

echo "🔧 NEXT.JS PRODUCTION BUILD DEBUG"
echo "=================================="

cd /root/hris-app

echo "🛑 Step 1: Stop all containers"
docker compose -f docker-compose.prod.yml down

echo ""
echo "🧹 Step 2: Remove Next.js build cache completely"
docker compose -f docker-compose.prod.yml run --rm nextjs-frontend rm -rf /app/.next
docker compose -f docker-compose.prod.yml run --rm nextjs-frontend rm -rf /app/node_modules/.cache

echo ""
echo "🔍 Step 3: Check if critical files exist in source"
echo "Checking PayrollProcessingPage import path..."
docker compose -f docker-compose.prod.yml run --rm nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/PayrollProcessingPage.jsx

echo ""
echo "Checking AdminRouter lazy import..."
docker compose -f docker-compose.prod.yml run --rm nextjs-frontend grep -n "payroll-processing" /app/src/components/admin/AdminRouter.jsx

echo ""
echo "🔨 Step 4: Rebuild frontend container from scratch"
docker rmi hris-app-nextjs-frontend 2>/dev/null || echo "Image not found, continuing..."
docker compose -f docker-compose.prod.yml build --no-cache nextjs-frontend

echo ""
echo "🚀 Step 5: Start with verbose logging"
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Step 6: Wait for build to complete"
echo "Watching build process..."
sleep 10
docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail 30

echo ""
echo "🔍 Step 7: Check if .next directory was created properly"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/.next/

echo ""
echo "🔍 Step 8: Check for build errors or missing chunks"
echo "Checking for JavaScript chunks..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend find /app/.next -name "*.js" | head -10

echo ""
echo "🔍 Step 9: Verify AdminRouter is compiled correctly"
echo "Checking if AdminRouter.jsx compiled successfully..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend find /app/.next -name "*AdminRouter*" -o -name "*admin*" | head -5

echo ""
echo "🔍 Step 10: Test direct file access"
echo "Testing if we can access the admin dashboard route directly..."
curl -I http://localhost:3000/dashboard/admin 2>/dev/null || echo "Route not accessible"

echo ""
echo "🔍 Step 11: Check React component loading"
echo "Looking for React lazy loading errors..."
docker compose -f docker-compose.prod.yml logs nextjs-frontend | grep -i "error\|failed\|lazy\|chunk" | tail -10

echo ""
echo "✅ DEBUG COMPLETE!"
echo ""
echo "🎯 NEXT ACTIONS BASED ON RESULTS:"
echo "If build errors found: Fix the specific error shown"
echo "If chunks missing: Component lazy loading issue"
echo "If route 404: Routing configuration problem"  
echo "If no errors: Issue might be in browser-server communication"
echo ""
echo "💡 If still not working, try accessing directly:"
echo "https://mysol360.com/dashboard/admin"
echo ""