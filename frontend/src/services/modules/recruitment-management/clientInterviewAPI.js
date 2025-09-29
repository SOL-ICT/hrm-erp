import { apiService } from '../../api';

/**
 * Client Interview API
 * Handles all client interview related API calls
 */
class ClientInterviewAPI {
  constructor() {
    this.baseEndpoint = '/client-interviews';
  }

  /**
   * Get active tickets with their candidates for client interview invitation
   * @returns {Promise} API response with tickets and candidates data
   */
  async getActiveTicketsWithCandidates() {
    try {
      const response = await apiService.makeRequest(
        `${this.baseEndpoint}/active-tickets-with-candidates`,
        {
          method: 'GET'
        }
      );
      return response;
    } catch (error) {
      console.error('Error fetching active tickets with candidates:', error);
      throw error;
    }
  }

  /**
   * Get clients dropdown data
   * @returns {Promise} API response with clients data
   */
  async getClientsDropdown() {
    try {
      const response = await apiService.makeRequest(
        `${this.baseEndpoint}/clients/dropdown`,
        {
          method: 'GET'
        }
      );
      return response;
    } catch (error) {
      console.error('Error fetching clients dropdown:', error);
      throw error;
    }
  }

  /**
   * Get all client interviews
   * @returns {Promise} API response with interviews data
   */
  async getAllInterviews() {
    try {
      const response = await apiService.makeRequest(
        `${this.baseEndpoint}`,
        {
          method: 'GET'
        }
      );
      return response;
    } catch (error) {
      console.error('Error fetching client interviews:', error);
      throw error;
    }
  }

  /**
   * Create a new client interview
   * @param {Object} interviewData - Interview data
   * @returns {Promise} API response
   */
  async createInterview(interviewData) {
    try {
      const response = await apiService.makeRequest(
        `${this.baseEndpoint}`,
        {
          method: 'POST',
          body: JSON.stringify(interviewData)
        }
      );
      return response;
    } catch (error) {
      console.error('Error creating client interview:', error);
      throw error;
    }
  }

  /**
   * Get a specific client interview
   * @param {number} id - Interview ID
   * @returns {Promise} API response with interview data
   */
  async getInterview(id) {
    try {
      const response = await apiService.makeRequest(
        `${this.baseEndpoint}/${id}`,
        {
          method: 'GET'
        }
      );
      return response;
    } catch (error) {
      console.error('Error fetching client interview:', error);
      throw error;
    }
  }

  /**
   * Update a client interview
   * @param {number} id - Interview ID
   * @param {Object} interviewData - Updated interview data
   * @returns {Promise} API response
   */
  async updateInterview(id, interviewData) {
    try {
      const response = await apiService.makeRequest(
        `${this.baseEndpoint}/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(interviewData)
        }
      );
      return response;
    } catch (error) {
      console.error('Error updating client interview:', error);
      throw error;
    }
  }

  /**
   * Delete a client interview
   * @param {number} id - Interview ID
   * @returns {Promise} API response
   */
  async deleteInterview(id) {
    try {
      const response = await apiService.makeRequest(
        `${this.baseEndpoint}/${id}`,
        {
          method: 'DELETE'
        }
      );
      return response;
    } catch (error) {
      console.error('Error deleting client interview:', error);
      throw error;
    }
  }
}

// Create and export instance
const clientInterviewAPI = new ClientInterviewAPI();
export default clientInterviewAPI;
