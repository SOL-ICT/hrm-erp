import apiService from "../apiService";

const BASE = "/lpe";

const leaveEngineAPI = {
  // Job structures (replaces staff levels)
  getJobStructures: async (params = {}) => {
    const res = await apiService.get(`${BASE}/job-structures`, { params });
    return res.data;
  },

  // Legacy staff levels (kept for backwards compatibility)
  getStaffLevels: async (params = {}) => {
    const res = await apiService.get(`${BASE}/staff-levels`, { params });
    return res.data;
  },

  createStaffLevel: async (payload) => {
    const res = await apiService.post(`${BASE}/staff-levels`, payload);
    return res.data;
  },

  updateStaffLevel: async (id, payload) => {
    const res = await apiService.put(`${BASE}/staff-levels/${id}`, payload);
    return res.data;
  },

  deleteStaffLevel: async (id) => {
    const res = await apiService.delete(`${BASE}/staff-levels/${id}`);
    return res.data;
  },

  // Leave types
  getLeaveTypes: async (params = {}) => {
    const res = await apiService.get(`${BASE}/leave-types`, { params });
    return res.data;
  },

  createLeaveType: async (payload) => {
    const res = await apiService.post(`${BASE}/leave-types`, payload);
    return res.data;
  },

  updateLeaveType: async (id, payload) => {
    const res = await apiService.put(`${BASE}/leave-types/${id}`, payload);
    return res.data;
  },

  deleteLeaveType: async (id) => {
    const res = await apiService.delete(`${BASE}/leave-types/${id}`);
    return res.data;
  },

  // Entitlements
  getEntitlements: async (params = {}) => {
    const res = await apiService.get(`${BASE}/entitlements`, { params });
    return res.data;
  },

  createEntitlement: async (payload) => {
    const res = await apiService.post(`${BASE}/entitlements`, payload);
    return res.data;
  },
  updateEntitlement: async (id, payload) => {
    const res = await apiService.put(`${BASE}/entitlements/${id}`, payload);
    return res.data;
  },

  deleteEntitlement: async (id) => {
    const res = await apiService.delete(`${BASE}/entitlements/${id}`);
    return res.data;
  },
};

export default leaveEngineAPI;
