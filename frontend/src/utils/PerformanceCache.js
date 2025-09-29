/**
 * 🚀 Performance Cache Manager
 * Smart browser caching with progressive loading for better UX
 */

class PerformanceCache {
    constructor() {
        this.cache = new Map();
        this.localStorage = window.localStorage;
        this.sessionStorage = window.sessionStorage;
        this.cachePrefix = 'hrm_cache_';
        this.statsPrefix = 'hrm_stats_';
        this.maxAge = 5 * 60 * 1000; // 5 minutes default
        this.criticalDataAge = 15 * 60 * 1000; // 15 minutes for critical data
    }

    /**
     * Get cached data with fallback to fresh fetch
     */
    async get(key, fetchFunction, options = {}) {
        const {
            maxAge = this.maxAge,
            useLocalStorage = false,
            priority = 'normal' // 'high', 'normal', 'low'
        } = options;

        const cacheKey = this.cachePrefix + key;
        const cached = this.getCachedData(cacheKey, useLocalStorage);

        // Return cached data if valid
        if (cached && !this.isExpired(cached, maxAge)) {
            console.log(`📦 Cache HIT for ${key}`);
            return cached.data;
        }

        // Show loading state for high priority data
        if (priority === 'high') {
            this.showProgressiveLoader(key);
        }

        try {
            console.log(`🔄 Cache MISS for ${key} - fetching fresh data`);
            const freshData = await fetchFunction();
            
            // Cache the fresh data
            this.set(cacheKey, freshData, useLocalStorage);
            
            // Hide loader
            if (priority === 'high') {
                this.hideProgressiveLoader(key);
            }

            return freshData;
        } catch (error) {
            // Hide loader on error
            if (priority === 'high') {
                this.hideProgressiveLoader(key);
            }

            // Return stale data if available
            if (cached) {
                console.warn(`⚠️ Using stale cache for ${key} due to fetch error:`, error);
                return cached.data;
            }
            throw error;
        }
    }

    /**
     * Set data in cache
     */
    set(key, data, useLocalStorage = false) {
        const cacheData = {
            data,
            timestamp: Date.now(),
            version: '1.0'
        };

        // Memory cache
        this.cache.set(key, cacheData);

        // Persistent cache
        try {
            const storage = useLocalStorage ? this.localStorage : this.sessionStorage;
            storage.setItem(key, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Cache storage failed:', e);
        }
    }

    /**
     * Get cached data from memory or storage
     */
    getCachedData(key, useLocalStorage = false) {
        // Check memory cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // Check persistent storage
        try {
            const storage = useLocalStorage ? this.localStorage : this.sessionStorage;
            const cached = storage.getItem(key);
            if (cached) {
                const parsed = JSON.parse(cached);
                // Update memory cache
                this.cache.set(key, parsed);
                return parsed;
            }
        } catch (e) {
            console.warn('Cache retrieval failed:', e);
        }

        return null;
    }

    /**
     * Check if cached data is expired
     */
    isExpired(cached, maxAge) {
        return Date.now() - cached.timestamp > maxAge;
    }

    /**
     * Progressive loader for better UX
     */
    showProgressiveLoader(key) {
        // Create or show skeleton loader
        const loaderId = `loader_${key}`;
        let loader = document.getElementById(loaderId);
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = loaderId;
            loader.className = 'progressive-loader';
            loader.innerHTML = `
                <div class="skeleton-card">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text short"></div>
                </div>
            `;
        }

        // Insert into appropriate container
        const container = document.querySelector(`[data-cache-key="${key}"]`);
        if (container) {
            container.appendChild(loader);
        }
    }

    /**
     * Hide progressive loader
     */
    hideProgressiveLoader(key) {
        const loaderId = `loader_${key}`;
        const loader = document.getElementById(loaderId);
        if (loader) {
            loader.remove();
        }
    }

    /**
     * Cache dashboard statistics with smart updates
     */
    async getCachedStats(statsKey, fetchFunction, options = {}) {
        const {
            backgroundRefresh = true,
            showStale = true
        } = options;

        const cached = await this.get(
            this.statsPrefix + statsKey,
            fetchFunction,
            {
                maxAge: this.criticalDataAge,
                useLocalStorage: true,
                priority: 'high'
            }
        );

        // Background refresh for next time
        if (backgroundRefresh) {
            setTimeout(async () => {
                try {
                    const fresh = await fetchFunction();
                    this.set(this.statsPrefix + statsKey, fresh, true);
                    // Dispatch event for components to update
                    window.dispatchEvent(new CustomEvent('stats-updated', {
                        detail: { key: statsKey, data: fresh }
                    }));
                } catch (e) {
                    console.warn('Background stats refresh failed:', e);
                }
            }, 1000);
        }

        return cached;
    }

    /**
     * Preload critical data
     */
    async preloadCriticalData(preloadList) {
        const promises = preloadList.map(async ({ key, fetchFunction, options }) => {
            try {
                await this.get(key, fetchFunction, { ...options, priority: 'high' });
            } catch (e) {
                console.warn(`Preload failed for ${key}:`, e);
            }
        });

        await Promise.allSettled(promises);
    }

    /**
     * Clear expired cache entries
     */
    clearExpired() {
        const now = Date.now();
        
        // Clear memory cache
        for (const [key, cached] of this.cache.entries()) {
            if (this.isExpired(cached, this.maxAge)) {
                this.cache.delete(key);
            }
        }

        // Clear storage cache
        [this.localStorage, this.sessionStorage].forEach(storage => {
            try {
                for (let i = storage.length - 1; i >= 0; i--) {
                    const key = storage.key(i);
                    if (key && key.startsWith(this.cachePrefix)) {
                        const cached = JSON.parse(storage.getItem(key));
                        if (this.isExpired(cached, this.maxAge)) {
                            storage.removeItem(key);
                        }
                    }
                }
            } catch (e) {
                console.warn('Cache cleanup failed:', e);
            }
        });
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        
        [this.localStorage, this.sessionStorage].forEach(storage => {
            try {
                for (let i = storage.length - 1; i >= 0; i--) {
                    const key = storage.key(i);
                    if (key && (key.startsWith(this.cachePrefix) || key.startsWith(this.statsPrefix))) {
                        storage.removeItem(key);
                    }
                }
            } catch (e) {
                console.warn('Cache clear failed:', e);
            }
        });
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            memoryEntries: this.cache.size,
            localStorageEntries: Object.keys(this.localStorage).filter(k => 
                k.startsWith(this.cachePrefix) || k.startsWith(this.statsPrefix)
            ).length,
            sessionStorageEntries: Object.keys(this.sessionStorage).filter(k => 
                k.startsWith(this.cachePrefix) || k.startsWith(this.statsPrefix)
            ).length
        };
    }
}

// Global instance
window.performanceCache = new PerformanceCache();

// Auto-cleanup every 10 minutes
setInterval(() => {
    window.performanceCache.clearExpired();
}, 10 * 60 * 1000);

export default PerformanceCache;