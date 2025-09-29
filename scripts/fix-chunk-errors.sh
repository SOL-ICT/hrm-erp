#!/bin/bash

echo "🧹 Clearing Next.js and Docker caches to fix chunk errors..."

# Stop containers
docker-compose down

# Remove Next.js cache
echo "📁 Clearing Next.js cache..."
rm -rf frontend/.next/cache
rm -rf frontend/.next/static
rm -rf frontend/.next/server

# Clear Docker build cache
echo "🐳 Clearing Docker build cache..."
docker builder prune -f

# Clear Docker volumes (optional - preserves database)
echo "📦 Clearing anonymous volumes..."
docker volume prune -f

# Restart containers
echo "🚀 Restarting containers..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

echo "✅ Cache cleared! Your chunk errors should be resolved."
echo "🌐 Frontend will be available at: http://localhost:3000"
