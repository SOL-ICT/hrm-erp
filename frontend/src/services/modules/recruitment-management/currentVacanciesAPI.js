import { apiService } from "../../api";

const currentVacanciesAPI = {
  // ========================================
  // CURRENT VACANCIES OPERATIONS
  // ========================================

  /**
   * Get all current vacancies with applications
   */
  getCurrentVacancies: async (params = {}) => {
    try {
      const response = await apiService.makeRequest("/current-vacancies", {
        method: "GET",
        params,
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch current vacancies:", error);
      throw error;
    }
  },

  /**
   * Send interview invitations to selected candidates
   */
  sendInterviewInvitations: async (data) => {
    try {
      const response = await apiService.makeRequest(
        "/current-vacancies/interview-invitations",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to send interview invitations:", error);
      throw error;
    }
  },

  /**
   * Send test invitations to selected candidates
   */
  sendTestInvitations: async (data) => {
    try {
      const response = await apiService.makeRequest(
        "/current-vacancies/test-invitations",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to send test invitations:", error);
      throw error;
    }
  },

  /**
   * Get test invitations for a recruitment request
   */
  getTestInvitations: async (recruitmentRequestId) => {
    try {
      const response = await apiService.makeRequest(
        "/current-vacancies/test-invitations",
        {
          method: "GET",
          params: { recruitment_request_id: recruitmentRequestId },
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch test invitations:", error);
      throw error;
    }
  },

  /**
   * Get available tests that can be reused
   */
  getAvailableTests: async () => {
    try {
      const response = await apiService.makeRequest(
        "/current-vacancies/available-tests",
        {
          method: "GET",
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch available tests:", error);
      throw error;
    }
  },

  /**
   * Get interview invitations for a recruitment request
   */
  getInterviewInvitations: async (recruitmentRequestId) => {
    try {
      const response = await apiService.makeRequest(
        "/current-vacancies/interview-invitations",
        {
          method: "GET",
          params: { recruitment_request_id: recruitmentRequestId },
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch interview invitations:", error);
      throw error;
    }
  },

  /**
   * Update an interview invitation
   */
  updateInvitation: async (invitationId, data) => {
    try {
      const response = await apiService.makeRequest(
        `/current-vacancies/interview-invitations/${invitationId}`,
        {
          method: "PUT",
          data,
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to update interview invitation:", error);
      throw error;
    }
  },

  /**
   * Cancel an interview invitation
   */
  cancelInvitation: async (invitationId) => {
    try {
      const response = await apiService.makeRequest(
        `/current-vacancies/interview-invitations/${invitationId}`,
        {
          method: "DELETE",
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to cancel interview invitation:", error);
      throw error;
    }
  },

  /**
   * Bulk send invitations
   */
  bulkSendInvitations: async (data) => {
    try {
      const response = await apiService.makeRequest(
        "/current-vacancies/bulk/send-invitations",
        {
          method: "POST",
          data,
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to bulk send invitations:", error);
      throw error;
    }
  },

  /**
   * Bulk cancel invitations
   */
  bulkCancelInvitations: async (data) => {
    try {
      const response = await apiService.makeRequest(
        "/current-vacancies/bulk/cancel-invitations",
        {
          method: "POST",
          data,
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to bulk cancel invitations:", error);
      throw error;
    }
  },
};

export default currentVacanciesAPI;
