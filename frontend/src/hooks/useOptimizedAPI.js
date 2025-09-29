// hooks/useOptimizedAPI.js
import { useState, useEffect, useCallback, useRef } from "react";
import { apiService } from "../services/api";

// Debounce hook for search inputs
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Optimized API hook with caching and debouncing
export const useOptimizedAPI = (endpoint, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  const {
    cache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    debounceDelay = 300,
    enabled = true,
  } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    const cacheKey = `${endpoint}_${JSON.stringify(dependencies)}`;

    // Check cache first
    if (cache && cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTTL) {
        setData(cached.data);
        setLoading(false);
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.makeRequest(endpoint, {
        signal: abortControllerRef.current.signal,
      });

      setData(response);

      // Cache the result
      if (cache) {
        cacheRef.current.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, ...dependencies, enabled, cache, cacheTTL]);

  // Debounced fetch
  const debouncedFetch = useDebounce(fetchData, debounceDelay);

  useEffect(() => {
    if (
      dependencies.some(
        (dep) => dep !== undefined && dep !== null && dep !== ""
      )
    ) {
      debouncedFetch();
    } else {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, debouncedFetch]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { data, loading, error, refetch, clearCache };
};

// Infinite scroll hook for large lists
export const useInfiniteScroll = (endpoint, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const { perPage = 20, dependencies = [] } = options;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await apiService.makeRequest(
        `${endpoint}?page=${page}&per_page=${perPage}`
      );

      if (response.data && response.data.data) {
        const newData = response.data.data;
        setData((prev) => (page === 1 ? newData : [...prev, ...newData]));
        setHasMore(response.data.current_page < response.data.last_page);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, perPage, loading, hasMore]);

  useEffect(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    loadMore();
  }, [...dependencies]);

  return { data, loading, hasMore, loadMore };
};
