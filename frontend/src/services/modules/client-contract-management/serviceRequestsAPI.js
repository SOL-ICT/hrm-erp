// Stub file to prevent import errors
// Service Request functionality has been removed
// This file provides empty stubs for backward compatibility

const serviceRequestsAPI = {
  getAll: async () => ({ success: true, data: [] }),
  getByClient: async () => ({ success: true, data: [] }),
  create: async () => ({
    success: false,
    message: "Service Request functionality has been removed",
  }),
  update: async () => ({
    success: false,
    message: "Service Request functionality has been removed",
  }),
  delete: async () => ({
    success: false,
    message: "Service Request functionality has been removed",
  }),
  getServiceTypes: async () => ({ success: true, data: [] }),
  generateServiceCode: async () => ({
    success: false,
    message: "Service Request functionality has been removed",
  }),
  getDashboardStats: async () => ({ success: true, data: {} }),
  bulkUpdate: async () => ({
    success: false,
    message: "Service Request functionality has been removed",
  }),
  getUsageStatistics: async () => ({ success: true, data: {} }),
};

export default serviceRequestsAPI;
