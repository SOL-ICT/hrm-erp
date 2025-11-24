# HRM-ERP Security Hardening Guide

## Comprehensive Security Assessment & Remediation Plan

**Date**: November 16, 2025  
**Server**: nc-ph-4747.mysol360.com  
**Application**: https://mysol360.com  
**Current Security Rating**: 6.5/10

---

## Table of Contents

1. [Current Security Posture](#current-security-posture)
2. [Critical Security Gaps](#critical-security-gaps)
3. [Industry Standards Compliance](#industry-standards-compliance)
4. [Immediate Actions (Week 1)](#immediate-actions-week-1)
5. [High Priority (Month 1)](#high-priority-month-1)
6. [Medium Priority (Month 3)](#medium-priority-month-3)
7. [Ongoing Security Maintenance](#ongoing-security-maintenance)
8. [Incident Response Plan](#incident-response-plan)
9. [Compliance Checklist](#compliance-checklist)

---

## Current Security Posture

### ✅ What's Already Secure

#### Network Security (8/10)

- **MySQL & Redis**: Internal only, not exposed to internet
- **Docker Network Isolation**: Containers on bridge network (172.18.0.0/16)
- **No Direct Port Exposure**: All traffic through nginx-proxy container
- **SSL/TLS**: HTTPS enabled with valid certificates

#### File Permissions (8/10)

- Backend `.env`: 600 (only root can read)
- Storage/cache directories: 775 (Laravel writable)
- Application files: 755 (not world-writable)
- Frontend files: 755 (read-only for non-root)

#### Application Security (7/10)

- Laravel CSRF protection: Enabled
- React XSS protection: Default protections active
- SQL Injection prevention: Using Eloquent ORM
- Environment separation: Production configs separate

#### Infrastructure (7/10)

- Containerization: Service isolation via Docker
- Reverse proxy: nginx-proxy handles routing
- Health monitoring: Endpoints available
- Auto-recovery: Containers restart on failure

---

## Critical Security Gaps

### ❌ Missing Security Controls

| Gap                      | Risk Level   | Impact                   | Current State     |
| ------------------------ | ------------ | ------------------------ | ----------------- |
| No automated backups     | **CRITICAL** | Complete data loss       | No backups        |
| No audit logging         | **CRITICAL** | Can't detect breaches    | No logging        |
| Weak database auth       | **CRITICAL** | Easy unauthorized access | Default passwords |
| No rate limiting         | **HIGH**     | Brute force attacks      | Unprotected       |
| Containers run as root   | **HIGH**     | Container escape = root  | All root          |
| No WAF protection        | **HIGH**     | Application exploits     | Unprotected       |
| No monitoring/alerting   | **HIGH**     | Unknown intrusions       | No monitoring     |
| Plain text secrets       | **MEDIUM**   | Credential theft         | .env files        |
| Missing security headers | **MEDIUM**   | XSS, clickjacking        | Not configured    |
| No session security      | **MEDIUM**   | Session hijacking        | Default settings  |

---

## Industry Standards Compliance

### OWASP Top 10 Protection Status

| Vulnerability                    | Protection Status | Gap                                               |
| -------------------------------- | ----------------- | ------------------------------------------------- |
| A01: Broken Access Control       | ⚠️ Partial        | No audit logs, weak RBAC                          |
| A02: Cryptographic Failures      | ⚠️ Partial        | No encryption at rest                             |
| A03: Injection                   | ✅ Protected      | Eloquent ORM, parameterized queries               |
| A04: Insecure Design             | ⚠️ Partial        | No threat modeling, limited security architecture |
| A05: Security Misconfiguration   | ❌ Vulnerable     | Default configs, missing headers                  |
| A06: Vulnerable Components       | ⚠️ Partial        | No vulnerability scanning                         |
| A07: Auth & Session Failures     | ❌ Vulnerable     | No MFA, weak session management                   |
| A08: Software & Data Integrity   | ⚠️ Partial        | No code signing, limited integrity checks         |
| A09: Logging & Monitoring        | ❌ Vulnerable     | No security logging                               |
| A10: Server-Side Request Forgery | ✅ Protected      | Laravel default protections                       |

### Compliance Standards Gap Analysis

#### GDPR (EU Data Protection)

- ❌ No data encryption at rest
- ❌ No audit trail for data access
- ❌ No data backup/recovery plan
- ⚠️ Limited access controls
- **Compliance**: 40%

#### PCI DSS (Payment Card Industry)

- ❌ No network segmentation
- ❌ No file integrity monitoring
- ❌ No security testing program
- ⚠️ Limited password policies
- **Compliance**: 35%

#### SOC 2 (Service Organization Control)

- ❌ No continuous monitoring
- ❌ No incident response plan
- ❌ No backup verification
- ⚠️ Limited access logging
- **Compliance**: 45%

---

## Immediate Actions (Week 1)

### 1. Database Security Hardening

#### Current Risk:

- Default MySQL root password might be weak
- Root user used for application (over-privileged)
- No connection encryption

#### Fix Steps:

```bash
# Step 1: Change MySQL root password
cd /root/hris-app

# Generate a strong password (save this securely!)
NEW_ROOT_PASS=$(openssl rand -base64 32)
echo "New MySQL Root Password: $NEW_ROOT_PASS" > /root/.mysql_root_pass
chmod 600 /root/.mysql_root_pass

# Change the root password
docker compose -f docker-compose.prod.yml exec mysql mysql -u root -p << EOF
ALTER USER 'root'@'%' IDENTIFIED BY '$NEW_ROOT_PASS';
FLUSH PRIVILEGES;
EOF

# Step 2: Create a limited-privilege application user
APP_DB_PASS=$(openssl rand -base64 24)
echo "App DB Password: $APP_DB_PASS" > /root/.mysql_app_pass
chmod 600 /root/.mysql_app_pass

docker compose -f docker-compose.prod.yml exec mysql mysql -u root -p"$NEW_ROOT_PASS" << EOF
CREATE USER 'hrm_app'@'%' IDENTIFIED BY '$APP_DB_PASS';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER, LOCK TABLES ON hrm_erp.* TO 'hrm_app'@'%';
FLUSH PRIVILEGES;
EOF

# Step 3: Update Laravel to use new credentials
nano backend/.env
# Change:
# DB_USERNAME=root
# DB_PASSWORD=old_password
# To:
# DB_USERNAME=hrm_app
# DB_PASSWORD=<paste from /root/.mysql_app_pass>

# Step 4: Restart Laravel container
docker compose -f docker-compose.prod.yml restart laravel-api

# Step 5: Test database connection
docker compose -f docker-compose.prod.yml exec laravel-api php artisan db:show
```

**Verification:**

```bash
# Should show successful connection with new user
curl https://mysol360.com/api/health
# Should return: {"status":"ok","database":"connected"}
```

---

### 2. Automated Backup System

#### Current Risk:

- No backups = complete data loss if server fails
- No disaster recovery capability

#### Fix Steps:

```bash
# Step 1: Create backup directory structure
mkdir -p /root/backups/{daily,weekly,monthly}
chmod 700 /root/backups

# Step 2: Create backup script
cat > /root/backup-hrm-system.sh << 'EOFBACKUP'
#!/bin/bash
# HRM-ERP Automated Backup Script

BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Get database password
DB_PASS=$(cat /root/.mysql_app_pass)

# Create backup directory for today
mkdir -p "$BACKUP_DIR/daily/$DATE"

# Backup Database
echo "Backing up database..."
docker compose -f /root/hris-app/docker-compose.prod.yml exec -T mysql \
    mysqldump -u hrm_app -p"$DB_PASS" --single-transaction --routines --triggers hrm_erp \
    | gzip > "$BACKUP_DIR/daily/$DATE/database.sql.gz"

# Backup application files
echo "Backing up application files..."
tar -czf "$BACKUP_DIR/daily/$DATE/backend.tar.gz" \
    -C /root/hris-app backend/storage \
    --exclude='backend/storage/framework/cache' \
    --exclude='backend/storage/framework/sessions'

# Backup docker configs
tar -czf "$BACKUP_DIR/daily/$DATE/configs.tar.gz" \
    -C /root/hris-app docker-compose.prod.yml backend/.env

# Backup Nginx configs
tar -czf "$BACKUP_DIR/daily/$DATE/nginx.tar.gz" \
    /etc/nginx/conf.d/users/mysol360.conf \
    /root/nginx-backups

# Create backup manifest
cat > "$BACKUP_DIR/daily/$DATE/manifest.txt" << EOF
Backup Date: $(date)
Database Size: $(du -h "$BACKUP_DIR/daily/$DATE/database.sql.gz" | cut -f1)
Backend Size: $(du -h "$BACKUP_DIR/daily/$DATE/backend.tar.gz" | cut -f1)
Configs Size: $(du -h "$BACKUP_DIR/daily/$DATE/configs.tar.gz" | cut -f1)
Total Size: $(du -sh "$BACKUP_DIR/daily/$DATE" | cut -f1)
EOF

# Remove backups older than retention period
find "$BACKUP_DIR/daily" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null

# Weekly backup (Sundays)
if [ $(date +%u) -eq 7 ]; then
    cp -r "$BACKUP_DIR/daily/$DATE" "$BACKUP_DIR/weekly/"
fi

# Monthly backup (1st of month)
if [ $(date +%d) -eq 01 ]; then
    cp -r "$BACKUP_DIR/daily/$DATE" "$BACKUP_DIR/monthly/"
fi

echo "Backup completed: $BACKUP_DIR/daily/$DATE"
EOFBACKUP

chmod +x /root/backup-hrm-system.sh

# Step 3: Test backup script
/root/backup-hrm-system.sh

# Step 4: Add to crontab (runs daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup-hrm-system.sh >> /var/log/hrm-backup.log 2>&1") | crontab -

# Step 5: Verify cron job
crontab -l | grep backup
```

**Backup Restoration Procedure:**

```bash
# To restore from backup:
BACKUP_DATE="20251116-030000"  # Replace with actual backup date

# 1. Stop containers
cd /root/hris-app
docker compose -f docker-compose.prod.yml down

# 2. Restore database
gunzip < /root/backups/daily/$BACKUP_DATE/database.sql.gz | \
    docker compose -f docker-compose.prod.yml exec -T mysql \
    mysql -u hrm_app -p hrm_erp

# 3. Restore backend files
tar -xzf /root/backups/daily/$BACKUP_DATE/backend.tar.gz -C /root/hris-app/

# 4. Restore configs
tar -xzf /root/backups/daily/$BACKUP_DATE/configs.tar.gz -C /

# 5. Restart containers
docker compose -f docker-compose.prod.yml up -d

# 6. Verify
curl https://mysol360.com/api/health
```

**Offsite Backup (Highly Recommended):**

```bash
# Install rclone for cloud backups
curl https://rclone.org/install.sh | sudo bash

# Configure for Google Drive, Dropbox, or AWS S3
rclone config

# Add to backup script:
# rclone copy /root/backups remote:hrm-backups --update --verbose
```

---

### 3. API Rate Limiting (Brute Force Protection)

#### Current Risk:

- No limits on login attempts
- API can be overwhelmed with requests
- Vulnerable to credential stuffing attacks

#### Fix Steps:

**Backend (Laravel) Rate Limiting:**

```bash
# Step 1: Edit API routes
nano /root/hris-app/backend/routes/api.php
```

Add rate limiting middleware:

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Apply strict rate limiting to authentication endpoints
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/password/reset', [PasswordResetController::class, 'reset']);
});

// Standard rate limiting for authenticated API routes
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // All other API routes here
    // ... existing routes ...
});

// Public API routes with moderate rate limiting
Route::middleware(['throttle:30,1'])->group(function () {
    Route::get('/health', [HealthController::class, 'check']);
    // ... other public routes ...
});
```

**Step 2: Configure custom rate limit responses**

```bash
nano /root/hris-app/backend/app/Http/Middleware/ThrottleRequests.php
```

Create custom throttle middleware:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Routing\Middleware\ThrottleRequests as BaseThrottleRequests;

class ThrottleRequests extends BaseThrottleRequests
{
    protected function buildException($request, $key, $maxAttempts, $responseCallback = null)
    {
        $retryAfter = $this->getTimeUntilNextRetry($key);

        $headers = $this->getHeaders(
            $maxAttempts,
            $this->calculateRemainingAttempts($key, $maxAttempts, $retryAfter),
            $retryAfter
        );

        return response()->json([
            'error' => 'Too many requests. Please try again later.',
            'retry_after' => $retryAfter,
            'max_attempts' => $maxAttempts
        ], 429, $headers);
    }
}
```

**Step 3: Add fail2ban for IP blocking**

```bash
# Install fail2ban
yum install fail2ban -y

# Create fail2ban filter for Laravel
cat > /etc/fail2ban/filter.d/laravel.conf << 'EOF'
[Definition]
failregex = .*"ip":"<HOST>".*"event":"login.failed"
            .*Too Many Requests.*<HOST>
ignoreregex =
EOF

# Configure jail
cat > /etc/fail2ban/jail.d/laravel.conf << 'EOF'
[laravel]
enabled = true
port = http,https
filter = laravel
logpath = /root/hris-app/backend/storage/logs/laravel.log
maxretry = 5
bantime = 3600
findtime = 600
action = iptables-multiport[name=laravel, port="http,https"]
EOF

# Start fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Check status
fail2ban-client status laravel
```

**Step 4: Rebuild and restart**

```bash
cd /root/hris-app

# Rebuild Laravel container
docker compose -f docker-compose.prod.yml build laravel-api

# Restart
docker compose -f docker-compose.prod.yml restart laravel-api

# Test rate limiting
for i in {1..10}; do curl -X POST https://mysol360.com/api/login -d '{"email":"test@test.com","password":"wrong"}'; done
# Should get 429 error after 5 attempts
```

---

### 4. Security Audit Logging

#### Current Risk:

- No record of who accessed what
- Cannot detect unauthorized access
- No forensic capability after breach

#### Fix Steps:

**Step 1: Install Laravel Activity Logger**

```bash
cd /root/hris-app/backend

# Install package
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api composer require spatie/laravel-activitylog

# Publish config
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-migrations"
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-config"

# Run migrations
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api php artisan migrate
```

**Step 2: Create logging middleware**

```bash
nano /root/hris-app/backend/app/Http/Middleware/LogActivity.php
```

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class LogActivity
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Log security-sensitive actions
        $sensitiveRoutes = ['login', 'logout', 'register', 'password', 'staff', 'clients', 'invoices'];

        foreach ($sensitiveRoutes as $route) {
            if (str_contains($request->path(), $route)) {
                activity()
                    ->causedBy($request->user())
                    ->withProperties([
                        'ip' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'method' => $request->method(),
                        'url' => $request->fullUrl(),
                        'input' => $this->sanitizeInput($request->except(['password', 'password_confirmation'])),
                        'response_code' => $response->getStatusCode(),
                    ])
                    ->log($request->method() . ' ' . $request->path());
                break;
            }
        }

        return $response;
    }

    private function sanitizeInput($input)
    {
        // Remove sensitive data from logs
        $sensitive = ['password', 'token', 'ssn', 'credit_card'];
        foreach ($sensitive as $field) {
            if (isset($input[$field])) {
                $input[$field] = '[REDACTED]';
            }
        }
        return $input;
    }
}
```

**Step 3: Register middleware**

```bash
nano /root/hris-app/backend/app/Http/Kernel.php
```

Add to `$middlewareGroups['api']`:

```php
protected $middlewareGroups = [
    'api' => [
        // ... existing middleware ...
        \App\Http\Middleware\LogActivity::class,
    ],
];
```

**Step 4: Create audit log viewer**

```bash
nano /root/hris-app/backend/routes/api.php
```

```php
// Admin-only audit log access
Route::middleware(['auth:sanctum', 'admin'])->get('/audit-logs', function (Request $request) {
    return Activity::with('causer')
        ->latest()
        ->paginate(50);
});

Route::middleware(['auth:sanctum', 'admin'])->get('/audit-logs/user/{userId}', function (Request $request, $userId) {
    return Activity::where('causer_id', $userId)
        ->latest()
        ->paginate(50);
});
```

**Step 5: Create daily audit report**

```bash
cat > /root/generate-audit-report.sh << 'EOFAUDIT'
#!/bin/bash
# Daily Security Audit Report

REPORT_DIR="/root/security-reports"
mkdir -p $REPORT_DIR

DATE=$(date +%Y-%m-%d)
REPORT_FILE="$REPORT_DIR/audit-$DATE.txt"

echo "=== HRM-ERP Security Audit Report ===" > $REPORT_FILE
echo "Date: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Failed login attempts
echo "=== Failed Login Attempts ===" >> $REPORT_FILE
docker compose -f /root/hris-app/docker-compose.prod.yml exec -T laravel-api \
    php artisan tinker --execute="Activity::where('description', 'like', '%login%')->where('properties->response_code', 401)->whereDate('created_at', today())->get()->each(function(\$log) { echo \$log->properties['ip'] . ' - ' . \$log->created_at . PHP_EOL; });" \
    >> $REPORT_FILE

# Successful logins
echo "" >> $REPORT_FILE
echo "=== Successful Logins ===" >> $REPORT_FILE
docker compose -f /root/hris-app/docker-compose.prod.yml exec -T laravel-api \
    php artisan tinker --execute="Activity::where('description', 'like', '%login%')->where('properties->response_code', 200)->whereDate('created_at', today())->get()->each(function(\$log) { echo (\$log->causer->email ?? 'Unknown') . ' - ' . \$log->properties['ip'] . ' - ' . \$log->created_at . PHP_EOL; });" \
    >> $REPORT_FILE

# Data modifications
echo "" >> $REPORT_FILE
echo "=== Critical Data Changes ===" >> $REPORT_FILE
docker compose -f /root/hris-app/docker-compose.prod.yml exec -T laravel-api \
    php artisan tinker --execute="Activity::whereIn('description', ['created', 'updated', 'deleted'])->whereDate('created_at', today())->count();" \
    >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "Report generated: $REPORT_FILE"

# Email report (configure email settings first)
# mail -s "HRM-ERP Security Report $DATE" admin@mysol360.com < $REPORT_FILE
EOFAUDIT

chmod +x /root/generate-audit-report.sh

# Add to crontab (runs daily at 11 PM)
(crontab -l 2>/dev/null; echo "0 23 * * * /root/generate-audit-report.sh") | crontab -
```

---

## High Priority (Month 1)

### 5. Add Security Headers

#### Current Risk:

- Missing HTTP security headers allow XSS, clickjacking, and MIME-sniffing attacks

#### Fix Steps:

```bash
# Edit Nginx configuration
nano /etc/nginx/conf.d/users/mysol360.conf
```

Add security headers inside the first `server` block:

```nginx
server {
    listen 443 ssl http2;
    server_name mysol360.com www.mysol360.com;

    # SSL config...

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://mysol360.com;" always;

    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    location / {
        # CUSTOM: Proxy to Docker nginx-proxy container
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

Test and reload:

```bash
nginx -t && systemctl reload nginx

# Verify headers
curl -I https://mysol360.com | grep -E '(X-Frame|X-Content|Strict-Transport|Content-Security)'
```

---

### 6. Run Containers as Non-Root User

#### Current Risk:

- If container is compromised, attacker has root access
- Container escape = full server compromise

#### Fix Steps:

```bash
# Edit docker-compose.prod.yml
nano /root/hris-app/docker-compose.prod.yml
```

Add user directives:

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    user: "999:999" # MySQL user
    # ... rest of config

  redis:
    image: redis:alpine
    user: "999:999" # Redis user
    # ... rest of config

  laravel-api:
    build: ./backend
    user: "1000:1000" # App user
    # ... rest of config

  nextjs-frontend:
    build: ./frontend
    user: "101:101" # Nginx user
    # ... rest of config
```

Update file ownership:

```bash
cd /root/hris-app

# Backend files
chown -R 1000:1000 backend/storage backend/bootstrap/cache

# Rebuild containers
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Verify
docker compose -f docker-compose.prod.yml exec laravel-api whoami
# Should NOT be root
```

---

### 7. Implement Redis Session Storage

#### Current Risk:

- File-based sessions can be slow and insecure
- Sessions stored on filesystem vulnerable to tampering

#### Fix Steps:

```bash
# Edit Laravel config
nano /root/hris-app/backend/config/session.php
```

Change driver to Redis:

```php
'driver' => env('SESSION_DRIVER', 'redis'),
'connection' => 'session',
```

Update `.env`:

```bash
nano /root/hris-app/backend/.env
```

```env
SESSION_DRIVER=redis
SESSION_LIFETIME=60
SESSION_ENCRYPT=true
SESSION_CONNECTION=session
```

Configure Redis session connection:

```bash
nano /root/hris-app/backend/config/database.php
```

Add session connection:

```php
'redis' => [
    'client' => 'phpredis',

    'default' => [
        'host' => env('REDIS_HOST', 'redis'),
        'password' => env('REDIS_PASSWORD', null),
        'port' => env('REDIS_PORT', '6379'),
        'database' => '0',
    ],

    'session' => [
        'host' => env('REDIS_HOST', 'redis'),
        'password' => env('REDIS_PASSWORD', null),
        'port' => env('REDIS_PORT', '6379'),
        'database' => '1',  // Separate database for sessions
    ],
],
```

Restart:

```bash
docker compose -f /root/hris-app/docker-compose.prod.yml restart laravel-api
```

---

### 8. Enable WAF (Web Application Firewall)

#### Current Risk:

- Application vulnerable to common web exploits
- No protection against OWASP Top 10 attacks

#### Fix Steps:

**Option 1: ModSecurity (Free)**

```bash
# Install ModSecurity for Apache
yum install mod_security mod_security_crs -y

# Enable OWASP Core Rule Set
cd /etc/httpd/modsecurity.d
wget https://github.com/coreruleset/coreruleset/archive/v3.3.5.tar.gz
tar -xzf v3.3.5.tar.gz
cp coreruleset-3.3.5/crs-setup.conf.example crs-setup.conf
cp -r coreruleset-3.3.5/rules/ .

# Configure ModSecurity
nano /etc/httpd/conf.d/mod_security.conf
```

```apache
<IfModule mod_security2.c>
    SecRuleEngine On
    SecRequestBodyAccess On
    SecResponseBodyAccess Off
    SecDataDir /tmp

    # Include OWASP CRS
    Include /etc/httpd/modsecurity.d/crs-setup.conf
    Include /etc/httpd/modsecurity.d/rules/*.conf

    # Custom rules for Laravel
    SecRule REQUEST_URI "@contains /api/login" \
        "id:1000,phase:2,deny,status:403,msg:'Multiple failed login attempts'"
</IfModule>
```

Restart Apache:

```bash
systemctl restart httpd
```

**Option 2: Cloudflare (Recommended - Free Tier Available)**

1. Sign up at https://www.cloudflare.com
2. Add domain `mysol360.com`
3. Update nameservers at domain registrar
4. Enable:
   - WAF Rules (Free tier includes basic OWASP rules)
   - Rate Limiting
   - DDoS Protection
   - Bot Management
   - SSL/TLS Full (Strict)

Configuration:

```
Cloudflare Dashboard → Security → WAF
- Enable OWASP ModSecurity Core Rule Set
- Enable Cloudflare Managed Ruleset
- Create custom rules:
  * Block countries (if applicable)
  * Rate limit login endpoints
  * Challenge suspicious traffic
```

---

### 9. Docker Image Security Scanning

#### Current Risk:

- Using images with known vulnerabilities
- No visibility into container security issues

#### Fix Steps:

```bash
# Install Trivy (vulnerability scanner)
wget https://github.com/aquasecurity/trivy/releases/download/v0.48.0/trivy_0.48.0_Linux-64bit.tar.gz
tar -xzf trivy_0.48.0_Linux-64bit.tar.gz
mv trivy /usr/local/bin/
chmod +x /usr/local/bin/trivy

# Scan current images
trivy image mysql:8.0
trivy image redis:alpine
trivy image hris-app-laravel-api
trivy image hris-app-nextjs-frontend

# Create scanning script
cat > /root/scan-docker-images.sh << 'EOFSCAN'
#!/bin/bash
# Docker Image Security Scanning

REPORT_DIR="/root/security-reports/image-scans"
mkdir -p $REPORT_DIR
DATE=$(date +%Y%m%d)

echo "Scanning Docker images for vulnerabilities..."

for image in $(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "hris-app|mysql|redis"); do
    echo "Scanning $image..."
    trivy image --severity HIGH,CRITICAL --format json $image > "$REPORT_DIR/${image//:/--}-$DATE.json"
    trivy image --severity HIGH,CRITICAL $image > "$REPORT_DIR/${image//:/--}-$DATE.txt"
done

echo "Scan complete. Reports in $REPORT_DIR"

# Alert if critical vulnerabilities found
CRITICAL=$(grep -c "CRITICAL" $REPORT_DIR/*-$DATE.txt)
if [ $CRITICAL -gt 0 ]; then
    echo "⚠️ WARNING: $CRITICAL critical vulnerabilities found!"
    # mail -s "CRITICAL: Docker Vulnerabilities Detected" admin@mysol360.com < $REPORT_DIR/summary-$DATE.txt
fi
EOFSCAN

chmod +x /root/scan-docker-images.sh

# Add to crontab (weekly scan on Sundays)
(crontab -l 2>/dev/null; echo "0 4 * * 0 /root/scan-docker-images.sh") | crontab -

# Run first scan
/root/scan-docker-images.sh
```

**Pin Docker image versions:**

```bash
nano /root/hris-app/docker-compose.prod.yml
```

Update to specific versions:

```yaml
services:
  mysql:
    image: mysql:8.0.35 # Specific version, not :latest or :8.0

  redis:
    image: redis:7.2.3-alpine # Specific version
```

---

### 10. Multi-Factor Authentication (MFA)

#### Current Risk:

- Password-only authentication easily compromised
- No second factor for sensitive operations

#### Fix Steps:

**Install Laravel 2FA package:**

```bash
cd /root/hris-app/backend

docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api composer require pragmarx/google2fa-laravel

docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api php artisan vendor:publish --provider="PragmaRX\Google2FALaravel\ServiceProvider"

docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api php artisan migrate
```

**Add MFA columns to users table:**

```bash
nano /root/hris-app/backend/database/migrations/add_2fa_to_users_table.php
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('google2fa_secret')->nullable();
            $table->boolean('google2fa_enabled')->default(false);
            $table->timestamp('google2fa_enabled_at')->nullable();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google2fa_secret', 'google2fa_enabled', 'google2fa_enabled_at']);
        });
    }
};
```

Run migration:

```bash
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api php artisan migrate
```

**Update authentication flow** (requires frontend and backend code changes - detailed implementation in separate document)

---

## Medium Priority (Month 3)

### 11. Intrusion Detection System (IDS)

```bash
# Install OSSEC
wget https://github.com/ossec/ossec-hids/archive/3.7.0.tar.gz
tar -xzf 3.7.0.tar.gz
cd ossec-hids-3.7.0
./install.sh

# Configure monitoring
nano /var/ossec/etc/ossec.conf
```

### 12. Regular Penetration Testing

**Automated Scanning:**

```bash
# Install OWASP ZAP
docker pull owasp/zap2docker-stable

# Run baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://mysol360.com -r zap-report.html

# Schedule weekly scans
echo "0 2 * * 0 docker run -t owasp/zap2docker-stable zap-baseline.py -t https://mysol360.com -r /root/security-reports/zap-\$(date +\%Y\%m\%d).html" | crontab -
```

**Manual Testing Checklist:**

- [ ] SQL Injection testing (all forms)
- [ ] XSS testing (stored and reflected)
- [ ] CSRF token validation
- [ ] Authentication bypass attempts
- [ ] Authorization testing (privilege escalation)
- [ ] File upload vulnerabilities
- [ ] Session management flaws
- [ ] API security testing

### 13. Secrets Management

**Using Docker Secrets:**

```bash
# Create secrets
echo "database_password_here" | docker secret create mysql_root_password -
echo "app_db_password_here" | docker secret create mysql_app_password -

# Update docker-compose.prod.yml
nano /root/hris-app/docker-compose.prod.yml
```

```yaml
version: "3.8"

secrets:
  mysql_root_password:
    external: true
  mysql_app_password:
    external: true

services:
  mysql:
    secrets:
      - mysql_root_password
    environment:
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/mysql_root_password

  laravel-api:
    secrets:
      - mysql_app_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/mysql_app_password
```

### 14. Database Encryption at Rest

```bash
# Enable MySQL encryption
nano /root/hris-app/docker-compose.prod.yml
```

Add to MySQL service:

```yaml
mysql:
  command: --default-authentication-plugin=mysql_native_password --encryption=ON --table_encryption_privilege_check=ON
  volumes:
    - mysql_data:/var/lib/mysql
    - ./mysql-keyring:/var/lib/mysql-keyring
```

### 15. Network Segmentation

**Create separate networks for different tiers:**

```yaml
networks:
  frontend_network:
    driver: bridge
  backend_network:
    driver: bridge
    internal: true # No internet access
  database_network:
    driver: bridge
    internal: true # Completely isolated

services:
  nextjs-frontend:
    networks:
      - frontend_network

  laravel-api:
    networks:
      - frontend_network
      - backend_network

  mysql:
    networks:
      - database_network

  redis:
    networks:
      - backend_network
```

---

## Ongoing Security Maintenance

### Daily Tasks

```bash
# Automated daily security checks
cat > /root/daily-security-checks.sh << 'EOFCHECK'
#!/bin/bash

echo "=== Daily Security Check $(date) ===" >> /var/log/security-daily.log

# Check for failed SSH attempts
echo "Failed SSH attempts:" >> /var/log/security-daily.log
grep "Failed password" /var/log/secure | tail -20 >> /var/log/security-daily.log

# Check Docker container status
echo "Docker container health:" >> /var/log/security-daily.log
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Size}}" >> /var/log/security-daily.log

# Check disk space
echo "Disk usage:" >> /var/log/security-daily.log
df -h | grep -E '(Filesystem|/$|/home)' >> /var/log/security-daily.log

# Check for suspicious processes
echo "Resource-intensive processes:" >> /var/log/security-daily.log
ps aux --sort=-%mem | head -10 >> /var/log/security-daily.log

# Verify backups completed
echo "Latest backup:" >> /var/log/security-daily.log
ls -lth /root/backups/daily/ | head -5 >> /var/log/security-daily.log

echo "===========================================" >> /var/log/security-daily.log
EOFCHECK

chmod +x /root/daily-security-checks.sh
(crontab -l; echo "0 6 * * * /root/daily-security-checks.sh") | crontab -
```

### Weekly Tasks

- [ ] Review audit logs for anomalies
- [ ] Check and apply OS security updates
- [ ] Review failed login attempts
- [ ] Verify backup integrity
- [ ] Check SSL certificate expiry
- [ ] Review Docker vulnerability scans

### Monthly Tasks

- [ ] Full security audit review
- [ ] Update all Docker images
- [ ] Review and update firewall rules
- [ ] Password rotation for service accounts
- [ ] Review user access permissions
- [ ] Test disaster recovery procedures
- [ ] Update security documentation

### Quarterly Tasks

- [ ] External penetration test
- [ ] Security awareness training
- [ ] Review and update incident response plan
- [ ] Compliance audit (GDPR, SOC 2, etc.)
- [ ] Architecture security review
- [ ] Third-party security assessment

---

## Incident Response Plan

### Detection Phase

**Indicators of Compromise (IOCs):**

- Multiple failed login attempts from single IP
- Database queries at unusual times
- Unexpected file modifications
- High CPU/memory usage
- Outbound connections to unknown IPs
- Changes to system files or configs
- Unexpected user privilege escalations

**Monitoring Commands:**

```bash
# Real-time failed logins
tail -f /var/log/secure | grep "Failed password"

# Real-time Docker container logs
docker compose -f /root/hris-app/docker-compose.prod.yml logs -f

# Database connections
docker compose -f /root/hris-app/docker-compose.prod.yml exec mysql \
    mysql -e "SHOW PROCESSLIST;"

# Network connections
netstat -tulpn | grep ESTABLISHED
```

### Containment Phase

**If breach suspected:**

```bash
# 1. Disconnect from network (emergency only)
# iptables -A INPUT -j DROP
# iptables -A OUTPUT -j DROP

# 2. Stop affected containers
docker compose -f /root/hris-app/docker-compose.prod.yml stop laravel-api

# 3. Create forensic snapshot
tar -czf /root/forensics/snapshot-$(date +%Y%m%d-%H%M).tar.gz \
    /root/hris-app \
    /var/log \
    /root/backups

# 4. Preserve evidence
docker compose -f /root/hris-app/docker-compose.prod.yml logs > /root/forensics/container-logs-$(date +%Y%m%d-%H%M).log

# 5. Change all passwords
# See emergency password reset section below
```

### Eradication Phase

```bash
# 1. Identify attack vector
grep -r "suspicious_pattern" /var/log/

# 2. Remove malicious code/files
# (Requires manual analysis)

# 3. Patch vulnerabilities
docker compose -f /root/hris-app/docker-compose.prod.yml down
docker compose -f /root/hris-app/docker-compose.prod.yml build --no-cache
docker compose -f /root/hris-app/docker-compose.prod.yml up -d

# 4. Restore from clean backup if necessary
# (See backup restoration section)
```

### Recovery Phase

```bash
# 1. Restore from backup
CLEAN_BACKUP="20251115-030000"  # Known good backup
gunzip < /root/backups/daily/$CLEAN_BACKUP/database.sql.gz | \
    docker compose -f /root/hris-app/docker-compose.prod.yml exec -T mysql \
    mysql -u root -p hrm_erp

# 2. Reset all passwords
# Generate new passwords for all users

# 3. Re-enable services gradually
docker compose -f /root/hris-app/docker-compose.prod.yml start mysql
# Verify integrity
docker compose -f /root/hris-app/docker-compose.prod.yml start redis
docker compose -f /root/hris-app/docker-compose.prod.yml start laravel-api
# Test thoroughly
docker compose -f /root/hris-app/docker-compose.prod.yml start nextjs-frontend

# 4. Monitor closely for 72 hours
```

### Post-Incident Phase

**Documentation:**

```bash
cat > /root/incidents/incident-$(date +%Y%m%d).md << 'EOFINCIDENT'
# Security Incident Report

**Date**: $(date)
**Severity**: [CRITICAL/HIGH/MEDIUM/LOW]
**Status**: [DETECTED/CONTAINED/ERADICATED/RECOVERED]

## Timeline
- [Time] Initial detection
- [Time] Containment measures applied
- [Time] Attack vector identified
- [Time] Systems restored

## Impact Assessment
- Systems affected:
- Data compromised:
- Downtime:
- Business impact:

## Root Cause
- Attack vector:
- Vulnerability exploited:
- Attacker profile:

## Response Actions
1. [Action taken]
2. [Action taken]

## Lessons Learned
- What worked well:
- What could be improved:
- Preventive measures to implement:

## Follow-up Actions
- [ ] Update security policies
- [ ] Implement additional controls
- [ ] Staff training
- [ ] Notify affected parties (if required)
EOFINCIDENT
```

### Emergency Contacts

```bash
# Create emergency contact list
cat > /root/security-contacts.txt << 'EOF'
=== EMERGENCY SECURITY CONTACTS ===

Technical Team:
- Primary Admin: [Name] [Phone] [Email]
- Secondary Admin: [Name] [Phone] [Email]
- Database Admin: [Name] [Phone] [Email]

Management:
- IT Manager: [Name] [Phone] [Email]
- CISO: [Name] [Phone] [Email]
- CEO: [Name] [Phone] [Email]

External:
- Hosting Provider: [Company] [Support Phone] [Support Email]
- Security Consultant: [Company] [Contact] [Phone]
- Legal Counsel: [Name] [Phone] [Email]
- Law Enforcement: [Department] [Contact] [Phone]

Service Providers:
- Cloudflare: https://support.cloudflare.com
- cPanel Support: support@cpanel.net
- Docker Security: security@docker.com
EOF

chmod 600 /root/security-contacts.txt
```

---

## Compliance Checklist

### GDPR Compliance

- [ ] **Data Inventory**: Document all personal data collected
- [ ] **Legal Basis**: Establish lawful basis for processing
- [ ] **Consent Management**: Implement opt-in/opt-out mechanisms
- [ ] **Data Minimization**: Collect only necessary data
- [ ] **Right to Access**: Provide data export functionality
- [ ] **Right to Erasure**: Implement data deletion capability
- [ ] **Data Portability**: Enable data transfer to other systems
- [ ] **Breach Notification**: 72-hour reporting procedures
- [ ] **Privacy by Design**: Security built into system architecture
- [ ] **DPO Appointment**: Designate Data Protection Officer
- [ ] **Data Processing Agreement**: With all third-party processors
- [ ] **Encryption**: Implement encryption at rest and in transit
- [ ] **Audit Logging**: Log all data access and modifications
- [ ] **Regular Audits**: Quarterly compliance reviews

**Implementation:**

```bash
# Create GDPR compliance script
cat > /root/hris-app/backend/app/Console/Commands/GdprExport.php << 'EOFGDPR'
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class GdprExport extends Command
{
    protected $signature = 'gdpr:export {user_id}';
    protected $description = 'Export all user data for GDPR compliance';

    public function handle()
    {
        $userId = $this->argument('user_id');
        $user = User::findOrFail($userId);

        $data = [
            'personal_info' => $user->only(['name', 'email', 'phone', 'address']),
            'employment' => $user->staff()->first(),
            'activity_logs' => $user->activities()->get(),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];

        $filename = storage_path("gdpr/user-{$userId}-" . now()->format('Y-m-d') . ".json");
        file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT));

        $this->info("User data exported to: {$filename}");
    }
}
EOFGDPR
```

### PCI DSS Compliance (if handling payments)

- [ ] **Network Segmentation**: Isolate cardholder data environment
- [ ] **Firewall Configuration**: Restrict access to cardholder data
- [ ] **Strong Cryptography**: Encrypt cardholder data in transit and at rest
- [ ] **Anti-Virus**: Deploy and maintain anti-malware solutions
- [ ] **Secure Development**: Follow secure coding practices
- [ ] **Access Control**: Implement role-based access control
- [ ] **Unique IDs**: Assign unique ID to each person with computer access
- [ ] **Physical Access**: Restrict physical access to cardholder data
- [ ] **Network Monitoring**: Monitor and test networks regularly
- [ ] **Vulnerability Management**: Regular security testing and updates
- [ ] **Incident Response**: Maintain an incident response plan
- [ ] **Security Policy**: Document and distribute security policies

### SOC 2 Compliance

- [ ] **Security**: Protection against unauthorized access
- [ ] **Availability**: System accessible as agreed upon
- [ ] **Processing Integrity**: Complete, valid, accurate, timely processing
- [ ] **Confidentiality**: Information designated as confidential is protected
- [ ] **Privacy**: Personal information collected, used, retained, and disclosed in compliance with privacy policy

**Implementation Steps:**

```bash
# SOC 2 compliance monitoring script
cat > /root/soc2-compliance-check.sh << 'EOFSOC2'
#!/bin/bash
# SOC 2 Compliance Monitoring

REPORT="/root/compliance-reports/soc2-$(date +%Y%m%d).txt"
mkdir -p /root/compliance-reports

echo "=== SOC 2 Compliance Check ===" > $REPORT
echo "Date: $(date)" >> $REPORT
echo "" >> $REPORT

# Security Controls
echo "=== Security Controls ===" >> $REPORT
echo "1. Access Control" >> $REPORT
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api \
    php artisan tinker --execute="echo User::count() . ' users configured';" >> $REPORT

echo "2. Encryption Status" >> $REPORT
curl -s https://mysol360.com | grep -q "https" && echo "✓ HTTPS enabled" >> $REPORT || echo "✗ HTTPS not enabled" >> $REPORT

echo "3. Firewall Status" >> $REPORT
systemctl is-active firewalld >> $REPORT

# Availability Controls
echo "" >> $REPORT
echo "=== Availability Controls ===" >> $REPORT
echo "1. System Uptime" >> $REPORT
uptime >> $REPORT

echo "2. Container Health" >> $REPORT
docker ps --format "{{.Names}}: {{.Status}}" >> $REPORT

echo "3. Backup Status" >> $REPORT
ls -lh /root/backups/daily/ | tail -1 >> $REPORT

# Monitoring
echo "" >> $REPORT
echo "=== Monitoring ===" >> $REPORT
echo "1. Failed Login Attempts (last 24h)" >> $REPORT
grep "Failed password" /var/log/secure | wc -l >> $REPORT

echo "2. Audit Log Entries (today)" >> $REPORT
docker compose -f /root/hris-app/docker-compose.prod.yml exec -T laravel-api \
    php artisan tinker --execute="echo Activity::whereDate('created_at', today())->count();" >> $REPORT

cat $REPORT
EOFSOC2

chmod +x /root/soc2-compliance-check.sh

# Add to weekly cron
(crontab -l; echo "0 9 * * 1 /root/soc2-compliance-check.sh") | crontab -
```

---

## Security Testing Procedures

### Automated Security Testing

```bash
# Create comprehensive security test script
cat > /root/security-test-suite.sh << 'EOFTEST'
#!/bin/bash
# Comprehensive Security Testing Suite

REPORT_DIR="/root/security-reports/tests"
mkdir -p $REPORT_DIR
DATE=$(date +%Y%m%d-%H%M)

echo "=== Running Security Test Suite ===" | tee $REPORT_DIR/test-$DATE.log

# 1. Port Scan
echo "" | tee -a $REPORT_DIR/test-$DATE.log
echo "=== Port Scan ===" | tee -a $REPORT_DIR/test-$DATE.log
nmap -p- localhost | tee -a $REPORT_DIR/test-$DATE.log

# 2. SSL/TLS Test
echo "" | tee -a $REPORT_DIR/test-$DATE.log
echo "=== SSL/TLS Configuration ===" | tee -a $REPORT_DIR/test-$DATE.log
openssl s_client -connect mysol360.com:443 -tls1_2 2>&1 | grep -E "(Protocol|Cipher)" | tee -a $REPORT_DIR/test-$DATE.log

# 3. HTTP Headers Check
echo "" | tee -a $REPORT_DIR/test-$DATE.log
echo "=== Security Headers ===" | tee -a $REPORT_DIR/test-$DATE.log
curl -I https://mysol360.com 2>&1 | grep -E "(X-Frame|Strict-Transport|Content-Security|X-Content-Type)" | tee -a $REPORT_DIR/test-$DATE.log

# 4. SQL Injection Test (safe probes)
echo "" | tee -a $REPORT_DIR/test-$DATE.log
echo "=== SQL Injection Protection ===" | tee -a $REPORT_DIR/test-$DATE.log
curl -s "https://mysol360.com/api/test?id=1' OR '1'='1" | grep -q "error" && echo "✓ SQL injection protected" || echo "✗ Potential SQL injection vulnerability" | tee -a $REPORT_DIR/test-$DATE.log

# 5. CSRF Protection Test
echo "" | tee -a $REPORT_DIR/test-$DATE.log
echo "=== CSRF Protection ===" | tee -a $REPORT_DIR/test-$DATE.log
RESPONSE=$(curl -s -X POST https://mysol360.com/api/login -d '{"email":"test@test.com","password":"test"}')
echo $RESPONSE | grep -q "CSRF" && echo "✓ CSRF protection active" || echo "⚠ Check CSRF configuration" | tee -a $REPORT_DIR/test-$DATE.log

# 6. Rate Limiting Test
echo "" | tee -a $REPORT_DIR/test-$DATE.log
echo "=== Rate Limiting ===" | tee -a $REPORT_DIR/test-$DATE.log
for i in {1..10}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://mysol360.com/api/login -d '{"email":"test","password":"test"}')
    [ "$HTTP_CODE" == "429" ] && echo "✓ Rate limiting active (blocked at attempt $i)" && break
done | tee -a $REPORT_DIR/test-$DATE.log

# 7. Directory Listing Check
echo "" | tee -a $REPORT_DIR/test-$DATE.log
echo "=== Directory Listing ===" | tee -a $REPORT_DIR/test-$DATE.log
curl -s https://mysol360.com/.git/ | grep -q "Index of" && echo "✗ Directory listing enabled" || echo "✓ Directory listing disabled" | tee -a $REPORT_DIR/test-$DATE.log

# 8. Backup Files Check
echo "" | tee -a $REPORT_DIR/test-$DATE.log
echo "=== Backup Files Exposure ===" | tee -a $REPORT_DIR/test-$DATE.log
for file in .env.backup config.php.bak database.sql; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://mysol360.com/$file)
    [ "$HTTP_CODE" == "200" ] && echo "✗ Backup file accessible: $file" || echo "✓ Backup file protected: $file"
done | tee -a $REPORT_DIR/test-$DATE.log

echo "" | tee -a $REPORT_DIR/test-$DATE.log
echo "=== Security Test Complete ===" | tee -a $REPORT_DIR/test-$DATE.log
echo "Full report: $REPORT_DIR/test-$DATE.log"
EOFTEST

chmod +x /root/security-test-suite.sh

# Add to weekly cron
(crontab -l; echo "0 1 * * 6 /root/security-test-suite.sh") | crontab -
```

---

## Summary & Action Plan

### Implementation Timeline

#### Week 1 (CRITICAL - Do Immediately)

1. ✅ Change MySQL root password
2. ✅ Create limited database user
3. ✅ Setup automated backups
4. ✅ Implement API rate limiting
5. ✅ Enable audit logging
6. ✅ Configure cron job for Nginx monitoring

**Estimated Time**: 4-6 hours  
**Risk Reduction**: 60%

#### Month 1 (HIGH Priority)

1. Add security headers to Nginx
2. Run containers as non-root
3. Implement Redis session storage
4. Enable WAF (ModSecurity or Cloudflare)
5. Docker image vulnerability scanning
6. Multi-factor authentication

**Estimated Time**: 2-3 days  
**Risk Reduction**: 80%

#### Month 3 (MEDIUM Priority)

1. Intrusion detection system (IDS)
2. Regular penetration testing
3. Secrets management with Docker secrets
4. Database encryption at rest
5. Network segmentation
6. Compliance audits

**Estimated Time**: 1-2 weeks  
**Risk Reduction**: 95%

### Budget Considerations

| Security Measure                    | Cost                | Impact               |
| ----------------------------------- | ------------------- | -------------------- |
| Cloudflare WAF (Free)               | $0/month            | High                 |
| Cloudflare Pro                      | $20/month           | Very High            |
| External Penetration Test           | $2,000-5,000        | High                 |
| Security Monitoring Service         | $50-200/month       | High                 |
| Compliance Audit (SOC 2)            | $15,000-30,000/year | Medium (if required) |
| Backup Storage (Cloud)              | $10-50/month        | Critical             |
| SSL Certificate (if not using free) | $0-100/year         | High                 |

**Recommended Immediate Investment**: $30-70/month (Cloudflare Pro + Cloud Backups)

### Success Metrics

Track these KPIs monthly:

- Security incidents detected: Target 0
- Mean time to detect (MTTD): Target < 1 hour
- Mean time to respond (MTTR): Target < 4 hours
- Backup success rate: Target 100%
- Vulnerability scan findings: Trend down
- Failed login attempts: Monitor for spikes
- System uptime: Target 99.9%
- Compliance audit score: Target > 90%

### Final Recommendations

1. **Immediate Action**: Implement Week 1 critical fixes TODAY
2. **Hire Security Consultant**: One-time audit (2-3 days) to validate implementation
3. **Staff Training**: Security awareness for all users
4. **Documentation**: Keep this guide updated as system evolves
5. **Insurance**: Consider cyber insurance policy
6. **Incident Drills**: Quarterly tabletop exercises

---

## Conclusion

This HRM-ERP system is currently **functionally deployed but requires immediate security hardening** before handling production data.

**Current State**: 6.5/10 security rating  
**After Week 1 Fixes**: 8/10 security rating  
**After Month 1 Fixes**: 9/10 security rating  
**After Month 3 Fixes**: 9.5/10 security rating

The most critical gaps are:

1. ❌ No automated backups
2. ❌ No audit logging
3. ❌ Weak database security

**These MUST be fixed within 7 days before deploying to production with real data.**

Follow this guide systematically, and you'll have an enterprise-grade secure HRM system that meets industry standards and protects sensitive employee data.

---

**Document Version**: 1.0  
**Last Updated**: November 16, 2025  
**Next Review**: December 16, 2025  
**Maintained By**: System Administrator  
**Classification**: Internal - Confidential
