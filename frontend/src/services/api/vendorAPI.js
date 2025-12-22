import { apiService } from '../api';

/**
 * Vendor API Service
 * Handles all API calls related to vendor management
 */

const BASE_URL = '/admin/vendors';

export const vendorAPI = {
  /**
   * Get all vendors
   */
  getAll: async (params = {}) => {
    const response = await apiService.makeRequest(BASE_URL, { params });
    return response;
  },

  /**
   * Get single vendor by ID with procurement history
   */
  getById: async (id) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}`);
    return response;
  },

  /**
   * Create new vendor
   */
  create: async (data) => {
    const response = await apiService.makeRequest(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  },

  /**
   * Update vendor
   */
  update: async (id, data) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response;
  },

  /**
   * Delete vendor
   */
  delete: async (id) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    return response;
  },

  /**
   * Get vendor statistics
   */
  getStatistics: async () => {
    const response = await apiService.makeRequest(`${BASE_URL}/statistics`);
    return response;
  },
};

export default vendorAPI;
