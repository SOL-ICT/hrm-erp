# Production Deployment Scripts

These scripts help you safely deploy code to production without overwriting server configurations.

## 📁 Scripts Overview

### 1. `deploy-production.sh` (RECOMMENDED - All-in-One)
**Complete automated deployment with safety checks**

```bash
bash deploy-production.sh
```

**What it does:**
- ✅ Checks Docker containers are running
- ✅ Backs up production configs (Docker, nginx, .env)
- ✅ Backs up database
- ✅ Protects configs from git overwrite
- ✅ Pulls latest code from GitHub
- ✅ Restores production configs
- ✅ Runs migrations
- ✅ Runs seeders (User Management)
- ✅ Clears caches
- ✅ Optional: Checks/fixes primary keys
- ✅ Verifies deployment success
- ✅ Creates deployment log

**Safe for production!** All configs are backed up and restored.

---

### 2. `safe-production-pull.sh` (Git Pull Only)
**Pull code without overwriting configs**

```bash
bash safe-production-pull.sh
```

**What it does:**
- Backs up protected files
- Marks them as assume-unchanged in git
- Pulls latest code
- Restores protected files

**Use when:** You only want to update code, no migrations/cache clearing.

---

### 3. `fix-primary-keys.sh` (Database Maintenance)
**Detect and fix tables without primary keys**

```bash
bash fix-primary-keys.sh
```

**What it does:**
- Scans all database tables
- Identifies tables without primary keys
- Creates database backup
- Adds `id` column with AUTO_INCREMENT and PRIMARY KEY
- Generates detailed report

**Use when:** 
- After database import
- Before going live
- Troubleshooting database issues

---

## 🚀 Quick Start (First Time Deployment)

### On Production Server:

```bash
# 1. Navigate to project directory
cd /path/to/hrm-erp

# 2. Make scripts executable (Linux)
chmod +x deploy-production.sh safe-production-pull.sh fix-primary-keys.sh

# 3. Run complete deployment
bash deploy-production.sh

# 4. Check application
# Visit your app URL and test features
```

---

## 🔒 Protected Files (Never Overwritten)

The scripts automatically protect these files from git pull:

- `docker-compose.yml`
- `docker-compose.prod.yml`
- `backend/Dockerfile`
- `backend/Dockerfile.production`
- `frontend/Dockerfile`
- `nginx-proxy.conf`
- `.env` files (all)

These files contain **production-specific** settings and should never be overwritten.

---

## 📝 Deployment Logs

All deployments create logs:

```bash
# Deployment logs
deployment_YYYYMMDD_HHMMSS.log

# Backups location
deployment_backups/YYYYMMDD_HHMMSS/
```

---

## 🔄 Rollback (If Something Goes Wrong)

Each deployment creates backups. To rollback:

```bash
# 1. Find backup directory
ls -lt deployment_backups/

# 2. Restore database
docker exec -i hrm-mysql mysql -uhrm_user -phrm_password hrm_database < deployment_backups/YYYYMMDD_HHMMSS/database_backup.sql

# 3. Restore code (optional)
git reset --hard COMMIT_HASH  # Found in deployment log

# 4. Restore config files
cp -r deployment_backups/YYYYMMDD_HHMMSS/* .

# 5. Clear caches
docker exec hrm-laravel-api php artisan cache:clear
```

---

## 🛠️ Manual Deployment Steps (If Scripts Fail)

### If you need to deploy manually:

```bash
# 1. Backup configs
mkdir -p backup_$(date +%Y%m%d)
cp docker-compose.yml backend/.env frontend/.env.local backup_$(date +%Y%m%d)/

# 2. Backup database
docker exec hrm-mysql mysqldump -uhrm_user -phrm_password hrm_database > backup_$(date +%Y%m%d)/db.sql

# 3. Pull code (configs will be overwritten - that's why we backed up)
git pull origin main

# 4. Restore configs
cp backup_$(date +%Y%m%d)/docker-compose.yml .
cp backup_$(date +%Y%m%d)/.env backend/
cp backup_$(date +%Y%m%d)/.env.local frontend/

# 5. Run migrations
docker exec hrm-laravel-api php artisan migrate --force

# 6. Run seeders
docker exec hrm-laravel-api php artisan db:seed --class=UserManagementPermissionsSeeder

# 7. Clear caches
docker exec hrm-laravel-api php artisan config:clear
docker exec hrm-laravel-api php artisan cache:clear
docker exec hrm-laravel-api php artisan route:clear
```

---

## ❓ Troubleshooting

### "Git pull overwrote my .env file!"
- Restore from backup: `cp deployment_backups/LATEST/.env backend/.env`
- For next time: Use `deploy-production.sh` script

### "Containers stopped after deployment"
- Check logs: `docker logs hrm-laravel-api`
- Restart: `docker-compose up -d`

### "Migration failed"
- Check error in deployment log
- Rollback database if needed
- Fix migration file and redeploy

### "Primary key script stuck"
- Press Ctrl+C to cancel
- Check which table caused issue
- Manually inspect: `docker exec -it hrm-mysql mysql -uhrm_user -phrm_password hrm_database`

---

## 📞 Support

If deployment fails:
1. Check `deployment_YYYYMMDD_HHMMSS.log`
2. Check container logs: `docker logs hrm-laravel-api`
3. Verify containers running: `docker ps`
4. Rollback if needed (see above)

---

## ✅ Post-Deployment Checklist

After running `deploy-production.sh`:

- [ ] Visit application URL - loads correctly
- [ ] Login works
- [ ] Navigate to Administration → User Management
- [ ] RBAC permissions working (check navigation)
- [ ] Check Laravel logs: `docker logs hrm-laravel-api --tail 100`
- [ ] Test critical features (recruitment, invoicing, etc.)
- [ ] Monitor for 10 minutes for errors

---

**Last Updated:** December 3, 2025
**For:** HRM-ERP Production Deployment
