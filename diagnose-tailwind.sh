#!/bin/bash

# Tailwind v4 Diagnostic Script

echo "=========================================="
echo "Tailwind v4 Diagnostic"
echo "=========================================="
echo ""

cd /root/hris-app/frontend

echo "1. Checking package.json for Tailwind v4 packages..."
echo "---"
grep -A 2 "tailwindcss" package.json
echo "---"
echo ""

echo "2. Checking for PostCSS config..."
if [ -f "postcss.config.mjs" ]; then
    echo "✓ postcss.config.mjs exists"
    echo "---"
    cat postcss.config.mjs
    echo "---"
else
    echo "✗ postcss.config.mjs NOT FOUND"
fi
echo ""

echo "3. Checking for Tailwind config..."
if [ -f "tailwind.config.ts" ]; then
    echo "✓ tailwind.config.ts exists"
elif [ -f "tailwind.config.js" ]; then
    echo "✓ tailwind.config.js exists"
else
    echo "⚠ No Tailwind config found"
fi
echo ""

echo "4. Checking next.config.ts..."
if [ -f "next.config.ts" ]; then
    echo "✓ next.config.ts exists"
    echo "---"
    cat next.config.ts | head -20
    echo "---"
else
    echo "✗ next.config.ts NOT FOUND"
fi
echo ""

echo "5. Checking globals.css..."
echo "---"
head -5 src/app/globals.css
echo "---"
echo ""

echo "6. Checking installed packages in container..."
docker compose -f ../docker-compose.prod.yml exec nextjs-frontend npm list tailwindcss @tailwindcss/postcss 2>&1 || echo "Packages not found or error"
echo ""

echo "=========================================="
echo "Diagnosis Complete"
echo "=========================================="
