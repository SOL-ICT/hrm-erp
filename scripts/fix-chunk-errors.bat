@echo off
echo 🧹 Clearing Next.js and Docker caches to fix chunk errors...

REM Stop containers
docker-compose down

REM Remove Next.js cache
echo 📁 Clearing Next.js cache...
if exist "frontend\.next\cache" rmdir /s /q "frontend\.next\cache"
if exist "frontend\.next\static" rmdir /s /q "frontend\.next\static"
if exist "frontend\.next\server" rmdir /s /q "frontend\.next\server"

REM Clear Docker build cache
echo 🐳 Clearing Docker build cache...
docker builder prune -f

REM Clear Docker volumes (optional - preserves database)
echo 📦 Clearing anonymous volumes...
docker volume prune -f

REM Restart containers
echo 🚀 Restarting containers...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

echo ✅ Cache cleared! Your chunk errors should be resolved.
echo 🌐 Frontend will be available at: http://localhost:3000
pause
