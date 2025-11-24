#!/bin/bash
# Safe deployment script - Only syncs code, not production configs
# Usage: ./deployment/sync-to-production.sh

set -e  # Exit on error

# Configuration
SERVER="root@nc-ph-4747.mysol360.com"
REMOTE_PATH="/root/hris-app"
LOCAL_PATH="."

echo "🚀 HRM-ERP Safe Deployment Script"
echo "===================================="
echo "Server: mysol360.com"
echo "Local: $LOCAL_PATH"
echo ""

# Files/folders to EXCLUDE from sync (CRITICAL - prevents config overwrite)
EXCLUDE_PATTERNS=(
    # Environment files (never sync these!)
    ".env"
    ".env.local"
    ".env.production"
    "backend/.env"
    "frontend/.env.local"
    
    # Server-specific configs
    "docker-compose.prod.yml"
    "nginx-proxy.conf"
    
    # Local development files (don't sync to production)
    "docker-compose.yml"
    "docker-compose.dev.yml"
    "setup-local-dev.ps1"
    "check-port-conflicts.ps1"
    "YOUR_CURRENT_SETUP_ANALYSIS.md"
    
    # Build artifacts & dependencies
    "node_modules/"
    "vendor/"
    ".next/"
    
    # Logs & cache
    "storage/logs/"
    "bootstrap/cache/*.php"
    
    # Version control & IDE
    ".git/"
    ".vscode/"
    ".idea/"
    
    # OS files
    ".DS_Store"
    "Thumbs.db"
    
    # Documentation (optional - comment out if you want to sync docs)
    "START_HERE.md"
    "LOCAL_TO_PRODUCTION_SETUP.md"
    "DEVELOPMENT_WORKFLOW.md"
    "QUICK_REFERENCE.md"
)

# Build rsync exclude options
EXCLUDE_OPTS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_OPTS="$EXCLUDE_OPTS --exclude=$pattern"
done

# Confirm deployment
read -p "⚠️  Deploy to PRODUCTION (mysol360.com)? Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

echo ""
echo "📦 Step 1/5: Syncing backend code..."
rsync -avz --progress --delete $EXCLUDE_OPTS \
    --exclude='storage' \
    --exclude='bootstrap/cache' \
    "$LOCAL_PATH/backend/" \
    "$SERVER:$REMOTE_PATH/backend/"

if [ $? -ne 0 ]; then
    echo "❌ Backend sync failed!"
    exit 1
fi

echo ""
echo "📦 Step 2/5: Syncing frontend code..."
rsync -avz --progress --delete $EXCLUDE_OPTS \
    "$LOCAL_PATH/frontend/" \
    "$SERVER:$REMOTE_PATH/frontend/"

if [ $? -ne 0 ]; then
    echo "❌ Frontend sync failed!"
    exit 1
fi

echo ""
echo "🔧 Step 3/5: Installing backend dependencies..."
ssh $SERVER << 'ENDSSH'
cd /root/hris-app
docker compose -f docker-compose.prod.yml exec -T laravel-api composer install --optimize-autoloader --no-dev
if [ $? -ne 0 ]; then
    echo "❌ Composer install failed!"
    exit 1
fi
ENDSSH

echo ""
echo "🔧 Step 4/5: Running database migrations..."
ssh $SERVER << 'ENDSSH'
cd /root/hris-app
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan migrate --force
if [ $? -ne 0 ]; then
    echo "⚠️  Migration failed! Rolling back..."
    docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan migrate:rollback
    exit 1
fi
ENDSSH

echo ""
echo "🔧 Step 5/5: Clearing caches and optimizing..."
ssh $SERVER << 'ENDSSH'
cd /root/hris-app

# Clear old caches
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan config:clear
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan route:clear
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan view:clear

# Build optimized caches
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan route:cache
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan view:cache

echo "✅ Cache optimization complete!"
ENDSSH

echo ""
echo "🔍 Verifying deployment..."
HEALTH_CHECK=$(curl -s https://mysol360.com/api/health)
if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed! Response: $HEALTH_CHECK"
    echo "Check logs: ssh $SERVER 'docker compose -f /root/hris-app/docker-compose.prod.yml logs --tail=50 laravel-api'"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "======================================"
echo ""
echo "🔍 Verification Steps:"
echo "   1. Visit: https://mysol360.com"
echo "   2. Test login functionality"
echo "   3. Check health page: https://mysol360.com/health"
echo "   4. Monitor logs: ssh $SERVER 'docker compose -f /root/hris-app/docker-compose.prod.yml logs -f'"
echo ""
echo "📊 Deployment Summary:"
echo "   - Backend synced: ✅"
echo "   - Frontend synced: ✅"
echo "   - Dependencies installed: ✅"
echo "   - Migrations run: ✅"
echo "   - Caches optimized: ✅"
echo "   - Health check: ✅"
echo ""
echo "⚠️  IMPORTANT: Test the application thoroughly before considering deployment complete!"
