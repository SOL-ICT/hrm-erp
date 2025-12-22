import { apiService } from '../api';

/**
 * Purchase Request API Service
 * Handles all API calls related to purchase requests
 */

const BASE_URL = '/admin/purchase-requests';

export const purchaseRequestAPI = {
  /**
   * Get all purchase requests
   */
  getAll: async (params = {}) => {
    const response = await apiService.makeRequest(BASE_URL, { params });
    return response;
  },

  /**
   * Get single purchase request by ID
   */
  getById: async (id) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}`);
    return response;
  },

  /**
   * Get current user's purchase requests
   */
  getMyRequests: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/my-requests`, { params });
    return response;
  },

  /**
   * Get purchase requests pending admin review
   */
  getPendingAdminReview: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/pending-admin-review`, { params });
    return response;
  },

  /**
   * Get purchase requests pending finance approval
   */
  getPendingFinanceApproval: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/pending-finance-approval`, { params });
    return response;
  },

  /**
   * Create new purchase request
   */
  create: async (data) => {
    const response = await apiService.makeRequest(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response;
  },

  /**
   * Cancel purchase request
   */
  cancel: async (id, reason) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
    return response;
  },

  /**
   * Review purchase request (Admin Officer)
   */
  review: async (id, comments) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/review`, { method: 'POST', body: JSON.stringify({ comments }) });
    return response;
  },

  /**
   * Approve purchase request
   */
  approve: async (id, data) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/approve`, { method: 'POST', body: JSON.stringify(data) });
    return response;
  },

  /**
   * Reject purchase request
   */
  reject: async (id, reason) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    return response;
  },

  /**
   * Get purchase request statistics
   */
  getStatistics: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/statistics`, { params });
    return response;
  },
};

export default purchaseRequestAPI;
