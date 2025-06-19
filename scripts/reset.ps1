Write-Host "Resetting HRM ERP System..." -ForegroundColor Red
Write-Host "WARNING: This will remove all data!" -ForegroundColor Yellow

$confirm = Read-Host "Are you sure? Type 'yes' to continue"
if ($confirm -eq "yes") {
    Write-Host "Stopping containers..." -ForegroundColor Cyan
    docker-compose down -v
    
    Write-Host "Removing volumes..." -ForegroundColor Cyan
    docker volume prune -f
    
    Write-Host "Removing images..." -ForegroundColor Cyan
    docker-compose build --no-cache
    
    Write-Host "System reset complete!" -ForegroundColor Green
} else {
    Write-Host "Reset cancelled" -ForegroundColor Yellow
}
