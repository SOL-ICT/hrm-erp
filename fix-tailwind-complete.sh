#!/bin/bash

# Tailwind v4 Complete Fix for Production

echo "=========================================="
echo "Tailwind v4 Complete Fix"
echo "=========================================="
echo ""

cd /root/hris-app/frontend

# Step 1: Check if we need to update from git
echo "Step 1: Checking if files need updating from git..."
cd /root/hris-app

# Pull latest from git (this should have correct package.json and next.config.ts)
echo "Pulling latest code from git..."
git fetch origin
git pull origin main

echo "✓ Code updated from git"
echo ""

# Step 2: Verify critical files exist
echo "Step 2: Verifying critical files..."
cd frontend

FILES_TO_CHECK="package.json postcss.config.mjs next.config.ts src/app/globals.css"
MISSING_FILES=""

for file in $FILES_TO_CHECK; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file MISSING"
        MISSING_FILES="$MISSING_FILES $file"
    fi
done

if [ -n "$MISSING_FILES" ]; then
    echo ""
    echo "✗ ERROR: Missing required files:$MISSING_FILES"
    echo "Please ensure these files are in git and try again."
    exit 1
fi

echo ""

# Step 3: Check package.json for Tailwind v4
echo "Step 3: Checking package.json..."
if grep -q '"tailwindcss": "^4"' package.json && grep -q '"@tailwindcss/postcss": "^4"' package.json; then
    echo "✓ Tailwind v4 packages found in package.json"
else
    echo "⚠ WARNING: Tailwind v4 packages may be missing or incorrect"
    echo "Expected:"
    echo '  "tailwindcss": "^4"'
    echo '  "@tailwindcss/postcss": "^4"'
    echo ""
    echo "Found:"
    grep "tailwindcss" package.json
fi
echo ""

# Step 4: Rebuild container with updated code
echo "Step 4: Rebuilding container..."
cd /root/hris-app

echo "Stopping container..."
docker compose -f docker-compose.prod.yml stop nextjs-frontend

echo "Removing container..."
docker compose -f docker-compose.prod.yml rm -f nextjs-frontend

echo "Removing old image..."
docker rmi hris-app-nextjs-frontend 2>/dev/null || echo "No old image to remove"

echo "Building new image (this takes 2-3 minutes)..."
docker compose -f docker-compose.prod.yml build --no-cache nextjs-frontend

if [ $? -ne 0 ]; then
    echo "✗ BUILD FAILED!"
    exit 1
fi

echo "✓ Build successful"
echo ""

echo "Starting container..."
docker compose -f docker-compose.prod.yml up -d nextjs-frontend

echo "Waiting for startup (30 seconds)..."
sleep 30

# Step 5: Verify
echo ""
echo "Step 5: Verification..."
echo "---"
docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail=50
echo "---"
echo ""

if docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail=50 | grep -qi "tailwindcss.*error\|module parse failed.*tailwindcss"; then
    echo "✗ STILL SEEING TAILWIND ERRORS"
    echo ""
    echo "This likely means one of:"
    echo "  1. package.json on server is different from git"
    echo "  2. Git doesn't have the correct Tailwind v4 packages"
    echo "  3. next.config.ts needs additional configuration"
    echo ""
    echo "Run diagnostic: ./diagnose-tailwind.sh"
else
    echo "✓ No Tailwind errors detected!"
fi

echo ""
echo "=========================================="
echo "Fix attempt complete"
echo "=========================================="
