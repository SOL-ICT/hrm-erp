#!/bin/bash

# Production Dockerfile Update Script
# This script safely updates the frontend Dockerfile to fix Tailwind v4 support

echo "=========================================="
echo "Production Dockerfile Update - Tailwind v4 Fix"
echo "=========================================="
echo ""

cd /root/hris-app/frontend

# Step 1: Backup current Dockerfile
echo "Step 1: Creating backup of current Dockerfile..."
cp Dockerfile Dockerfile.backup-$(date +%Y%m%d-%H%M%S)
echo "✓ Backup created"
echo ""

# Step 2: Create the corrected Dockerfile
echo "Step 2: Creating corrected Dockerfile..."
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

echo "✓ Corrected Dockerfile created"
echo ""

# Step 3: Show the changes
echo "Step 3: Key changes made:"
echo "  ✓ Changed: npm ci --only=production=false → npm ci"
echo "  ✓ Added: Explicit copy of postcss.config.mjs (for Tailwind v4)"
echo "  ✓ Added: Explicit copy of tailwind.config.* (for Tailwind v4)"
echo "  ✓ Fixed: Added missing CMD line"
echo ""

# Step 4: Verify the Dockerfile
echo "Step 4: Verifying Dockerfile..."
if grep -q "CMD \[\"npm\", \"run\", \"dev\"\]" Dockerfile; then
    echo "✓ CMD instruction found"
else
    echo "✗ ERROR: CMD instruction missing!"
    exit 1
fi

if grep -q "postcss.config.mjs" Dockerfile; then
    echo "✓ PostCSS config copy found"
else
    echo "✗ ERROR: PostCSS config copy missing!"
    exit 1
fi

if grep -q "RUN npm ci$" Dockerfile; then
    echo "✓ npm ci command correct (installs all dependencies)"
else
    echo "✗ WARNING: npm ci command might not install devDependencies"
fi

echo ""
echo "=========================================="
echo "Dockerfile Updated Successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. cd /root/hris-app"
echo "  2. docker compose -f docker-compose.prod.yml stop nextjs-frontend"
echo "  3. docker compose -f docker-compose.prod.yml rm -f nextjs-frontend"
echo "  4. docker rmi hris-app-nextjs-frontend 2>/dev/null || true"
echo "  5. docker compose -f docker-compose.prod.yml build --no-cache nextjs-frontend"
echo "  6. docker compose -f docker-compose.prod.yml up -d nextjs-frontend"
echo ""
echo "Or run the automated rebuild script: ./rebuild-frontend.sh"
echo ""
