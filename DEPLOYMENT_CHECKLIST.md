# 🚀 Deployment Checklist - Push to Production

## Quick Reference for Deploying to mysol360.com

### Prerequisites

- ✅ All changes tested locally (http://localhost:3000)
- ✅ Database migrations tested
- ✅ No errors in browser console
- ✅ Git repository clean (`git status`)

---

## Step 1: Commit Changes Locally

```powershell
# Check what changed
git status

# Add files (exclude .env, docker-compose.yml - already in .gitignore)
git add .

# Commit with clear message
git commit -m "Add Employee Management submodule - Termination, Promotion, etc."

# Push to GitHub
git push origin main
```

---

## Step 2: Deploy to Production Server

### Option A: Using Deployment Script (RECOMMENDED)

```bash
# SSH to server
ssh root@nc-ph-4747.mysol360.com

# Navigate to project
cd /root/hris-app

# Run safe deployment script
bash ./deployment/sync-to-production.sh

# Check containers
docker-compose -f docker-compose.prod.yml ps
```

### Option B: Manual Deployment

```bash
# SSH to server
ssh root@nc-ph-4747.mysol360.com

# Navigate to project
cd /root/hris-app

# Pull changes
git pull origin main

# Rebuild containers (if needed)
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec laravel-api php artisan migrate

# Clear caches
docker-compose -f docker-compose.prod.yml exec laravel-api php artisan config:clear
docker-compose -f docker-compose.prod.yml exec laravel-api php artisan cache:clear
docker-compose -f docker-compose.prod.yml exec laravel-api php artisan route:clear
```

---

## Step 3: Run Database Migrations on Production

```bash
# SSH to server
ssh root@nc-ph-4747.mysol360.com

cd /root/hris-app

# Run migrations
docker-compose -f docker-compose.prod.yml exec laravel-api php artisan migrate

# If migration fails, rollback
docker-compose -f docker-compose.prod.yml exec laravel-api php artisan migrate:rollback
```

---

## Step 4: Verify Production Deployment

### Check these URLs:

- ✅ Frontend: https://mysol360.com
- ✅ API Health: https://mysol360.com/api/health
- ✅ New Feature: https://mysol360.com/employee-management

### Check Logs:

```bash
# Frontend logs
docker-compose -f docker-compose.prod.yml logs -f nextjs-frontend

# Backend logs
docker-compose -f docker-compose.prod.yml logs -f laravel-api
```

---

## 🚨 Important Files That Are NEVER Deployed

These are excluded in `.gitignore` and deployment script:

- ❌ `backend/.env` (production has its own)
- ❌ `docker-compose.yml` (local dev only)
- ❌ `docker-compose.dev.yml` (local dev only)
- ❌ All `*.md` documentation files (local reference only)
- ❌ `node_modules/`, `vendor/`

---

## 📞 Emergency Rollback

If something breaks:

```bash
# SSH to server
ssh root@nc-ph-4747.mysol360.com

cd /root/hris-app

# Rollback git
git log --oneline  # Find previous commit hash
git reset --hard <previous-commit-hash>

# Restart containers
docker-compose -f docker-compose.prod.yml restart

# Rollback database
docker-compose -f docker-compose.prod.yml exec laravel-api php artisan migrate:rollback
```

---

## 📚 Related Documentation Files

- `DEVELOPMENT_WORKFLOW.md` - Full development process
- `QUICK_REFERENCE.md` - Quick commands reference
- `deployment/sync-to-production.sh` - Safe deployment script
- `COMPLETE_SYSTEM_STATUS.md` - Production server details

---

## Production Server Details

- **Host**: nc-ph-4747.mysol360.com
- **Domain**: mysol360.com
- **Database**: mysol360_hrm_db
- **DB User**: mysol360_hrm_user
- **Project Path**: /root/hris-app
- **Docker Compose**: docker-compose.prod.yml
- **Containers**: Laravel API (Apache), Next.js, MySQL, Redis, nginx-proxy

---

## Post-Deployment Testing Checklist

- [ ] Can login to https://mysol360.com
- [ ] Health page shows all green: https://mysol360.com/health
- [ ] New Employee Management module accessible
- [ ] Can create/edit/delete records
- [ ] Excel upload works
- [ ] No errors in browser console (F12)
- [ ] Check Laravel logs for errors

---

**Last Updated**: November 19, 2025
