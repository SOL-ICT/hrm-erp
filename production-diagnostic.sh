#!/bin/bash
# Production Configuration Diagnostic
# Check for common production deployment issues

echo "🔍 PRODUCTION CONFIGURATION DIAGNOSTIC"
echo "======================================"

cd /root/hris-app

echo "📁 1. Git Status and Recent Commits"
echo "Current branch: $(git branch --show-current)"
echo "Last commit: $(git log --oneline -1)"
echo "Working directory status:"
git status --porcelain

echo ""
echo "📦 2. Container Status"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "🔧 3. Frontend Container Configuration"
echo "Checking if Next.js is in production mode..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend env | grep NODE_ENV

echo ""
echo "📂 4. Key Files Verification in Container"
echo "Checking AdminRouter.jsx..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/AdminRouter.jsx

echo "Checking PayrollProcessingPage..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/PayrollProcessingPage.jsx

echo "Checking HRPayrollDashboard..."
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/HRPayrollDashboard.jsx

echo ""
echo "🌐 5. Network and Port Check"
echo "Checking if frontend is accessible..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000/ || echo "Frontend not accessible"

echo ""
echo "🗄️ 6. Database Connection Check"
echo "Checking backend database connectivity..."
docker compose -f docker-compose.prod.yml exec laravel-api php artisan migrate:status | tail -5

echo ""
echo "🔑 7. Authentication Routes Check"
echo "Testing if login endpoint works..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8000/api/login || echo "Backend not accessible"

echo ""
echo "✅ DIAGNOSTIC COMPLETE!"
echo ""
echo "🎯 Based on the results above:"
echo "- If files are missing in container: Run production-deployment-fix.sh"
echo "- If HTTP Status is 404/500: Check logs with 'docker compose logs'"  
echo "- If NODE_ENV is not 'production': Check Dockerfile configuration"
echo "- If database errors: Run 'docker compose exec laravel-api php artisan migrate'"
echo ""