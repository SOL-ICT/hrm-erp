/**
 * Example: Enhanced Dashboard with Smart Caching
 * This shows how to implement the performance optimizations
 */

import React, { useState, useEffect } from 'react';

// Smart API Hook with caching
const useSmartAPI = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const { 
    method = 'GET', 
    body = null, 
    cache = true, 
    useLocalStorage = false,
    refreshInterval = null 
  } = options;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (window.optimizedAPI) {
          response = await window.optimizedAPI.request(endpoint, {
            method,
            body,
            cache,
            useLocalStorage,
            priority: 'high'
          });
          setFromCache(response._cached || false);
        } else {
          // Fallback to regular fetch
          const res = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth') || '{}').access_token}`
            },
            body: body ? JSON.stringify(body) : null
          });
          response = await res.json();
          setFromCache(false);
        }

        setData(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up refresh interval if specified
    let interval;
    if (refreshInterval) {
      interval = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [endpoint, method, JSON.stringify(body), cache, useLocalStorage, refreshInterval]);

  const refresh = () => {
    if (window.optimizedAPI) {
      window.optimizedAPI.clearCache();
    }
    setLoading(true);
  };

  return { data, loading, error, fromCache, refresh };
};

// Dashboard Stats Component with Smart Caching
const SmartDashboardStats = () => {
  const { 
    data: stats, 
    loading, 
    error, 
    fromCache, 
    refresh 
  } = useSmartAPI('/api/dashboard/stats', {
    method: 'POST',
    body: {},
    cache: true,
    useLocalStorage: true,
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  // Loading skeleton
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-800">Failed to load dashboard stats</p>
        <button 
          onClick={refresh}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Cache indicator */}
      {fromCache && (
        <div className="col-span-full mb-2">
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-800">
            📦 Showing cached data for better performance
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">Total Requests</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.total || 0}</p>
          </div>
          <div className="text-blue-500">
            📋
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">Active</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.active || 0}</p>
          </div>
          <div className="text-green-500">
            ✅
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</p>
          </div>
          <div className="text-yellow-500">
            ⏳
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
            <p className="text-3xl font-bold text-purple-600">{stats?.completed || 0}</p>
          </div>
          <div className="text-purple-500">
            🎉
          </div>
        </div>
      </div>

      {/* Refresh button */}
      <div className="col-span-full mt-2">
        <button
          onClick={refresh}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Refreshing...' : 'Refresh Stats'}
        </button>
      </div>
    </div>
  );
};

export { useSmartAPI, SmartDashboardStats };