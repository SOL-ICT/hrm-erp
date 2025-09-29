import apiService from "../../../apiService";

export const utilitiesAPI = {
  getClients: async () => {
    try {
      const response = await apiService.makeRequest(
        "/salary-structure/clients"
      );
      return response;
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  },

  getPayStructureTypes: async () => {
    try {
      const response = await apiService.makeRequest(
        "/salary-structure/pay-structure-types"
      );
      return response;
    } catch (error) {
      console.error("Error fetching pay structure types:", error);

      // For debugging - provide fallback data if API fails due to auth
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        console.warn(
          "Authentication required for pay structure types, returning empty data"
        );
        return {
          success: true,
          data: {
            all: [],
            grouped: {},
          },
          message: "Authentication required",
        };
      }

      throw error;
    }
  },

  getEmolumentComponents: async (params = {}) => {
    try {
      console.log("🔧 utilitiesAPI.getEmolumentComponents called with params:", params);
      
      // Use the dedicated utility endpoint that returns all components in the correct format
      const endpoint = "/salary-structure/utilities/emolument-components";
      console.log("🔧 Full URL will be:", `${apiService.baseURL || 'http://localhost:8000/api'}${endpoint}`);
      
      const response = await apiService.makeRequest(endpoint, {
        method: "GET",
        params: params,
      });
      
      console.log("🔧 utilitiesAPI.getEmolumentComponents response:", response);
      return response;
    } catch (error) {
      console.error("Error fetching emolument components:", error);
      throw error;
    }
  },
};
