Write-Host "Starting HRM ERP Services..." -ForegroundColor Green
Write-Host "Building and starting containers..." -ForegroundColor Cyan

docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "   Frontend (Next.js):  http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend API:         http://localhost:8000/api" -ForegroundColor White  
    Write-Host "   phpMyAdmin:          http://localhost:8080" -ForegroundColor White
    Write-Host "   Mailhog:             http://localhost:8025" -ForegroundColor White
    Write-Host "   Full App (Nginx):    http://localhost" -ForegroundColor White
    Write-Host ""
    Write-Host "Check status:" -ForegroundColor Cyan
    Write-Host "   docker-compose ps" -ForegroundColor Gray
} else {
    Write-Host "Failed to start services" -ForegroundColor Red
    Write-Host "Run 'docker-compose logs' to see errors" -ForegroundColor Yellow
}
