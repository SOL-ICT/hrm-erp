import { apiService } from "../../api";

const solOfficeAPI = {
  // Get all SOL offices with filters
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/admin/sol-offices${
        queryString ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching SOL offices:", error);
      throw error;
    }
  },

  // Get single SOL office
  getById: async (id) => {
    try {
      return await apiService.makeRequest(`/admin/sol-offices/${id}`);
    } catch (error) {
      console.error("Error fetching SOL office:", error);
      throw error;
    }
  },

  // Create new SOL office
  create: async (data) => {
    try {
      return await apiService.makeRequest("/admin/sol-offices", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error creating SOL office:", error);
      throw error;
    }
  },

  // Update SOL office
  update: async (id, data) => {
    try {
      return await apiService.makeRequest(`/admin/sol-offices/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error updating SOL office:", error);
      throw error;
    }
  },

  // Delete SOL office
  delete: async (id) => {
    try {
      return await apiService.makeRequest(`/admin/sol-offices/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting SOL office:", error);
      throw error;
    }
  },

  // Get states and LGAs for forms
  getStatesAndLGAs: async () => {
    try {
      return await apiService.makeRequest("/utilities/states-lgas");
    } catch (error) {
      console.error("Error fetching states and LGAs:", error);
      throw error;
    }
  },

  // Get statistics
  getStatistics: async () => {
    try {
      return await apiService.makeRequest("/admin/sol-offices/data/statistics");
    } catch (error) {
      console.error("Error fetching statistics:", error);
      throw error;
    }
  },

  // Bulk update status
  bulkUpdateStatus: async (officeIds, isActive) => {
    try {
      return await apiService.makeRequest("/admin/sol-offices/bulk/status", {
        method: "PATCH",
        body: JSON.stringify({
          office_ids: officeIds,
          is_active: isActive,
        }),
      });
    } catch (error) {
      console.error("Error bulk updating offices:", error);
      throw error;
    }
  },

  // Auto-assign office based on location
  autoAssignOffice: async (stateCode, lgaCode = null) => {
    try {
      const params = { state_code: stateCode };
      if (lgaCode) params.lga_code = lgaCode;

      const queryString = new URLSearchParams(params).toString();
      return await apiService.makeRequest(
        `/sol-offices/lookup/auto-assign?${queryString}`
      );
    } catch (error) {
      console.error("Error auto-assigning office:", error);
      throw error;
    }
  },

  // Get active offices for dropdowns
  getActiveOffices: async () => {
    try {
      return await apiService.makeRequest("/sol-offices/active");
    } catch (error) {
      console.error("Error fetching active offices:", error);
      throw error;
    }
  },
};

export default solOfficeAPI;
