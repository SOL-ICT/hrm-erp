import { apiService } from "../../api";

/**
 * Staff Requisition API Service
 * 
 * Handles all API calls for requisition management
 */
const requisitionAPI = {
  // ========================================
  // REQUISITION CRUD OPERATIONS
  // ========================================

  /**
   * Get all requisitions with filters
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status ('pending', 'approved', 'rejected', 'cancelled')
   * @param {string} params.collection_status - Filter by collection status
   * @param {string} params.department - Filter by department
   * @param {string} params.branch - Filter by branch
   * @param {string} params.date_from - Start date filter
   * @param {string} params.date_to - End date filter
   * @param {number} params.user_id - Filter by user ID
   * @param {string} params.search - Search by requisition code
   * @param {string} params.sort_by - Sort field (default: 'created_at')
   * @param {string} params.sort_order - Sort order (default: 'desc')
   * @param {number} params.per_page - Items per page (default: 15)
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiService.makeRequest("/admin/requisitions", {
        method: "GET",
        params,
      });
      // Extract paginated data or return data array
      return response?.data?.data || response?.data || [];
    } catch (error) {
      console.error("Failed to fetch requisitions:", error);
      return []; // Return empty array on error
    }
  },

  /**
   * Get single requisition by ID with full details
   * @param {number} id - Requisition ID
   */
  getById: async (id) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/requisitions/${id}`
      );
      return response;
    } catch (error) {
      console.error(`Failed to fetch requisition ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new requisition
   * @param {Object} data - Requisition data
   * @param {string} data.department - Department name
   * @param {string} data.branch - Branch name
   * @param {string} data.notes - Optional notes
   * @param {Array} data.items - Array of {inventory_item_id, quantity, purpose}
   */
  create: async (data) => {
    try {
      const response = await apiService.makeRequest("/admin/requisitions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("Failed to create requisition:", error);
      throw error;
    }
  },

  // ========================================
  // USER-SPECIFIC OPERATIONS
  // ========================================

  /**
   * Get current user's requisitions
   * @param {Object} params - Query parameters
   */
  getMyRequisitions: async (params = {}) => {
    try {
      const response = await apiService.makeRequest(
        "/admin/requisitions/my/list",
        {
          method: "GET",
          params,
        }
      );
      // Backend returns: { success: true, data: { data: [...], current_page, ... } }
      // Extract the nested data array from pagination
      if (response?.data?.data) {
        return response.data.data;
      }
      return response?.data || [];
    } catch (error) {
      console.error("Failed to fetch my requisitions:", error);
      return []; // Return empty array on error
    }
  },

  // ========================================
  // STORE KEEPER OPERATIONS
  // ========================================

  /**
   * Get pending requisitions for approval (Store Keeper)
   * @param {Object} params - Query parameters
   */
  getPendingApprovals: async (params = {}) => {
    try {
      const response = await apiService.makeRequest(
        "/admin/requisitions/pending/approvals",
        {
          method: "GET",
          params,
        }
      );
      // Backend returns: { success: true, data: { data: [...], current_page, ... } }
      if (response?.data?.data) {
        return response.data.data;
      }
      return response?.data || [];
    } catch (error) {
      console.error("Failed to fetch pending approvals:", error);
      return []; // Return empty array on error
    }
  },

  /**
   * Get requisitions ready for collection
   * @param {Object} params - Query parameters
   */
  getReadyForCollection: async (params = {}) => {
    try {
      const response = await apiService.makeRequest(
        "/admin/requisitions/ready/collection",
        {
          method: "GET",
          params,
        }
      );
      // Backend returns: { success: true, data: { data: [...], current_page, ... } }
      if (response?.data?.data) {
        return response.data.data;
      }
      return response?.data || [];
    } catch (error) {
      console.error("Failed to fetch ready for collection:", error);
      return []; // Return empty array on error
    }
  },

  /**
   * Approve requisition (Store Keeper)
   * @param {number} id - Requisition ID
   * @param {string} comments - Optional approval comments
   */
  approve: async (id, comments = null) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/requisitions/${id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ comments }),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to approve requisition ${id}:`, error);
      throw error;
    }
  },

  /**
   * Reject requisition (Store Keeper)
   * @param {number} id - Requisition ID
   * @param {string} reason - Rejection reason (required)
   */
  reject: async (id, reason) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/requisitions/${id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason }),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to reject requisition ${id}:`, error);
      throw error;
    }
  },

  /**
   * Mark items ready for collection (Store Keeper)
   * @param {number} id - Requisition ID
   * @param {string} comments - Optional comments
   */
  markReady: async (id, comments = null) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/requisitions/${id}/mark-ready`,
        {
          method: "POST",
          body: JSON.stringify({ comments }),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to mark requisition ${id} as ready:`, error);
      throw error;
    }
  },

  /**
   * Mark items as collected (Store Keeper)
   * @param {number} id - Requisition ID
   * @param {string} comments - Optional comments
   */
  markCollected: async (id, comments = null) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/requisitions/${id}/mark-collected`,
        {
          method: "POST",
          body: JSON.stringify({ comments }),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to mark requisition ${id} as collected:`, error);
      throw error;
    }
  },

  // ========================================
  // STAFF OPERATIONS
  // ========================================

  /**
   * Cancel requisition (Staff, if pending)
   * @param {number} id - Requisition ID
   * @param {string} reason - Optional cancellation reason
   */
  cancel: async (id, reason = null) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/requisitions/${id}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({ reason }),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to cancel requisition ${id}:`, error);
      throw error;
    }
  },

  // ========================================
  // STATISTICS & REPORTING
  // ========================================

  /**
   * Get requisition statistics
   * @param {Object} params - Filter parameters
   * @param {number} params.user_id - Filter by user
   * @param {string} params.department - Filter by department
   * @param {string} params.date_from - Start date
   * @param {string} params.date_to - End date
   */
  getStatistics: async (params = {}) => {
    try {
      const response = await apiService.makeRequest(
        "/admin/requisitions/stats/overview",
        {
          method: "GET",
          params,
        }
      );
      // Extract data or return fallback
      return response?.data || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        collected: 0,
        ready_for_collection: 0,
      };
    } catch (error) {
      console.error("Failed to fetch requisition statistics:", error);
      // Return fallback data on error
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        collected: 0,
        ready_for_collection: 0,
      };
    }
  },

  // ========================================
  // SEARCH & FILTER HELPERS
  // ========================================

  /**
   * Search requisitions by code
   * @param {string} searchTerm - Requisition code search
   * @param {Object} additionalParams - Additional filters
   */
  search: async (searchTerm, additionalParams = {}) => {
    try {
      const response = await apiService.makeRequest("/admin/requisitions", {
        method: "GET",
        params: {
          search: searchTerm,
          ...additionalParams,
        },
      });
      return response;
    } catch (error) {
      console.error("Failed to search requisitions:", error);
      throw error;
    }
  },

  /**
   * Get requisitions by status
   * @param {string} status - Status filter
   * @param {Object} additionalParams - Additional filters
   */
  getByStatus: async (status, additionalParams = {}) => {
    try {
      const response = await apiService.makeRequest("/admin/requisitions", {
        method: "GET",
        params: {
          status,
          ...additionalParams,
        },
      });
      // Backend returns: { success: true, data: { data: [...], current_page, ... } }
      if (response?.data?.data) {
        return response.data.data;
      }
      return response?.data || [];
    } catch (error) {
      console.error(`Failed to fetch requisitions with status ${status}:`, error);
      return []; // Return empty array on error
    }
  },

  /**
   * Get requisitions by department
   * @param {string} department - Department name
   * @param {Object} additionalParams - Additional filters
   */
  getByDepartment: async (department, additionalParams = {}) => {
    try {
      const response = await apiService.makeRequest("/admin/requisitions", {
        method: "GET",
        params: {
          department,
          ...additionalParams,
        },
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch requisitions for department ${department}:`, error);
      throw error;
    }
  },

  /**
   * Get requisitions by date range
   * @param {string} dateFrom - Start date (YYYY-MM-DD)
   * @param {string} dateTo - End date (YYYY-MM-DD)
   * @param {Object} additionalParams - Additional filters
   */
  getByDateRange: async (dateFrom, dateTo, additionalParams = {}) => {
    try {
      const response = await apiService.makeRequest("/admin/requisitions", {
        method: "GET",
        params: {
          date_from: dateFrom,
          date_to: dateTo,
          ...additionalParams,
        },
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch requisitions by date range:", error);
      throw error;
    }
  },
};

export default requisitionAPI;
