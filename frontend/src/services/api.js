class APIService {
  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      credentials: "include",
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async register(userData) {
    return this.makeRequest("/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.makeRequest("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }
}

// Create API service instance
const apiService = new APIService();

// SOL Office API functions
export const solOfficeAPI = {
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

// ✅ ADD THESE CLIENT CONTRACT API FUNCTIONS TO YOUR api.js FILE
// Place this after your existing solOfficeAPI object

// Client Contract API functions
export const clientContractAPI = {
  // Get all client contracts with pagination and filtering
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
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

// Service Location API functions
export const serviceLocationAPI = {
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
};

// Client API functions
export const clientAPI = {
  // Get all clients
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/clients${queryString ? `?${queryString}` : ""}`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  },

  // Get active clients for dropdowns
  getActive: async () => {
    try {
      return await apiService.makeRequest("/clients"); // ← Just get all clients, no filters
    } catch (error) {
      console.error("Error fetching active clients:", error);
      throw error;
    }
  },
};

// Service Request API (Updated for client-based structure)
export const serviceRequestAPI = {
  // Get all service requests with filtering
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

      const endpoint = `/service-requests${
        queryString.toString() ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching service requests:", error);
      throw error;
    }
  },

  // Get single service request
  getById: async (id) => {
    try {
      return await apiService.makeRequest(`/service-requests/${id}`);
    } catch (error) {
      console.error("Error fetching service request:", error);
      throw error;
    }
  },

  // Create new service request
  create: async (data) => {
    try {
      return await apiService.makeRequest("/service-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error creating service request:", error);
      throw error;
    }
  },

  // Update service request
  update: async (id, data) => {
    try {
      return await apiService.makeRequest(`/service-requests/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error updating service request:", error);
      throw error;
    }
  },

  // Delete service request
  delete: async (id) => {
    try {
      return await apiService.makeRequest(`/service-requests/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting service request:", error);
      throw error;
    }
  },

  // Get services grouped by client
  getByClient: async () => {
    try {
      return await apiService.makeRequest(
        "/service-requests/by-client/grouped"
      );
    } catch (error) {
      console.error("Error fetching services by client:", error);
      throw error;
    }
  },

  // Get service types (optionally filtered by client)
  getServiceTypes: async (clientId = null) => {
    try {
      const endpoint = clientId
        ? `/service-requests/service-types/list?client_id=${clientId}`
        : "/service-requests/service-types/list";
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching service types:", error);
      throw error;
    }
  },

  // Generate service code
  generateServiceCode: async (data) => {
    try {
      return await apiService.makeRequest("/service-requests/generate-code", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error generating service code:", error);
      throw error;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      return await apiService.makeRequest(
        "/service-requests/dashboard/statistics"
      );
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // Bulk operations
  bulkUpdate: async (data) => {
    try {
      return await apiService.makeRequest("/service-requests/bulk-update", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error performing bulk update:", error);
      throw error;
    }
  },

  // Legacy method (for backward compatibility)
  getUsageStatistics: async () => {
    try {
      return await apiService.makeRequest("/service-requests/usage-statistics");
    } catch (error) {
      console.error("Error fetching usage statistics:", error);
      throw error;
    }
  },
};

export default new APIService();
