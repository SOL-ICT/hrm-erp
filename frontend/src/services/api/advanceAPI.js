import { apiService } from '../api';

/**
 * Advance API Service
 * Handles all API calls related to advance requests and management
 */

const BASE_URL = '/admin/advances';

export const advanceAPI = {
  /**
   * Get all advances
   */
  getAll: async (params = {}) => {
    const response = await apiService.makeRequest(BASE_URL, { params });
    return response;
  },

  /**
   * Get single advance by ID
   */
  getById: async (id) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}`);
    return response;
  },

  /**
   * Get current user's advances
   */
  getMyAdvances: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/my-advances`, { params });
    return response;
  },

  /**
   * Get advances pending approval
   */
  getPendingApprovals: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/pending-approvals`, { params });
    return response;
  },

  /**
   * Get advances ready for disbursement
   */
  getReadyForDisbursement: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/ready-for-disbursement`, { params });
    return response;
  },

  /**
   * Get overdue retirements
   */
  getOverdueRetirements: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/overdue-retirements`, { params });
    return response;
  },

  /**
   * Create new advance request
   */
  create: async (data) => {
    const response = await apiService.makeRequest(BASE_URL, { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  },

  /**
   * Cancel advance request
   */
  cancel: async (id, reason) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
    return response.data;
  },

  /**
   * Approve advance request
   */
  approve: async (id, comments) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/approve`, { method: 'POST', body: JSON.stringify({ comments }) });
    return response.data;
  },

  /**
   * Reject advance request
   */
  reject: async (id, reason) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    return response.data;
  },

  /**
   * Disburse advance
   */
  disburse: async (id, data) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}/disburse`, { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  },

  /**
   * Get advance statistics
   */
  getStatistics: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/statistics`, { params });
    return response.data;
  },
};

export default advanceAPI;
