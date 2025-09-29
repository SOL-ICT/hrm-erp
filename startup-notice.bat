@echo off
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                    🚀 HRM-ERP STARTUP                    ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║                                                          ║
echo ║  📊 PERFORMANCE STATUS                                   ║
echo ║  ────────────────────────                               ║
echo ║  Current: Docker Development Mode                       ║
echo ║  Expected Load Time: 2-5 seconds                        ║
echo ║                                                          ║
echo ║  🎯 OPTIMIZATION AVAILABLE                               ║
echo ║  ────────────────────────────                           ║
echo ║  Use: docker-compose -f docker-compose.yml              ║
echo ║          -f docker-compose.dev.yml up                   ║
echo ║                                                          ║
echo ║  📖 Full Guide: PERFORMANCE_README.md                   ║
echo ║                                                          ║
echo ║  ☁️  AWS Production: 70%% faster (when ready)            ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

if exist "docker-compose.dev.yml" (
    echo ✅ Optimized docker-compose.dev.yml found
) else (
    echo ⚠️  docker-compose.dev.yml not found - using standard setup
)

echo.
echo 🔗 Application URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo    phpMyAdmin: http://localhost:8080
echo.
