import { apiService } from "@/services/api";

const STAFF_REGISTRATION_ENDPOINTS = {
  CLIENTS: "/staff-registration/clients",
  SEARCH: "/staff-registration/search",
  CREATE_ACCOUNT: "/staff-registration/create-account",
};

export const staffRegistrationAPI = {
  /**
   * Get available clients for staff registration
   */
  async getClients() {
    try {
      return await apiService.makeRequest(STAFF_REGISTRATION_ENDPOINTS.CLIENTS);
    } catch (error) {
      console.error("Error fetching clients for staff registration:", error);
      throw error;
    }
  },

  /**
   * Search for staff member by email and client
   */
  async searchStaff(email, clientId) {
    try {
      return await apiService.makeRequest(STAFF_REGISTRATION_ENDPOINTS.SEARCH, {
        method: "POST",
        body: JSON.stringify({
          email,
          client_id: clientId,
        }),
      });
    } catch (error) {
      console.error("Error searching for staff:", error);
      throw error;
    }
  },

  /**
   * Create user account for existing staff member
   */
  async createUserAccount(staffId, password, passwordConfirmation) {
    try {
      return await apiService.makeRequest(
        STAFF_REGISTRATION_ENDPOINTS.CREATE_ACCOUNT,
        {
          method: "POST",
          body: JSON.stringify({
            staff_id: staffId,
            password,
            password_confirmation: passwordConfirmation,
          }),
        }
      );
    } catch (error) {
      console.error("Error creating user account:", error);
      throw error;
    }
  },
};

export default staffRegistrationAPI;
