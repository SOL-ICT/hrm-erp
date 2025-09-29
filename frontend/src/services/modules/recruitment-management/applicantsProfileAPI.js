import { apiService } from "../../api";

const applicantsProfileAPI = {
  /**
   * Get all candidates with filtering, searching and pagination
   */
  getAll: async (params = {}) => {
    try {
      const response = await apiService.makeRequest("/applicants-profile", {
        method: "GET",
        params: {
          limit: 15,
          offset: 0,
          ...params,
          _t: Date.now() // Cache buster
        },
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch applicants:", error);
      throw error;
    }
  },

  /**
   * Get detailed candidate information for modal view
   */
  getCandidateDetails: async (candidateId) => {
    try {
      const response = await apiService.makeRequest(`/applicants-profile/${candidateId}/details`, {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch candidate details for ID ${candidateId}:`, error);
      throw error;
    }
  },

  /**
   * Assign candidate to recruitment request (push to ticket)
   */
  assignToTicket: async (candidateId, recruitmentRequestId, motivation = '') => {
    try {
      const response = await apiService.makeRequest("/applicants-profile/assign-to-ticket", {
        method: "POST",
        body: JSON.stringify({
          candidate_id: candidateId,
          recruitment_request_id: recruitmentRequestId,
          motivation: motivation
        }),
      });
      return response;
    } catch (error) {
      console.error(`Failed to assign candidate ${candidateId} to ticket ${recruitmentRequestId}:`, error);
      throw error;
    }
  },

  /**
   * Get list of states for filtering (utility method)
   */
  getStates: async () => {
    try {
      const response = await apiService.makeRequest("/states-lgas", {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch states:", error);
      throw error;
    }
  }
};

export default applicantsProfileAPI;
