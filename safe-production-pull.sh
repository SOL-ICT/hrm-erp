#!/bin/bash

##############################################################
# SAFE PRODUCTION PULL SCRIPT
# This script pulls code changes without overwriting
# production-specific configuration files
##############################################################

echo "🔒 SAFE PRODUCTION PULL - Protecting Server Configs"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# List of production files to protect (never pull/overwrite)
PROTECTED_FILES=(
    "docker-compose.yml"
    "docker-compose.prod.yml"
    "docker-compose.dev.yml"
    "backend/Dockerfile"
    "backend/Dockerfile.production"
    "frontend/Dockerfile"
    "frontend/Dockerfile.prod-fixed"
    "nginx-proxy.conf"
    "nginx.conf"
    ".env"
    "backend/.env"
    "frontend/.env.local"
)

echo ""
echo -e "${YELLOW}Step 1: Backing up production configs...${NC}"

# Create backup directory with timestamp
BACKUP_DIR="config_backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

for file in "${PROTECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ Backing up: $file"
        # Create directory structure in backup
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        cp "$file" "$BACKUP_DIR/$file"
    fi
done

echo ""
echo -e "${YELLOW}Step 2: Marking files as assume-unchanged (git will ignore them)...${NC}"

for file in "${PROTECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        git update-index --assume-unchanged "$file" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "  🔒 Protected: $file"
        fi
    fi
done

echo ""
echo -e "${YELLOW}Step 3: Stashing any uncommitted changes...${NC}"
git stash push -m "Pre-pull stash $(date +%Y%m%d_%H%M%S)"

echo ""
echo -e "${YELLOW}Step 4: Pulling latest code from GitHub...${NC}"
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Pull failed! Restoring from stash...${NC}"
    git stash pop
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 5: Restoring production configs from backup...${NC}"

for file in "${PROTECTED_FILES[@]}"; do
    if [ -f "$BACKUP_DIR/$file" ]; then
        echo "  ♻️  Restoring: $file"
        cp "$BACKUP_DIR/$file" "$file"
    fi
done

echo ""
echo -e "${GREEN}✅ SAFE PULL COMPLETE!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run migrations: docker exec hrm-laravel-api php artisan migrate"
echo "2. Run seeder: docker exec hrm-laravel-api php artisan db:seed --class=UserManagementPermissionsSeeder"
echo "3. Clear cache: docker exec hrm-laravel-api php artisan cache:clear"
echo "4. Check application: Visit your app URL"
echo ""
echo -e "${YELLOW}To restore stashed changes (if any):${NC}"
echo "git stash list"
echo "git stash pop"
echo ""
echo -e "${YELLOW}Backup location:${NC} $BACKUP_DIR"
echo ""
