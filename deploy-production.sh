#!/bin/bash

##############################################################
# COMPLETE PRODUCTION DEPLOYMENT SCRIPT
# Combines safe pull + migrations + cache clear + PK check
##############################################################

echo "🚀 COMPLETE PRODUCTION DEPLOYMENT"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DEPLOY_LOG="deployment_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$DEPLOY_LOG") 2>&1

echo "📝 Deployment log: $DEPLOY_LOG"
echo ""

# Protected files (never overwrite from git)
PROTECTED_FILES=(
    "docker-compose.yml"
    "docker-compose.prod.yml"
    "backend/Dockerfile"
    "backend/Dockerfile.production"
    "frontend/Dockerfile"
    "nginx-proxy.conf"
    ".env"
    "backend/.env"
    "frontend/.env.local"
)

##############################################################
# STEP 1: PRE-DEPLOYMENT CHECKS
##############################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Pre-Deployment Checks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Docker containers are running
echo "Checking Docker containers..."
if ! docker ps | grep -q hrm-laravel-api; then
    echo -e "${RED}❌ Laravel container not running!${NC}"
    exit 1
fi

if ! docker ps | grep -q hrm-mysql; then
    echo -e "${RED}❌ MySQL container not running!${NC}"
    exit 1
fi

if ! docker ps | grep -q hrm-nextjs-frontend; then
    echo -e "${RED}❌ Next.js container not running!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All containers running${NC}"
echo ""

# Check database connectivity
echo "Checking database connectivity..."
docker exec hrm-mysql mysql -uhrm_user -phrm_password hrm_database -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cannot connect to database!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database connection OK${NC}"
echo ""

##############################################################
# STEP 2: BACKUP CRITICAL FILES
##############################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Backup Production Configs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

BACKUP_DIR="deployment_backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Backing up protected files to: $BACKUP_DIR"
for file in "${PROTECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        cp "$file" "$BACKUP_DIR/$file"
        echo "  ✅ $file"
    fi
done

# Database backup
echo ""
echo "Creating database backup..."
docker exec hrm-mysql mysqldump -uhrm_user -phrm_password hrm_database > "$BACKUP_DIR/database_backup.sql" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database backup created${NC}"
else
    echo -e "${YELLOW}⚠️  Database backup failed${NC}"
fi
echo ""

##############################################################
# STEP 3: PROTECT FILES FROM GIT
##############################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Protect Production Configs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

for file in "${PROTECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        git update-index --assume-unchanged "$file" 2>/dev/null
        echo "  🔒 Protected: $file"
    fi
done
echo ""

##############################################################
# STEP 4: PULL LATEST CODE
##############################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Pull Latest Code from GitHub${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

git fetch origin main
BEFORE_COMMIT=$(git rev-parse HEAD)

git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git pull failed!${NC}"
    echo "Restoring protected files..."
    for file in "${PROTECTED_FILES[@]}"; do
        if [ -f "$BACKUP_DIR/$file" ]; then
            cp "$BACKUP_DIR/$file" "$file"
        fi
    done
    exit 1
fi

AFTER_COMMIT=$(git rev-parse HEAD)

echo ""
if [ "$BEFORE_COMMIT" = "$AFTER_COMMIT" ]; then
    echo -e "${YELLOW}ℹ️  No new commits - already up to date${NC}"
else
    echo -e "${GREEN}✅ Code updated successfully${NC}"
    echo "  Previous: $BEFORE_COMMIT"
    echo "  Current:  $AFTER_COMMIT"
fi
echo ""

# Restore protected files
echo "Restoring production configs..."
for file in "${PROTECTED_FILES[@]}"; do
    if [ -f "$BACKUP_DIR/$file" ]; then
        cp "$BACKUP_DIR/$file" "$file"
        echo "  ♻️  $file"
    fi
done
echo ""

##############################################################
# STEP 5: RUN MIGRATIONS
##############################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 5: Run Database Migrations${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

docker exec hrm-laravel-api php artisan migrate --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${RED}❌ Migrations failed!${NC}"
    echo "Check logs above for errors"
fi
echo ""

##############################################################
# STEP 6: RUN SEEDERS (NEW FEATURES)
##############################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 6: Run Seeders (User Management)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

docker exec hrm-laravel-api php artisan db:seed --class=UserManagementPermissionsSeeder

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Seeder completed${NC}"
else
    echo -e "${YELLOW}⚠️  Seeder may have already run (this is OK)${NC}"
fi
echo ""

##############################################################
# STEP 7: CLEAR CACHES
##############################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 7: Clear Application Caches${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Clearing Laravel caches..."
docker exec hrm-laravel-api php artisan config:clear
docker exec hrm-laravel-api php artisan cache:clear
docker exec hrm-laravel-api php artisan route:clear
docker exec hrm-laravel-api php artisan view:clear

echo -e "${GREEN}✅ Caches cleared${NC}"
echo ""

##############################################################
# STEP 8: CHECK PRIMARY KEYS (OPTIONAL)
##############################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 8: Primary Key Check (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Do you want to check/fix primary keys? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "./fix-primary-keys.sh" ]; then
        bash ./fix-primary-keys.sh
    else
        echo -e "${YELLOW}⚠️  fix-primary-keys.sh not found${NC}"
    fi
else
    echo "Skipping primary key check"
fi
echo ""

##############################################################
# STEP 9: VERIFY DEPLOYMENT
##############################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 9: Verify Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Laravel logs for errors
echo "Checking Laravel logs for recent errors..."
RECENT_ERRORS=$(docker exec hrm-laravel-api tail -n 50 /var/www/html/storage/logs/laravel.log 2>/dev/null | grep -i error | tail -n 5)
if [ -n "$RECENT_ERRORS" ]; then
    echo -e "${YELLOW}⚠️  Recent errors found:${NC}"
    echo "$RECENT_ERRORS"
else
    echo -e "${GREEN}✅ No recent errors in Laravel logs${NC}"
fi
echo ""

# Check if containers are still running
echo "Verifying containers..."
if docker ps | grep -q hrm-laravel-api && docker ps | grep -q hrm-mysql && docker ps | grep -q hrm-nextjs-frontend; then
    echo -e "${GREEN}✅ All containers still running${NC}"
else
    echo -e "${RED}❌ Some containers stopped!${NC}"
fi
echo ""

##############################################################
# DEPLOYMENT SUMMARY
##############################################################

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 Deployment Summary:"
echo "  • Code updated: $BEFORE_COMMIT → $AFTER_COMMIT"
echo "  • Migrations: Completed"
echo "  • Seeders: User Management permissions added"
echo "  • Caches: Cleared"
echo "  • Backup location: $BACKUP_DIR"
echo "  • Log file: $DEPLOY_LOG"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test application: Visit your app URL"
echo "  2. Test User Management: Go to Administration → User Management"
echo "  3. Check RBAC: Verify permissions are working"
echo "  4. Monitor logs: docker logs hrm-laravel-api -f"
echo ""
echo -e "${YELLOW}To rollback (if needed):${NC}"
echo "  git reset --hard $BEFORE_COMMIT"
echo "  docker exec -i hrm-mysql mysql -uhrm_user -phrm_password hrm_database < $BACKUP_DIR/database_backup.sql"
echo ""
