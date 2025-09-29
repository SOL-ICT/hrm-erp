import { apiService } from "../../api";

const solMasterAPI = {
  // Basic CRUD operations
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams();

      Object.keys(params).forEach((key) => {
        if (
          params[key] !== null &&
          params[key] !== undefined &&
          params[key] !== ""
        ) {
          queryString.append(key, params[key]);
        }
      });

      const endpoint = `/admin/sol-offices${
        queryString.toString() ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching SOL offices:", error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      return await apiService.makeRequest(`/admin/sol-offices/${id}`);
    } catch (error) {
      console.error("Error fetching SOL office:", error);
      throw error;
    }
  },

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

  // Data endpoints
  getStatesLgas: async () => {
    try {
      return await apiService.makeRequest(
        "/admin/sol-offices/data/states-lgas"
      );
    } catch (error) {
      console.error("Error fetching states/LGAs:", error);
      throw error;
    }
  },

  getStatistics: async () => {
    try {
      return await apiService.makeRequest("/admin/sol-offices/data/statistics");
    } catch (error) {
      console.error("Error fetching SOL office statistics:", error);
      throw error;
    }
  },

  // Bulk operations
  bulkUpdateStatus: async (data) => {
    try {
      return await apiService.makeRequest("/admin/sol-offices/bulk/status", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error performing bulk status update:", error);
      throw error;
    }
  },
};

export default solMasterAPI;
