import { apiService } from "../../apiService";

/**
 * Invoice Management API Service
 * Handles all invoice-related API operations
 */
class InvoiceApiService {
  constructor() {
    this.baseUrl = "/invoices";
  }

  /**
   * Get paginated list of invoices with filtering
   */
  async getInvoices(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Add pagination params
      if (params.page) queryParams.append("page", params.page);
      if (params.per_page) queryParams.append("per_page", params.per_page);

      // Add filter params
      if (params.client_id) queryParams.append("client_id", params.client_id);
      if (params.invoice_type)
        queryParams.append("invoice_type", params.invoice_type);
      if (params.date_from) queryParams.append("date_from", params.date_from);
      if (params.date_to) queryParams.append("date_to", params.date_to);
      if (params.search) queryParams.append("search", params.search);

      const url = queryParams.toString()
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl;

      const response = await apiService.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get single invoice details
   */
  async getInvoice(invoiceId) {
    try {
      const response = await apiService.get(`${this.baseUrl}/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice ${invoiceId}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Generate new invoice from attendance upload
   */
  async generateInvoice(attendanceUploadId, invoiceType, invoicePeriod) {
    try {
      const response = await apiService.post(`${this.baseUrl}/generate`, {
        attendance_upload_id: attendanceUploadId,
        invoice_type: invoiceType,
        invoice_period: invoicePeriod,
      });
      return response.data;
    } catch (error) {
      console.error("Error generating invoice:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Export invoice to Excel (triggers download)
   */
  async exportInvoiceToExcel(invoiceId) {
    try {
      const response = await apiService.get(
        `${this.baseUrl}/${invoiceId}/export-excel`,
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from response headers
      const contentDisposition = response.headers["content-disposition"];
      let filename = `invoice_${invoiceId}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error(`Error exporting invoice ${invoiceId}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get invoice statistics for dashboard
   */
  async getInvoiceStatistics() {
    try {
      const response = await apiService.get(`${this.baseUrl}/statistics`);
      return response.data;
    } catch (error) {
      console.error("Error fetching invoice statistics:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get available attendance uploads for invoice generation
   */
  async getAvailableAttendanceUploads(clientId = null) {
    try {
      const url = clientId
        ? `${this.baseUrl}/available-attendance?client_id=${clientId}`
        : `${this.baseUrl}/available-attendance`;

      const response = await apiService.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching available attendance uploads:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceId) {
    try {
      const response = await apiService.delete(`${this.baseUrl}/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting invoice ${invoiceId}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get attendance uploads with invoice status
   */
  async getAttendanceUploads(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page);
      if (params.per_page) queryParams.append("per_page", params.per_page);

      const url = queryParams.toString()
        ? `/attendance-uploads?${queryParams.toString()}`
        : "/attendance-uploads";

      const response = await apiService.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching attendance uploads:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Handle API errors consistently
   */
  handleApiError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || "An error occurred";
      const status = error.response.status;
      return { message, status, errors: error.response.data?.errors };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: "Network error - please check your connection",
        status: 0,
      };
    } else {
      // Something else happened
      return { message: error.message || "Unknown error occurred", status: -1 };
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount, currency = "₦") {
    if (!amount) return `${currency}0.00`;
    return `${currency}${parseFloat(amount).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Format date for display
   */
  formatDate(dateString, options = {}) {
    if (!dateString) return "";

    const defaultOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    };

    return new Date(dateString).toLocaleDateString("en-NG", defaultOptions);
  }

  /**
   * Upload and process attendance file
   */
  async uploadAttendanceFile(file, clientId) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", clientId);

      const response = await apiService.post("/attendance/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading attendance file:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Upload and process simplified attendance file (4 fields only)
   */
  async uploadSimplifiedAttendanceFile(file, clientId) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", clientId);

      const response = await apiService.post(
        "/attendance/upload-simplified",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error uploading simplified attendance file:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get attendance uploads with pagination and filters
   */
  async getAttendanceUploads(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Add pagination params
      if (params.page) queryParams.append("page", params.page);
      if (params.per_page) queryParams.append("per_page", params.per_page);

      // Add filter params
      if (params.client_id) queryParams.append("client_id", params.client_id);
      if (params.status) queryParams.append("status", params.status);

      const url = queryParams.toString()
        ? `/attendance/uploads?${queryParams.toString()}`
        : "/attendance/uploads";

      const response = await apiService.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching attendance uploads:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStatistics(uploadId) {
    try {
      const response = await apiService.get(
        `/attendance/uploads/${uploadId}/statistics`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching upload statistics for ${uploadId}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Delete attendance upload and all associated records
   */
  async deleteAttendanceUpload(uploadId) {
    try {
      const response = await apiService.delete(
        `/attendance/uploads/${uploadId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting upload ${uploadId}:`, error);
      throw this.handleApiError(error);
    }
  }
}

export const invoiceApiService = new InvoiceApiService();
