/**
 * Enhanced Route Cache with Immediate Rendering
 * Bypasses component loading states for cached routes
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';

class EnhancedRouteCache {
  constructor() {
    this.cache = new Map();
    this.renderCache = new Map(); // Cache actual rendered content
    this.maxCacheSize = 8;
    this.stats = {
      hits: 0,
      misses: 0,
      instantRenders: 0
    };
    
    console.log('🚀 Enhanced Route Cache initialized');
  }

  /**
   * Cache both component and its rendered output
   */
  cacheRoute(routeKey, componentInstance, renderedContent = null) {
    try {
      const cacheEntry = {
        component: componentInstance,
        renderedContent: renderedContent,
        props: this.captureProps(componentInstance),
        state: this.captureComponentState(),
        timestamp: Date.now(),
        accessCount: 1
      };

      // Remove oldest if cache is full
      if (this.cache.size >= this.maxCacheSize) {
        this.evictOldest();
      }

      this.cache.set(routeKey, cacheEntry);
      console.log(`💾 Cached route with rendered content: ${routeKey}`);
      return true;
    } catch (error) {
      console.error('Failed to cache route:', error);
      return false;
    }
  }

  /**
   * Get cached route with immediate rendering capability
   */
  getCachedRoute(routeKey) {
    const cached = this.cache.get(routeKey);
    
    if (cached) {
      cached.accessCount++;
      this.stats.hits++;
      console.log(`⚡ INSTANT render for: ${routeKey}`);
      return cached;
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Capture component props for restoration
   */
  captureProps(componentInstance) {
    if (!componentInstance) return {};
    
    try {
      // Try to extract props from React fiber
      const fiber = componentInstance._reactInternalFiber || 
                   componentInstance._reactInternals;
      
      return fiber?.memoizedProps || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Capture comprehensive component state
   */
  captureComponentState() {
    return {
      scrollPosition: {
        x: window.pageXOffset,
        y: window.pageYOffset
      },
      formData: this.captureAllFormData(),
      documentState: {
        activeElement: document.activeElement?.tagName,
        selection: window.getSelection()?.toString()
      },
      timestamp: Date.now()
    };
  }

  /**
   * Capture all form data on the page
   */
  captureAllFormData() {
    const formData = {};
    
    // Capture all inputs
    document.querySelectorAll('input, select, textarea').forEach((element, index) => {
      if (element.name || element.id) {
        const key = element.name || element.id || `element_${index}`;
        formData[key] = {
          value: element.value,
          type: element.type,
          checked: element.checked,
          selected: element.selected
        };
      }
    });
    
    return formData;
  }

  /**
   * Restore all captured state
   */
  restoreComponentState(cacheEntry) {
    if (!cacheEntry.state) return;

    const { scrollPosition, formData, documentState } = cacheEntry.state;

    // Restore scroll position immediately
    if (scrollPosition) {
      window.scrollTo(scrollPosition.x, scrollPosition.y);
    }

    // Restore form data
    setTimeout(() => {
      if (formData) {
        this.restoreAllFormData(formData);
      }
    }, 50);
  }

  /**
   * Restore all form data
   */
  restoreAllFormData(formData) {
    Object.entries(formData).forEach(([key, data]) => {
      const element = document.querySelector(`[name="${key}"], #${key}`);
      if (element && data.value !== undefined) {
        element.value = data.value;
        
        if (data.checked !== undefined) {
          element.checked = data.checked;
        }
        
        // Trigger React onChange events
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
      }
    });
  }

  evictOldest() {
    const oldest = Array.from(this.cache.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0];
    
    if (oldest) {
      this.cache.delete(oldest[0]);
      console.log(`♻️ Evicted oldest route: ${oldest[0]}`);
    }
  }

  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0
    };
  }
}

// Create enhanced cache instance
const enhancedRouteCache = new EnhancedRouteCache();

/**
 * Instant Route Cache Component
 * Provides immediate rendering for cached routes
 */
const InstantRouteCache = ({ 
  children, 
  routeKey, 
  onCacheHit,
  bypassLoading = true 
}) => {
  const [isInstantRender, setIsInstantRender] = useState(false);
  const [renderContent, setRenderContent] = useState(null);
  const componentRef = useRef(null);
  const mountTime = useRef(Date.now());

  // Check for cached content immediately
  useEffect(() => {
    const cached = enhancedRouteCache.getCachedRoute(routeKey);
    
    if (cached) {
      setIsInstantRender(true);
      
      // Restore state immediately
      enhancedRouteCache.restoreComponentState(cached);
      
      // If we have rendered content, use it
      if (cached.renderedContent) {
        setRenderContent(cached.renderedContent);
      }
      
      if (onCacheHit) {
        onCacheHit(routeKey, cached);
      }
      
      console.log(`⚡ INSTANT LOAD: ${routeKey} (bypassed loading)`);
    }
  }, [routeKey, onCacheHit]);

  // Cache component when unmounting
  useEffect(() => {
    return () => {
      if (routeKey && componentRef.current) {
        // Capture current rendered content
        const renderedContent = componentRef.current.innerHTML;
        
        enhancedRouteCache.cacheRoute(
          routeKey, 
          componentRef.current, 
          renderedContent
        );
      }
    };
  }, [routeKey]);

  // Save state periodically while active
  useEffect(() => {
    if (!isInstantRender) return;

    const interval = setInterval(() => {
      if (componentRef.current) {
        const renderedContent = componentRef.current.innerHTML;
        enhancedRouteCache.cacheRoute(
          routeKey,
          componentRef.current,
          renderedContent
        );
      }
    }, 5000); // Update cache every 5 seconds

    return () => clearInterval(interval);
  }, [isInstantRender, routeKey]);

  return (
    <div 
      ref={componentRef}
      className={`instant-route-cache ${isInstantRender ? 'cached-render' : 'fresh-render'}`}
      data-route={routeKey}
      data-instant={isInstantRender}
      data-mount-time={mountTime.current}
    >
      {/* Instant render indicator */}
      {process.env.NODE_ENV === 'development' && isInstantRender && (
        <div className="fixed top-4 left-4 z-50">
          <div className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold animate-pulse">
            ⚡ INSTANT: {routeKey}
          </div>
        </div>
      )}

      {/* Render cached content if available, otherwise render normally */}
      {renderContent && isInstantRender ? (
        <div dangerouslySetInnerHTML={{ __html: renderContent }} />
      ) : (
        <div>
          {/* Loading bypass for cached routes */}
          {bypassLoading && isInstantRender && (
            <style jsx>{`
              .instant-route-cache .loading,
              .instant-route-cache .spinner,
              .instant-route-cache [class*="loading"],
              .instant-route-cache [class*="spinner"] {
                display: none !important;
              }
            `}</style>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

// Make available globally
if (typeof window !== 'undefined') {
  window.enhancedRouteCache = enhancedRouteCache;
}

export { enhancedRouteCache, InstantRouteCache };
export default InstantRouteCache;