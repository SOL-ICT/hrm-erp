# HRM-ERP Port Conflict Detection Script
# Run this before starting Docker to detect conflicts

Write-Host "🔍 Checking for port conflicts on mysol360.com server..." -ForegroundColor Cyan
Write-Host ""

# Function to check if a port is in use
function Test-PortInUse {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Critical ports to check
$portsToCheck = @{
    80 = "HTTP (Apache)"
    443 = "HTTPS (Apache)"
    3306 = "MySQL"
    6379 = "Redis"
    8000 = "Laravel Development"
    3000 = "Next.js Development"
    8080 = "Alternative HTTP"
    8025 = "Mailhog Web UI"
    1025 = "Mailhog SMTP"
}

$conflicts = @()

Write-Host "Port Conflict Analysis:" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow
Write-Host ""

foreach ($port in $portsToCheck.Keys) {
    $service = $portsToCheck[$port]
    $inUse = Test-PortInUse -Port $port
    
    if ($inUse) {
        Write-Host "❌ Port $port ($service): IN USE - CONFLICT DETECTED" -ForegroundColor Red
        $conflicts += $port
    } else {
        Write-Host "✅ Port $port ($service): Available" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "========" -ForegroundColor Cyan

if ($conflicts.Count -eq 0) {
    Write-Host "🎉 No port conflicts detected! Safe to start Docker." -ForegroundColor Green
} else {
    Write-Host "⚠️  PORT CONFLICTS DETECTED on ports: $($conflicts -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Recommended Solutions:" -ForegroundColor Yellow
    Write-Host "1. Use docker-compose.dev.yml instead of docker-compose.yml" -ForegroundColor White
    Write-Host "2. Stop conflicting services temporarily" -ForegroundColor White
    Write-Host "3. Use alternative ports (already configured in docker-compose.yml)" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands to use:" -ForegroundColor Cyan
    Write-Host "  Development: docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor White
    Write-Host "  Production:  docker-compose up -d  (uses alternative ports)" -ForegroundColor White
}

Write-Host ""
Write-Host "🔧 Current Docker Configuration:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Docker Nginx:     8080 (HTTP), 8443 (HTTPS)" -ForegroundColor White
Write-Host "Docker MySQL:     3307" -ForegroundColor White
Write-Host "Docker Redis:     6379" -ForegroundColor White  
Write-Host "Laravel API:      8000" -ForegroundColor White
Write-Host "Next.js Frontend: 3000" -ForegroundColor White
Write-Host "phpMyAdmin:       8081" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Production mysol360.com:" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "Apache HTTP:      80" -ForegroundColor White
Write-Host "Apache HTTPS:     443" -ForegroundColor White
Write-Host "MySQL:            3306" -ForegroundColor White
Write-Host "API Handler:      mysol360.com/api/ -> /app/" -ForegroundColor White

# Additional system information
Write-Host ""
Write-Host "🖥️  System Information:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Check if Apache is running (Windows)
try {
    $apacheService = Get-Service -Name "Apache*" -ErrorAction SilentlyContinue
    if ($apacheService) {
        Write-Host "Apache Service: $($apacheService.Status)" -ForegroundColor $(if ($apacheService.Status -eq "Running") {"Yellow"} else {"Green"})
    } else {
        Write-Host "Apache Service: Not found as Windows service" -ForegroundColor Green
    }
} catch {
    Write-Host "Apache Service: Unable to determine" -ForegroundColor Gray
}

# Check if MySQL is running
try {
    $mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
    if ($mysqlService) {
        Write-Host "MySQL Service: $($mysqlService.Status)" -ForegroundColor $(if ($mysqlService.Status -eq "Running") {"Yellow"} else {"Green"})
    } else {
        Write-Host "MySQL Service: Not found as Windows service" -ForegroundColor Green
    }
} catch {
    Write-Host "MySQL Service: Unable to determine" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ Ready to proceed with deployment!" -ForegroundColor Green