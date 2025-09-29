/**
 * Route Cache Manager
 * Keeps React components alive when navigating between routes
 * Prevents unnecessary re-mounting and data re-fetching
 */

class RouteCacheManager {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = new Set();
    this.maxCacheSize = 10; // Maximum cached routes
    this.lastAccessed = new Map();
    this.preloadTimeout = null;
    
    // Performance tracking
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      preloads: 0,
      evictions: 0
    };
    
    console.log('🚀 Route Cache Manager initialized');
  }

  /**
   * Store a component instance with its state
   */
  cacheRoute(routeKey, componentInstance, componentState = {}) {
    try {
      // Remove oldest entries if cache is full
      if (this.cache.size >= this.maxCacheSize) {
        this.evictOldestRoute();
      }

      const cacheEntry = {
        component: componentInstance,
        state: componentState,
        timestamp: Date.now(),
        accessCount: 1,
        scrollPosition: this.captureScrollPosition(),
        formData: this.captureFormData()
      };

      this.cache.set(routeKey, cacheEntry);
      this.lastAccessed.set(routeKey, Date.now());
      
      console.log(`📦 Cached route: ${routeKey}`);
      return true;
    } catch (error) {
      console.error('Failed to cache route:', error);
      return false;
    }
  }

  /**
   * Retrieve a cached component instance
   */
  getCachedRoute(routeKey) {
    const cacheEntry = this.cache.get(routeKey);
    
    if (cacheEntry) {
      // Update access statistics
      cacheEntry.accessCount++;
      this.lastAccessed.set(routeKey, Date.now());
      this.stats.cacheHits++;
      
      console.log(`✅ Cache hit for route: ${routeKey}`);
      
      // Restore scroll position and form data
      this.restoreComponentState(cacheEntry);
      
      return cacheEntry;
    }
    
    this.stats.cacheMisses++;
    console.log(`❌ Cache miss for route: ${routeKey}`);
    return null;
  }

  /**
   * Check if a route is cached
   */
  isRouteCached(routeKey) {
    return this.cache.has(routeKey);
  }

  /**
   * Remove a specific route from cache
   */
  invalidateRoute(routeKey) {
    const deleted = this.cache.delete(routeKey);
    this.lastAccessed.delete(routeKey);
    
    if (deleted) {
      console.log(`🗑️ Invalidated route: ${routeKey}`);
    }
    
    return deleted;
  }

  /**
   * Smart preloading of likely next routes
   */
  preloadRoutes(routeKeys) {
    // Clear existing preload timeout
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }

    // Add to preload queue
    routeKeys.forEach(key => {
      if (!this.cache.has(key)) {
        this.preloadQueue.add(key);
      }
    });

    // Start preloading after a short delay
    this.preloadTimeout = setTimeout(() => {
      this.executePreloading();
    }, 1000);
  }

  /**
   * Execute preloading of queued routes
   */
  async executePreloading() {
    const routesToPreload = Array.from(this.preloadQueue);
    this.preloadQueue.clear();

    for (const routeKey of routesToPreload) {
      if (!this.cache.has(routeKey)) {
        try {
          await this.preloadRoute(routeKey);
          this.stats.preloads++;
        } catch (error) {
          console.warn(`Failed to preload route ${routeKey}:`, error);
        }
      }
    }
  }

  /**
   * Preload a specific route
   */
  async preloadRoute(routeKey) {
    console.log(`⏳ Preloading route: ${routeKey}`);
    
    // Route-specific preloading logic
    const routeMap = {
      'client-master': () => this.preloadMasterSetup(),
      'salary-structure': () => this.preloadJobFunctionSetup(),
      'client-service-location': () => this.preloadServiceLocation(),
      'recruitment-request': () => this.preloadRecruitmentRequest(),
    };

    const preloadFunction = routeMap[routeKey];
    if (preloadFunction) {
      await preloadFunction();
    }
  }

  /**
   * Preload Master Setup data
   */
  async preloadMasterSetup() {
    if (window.optimizedAPI) {
      try {
        // Preload common master setup data
        await Promise.all([
          window.optimizedAPI.request('/api/clients', { cache: true, priority: 'low' }),
          window.optimizedAPI.request('/api/service-types', { cache: true, priority: 'low' }),
          window.optimizedAPI.request('/api/locations', { cache: true, priority: 'low' })
        ]);
        console.log('📋 Master Setup data preloaded');
      } catch (error) {
        console.warn('Failed to preload Master Setup data:', error);
      }
    }
  }

  /**
   * Preload Job Function Setup data
   */
  async preloadJobFunctionSetup() {
    if (window.optimizedAPI) {
      try {
        // Preload job function related data
        await Promise.all([
          window.optimizedAPI.request('/api/job-functions', { cache: true, priority: 'low' }),
          window.optimizedAPI.request('/api/salary-structures', { cache: true, priority: 'low' }),
          window.optimizedAPI.request('/api/grades', { cache: true, priority: 'low' })
        ]);
        console.log('💼 Job Function Setup data preloaded');
      } catch (error) {
        console.warn('Failed to preload Job Function Setup data:', error);
      }
    }
  }

  /**
   * Preload Service Location data
   */
  async preloadServiceLocation() {
    if (window.optimizedAPI) {
      try {
        await Promise.all([
          window.optimizedAPI.request('/api/service-locations', { cache: true, priority: 'low' }),
          window.optimizedAPI.request('/api/clients', { cache: true, priority: 'low' })
        ]);
        console.log('📍 Service Location data preloaded');
      } catch (error) {
        console.warn('Failed to preload Service Location data:', error);
      }
    }
  }

  /**
   * Preload Recruitment Request data
   */
  async preloadRecruitmentRequest() {
    if (window.optimizedAPI) {
      try {
        await Promise.all([
          window.optimizedAPI.request('/api/recruitment-requests', { cache: true, priority: 'low' }),
          window.optimizedAPI.request('/api/clients', { cache: true, priority: 'low' })
        ]);
        console.log('👥 Recruitment Request data preloaded');
      } catch (error) {
        console.warn('Failed to preload Recruitment Request data:', error);
      }
    }
  }

  /**
   * Capture current scroll position
   */
  captureScrollPosition() {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop,
      timestamp: Date.now()
    };
  }

  /**
   * Capture form data from current page
   */
  captureFormData() {
    const forms = document.querySelectorAll('form');
    const formData = {};
    
    forms.forEach((form, index) => {
      const formElements = new FormData(form);
      const data = {};
      
      for (let [key, value] of formElements.entries()) {
        data[key] = value;
      }
      
      if (Object.keys(data).length > 0) {
        formData[`form_${index}`] = data;
      }
    });
    
    return formData;
  }

  /**
   * Restore component state
   */
  restoreComponentState(cacheEntry) {
    // Restore scroll position
    if (cacheEntry.scrollPosition) {
      setTimeout(() => {
        window.scrollTo(cacheEntry.scrollPosition.x, cacheEntry.scrollPosition.y);
      }, 100);
    }
    
    // Restore form data (could be enhanced to restore React form state)
    if (cacheEntry.formData && Object.keys(cacheEntry.formData).length > 0) {
      setTimeout(() => {
        this.restoreFormData(cacheEntry.formData);
      }, 200);
    }
  }

  /**
   * Restore form data
   */
  restoreFormData(formData) {
    Object.entries(formData).forEach(([formKey, data]) => {
      const formIndex = parseInt(formKey.split('_')[1]);
      const form = document.querySelectorAll('form')[formIndex];
      
      if (form) {
        Object.entries(data).forEach(([fieldName, value]) => {
          const field = form.querySelector(`[name="${fieldName}"]`);
          if (field) {
            field.value = value;
          }
        });
      }
    });
  }

  /**
   * Evict oldest route from cache
   */
  evictOldestRoute() {
    let oldestRoute = null;
    let oldestTime = Date.now();
    
    this.lastAccessed.forEach((time, route) => {
      if (time < oldestTime) {
        oldestTime = time;
        oldestRoute = route;
      }
    });
    
    if (oldestRoute) {
      this.invalidateRoute(oldestRoute);
      this.stats.evictions++;
      console.log(`♻️ Evicted oldest route: ${oldestRoute}`);
    }
  }

  /**
   * Set up smart preloading based on current route
   */
  setupSmartPreloading(currentRoute) {
    const preloadMap = {
      'client-master': ['salary-structure', 'client-service-location'], // From Master Setup, likely to visit Job Function Setup
      'salary-structure': ['client-master', 'client-service-location'], // From Job Function Setup, likely to visit Master Setup
      'client-service-location': ['client-master', 'salary-structure'],
      'recruitment-request': ['shortlisted-candidates', 'current-vacancy-invite'],
    };

    const routesToPreload = preloadMap[currentRoute];
    if (routesToPreload) {
      this.preloadRoutes(routesToPreload);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100,
      cachedRoutes: Array.from(this.cache.keys())
    };
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    this.lastAccessed.clear();
    this.preloadQueue.clear();
    
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }
    
    console.log('🗑️ Route cache cleared');
  }
}

// Create global instance
const routeCache = new RouteCacheManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.routeCache = routeCache;
}

export default routeCache;