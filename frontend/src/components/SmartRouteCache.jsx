/**
 * Smart Route Cache Component
 * Wrapper that preserves component state and prevents re-mounting
 * when navigating between cached routes
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import routeCache from '@/utils/routeCache';
import { useNavigationTracker } from '@/hooks/useNavigationTracker';

// Routes that should be cached
const CACHEABLE_ROUTES = [
  'client-master',           // Master Setup
  'job-function-setup',      // Job Function Setup  
  'service-location',        // Service Location
  'vacancy-declaration',     // Vacancy Declaration
  'dashboard',              // Dashboard
  'employee-record',        // Employee Record
  'current-vacancies'       // Current Vacancy Invites
];

const SmartRouteCache = ({ children, routeKey, onRouteChange }) => {
  const [isCached, setIsCached] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const componentRef = useRef(null);
  const stateRef = useRef({});
  const lastRenderTime = useRef(Date.now());

  // Track navigation performance
  const { isCached: trackedCached } = useNavigationTracker(routeKey, false);

  // Check if this route should be cached
  const shouldCache = CACHEABLE_ROUTES.includes(routeKey);

  /**
   * Save current component state to cache
   */
  const saveToCache = useCallback(() => {
    if (!shouldCache || !routeKey) return;

    try {
      // Capture current component state
      const componentState = {
        formData: captureFormData(),
        scrollPosition: captureScrollPosition(),
        componentProps: stateRef.current,
        timestamp: Date.now(),
        renderTime: lastRenderTime.current
      };

      // Cache the component
      routeCache.cacheRoute(routeKey, componentRef.current, componentState);
      setIsCached(true);

      console.log(`💾 Saved ${routeKey} to cache with state:`, componentState);
    } catch (error) {
      console.error('Failed to save route to cache:', error);
    }
  }, [routeKey, shouldCache]);

  /**
   * Load component state from cache
   */
  const loadFromCache = useCallback(() => {
    if (!shouldCache || !routeKey) return null;

    const cached = routeCache.getCachedRoute(routeKey);
    if (cached) {
      setIsCached(true);
      
      // Restore component state
      if (cached.state) {
        stateRef.current = cached.state.componentProps || {};
        
        // Restore scroll position after component mounts
        setTimeout(() => {
          if (cached.state.scrollPosition) {
            window.scrollTo(
              cached.state.scrollPosition.x, 
              cached.state.scrollPosition.y
            );
          }
        }, 100);

        // Restore form data
        setTimeout(() => {
          if (cached.state.formData) {
            restoreFormData(cached.state.formData);
          }
        }, 200);
      }

      return cached;
    }

    return null;
  }, [routeKey, shouldCache]);

  /**
   * Capture form data from the current component
   */
  const captureFormData = () => {
    const formData = {};
    
    if (componentRef.current) {
      const forms = componentRef.current.querySelectorAll('form, input, select, textarea');
      
      forms.forEach((element, index) => {
        if (element.tagName === 'FORM') {
          const formElements = new FormData(element);
          const data = {};
          
          for (let [key, value] of formElements.entries()) {
            data[key] = value;
          }
          
          if (Object.keys(data).length > 0) {
            formData[`form_${index}`] = data;
          }
        } else if (element.name && element.value) {
          formData[element.name] = element.value;
        }
      });
    }
    
    return formData;
  };

  /**
   * Capture current scroll position
   */
  const captureScrollPosition = () => {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
  };

  /**
   * Restore form data to the current component
   */
  const restoreFormData = (formData) => {
    if (!componentRef.current || !formData) return;

    Object.entries(formData).forEach(([key, value]) => {
      if (key.startsWith('form_')) {
        // Handle form data
        const formIndex = parseInt(key.split('_')[1]);
        const form = componentRef.current.querySelectorAll('form')[formIndex];
        
        if (form && typeof value === 'object') {
          Object.entries(value).forEach(([fieldName, fieldValue]) => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
              field.value = fieldValue;
              // Trigger change event for React
              const event = new Event('input', { bubbles: true });
              field.dispatchEvent(event);
            }
          });
        }
      } else {
        // Handle individual field data
        const field = componentRef.current.querySelector(`[name="${key}"]`);
        if (field) {
          field.value = value;
          const event = new Event('input', { bubbles: true });
          field.dispatchEvent(event);
        }
      }
    });
  };

  /**
   * Handle route changes
   */
  useEffect(() => {
    // Dispatch route change event for performance monitoring
    const dispatchRouteEvent = (eventType, data) => {
      const event = new CustomEvent(eventType, { detail: data });
      window.dispatchEvent(event);
      console.log(`📡 Event dispatched: ${eventType}`, data);
    };

    if (onRouteChange) {
      onRouteChange(routeKey, isCached);
    }

    // Set up smart preloading for likely next routes
    if (shouldCache) {
      routeCache.setupSmartPreloading(routeKey);
    }

    // Check if loading from cache
    const cached = loadFromCache();
    if (cached) {
      console.log(`⚡ Loaded ${routeKey} from cache - instant navigation!`);
      
      // Dispatch cache hit event
      dispatchRouteEvent('routeChange', {
        fromRoute: 'previous',
        toRoute: routeKey,
        cached: true,
        navigationTime: 0,
        timestamp: Date.now()
      });

      dispatchRouteEvent('instantRender', {
        routeKey,
        cached: true,
        timestamp: Date.now()
      });
    } else {
      // Dispatch fresh load event
      dispatchRouteEvent('routeChange', {
        fromRoute: 'previous',
        toRoute: routeKey,
        cached: false,
        navigationTime: Date.now() - lastRenderTime.current,
        timestamp: Date.now()
      });
    }

    // Save to cache before unmounting
    return () => {
      if (shouldCache) {
        saveToCache();
        
        // Dispatch route exit event
        dispatchRouteEvent('routeExit', {
          routeKey,
          timestamp: Date.now()
        });
      }
    };
  }, [routeKey, onRouteChange, shouldCache, saveToCache, loadFromCache]);

  /**
   * Update render time
   */
  useEffect(() => {
    lastRenderTime.current = Date.now();
  });

  /**
   * Handle visibility changes (browser tab switching)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && shouldCache) {
        // Save state when tab becomes hidden
        saveToCache();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveToCache, shouldCache]);

  if (!shouldCache) {
    // Return children normally for non-cached routes
    return <div>{children}</div>;
  }

  return (
    <div 
      ref={componentRef} 
      className="smart-route-cache"
      data-route={routeKey}
      data-cached={isCached}
      data-preloading={isPreloading}
    >
      {/* Cache indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 left-4 z-50">
          <div className={`px-3 py-1 rounded text-xs font-mono ${
            isCached 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
          }`}>
            {isCached ? '⚡ Cached Route' : '🔄 Fresh Load'} - {routeKey}
          </div>
        </div>
      )}

      {/* Preloading indicator */}
      {isPreloading && (
        <div className="fixed top-12 left-4 z-50">
          <div className="px-3 py-1 rounded text-xs font-mono bg-blue-100 text-blue-800 border border-blue-300">
            📦 Preloading related routes...
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

/**
 * Hook for components to interact with route cache
 */
export const useRouteCache = (routeKey) => {
  const [cacheStats, setCacheStats] = useState(null);

  const refreshCache = useCallback(() => {
    if (routeKey) {
      routeCache.invalidateRoute(routeKey);
    }
  }, [routeKey]);

  const preloadRoutes = useCallback((routes) => {
    routeCache.preloadRoutes(routes);
  }, []);

  useEffect(() => {
    // Get cache statistics
    setCacheStats(routeCache.getStats());
    
    // Update stats periodically
    const interval = setInterval(() => {
      setCacheStats(routeCache.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    cacheStats,
    refreshCache,
    preloadRoutes,
    isRouteCached: routeCache.isRouteCached(routeKey),
    routeCache: window.routeCache
  };
};

export default SmartRouteCache;