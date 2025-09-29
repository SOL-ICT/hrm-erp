import apiService from "../../../apiService";

export const jobStructuresAPI = {
  getAll: async (params = {}) => {
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

      const endpoint = `/salary-structure/job-structures${
        queryString.toString() ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching job structures:", error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const endpoint = `/salary-structure/job-structures/${id}`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching job structure:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const endpoint = "/salary-structure/job-structures";
      return await apiService.makeRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error creating job structure:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const endpoint = `/salary-structure/job-structures/${id}`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error updating job structure:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const endpoint = `/salary-structure/job-structures/${id}`;
      return await apiService.makeRequest(endpoint, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting job structure:", error);
      throw error;
    }
  },
};
