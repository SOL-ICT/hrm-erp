#!/bin/bash
# Quick Frontend Cache Fix for Production
# Run this if the main fix script doesn't work

echo "🚀 QUICK FRONTEND CACHE FIX"
echo "==========================="

cd /root/hris-app

echo "1. Checking if frontend files are actually in the container..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend find /app/src/components/admin/modules/hr-payroll-management -name "*.jsx" | head -10

echo ""
echo "2. Checking PayrollProcessingPage specifically..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/

echo ""
echo "3. Force Next.js to rebuild..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend rm -rf /app/.next/
docker compose -f docker-compose.prod.yml restart nextjs-frontend

echo ""
echo "4. Wait for restart..."
sleep 20

echo ""
echo "5. Check if Next.js is running in production mode..."
docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail 10

echo ""
echo "✅ QUICK FIX COMPLETE!"
echo ""
echo "Try accessing the site now. If still not working, the issue might be:"
echo "- Browser cache (try incognito mode)"
echo "- Authentication/session issue"
echo "- Database missing migrations"
echo ""