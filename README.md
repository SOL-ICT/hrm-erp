# 🏢 HRM-ERP System

## 🚨 **PERFORMANCE NOTICE** 🚨

> **📖 READ THIS**: [PERFORMANCE_README.md](./PERFORMANCE_README.md) for optimization guides
>
> **Current**: Docker Dev Mode (slower) | **Target**: AWS Production (70% faster)
>
> **🚀 NEW**: Redis caching system implemented - **9x performance improvement!**

---

## Quick Start

```bash
# Standard start
docker-compose up

# 🚀 FASTER startup (recommended)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 📊 Performance Monitoring

- Admin panel has a floating blue **Activity** button (bottom-right)
- Click it to see real-time performance metrics
- Check `PERFORMANCE_README.md` for optimization details
- **NEW**: Redis cache commands for performance testing

## Project Structure

```
hrm-erp/
├── 📋 PERFORMANCE_README.md          # ⚠️ PERFORMANCE GUIDE ⚠️
├── backend/                           # Laravel API (Redis-cached)
├── frontend/                          # Next.js App
├── docker-compose.yml                 # Standard Docker
├── docker-compose.dev.yml             # 🚀 Optimized Docker
└── mysql/                             # Database
```

## Features

- ✅ Location Master with Grouped View
- ✅ Client Management (Fixed field references)
- ✅ Staff Management
- ✅ Authentication & Authorization
- ✅ Performance Monitoring
- ✅ **Redis Caching System (9x faster!)**
- ✅ Service Request Management
- ✅ Recruitment Module (500 errors fixed)
- 🎯 AWS Production Ready

## 🚀 Recent Updates

### Redis Caching Implementation
- **9x performance improvement** (from 17.88ms to 1.99ms average)
- System-wide caching across all modules
- Intelligent cache invalidation with tags
- Performance monitoring tools

### Cache Management Commands
```bash
# Test cache performance
php artisan cache:test-performance --iterations=10

# Warm up cache
php artisan cache:warmup

# View cache statistics  
php artisan cache:stats
```

### Bug Fixes
- Fixed ServiceRequestForm field references (`client_code` → `organisation_name`)
- Resolved recruitment management 500 errors
- Corrected database field mappings

## Development

- **Current**: Docker development with Redis caching (expect sub-2s cached responses)
- **Production**: AWS optimized with Redis clustering (target 0.5-1.5s load times)

## Links

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- phpMyAdmin: http://localhost:8080
- Performance Guide: [PERFORMANCE_README.md](./PERFORMANCE_README.md)
