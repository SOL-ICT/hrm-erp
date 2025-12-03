#!/bin/bash

##############################################################
# PRIMARY KEY DETECTOR AND AUTO-FIXER
# Detects tables without primary keys and adds them
##############################################################

echo "🔍 PRIMARY KEY DETECTION & AUTO-FIX TOOL"
echo "========================================"

# Database credentials (update these for production)
DB_HOST="localhost"
DB_USER="hrm_user"
DB_PASS="hrm_password"
DB_NAME="hrm_database"

# If using Docker, use this command prefix
DOCKER_MYSQL="docker exec hrm-mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}Step 1: Scanning all tables for primary keys...${NC}"
echo ""

# Get list of all tables
TABLES=$($DOCKER_MYSQL -e "SHOW TABLES;" -N 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to connect to database!${NC}"
    echo "Make sure Docker container 'hrm-mysql' is running"
    exit 1
fi

TABLES_WITHOUT_PK=()
TABLES_WITH_PK=()

while IFS= read -r table; do
    # Check if table has primary key
    PK_CHECK=$($DOCKER_MYSQL -e "SHOW KEYS FROM \`$table\` WHERE Key_name = 'PRIMARY';" -N 2>/dev/null | wc -l)
    
    if [ "$PK_CHECK" -eq 0 ]; then
        TABLES_WITHOUT_PK+=("$table")
        echo -e "${RED}❌ NO PRIMARY KEY: $table${NC}"
    else
        TABLES_WITH_PK+=("$table")
        echo -e "${GREEN}✅ Has PK: $table${NC}"
    fi
done <<< "$TABLES"

echo ""
echo "========================================"
echo -e "${BLUE}SUMMARY:${NC}"
echo -e "${GREEN}Tables with primary keys: ${#TABLES_WITH_PK[@]}${NC}"
echo -e "${RED}Tables WITHOUT primary keys: ${#TABLES_WITHOUT_PK[@]}${NC}"
echo ""

if [ ${#TABLES_WITHOUT_PK[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All tables have primary keys! No action needed.${NC}"
    exit 0
fi

echo -e "${YELLOW}Tables that need primary keys:${NC}"
for table in "${TABLES_WITHOUT_PK[@]}"; do
    echo "  - $table"
done
echo ""

# Create backup
BACKUP_FILE="db_backup_before_pk_fix_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${YELLOW}Step 2: Creating database backup...${NC}"
docker exec hrm-mysql mysqldump -u${DB_USER} -p${DB_PASS} ${DB_NAME} > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${RED}⚠️  Backup failed, but continuing...${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Analyzing tables and adding primary keys...${NC}"
echo ""

for table in "${TABLES_WITHOUT_PK[@]}"; do
    echo -e "${BLUE}Analyzing table: $table${NC}"
    
    # Get table structure
    STRUCTURE=$($DOCKER_MYSQL -e "DESCRIBE \`$table\`;" 2>/dev/null)
    
    # Check if table has 'id' column
    HAS_ID=$($DOCKER_MYSQL -e "SHOW COLUMNS FROM \`$table\` LIKE 'id';" -N 2>/dev/null | wc -l)
    
    if [ "$HAS_ID" -gt 0 ]; then
        echo "  → Table has 'id' column"
        
        # Check if id is already auto_increment
        IS_AUTO_INC=$($DOCKER_MYSQL -e "SHOW COLUMNS FROM \`$table\` WHERE Field='id' AND Extra LIKE '%auto_increment%';" -N 2>/dev/null | wc -l)
        
        if [ "$IS_AUTO_INC" -eq 0 ]; then
            echo "  → Adding AUTO_INCREMENT to 'id' column"
            $DOCKER_MYSQL -e "ALTER TABLE \`$table\` MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;" 2>/dev/null
        fi
        
        echo "  → Adding PRIMARY KEY to 'id' column"
        $DOCKER_MYSQL -e "ALTER TABLE \`$table\` ADD PRIMARY KEY (id);" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✅ PRIMARY KEY added successfully!${NC}"
        else
            echo -e "  ${RED}❌ Failed to add PRIMARY KEY (may already exist or have conflicts)${NC}"
        fi
        
    else
        echo "  → Table does NOT have 'id' column"
        echo "  → Creating new 'id' column with AUTO_INCREMENT"
        
        $DOCKER_MYSQL -e "ALTER TABLE \`$table\` ADD COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT FIRST, ADD PRIMARY KEY (id);" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✅ New 'id' column with PRIMARY KEY added!${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Could not auto-add 'id' column - manual review needed${NC}"
            echo "  → This table may have a composite key or special structure"
        fi
    fi
    
    echo ""
done

echo ""
echo -e "${GREEN}🎉 PRIMARY KEY FIX COMPLETE!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify tables: Run this script again to confirm all tables now have PKs"
echo "2. Test application functionality"
echo "3. Keep backup file: $BACKUP_FILE"
echo ""
echo -e "${YELLOW}To restore from backup (if needed):${NC}"
echo "docker exec -i hrm-mysql mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME} < $BACKUP_FILE"
echo ""
