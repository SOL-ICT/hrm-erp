#!/bin/bash
# NEW FEATURES DEPLOYMENT CHECK
# Check specifically for the features you just added that aren't showing up

echo "🔍 NEW FEATURES DEPLOYMENT CHECK"
echo "================================="

cd /root/hris-app

echo "📊 COMPARING: What's deployed vs what should be there"
echo ""

echo "🎯 1. CHECK: PayrollProcessingPage (New Feature)"
echo "File exists:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/PayrollProcessingPage.jsx 2>/dev/null && echo "✅ EXISTS" || echo "❌ MISSING"

echo "AdminRouter includes it:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -n "payroll-processing" /app/src/components/admin/AdminRouter.jsx || echo "❌ NOT IN ROUTER"

echo ""
echo "🎯 2. CHECK: New PayrollSettingsTab (New Feature)"  
echo "PayrollSettingsTab exists:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/tabs/PayrollSettingsTab.jsx 2>/dev/null && echo "✅ EXISTS" || echo "❌ MISSING"

echo ""
echo "🎯 3. CHECK: New PayrollRunsTab (New Feature)"
echo "PayrollRunsTab exists:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/tabs/PayrollRunsTab.jsx 2>/dev/null && echo "✅ EXISTS" || echo "❌ MISSING"

echo ""
echo "🎯 4. CHECK: EmployeeManagement (New Feature)"
echo "EmployeeManagement exists:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/employee-management/EmployeeManagement.jsx 2>/dev/null && echo "✅ EXISTS" || echo "❌ MISSING"

echo "AdminRouter includes employee-management:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -n "employee-management" /app/src/components/admin/AdminRouter.jsx || echo "❌ NOT IN ROUTER"

echo ""
echo "🎯 5. CHECK: AdminNavigation Menu Updates (New Feature)"
echo "HR & Payroll Management menu with new submodules:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -A 20 "hr-payroll-management" /app/src/components/admin/AdminNavigation.jsx | grep -E "payroll-processing|employee-management" || echo "❌ NEW MENU ITEMS MISSING"

echo ""
echo "🎯 6. CHECK: HRPayrollDashboard Updates"
echo "HRPayrollDashboard should have payroll-processing module:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend grep -A 10 -B 5 "payroll-processing" /app/src/components/admin/modules/hr-payroll-management/HRPayrollDashboard.jsx || echo "❌ PAYROLL-PROCESSING MODULE MISSING FROM DASHBOARD"

echo ""
echo "🎯 7. COMPARE: AdminRouter.jsx Last Modified Time"
echo "When was AdminRouter.jsx last updated in container?"
docker compose -f docker-compose.prod.yml exec nextjs-frontend stat /app/src/components/admin/AdminRouter.jsx | grep Modify

echo ""
echo "🎯 8. COMPARE: Git commit vs Container Files"
echo "Last git commit date:"
git log -1 --format="%cd" --date=iso

echo "Container file dates (should be newer than or equal to git commit):"
docker compose -f docker-compose.prod.yml exec nextjs-frontend find /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing -name "*.jsx" -exec stat -c "%y %n" {} \;

echo ""
echo "🎯 9. CHECK: Which specific new components are missing?"
echo "Looking for components added in your recent work:"

echo "- PayrollProcessingPage tabs folder:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/tabs/ 2>/dev/null || echo "❌ TABS FOLDER MISSING"

echo "- Employee management folder:"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ls -la /app/src/components/admin/modules/hr-payroll-management/submodules/employee-management/ 2>/dev/null || echo "❌ EMPLOYEE-MANAGEMENT FOLDER MISSING"

echo ""
echo "✅ NEW FEATURES CHECK COMPLETE!"
echo ""
echo "🎯 DIAGNOSIS:"
echo "✅ = Feature deployed correctly"
echo "❌ = Feature missing (this is your problem!)"
echo ""
echo "📋 LIKELY CAUSES OF MISSING FEATURES:"
echo "1. Git commit incomplete - not all new files were committed"
echo "2. Docker build used cached layers - new files not included in image"
echo "3. File permissions or ownership issues"
echo "4. Partial git pull - some files didn't sync"
echo ""
echo "🔧 NEXT STEP: Focus on fixing any ❌ items above"
echo ""