# HRM-ERP Production Server Deployment Guide

# Target: XEON E-2236 32GB Server with cPanel

# Domain: mysol360.com (MAIN DOMAIN)

# Issue: 502 Bad Gateway - Backend Connection Problems

## 🚨 CRITICAL ISSUES TO FIX:

### 1. BACKEND DEPLOYMENT MISSING

**Problem:** No Laravel backend deployed to server
**Location:** Need to deploy `/backend` folder to server

### 2. DATABASE CONNECTION

**Problem:** Production database not configured
**Fix:** Configure MySQL connection for production

### 3. WEB SERVER CONFIGURATION

**Problem:** Apache/Nginx not configured for Laravel
**Fix:** Configure document root and rewrite rules

### 4. ENVIRONMENT CONFIGURATION

**Problem:** Production environment variables not set
**Fix:** Configure .env for production

## 📁 REQUIRED SERVER STRUCTURE:

```
/home/username/
├── public_html/               # MAIN DOMAIN (mysol360.com) - Laravel public folder
│   ├── index.php             # Laravel entry point
│   ├── .htaccess            # Laravel routing rules
│   ├── assets/              # Built frontend assets (Next.js)
│   ├── css/                 # Laravel CSS assets
│   ├── js/                  # Laravel JS assets
│   └── favicon.ico          # Site favicon
├── app/                     # Laravel application (ABOVE public_html)
│   ├── app/                 # Laravel app directory
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env                 # Production environment
│   ├── artisan
│   └── composer.json
├── hrm.mysol360.com/        # Keep for other purposes
└── ssl/                     # SSL certificates
```

## ⚙️ STEP-BY-STEP DEPLOYMENT:

### STEP 1: PREPARE BACKEND FOR PRODUCTION

#### A) Create Production .env File

```bash
# Location: /backend/.env.production
APP_NAME="HRM ERP System"
APP_ENV=production
APP_KEY=base64:YOUR_32_CHAR_KEY_HERE
APP_DEBUG=false
APP_TIMEZONE=Africa/Lagos
APP_URL=https://mysol360.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_production_database_name
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=file
CACHE_PREFIX=hrm_cache

SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.mysol360.com

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mail.mysol360.com
MAIL_PORT=587
MAIL_USERNAME=noreply@mysol360.com
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@mysol360.com
MAIL_FROM_NAME="HRM ERP System"

# CORS Configuration
FRONTEND_URL=https://mysol360.com
CORS_ALLOWED_ORIGINS="https://mysol360.com"

# File Upload Limits
UPLOAD_MAX_FILESIZE=10M
POST_MAX_SIZE=10M
MAX_EXECUTION_TIME=300

# FIRS Integration
FIRS_API_URL=https://eivc-k6z6d.ondigitalocean.app/api/v1
FIRS_ENABLED=true
```

#### B) Update Laravel Configuration Files

**config/cors.php:**

```php
'allowed_origins' => [
    'https://mysol360.com',
    'https://www.mysol360.com'
],
'allowed_origins_patterns' => [
    '/^https:\/\/(www\.)?mysol360\.com$/',
],
```

**config/database.php:** (Production MySQL settings)

```php
'mysql' => [
    'driver' => 'mysql',
    'url' => env('DB_URL'),
    'host' => env('DB_HOST', 'localhost'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'unix_socket' => env('DB_SOCKET', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'prefix_indexes' => true,
    'strict' => false,  // Set to false for production compatibility
    'engine' => null,
    'options' => extension_loaded('pdo_mysql') ? array_filter([
        PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
    ]) : [],
],
```

### STEP 2: FRONTEND BUILD FOR PRODUCTION

#### A) Update Frontend Configuration

**frontend/next.config.ts:**

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Static export for shared hosting
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  env: {
    NEXT_PUBLIC_API_URL: "https://mysol360.com/api",
    NEXT_PUBLIC_APP_URL: "https://mysol360.com",
  },
  assetPrefix: process.env.NODE_ENV === "production" ? "" : "",
};

module.exports = nextConfig;
```

**frontend/.env.production:**

```bash
NEXT_PUBLIC_API_URL=https://mysol360.com/api
NEXT_PUBLIC_APP_URL=https://mysol360.com
NODE_ENV=production
```

#### B) Build Frontend

```bash
cd frontend
npm install
npm run build
# This creates /out folder with static files
```

### STEP 3: SERVER DEPLOYMENT

#### A) Upload Files to Server

```bash
# Upload via FTP/cPanel File Manager:

# 1. Backend files to /app/ (above public_html)
- Upload entire /backend folder contents to /app/
- Do NOT put in public_html (security risk)

# 2. Frontend + Laravel public files to /public_html/
- Upload /frontend/out/* contents to /public_html/
- Upload /backend/public/* contents to /public_html/ (merge/overwrite)
- Laravel's index.php should be in /public_html/
```

#### B) Set Correct Permissions

```bash
# Via cPanel Terminal or SSH:
chmod -R 755 /home/username/public_html/
chmod -R 775 /home/username/app/storage/
chmod -R 775 /home/username/app/bootstrap/cache/
chmod 644 /home/username/app/.env
```

### STEP 4: DATABASE SETUP

#### A) Create Production Database

```sql
-- Via cPanel MySQL Databases:
1. Create Database: username_hrm_production
2. Create User: username_hrm_user
3. Grant ALL privileges to user on database
```

#### B) Import Database Schema

```bash
# Via cPanel phpMyAdmin or command line:
mysql -u username_hrm_user -p username_hrm_production < database_export.sql
```

#### C) Run Laravel Migrations

```bash
# Via cPanel Terminal:
cd /home/username/app/
php artisan migrate --force
php artisan db:seed --force  # If you have seeders
```

### STEP 5: WEB SERVER CONFIGURATION

#### A) Apache .htaccess for Main Domain

**File: /public_html/.htaccess**

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Angular/React Router (Frontend)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteRule ^(.*)$ /index.html [QSA,L]

    # Handle Laravel API Routes
    RewriteCond %{REQUEST_URI} ^/api/
    RewriteRule ^api/(.*)$ /api_handler.php [QSA,L]

    # Security Headers
    <IfModule mod_headers.c>
        Header always set X-Content-Type-Options nosniff
        Header always set X-Frame-Options DENY
        Header always set X-XSS-Protection "1; mode=block"
        Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    </IfModule>

    # CORS Headers for API
    <IfModule mod_headers.c>
        SetEnvIf Origin "^https?://(.*\.)?mysol360\.com$" CORS_ORIGIN=$0
        Header always set Access-Control-Allow-Origin %{CORS_ORIGIN}e env=CORS_ORIGIN
        Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
        Header always set Access-Control-Allow-Credentials true
    </IfModule>

    # Handle CORS Preflight
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=204,L]
</IfModule>
```

#### B) Laravel Bootstrap (Update paths)

**File: /public_html/index.php** (Update Laravel paths)

```php
<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../app/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../app/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../app/bootstrap/app.php')
    ->handleRequest(Request::capture());
?>
```

### STEP 6: SHARED HOSTING OPTIMIZATIONS

#### A) Composer Optimization

```bash
# Via cPanel Terminal:
cd /home/username/app/
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### B) PHP Configuration

**File: /app/.user.ini**

```ini
memory_limit = 512M
max_execution_time = 300
upload_max_filesize = 10M
post_max_size = 10M
max_input_vars = 3000
```

### STEP 7: SSL CONFIGURATION

#### A) Enable SSL in cPanel

1. Go to SSL/TLS in cPanel
2. Enable "Force HTTPS Redirect"
3. Install SSL certificate for mysol360.com

#### B) Update Application URLs

```bash
# In production .env:
APP_URL=https://mysol360.com
FRONTEND_URL=https://mysol360.com
```

## 🔧 TROUBLESHOOTING COMMON ISSUES:

### 502 Bad Gateway

```bash
# Check these:
1. PHP version compatibility (ensure PHP 8.1+)
2. Missing PHP extensions:
   - php-mysql, php-pdo, php-mbstring, php-tokenizer
3. File permissions on storage/ and bootstrap/cache/
4. Check error logs in cPanel
```

### Database Connection Issues

```bash
# Verify:
1. Database credentials in .env
2. MySQL service running
3. Database user has proper privileges
4. Host is 'localhost' not '127.0.0.1'
```

### CORS Issues

```bash
# Fix:
1. Update CORS_ALLOWED_ORIGINS in .env
2. Clear Laravel config cache: php artisan config:clear
3. Verify frontend is making requests to correct API URL
```

## 📝 DEPLOYMENT CHECKLIST:

- [ ] Backend deployed to /app/
- [ ] Frontend built and deployed to /public_html/
- [ ] Production .env configured
- [ ] Database created and migrated
- [ ] File permissions set correctly
- [ ] .htaccess rules configured
- [ ] SSL enabled and forced
- [ ] Composer optimized for production
- [ ] Laravel caches generated
- [ ] CORS properly configured
- [ ] Error logging enabled

## 🚀 POST-DEPLOYMENT VERIFICATION:

### Test These URLs:

1. https://mysol360.com/ (Frontend loads)
2. https://mysol360.com/api/health (API responds)
3. https://mysol360.com/api/auth/check (Auth endpoint)
4. https://mysol360.com/login (Login page)

### Monitor These Logs:

- cPanel Error Logs
- Laravel logs: /app/storage/logs/
- PHP error logs

Would you like me to create specific deployment scripts for any of these steps?
