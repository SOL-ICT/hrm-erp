# 🚀 Simplified Docker Setup

## ✅ What Changed

We've **consolidated** the two Docker Compose files (`docker-compose.yml` and `docker-compose.dev.yml`) into a **single, optimized configuration** that's perfect for development.

## 🎯 Benefits

- **Single command**: Just `docker-compose up -d` - no more complex multi-file commands
- **Optimized defaults**: All the performance optimizations built in
- **Easier maintenance**: One file to manage instead of two
- **Better developer experience**: No need to remember complex command syntax

## 🚀 Quick Start

```bash
# Start the entire development environment
docker-compose up -d

# Check status
docker-compose ps

# Stop everything
docker-compose down

# View logs
docker-compose logs -f [service-name]
```

## 🌐 Access Points

- **Frontend (Next.js)**: http://localhost:3000
- **Backend API (Laravel)**: http://localhost:8000
- **Database Admin (phpMyAdmin)**: http://localhost:8080
- **Email Testing (MailHog)**: http://localhost:8025
- **MySQL Direct**: localhost:3306
- **Redis**: localhost:6379

## ⚡ Performance Features Included

### Laravel API

- ✅ PHP OPcache enabled for better performance
- ✅ Redis caching for sessions and cache
- ✅ Cached volume mounts for faster file access
- ✅ Optimized Composer autoloader
- ✅ Route/config caching enabled

### Next.js Frontend

- ✅ File watching with polling (works in Docker)
- ✅ Cached volume mounts
- ✅ Anonymous volumes for node_modules and .next
- ✅ Telemetry disabled
- ✅ Chunk error fixes

### MySQL

- ✅ Performance-optimized configuration
- ✅ 256MB buffer pool
- ✅ Reduced sync overhead
- ✅ Disabled slow query log for dev

### Redis

- ✅ Memory-limited (256MB)
- ✅ LRU eviction policy
- ✅ Persistence enabled

## 📝 Environment Variables

You can override defaults with environment variables:

```bash
# Example: Run in production mode
APP_ENV=production APP_DEBUG=false docker-compose up -d

# Example: Different log level
LOG_LEVEL=debug docker-compose up -d
```

## 🔧 Troubleshooting

### Container won't start

```bash
docker-compose down
docker-compose up -d
```

### Need to rebuild

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check container logs

```bash
docker-compose logs -f laravel-api
docker-compose logs -f nextjs-frontend
```

## 🎉 Migration Complete

The old `docker-compose.dev.yml` file has been removed. Everything is now in the main `docker-compose.yml` file with all optimizations included by default.

**Date**: September 25, 2025  
**Status**: ✅ Production Ready - Simplified Configuration
