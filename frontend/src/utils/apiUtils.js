/**
 * Utility functions for API parameter handling
 */

/**
 * Clean and validate API parameters before sending to backend
 * @param {Object} params - The parameters object to clean
 * @returns {Object} - Cleaned parameters object
 */
export const cleanApiParams = (params) => {
  const cleaned = {};

  Object.keys(params).forEach((key) => {
    const value = params[key];

    // Skip null, undefined, empty strings, and the string "undefined"
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      value !== "undefined" &&
      value !== "null"
    ) {
      // For arrays, only include if not empty
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleaned[key] = value;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });

  return cleaned;
};

/**
 * Build query string from clean parameters
 * @param {Object} params - Parameters to convert to query string
 * @returns {string} - Query string
 */
export const buildQueryString = (params) => {
  const cleanParams = cleanApiParams(params);
  return new URLSearchParams(cleanParams).toString();
};

/**
 * Validate pagination parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} - Validated pagination parameters
 */
export const validatePaginationParams = (params) => {
  const validated = { ...params };

  // Validate page number
  if (validated.page) {
    validated.page = Math.max(1, parseInt(validated.page) || 1);
  }

  // Validate per_page
  if (validated.per_page) {
    validated.per_page = Math.min(
      100,
      Math.max(1, parseInt(validated.per_page) || 15)
    );
  }

  return validated;
};
