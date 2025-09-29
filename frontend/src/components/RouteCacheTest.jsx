/**
 * Route Cache Test Component
 * Shows real-time caching status and navigation performance
 */

"use client";

import React, { useState, useEffect } from 'react';

const RouteCacheTest = ({ currentRoute }) => {
  const [cacheStatus, setCacheStatus] = useState({});
  const [lastNavigation, setLastNavigation] = useState(null);
  const [navHistory, setNavHistory] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed

  useEffect(() => {
    // Listen for instant render events
    const handleInstantRender = (event) => {
      const { routeKey, cached } = event.detail;
      console.log('🧪 RouteCacheTest received instant render:', event.detail);
      setLastNavigation({
        route: routeKey,
        cached,
        timestamp: Date.now(),
        type: 'instant'
      });

      setNavHistory(prev => [
        { ...event.detail, timestamp: Date.now() },
        ...prev.slice(0, 9)
      ]);
    };

    // Listen for route changes
    const handleRouteChange = (event) => {
      const { toRoute, cached, navigationTime } = event.detail;
      console.log('🧪 RouteCacheTest received route change:', event.detail);
      setLastNavigation({
        route: toRoute,
        cached,
        timestamp: Date.now(),
        navigationTime,
        type: 'navigation'
      });

      setNavHistory(prev => [
        { 
          routeKey: toRoute, 
          cached, 
          navigationTime, 
          timestamp: Date.now(),
          type: 'navigation'
        },
        ...prev.slice(0, 9)
      ]);
    };

    window.addEventListener('instantRender', handleInstantRender);
    window.addEventListener('routeChange', handleRouteChange);

    // Update cache status periodically
    const interval = setInterval(() => {
      if (window.enhancedRouteCache) {
        setCacheStatus(window.enhancedRouteCache.getStats());
      } else if (window.routeCache) {
        setCacheStatus(window.routeCache.getStats());
      }
    }, 1000);

    return () => {
      window.removeEventListener('instantRender', handleInstantRender);
      window.removeEventListener('routeChange', handleRouteChange);
      clearInterval(interval);
    };
  }, []);

  const formatRoute = (route) => {
    const names = {
      'client-master': 'Master Setup',
      'salary-structure': 'Job Function Setup',
      'client-service-location': 'Service Location',
      'recruitment-request': 'Vacancy Declaration',
      'current-vacancies': 'Current Vacancy Invites',
      'dashboard': 'Dashboard'
    };
    return names[route] || route;
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      {/* Collapsible Header */}
      <div 
        className="bg-black/90 text-white p-3 rounded-lg cursor-pointer font-mono text-xs border-2 border-blue-500/30 hover:border-blue-500/60 transition-all"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between space-x-3">
          <div className="flex items-center space-x-2">
            <div className="text-lg">
              {isCollapsed ? '📦' : '📊'}
            </div>
            <div>
              <div className="font-bold text-green-400">
                Route Cache {isCollapsed ? `(${cacheStatus.cacheSize || 0})` : 'Status'}
              </div>
              {isCollapsed && (
                <div className="text-gray-400 text-xs">
                  {(cacheStatus.hitRate || 0).toFixed(0)}% hit rate
                  {lastNavigation && (
                    <span className={`ml-2 ${lastNavigation.cached ? 'text-green-400' : 'text-yellow-400'}`}>
                      {lastNavigation.cached ? '⚡' : '🔄'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-gray-400 text-xs">
            {isCollapsed ? '▼' : '▲'}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="mt-2 bg-black/95 text-white p-4 rounded-lg font-mono text-xs min-w-80 max-w-96 border border-gray-700">
          {/* Current Status */}
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-gray-400">Cache Size</div>
              <div className="text-lg font-bold text-blue-400">{cacheStatus.cacheSize || 0}</div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-gray-400">Hit Rate</div>
              <div className="text-lg font-bold text-green-400">{(cacheStatus.hitRate || 0).toFixed(1)}%</div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-gray-400">Instant Renders</div>
              <div className="text-lg font-bold text-purple-400">{cacheStatus.instantRenders || 0}</div>
            </div>
          </div>

          {/* Last Navigation */}
          {lastNavigation && (
            <div className="mb-3 p-2 bg-gray-800 rounded">
              <div className="text-yellow-400 font-semibold">Last Navigation:</div>
              <div className="flex justify-between items-center">
                <div>{formatRoute(lastNavigation.route)}</div>
                <div className={lastNavigation.cached ? 'text-green-400' : 'text-red-400'}>
                  {lastNavigation.cached ? '⚡ INSTANT' : '🔄 Fresh Load'}
                </div>
              </div>
              {lastNavigation.navigationTime && (
                <div className="text-xs text-gray-400">Time: {lastNavigation.navigationTime}ms</div>
              )}
            </div>
          )}

          {/* Navigation History */}
          <div className="mb-3">
            <div className="text-blue-400 font-semibold mb-1">Recent Navigations:</div>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {navHistory.slice(0, 5).map((nav, index) => (
                <div key={index} className="text-xs flex justify-between items-center p-1 bg-gray-900 rounded">
                  <span>{formatRoute(nav.routeKey)}</span>
                  <div className="flex items-center space-x-2">
                    <span className={nav.cached ? 'text-green-400' : 'text-yellow-400'}>
                      {nav.cached ? '⚡' : '🔄'}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {nav.navigationTime ? `${nav.navigationTime}ms` : '0ms'}
                    </span>
                  </div>
                </div>
              ))}
              {navHistory.length === 0 && (
                <div className="text-gray-500 text-center py-2">Navigate to see history</div>
              )}
            </div>
          </div>

          {/* Actions and Test */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Simulate a navigation event for testing
                const event = new CustomEvent('routeChange', {
                  detail: {
                    toRoute: 'client-master',
                    cached: true,
                    navigationTime: 0,
                    timestamp: Date.now()
                  }
                });
                window.dispatchEvent(event);
              }}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              Test Event
            </button>
            <button
              onClick={() => {
                if (window.routeCache) {
                  window.routeCache.clearCache();
                }
                setCacheStatus({});
                setNavHistory([]);
                setLastNavigation(null);
              }}
              className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
            >
              Clear Cache
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-3 text-gray-400 text-xs border-t border-gray-700 pt-2">
            <div className="font-semibold text-yellow-400">Test Instructions:</div>
            <div>1. Navigate: Job Function Setup → Master Setup</div>
            <div>2. Return: Master Setup → Job Function Setup</div>
            <div>3. Look for ⚡ INSTANT indicator on return!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteCacheTest;