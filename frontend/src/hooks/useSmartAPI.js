import { useState, useEffect, useCallback } from 'react';
import PerformanceCache from '../utils/PerformanceCache';

/**
 * 🚀 Smart API Hook with Caching and Progressive Loading
 * 
 * Features:
 * - Automatic caching with configurable TTL
 * - Progressive loading with skeleton states
 * - Background refresh for better UX
 * - Error handling with stale data fallback
 * - Call order optimization
 */
export const useSmartAPI = (key, fetchFunction, options = {}) => {
    const {
        maxAge = 5 * 60 * 1000, // 5 minutes
        useLocalStorage = false,
        priority = 'normal',
        backgroundRefresh = true,
        dependencies = []
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromCache, setFromCache] = useState(false);

    const cache = new PerformanceCache();

    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        setError(null);

        try {
            const result = await cache.get(key, fetchFunction, {
                maxAge,
                useLocalStorage,
                priority
            });

            setData(result);
            setFromCache(true);
            setLoading(false);

            // Background refresh if enabled
            if (backgroundRefresh && !showLoading) {
                setTimeout(async () => {
                    try {
                        const fresh = await fetchFunction();
                        cache.set(cache.cachePrefix + key, fresh, useLocalStorage);
                        setData(fresh);
                    } catch (e) {
                        console.warn('Background refresh failed:', e);
                    }
                }, 1000);
            }

        } catch (err) {
            setError(err);
            setLoading(false);
            console.error(`API Error for ${key}:`, err);
        }
    }, [key, fetchFunction, maxAge, useLocalStorage, priority, backgroundRefresh]);

    useEffect(() => {
        fetchData();
    }, [fetchData, ...dependencies]);

    const refresh = useCallback(() => {
        // Clear cache and fetch fresh
        cache.cache.delete(cache.cachePrefix + key);
        fetchData();
    }, [cache, key, fetchData]);

    const refetchInBackground = useCallback(() => {
        fetchData(false);
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        fromCache,
        refresh,
        refetchInBackground
    };
};

/**
 * 🏆 Dashboard Statistics Hook with Smart Caching
 */
export const useDashboardStats = (filters = {}) => {
    const fetchStats = useCallback(async () => {
        const response = await fetch('/api/dashboard/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))?.access_token}`
            },
            body: JSON.stringify(filters)
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }

        return response.json();
    }, [filters]);

    return useSmartAPI(
        `dashboard_stats_${JSON.stringify(filters)}`,
        fetchStats,
        {
            maxAge: 15 * 60 * 1000, // 15 minutes for stats
            useLocalStorage: true,
            priority: 'high',
            backgroundRefresh: true,
            dependencies: [JSON.stringify(filters)]
        }
    );
};

/**
 * 📋 Recruitment Requests Hook with Pagination Cache
 */
export const useRecruitmentRequests = (page = 1, filters = {}) => {
    const fetchRequests = useCallback(async () => {
        const params = new URLSearchParams({
            page,
            ...filters
        });

        const response = await fetch(`/api/recruitment/requests?${params}`, {
            headers: {
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))?.access_token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recruitment requests');
        }

        return response.json();
    }, [page, filters]);

    return useSmartAPI(
        `recruitment_requests_p${page}_${JSON.stringify(filters)}`,
        fetchRequests,
        {
            maxAge: 2 * 60 * 1000, // 2 minutes for dynamic data
            useLocalStorage: false,
            priority: 'normal',
            dependencies: [page, JSON.stringify(filters)]
        }
    );
};

/**
 * 👥 Candidates Hook with Smart Caching
 */
export const useCandidates = (recruitmentRequestId, page = 1) => {
    const fetchCandidates = useCallback(async () => {
        const response = await fetch(`/api/recruitment/requests/${recruitmentRequestId}/candidates?page=${page}`, {
            headers: {
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))?.access_token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch candidates');
        }

        return response.json();
    }, [recruitmentRequestId, page]);

    return useSmartAPI(
        `candidates_rr${recruitmentRequestId}_p${page}`,
        fetchCandidates,
        {
            maxAge: 5 * 60 * 1000, // 5 minutes
            useLocalStorage: false,
            priority: 'normal',
            dependencies: [recruitmentRequestId, page]
        }
    );
};

/**
 * 🧪 Test Management Hook with Caching
 */
export const useTestManagement = () => {
    const fetchTestData = useCallback(async () => {
        const [tests, questions, assignments] = await Promise.all([
            fetch('/api/tests', {
                headers: {
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))?.access_token}`
                }
            }).then(r => r.json()),
            
            fetch('/api/test-questions', {
                headers: {
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))?.access_token}`
                }
            }).then(r => r.json()),
            
            fetch('/api/test-assignments', {
                headers: {
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))?.access_token}`
                }
            }).then(r => r.json())
        ]);

        return { tests, questions, assignments };
    }, []);

    return useSmartAPI(
        'test_management_data',
        fetchTestData,
        {
            maxAge: 10 * 60 * 1000, // 10 minutes for admin data
            useLocalStorage: true,
            priority: 'high'
        }
    );
};

/**
 * 🔧 Cache Management Hook
 */
export const useCacheManager = () => {
    const cache = new PerformanceCache();

    const clearCache = useCallback(() => {
        cache.clear();
    }, [cache]);

    const getCacheStats = useCallback(() => {
        return cache.getCacheStats();
    }, [cache]);

    const preloadCriticalData = useCallback(async () => {
        const criticalData = [
            {
                key: 'dashboard_stats_{}',
                fetchFunction: async () => {
                    const response = await fetch('/api/dashboard/stats', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))?.access_token}`
                        },
                        body: JSON.stringify({})
                    });
                    return response.json();
                },
                options: { priority: 'high', useLocalStorage: true }
            },
            {
                key: 'recruitment_requests_p1_{}',
                fetchFunction: async () => {
                    const response = await fetch('/api/recruitment/requests?page=1', {
                        headers: {
                            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))?.access_token}`
                        }
                    });
                    return response.json();
                },
                options: { priority: 'high' }
            }
        ];

        await cache.preloadCriticalData(criticalData);
    }, [cache]);

    return {
        clearCache,
        getCacheStats,
        preloadCriticalData
    };
};