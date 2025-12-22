#!/bin/bash
# Quick Import and Routing Debug
# Check for common Next.js deployment issues

echo "🕵️ QUICK IMPORT AND ROUTING DEBUG"
echo "=================================="

cd /root/hris-app

echo "🔍 1. Check AdminRouter imports"
echo "Looking for import statements in AdminRouter.jsx..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend head -50 /app/src/components/admin/AdminRouter.jsx | grep -E "import|lazy"

echo ""
echo "🔍 2. Check if payroll-processing case exists in AdminRouter"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -A 10 -B 2 "payroll-processing" /app/src/components/admin/AdminRouter.jsx

echo ""
echo "🔍 3. Check AdminNavigation menu items"
echo "Looking for HR & Payroll Management in navigation..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -A 15 -B 2 "hr-payroll-management" /app/src/components/admin/AdminNavigation.jsx

echo ""
echo "🔍 4. Check for JavaScript/TypeScript syntax errors"
echo "Testing AdminRouter syntax..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend node -c "require('/app/src/components/admin/AdminRouter.jsx')" 2>&1 || echo "Syntax check failed - file might have errors"

echo ""
echo "🔍 5. Check current Next.js process"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ps aux | grep next

echo ""
echo "🔍 6. Check server response directly"
echo "Testing localhost:3000 from inside container..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend curl -I http://localhost:3000/ 2>/dev/null || echo "Server not responding internally"

echo ""
echo "🔍 7. Check for missing dependency errors"
echo "Looking for module not found errors..."
docker compose -f docker-compose.prod.yml logs nextjs-frontend | grep -i "module.*not.*found\|cannot.*resolve" | tail -5

echo ""
echo "✅ QUICK DEBUG COMPLETE!"
echo ""
echo "🎯 ANALYSIS:"
echo "- If imports look good: Build cache issue"
echo "- If payroll-processing case missing: Code not committed properly"
echo "- If navigation missing: AdminNavigation not updated"
echo "- If syntax errors: Fix the specific error"
echo "- If server not responding: Container startup issue"
echo ""