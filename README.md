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
- ✅ **Visual Template Builder** ✨ NEW!
- 🎯 AWS Production Ready

### ✨ Visual Template Builder

Modern drag-and-drop interface for creating salary calculation templates:

- **Drag & Drop Components**: 13 pre-configured salary components (allowances, deductions, statutory)
- **Real-Time Preview**: See calculations update as you build
- **Template Library**: 4 pre-built templates (Senior Manager, Mid-Level, Entry Level, Executive)
- **Visual Formula Builder**: Create formulas without technical knowledge
- **Attendance Integration**: Automatic proration based on attendance
- **No Technical Skills Required**: Intuitive interface for HR staff

📖 **[Complete Guide](./VISUAL_TEMPLATE_BUILDER_GUIDE.md)** | 🎨 **[See Component Structure](#visual-template-builder)**

## 🚀 **UPCOMING MAJOR ENHANCEMENTS** (Oct 2-20, 2025)

### 📊 **Enhanced Attendance-Based Invoicing System**

> **🎯 Management Impact**: Automate 2000+ staff invoicing, eliminate manual errors, reduce processing time by 90%

| Feature                             | Business Value                              | Timeline   | Status         |
| ----------------------------------- | ------------------------------------------- | ---------- | -------------- |
| **🤖 Auto Pay Grade Matching**      | Eliminate manual salary entry for all staff | Days 2-4   | 🔄 **Phase 1** |
| **👁️ Invoice Preview & Editing**    | 95% error reduction before generation       | Days 5-8   | ⏳ **Phase 2** |
| **📋 Supplementary Invoice System** | Handle missed staff automatically           | Days 9-13  | ⏳ **Phase 3** |
| **🎯 Template-Driven Calculations** | Zero calculation errors, centralized logic  | Days 14-15 | ⏳ **Phase 4** |
| **🔍 End-to-End Testing**           | Production-ready quality assurance          | Days 16-18 | ⏳ **Phase 5** |

### 💼 **Quantified Business Impact**

| Current Challenge                                 | Enhanced Solution                                | Measurable Benefit          |
| ------------------------------------------------- | ------------------------------------------------ | --------------------------- |
| Manual salary entry for 2000+ staff               | Automatic employee code → pay grade matching     | **90% time reduction**      |
| Invoice errors discovered after generation        | Real-time preview with correction capabilities   | **95% error elimination**   |
| Missed staff require manual intervention          | Automated detection and supplementary processing | **100% staff coverage**     |
| Template inconsistencies cause calculation errors | Centralized template validation system           | **Zero calculation errors** |

### 📋 **Implementation Progress Tracking**

- **Total Tasks**: 139 across 6 phases
- **Current Phase**: Phase 0 - Foundation Corrections
- **Completion Target**: October 20, 2025
- **Progress Monitoring**: [View Detailed Tracker](./ENHANCED_INVOICING_IMPLEMENTATION_TRACKER.md)

### 🎯 **Management Benefits**

1. **Operational Efficiency**: 90% reduction in invoicing preparation time
2. **Quality Assurance**: Near-zero invoicing errors through preview system
3. **Scalability**: Handle unlimited staff growth without additional manual effort
4. **Audit Trail**: Complete tracking of all invoice modifications and approvals
5. **Cost Reduction**: Eliminate invoice corrections and re-processing

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

## 🚀 Quick Start (Port Conflict-Free!)

### **Automatic Setup (Recommended)**

```powershell
# 1. Clone repository
git clone https://github.com/SOL-ICT/hrm-erp.git
cd hrm-erp

# 2. Auto-detect and configure environment
.\deploy-environment.ps1

# 3. Access application (URLs shown after setup)
```

### **Manual Setup**

```bash
# Development (safe ports)
docker-compose -f docker-compose.dev.yml up -d

# Production (modified ports for Apache compatibility)
docker-compose up -d
```

## Links

**Development Environment:**

- Frontend: http://localhost:3001 (conflict-free)
- Backend API: http://localhost:8001/api (conflict-free)
- phpMyAdmin: http://localhost:8082 (conflict-free)

**Production Environment:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- phpMyAdmin: http://localhost:8081

**Documentation:**

- Performance Guide: [PERFORMANCE_README.md](./PERFORMANCE_README.md)
- **📋 Implementation Tracker**: [ENHANCED_INVOICING_IMPLEMENTATION_TRACKER.md](./ENHANCED_INVOICING_IMPLEMENTATION_TRACKER.md)
- **📚 Documentation Guide**: [PROJECT_DOCUMENTATION_REFERENCE.md](./PROJECT_DOCUMENTATION_REFERENCE.md)
- **🛠️ Deployment Guide**: [COMPREHENSIVE_DEPLOYMENT_GUIDE.md](./COMPREHENSIVE_DEPLOYMENT_GUIDE.md)
