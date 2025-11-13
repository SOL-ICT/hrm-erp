/**
 * Enhanced Sanctum Request with Data-Level Deduplication
 *
 * This fixes the "body stream already read" issue while maintaining
 * the performance benefits of request deduplication.
 */

// Cache for storing parsed response data
const responseDataCache = new Map();
const pendingDataRequests = new Map();

// Cache TTL in milliseconds (default 5 seconds for deduplication)
const CACHE_TTL = 5000;

/**
 * Enhanced sanctum request that caches parsed data instead of Response objects
 */
export const enhancedSanctumRequest = async (url, options = {}) => {
  // Handle relative URLs by prepending the backend base URL
  const baseApiUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:8000";
  const fullUrl = url.startsWith("/") ? `${baseApiUrl}${url}` : url;

  // Create a unique key for this request
  const requestKey = `${options.method || "GET"}:${fullUrl}:${JSON.stringify(
    options.body || {}
  )}`;

  // Check if we have a pending request for the same data
  if (pendingDataRequests.has(requestKey)) {
    console.log("🔄 Deduplicating data request:", fullUrl);
    return pendingDataRequests.get(requestKey);
  }

  // Check if we have cached data that's still fresh
  const cachedEntry = responseDataCache.get(requestKey);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
    console.log("⚡ Using cached data for:", fullUrl);
    return Promise.resolve(cachedEntry.data);
  }

  console.log("🔒 Making authenticated API request to:", fullUrl);

  // Create the actual request promise
  const requestPromise = (async () => {
    try {
      // Get auth token
      let bearerToken = null;

      if (typeof window !== "undefined") {
        try {
          const authData = JSON.parse(localStorage.getItem("auth") || "{}");
          bearerToken = authData.access_token;
        } catch {
          bearerToken =
            localStorage.getItem("auth_token") || localStorage.getItem("token");
        }
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Origin: window.location.origin,
        ...options.headers,
      };

      if (bearerToken && bearerToken !== "guest") {
        headers.Authorization = `Bearer ${bearerToken}`;
      }

      const response = await fetch(fullUrl, {
        credentials: "include",
        ...options,
        headers,
      });

      // Parse the response once
      const data = await response.json();

      // Check if the response was successful
      if (!response.ok) {
        // Log the full error response for debugging
        console.error("Enhanced Sanctum Request Error:", {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          data: data,
          headers: Object.fromEntries(response.headers.entries()),
        });

        // Throw an error with the message from the response
        throw new Error(
          data.message || data.error || `HTTP error! status: ${response.status}`
        );
      }

      // Cache the parsed data
      responseDataCache.set(requestKey, {
        data,
        timestamp: Date.now(),
      });

      // Clean up old cache entries periodically
      cleanupCache();

      return data;
    } catch (error) {
      console.error(
        `Enhanced Sanctum Request error for ${fullUrl}:`,
        error.message
      );
      throw error;
    } finally {
      // Clean up the pending request
      pendingDataRequests.delete(requestKey);
    }
  })();

  // Store the pending request
  pendingDataRequests.set(requestKey, requestPromise);

  return requestPromise;
};

/**
 * Clean up old cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of responseDataCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL * 2) {
      responseDataCache.delete(key);
    }
  }
}

/**
 * Clear all cached data (useful for logout or data refresh)
 */
export const clearEnhancedSanctumCache = () => {
  responseDataCache.clear();
  pendingDataRequests.clear();
};

/**
 * Hook for using enhanced sanctum request
 */
export const useEnhancedSanctumRequest = () => {
  return {
    enhancedSanctumRequest,
    clearCache: clearEnhancedSanctumCache,
  };
};
