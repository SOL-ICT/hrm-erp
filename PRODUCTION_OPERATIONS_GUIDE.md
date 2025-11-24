# Production Operations Guide

## HRM-ERP System @ mysol360.com

**Last Updated**: November 17, 2025  
**Environment**: Production  
**Stack**: Docker, Laravel, Next.js, MySQL, Redis, Nginx

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Docker Restart Guidelines](#docker-restart-guidelines)
3. [Automated Recovery](#automated-recovery)
4. [Monitoring & Health Checks](#monitoring--health-checks)
5. [Troubleshooting](#troubleshooting)
6. [Backup & Recovery](#backup--recovery)
7. [Emergency Procedures](#emergency-procedures)

---

## Daily Operations

### ✅ What Runs Automatically

**Cron Jobs (Already Configured):**

- **2:00 AM** - Nginx config auto-fix (if cPanel overwrites it)
- **2:00 AM** - cPanel daily backup
- **3:00 AM** - Database backup (after security hardening)

**Docker Auto-Restart:**
All containers are configured with `restart: unless-stopped`, meaning:

- ✅ Auto-restart if container crashes
- ✅ Auto-restart after server reboot
- ✅ Won't restart if manually stopped

### 📊 Daily Health Check (Manual - 5 minutes)

Run these commands once per day in MobaXterm:

```bash
# 1. Check all containers are running
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Expected output:
# nginx-proxy        Up X hours (healthy)     0.0.0.0:8080->80/tcp
# hrm-nextjs-frontend Up X hours (healthy)    127.0.0.1:3000->3000/tcp
# hrm-laravel-api    Up X hours (healthy)     127.0.0.1:8000->8000/tcp
# hrm-redis          Up X hours (healthy)     127.0.0.1:6379->6379/tcp
# hrm-mysql          Up X hours (healthy)     127.0.0.1:3306->3306/tcp

# 2. Test application health
curl https://mysol360.com/api/health
# Should return: {"status":"ok","database":"connected"}

# 3. Check disk space
df -h /
# Should have >10GB free

# 4. Check recent errors (last 24 hours)
docker compose -f /root/hris-app/docker-compose.prod.yml logs --since 24h | grep -i error | wc -l
# Should be 0 or very low
```

**If all checks pass: ✅ System healthy - no action needed**

---

## Docker Restart Guidelines

### ❓ Should You Restart Docker in Production?

**SHORT ANSWER**: Only when absolutely necessary.

### When to Restart Docker

| Scenario                  | Restart Docker?                      | Frequency                  |
| ------------------------- | ------------------------------------ | -------------------------- |
| **Normal operation**      | ❌ Never                             | N/A                        |
| **Containers crashed**    | ❌ No - use `docker compose restart` | As needed                  |
| **After server updates**  | ⚠️ Maybe                             | After OS updates only      |
| **Networking issues**     | ✅ Yes                               | Rare (iptables corruption) |
| **Docker daemon update**  | ✅ Yes                               | When Docker updates        |
| **Memory leak suspected** | ✅ Yes                               | Very rare                  |

### ✅ Safe Restart Procedure (Minimal Downtime)

**When you MUST restart Docker:**

```bash
# 1. Notify users (5-10 minutes downtime expected)

# 2. Restart Docker daemon
systemctl restart docker

# 3. Wait for Docker to initialize
sleep 10

# 4. Restart all containers
cd /root/hris-app
docker compose -f docker-compose.prod.yml up -d

# 5. Verify all containers are running
docker ps

# 6. Test application
curl https://mysol360.com/api/health
curl https://mysol360.com/login  # Should return HTML

# 7. Check logs for errors
docker compose -f docker-compose.prod.yml logs --tail=50
```

**Total downtime: ~2-3 minutes**

### 🔧 Better Alternative: Restart Individual Containers

Instead of restarting Docker, restart specific containers:

```bash
cd /root/hris-app

# Restart single container (zero downtime for others)
docker compose -f docker-compose.prod.yml restart laravel-api

# Restart all containers (better than restarting Docker)
docker compose -f docker-compose.prod.yml restart

# Force rebuild and restart (if code changed)
docker compose -f docker-compose.prod.yml up -d --build
```

### 📅 Recommended Maintenance Schedule

| Task               | Frequency                  | Downtime |
| ------------------ | -------------------------- | -------- |
| Health check       | Daily                      | 0 min    |
| Container restart  | As needed                  | 1-2 min  |
| Docker restart     | Monthly (or after updates) | 3-5 min  |
| Full system reboot | Quarterly                  | 5-10 min |
| Security updates   | Weekly                     | 0-5 min  |

---

## Automated Recovery

### 🤖 Auto-Recovery Features (Already Configured)

**1. Container Auto-Restart**

```yaml
# In docker-compose.prod.yml
restart: unless-stopped
```

- Containers automatically restart if they crash
- Containers start on server boot
- No manual intervention needed

**2. Nginx Config Auto-Fix (Cron Job)**

```bash
# Runs daily at 2 AM
0 2 * * * /root/fix-nginx-docker-proxy-auto.sh >> /var/log/nginx-docker-fix.log 2>&1
```

- Checks if cPanel overwrote Nginx config
- Automatically restores Docker proxy config
- Logs all changes to `/var/log/nginx-docker-fix.log`

**3. Health Checks**
Each container has built-in health monitoring:

- **Laravel**: Checks every 30 seconds
- **Next.js**: Checks every 30 seconds
- **MySQL**: Checks every 20 seconds
- **Redis**: Checks every 10 seconds
- **Nginx-proxy**: Checks every 30 seconds

### 🆕 New: nginx-proxy in Docker Compose

**Before (Manual):**

```bash
# Had to manually recreate nginx-proxy after crashes
docker run -d --name nginx-proxy ...
```

**After (Automatic):**

```bash
# nginx-proxy now managed by docker-compose
docker compose -f docker-compose.prod.yml up -d
```

**Benefits:**

- ✅ Auto-restarts with other containers
- ✅ Always on correct network
- ✅ Configuration versioned in git
- ✅ Easy to update and deploy

### 📦 Deploying Updated docker-compose.prod.yml

**On the server (via MobaXterm):**

```bash
cd /root/hris-app

# 1. Stop nginx-proxy container created manually
docker stop nginx-proxy
docker rm nginx-proxy

# 2. Update docker-compose.prod.yml
# (Upload new file from local machine or edit directly)

# 3. Start all containers including new nginx-proxy
docker compose -f docker-compose.prod.yml up -d

# 4. Verify
docker ps
curl https://mysol360.com/api/health
```

---

## Monitoring & Health Checks

### 🔍 Quick Status Commands

```bash
# Container status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Container resource usage
docker stats --no-stream

# Logs (last 50 lines)
docker compose -f /root/hris-app/docker-compose.prod.yml logs --tail=50

# Logs (follow real-time)
docker compose -f /root/hris-app/docker-compose.prod.yml logs -f

# Specific container logs
docker logs hrm-laravel-api --tail=100

# Check for errors in last hour
docker compose -f /root/hris-app/docker-compose.prod.yml logs --since 1h | grep -i error
```

### 📈 Key Metrics to Monitor

**Weekly Check (5 minutes):**

```bash
# 1. Disk usage
df -h
# Should have >10GB free

# 2. Memory usage
free -h
# Should have >1GB free

# 3. Container uptime
docker ps --format "table {{.Names}}\t{{.Status}}"
# All should show "Up X days"

# 4. Database size
docker exec hrm-mysql mysql -u mysol360_hrm_user -pTealharmony@123 -e "
SELECT
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'mysol360_hrm_db'
GROUP BY table_schema;"

# 5. Failed login attempts (security)
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api \
  grep "Failed" storage/logs/laravel.log | tail -20
```

### 🚨 Alert Thresholds

Set up alerts if:

- ❌ Any container status shows "Restarting" for >5 minutes
- ❌ Disk usage >90%
- ❌ Memory usage >90%
- ❌ Failed login attempts >100/hour
- ❌ API response time >3 seconds
- ❌ Database connections >150

---

## Troubleshooting

### 🐛 Common Issues & Solutions

#### Issue 1: "502 Bad Gateway"

**Symptoms:**

```bash
curl https://mysol360.com/api/health
# Returns: 502 Bad Gateway
```

**Diagnosis:**

```bash
# Check if nginx-proxy is running
docker ps | grep nginx-proxy

# Check nginx-proxy logs
docker logs nginx-proxy --tail=50
```

**Solutions:**

**A. nginx-proxy crashed:**

```bash
cd /root/hris-app
docker compose -f docker-compose.prod.yml restart nginx-proxy
```

**B. Laravel container stopped:**

```bash
docker compose -f docker-compose.prod.yml restart laravel-api
```

**C. Network issue:**

```bash
# Check if containers are on same network
docker network inspect hris-app_hrm-network

# Restart all containers
docker compose -f docker-compose.prod.yml restart
```

---

#### Issue 2: Containers Keep Restarting

**Symptoms:**

```bash
docker ps
# Shows: "Restarting (1) 10 seconds ago"
```

**Diagnosis:**

```bash
# Check why it's failing
docker logs hrm-laravel-api --tail=100
```

**Common Causes & Fixes:**

**A. Permission issues:**

```bash
cd /root/hris-app
docker compose -f docker-compose.prod.yml run --rm -u root laravel-api chmod -R 775 storage bootstrap/cache
docker compose -f docker-compose.prod.yml restart laravel-api
```

**B. Database connection failed:**

```bash
# Check if MySQL is healthy
docker ps | grep mysql

# Test connection
docker exec hrm-mysql mysql -u mysol360_hrm_user -pTealharmony@123 -e "SELECT 1;"
```

**C. Config cache corrupted:**

```bash
docker compose -f docker-compose.prod.yml exec laravel-api php artisan cache:clear
docker compose -f docker-compose.prod.yml exec laravel-api php artisan config:clear
docker compose -f docker-compose.prod.yml restart laravel-api
```

---

#### Issue 3: Laravel 500 Error on Login

**Symptoms:**

- Frontend shows "Server Error"
- Browser console: `POST /api/login 500`

**Diagnosis:**

```bash
# Check Laravel logs
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api tail -100 storage/logs/laravel.log
```

**Common Causes:**

**A. Missing APP_KEY:**

```bash
# Generate new key
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api php artisan key:generate

# Update .env file with new key
nano /root/hris-app/backend/.env

# Restart
docker compose -f /root/hris-app/docker-compose.prod.yml restart laravel-api
```

**B. Session/cache issue:**

```bash
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api php artisan cache:clear
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api php artisan config:clear
docker compose -f /root/hris-app/docker-compose.prod.yml exec laravel-api php artisan session:flush
```

---

#### Issue 4: Database Connection Refused

**Symptoms:**

```bash
curl https://mysol360.com/api/health
# Returns: {"database":"error"}
```

**Diagnosis:**

```bash
# Check MySQL status
docker ps | grep mysql

# Check MySQL logs
docker logs hrm-mysql --tail=50
```

**Solutions:**

**A. MySQL not running:**

```bash
docker compose -f /root/hris-app/docker-compose.prod.yml start mysql
```

**B. Wrong credentials:**

```bash
# Verify credentials in .env
cat /root/hris-app/backend/.env | grep DB_

# Test connection manually
docker exec hrm-mysql mysql -u mysol360_hrm_user -pTealharmony@123 mysol360_hrm_db -e "SELECT 1;"
```

**C. MySQL crashed - recover:**

```bash
# Stop container
docker stop hrm-mysql

# Check data integrity
docker run --rm -v hris-app_mysql_prod_data:/data alpine ls -la /data

# Start again
docker compose -f /root/hris-app/docker-compose.prod.yml start mysql
```

---

#### Issue 5: Out of Disk Space

**Symptoms:**

```bash
df -h
# Shows: 100% usage
```

**Quick Fixes:**

```bash
# 1. Clean Docker system
docker system prune -a --volumes
# WARNING: This removes unused images, containers, volumes

# 2. Clean old logs
find /var/log -name "*.log" -type f -mtime +30 -delete

# 3. Clean old backups (keep last 30 days)
find /root/backups/daily -type d -mtime +30 -exec rm -rf {} +

# 4. Check largest directories
du -sh /* | sort -hr | head -20
```

---

## Backup & Recovery

### 💾 Backup Strategy (After Security Hardening)

**Automated Backups (Cron):**

- **Daily**: 3 AM - Full database + configs (keep 30 days)
- **Weekly**: Sunday - Full system backup (keep 12 weeks)
- **Monthly**: 1st of month - Archive backup (keep 12 months)

**Manual Backup (Before Major Changes):**

```bash
# 1. Stop containers
cd /root/hris-app
docker compose -f docker-compose.prod.yml down

# 2. Backup database
docker compose -f docker-compose.prod.yml up -d mysql
sleep 10
docker exec hrm-mysql mysqldump -u mysol360_hrm_user -pTealharmony@123 \
  --single-transaction mysol360_hrm_db | gzip > backup-$(date +%Y%m%d).sql.gz

# 3. Backup application files
tar -czf hrm-app-backup-$(date +%Y%m%d).tar.gz /root/hris-app

# 4. Restart all
docker compose -f docker-compose.prod.yml up -d
```

### 🔄 Disaster Recovery

**Full System Recovery (From backup):**

```bash
# 1. Stop all containers
cd /root/hris-app
docker compose -f docker-compose.prod.yml down

# 2. Restore database
gunzip < backup-YYYYMMDD.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T mysql \
  mysql -u mysol360_hrm_user -pTealharmony@123 mysol360_hrm_db

# 3. Restore application files
tar -xzf hrm-app-backup-YYYYMMDD.tar.gz -C /

# 4. Restart containers
docker compose -f docker-compose.prod.yml up -d

# 5. Verify
curl https://mysol360.com/api/health
```

---

## Emergency Procedures

### 🚨 Emergency Contacts

```
Primary Admin: [Your Name]
Phone: [Your Phone]
Email: [Your Email]

Server Host: nc-ph-4747.mysol360.com
cPanel: https://mysol360.com:2083
SSH Port: 22

Hosting Provider: [Provider Name]
Support Phone: [Support Phone]
```

### ⚡ Quick Recovery Commands

**If Everything is Down:**

```bash
# 1. Check server is accessible
ping mysol360.com

# 2. SSH into server
ssh root@nc-ph-4747.mysol360.com

# 3. Restart all containers
cd /root/hris-app
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# 4. If Docker won't start
systemctl restart docker
sleep 10
cd /root/hris-app
docker compose -f docker-compose.prod.yml up -d

# 5. If still failing, restore from backup
# See Disaster Recovery section above
```

---

## Summary

### ✅ Best Practices

1. **Monitor Daily** - Quick 5-minute health check
2. **Update Weekly** - Apply security updates
3. **Backup Daily** - Automated via cron (after security hardening)
4. **Restart Rarely** - Only restart Docker when necessary
5. **Test Changes** - Always test in staging first
6. **Document Changes** - Keep this guide updated

### 🎯 Key Takeaways

| Question                           | Answer                                           |
| ---------------------------------- | ------------------------------------------------ |
| **Should I restart Docker daily?** | ❌ No - containers auto-restart                  |
| **How often to restart Docker?**   | Monthly or after updates only                    |
| **What runs automatically?**       | Container restarts, Nginx fixes, backups         |
| **What requires manual action?**   | Deployments, major updates, recovery             |
| **How to prevent crashes?**        | Use docker-compose, monitor health, keep updated |

---

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Next Review**: December 17, 2025
