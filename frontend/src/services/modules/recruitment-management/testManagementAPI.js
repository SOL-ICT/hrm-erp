import { apiService } from "../../api";

const testManagementAPI = {
  // ========================================
  // TESTS CRUD OPERATIONS
  // ========================================

  /**
   * Get all tests with optional filters
   */
  getTests: async (params = {}) => {
    try {
      const response = await apiService.makeRequest("/test-management", {
        method: "GET",
        params,
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch tests:", error);
      throw error;
    }
  },

  /**
   * Get a specific test by ID
   */
  getTest: async (testId) => {
    try {
      const response = await apiService.makeRequest(`/test-management/${testId}`, {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch test:", error);
      throw error;
    }
  },

  /**
   * Create a new test
   */
  createTest: async (testData) => {
    try {
      const response = await apiService.makeRequest("/test-management", {
        method: "POST",
        body: JSON.stringify(testData),
      });
      return response;
    } catch (error) {
      console.error("Failed to create test:", error);
      throw error;
    }
  },

  /**
   * Update an existing test
   */
  updateTest: async (testId, testData) => {
    try {
      const response = await apiService.makeRequest(`/test-management/${testId}`, {
        method: "PUT",
        body: JSON.stringify(testData),
      });
      return response;
    } catch (error) {
      console.error("Failed to update test:", error);
      throw error;
    }
  },

  /**
   * Delete a test
   */
  deleteTest: async (testId) => {
    try {
      const response = await apiService.makeRequest(`/test-management/${testId}`, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      console.error("Failed to delete test:", error);
      throw error;
    }
  },

  /**
   * Change test status
   */
  changeTestStatus: async (testId, status) => {
    try {
      const response = await apiService.makeRequest(`/test-management/${testId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return response;
    } catch (error) {
      console.error("Failed to change test status:", error);
      throw error;
    }
  },

  // ========================================
  // TEST QUESTIONS OPERATIONS
  // ========================================

  /**
   * Get questions for a specific test
   */
  getTestQuestions: async (testId) => {
    try {
      const response = await apiService.makeRequest(`/test-management/${testId}/questions`, {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch test questions:", error);
      throw error;
    }
  },

  /**
   * Add a question to a test
   */
  createTestQuestion: async (testId, questionData) => {
    try {
      const response = await apiService.makeRequest(`/test-management/${testId}/questions`, {
        method: "POST",
        body: JSON.stringify(questionData),
      });
      return response;
    } catch (error) {
      console.error("Failed to create test question:", error);
      throw error;
    }
  },

  /**
   * Update a test question
   */
  updateTestQuestion: async (testId, questionId, questionData) => {
    try {
      const response = await apiService.makeRequest(`/test-management/${testId}/questions/${questionId}`, {
        method: "PUT",
        body: JSON.stringify(questionData),
      });
      return response;
    } catch (error) {
      console.error("Failed to update test question:", error);
      throw error;
    }
  },

  /**
   * Delete a test question
   */
  deleteTestQuestion: async (testId, questionId) => {
    try {
      const response = await apiService.makeRequest(`/test-management/${testId}/questions/${questionId}`, {
        method: "DELETE",
      });
      return response;
    } catch (error) {
      console.error("Failed to delete test question:", error);
      throw error;
    }
  },

  // ========================================
  // TEST ASSIGNMENTS OPERATIONS
  // ========================================

  /**
   * Assign a test to candidates
   */
  assignTest: async (assignmentData) => {
    try {
      const response = await apiService.makeRequest("/test-management/assignments", {
        method: "POST",
        body: JSON.stringify(assignmentData),
      });
      return response;
    } catch (error) {
      console.error("Failed to assign test:", error);
      throw error;
    }
  },

  /**
   * Get test assignments for a recruitment request
   */
  getTestAssignments: async (recruitmentRequestId) => {
    try {
      const response = await apiService.makeRequest(`/test-management/assignments/recruitment/${recruitmentRequestId}`, {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch test assignments:", error);
      throw error;
    }
  },

  // ========================================
  // TEST RESULTS OPERATIONS
  // ========================================

  /**
   * Get test results for a recruitment request
   */
  getTestResults: async (recruitmentRequestId) => {
    try {
      const response = await apiService.makeRequest(`/test-management/results/recruitment/${recruitmentRequestId}`, {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch test results:", error);
      throw error;
    }
  },

  /**
   * Get detailed results for a specific test assignment
   */
  getTestResultDetails: async (assignmentId) => {
    try {
      const response = await apiService.makeRequest(`/test-management/results/assignment/${assignmentId}`, {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch test result details:", error);
      throw error;
    }
  },

  // ========================================
  // ANALYTICS OPERATIONS
  // ========================================

  /**
   * Get test analytics and statistics
   */
  getTestAnalytics: async (testId) => {
    try {
      const response = await apiService.makeRequest(`/test-management/${testId}/analytics`, {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch test analytics:", error);
      throw error;
    }
  },

  /**
   * Get overall recruitment test statistics
   */
  getOverallTestStats: async () => {
    try {
      const response = await apiService.makeRequest("/test-management/statistics", {
        method: "GET",
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch test statistics:", error);
      throw error;
    }
  },
};

export default testManagementAPI;
