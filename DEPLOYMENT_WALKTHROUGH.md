# 🚀 MYSOL360.COM PRODUCTION DEPLOYMENT WALKTHROUGH

## Target Server: mysol360.com (cPanel)

## Date: November 14, 2025

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before starting, ensure you have:

- [ ] cPanel login credentials for mysol360.com
- [ ] FTP/File Manager access
- [ ] SSH/Terminal access (if available)
- [ ] MySQL database access
- [ ] Email account credentials for SMTP
- [ ] SSL certificate (should be auto-available with cPanel)

---

## 🎯 DEPLOYMENT STEPS

### **STEP 1: Upload Diagnostic Script** 🔍

**What to do:**

1. Log into cPanel File Manager
2. Navigate to `public_html` folder
3. Upload `main_domain_diagnostic.php` from your project root
4. Visit: `https://mysol360.com/main_domain_diagnostic.php`

**What you'll see:**

- Current server configuration
- Missing files/directories
- PHP extensions status
- Path information

**Action:** Take a screenshot and note any RED ❌ items

---

### **STEP 2: Prepare Production Files Locally** 💻

**Backend Configuration:**

1. **Copy backend/.env.production.template to backend/.env**

   ```powershell
   cd c:\Project\hrm-erp\backend
   copy .env.production.template .env
   ```

2. **Edit backend/.env and update:**

   - `DB_DATABASE` → Your cPanel MySQL database name
   - `DB_USERNAME` → Your cPanel MySQL username
   - `DB_PASSWORD` → Your cPanel MySQL password
   - `MAIL_USERNAME` → Your email (e.g., noreply@mysol360.com)
   - `MAIL_PASSWORD` → Your email password

3. **Install dependencies (if not already done):**
   ```powershell
   cd backend
   composer install --no-dev --optimize-autoloader
   ```

**Frontend Build:**

1. **Copy frontend/.env.production.template to frontend/.env.production**

   ```powershell
   cd c:\Project\hrm-erp\frontend
   copy .env.production.template .env.production
   ```

2. **Update next.config.ts to use production config:**

   ```powershell
   copy next.config.production.js next.config.ts
   ```

3. **Build frontend:**
   ```powershell
   npm install
   npm run build
   ```
   This creates `frontend/out/` folder with static files

---

### **STEP 3: Create Production Database** 🗄️

**In cPanel:**

1. Go to **MySQL Databases**
2. Create new database: `yourusername_hrm_production`
3. Create new user: `yourusername_hrm_user`
4. Set a **strong password** (save it!)
5. Add user to database with **ALL PRIVILEGES**
6. Update `backend/.env` with these credentials

---

### **STEP 4: Upload Backend to Server** 📤

**IMPORTANT:** Backend goes to `/app/` directory (NOT inside public_html)

**Via cPanel File Manager:**

1. Navigate to `/home/yourusername/` (root, same level as public_html)
2. Create folder: `app`
3. Upload ALL contents of your `backend` folder to `/app/`
   - Upload as ZIP, then extract (faster)
   - OR upload folders one by one

**Files to upload:**

```
/app/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/
├── resources/
├── routes/
├── storage/
├── vendor/
├── .env (the one you just configured)
├── artisan
├── composer.json
└── composer.lock
```

**CRITICAL:** Verify `/app/.env` is uploaded!

---

### **STEP 5: Upload Frontend to public_html** 🎨

**Via cPanel File Manager:**

1. Navigate to `/home/yourusername/public_html/`
2. **BACKUP** any existing files (if any)
3. Upload ALL contents from `frontend/out/` to `public_html/`

   - This includes: index.html, \_next/, assets/, etc.

4. Upload these additional files to `public_html/`:
   - `api_handler.php` (from project root)
   - `deployment/public_html_.htaccess` → rename to `.htaccess`

**Your public_html should look like:**

```
/public_html/
├── index.html
├── _next/
├── assets/
├── api_handler.php
├── .htaccess
└── main_domain_diagnostic.php (already there)
```

---

### **STEP 6: Set File Permissions** 🔐

**Via cPanel Terminal or File Manager:**

```bash
# Backend permissions
chmod -R 755 /home/yourusername/app/
chmod -R 775 /home/yourusername/app/storage/
chmod -R 775 /home/yourusername/app/bootstrap/cache/
chmod 644 /home/yourusername/app/.env

# Frontend permissions
chmod -R 755 /home/yourusername/public_html/
chmod 644 /home/yourusername/public_html/.htaccess
chmod 644 /home/yourusername/public_html/api_handler.php
```

**In cPanel File Manager:**

- Right-click folder/file → Permissions
- storage/ and bootstrap/cache/ → 775
- .env → 644
- .htaccess → 644

---

### **STEP 7: Configure Laravel on Server** ⚙️

**Via cPanel Terminal:**

```bash
cd /home/yourusername/app/

# Generate application key
php artisan key:generate --force

# Run database migrations
php artisan migrate --force

# Seed initial data (if needed)
php artisan db:seed --force

# Cache configuration for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link
php artisan storage:link
```

**If Terminal not available:**
Use cPanel's **Cron Jobs** or **Terminal** option in advanced settings.

---

### **STEP 8: Enable SSL and HTTPS** 🔒

**In cPanel:**

1. Go to **SSL/TLS**
2. Click **Manage SSL Sites**
3. Select `mysol360.com`
4. Enable **Force HTTPS Redirect**
5. AutoSSL should provide free certificate

**Verify:**

- Visit `http://mysol360.com` → Should redirect to `https://`

---

### **STEP 9: Test Deployment** 🧪

**Test these URLs:**

1. **Frontend:** https://mysol360.com/

   - Expected: Login page or dashboard loads

2. **Diagnostic:** https://mysol360.com/main_domain_diagnostic.php

   - Expected: All green ✅ checkmarks

3. **API Handler:** https://mysol360.com/api_handler.php

   - Expected: JSON response about Laravel

4. **API Health Check:** https://mysol360.com/api/health

   - Expected: JSON with status: "ok"

5. **Login Test:** Try logging in with test credentials

---

## 🚨 TROUBLESHOOTING COMMON ISSUES

### Issue 1: 502 Bad Gateway

**Cause:** Laravel not found or misconfigured

**Solutions:**

1. Verify `/app/` directory exists and contains Laravel
2. Check `/app/.env` file exists and is configured
3. Check `api_handler.php` is in `public_html/`
4. Visit diagnostic script to see exact error

### Issue 2: 500 Internal Server Error

**Cause:** Permissions or Laravel configuration

**Solutions:**

1. Check storage/ and bootstrap/cache/ permissions (775)
2. Run `php artisan config:clear` in terminal
3. Check cPanel Error Logs

### Issue 3: CORS Errors

**Cause:** Cross-origin requests blocked

**Solutions:**

1. Verify `.htaccess` in `public_html/` has CORS headers
2. Check `backend/config/cors.php` allows mysol360.com
3. Clear browser cache

### Issue 4: Database Connection Failed

**Cause:** Wrong database credentials

**Solutions:**

1. Verify DB credentials in `/app/.env`
2. Test database connection in cPanel phpMyAdmin
3. Ensure database user has ALL privileges

### Issue 5: API Routes Not Found

**Cause:** .htaccess not configured properly

**Solutions:**

1. Verify `.htaccess` exists in `public_html/`
2. Check Apache mod_rewrite is enabled (usually is on cPanel)
3. Test: `https://mysol360.com/api_handler.php?route=health`

---

## 📊 POST-DEPLOYMENT CHECKLIST

- [ ] Frontend loads at https://mysol360.com
- [ ] All diagnostic checks pass (green ✅)
- [ ] Can login to admin panel
- [ ] API endpoints respond correctly
- [ ] Database connection works
- [ ] File uploads work (test in any module)
- [ ] Email sending works (test registration/password reset)
- [ ] SSL certificate is active
- [ ] No console errors in browser dev tools

---

## 🔄 UPDATING AFTER DEPLOYMENT

**To update frontend:**

```powershell
cd frontend
npm run build
# Upload contents of /out/ to public_html/
```

**To update backend:**

```powershell
# Upload changed files to /app/
# Then in cPanel Terminal:
cd /app
php artisan config:clear
php artisan config:cache
php artisan route:cache
```

---

## 📞 NEED HELP?

**If you encounter issues:**

1. Check `main_domain_diagnostic.php` output
2. Check cPanel Error Logs
3. Check browser console for frontend errors
4. Check `/app/storage/logs/laravel.log` for backend errors

**Common log locations:**

- cPanel Error Log: cPanel → Metrics → Errors
- Laravel Log: `/app/storage/logs/laravel.log`
- Browser Console: F12 → Console tab

---

## ✅ SUCCESS INDICATORS

**You're successfully deployed when:**

- ✅ https://mysol360.com loads the application
- ✅ You can login successfully
- ✅ Dashboard shows data correctly
- ✅ All modules are accessible
- ✅ No 502/500 errors
- ✅ API calls work in browser Network tab

---

**Good luck with your deployment! 🚀**
