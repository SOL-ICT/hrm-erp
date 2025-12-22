#!/bin/bash

# Complete Production Frontend Fix
# This script does everything: backup, update Dockerfile, and rebuild container

echo "=========================================="
echo "Complete Frontend Fix - Tailwind v4"
echo "=========================================="
echo ""
echo "This script will:"
echo "  1. Backup current Dockerfile"
echo "  2. Update Dockerfile for Tailwind v4 support"
echo "  3. Rebuild frontend container"
echo "  4. Verify everything works"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi
echo ""

cd /root/hris-app

# PART 1: UPDATE DOCKERFILE
echo "=========================================="
echo "PART 1: UPDATING DOCKERFILE"
echo "=========================================="
echo ""

cd frontend

echo "Creating backup..."
BACKUP_FILE="Dockerfile.backup-$(date +%Y%m%d-%H%M%S)"
cp Dockerfile "$BACKUP_FILE"
echo "✓ Backup saved as: $BACKUP_FILE"
echo ""

echo "Creating corrected Dockerfile..."
cat > Dockerfile << 'EOF'
# Use the official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Copy package files
COPY package*.json ./

# Clear npm cache and install ALL dependencies (including devDependencies for Tailwind v4)
RUN npm cache clean --force
RUN npm ci

# Copy PostCSS config (required for Tailwind v4)
COPY postcss.config.mjs ./

# Copy Tailwind config (if exists)
COPY tailwind.config.* ./

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Start the application
CMD ["npm", "run", "dev"]
EOF

echo "✓ Dockerfile updated"
echo ""

echo "Verifying Dockerfile..."
if grep -q "CMD \[\"npm\", \"run\", \"dev\"\]" Dockerfile && \
   grep -q "postcss.config.mjs" Dockerfile && \
   grep -q "RUN npm ci$" Dockerfile; then
    echo "✓ All critical changes verified"
else
    echo "✗ ERROR: Dockerfile verification failed!"
    echo "Restoring backup..."
    cp "$BACKUP_FILE" Dockerfile
    exit 1
fi
echo ""

cd ..

# PART 2: REBUILD CONTAINER
echo "=========================================="
echo "PART 2: REBUILDING CONTAINER"
echo "=========================================="
echo ""

echo "Stopping current container..."
docker compose -f docker-compose.prod.yml stop nextjs-frontend
echo "✓ Stopped"
echo ""

echo "Removing container..."
docker compose -f docker-compose.prod.yml rm -f nextjs-frontend
echo "✓ Removed"
echo ""

echo "Removing old image..."
docker rmi hris-app-nextjs-frontend 2>/dev/null && echo "✓ Image removed" || echo "✓ No old image"
echo ""

echo "Building new image (this takes 2-3 minutes)..."
echo "---"
docker compose -f docker-compose.prod.yml build --no-cache nextjs-frontend
BUILD_EXIT=$?
echo "---"

if [ $BUILD_EXIT -ne 0 ]; then
    echo ""
    echo "✗ BUILD FAILED!"
    echo ""
    echo "Restoring backup Dockerfile..."
    cp "frontend/$BACKUP_FILE" frontend/Dockerfile
    echo ""
    echo "To try manual recovery:"
    echo "  cd /root/hris-app/frontend"
    echo "  cat $BACKUP_FILE > Dockerfile"
    echo "  cd .."
    echo "  docker compose -f docker-compose.prod.yml build nextjs-frontend"
    exit 1
fi

echo "✓ Build successful"
echo ""

echo "Starting container..."
docker compose -f docker-compose.prod.yml up -d nextjs-frontend
if [ $? -ne 0 ]; then
    echo "✗ Failed to start container!"
    exit 1
fi
echo "✓ Started"
echo ""

echo "Waiting for Next.js to start (20 seconds)..."
sleep 20
echo ""

# PART 3: VERIFICATION
echo "=========================================="
echo "PART 3: VERIFICATION"
echo "=========================================="
echo ""

echo "Container process:"
echo "---"
docker compose -f docker-compose.prod.yml exec nextjs-frontend ps aux | head -6
echo "---"
echo ""

if docker compose -f docker-compose.prod.yml exec nextjs-frontend ps aux | grep -q "node.*next"; then
    echo "✓ Next.js is running (CORRECT)"
else
    echo "⚠ WARNING: Next.js process not clearly detected"
fi

if docker compose -f docker-compose.prod.yml exec nextjs-frontend ps aux | grep -q "nginx"; then
    echo "✗ ERROR: Nginx is running (SHOULD NOT BE!)"
else
    echo "✓ Nginx not running (CORRECT)"
fi
echo ""

echo "Recent logs:"
echo "---"
docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail=20
echo "---"
echo ""

echo "Checking for Tailwind errors..."
if docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail=50 | grep -qi "tailwindcss.*error\|module parse failed"; then
    echo "⚠ WARNING: Tailwind errors detected in logs!"
    echo "Run this to see details:"
    echo "  docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail=100"
else
    echo "✓ No Tailwind errors detected"
fi
echo ""

echo "Checking for successful startup..."
if docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail=50 | grep -qi "ready in\|ready started server"; then
    echo "✓ Next.js started successfully"
else
    echo "⚠ WARNING: Successful startup message not found"
fi
echo ""

# PART 4: SUMMARY
echo "=========================================="
echo "DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✓ Dockerfile backed up to: frontend/$BACKUP_FILE"
echo "  ✓ Dockerfile updated with Tailwind v4 support"
echo "  ✓ Container rebuilt and started"
echo ""
echo "Next steps:"
echo "  1. Visit https://mysol360.com"
echo "  2. Verify latest features are visible"
echo "  3. Check Tailwind CSS styling works"
echo "  4. Test key workflows (login, navigation, etc.)"
echo ""
echo "If issues occur:"
echo "  - View logs: docker compose -f docker-compose.prod.yml logs nextjs-frontend"
echo "  - Rollback: cp frontend/$BACKUP_FILE frontend/Dockerfile && ./rebuild-frontend-prod.sh"
echo ""
