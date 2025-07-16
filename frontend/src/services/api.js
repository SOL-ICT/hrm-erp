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
  bulkImport: async (clientId, solOfficeId, file) => {
    try {
      const formData = new FormData();
      formData.append("client_id", clientId);
      formData.append("sol_office_id", solOfficeId);
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
      return await apiService.makeRequest(
        "/clients?status=active&per_page=100"
      );
    } catch (error) {
      console.error("Error fetching active clients:", error);
      throw error;
    }
  },
};

// Service Request API functions
export const serviceRequestAPI = {
  // Get all service requests
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/service-requests${
        queryString ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching service requests:", error);
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
};

export default new APIService();
