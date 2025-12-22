#!/bin/bash
# ADMIN UI MODULE VISIBILITY DEBUG
# Check why new modules aren't showing in the admin interface

echo "🎯 ADMIN UI MODULE VISIBILITY DEBUG"
echo "==================================="

cd /root/hris-app

echo "🔍 1. Check what's actually rendering in the admin dashboard"
echo "Testing admin dashboard response:"
curl -s http://localhost:3000/dashboard/admin | head -50

echo ""
echo "🔍 2. Verify AdminNavigation.jsx has the new menu items"
echo "Checking for ALL new modules in navigation:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -A 5 -B 5 "client-contract-management\|hr-payroll-management\|recruitment-management" /app/src/components/admin/AdminNavigation.jsx

echo ""
echo "🔍 3. Check AdminRouter.jsx routing cases"
echo "Checking for routing cases in AdminRouter:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -A 5 -B 5 "case.*client-contract\|case.*hr-payroll\|case.*recruitment" /app/src/components/admin/AdminRouter.jsx

echo ""
echo "🔍 4. Check if AdminLayout is using the correct components"
echo "Checking AdminLayout.jsx imports and usage:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -n "AdminNavigation\|AdminRouter" /app/src/components/admin/AdminLayout.jsx

echo ""
echo "🔍 5. Test specific dashboard components exist"
echo "Checking dashboard components:"
echo "- ClientContractDashboard:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend head -5 /app/src/components/admin/modules/client-contract-management/ClientContractDashboard.jsx

echo "- HRPayrollDashboard:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend head -5 /app/src/components/admin/modules/hr-payroll-management/HRPayrollDashboard.jsx

echo "- RecruitmentDashboard:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend head -5 /app/src/components/admin/modules/recruitment-management/RecruitmentDashboard.jsx

echo ""
echo "🔍 6. Check if AdminDashboard.jsx is the correct version"
echo "Checking AdminDashboard.jsx content:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend cat /app/src/components/admin/AdminDashboard.jsx

echo ""
echo "🔍 7. Verify which admin page is actually loading"
echo "Check what /dashboard/admin route actually renders:"
echo "Testing direct admin route response..."
curl -s http://localhost:3000/dashboard/admin -H "Accept: text/html" | grep -o '<title[^>]*>[^<]*</title>\|<h1[^>]*>[^<]*</h1>\|<div[^>]*class[^>]*admin[^>]*>' | head -10

echo ""
echo "🔍 8. Check Next.js routing configuration"
echo "Looking for admin route in app directory:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend find /app/src/app -name "*admin*" -type f

echo ""
echo "🔍 9. Test if the old vs new admin system conflict"
echo "Checking if there are multiple admin components:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend find /app/src -name "*Admin*" -name "*.jsx" | head -10

echo ""
echo "✅ ADMIN UI DEBUG COMPLETE!"
echo ""
echo "🎯 LIKELY ISSUES BASED ON RESULTS:"
echo "❌ If AdminNavigation missing new modules: Menu not updated"
echo "❌ If AdminRouter missing cases: Routing not configured"  
echo "❌ If AdminDashboard only shows 'AdminLayout': Wrong component loaded"
echo "❌ If old admin files exist: Version conflict"
echo ""
echo "📝 The output above should show exactly why your new modules aren't visible!"
echo ""