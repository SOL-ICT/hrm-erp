import { apiService } from '../api';

/**
 * Retirement API Service
 * Handles all API calls related to advance retirement
 */

const BASE_URL = '/admin/retirements';

export const retirementAPI = {
  /**
   * Get all retirements
   */
  getAll: async (params = {}) => {
    const response = await apiService.makeRequest(BASE_URL, { params });
    return response.data;
  },

  /**
   * Get single retirement by ID
   */
  getById: async (id) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Get retirements pending review
   */
  getPendingReviews: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/pending-reviews`, { params });
    return response.data;
  },

  /**
   * Get overdue retirements
   */
  getOverdue: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/overdue`, { params });
    return response.data;
  },

  /**
   * Submit new retirement
   */
  submit: async (data) => {
    const response = await apiService.makeRequest(BASE_URL, { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  },

  /**
   * Add item to retirement
   */
  addItem: async (id, itemData) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/add-item`, { method: 'POST', body: JSON.stringify(itemData) });
    return response.data;
  },

  /**
   * Review retirement
   */
  review: async (id, comments) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/review`, { method: 'POST', body: JSON.stringify({ comments }) });
    return response.data;
  },

  /**
   * Approve retirement
   */
  approve: async (id, comments) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/approve`, { method: 'POST', body: JSON.stringify({ comments }) });
    return response.data;
  },

  /**
   * Reject retirement
   */
  reject: async (id, reason) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    return response.data;
  },

  /**
   * Query retirement for more information
   */
  query: async (id, queryReason) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/query`, { method: 'POST', body: JSON.stringify({ query_reason: queryReason }) });
    return response.data;
  },

  /**
   * Respond to retirement query
   */
  respondToQuery: async (id, responseData) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/respond-to-query`, { method: 'POST', body: JSON.stringify(responseData) });
    return response.data;
  },

  /**
   * Get retirement statistics
   */
  getStatistics: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/statistics`, { params });
    return response.data;
  },
};

export default retirementAPI;
