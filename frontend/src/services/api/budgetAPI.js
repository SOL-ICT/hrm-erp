import { apiService } from '../api';

/**
 * Budget API Service
 * Handles all API calls related to budget allocation and management
 */

const BASE_URL = '/admin/budgets';

export const budgetAPI = {
  /**
   * Get all budget allocations
   */
  getAll: async (params = {}) => {
    const response = await apiService.makeRequest(BASE_URL, { params });
    return response;
  },

  /**
   * Get current user's budget
   */
  getMyBudget: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/my-budget`, { params });
    return response;
  },

  /**
   * Get specific user's budget
   */
  getUserBudget: async (userId, params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/user/${userId}`, { params });
    return response;
  },

  /**
   * Allocate budget to user
   */
  allocate: async (data) => {
    const response = await apiService.makeRequest(BASE_URL, { method: 'POST', body: JSON.stringify(data) });
    return response;
  },

  /**
   * Update budget allocation
   */
  update: async (id, data) => {
    const response = await apiService.makeRequest(`${BASE_URL}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return response;
  },

  /**
   * Get budget statistics
   */
  getStatistics: async (params = {}) => {
    const response = await apiService.makeRequest(`${BASE_URL}/statistics`, { params });
    return response;
  },
};

export default budgetAPI;
