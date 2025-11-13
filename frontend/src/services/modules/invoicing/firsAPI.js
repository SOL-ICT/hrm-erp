import { apiService } from "../../api";

/**
 * FIRS E-Invoicing API Module
 * Handles all FIRS-related API calls through the backend proxy
 */
const firsAPI = {
  /**
   * Submit invoice to FIRS via backend proxy
   * @param {string} uploadId - Attendance upload ID
   * @param {Object} data - Invoice submission data
   * @returns {Promise<Object>} FIRS response with approval status
   */
  submitInvoice: async (uploadId, data = {}) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/firs-invoice/attendance/${uploadId}/submit-to-firs`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      console.log("✅ FIRS submission response:", response);
      return response;
    } catch (error) {
      console.error("❌ FIRS submission error:", error);
      throw new Error(`FIRS submission failed: ${error.message}`);
    }
  },

  /**
   * Get FIRS invoice status
   * @param {string} uploadId - Attendance upload ID
   * @returns {Promise<Object>} Status response
   */
  getInvoiceStatus: async (uploadId) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/firs-invoice/attendance/${uploadId}/status`
      );
      return response;
    } catch (error) {
      console.error("❌ FIRS status check error:", error);
      throw new Error(`Failed to get FIRS status: ${error.message}`);
    }
  },

  /**
   * Get FIRS service status
   * @returns {Promise<Object>} Service status
   */
  getServiceStatus: async () => {
    try {
      const response = await apiService.makeRequest(
        "/admin/firs-invoice/status"
      );
      return response;
    } catch (error) {
      console.error("❌ FIRS service status error:", error);
      throw new Error(`Failed to get FIRS service status: ${error.message}`);
    }
  },

  /**
   * Generate invoice PDF with FIRS data
   * @param {string} uploadId - Attendance upload ID
   * @param {Object} data - Generation options
   * @returns {Promise<Object>} PDF generation response
   */
  generateInvoice: async (uploadId, data = {}) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/firs-invoice/attendance/${uploadId}/generate-invoice`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error("❌ FIRS invoice generation error:", error);
      throw new Error(`Failed to generate FIRS invoice: ${error.message}`);
    }
  },

  /**
   * Preview invoice data before FIRS submission
   * @param {string} uploadId - Attendance upload ID
   * @returns {Promise<Object>} Preview data
   */
  previewInvoice: async (uploadId) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/firs-invoice/attendance/${uploadId}/preview`
      );
      return response;
    } catch (error) {
      console.error("❌ FIRS invoice preview error:", error);
      throw new Error(`Failed to preview FIRS invoice: ${error.message}`);
    }
  },

  /**
   * Preview generated invoice data before FIRS submission (invoice-based)
   * @param {string} invoiceId - Generated invoice ID or number
   * @returns {Promise<Object>} Preview data
   */
  previewGeneratedInvoice: async (invoiceId) => {
    try {
      const response = await apiService.makeRequest(
        `/attendance/invoice/${invoiceId}/preview-for-firs`
      );
      return response;
    } catch (error) {
      console.error("❌ FIRS invoice preview error:", error);
      throw new Error(`Failed to preview FIRS invoice: ${error.message}`);
    }
  },

  /**
   * Submit generated invoice to FIRS (invoice-based)
   * @param {string} invoiceId - Generated invoice ID or number
   * @param {Object} data - Invoice submission data
   * @returns {Promise<Object>} FIRS response with approval status
   */
  submitGeneratedInvoice: async (invoiceId, data = {}) => {
    try {
      const response = await apiService.makeRequest(
        `/attendance/invoice/${invoiceId}/submit-to-firs`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      console.log("✅ FIRS submission response:", response);
      return response;
    } catch (error) {
      console.error("❌ FIRS submission error:", error);
      throw new Error(`FIRS submission failed: ${error.message}`);
    }
  },

  /**
   * Store FIRS approval data
   * @param {string} uploadId - Attendance upload ID
   * @param {Object} approvalData - FIRS approval response
   * @returns {Promise<Object>} Storage response
   */
  storeApproval: async (uploadId, approvalData) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/firs-invoice/attendance/${uploadId}/store-approval`,
        {
          method: "POST",
          body: JSON.stringify(approvalData),
        }
      );
      return response;
    } catch (error) {
      console.error("❌ FIRS approval storage error:", error);
      throw new Error(`Failed to store FIRS approval: ${error.message}`);
    }
  },
};

export default firsAPI;
