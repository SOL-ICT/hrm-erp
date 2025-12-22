#!/bin/bash

##############################################################
# AUTO_INCREMENT DETECTOR AND FIXER
# Adds AUTO_INCREMENT to id columns that are missing it
##############################################################

echo "🔍 AUTO_INCREMENT DETECTION & FIX TOOL"
echo "========================================"

# Database credentials (update these for production)
DB_HOST="localhost"
DB_USER="mysol360_hrm_user"
DB_PASS="Tealharmony@123"
DB_NAME="mysol360_hrm_db"

# If using Docker, use this command prefix
DOCKER_MYSQL="docker exec hrm-mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}Step 1: Scanning all tables for AUTO_INCREMENT on id columns...${NC}"
echo ""

# Get list of all tables
TABLES=$($DOCKER_MYSQL -e "SHOW TABLES;" -N 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to connect to database!${NC}"
    echo "Make sure Docker container 'hrm-mysql' is running"
    exit 1
fi

TABLES_NEED_AUTO_INC=()
TABLES_HAVE_AUTO_INC=()
TABLES_NO_ID=()

while IFS= read -r table; do
    # Check if table has 'id' column
    HAS_ID=$($DOCKER_MYSQL -e "SHOW COLUMNS FROM \`$table\` LIKE 'id';" -N 2>/dev/null | wc -l)
    
    if [ "$HAS_ID" -eq 0 ]; then
        TABLES_NO_ID+=("$table")
        echo -e "${YELLOW}⚠️  NO 'id' column: $table${NC}"
    else
        # Check if id has AUTO_INCREMENT
        IS_AUTO_INC=$($DOCKER_MYSQL -e "SHOW COLUMNS FROM \`$table\` WHERE Field='id' AND Extra LIKE '%auto_increment%';" -N 2>/dev/null | wc -l)
        
        if [ "$IS_AUTO_INC" -eq 0 ]; then
            TABLES_NEED_AUTO_INC+=("$table")
            echo -e "${RED}❌ MISSING AUTO_INCREMENT: $table${NC}"
        else
            TABLES_HAVE_AUTO_INC+=("$table")
            echo -e "${GREEN}✅ Has AUTO_INCREMENT: $table${NC}"
        fi
    fi
done <<< "$TABLES"

echo ""
echo "========================================"
echo -e "${BLUE}SUMMARY:${NC}"
echo -e "${GREEN}Tables with AUTO_INCREMENT: ${#TABLES_HAVE_AUTO_INC[@]}${NC}"
echo -e "${RED}Tables MISSING AUTO_INCREMENT: ${#TABLES_NEED_AUTO_INC[@]}${NC}"
echo -e "${YELLOW}Tables without 'id' column: ${#TABLES_NO_ID[@]}${NC}"
echo ""

if [ ${#TABLES_NEED_AUTO_INC[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All tables with 'id' column have AUTO_INCREMENT! No action needed.${NC}"
    exit 0
fi

echo -e "${YELLOW}Tables that need AUTO_INCREMENT:${NC}"
for table in "${TABLES_NEED_AUTO_INC[@]}"; do
    echo "  - $table"
done
echo ""

# Create backup
BACKUP_FILE="db_backup_before_autoincrement_fix_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${YELLOW}Step 2: Creating database backup...${NC}"
docker exec hrm-mysql mysqldump -u${DB_USER} -p${DB_PASS} ${DB_NAME} > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${RED}⚠️  Backup failed, but continuing...${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Adding AUTO_INCREMENT to tables...${NC}"
echo ""

for table in "${TABLES_NEED_AUTO_INC[@]}"; do
    echo -e "${BLUE}Processing table: $table${NC}"
    
    # Get id column details
    ID_INFO=$($DOCKER_MYSQL -e "SHOW COLUMNS FROM \`$table\` WHERE Field='id';" 2>/dev/null)
    
    # Check if id is primary key
    IS_PK=$($DOCKER_MYSQL -e "SHOW KEYS FROM \`$table\` WHERE Key_name = 'PRIMARY' AND Column_name = 'id';" -N 2>/dev/null | wc -l)
    
    if [ "$IS_PK" -gt 0 ]; then
        echo "  → 'id' is PRIMARY KEY - adding AUTO_INCREMENT"
        $DOCKER_MYSQL -e "ALTER TABLE \`$table\` MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✅ AUTO_INCREMENT added successfully!${NC}"
        else
            echo -e "  ${RED}❌ Failed to add AUTO_INCREMENT${NC}"
            # Try alternative approach with PRIMARY KEY specified
            echo "  → Trying alternative approach..."
            $DOCKER_MYSQL -e "ALTER TABLE \`$table\` MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY;" 2>/dev/null
            
            if [ $? -eq 0 ]; then
                echo -e "  ${GREEN}✅ AUTO_INCREMENT added successfully (alternative method)!${NC}"
            else
                echo -e "  ${RED}❌ Failed - manual intervention needed${NC}"
            fi
        fi
    else
        echo "  → 'id' is NOT PRIMARY KEY - adding both PK and AUTO_INCREMENT"
        $DOCKER_MYSQL -e "ALTER TABLE \`$table\` MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (id);" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✅ PRIMARY KEY and AUTO_INCREMENT added successfully!${NC}"
        else
            echo -e "  ${RED}❌ Failed to add PRIMARY KEY and AUTO_INCREMENT${NC}"
        fi
    fi
    
    echo ""
done

echo ""
echo -e "${GREEN}🎉 AUTO_INCREMENT FIX COMPLETE!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify tables: Run this script again to confirm all tables now have AUTO_INCREMENT"
echo "2. Test application functionality (especially user/record creation)"
echo "3. Keep backup file: $BACKUP_FILE"
echo ""
echo -e "${YELLOW}To restore from backup (if needed):${NC}"
echo "docker exec -i hrm-mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} < $BACKUP_FILE"
echo ""
