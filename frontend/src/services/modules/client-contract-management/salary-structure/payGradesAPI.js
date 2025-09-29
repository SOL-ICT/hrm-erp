import apiService from "../../../apiService";

export const payGradesAPI = {
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

      const endpoint = `/salary-structure/pay-grades${
        queryString.toString() ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching pay grades:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      return await apiService.makeRequest("/salary-structure/pay-grades", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error creating pay grade:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      return await apiService.makeRequest(
        `/salary-structure/pay-grades/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.error("Error updating pay grade:", error);
      throw error;
    }
  },

  getByJobStructure: async (jobStructureId) => {
    try {
      const endpoint = `/salary-structure/pay-grades/job/${jobStructureId}`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching pay grades for job structure:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      return await apiService.makeRequest(
        `/salary-structure/pay-grades/${id}`,
        {
          method: "DELETE",
        }
      );
    } catch (error) {
      console.error("Error deleting pay grade:", error);
      throw error;
    }
  },
};
