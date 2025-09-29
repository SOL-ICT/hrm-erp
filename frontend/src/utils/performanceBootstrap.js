/**
 * Import this file in your main App.js or layout.js to enable performance optimizations
 * Add: import './performanceBootstrap';
 */

// Import route cache system
import routeCache from './routeCache';
import { enhancedRouteCache } from '../components/InstantRouteCache';
import loadingOverride from './loadingOverride';

// Import test system for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('./routeCachingTest');
}

// Initialize performance tools when window is available
if (typeof window !== 'undefined') {
  // Initialize route caches
  window.routeCache = routeCache;
  window.enhancedRouteCache = enhancedRouteCache;
  window.loadingOverride = loadingOverride;
  
  // Create simple performance cache
  window.performanceCache = {
    cache: new Map(),
    set(key, data, persistent = false) {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      
      if (persistent) {
        try {
          localStorage.setItem(`perf_${key}`, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Cache storage failed:', e);
        }
      }
    },
    
    get(key, maxAge = 5 * 60 * 1000) {
      // Check memory cache first
      const cached = this.cache.get(key);
      if (cached && (Date.now() - cached.timestamp) < maxAge) {
        return cached.data;
      }
      
      // Check localStorage
      try {
        const stored = localStorage.getItem(`perf_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if ((Date.now() - parsed.timestamp) < maxAge) {
            this.cache.set(key, parsed); // Update memory cache
            return parsed.data;
          }
        }
      } catch (e) {
        console.warn('Cache retrieval failed:', e);
      }
      
      return null;
    },
    
    clear() {
      this.cache.clear();
      // Clear localStorage entries
      try {
        Object.keys(localStorage)
          .filter(key => key.startsWith('perf_'))
          .forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.warn('Cache clear failed:', e);
      }
    },
    
    getCacheStats() {
      return {
        memoryEntries: this.cache.size,
        localStorageEntries: Object.keys(localStorage || {})
          .filter(key => key.startsWith('perf_')).length
      };
    }
  };

  // Create optimized API service
  window.optimizedAPI = {
    async request(endpoint, options = {}) {
      const {
        method = 'GET',
        body = null,
        priority = 'normal',
        cache = true,
        useLocalStorage = false
      } = options;

      // Generate cache key
      const cacheKey = `api_${method}_${endpoint}_${JSON.stringify(body) || ''}`;

      // Return cached data for GET requests
      if (method === 'GET' && cache) {
        const cached = window.performanceCache.get(cacheKey);
        if (cached) {
          console.log(`📦 Cache HIT for ${endpoint}`);
          return { ...cached, _cached: true };
        }
      }

      // Make the request
      console.log(`🔄 API ${method} ${endpoint}`);
      const startTime = performance.now();

      // Get auth token
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      if (auth.access_token) {
        headers.Authorization = `Bearer ${auth.access_token}`;
      }

      try {
        const response = await fetch(endpoint, {
          method,
          headers,
          body: body ? JSON.stringify(body) : null
        });

        const duration = performance.now() - startTime;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful GET responses
        if (method === 'GET' && cache) {
          window.performanceCache.set(cacheKey, data, useLocalStorage);
        }

        console.log(`✅ API ${endpoint} completed in ${Math.round(duration)}ms`);
        return data;

      } catch (error) {
        console.error(`❌ API ${endpoint} failed:`, error);

        // Try to return stale cache on error
        if (method === 'GET' && cache) {
          const staleData = window.performanceCache.get(cacheKey, 24 * 60 * 60 * 1000); // 24 hours
          if (staleData) {
            console.warn(`Using stale cache for ${endpoint}`);
            return { ...staleData, _stale: true };
          }
        }

        throw error;
      }
    },

    async preloadCriticalData() {
      const criticalEndpoints = [
        '/api/user',
        '/api/dashboard/stats'
      ];

      const promises = criticalEndpoints.map(endpoint =>
        this.request(endpoint, { cache: true, useLocalStorage: true })
          .catch(error => console.warn(`Preload failed for ${endpoint}:`, error))
      );

      await Promise.allSettled(promises);
      console.log('📦 Critical data preloaded');
    },

    clearCache() {
      window.performanceCache.clear();
      console.log('🧹 Cache cleared');
    },

    getPerformanceStats() {
      return {
        ...window.performanceCache.getCacheStats(),
        endpoints: {}
      };
    }
  };

  // Preload critical data after initialization
  setTimeout(() => {
    window.optimizedAPI.preloadCriticalData();
  }, 1000);

  console.log('🚀 Performance optimizations initialized');
}

export default {};