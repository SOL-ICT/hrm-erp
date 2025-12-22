#!/bin/bash
# ADMIN ACCESS TEST
# Simple test to see if you can access admin dashboard at all

echo "🔑 ADMIN ACCESS TEST"
echo "==================="

cd /root/hris-app

echo "🎯 1. What do you see when you visit the site?"
echo "Let's check what the homepage actually returns..."

echo ""
echo "Homepage content (first 30 lines):"
curl -s http://localhost:3000/ | head -30

echo ""
echo "🔑 2. Testing admin dashboard direct access"
echo "What happens when we try to access /dashboard/admin directly:"
curl -s -w "HTTP_CODE:%{http_code}\n" http://localhost:3000/dashboard/admin | head -20

echo ""
echo "🔍 3. Check if authentication is blocking access"
echo "Testing login page:"
curl -s -w "HTTP_CODE:%{http_code}\n" http://localhost:3000/login | head -10

echo ""
echo "✅ BASIC ACCESS TEST COMPLETE!"
echo ""
echo "📊 RESULTS INTERPRETATION:"
echo "HTTP_CODE:200 = Page loads successfully"
echo "HTTP_CODE:404 = Page not found (routing issue)"
echo "HTTP_CODE:500 = Server error (code issue)"
echo "HTTP_CODE:302/301 = Redirect (likely to login)"
echo ""
echo "🤔 QUESTION FOR YOU:"
echo "When you visit https://mysol360.com in your browser:"
echo "1. Do you see a login page?"
echo "2. Can you log in successfully?"
echo "3. After login, what page do you see?"
echo "4. Do you see any admin/dashboard options in the UI?"
echo ""
echo "💡 Your answers will help pinpoint if this is:"
echo "- Authentication issue (can't login)"  
echo "- Routing issue (login works but no admin access)"
echo "- UI issue (admin access works but modules not visible)"
echo ""