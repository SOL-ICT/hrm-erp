/**
 * Navigation Performance Monitor
 * Real-time monitoring and visualization of route caching performance
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useRouteCache } from './SmartRouteCache';

const NavigationPerformanceMonitor = ({ currentRoute, position = 'bottom-right' }) => {
  const [metrics, setMetrics] = useState({
    navigationTimes: [],
    cacheHitRate: 0,
    avgLoadTime: 0,
    totalNavigations: 0,
    lastNavigationTime: null,
    routeStats: {}
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentNavigations, setRecentNavigations] = useState([]);
  const { cacheStats } = useRouteCache(currentRoute);

  /**
   * Track navigation performance
   */
  useEffect(() => {
    const trackNavigation = (routeKey, cached = false, navigationTime = 0) => {
      const timestamp = Date.now();

      setMetrics(prev => {
        const newNavigations = [...prev.navigationTimes, navigationTime].slice(-20); // Keep last 20
        const avgTime = newNavigations.reduce((a, b) => a + b, 0) / newNavigations.length || 0;

        return {
          navigationTimes: newNavigations,
          cacheHitRate: cacheStats ? cacheStats.hitRate : (cached ? 100 : 0),
          avgLoadTime: avgTime,
          totalNavigations: prev.totalNavigations + 1,
          lastNavigationTime: timestamp,
          routeStats: {
            ...prev.routeStats,
            [routeKey]: {
              visits: (prev.routeStats[routeKey]?.visits || 0) + 1,
              cached: cached,
              lastVisit: timestamp
            }
          }
        };
      });

      setRecentNavigations(prev => [
        {
          route: routeKey,
          time: timestamp,
          cached: cached,
          loadTime: navigationTime
        },
        ...prev.slice(0, 9) // Keep last 10 navigations
      ]);
    };

    // Listen for route changes from SmartRouteCache
    const handleRouteChange = (event) => {
      const { toRoute, cached, navigationTime } = event.detail || {};
      console.log('📊 NavigationPerformanceMonitor received route change:', event.detail);
      if (toRoute) {
        trackNavigation(toRoute, cached, navigationTime || 0);
      }
    };

    // Listen for instant renders
    const handleInstantRender = (event) => {
      const { routeKey, cached } = event.detail || {};
      console.log('📊 NavigationPerformanceMonitor received instant render:', event.detail);
      if (routeKey) {
        trackNavigation(routeKey, cached, 0); // Instant = 0ms
      }
    };

    window.addEventListener('routeChange', handleRouteChange);
    window.addEventListener('instantRender', handleInstantRender);
    
    // Also listen for route exits for complete tracking
    const handleRouteExit = (event) => {
      console.log('📊 Route exit tracked:', event.detail);
    };
    
    window.addEventListener('routeExit', handleRouteExit);

    return () => {
      window.removeEventListener('routeChange', handleRouteChange);
      window.removeEventListener('instantRender', handleInstantRender);
      window.removeEventListener('routeExit', handleRouteExit);
    };
  }, [cacheStats]);

  /**
   * Update performance metrics periodically
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.routeCache && cacheStats) {
        setMetrics(prev => ({
          ...prev,
          cacheHitRate: cacheStats.hitRate || 0
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [cacheStats]);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const getPerformanceColor = (hitRate) => {
    if (hitRate >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (hitRate >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatTime = (ms) => {
    if (ms === 0) return 'Instant';
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const formatRoute = (route) => {
    const routeNames = {
      'client-master': 'Master Setup',
      'salary-structure': 'Job Function Setup',
      'client-service-location': 'Service Location',
      'recruitment-request': 'Vacancy Declaration',
      'current-vacancies': 'Current Vacancy Invites',
      'dashboard': 'Dashboard'
    };
    return routeNames[route] || route;
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 font-mono text-xs`}>
      {/* Compact View */}
      <div 
        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
          getPerformanceColor(metrics.cacheHitRate)
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="text-lg">⚡</div>
          <div>
            <div className="font-bold">
              {metrics.cacheHitRate.toFixed(0)}% Cache Hit
            </div>
            <div className="opacity-75">
              Avg: {formatTime(metrics.avgLoadTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4 min-w-80 max-w-96">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">Navigation Performance</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold text-gray-600">Cache Hit Rate</div>
              <div className="text-lg font-bold text-green-600">
                {metrics.cacheHitRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold text-gray-600">Avg Load Time</div>
              <div className="text-lg font-bold text-blue-600">
                {formatTime(metrics.avgLoadTime)}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold text-gray-600">Total Navigations</div>
              <div className="text-lg font-bold text-purple-600">
                {metrics.totalNavigations}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold text-gray-600">Cached Routes</div>
              <div className="text-lg font-bold text-orange-600">
                {cacheStats?.cacheSize || 0}
              </div>
            </div>
          </div>

          {/* Recent Navigations */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Recent Navigations</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentNavigations.map((nav, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <div>
                    <div className="font-medium">{formatRoute(nav.route)}</div>
                    <div className="text-gray-500">
                      {new Date(nav.time).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs ${
                      nav.cached 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {nav.cached ? '⚡ Cached' : '🔄 Fresh'}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {formatTime(nav.loadTime)}
                    </div>
                  </div>
                </div>
              ))}
              {recentNavigations.length === 0 && (
                <div className="text-gray-500 text-center py-2">
                  Navigate between routes to see metrics
                </div>
              )}
            </div>
          </div>

          {/* Route Statistics */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Route Statistics</h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {Object.entries(metrics.routeStats).map(([route, stats]) => (
                <div key={route} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{formatRoute(route)}</div>
                    <div className="text-gray-500">
                      {stats.visits} visit{stats.visits !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    stats.cached 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {stats.cached ? '📦 Cached' : '📄 Standard'}
                  </div>
                </div>
              ))}
              {Object.keys(metrics.routeStats).length === 0 && (
                <div className="text-gray-500 text-center py-2">
                  No route data yet
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (window.routeCache) {
                    window.routeCache.clearCache();
                  }
                  if (window.performanceCache) {
                    window.performanceCache.clear();
                  }
                  setMetrics({
                    navigationTimes: [],
                    cacheHitRate: 0,
                    avgLoadTime: 0,
                    totalNavigations: 0,
                    lastNavigationTime: null,
                    routeStats: {}
                  });
                  setRecentNavigations([]);
                }}
                className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Clear Cache
              </button>
              <button
                onClick={() => {
                  console.log('Performance Metrics:', metrics);
                  console.log('Cache Stats:', cacheStats);
                  console.log('Recent Navigations:', recentNavigations);
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Log Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationPerformanceMonitor;