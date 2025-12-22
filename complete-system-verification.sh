#!/bin/bash
# Complete HRM-ERP System Deployment Verification
# Check ALL new features that should be working in production

echo "🏢 COMPLETE HRM-ERP SYSTEM DEPLOYMENT VERIFICATION"
echo "=================================================="

cd /root/hris-app

echo "📊 1. GIT STATUS - What was deployed"
echo "Current branch: $(git branch --show-current)"
echo "Last 5 commits:"
git log --oneline -5
echo ""
echo "Files in last commit:"
git show --name-only --pretty=""

echo ""
echo "🏗️ 2. COMPLETE MODULE STRUCTURE VERIFICATION"
echo "Checking if ALL your new modules are in the container..."

# Admin Dashboard and Router
echo "📍 Core Admin Components:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/ | grep -E "(AdminDashboard|AdminRouter|AdminLayout|AdminNavigation)"

# Client Contract Management
echo ""
echo "📍 Client Contract Management Module:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend find /app/src/components/admin/modules/client-contract-management -name "*.jsx" | wc -l
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/client-contract-management/submodules/

# HR & Payroll Management  
echo ""
echo "📍 HR & Payroll Management Module:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend find /app/src/components/admin/modules/hr-payroll-management -name "*.jsx" | wc -l
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/

# Recruitment Management
echo ""
echo "📍 Recruitment Management Module:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend find /app/src/components/admin/modules/recruitment-management -name "*.jsx" | wc -l
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/recruitment-management/submodules/

# Administration Module
echo ""
echo "📍 Administration Module:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend find /app/src/components/admin/modules/administration -name "*.jsx" | wc -l

echo ""
echo "🎯 3. KEY COMPONENTS VERIFICATION"

# Main Dashboard Components
echo "📍 Dashboard Components:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/ | grep Dashboard

# Specific high-value components
echo ""
echo "📍 Critical Components:"
echo "- PayrollProcessingPage:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/PayrollProcessingPage.jsx 2>/dev/null && echo "✅ EXISTS" || echo "❌ MISSING"

echo "- InvoiceManagement:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/invoicing/InvoiceManagement.jsx 2>/dev/null && echo "✅ EXISTS" || echo "❌ MISSING"

echo "- EmployeeManagement:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/employee-management/EmployeeManagement.jsx 2>/dev/null && echo "✅ EXISTS" || echo "❌ MISSING"

echo "- SalaryStructure:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/client-contract-management/submodules/salary-structure/SalaryStructure.jsx 2>/dev/null && echo "✅ EXISTS" || echo "❌ MISSING"

echo "- RecruitmentDashboard:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/recruitment-management/RecruitmentDashboard.jsx 2>/dev/null && echo "✅ EXISTS" || echo "❌ MISSING"

echo "- ClientContractDashboard:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/client-contract-management/ClientContractDashboard.jsx 2>/dev/null && echo "✅ EXISTS" || echo "❌ MISSING"

echo ""
echo "🗄️ 4. BACKEND API VERIFICATION"
echo "📍 Backend Controllers:"
docker compose -f docker-compose.prod.yml exec laravel-api ls -la /var/www/app/Http/Controllers/ | grep -E "(Payroll|Invoice|Employee|Recruitment|Client|Salary)"

echo ""
echo "📍 API Routes:"
docker compose -f docker-compose.prod.yml exec laravel-api ls -la /var/www/routes/modules/

echo ""
echo "📍 Database Migrations:"
docker compose -f docker-compose.prod.yml exec laravel-api php artisan migrate:status | tail -10

echo ""
echo "🌐 5. FRONTEND BUILD AND ROUTING CHECK"
echo "📍 Next.js Build Status:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/.next/ 2>/dev/null && echo "✅ Build directory exists" || echo "❌ No build directory"

echo ""
echo "📍 AdminRouter Integration:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -n "payroll-processing\|employee-management\|client-contract\|recruitment-management" /app/src/components/admin/AdminRouter.jsx

echo ""
echo "📍 Navigation Menu Items:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -A 20 -B 5 "hr-payroll-management\|client-contract-management\|recruitment-management" /app/src/components/admin/AdminNavigation.jsx

echo ""
echo "🔧 6. CONTAINER HEALTH CHECK"
echo "📍 All Containers Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📍 Frontend Logs (last 15 lines):"
docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail 15

echo ""
echo "📍 Backend Logs (last 10 lines):"
docker compose -f docker-compose.prod.yml logs laravel-api --tail 10

echo ""
echo "🌍 7. ACCESSIBILITY TEST"
echo "📍 Frontend Response:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000/

echo "📍 Backend Response:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8000/api/health

echo ""
echo "✅ COMPLETE VERIFICATION FINISHED!"
echo ""
echo "📋 SUMMARY OF YOUR HRM-ERP MODULES:"
echo "1. 👥 Client Contract Management"
echo "   - Client Master, Service Locations, Salary Structures"
echo "   - Pay Grade Management, Offer Letter Builder"
echo "   - Emolument Components"
echo ""
echo "2. 🏢 HR & Payroll Management"  
echo "   - Employee Records, Employee Management"
echo "   - Payroll Processing (3-tab system)"
echo "   - Attendance Tracking, Leave Management"
echo "   - Invoice Management (Attendance-based billing)"
echo ""
echo "3. 🎯 Recruitment Management"
echo "   - Vacancy Declaration, Applicant Screening"
echo "   - Interview Management, Boarding"
echo "   - Blacklist Management"
echo ""
echo "4. ⚙️ Administration"
echo "   - SOL Master, RBAC Management"
echo "   - User Permissions, Role Management"
echo ""
echo "🎯 NEXT STEPS:"
echo "If any components show ❌ MISSING:"
echo "1. Run: docker compose -f docker-compose.prod.yml down"
echo "2. Run: docker compose -f docker-compose.prod.yml build --no-cache"
echo "3. Run: docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "If all show ✅ EXISTS but still not visible:"
echo "1. Clear browser cache completely"
echo "2. Try incognito/private browsing mode"
echo "3. Check browser console for JavaScript errors"
echo ""