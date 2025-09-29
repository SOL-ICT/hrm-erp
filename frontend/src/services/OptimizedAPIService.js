/**
 * 🚀 Optimized API Service with Call Ordering and Smart Caching
 */

class OptimizedAPIService {
    constructor() {
        this.cache = window.performanceCache;
        this.requestQueue = new Map();
        this.priorityQueue = [];
        this.concurrentLimit = 6; // Maximum concurrent requests
        this.activeRequests = 0;
        this.requestHistory = new Map();
    }

    /**
     * Make API request with intelligent caching and call ordering
     */
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            body = null,
            headers = {},
            priority = 'normal', // 'critical', 'high', 'normal', 'low'
            cache = true,
            cacheTime = 5 * 60 * 1000, // 5 minutes
            useLocalStorage = false,
            skipQueue = false
        } = options;

        // Create request configuration
        const config = {
            endpoint,
            method,
            body,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            priority,
            cache,
            cacheTime,
            useLocalStorage,
            timestamp: Date.now()
        };

        // Add auth header if available
        const auth = JSON.parse(localStorage.getItem('auth') || '{}');
        if (auth.access_token) {
            config.headers.Authorization = `Bearer ${auth.access_token}`;
        }

        // Generate cache key
        const cacheKey = this.generateCacheKey(endpoint, method, body);

        // Return cached data for GET requests if available
        if (method === 'GET' && cache) {
            try {
                const cached = await this.getCachedResponse(cacheKey, config);
                if (cached) {
                    this.showCacheIndicator('hit', `${endpoint} (cached)`);
                    return cached;
                }
            } catch (e) {
                console.warn('Cache retrieval failed:', e);
            }
        }

        // Skip queue for critical requests or if queue is disabled
        if (skipQueue || priority === 'critical') {
            return this.executeRequest(config, cacheKey);
        }

        // Add to queue with priority
        return this.enqueueRequest(config, cacheKey);
    }

    /**
     * Execute request with retry logic
     */
    async executeRequest(config, cacheKey, retryCount = 0) {
        const maxRetries = 2;
        this.activeRequests++;

        try {
            console.log(`🔄 API ${config.method} ${config.endpoint} (attempt ${retryCount + 1})`);
            const startTime = performance.now();

            const response = await fetch(config.endpoint, {
                method: config.method,
                headers: config.headers,
                body: config.body ? JSON.stringify(config.body) : null
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Log performance
            this.logRequestPerformance(config.endpoint, duration, response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache successful GET responses
            if (config.method === 'GET' && config.cache) {
                this.cacheResponse(cacheKey, data, config);
            }

            this.showCacheIndicator('miss', `${config.endpoint} (${Math.round(duration)}ms)`);
            
            return data;

        } catch (error) {
            console.error(`API Error for ${config.endpoint}:`, error);

            // Retry logic
            if (retryCount < maxRetries && this.shouldRetry(error)) {
                await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
                return this.executeRequest(config, cacheKey, retryCount + 1);
            }

            // Try to return stale cache on error
            if (config.method === 'GET' && config.cache) {
                const staleData = await this.getStaleCache(cacheKey);
                if (staleData) {
                    console.warn(`Using stale cache for ${config.endpoint}`);
                    this.showCacheIndicator('error', `${config.endpoint} (stale cache)`);
                    return staleData;
                }
            }

            throw error;
        } finally {
            this.activeRequests--;
            this.processQueue();
        }
    }

    /**
     * Add request to priority queue
     */
    async enqueueRequest(config, cacheKey) {
        return new Promise((resolve, reject) => {
            const queueItem = {
                config,
                cacheKey,
                resolve,
                reject,
                priority: this.getPriorityValue(config.priority),
                timestamp: Date.now()
            };

            // Insert based on priority
            let inserted = false;
            for (let i = 0; i < this.priorityQueue.length; i++) {
                if (queueItem.priority > this.priorityQueue[i].priority) {
                    this.priorityQueue.splice(i, 0, queueItem);
                    inserted = true;
                    break;
                }
            }

            if (!inserted) {
                this.priorityQueue.push(queueItem);
            }

            // Process queue
            this.processQueue();
        });
    }

    /**
     * Process queued requests
     */
    async processQueue() {
        while (this.priorityQueue.length > 0 && this.activeRequests < this.concurrentLimit) {
            const queueItem = this.priorityQueue.shift();
            
            try {
                const result = await this.executeRequest(queueItem.config, queueItem.cacheKey);
                queueItem.resolve(result);
            } catch (error) {
                queueItem.reject(error);
            }
        }
    }

    /**
     * Get cached response if valid
     */
    async getCachedResponse(cacheKey, config) {
        if (!this.cache) return null;

        return this.cache.get(
            cacheKey,
            () => Promise.reject(new Error('Cache miss')),
            {
                maxAge: config.cacheTime,
                useLocalStorage: config.useLocalStorage
            }
        ).catch(() => null);
    }

    /**
     * Cache API response
     */
    cacheResponse(cacheKey, data, config) {
        if (!this.cache) return;

        this.cache.set(cacheKey, data, config.useLocalStorage);
    }

    /**
     * Get stale cache data
     */
    async getStaleCache(cacheKey) {
        if (!this.cache) return null;

        const cached = this.cache.getCachedData(cacheKey);
        return cached ? cached.data : null;
    }

    /**
     * Generate cache key
     */
    generateCacheKey(endpoint, method, body) {
        const bodyStr = body ? JSON.stringify(body) : '';
        return `api_${method}_${endpoint}_${this.hashString(bodyStr)}`;
    }

    /**
     * Hash string for cache key
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Get priority value for sorting
     */
    getPriorityValue(priority) {
        const values = {
            critical: 4,
            high: 3,
            normal: 2,
            low: 1
        };
        return values[priority] || 2;
    }

    /**
     * Check if request should be retried
     */
    shouldRetry(error) {
        const retryableErrors = [
            'NetworkError',
            'timeout',
            'Failed to fetch',
            'ERR_NETWORK'
        ];

        return retryableErrors.some(retryable => 
            error.message.includes(retryable) || 
            error.name.includes(retryable)
        );
    }

    /**
     * Delay function for retry backoff
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Log request performance
     */
    logRequestPerformance(endpoint, duration, status) {
        const key = endpoint.split('?')[0]; // Remove query params for grouping
        
        if (!this.requestHistory.has(key)) {
            this.requestHistory.set(key, {
                requests: [],
                averageTime: 0,
                successRate: 0
            });
        }

        const history = this.requestHistory.get(key);
        history.requests.push({
            duration,
            status,
            timestamp: Date.now()
        });

        // Keep only last 20 requests
        if (history.requests.length > 20) {
            history.requests = history.requests.slice(-20);
        }

        // Calculate metrics
        const successfulRequests = history.requests.filter(r => r.status < 400);
        history.averageTime = successfulRequests.reduce((sum, r) => sum + r.duration, 0) / successfulRequests.length;
        history.successRate = (successfulRequests.length / history.requests.length) * 100;

        // Log slow requests
        if (duration > 3000) {
            console.warn(`🐌 Slow API request: ${endpoint} took ${Math.round(duration)}ms`);
        }
    }

    /**
     * Show cache indicator in UI
     */
    showCacheIndicator(type, message) {
        if (typeof window === 'undefined') return;

        const indicator = document.createElement('div');
        indicator.className = `cache-indicator ${type}`;
        indicator.textContent = message;
        document.body.appendChild(indicator);

        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 2000);
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        const stats = {};
        
        for (const [endpoint, history] of this.requestHistory.entries()) {
            stats[endpoint] = {
                averageTime: Math.round(history.averageTime),
                successRate: Math.round(history.successRate),
                totalRequests: history.requests.length
            };
        }

        return {
            endpoints: stats,
            queueSize: this.priorityQueue.length,
            activeRequests: this.activeRequests,
            cacheStats: this.cache ? this.cache.getCacheStats() : null
        };
    }

    /**
     * Clear all caches and reset
     */
    clearCache() {
        if (this.cache) {
            this.cache.clear();
        }
        this.requestHistory.clear();
    }

    /**
     * Preload critical data
     */
    async preloadCriticalData() {
        const criticalEndpoints = [
            { endpoint: '/api/user', priority: 'critical' },
            { endpoint: '/api/dashboard/stats', priority: 'high' },
            { endpoint: '/api/recruitment/requests?page=1', priority: 'high' }
        ];

        const preloadPromises = criticalEndpoints.map(({ endpoint, priority }) =>
            this.request(endpoint, { priority, cache: true, useLocalStorage: true })
                .catch(error => console.warn(`Preload failed for ${endpoint}:`, error))
        );

        await Promise.allSettled(preloadPromises);
    }
}

// Create global instance
window.optimizedAPI = new OptimizedAPIService();

// Export for ES6 modules
export default OptimizedAPIService;