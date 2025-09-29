import { apiService } from "../../api";

const clientMasterAPI = {
  // Get all clients with filtering
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
      const endpoint = `/clients${
        queryString.toString() ? `?${queryString}` : ""
      }`;
      const response = await apiService.makeRequest(endpoint);
      console.log("Fetched clients:", response); // Debug log
      return response;
    } catch (error) {
      console.error("Error fetching clients:", error.message);
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }
  },

  // Get active clients for dropdowns
  getActive: async () => {
    try {
      const response = await apiService.makeRequest("/clients?status=active");
      console.log("Fetched active clients:", response); // Debug log
      return response;
    } catch (error) {
      console.error("Error fetching active clients:", error.message);
      throw new Error(`Failed to fetch active clients: ${error.message}`);
    }
  },

  // Get client by ID
  getById: async (id) => {
    try {
      const response = await apiService.makeRequest(`/clients/${id}`);
      console.log(`Fetched client ${id}:`, response); // Debug log
      return response;
    } catch (error) {
      console.error(`Error fetching client ${id}:`, error.message);
      throw new Error(`Failed to fetch client: ${error.message}`);
    }
  },

  // Create a new client
  create: async (data) => {
    try {
      const response = await apiService.makeRequest("/clients", {
        method: "POST",
        body: JSON.stringify(data),
      });
      console.log("Created client:", response); // Debug log
      return response;
    } catch (error) {
      console.error("Error creating client:", error.message);
      throw new Error(`Failed to create client: ${error.message}`);
    }
  },

  // Update an existing client
  update: async (id, data) => {
    try {
      const response = await apiService.makeRequest(`/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      console.log(`Updated client ${id}:`, response); // Debug log
      return response;
    } catch (error) {
      console.error(`Error updating client ${id}:`, error.message);
      throw new Error(`Failed to update client: ${error.message}`);
    }
  },

  // Delete a client
  delete: async (id) => {
    try {
      const response = await apiService.makeRequest(`/clients/${id}`, {
        method: "DELETE",
      });
      console.log(`Deleted client ${id}:`, response); // Debug log
      return response;
    } catch (error) {
      console.error(`Error deleting client ${id}:`, error.message);
      throw new Error(`Failed to delete client: ${error.message}`);
    }
  },

  // Get client statistics
  getStatistics: async () => {
    try {
      const response = await apiService.makeRequest("/clients/statistics");
      console.log("Fetched client statistics:", response); // Debug log
      return response;
    } catch (error) {
      console.error("Error fetching client statistics:", error.message);
      throw new Error(`Failed to fetch client statistics: ${error.message}`);
    }
  },

  // Toggle client status
  toggleStatus: async (id) => {
    try {
      const response = await apiService.makeRequest(
        `/clients/${id}/toggle-status`,
        {
          method: "PATCH",
        }
      );
      console.log(`Toggled status for client ${id}:`, response); // Debug log
      return response;
    } catch (error) {
      console.error(`Error toggling client status ${id}:`, error.message);
      throw new Error(`Failed to toggle client status: ${error.message}`);
    }
  },

  // Upload client logo
  uploadLogo: async (file) => {
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await apiService.makeRequest("/clients/upload-logo", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Uploaded logo:", response); // Debug log
      return response;
    } catch (error) {
      console.error("Error uploading logo:", error.message);
      throw new Error(`Failed to upload logo: ${error.message}`);
    }
  },
};

export default clientMasterAPI;
