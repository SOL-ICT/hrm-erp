import { apiService } from "../../api";

export const employeeRecordAPI = {
  // Get all active clients
  getClients: async () => {
    try {
      const endpoint = "/employee-record/clients";
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  },

  // Get locations for a specific client
  getLocationsByClient: async (clientId) => {
    try {
      const endpoint = `/employee-record/clients/${clientId}/locations`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching locations:", error);
      throw error;
    }
  },

  // Get staff with filtering options
  getStaff: async (params = {}) => {
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

      const endpoint = `/employee-record/staff${
        queryString.toString() ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching staff:", error);
      throw error;
    }
  },

  // Get comprehensive staff details with all related information
  getStaffDetails: async (staffId) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/details`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching staff details:", error);
      throw error;
    }
  },

  // Update staff basic information
  updateStaffBasic: async (staffId, data) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/basic`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error updating staff basic info:", error);
      throw error;
    }
  },

  // Update staff personal information
  updateStaffPersonal: async (staffId, data) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/personal`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error updating staff personal info:", error);
      throw error;
    }
  },

  // Update staff banking information
  updateStaffBanking: async (staffId, data) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/banking`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error updating staff banking info:", error);
      throw error;
    }
  },

  // Update staff education records
  updateStaffEducation: async (staffId, education) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/education`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify({ education }),
      });
    } catch (error) {
      console.error("Error updating staff education:", error);
      throw error;
    }
  },

  // Add staff education record
  addStaffEducation: async (staffId, data) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/education`;
      return await apiService.makeRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error adding staff education:", error);
      throw error;
    }
  },

  // Delete staff education record
  deleteStaffEducation: async (staffId, educationId) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/education/${educationId}`;
      return await apiService.makeRequest(endpoint, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting staff education:", error);
      throw error;
    }
  },

  // Update staff experience records
  updateStaffExperience: async (staffId, experience) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/experience`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify({ experience }),
      });
    } catch (error) {
      console.error("Error updating staff experience:", error);
      throw error;
    }
  },

  // Add staff experience record
  addStaffExperience: async (staffId, data) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/experience`;
      return await apiService.makeRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error adding staff experience:", error);
      throw error;
    }
  },

  // Delete staff experience record
  deleteStaffExperience: async (staffId, experienceId) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/experience/${experienceId}`;
      return await apiService.makeRequest(endpoint, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting staff experience:", error);
      throw error;
    }
  },

  // Update staff emergency contacts
  updateStaffEmergencyContacts: async (staffId, contacts) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/emergency-contacts`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify({ contacts }),
      });
    } catch (error) {
      console.error("Error updating emergency contacts:", error);
      throw error;
    }
  },

  // Add staff emergency contact
  addStaffEmergencyContact: async (staffId, data) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/emergency-contacts`;
      return await apiService.makeRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error adding emergency contact:", error);
      throw error;
    }
  },

  // Delete staff emergency contact
  deleteStaffEmergencyContact: async (staffId, contactId) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/emergency-contacts/${contactId}`;
      return await apiService.makeRequest(endpoint, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
      throw error;
    }
  },

  // Update staff guarantors
  updateStaffGuarantors: async (staffId, guarantors) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/guarantors`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify({ guarantors }),
      });
    } catch (error) {
      console.error("Error updating guarantors:", error);
      throw error;
    }
  },

  // Add staff guarantor
  addStaffGuarantor: async (staffId, data) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/guarantors`;
      return await apiService.makeRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error adding guarantor:", error);
      throw error;
    }
  },

  // Delete staff guarantor
  deleteStaffGuarantor: async (staffId, guarantorId) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/guarantors/${guarantorId}`;
      return await apiService.makeRequest(endpoint, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting guarantor:", error);
      throw error;
    }
  },

  // Update staff legal IDs
  updateStaffLegalIds: async (staffId, data) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/legal-ids`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error updating legal IDs:", error);
      throw error;
    }
  },

  // Update staff references
  updateStaffReferences: async (staffId, references) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/references`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify({ references }),
      });
    } catch (error) {
      console.error("Error updating references:", error);
      throw error;
    }
  },

  // Add staff reference
  addStaffReference: async (staffId, data) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/references`;
      return await apiService.makeRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error adding reference:", error);
      throw error;
    }
  },

  // Delete staff reference
  deleteStaffReference: async (staffId, referenceId) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/references/${referenceId}`;
      return await apiService.makeRequest(endpoint, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting reference:", error);
      throw error;
    }
  },

  // Update complete staff details (all sections at once)
  updateStaffDetails: async (staffId, data) => {
    try {
      const endpoint = `/employee-record/staff/${staffId}/complete`;
      return await apiService.makeRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error updating complete staff details:", error);
      throw error;
    }
  },

  // Get staff statistics for dashboard
  getStaffStatistics: async (params = {}) => {
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

      const endpoint = `/employee-record/statistics${
        queryString.toString() ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching staff statistics:", error);
      throw error;
    }
  },

  // Export staff data
  exportStaffData: async (params = {}) => {
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

      const endpoint = `/employee-record/export${
        queryString.toString() ? `?${queryString}` : ""
      }`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error exporting staff data:", error);
      throw error;
    }
  },
};

export default employeeRecordAPI;
