import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';

/**
 * Hook to handle API requests with graceful session expiry detection.
 * Instead of forcing a redirect on 401, it provides a user-friendly error message
 * and retry functionality.
 */
export const useSessionAware = () => {
  const router = useRouter();
  const [sessionExpired, setSessionExpired] = useState(false);

  const makeRequestWithRetry = useCallback(
    async (endpoint, options = {}, retryCount = 0) => {
      const maxRetries = 1;
      
      try {
        setSessionExpired(false);
        return await apiService.makeRequest(endpoint, options);
      } catch (error) {
        const errorMsg = error?.message || String(error);
        
        // Check if it's a session expiry error (401)
        if (
          errorMsg.includes('Session expired') ||
          error?.status === 401
        ) {
          console.warn('🔐 Session expired detected in useSessionAware');
          setSessionExpired(true);
          
          // Optionally auto-retry once after a brief delay
          if (retryCount < maxRetries) {
            console.log('🔄 Retrying request after session expiry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return makeRequestWithRetry(endpoint, options, retryCount + 1);
          }
          
          // If retry fails or max retries reached, throw error
          throw new Error(
            'Session expired. Please refresh and log in again.'
          );
        }
        
        // For other errors, just re-throw
        throw error;
      }
    },
    []
  );

  const handleSessionExpired = useCallback(() => {
    // Clear session flag and redirect to login
    setSessionExpired(false);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  }, []);

  return {
    makeRequestWithRetry,
    sessionExpired,
    handleSessionExpired,
  };
};
