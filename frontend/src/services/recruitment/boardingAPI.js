import { apiService } from '../api';

class BoardingAPI {
  // Base URL for boarding endpoints
  baseURL = '/recruitment-management/boarding';

  /**
   * Get clients with active recruitment requests
   */
  async getClients() {
    try {
      const response = await apiService.makeRequest(`${this.baseURL}/clients`);
      return response;
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      throw error;
    }
  }

  /**
   * Get tickets for a specific client
   */
  async getTickets(clientId) {
    try {
      const response = await apiService.makeRequest(`${this.baseURL}/tickets`, {
        method: 'GET',
        params: { client_id: clientId }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      throw error;
    }
  }

  /**
   * Get pay grades for a job structure
   */
  async getPayGrades(jobStructureId) {
    try {
      const response = await apiService.makeRequest(`${this.baseURL}/pay-grades`, {
        method: 'GET',
        params: { job_structure_id: jobStructureId }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch pay grades:', error);
      throw error;
    }
  }

  /**
   * Get candidates eligible for offer (recommended but no active offers)
   */
  async getCandidatesForOffer(recruitmentRequestId) {
    try {
      const response = await apiService.makeRequest(`${this.baseURL}/candidates/offer`, {
        method: 'GET',
        params: { recruitment_request_id: recruitmentRequestId }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch candidates for offer:', error);
      throw error;
    }
  }

  /**
   * Get candidates ready for boarding (accepted offers)
   */
  async getCandidatesForBoarding(recruitmentRequestId) {
    try {
      const response = await apiService.makeRequest(`${this.baseURL}/candidates/boarding`, {
        method: 'GET',
        params: { recruitment_request_id: recruitmentRequestId }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch candidates for boarding:', error);
      throw error;
    }
  }

  /**
   * Send offers to multiple candidates (bulk operation)
   */
  async sendOffers(offerData) {
    try {
      const response = await apiService.makeRequest(`${this.baseURL}/offers/send`, {
        method: 'POST',
        body: JSON.stringify(offerData)
      });
      return response;
    } catch (error) {
      console.error('Failed to send offers:', error);
      throw error;
    }
  }

  /**
   * Board multiple candidates (bulk operation)
   */
  async boardCandidates(candidateData) {
    try {
      const response = await apiService.makeRequest(`${this.baseURL}/candidates/board`, {
        method: 'POST',
        body: JSON.stringify(candidateData)
      });
      return response;
    } catch (error) {
      console.error('Failed to board candidates:', error);
      throw error;
    }
  }
}

export default new BoardingAPI();
