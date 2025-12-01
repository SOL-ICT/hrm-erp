// File: frontend/src/services/modules/recruitment-management/boardingApprovalsAPI.js

import apiService from "@/services/apiService";

const BASE_URL = "/boarding-approvals";

const boardingApprovalsAPI = {
  /**
   * Get pending boarding approvals for current user
   * @returns {Promise} List of staff pending approval
   */
  getPending: async () => {
    try {
      const response = await apiService.get(`${BASE_URL}/pending`);
      return response;
    } catch (error) {
      console.error("Get pending approvals failed:", error);
      throw error;
    }
  },

  /**
   * Approve staff boarding (supervisor level)
   * @param {number} staffId - The staff ID
   * @param {Object} data - Approval data (notes)
   * @returns {Promise} Approval result
   */
  approve: async (staffId, data = {}) => {
    try {
      const response = await apiService.post(
        `${BASE_URL}/${staffId}/approve`,
        data
      );
      return response;
    } catch (error) {
      console.error("Approve boarding failed:", error);
      throw error;
    }
  },

  /**
   * Reject staff boarding (supervisor level)
   * @param {number} staffId - The staff ID
   * @param {string} reason - Rejection reason
   * @returns {Promise} Rejection result
   */
  reject: async (staffId, reason) => {
    try {
      const response = await apiService.post(`${BASE_URL}/${staffId}/reject`, {
        rejection_reason: reason,
      });
      return response;
    } catch (error) {
      console.error("Reject boarding failed:", error);
      throw error;
    }
  },

  /**
   * Bulk approve staff boarding (supervisor level)
   * @param {Array<number>} staffIds - Array of staff IDs
   * @param {Object} data - Approval data
   * @returns {Promise} Bulk approval result
   */
  bulkApprove: async (staffIds, data = {}) => {
    try {
      const response = await apiService.post(`${BASE_URL}/bulk-approve`, {
        staff_ids: staffIds,
        ...data,
      });
      return response;
    } catch (error) {
      console.error("Bulk approve failed:", error);
      throw error;
    }
  },

  /**
   * Control Department final approval
   * @param {number} staffId - The staff ID
   * @param {Object} data - Approval data
   * @returns {Promise} Control approval result
   */
  controlApprove: async (staffId, data = {}) => {
    try {
      const response = await apiService.post(
        `${BASE_URL}/${staffId}/control-approve`,
        data
      );
      return response;
    } catch (error) {
      console.error("Control approve failed:", error);
      throw error;
    }
  },

  /**
   * Control Department rejection
   * @param {number} staffId - The staff ID
   * @param {string} reason - Rejection reason
   * @returns {Promise} Control rejection result
   */
  controlReject: async (staffId, reason) => {
    try {
      const response = await apiService.post(
        `${BASE_URL}/${staffId}/control-reject`,
        {
          rejection_reason: reason,
        }
      );
      return response;
    } catch (error) {
      console.error("Control reject failed:", error);
      throw error;
    }
  },

  /**
   * Bulk Control Department approval
   * @param {Array<number>} staffIds - Array of staff IDs
   * @param {Object} data - Approval data
   * @returns {Promise} Bulk control approval result
   */
  bulkControlApprove: async (staffIds, data = {}) => {
    try {
      const response = await apiService.post(
        `${BASE_URL}/bulk-control-approve`,
        {
          staff_ids: staffIds,
          ...data,
        }
      );
      return response;
    } catch (error) {
      console.error("Bulk control approve failed:", error);
      throw error;
    }
  },
};

export default boardingApprovalsAPI;
