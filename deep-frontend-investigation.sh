#!/bin/bash
# DEEP FRONTEND INVESTIGATION
# Check if there's a code or routing issue preventing the modules from loading

echo "🔍 DEEP FRONTEND INVESTIGATION"
echo "=============================="

cd /root/hris-app

echo "🎯 1. Test if the basic site structure works"
echo "Checking if login page loads..."
curl -s http://localhost:3000/login | grep -q "login\|Login" && echo "✅ Login page loads" || echo "❌ Login page doesn't load"

echo ""
echo "Checking if main page loads..."
curl -s http://localhost:3000/ | grep -q "html\|body" && echo "✅ Main page loads" || echo "❌ Main page doesn't load"

echo ""
echo "🔍 2. Check JavaScript console errors in container"
echo "Testing if Next.js is serving JavaScript correctly..."
curl -s http://localhost:3000/_next/static/ | head -5

echo ""
echo "🔍 3. Check AdminRouter.jsx import paths in running container"
echo "Verifying PayrollProcessingPage import..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -A 3 -B 3 "PayrollProcessingPage" /app/src/components/admin/AdminRouter.jsx

echo ""
echo "🔍 4. Test if PayrollProcessingPage file exists and has correct syntax"
echo "File exists:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/PayrollProcessingPage.jsx

echo ""
echo "File contents (first 10 lines):"
docker compose -f docker-compose.prod.yml exec nextjs-frontend head -10 /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/PayrollProcessingPage.jsx

echo ""
echo "🔍 5. Check if AdminNavigation has the menu items"
echo "Checking for HR & Payroll Management menu:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -A 10 -B 2 "hr-payroll-management" /app/src/components/admin/AdminNavigation.jsx

echo ""
echo "🔍 6. Test direct component loading"
echo "Try to require AdminRouter to check for syntax errors..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend node -e "
try {
  const path = '/app/src/components/admin/AdminRouter.jsx';
  const fs = require('fs');
  const content = fs.readFileSync(path, 'utf8');
  if (content.includes('payroll-processing')) {
    console.log('✅ AdminRouter contains payroll-processing case');
  } else {
    console.log('❌ AdminRouter missing payroll-processing case');
  }
  if (content.includes('PayrollProcessingPage')) {
    console.log('✅ AdminRouter imports PayrollProcessingPage');
  } else {
    console.log('❌ AdminRouter missing PayrollProcessingPage import');
  }
} catch (e) {
  console.log('❌ Error reading AdminRouter:', e.message);
}
"

echo ""
echo "🔍 7. Check actual site response with detailed headers"
echo "Full HTTP response from site:"
curl -v http://localhost:3000/ 2>&1 | head -20

echo ""
echo "🔍 8. Check if there are any React/Next.js errors in logs"
echo "Recent frontend logs with any errors:"
docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail 50 | grep -i "error\|fail\|warn"

echo ""
echo "🔍 9. Test API connectivity from frontend container"
echo "Testing if frontend can reach backend API..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend curl -s http://laravel-api/api/health || echo "Backend not reachable from frontend"

echo ""
echo "🔍 10. Check browser-specific issues"
echo "Generate a test page to verify basic React rendering..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend node -e "
console.log('Testing React component structure...');
console.log('If you can see this, Node.js is working in container');
"

echo ""
echo "✅ DEEP INVESTIGATION COMPLETE!"
echo ""
echo "🎯 ANALYSIS GUIDE:"
echo "✅ If login page loads: Basic Next.js works"
echo "✅ If AdminRouter contains payroll-processing: Code is deployed"
echo "✅ If PayrollProcessingPage import exists: Routing should work"
echo "❌ If any of above fail: We found the specific issue"
echo ""
echo "🚨 POSSIBLE ISSUES:"
echo "1. JavaScript bundle corruption"
echo "2. React hydration mismatch"
echo "3. Authentication preventing admin access"
echo "4. Routing case-sensitivity issue"
echo "5. Browser CORS/CSP policy blocking requests"
echo ""
echo "📝 Next action: Check the specific ❌ items above to pinpoint the exact problem"
echo ""