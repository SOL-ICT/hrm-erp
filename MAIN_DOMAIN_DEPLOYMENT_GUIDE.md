# HRM-ERP MAIN DOMAIN DEPLOYMENT GUIDE

# Target: XEON E-2236 32GB Server with cPanel

# Domain: mysol360.com (MAIN DOMAIN)

# Issue: 502 Bad Gateway - Backend Connection Problems

## 🚨 CORRECTED DEPLOYMENT FOR MAIN DOMAIN:

### **📁 REQUIRED SERVER STRUCTURE FOR mysol360.com:**

```
/home/username/
├── public_html/                 # MAIN DOMAIN DOCUMENT ROOT (mysol360.com)
│   ├── index.html              # Frontend entry point
│   ├── assets/                 # Built frontend assets
│   ├── _next/                  # Next.js static files
│   ├── api/                    # API proxy folder
│   │   └── .htaccess          # API routing to Laravel
│   └── .htaccess              # Main routing rules
├── app/                        # Laravel application (ABOVE document root)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/                # Laravel public (not used as doc root)
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env                   # Production environment
│   ├── artisan
│   └── composer.json
└── hrm.mysol360.com/          # Keep for other purposes
    └── index.php
```

## ⚙️ MAIN DOMAIN DEPLOYMENT STEPS:

### STEP 1: BACKEND DEPLOYMENT

#### A) Upload Laravel to /app/ Directory

```bash
# Via cPanel File Manager or FTP:
# Upload entire /backend folder contents to:
# /home/username/app/
#
# NOT to public_html/app/ but to /app/ at root level
```

#### B) Production .env Configuration

```bash
# File: /home/username/app/.env
APP_NAME="HRM ERP System"
APP_ENV=production
APP_KEY=base64:YOUR_32_CHAR_KEY_HERE
APP_DEBUG=false
APP_TIMEZONE=Africa/Lagos
APP_URL=https://mysol360.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=username_hrm_production
DB_USERNAME=username_hrm_user
DB_PASSWORD=your_secure_password

FRONTEND_URL=https://mysol360.com
CORS_ALLOWED_ORIGINS="https://mysol360.com"

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=mail.mysol360.com
MAIL_PORT=587
MAIL_USERNAME=noreply@mysol360.com
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@mysol360.com
MAIL_FROM_NAME="HRM ERP System"

# FIRS Integration
FIRS_API_URL=https://eivc-k6z6d.ondigitalocean.app/api/v1
FIRS_ENABLED=true
```

### STEP 2: FRONTEND DEPLOYMENT

#### A) Build Frontend for Main Domain

```bash
# Update frontend/next.config.ts:
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_API_URL: 'https://mysol360.com/api',
    NEXT_PUBLIC_APP_URL: 'https://mysol360.com'
  }
}
```

#### B) Deploy Frontend Files

```bash
# Build frontend:
cd frontend
npm install
npm run build

# Upload /frontend/out/* contents to:
# /home/username/public_html/
# This includes: index.html, _next/, assets/, etc.
```

### STEP 3: WEB SERVER CONFIGURATION

#### A) Main Domain .htaccess

**File: /home/username/public_html/.htaccess**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # API Routes - Proxy to Laravel
    RewriteCond %{REQUEST_URI} ^/api/(.*)$
    RewriteRule ^api/(.*)$ /api_handler.php?route=$1 [QSA,L]

    # Frontend Routes - Handle React/Next.js routing
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteRule ^(.*)$ /index.html [QSA,L]

    # Security Headers
    <IfModule mod_headers.c>
        Header always set X-Content-Type-Options nosniff
        Header always set X-Frame-Options SAMEORIGIN
        Header always set X-XSS-Protection "1; mode=block"
        Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    </IfModule>

    # CORS for API requests
    <IfModule mod_headers.c>
        Header always set Access-Control-Allow-Origin "https://mysol360.com"
        Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
        Header always set Access-Control-Allow-Credentials true
    </IfModule>

    # Handle CORS preflight requests
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=204,L]
</IfModule>

# Compression and Caching
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
</IfModule>
```

#### B) API Handler for Main Domain

**File: /home/username/public_html/api_handler.php**

```php
<?php
// API Handler for Main Domain - Routes API calls to Laravel

// Get the API route from the rewrite
$route = $_GET['route'] ?? '';
$request_method = $_SERVER['REQUEST_METHOD'];

// Set up environment for Laravel
$_SERVER['REQUEST_URI'] = '/api/' . $route;
$_SERVER['SCRIPT_NAME'] = '/index.php';

// Path to Laravel application (one level up from public_html)
$laravel_path = dirname(__DIR__) . '/app';

// Check if Laravel exists
if (!file_exists($laravel_path . '/public/index.php')) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Laravel application not found',
        'message' => 'Please deploy the backend application',
        'path_checked' => $laravel_path
    ]);
    exit;
}

// Set Laravel environment
putenv('APP_RUNNING_IN_CONSOLE=false');

// Change to Laravel directory
chdir($laravel_path . '/public');

// Include Laravel
require_once $laravel_path . '/public/index.php';
?>
```

### STEP 4: DATABASE SETUP FOR MAIN DOMAIN

#### A) Create Production Database

```sql
-- Via cPanel MySQL Databases:
1. Create Database: username_hrm_production
2. Create User: username_hrm_user
3. Set Password: (secure password)
4. Add User to Database with ALL privileges
```

#### B) Import and Configure Database

```bash
# Via cPanel Terminal:
cd /home/username/app/

# Install dependencies
composer install --no-dev --optimize-autoloader

# Generate application key
php artisan key:generate --force

# Run migrations
php artisan migrate --force

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### STEP 5: PERMISSIONS AND SECURITY

#### A) Set Correct Permissions

```bash
# Via cPanel Terminal or File Manager:
chmod -R 755 /home/username/app/
chmod -R 775 /home/username/app/storage/
chmod -R 775 /home/username/app/bootstrap/cache/
chmod 644 /home/username/app/.env
chmod 644 /home/username/public_html/.htaccess
```

#### B) Secure Sensitive Files

```bash
# Create .htaccess in /app/ to deny web access
# File: /home/username/app/.htaccess
deny from all
```

### STEP 6: SSL AND FINAL CONFIGURATION

#### A) Enable SSL in cPanel

```bash
1. Go to SSL/TLS → Manage SSL Sites
2. Enable SSL for mysol360.com
3. Force HTTPS Redirect: ON
```

#### B) Update Frontend API Configuration

```bash
# Ensure frontend is making requests to:
# https://mysol360.com/api/
# NOT https://mysol360.com:8000/api/
```

## 🔧 MAIN DOMAIN TROUBLESHOOTING:

### If Still Getting 502 Error:

```bash
1. Check cPanel Error Logs
2. Verify /app/ directory exists and has Laravel files
3. Test API handler: https://mysol360.com/api_handler.php
4. Check database connection in .env
5. Verify PHP version is 8.1+ in cPanel
```

### Test These URLs After Deployment:

```bash
✅ https://mysol360.com/ (Frontend loads)
✅ https://mysol360.com/api_handler.php (Shows Laravel status)
✅ https://mysol360.com/api/health (API responds)
✅ https://mysol360.com/login (Login page)
```

## 📋 MAIN DOMAIN DEPLOYMENT CHECKLIST:

- [ ] Laravel backend deployed to /app/ (not public_html/app/)
- [ ] Frontend built and deployed to /public_html/
- [ ] Production .env configured with mysol360.com URLs
- [ ] Database created: username_hrm_production
- [ ] Main domain .htaccess configured for API proxy
- [ ] api_handler.php created in public_html/
- [ ] SSL enabled and HTTPS forced
- [ ] File permissions set correctly
- [ ] Laravel optimized for production
- [ ] CORS configured for main domain

The key difference is that everything is now on **mysol360.com** instead of a subdomain, and the Laravel app sits in `/app/` while the document root `/public_html/` serves the frontend and proxies API requests.

Would you like me to create the specific files you need to upload, or help with any particular deployment step?
