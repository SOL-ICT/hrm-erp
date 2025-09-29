import apiService from "../../../apiService";

export const offerLetterAPI = {
  getForGrade: async (params = {}) => {
    const queryString = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ""
      ) {
        queryString.append(key, params[key]);
      }
    });

    const endpoint = `/offer-letter-templates/grade${
      queryString.toString() ? `?${queryString}` : ""
    }`;
    
    // Handle this API call manually to properly handle 404 "not found" responses
    const url = `${apiService.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: apiService.getHeaders(),
        credentials: "include",
      });
      
      const data = await response.json();
      
      // For this specific endpoint, 404 with JSON response is valid (no template exists)
      if (response.status === 404 && data.success === false) {
        return data; // Return the "no template found" response, don't throw error
      }
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (fetchError) {
      // Handle network errors gracefully
      return {
        success: false,
        message: "Unable to check for existing template",
        data: null
      };
    }
  },

  create: async (data) => {
    try {
      return await apiService.makeRequest("/offer-letter-templates", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error creating offer letter template:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      return await apiService.makeRequest(`/offer-letter-templates/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error updating offer letter template:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      return await apiService.makeRequest(`/offer-letter-templates/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting offer letter template:", error);
      throw error;
    }
  },

  getSalaryComponents: async (params = {}) => {
    try {
      const queryString = new URLSearchParams();
      Object.keys(params).forEach((key) => {
        if (
          params[key] !== null &&
          params[key] !== undefined &&
          params[key] !== ""
        ) {
          queryString.append(key, params[key]);
        }
      });

      const endpoint = `/offer-letter-templates/salary-components${
        queryString.toString() ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching salary components:", error);
      throw error;
    }
  },

  generatePreview: async (data) => {
    try {
      return await apiService.makeRequest("/offer-letter-templates/preview", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error generating preview:", error);
      throw error;
    }
  },
};
