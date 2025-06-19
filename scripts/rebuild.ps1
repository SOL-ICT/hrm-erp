Write-Host "Rebuilding HRM ERP Services..." -ForegroundColor Yellow
Write-Host "Stopping existing containers..." -ForegroundColor Cyan
docker-compose down

Write-Host "Removing old images..." -ForegroundColor Cyan
docker-compose build --no-cache

Write-Host "Starting fresh containers..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "Services rebuilt and restarted!" -ForegroundColor Green
