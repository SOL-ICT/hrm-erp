/**
 * Loading State Bypass Hook
 * Prevents loading indicators for cached routes
 */

"use client";

import { useState, useEffect, useRef } from 'react';

export const useLoadingBypass = (routeKey, dependencies = []) => {
  const [isLoading, setIsLoading] = useState(true);
  const [bypassLoading, setBypassLoading] = useState(false);
  const mountTime = useRef(Date.now());
  const hasCachedData = useRef(false);

  useEffect(() => {
    // Check if route is cached
    const isCached = window.enhancedRouteCache?.getCachedRoute(routeKey) || 
                     window.routeCache?.isRouteCached(routeKey) ||
                     window.performanceCache?.get(`route_${routeKey}`);

    if (isCached) {
      setBypassLoading(true);
      setIsLoading(false);
      hasCachedData.current = true;
      console.log(`🚀 Loading bypassed for cached route: ${routeKey}`);
    } else {
      setBypassLoading(false);
      // Normal loading behavior for fresh routes
      const timer = setTimeout(() => setIsLoading(false), 100);
      return () => clearTimeout(timer);
    }
  }, [routeKey, ...dependencies]);

  // Override loading state for cached routes
  const loading = bypassLoading ? false : isLoading;

  return {
    loading,
    bypassLoading,
    hasCachedData: hasCachedData.current,
    setLoading: bypassLoading ? () => {} : setIsLoading // Prevent loading state changes if bypassed
  };
};

/**
 * Cached Data Hook
 * Returns cached data immediately if available
 */
export const useCachedData = (cacheKey, fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        // Check cache first
        let cachedData = null;
        
        if (window.performanceCache) {
          cachedData = window.performanceCache.get(cacheKey);
        } else if (window.enhancedRouteCache) {
          const cached = window.enhancedRouteCache.getCachedRoute(cacheKey);
          cachedData = cached?.state?.data;
        }

        if (cachedData && mounted) {
          setData(cachedData);
          setFromCache(true);
          setLoading(false);
          setError(null);
          console.log(`📦 Serving cached data for: ${cacheKey}`);
          return;
        }

        // If no cache, fetch fresh data
        setFromCache(false);
        const freshData = await fetchFunction();
        
        if (mounted) {
          setData(freshData);
          setLoading(false);
          setError(null);

          // Cache the fresh data
          if (window.performanceCache) {
            window.performanceCache.set(cacheKey, freshData, true);
          }
          
          console.log(`🔄 Fetched fresh data for: ${cacheKey}`);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [cacheKey, ...dependencies]);

  return { data, loading, error, fromCache };
};

/**
 * Instant Component Hook
 * Makes any component render instantly when cached
 */
export const useInstantComponent = (componentName, routeKey) => {
  const [isInstant, setIsInstant] = useState(false);
  const [cachedProps, setCachedProps] = useState({});

  useEffect(() => {
    // Check if component is cached
    const cached = window.enhancedRouteCache?.getCachedRoute(routeKey);
    
    if (cached) {
      setIsInstant(true);
      setCachedProps(cached.props || {});
      
      // Dispatch instant render event
      window.dispatchEvent(new CustomEvent('instantRender', {
        detail: { componentName, routeKey, cached: true }
      }));
    }
  }, [componentName, routeKey]);

  return {
    isInstant,
    cachedProps,
    shouldBypassLoading: isInstant
  };
};

export default useLoadingBypass;