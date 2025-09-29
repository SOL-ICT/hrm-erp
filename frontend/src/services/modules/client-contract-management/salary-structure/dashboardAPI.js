import apiService from "../../../apiService";

export const dashboardAPI = {
  getStatistics: async () => {
    try {
      return await apiService.makeRequest(
        "/salary-structure/dashboard/statistics"
      );
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
      throw error;
    }
  },
};
