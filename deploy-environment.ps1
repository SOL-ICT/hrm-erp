# HRM-ERP Intelligent Environment Manager
# Automatically detects and configures the correct environment

param(
    [Parameter()]
    [ValidateSet("development", "production", "auto")]
    [string]$Environment = "auto"
)

Write-Host "🚀 HRM-ERP Environment Manager" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Function to detect environment
function Get-Environment {
    # Check if we're in a production environment
    if ((Get-ComputerInfo).CsName -match "mysol360|production" -or 
        (Test-Path "C:\xampp\htdocs") -or 
        (Get-Service -Name "Apache*" -ErrorAction SilentlyContinue)) {
        return "production"
    }
    return "development"
}

# Auto-detect environment if not specified
if ($Environment -eq "auto") {
    $Environment = Get-Environment
    Write-Host "🔍 Auto-detected environment: $Environment" -ForegroundColor Yellow
} else {
    Write-Host "🎯 Using specified environment: $Environment" -ForegroundColor Green
}

Write-Host ""

# Check for port conflicts first
Write-Host "🔍 Checking for port conflicts..." -ForegroundColor Cyan
& ".\check-port-conflicts.ps1"

Write-Host ""
Write-Host "⚙️  Configuring $Environment environment..." -ForegroundColor Cyan

# Backend Configuration
if ($Environment -eq "development") {
    # Use development configuration
    Write-Host "📁 Copying development backend configuration..." -ForegroundColor White
    Copy-Item "backend\.env.development" "backend\.env" -Force
    
    Write-Host "📁 Copying development frontend configuration..." -ForegroundColor White
    Copy-Item "frontend\.env.development" "frontend\.env.local" -Force
    
    Write-Host "🐳 Starting development Docker environment..." -ForegroundColor White
    docker-compose -f docker-compose.dev.yml up -d
    
    Write-Host ""
    Write-Host "✅ Development environment ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3001" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:8001/api" -ForegroundColor White
    Write-Host "   phpMyAdmin: http://localhost:8082" -ForegroundColor White
    Write-Host "   Mailhog: http://localhost:8026" -ForegroundColor White
    
} elseif ($Environment -eq "production") {
    # Use production configuration
    Write-Host "📁 Copying production backend configuration..." -ForegroundColor White
    Copy-Item "backend\.env.production" "backend\.env" -Force
    
    Write-Host "📁 Copying production frontend configuration..." -ForegroundColor White
    Copy-Item "frontend\.env.production" "frontend\.env.local" -Force
    
    Write-Host "🏭 Building production assets..." -ForegroundColor White
    Set-Location frontend
    npm run build
    npm run export
    Set-Location ..
    
    Write-Host ""
    Write-Host "✅ Production environment configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps for production deployment:" -ForegroundColor Cyan
    Write-Host "   1. Upload backend/ to /app/ on mysol360.com" -ForegroundColor White
    Write-Host "   2. Upload frontend/out/ to /public_html/ on mysol360.com" -ForegroundColor White
    Write-Host "   3. Copy api_handler.php to /public_html/" -ForegroundColor White
    Write-Host "   4. Copy main_domain_.htaccess to /public_html/.htaccess" -ForegroundColor White
    Write-Host "   5. Configure database using MAIN_DOMAIN_DEPLOYMENT_GUIDE.md" -ForegroundColor White
}

Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   Main Guide: COMPREHENSIVE_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "   Production: MAIN_DOMAIN_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "   Conflicts: This script handles all conflicts automatically!" -ForegroundColor White

Write-Host ""
Write-Host "🎉 Environment setup complete!" -ForegroundColor Green