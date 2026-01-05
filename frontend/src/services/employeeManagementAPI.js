// Employee Management API Service
import { apiService } from "./api";

const employeeManagementAPI = {
  // ========================================
  // HELPER/DROPDOWN ENDPOINTS
  // ========================================

  getClients: async () => {
    return apiService.makeRequest("/employee-management/helpers/clients");
  },

  getJobStructures: async (clientId) => {
    const params = clientId ? `?client_id=${clientId}` : "";
    return apiService.makeRequest(
      `/employee-management/helpers/job-structures${params}`
    );
  },

  getPayGrades: async (clientIdOrJobStructureId, isJobStructureId = false) => {
    const paramName = isJobStructureId ? 'job_structure_id' : 'client_id';
    const params = clientIdOrJobStructureId ? `?${paramName}=${clientIdOrJobStructureId}` : "";
    return apiService.makeRequest(
      `/employee-management/helpers/pay-grades${params}`
    );
  },

  getStaff: async (clientId, status = "active") => {
    const params = `?client_id=${clientId}&status=${status}`;
    return apiService.makeRequest(
      `/employee-management/helpers/staff${params}`
    );
  },

  getDepartments: async () => {
    return apiService.makeRequest("/employee-management/helpers/departments");
  },

  getDesignations: async () => {
    return apiService.makeRequest("/employee-management/helpers/designations");
  },

  getServiceLocations: async () => {
    return apiService.makeRequest(
      "/employee-management/helpers/service-locations"
    );
  },

  getTerminationTypes: async () => {
    return apiService.makeRequest(
      "/employee-management/helpers/termination-types"
    );
  },

  getRedeploymentTypes: async () => {
    return apiService.makeRequest(
      "/employee-management/helpers/redeployment-types"
    );
  },

  getWarningLevels: async () => {
    return apiService.makeRequest(
      "/employee-management/helpers/warning-levels"
    );
  },

  // ========================================
  // TERMINATION ENDPOINTS
  // ========================================

  getTerminations: async (clientId) => {
    const params = clientId ? `?client_id=${clientId}` : "";
    return apiService.makeRequest(`/employee-management/terminations${params}`);
  },

  getTermination: async (id) => {
    return apiService.makeRequest(`/employee-management/terminations/${id}`);
  },

  createTermination: async (data) => {
    return apiService.makeRequest("/employee-management/terminations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTermination: async (id, data) => {
    return apiService.makeRequest(`/employee-management/terminations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteTermination: async (id) => {
    return apiService.makeRequest(`/employee-management/terminations/${id}`, {
      method: "DELETE",
    });
  },

  downloadTerminationTemplate: async () => {
    const response = await fetch(
      `${apiService.baseURL}/employee-management/terminations/template/download`,
      {
        headers: {
          Authorization: `Bearer ${apiService.getAuthToken()}`,
        },
      }
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "terminations_upload_template.xlsx";
    a.click();
  },

  bulkUploadTerminations: async (clientId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", clientId);

    return apiService.makeRequest(
      "/employee-management/terminations/bulk/upload",
      {
        method: "POST",
        body: formData,
      }
    );
  },

  // ========================================
  // PROMOTION ENDPOINTS
  // ========================================

  getPromotions: async (clientId) => {
    const params = clientId ? `?client_id=${clientId}` : "";
    return apiService.makeRequest(`/employee-management/promotions${params}`);
  },

  getPromotion: async (id) => {
    return apiService.makeRequest(`/employee-management/promotions/${id}`);
  },

  createPromotion: async (data) => {
    return apiService.makeRequest("/employee-management/promotions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updatePromotion: async (id, data) => {
    return apiService.makeRequest(`/employee-management/promotions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deletePromotion: async (id) => {
    return apiService.makeRequest(`/employee-management/promotions/${id}`, {
      method: "DELETE",
    });
  },

  downloadPromotionTemplate: async () => {
    const response = await fetch(
      `${apiService.baseURL}/employee-management/promotions/template/download`,
      {
        headers: {
          Authorization: `Bearer ${apiService.getAuthToken()}`,
        },
      }
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "promotions_upload_template.xlsx";
    a.click();
  },

  bulkUploadPromotions: async (clientId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", clientId);

    return apiService.makeRequest(
      "/employee-management/promotions/bulk/upload",
      {
        method: "POST",
        body: formData,
      }
    );
  },

  // ========================================
  // REDEPLOYMENT ENDPOINTS
  // ========================================

  getRedeployments: async (clientId) => {
    const params = clientId ? `?client_id=${clientId}` : "";
    return apiService.makeRequest(
      `/employee-management/redeployments${params}`
    );
  },

  getRedeployment: async (id) => {
    return apiService.makeRequest(`/employee-management/redeployments/${id}`);
  },

  createRedeployment: async (data) => {
    return apiService.makeRequest("/employee-management/redeployments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateRedeployment: async (id, data) => {
    return apiService.makeRequest(`/employee-management/redeployments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteRedeployment: async (id) => {
    return apiService.makeRequest(`/employee-management/redeployments/${id}`, {
      method: "DELETE",
    });
  },

  downloadRedeploymentTemplate: async () => {
    const response = await fetch(
      `${apiService.baseURL}/employee-management/redeployments/template/download`,
      {
        headers: {
          Authorization: `Bearer ${apiService.getAuthToken()}`,
        },
      }
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "redeployments_upload_template.xlsx";
    a.click();
  },

  bulkUploadRedeployments: async (clientId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", clientId);

    return apiService.makeRequest(
      "/employee-management/redeployments/bulk/upload",
      {
        method: "POST",
        body: formData,
      }
    );
  },

  // ========================================
  // CAUTION ENDPOINTS
  // ========================================

  getCautions: async (clientId) => {
    const params = clientId ? `?client_id=${clientId}` : "";
    return apiService.makeRequest(`/employee-management/cautions${params}`);
  },

  getCaution: async (id) => {
    return apiService.makeRequest(`/employee-management/cautions/${id}`);
  },

  createCaution: async (data) => {
    return apiService.makeRequest("/employee-management/cautions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateCaution: async (id, data) => {
    return apiService.makeRequest(`/employee-management/cautions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  bulkUpdateCautionStatus: async (cautionIds, status) => {
    return apiService.makeRequest("/employee-management/cautions/bulk/update-status", {
      method: "POST",
      body: JSON.stringify({ caution_ids: cautionIds, status }),
    });
  },

  deleteCaution: async (id) => {
    return apiService.makeRequest(`/employee-management/cautions/${id}`, {
      method: "DELETE",
    });
  },

  downloadCautionTemplate: async () => {
    const response = await fetch(
      `${apiService.baseURL}/employee-management/cautions/template/download`,
      {
        headers: {
          Authorization: `Bearer ${apiService.getAuthToken()}`,
        },
      }
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cautions_upload_template.xlsx";
    a.click();
  },

  bulkUploadCautions: async (clientId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", clientId);

    return apiService.makeRequest("/employee-management/cautions/bulk/upload", {
      method: "POST",
      body: formData,
    });
  },

  // ========================================
  // WARNING ENDPOINTS
  // ========================================

  getWarnings: async (clientId) => {
    const params = clientId ? `?client_id=${clientId}` : "";
    return apiService.makeRequest(`/employee-management/warnings${params}`);
  },

  getWarning: async (id) => {
    return apiService.makeRequest(`/employee-management/warnings/${id}`);
  },

  createWarning: async (data) => {
    return apiService.makeRequest("/employee-management/warnings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateWarning: async (id, data) => {
    return apiService.makeRequest(`/employee-management/warnings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  bulkUpdateWarningStatus: async (warningIds, status) => {
    return apiService.makeRequest("/employee-management/warnings/bulk/update-status", {
      method: "POST",
      body: JSON.stringify({ warning_ids: warningIds, status }),
    });
  },

  deleteWarning: async (id) => {
    return apiService.makeRequest(`/employee-management/warnings/${id}`, {
      method: "DELETE",
    });
  },

  downloadWarningTemplate: async () => {
    const response = await fetch(
      `${apiService.baseURL}/employee-management/warnings/template/download`,
      {
        headers: {
          Authorization: `Bearer ${apiService.getAuthToken()}`,
        },
      }
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "warnings_upload_template.xlsx";
    a.click();
  },

  bulkUploadWarnings: async (clientId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", clientId);

    return apiService.makeRequest("/employee-management/warnings/bulk/upload", {
      method: "POST",
      body: formData,
    });
  },

  // ========================================
  // SUSPENSION ENDPOINTS
  // ========================================

  getSuspensions: async (clientId) => {
    const params = clientId ? `?client_id=${clientId}` : "";
    return apiService.makeRequest(`/employee-management/suspensions${params}`);
  },

  getSuspension: async (id) => {
    return apiService.makeRequest(`/employee-management/suspensions/${id}`);
  },

  createSuspension: async (data) => {
    return apiService.makeRequest("/employee-management/suspensions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateSuspension: async (id, data) => {
    return apiService.makeRequest(`/employee-management/suspensions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteSuspension: async (id) => {
    return apiService.makeRequest(`/employee-management/suspensions/${id}`, {
      method: "DELETE",
    });
  },

  downloadSuspensionTemplate: async () => {
    const response = await fetch(
      `${apiService.baseURL}/employee-management/suspensions/template/download`,
      {
        headers: {
          Authorization: `Bearer ${apiService.getAuthToken()}`,
        },
      }
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suspensions_upload_template.xlsx";
    a.click();
  },

  bulkUploadSuspensions: async (clientId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", clientId);

    return apiService.makeRequest(
      "/employee-management/suspensions/bulk/upload",
      {
        method: "POST",
        body: formData,
      }
    );
  },

  // ========================================
  // STAFF QUERY ENDPOINTS (Note: No Query table in backend yet)
  // ========================================

  getStaffQueries: async (clientId) => {
    const params = clientId ? `?client_id=${clientId}` : "";
    return apiService.makeRequest(
      `/employee-management/staff-queries${params}`
    );
  },

  getStaffQuery: async (id) => {
    return apiService.makeRequest(`/employee-management/staff-queries/${id}`);
  },

  createStaffQuery: async (data) => {
    return apiService.makeRequest("/employee-management/staff-queries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateStaffQuery: async (id, data) => {
    return apiService.makeRequest(`/employee-management/staff-queries/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteStaffQuery: async (id) => {
    return apiService.makeRequest(`/employee-management/staff-queries/${id}`, {
      method: "DELETE",
    });
  },

  // ========================================
  // BLACKLIST ENDPOINTS
  // ========================================

  getBlacklistedStaff: async (clientId) => {
    const params = clientId ? `?client_id=${clientId}` : "";
    return apiService.makeRequest(`/employee-management/blacklist${params}`);
  },

  getBlacklistRecord: async (id) => {
    return apiService.makeRequest(`/employee-management/blacklist/${id}`);
  },

  removeFromBlacklist: async (id) => {
    return apiService.makeRequest(`/employee-management/blacklist/${id}`, {
      method: "DELETE",
    });
  },

  checkBlacklist: async (searchData) => {
    return apiService.makeRequest("/employee-management/blacklist/check", {
      method: "POST",
      body: JSON.stringify(searchData),
    });
  },
};

export default employeeManagementAPI;
