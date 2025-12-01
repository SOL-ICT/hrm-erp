// File: frontend/src/services/modules/recruitment-management/recruitmentHierarchyAPI.js

import apiService from "@/services/apiService";

const BASE_URL = "/recruitment-hierarchy";

const recruitmentHierarchyAPI = {
  /**
   * Get all recruitment hierarchy permissions
   * @returns {Promise} All roles with recruitment permissions
   */
  getAll: async () => {
    try {
      const response = await apiService.get(BASE_URL);
      return response;
    } catch (error) {
      console.error("Get recruitment hierarchy failed:", error);
      throw error;
    }
  },

  /**
   * Update recruitment hierarchy permissions for a role
   * @param {number} roleId - The role ID
   * @param {Object} permissions - Permission data
   * @returns {Promise} Updated hierarchy
   */
  update: async (roleId, permissions) => {
    try {
      const response = await apiService.put(BASE_URL, {
        role_id: roleId,
        ...permissions,
      });
      return response;
    } catch (error) {
      console.error("Update recruitment hierarchy failed:", error);
      throw error;
    }
  },

  /**
   * Get current user's recruitment permissions
   * @returns {Promise} User's permissions
   */
  getMyPermissions: async () => {
    try {
      const response = await apiService.get(`${BASE_URL}/my-permissions`);
      return response;
    } catch (error) {
      console.error("Get my permissions failed:", error);
      throw error;
    }
  },
};

export default recruitmentHierarchyAPI;
