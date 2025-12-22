#!/bin/bash
# Zammad Investigation Script - Run on your server via MobaXterm

echo "=========================================="
echo "ZAMMAD DIAGNOSTICS - Comprehensive Check"
echo "=========================================="
echo ""

# 1. Find Zammad installation directory
echo "1. LOCATING ZAMMAD INSTALLATION..."
ZAMMAD_DIR=$(find /root /opt /home -name "docker-compose.yml" -path "*/zammad/*" -exec dirname {} \; 2>/dev/null | head -1)
if [ -z "$ZAMMAD_DIR" ]; then
    echo "   ❌ Could not find Zammad directory"
    echo "   Searching all docker-compose files:"
    find / -name "docker-compose.yml" 2>/dev/null
else
    echo "   ✅ Found: $ZAMMAD_DIR"
    cd "$ZAMMAD_DIR"
fi
echo ""

# 2. Check Docker Compose Configuration
echo "2. DOCKER COMPOSE CONFIGURATION..."
if [ -f "docker-compose.yml" ]; then
    echo "   ✅ docker-compose.yml exists"
    echo ""
    echo "   Port Mappings:"
    grep -A 2 "ports:" docker-compose.yml | grep -E "^\s+- " | head -5
    echo ""
    echo "   Environment Files:"
    grep "env_file:" docker-compose.yml
    echo ""
    echo "   Network Configuration:"
    grep -A 3 "networks:" docker-compose.yml | head -10
else
    echo "   ❌ docker-compose.yml not found"
fi
echo ""

# 3. Check Environment Variables
echo "3. ENVIRONMENT FILES & VARIABLES..."
for env_file in .env .env.prod .env.production zammad.env; do
    if [ -f "$env_file" ]; then
        echo "   ✅ Found: $env_file"
        echo "   Contents (passwords masked):"
        cat "$env_file" | grep -v "^#" | grep -v "^$" | sed 's/\(PASSWORD\|SECRET\|KEY\)=.*/\1=***MASKED***/'
        echo ""
    fi
done
echo ""

# 4. Check Zammad Container Status
echo "4. ZAMMAD CONTAINER STATUS..."
docker ps --filter "name=zammad" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 5. Check if Zammad nginx responds
echo "5. TESTING ZAMMAD NGINX (Port 8888)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "   ✅ Zammad responds: HTTP $HTTP_CODE"
    echo "   Response headers:"
    curl -I http://localhost:8888 2>/dev/null | head -10
else
    echo "   ❌ Zammad not responding: HTTP $HTTP_CODE"
    echo "   Checking nginx container logs..."
    docker logs zammad-zammad-nginx-1 --tail 20 2>&1
fi
echo ""

# 6. Check Main Nginx Configuration
echo "6. MAIN NGINX CONFIGURATION..."
if [ -f "/etc/nginx/sites-enabled/tickets.mysol360.com" ]; then
    echo "   ✅ Config exists: /etc/nginx/sites-enabled/tickets.mysol360.com"
    echo "   Configuration:"
    cat /etc/nginx/sites-enabled/tickets.mysol360.com
elif [ -f "/etc/nginx/conf.d/tickets.mysol360.com.conf" ]; then
    echo "   ✅ Config exists: /etc/nginx/conf.d/tickets.mysol360.com.conf"
    echo "   Configuration:"
    cat /etc/nginx/conf.d/tickets.mysol360.com.conf
else
    echo "   ❌ No Nginx config found for tickets.mysol360.com"
    echo "   Available site configs:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null
    ls -la /etc/nginx/conf.d/*.conf 2>/dev/null
fi
echo ""

# 7. Check SSL Certificates
echo "7. SSL CERTIFICATE STATUS..."
if command -v certbot &> /dev/null; then
    certbot certificates 2>/dev/null | grep -A 10 "tickets.mysol360.com" || echo "   ℹ️  No SSL cert for tickets.mysol360.com"
else
    echo "   ℹ️  Certbot not installed"
fi
echo ""

# 8. Check Network Ports
echo "8. NETWORK PORT STATUS..."
echo "   Port 8888 (Zammad nginx):"
ss -tulpn | grep :8888 || netstat -tulpn | grep :8888 || echo "   ❌ Port 8888 not listening"
echo ""
echo "   Port 80 (HTTP):"
ss -tulpn | grep :80 || netstat -tulpn | grep :80 || echo "   ❌ Port 80 not listening"
echo ""
echo "   Port 443 (HTTPS):"
ss -tulpn | grep :443 || netstat -tulpn | grep :443 || echo "   ℹ️  Port 443 not in use"
echo ""

# 9. Check Recent Nginx Error Logs
echo "9. RECENT NGINX ERRORS..."
if [ -f "/var/log/nginx/error.log" ]; then
    echo "   Last 10 errors:"
    tail -10 /var/log/nginx/error.log
    echo ""
    echo "   Errors related to tickets.mysol360.com:"
    grep "tickets.mysol360.com" /var/log/nginx/error.log | tail -5
else
    echo "   ❌ Nginx error log not found"
fi
echo ""

# 10. Check Zammad Application Logs
echo "10. ZAMMAD APPLICATION LOGS..."
echo "    Nginx container:"
docker logs zammad-zammad-nginx-1 --tail 15 2>&1
echo ""
echo "    Rails server:"
docker logs zammad-zammad-railsserver-1 --tail 15 2>&1
echo ""

# 11. DNS Resolution Check
echo "11. DNS RESOLUTION..."
echo "    Resolving tickets.mysol360.com:"
nslookup tickets.mysol360.com 2>/dev/null || host tickets.mysol360.com 2>/dev/null || echo "   ℹ️  DNS tools not available"
echo ""

# 12. Summary
echo "=========================================="
echo "INVESTIGATION COMPLETE"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Review the output above"
echo "2. Check if Zammad responds on port 8888"
echo "3. Verify Nginx reverse proxy configuration"
echo "4. Check SSL certificate if using HTTPS"
echo "5. Review container logs for errors"
echo ""
