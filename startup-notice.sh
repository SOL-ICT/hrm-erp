#!/bin/bash

echo "
╔══════════════════════════════════════════════════════════╗
║                    🚀 HRM-ERP STARTUP                    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  📊 PERFORMANCE STATUS                                   ║
║  ────────────────────────                               ║
║  Current: Docker Development Mode                       ║
║  Expected Load Time: 2-5 seconds                        ║
║                                                          ║
║  🎯 OPTIMIZATION AVAILABLE                               ║
║  ────────────────────────────                           ║
║  Use: docker-compose -f docker-compose.yml \\           ║
║          -f docker-compose.dev.yml up                   ║
║                                                          ║
║  📖 Full Guide: PERFORMANCE_README.md                   ║
║                                                          ║
║  ☁️  AWS Production: 70% faster (when ready)            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
"

# Check if dev compose file exists
if [ -f "docker-compose.dev.yml" ]; then
    echo "✅ Optimized docker-compose.dev.yml found"
else
    echo "⚠️  docker-compose.dev.yml not found - using standard setup"
fi

echo ""
echo "🔗 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   phpMyAdmin: http://localhost:8080"
echo ""
