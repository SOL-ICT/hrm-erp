/**
 * Response Helper Utilities
 *
 * Utilities to prevent "body stream already read" errors and handle API responses consistently
 */

/**
 * Safely parse JSON from a fetch response
 * Prevents "body stream already read" errors
 *
 * @param {Response} response - The fetch response object
 * @returns {Promise<{success: boolean, data: any, error?: string}>}
 */
export const safeJsonParse = async (response) => {
  try {
    // Check if response is ok first
    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Check if response has already been consumed
    if (response.bodyUsed) {
      return {
        success: false,
        data: null,
        error: "Response body already consumed",
      };
    }

    // Parse JSON
    const data = await response.json();
    return {
      success: true,
      data: data,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `JSON parsing failed: ${error.message}`,
    };
  }
};

/**
 * Handle API response with consistent error handling
 *
 * @param {Response} response - The fetch response object
 * @returns {Promise<any>} - Parsed data on success, throws on error
 */
export const handleApiResponse = async (response) => {
  const result = await safeJsonParse(response);

  if (!result.success) {
    throw new Error(result.error);
  }

  if (!result.data.success) {
    throw new Error(result.data.message || "API request failed");
  }

  return result.data;
};

/**
 * Wrapper for sanctumRequest that handles response parsing
 *
 * @param {Function} sanctumRequest - The sanctumRequest function from AuthContext
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Parsed data on success
 */
export const apiRequest = async (sanctumRequest, url, options = {}) => {
  const response = await sanctumRequest(url, options);
  return handleApiResponse(response);
};

// Example usage patterns:
/*
// Method 1: Using safeJsonParse
const response = await sanctumRequest('/api/clients');
const result = await safeJsonParse(response);
if (result.success && result.data.success) {
  setClients(result.data.data);
} else {
  setError(result.error || result.data.message);
}

// Method 2: Using handleApiResponse (throws on error)
try {
  const data = await handleApiResponse(await sanctumRequest('/api/clients'));
  setClients(data.data);
} catch (error) {
  setError(error.message);
}

// Method 3: Using apiRequest wrapper (simplest)
try {
  const data = await apiRequest(sanctumRequest, '/api/clients');
  setClients(data.data);
} catch (error) {
  setError(error.message);
}
*/
