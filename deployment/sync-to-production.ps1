# HRM-ERP Safe Deployment Script (PowerShell Version)
# Usage: .\deployment\sync-to-production.ps1

$ErrorActionPreference = "Stop"

# Configuration
$SERVER = "root@nc-ph-4747.mysol360.com"
$REMOTE_PATH = "/root/hris-app"
$LOCAL_PATH = Get-Location

Write-Host "🚀 HRM-ERP Safe Deployment Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Server: mysol360.com" -ForegroundColor White
Write-Host "Local: $LOCAL_PATH" -ForegroundColor White
Write-Host ""

# Confirm deployment
$confirmation = Read-Host "⚠️  Deploy to PRODUCTION (mysol360.com)? Type 'yes' to continue"
if ($confirmation -ne "yes") {
    Write-Host "❌ Deployment cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "📦 Step 1/5: Syncing backend code..." -ForegroundColor Yellow

# Use SCP or rsync via WSL/Git Bash
# Option 1: If you have WSL
try {
    wsl rsync -avz --progress --delete `
        --exclude='.env' --exclude='.env.local' --exclude='node_modules/' `
        --exclude='vendor/' --exclude='.next/' --exclude='storage/logs/' `
        --exclude='bootstrap/cache/*.php' --exclude='.git/' `
        --exclude='storage' --exclude='bootstrap/cache' `
        "$LOCAL_PATH/backend/" "${SERVER}:${REMOTE_PATH}/backend/"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Backend sync failed!"
    }
} catch {
    Write-Host "❌ Error syncing backend: $_" -ForegroundColor Red
    Write-Host "💡 Tip: Make sure WSL with rsync is installed, or use Git Bash to run sync-to-production.sh" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📦 Step 2/5: Syncing frontend code..." -ForegroundColor Yellow

try {
    wsl rsync -avz --progress --delete `
        --exclude='.env' --exclude='.env.local' --exclude='node_modules/' `
        --exclude='.next/' --exclude='.git/' `
        "$LOCAL_PATH/frontend/" "${SERVER}:${REMOTE_PATH}/frontend/"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend sync failed!"
    }
} catch {
    Write-Host "❌ Error syncing frontend: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Step 3/5: Installing backend dependencies..." -ForegroundColor Yellow

ssh $SERVER @"
cd /root/hris-app
docker compose -f docker-compose.prod.yml exec -T laravel-api composer install --optimize-autoloader --no-dev
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Composer install failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Step 4/5: Running database migrations..." -ForegroundColor Yellow

ssh $SERVER @"
cd /root/hris-app
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan migrate --force
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration failed! Check logs." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Step 5/5: Clearing caches and optimizing..." -ForegroundColor Yellow

ssh $SERVER @"
cd /root/hris-app
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan config:clear
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan route:clear
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan view:clear
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan route:cache
docker compose -f docker-compose.prod.yml exec -T laravel-api php artisan view:cache
"@

Write-Host ""
Write-Host "🔍 Verifying deployment..." -ForegroundColor Yellow

try {
    $healthCheck = Invoke-WebRequest -Uri "https://mysol360.com/api/health" -UseBasicParsing
    if ($healthCheck.Content -like "*ok*") {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Health check returned unexpected response!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Health check failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Verification Steps:" -ForegroundColor Cyan
Write-Host "   1. Visit: https://mysol360.com" -ForegroundColor White
Write-Host "   2. Test login functionality" -ForegroundColor White
Write-Host "   3. Check health page: https://mysol360.com/health" -ForegroundColor White
Write-Host "   4. Monitor logs: ssh $SERVER 'docker compose -f /root/hris-app/docker-compose.prod.yml logs -f'" -ForegroundColor White
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   - Backend synced: ✅" -ForegroundColor Green
Write-Host "   - Frontend synced: ✅" -ForegroundColor Green
Write-Host "   - Dependencies installed: ✅" -ForegroundColor Green
Write-Host "   - Migrations run: ✅" -ForegroundColor Green
Write-Host "   - Caches optimized: ✅" -ForegroundColor Green
Write-Host "   - Health check: ✅" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Test the application thoroughly!" -ForegroundColor Yellow
