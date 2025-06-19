param([string]$Service = "")

if ($Service) {
    Write-Host "Viewing logs for service: $Service" -ForegroundColor Cyan
    docker-compose logs -f $Service
} else {
    Write-Host "Viewing all service logs..." -ForegroundColor Cyan
    docker-compose logs -f
}
