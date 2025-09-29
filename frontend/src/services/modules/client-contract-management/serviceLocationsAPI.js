import { apiService } from "../../api";

const serviceLocationsAPI = {
  // Get all service locations with filters
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/service-locations${
        queryString ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching service locations:", error);
      throw error;
    }
  },

  // Get single service location
  getById: async (id) => {
    try {
      return await apiService.makeRequest(`/service-locations/${id}`);
    } catch (error) {
      console.error("Error fetching service location:", error);
      throw error;
    }
  },

  // Create new service location
  create: async (data) => {
    try {
      return await apiService.makeRequest("/service-locations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error creating service location:", error);
      throw error;
    }
  },

  // Update service location
  update: async (id, data) => {
    try {
      return await apiService.makeRequest(`/service-locations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error updating service location:", error);
      throw error;
    }
  },

  // Delete service location
  delete: async (id) => {
    try {
      return await apiService.makeRequest(`/service-locations/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting service location:", error);
      throw error;
    }
  },

  // Get locations grouped by client
  getGroupedByClient: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/service-locations/grouped-by-client${
        queryString ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching grouped service locations:", error);
      throw error;
    }
  },

  // Get locations by client
  getByClient: async (clientId) => {
    try {
      return await apiService.makeRequest(
        `/service-locations/by-client/${clientId}`
      );
    } catch (error) {
      console.error("Error fetching client locations:", error);
      throw error;
    }
  },

  // Bulk import locations
  bulkImport: async (clientId, file) => {
    try {
      const formData = new FormData();
      formData.append("client_id", clientId);
      formData.append("file", file);

      return await apiService.makeRequest(
        "/admin/service-locations/bulk-import",
        {
          method: "POST",
          headers: {
            // Remove Content-Type to let browser set it with boundary for FormData
          },
          body: formData,
        }
      );
    } catch (error) {
      console.error("Error bulk importing locations:", error);
      throw error;
    }
  },

  // Generate location code
  generateCode: async (clientCode, city) => {
    try {
      const params = { client_code: clientCode, city: city };
      const queryString = new URLSearchParams(params).toString();
      return await apiService.makeRequest(
        `/service-locations/generate-code?${queryString}`
      );
    } catch (error) {
      console.error("Error generating location code:", error);
      throw error;
    }
  },

  // Additional methods that should be available based on your backend routes
  getRegions: async () => {
    try {
      return await apiService.makeRequest("/service-locations/regions/list");
    } catch (error) {
      console.error("Error fetching regions:", error);
      throw error;
    }
  },

  getZones: async () => {
    try {
      return await apiService.makeRequest("/service-locations/zones/list");
    } catch (error) {
      console.error("Error fetching zones:", error);
      throw error;
    }
  },

  testAutoAssignment: async (data) => {
    try {
      return await apiService.makeRequest(
        "/service-locations/test-auto-assignment",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.error("Error testing auto-assignment:", error);
      throw error;
    }
  },

  downloadTemplate: async () => {
    try {
      return await apiService.makeRequest("/service-locations/bulk-template");
    } catch (error) {
      console.error("Error downloading template:", error);
      throw error;
    }
  },
};

export default serviceLocationsAPI;
