import { apiService } from "../../api";

const applicantProfileAPI = {
  // ========================================
  // MAIN OPERATIONS
  // ========================================

  /**
   * Get all applicant profiles with filtering and search
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiService.makeRequest("/applicant-profiles", {
        method: "GET",
        params,
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch applicant profiles:", error);
      throw error;
    }
  },

  /**
   * Get a specific applicant profile by ID with all related data
   */
  getById: async (id, signal = null) => {
    try {
      const response = await apiService.makeRequest(
        `/applicant-profiles/${id}`,
        { signal }
      );
      return response;
    } catch (error) {
      // Don't log errors for aborted requests
      if (error.name !== "AbortError") {
        console.error(`Failed to fetch applicant profile ${id}:`, error);
      }
      throw error;
    }
  },

  /**
   * Get applicant profile statistics
   */
  getStatistics: async () => {
    try {
      const response = await apiService.makeRequest(
        "/applicant-profiles-statistics"
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch applicant statistics:", error);
      // Return fallback data on error
      return {
        success: false,
        data: {
          total_applicants: 0,
          completed_profiles: 0,
          incomplete_profiles: 0,
        },
      };
    }
  },

  // ========================================
  // SEARCH HELPERS
  // ========================================

  /**
   * Search applicants by name, email, or phone
   */
  search: async (searchTerm, params = {}) => {
    try {
      const response = await apiService.makeRequest("/applicant-profiles", {
        method: "GET",
        params: {
          search: searchTerm,
          ...params,
        },
      });
      return response;
    } catch (error) {
      console.error("Failed to search applicant profiles:", error);
      throw error;
    }
  },

  /**
   * Filter applicants by status
   */
  getByStatus: async (status, params = {}) => {
    try {
      const response = await apiService.makeRequest("/applicant-profiles", {
        method: "GET",
        params: {
          status,
          ...params,
        },
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch applicants with status ${status}:`, error);
      throw error;
    }
  },
};

export default applicantProfileAPI;
