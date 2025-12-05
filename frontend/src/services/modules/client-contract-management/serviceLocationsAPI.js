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
        "/service-locations/bulk-import",
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

  // Get client contact details for auto-fill
  getClientContactDetails: async (clientId) => {
    try {
      return await apiService.makeRequest(
        `/service-locations/client/${clientId}/contact-details`
      );
    } catch (error) {
      console.error("Error fetching client contact details:", error);
      throw error;
    }
  },

  downloadTemplate: async (clientId = null) => {
    try {
      const params = clientId ? `?client_id=${clientId}` : '';
      const url = `${process.env.NEXT_PUBLIC_API_URL}/service-locations/bulk-template${params}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || "Failed to download template",
        };
      }

      // Check if response is CSV file
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("text/csv")) {
        // It's a CSV file - trigger download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get("content-disposition");
        let filename = "service_locations_template.csv";
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
            contentDisposition
          );
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, "");
          }
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return {
          success: true,
          message: "Template downloaded successfully",
          filename: filename,
        };
      } else {
        // It's a JSON response (likely an error)
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      return {
        success: false,
        message: "Error downloading template",
        error: error.message,
      };
    }
  },
};

export default serviceLocationsAPI;
