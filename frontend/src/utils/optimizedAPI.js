/**
 * Performance-Optimized API Service
 *
 * Provides the same API as apiService.makeRequest but with request deduplication
 * and caching for better performance.
 */

import {
  enhancedSanctumRequest,
  clearEnhancedSanctumCache,
} from "./enhancedSanctumRequest";

/**
 * High-performance API request with deduplication and caching
 */
export const optimizedApiRequest = async (endpoint, options = {}) => {
  // Ensure endpoint starts with /api/ for consistency
  const apiEndpoint = endpoint.startsWith("/api/")
    ? endpoint
    : `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const data = await enhancedSanctumRequest(apiEndpoint, options);
    return data;
  } catch (error) {
    console.error(
      `Optimized API request failed for ${apiEndpoint}:`,
      error.message
    );
    throw error;
  }
};

/**
 * Clear API request cache (useful for logout or forced refresh)
 */
export const clearApiCache = () => {
  clearEnhancedSanctumCache();
};

/**
 * Hook for optimized API requests
 */
export const useOptimizedAPI = () => {
  return {
    makeRequest: optimizedApiRequest,
    clearCache: clearApiCache,
  };
};
