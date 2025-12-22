#!/bin/bash
# Fix production frontend - Reinstall dependencies and rebuild

cd /root/hris-app

echo "🔧 Fixing Next.js frontend on production..."

# Stop the frontend container
echo "Stopping Next.js container..."
docker compose -f docker-compose.prod.yml stop nextjs-frontend

# Remove the container
echo "Removing Next.js container..."
docker compose -f docker-compose.prod.yml rm -f nextjs-frontend

# Rebuild with fresh install
echo "Rebuilding Next.js container (this will reinstall node_modules)..."
docker compose -f docker-compose.prod.yml build --no-cache nextjs-frontend

# Start the container
echo "Starting Next.js container..."
docker compose -f docker-compose.prod.yml up -d nextjs-frontend

# Wait for startup
echo "Waiting 30 seconds for startup..."
sleep 30

# Check status
echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.prod.yml ps nextjs-frontend

echo ""
echo "📋 Recent Logs:"
docker compose -f docker-compose.prod.yml logs nextjs-frontend --tail=50

echo ""
echo "✅ Fix complete! Check logs above for any errors."
echo "   Test at: https://mysol360.com"
