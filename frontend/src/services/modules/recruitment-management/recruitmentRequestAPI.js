import { apiService } from "../../api";

const recruitmentRequestAPI = {
  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Get all recruitment requests with filtering
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiService.makeRequest("/recruitment-requests", {
        method: "GET",
        params,
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch recruitment requests:", error);
      throw error;
    }
  },

  /**
   * Get dashboard data with statistics and summaries
   */
  getDashboard: async (params = {}) => {
    try {
      const response = await apiService.makeRequest(
        "/recruitment-requests-dashboard",
        {
          method: "GET",
          params,
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch recruitment dashboard:", error);
      // Return fallback data on error
      return {
        success: false,
        data: {
          stats: {
            total: 0,
            active: 0,
            closed: 0,
            total_vacancies: 0,
            overdue: 0,
            due_soon: 0,
          },
          client_grouped_requests: {},
          recent_requests: [],
          overdue_requests: [],
          due_soon_requests: [],
        },
      };
    }
  },

  /**
   * Get a specific recruitment request by ID
   */
  getById: async (id) => {
    try {
      const response = await apiService.makeRequest(
        `/recruitment-requests/${id}`
      );
      return response;
    } catch (error) {
      console.error(`Failed to fetch recruitment request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new recruitment request
   */
  create: async (data) => {
    try {
      const response = await apiService.makeRequest("/recruitment-requests", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("Failed to create recruitment request:", error);
      throw error;
    }
  },

  /**
   * Update an existing recruitment request
   */
  update: async (id, data) => {
    try {
      const response = await apiService.makeRequest(
        `/recruitment-requests/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to update recruitment request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a recruitment request
   */
  delete: async (id) => {
    try {
      const response = await apiService.makeRequest(
        `/recruitment-requests/${id}`,
        {
          method: "DELETE",
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to delete recruitment request ${id}:`, error);
      throw error;
    }
  },

  // ========================================
  // STATUS MANAGEMENT
  // ========================================

  /**
   * Close a recruitment request
   */
  close: async (id, reason) => {
    try {
      const payload = { reason: reason };
      console.log(`Closing request ${id} with payload:`, payload);

      const response = await apiService.makeRequest(
        `/recruitment-requests/${id}/close`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to close recruitment request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Reopen a closed recruitment request
   */
  reopen: async (id, reason) => {
    try {
      const response = await apiService.makeRequest(
        `/recruitment-requests/${id}/reopen`,
        {
          method: "POST",
          body: JSON.stringify({
            reason: reason,
          }),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to reopen recruitment request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Approve a recruitment request
   */
  approve: async (id) => {
    try {
      const response = await apiService.makeRequest(
        `/recruitment-requests/${id}/approve`,
        {
          method: "POST",
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to approve recruitment request ${id}:`, error);
      throw error;
    }
  },

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Get job structures for a specific client
   */
  getJobStructuresByClient: async (clientId) => {
    try {
      const response = await apiService.makeRequest(
        `/recruitment-requests/job-structures/client/${clientId}`
      );
      return response;
    } catch (error) {
      console.error(
        `Failed to fetch job structures for client ${clientId}:`,
        error
      );
      // Return empty array on error
      return { success: false, data: [] };
    }
  },

  /**
   * Get service locations for a specific client
   */
  getServiceLocationsByClient: async (clientId) => {
    try {
      const response = await apiService.makeRequest(
        `/recruitment-requests/service-locations/client/${clientId}`
      );
      return response;
    } catch (error) {
      console.error(
        `Failed to fetch service locations for client ${clientId}:`,
        error
      );
      // Return empty array on error
      return { success: false, data: [] };
    }
  },

  /**
   * Get next available ticket ID
   */
  getNextTicketId: async () => {
    try {
      const response = await apiService.makeRequest(
        "/recruitment-requests/tickets/next-id"
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch next ticket ID:", error);
      // Return fallback ticket ID
      const year = new Date().getFullYear();
      return {
        success: false,
        data: { ticket_id: `TCK_${year}_XXXX` },
      };
    }
  },

  /**
   * Get recruitment statistics
   */
  getStatistics: async (params = {}) => {
    try {
      const response = await apiService.makeRequest(
        "/recruitment-requests/statistics/summary",
        {
          method: "GET",
          params,
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch recruitment statistics:", error);
      throw error;
    }
  },

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  /**
   * Build filter params for API requests
   */
  buildFilterParams: (filters) => {
    const params = {};

    if (filters.clientId) params.client_id = filters.clientId;
    if (filters.status) params.status = filters.status;
    if (filters.year) params.year = filters.year;
    if (filters.priority) params.priority = filters.priority;
    if (filters.solServiceType)
      params.sol_service_type = filters.solServiceType;
    if (filters.search) params.search = filters.search;
    if (filters.sortBy) params.sort_by = filters.sortBy;
    if (filters.sortOrder) params.sort_order = filters.sortOrder;
    if (filters.perPage) params.per_page = filters.perPage;

    return params;
  },

  /**
   * Validate recruitment request data before submission
   */
  validateRecruitmentRequest: (data) => {
    const errors = {};

    if (!data.client_id) errors.client_id = "Client is required";
    if (!data.job_structure_id)
      errors.job_structure_id = "Job structure is required";
    
    // Support both single and multiple locations
    if (!data.service_location_id && (!data.service_location_ids || data.service_location_ids.length === 0)) {
      errors.service_location_ids = "At least one service location is required";
    }
    
    if (!data.number_of_vacancies || data.number_of_vacancies < 1) {
      errors.number_of_vacancies = "Number of vacancies must be at least 1";
    }
    if (!data.sol_service_type)
      errors.sol_service_type = "SOL service type is required";

    if (data.age_limit_min && data.age_limit_max) {
      if (parseInt(data.age_limit_min) > parseInt(data.age_limit_max)) {
        errors.age_limit_max = "Maximum age must be greater than minimum age";
      }
    }

    if (data.salary_range_min && data.salary_range_max) {
      if (
        parseFloat(data.salary_range_min) > parseFloat(data.salary_range_max)
      ) {
        errors.salary_range_max =
          "Maximum salary must be greater than minimum salary";
      }
    }

    if (data.recruitment_period_start && data.recruitment_period_end) {
      const startDate = new Date(data.recruitment_period_start);
      const endDate = new Date(data.recruitment_period_end);
      if (startDate >= endDate) {
        errors.recruitment_period_end = "End date must be after start date";
      }
    }

    if (data.interview_date) {
      const interviewDate = new Date(data.interview_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (interviewDate <= today) {
        errors.interview_date = "Interview date must be in the future";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Generate ticket ID preview
   */
  generateTicketPreview: () => {
    const year = new Date().getFullYear();
    return `TCK_${year}_XXXX`; // Will be replaced with actual number by backend
  },

  /**
   * Get status color for UI display
   */
  getStatusColor: (status) => {
    const statusColors = {
      active: "green",
      closed: "gray",
      cancelled: "red",
      on_hold: "yellow",
      overdue: "red",
      due_soon: "orange",
    };

    return statusColors[status?.toLowerCase()] || "gray";
  },

  /**
   * Get priority color for UI display
   */
  getPriorityColor: (priority) => {
    const priorityColors = {
      low: "green",
      medium: "blue",
      high: "orange",
      urgent: "red",
    };

    return priorityColors[priority?.toLowerCase()] || "gray";
  },

  /**
   * Export recruitment requests data
   */
  exportData: async (filters = {}, format = "csv") => {
    try {
      const params = {
        ...recruitmentRequestAPI.buildFilterParams(filters),
        export: format,
      };
      const response = await api.get("/recruitment-requests/export", {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `recruitment_requests_${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error("Failed to export recruitment requests:", error);
      throw error;
    }
  },

  // ========================================
  // ASSIGNMENT & PERMISSIONS (Task 3.2)
  // ========================================

  /**
   * Get list of users that can be assigned recruitment tickets
   */
  getAssignableUsers: async () => {
    try {
      const response = await apiService.makeRequest(
        "/recruitment-requests/assignable-users",
        {
          method: "GET",
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch assignable users:", error);
      throw error;
    }
  },

  /**
   * Get current user's recruitment permissions
   */
  getMyPermissions: async () => {
    try {
      const response = await apiService.makeRequest(
        "/recruitment-hierarchy/my-permissions",
        {
          method: "GET",
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch my permissions:", error);
      throw error;
    }
  },

  /**
   * Assign or reassign a recruitment ticket to a user
   * Task 3.3: TicketAssignmentModal
   */
  assignTicket: async (requestId, data) => {
    try {
      const response = await apiService.makeRequest(
        `/recruitment-requests/${requestId}/assign`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to assign ticket ${requestId}:`, error);
      throw error;
    }
  },
};

export default recruitmentRequestAPI;
