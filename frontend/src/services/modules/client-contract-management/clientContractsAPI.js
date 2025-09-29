import { apiService } from "../../api";
import {
  cleanApiParams,
  buildQueryString,
  validatePaginationParams,
} from "../../../utils/apiUtils";

const clientContractsAPI = {
  // Get all client contracts with pagination and filtering
  getAll: async (params = {}) => {
    try {
      // Validate and clean parameters
      const validatedParams = validatePaginationParams(params);
      const cleanParams = cleanApiParams(validatedParams);

      const queryString = buildQueryString(cleanParams);
      const endpoint = `/client-contracts${
        queryString ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching client contracts:", error);
      throw error;
    }
  },

  // Get single client contract
  getById: async (id) => {
    try {
      return await apiService.makeRequest(`/client-contracts/${id}`);
    } catch (error) {
      console.error("Error fetching client contract:", error);
      throw error;
    }
  },

  // Create new client contract
  create: async (data) => {
    try {
      // Handle file uploads with FormData
      if (data.attachment_1 || data.attachment_2 || data.attachment_3) {
        const formData = new FormData();

        // Add all form fields
        Object.keys(data).forEach((key) => {
          if (key.startsWith("attachment_") && data[key] instanceof File) {
            formData.append(key, data[key]);
          } else if (
            key === "selected_particulars" &&
            Array.isArray(data[key])
          ) {
            data[key].forEach((particular, index) => {
              formData.append(`selected_particulars[${index}]`, particular);
            });
          } else if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
          }
        });

        return await apiService.makeRequest("/client-contracts", {
          method: "POST",
          headers: {
            // Remove Content-Type to let browser set it with boundary for FormData
          },
          body: formData,
        });
      } else {
        // No files, use JSON
        return await apiService.makeRequest("/client-contracts", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    } catch (error) {
      console.error("Error creating client contract:", error);
      throw error;
    }
  },

  // Update client contract
  update: async (id, data) => {
    try {
      // Handle file uploads with FormData
      if (data.attachment_1 || data.attachment_2 || data.attachment_3) {
        const formData = new FormData();
        formData.append("_method", "PUT"); // Laravel method spoofing

        // Add all form fields
        Object.keys(data).forEach((key) => {
          if (key.startsWith("attachment_") && data[key] instanceof File) {
            formData.append(key, data[key]);
          } else if (
            key === "selected_particulars" &&
            Array.isArray(data[key])
          ) {
            data[key].forEach((particular, index) => {
              formData.append(`selected_particulars[${index}]`, particular);
            });
          } else if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
          }
        });

        return await apiService.makeRequest(`/client-contracts/${id}`, {
          method: "POST", // Using POST with _method=PUT for file uploads
          headers: {
            // Remove Content-Type to let browser set it with boundary for FormData
          },
          body: formData,
        });
      } else {
        // No files, use JSON
        return await apiService.makeRequest(`/client-contracts/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      }
    } catch (error) {
      console.error("Error updating client contract:", error);
      throw error;
    }
  },

  // Delete client contract
  delete: async (id) => {
    try {
      return await apiService.makeRequest(`/client-contracts/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting client contract:", error);
      throw error;
    }
  },

  // Get contracts by client
  getByClient: async (clientId) => {
    try {
      return await apiService.makeRequest(
        `/client-contracts/by-client/${clientId}`
      );
    } catch (error) {
      console.error("Error fetching client contracts:", error);
      throw error;
    }
  },

  // Get contract particulars master data
  getContractParticulars: async () => {
    try {
      return await apiService.makeRequest("/client-contracts/particulars");
    } catch (error) {
      console.error("Error fetching contract particulars:", error);
      throw error;
    }
  },

  // Toggle contract status
  toggleStatus: async (id) => {
    try {
      return await apiService.makeRequest(
        `/client-contracts/${id}/toggle-status`,
        {
          method: "PATCH",
        }
      );
    } catch (error) {
      console.error("Error toggling contract status:", error);
      throw error;
    }
  },

  // Get expiring contracts
  getExpiringSoon: async () => {
    try {
      return await apiService.makeRequest("/client-contracts/expiring-soon");
    } catch (error) {
      console.error("Error fetching expiring contracts:", error);
      throw error;
    }
  },

  // Download contract attachment
  downloadAttachment: async (contractId, attachmentNumber) => {
    try {
      const response = await fetch(
        `${apiService.baseURL}/client-contracts/${contractId}/attachment/${attachmentNumber}`,
        {
          method: "GET",
          headers: {
            ...apiService.getHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contract_attachment_${attachmentNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, message: "Attachment downloaded successfully" };
    } catch (error) {
      console.error("Error downloading attachment:", error);
      throw error;
    }
  },

  // Get contract statistics
  getStatistics: async () => {
    try {
      return await apiService.makeRequest("/client-contracts/statistics");
    } catch (error) {
      console.error("Error fetching contract statistics:", error);
      throw error;
    }
  },
};

export default clientContractsAPI;
