import { apiService } from '../api';

/**
 * Procurement API Service
 * Handles all API calls related to procurement logging
 */

const BASE_URL = '/admin/procurements';

export const procurementAPI = {
  /**
   * Get all procurement logs
   */
  getAll: async (params = {}) => {
    const response = await apiService.makeRequest(BASE_URL, { params });
    return response;
  },

  /**
   * Log new procurement
   */
  logProcurement: async (data) => {
    const response = await apiService.makeRequest(BASE_URL, { method: 'POST', body: JSON.stringify(data) });
    return response;
  },

  /**
   * Get procurement statistics
   */
  getStatistics: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/statistics`, { params });
    return response;
  },
};

export default procurementAPI;
