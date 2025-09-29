/**
 * Navigation Tracker Hook
 * Tracks route changes and dispatches performance events
 */

"use client";

import { useEffect, useRef } from 'react';

export const useNavigationTracker = (currentRoute, isLoading = false) => {
  const lastRoute = useRef(null);
  const navigationStartTime = useRef(null);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    // Track route change
    if (lastRoute.current && lastRoute.current !== currentRoute) {
      const navigationTime = Date.now() - (navigationStartTime.current || mountTime.current);
      const cached = window.routeCache?.isRouteCached(currentRoute) || false;

      // Dispatch custom event for performance monitoring
      const event = new CustomEvent('routeChange', {
        detail: {
          fromRoute: lastRoute.current,
          toRoute: currentRoute,
          navigationTime,
          cached,
          timestamp: Date.now()
        }
      });

      window.dispatchEvent(event);

      console.log(`🧭 Navigation: ${lastRoute.current} → ${currentRoute} (${navigationTime}ms, cached: ${cached})`);
    }

    // Update tracking state
    lastRoute.current = currentRoute;
    if (isLoading) {
      navigationStartTime.current = Date.now();
    }
  }, [currentRoute, isLoading]);

  // Track initial mount
  useEffect(() => {
    if (currentRoute) {
      const cached = window.routeCache?.isRouteCached(currentRoute) || false;
      
      const event = new CustomEvent('routeMount', {
        detail: {
          route: currentRoute,
          cached,
          timestamp: Date.now()
        }
      });

      window.dispatchEvent(event);
    }
  }, []); // Only on mount

  return {
    currentRoute,
    lastRoute: lastRoute.current,
    isCached: window.routeCache?.isRouteCached(currentRoute) || false
  };
};

export default useNavigationTracker;