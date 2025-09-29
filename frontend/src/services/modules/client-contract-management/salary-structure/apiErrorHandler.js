/**
 * API Error Handler Utilities for Salary Structure Module
 * Helps distinguish between expected "no data" responses and actual errors
 */

/**
 * Check if an error is an expected "no data found" error
 * @param {Error} error - The error object
 * @returns {boolean} - True if this is an expected "no data" error
 */
export const isExpectedNoDataError = (error) => {
  if (!error) return false;
  
  // Check for 404 status code
  if (error.status === 404) return true;
  
  // Check for common "no data found" messages
  const noDataMessages = [
    'No offer letter template found',
    'No data found',
    'Template not found',
    'Not found'
  ];
  
  return noDataMessages.some(msg => 
    error.message && error.message.toLowerCase().includes(msg.toLowerCase())
  );
};

/**
 * Handle API errors gracefully - only log unexpected errors
 * @param {Error} error - The error object
 * @param {string} context - Context for the error (e.g., "loading templates")
 * @param {boolean} silent - Whether to suppress all logging
 */
export const handleApiError = (error, context = '', silent = false) => {
  if (isExpectedNoDataError(error)) {
    // This is normal - don't log as an error
    if (!silent) {
      console.debug(`No data found ${context}:`, error.message);
    }
    return { isExpected: true, error };
  }
  
  // This is an unexpected error - log it
  console.error(`Error ${context}:`, error);
  return { isExpected: false, error };
};

/**
 * Wrapper for API calls that handles expected errors gracefully
 * @param {Function} apiCall - The API call function
 * @param {string} context - Context for logging
 * @param {*} fallbackValue - Value to return on expected errors
 */
export const handleApiCall = async (apiCall, context = '', fallbackValue = null) => {
  try {
    return await apiCall();
  } catch (error) {
    const { isExpected } = handleApiError(error, context);
    
    if (isExpected) {
      return { success: false, data: fallbackValue, isExpected: true };
    }
    
    throw error; // Re-throw unexpected errors
  }
};
