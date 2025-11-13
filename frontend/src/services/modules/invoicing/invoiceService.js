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
   * Get detailed invoice with line items
   */
  async getInvoiceWithDetails(invoiceId) {
    try {
      const response = await apiService.get(
        `/attendance/invoice/${invoiceId}/details`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice details ${invoiceId}:`, error);
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
   * Generate invoice from attendance upload (new endpoint)
   */
  async generateInvoiceFromAttendance(uploadId, invoiceType) {
    try {
      const response = await apiService.post(
        `/attendance/${uploadId}/generate-invoice`,
        {
          invoice_type: invoiceType,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error generating invoice from attendance:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Export invoice to Excel (triggers download)
   */
  async exportInvoiceToExcel(invoiceId) {
    try {
      const response = await apiService.get(
        `/attendance/invoice/${invoiceId}/export-excel`,
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
   * Export invoice to PDF (triggers download)
   */
  async exportInvoiceToPDF(invoiceId, issueDate = null) {
    try {
      // Prepare request data
      const requestData = {};
      if (issueDate) {
        requestData.issue_date = issueDate;
      }

      const response = await apiService.post(
        `/attendance/invoice/${invoiceId}/export-pdf`,
        requestData,
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
      let filename = `invoice_${invoiceId}.pdf`;

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
      console.error(`Error exporting invoice to PDF ${invoiceId}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Export FIRS-compliant PDF with QR code (only for FIRS-approved invoices)
   */
  async exportFIRSCompliancePDF(invoiceId) {
    try {
      const response = await apiService.post(
        `/attendance/invoice/${invoiceId}/export-firs-pdf`,
        {},
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
      let filename = `firs_compliant_invoice_${invoiceId}.pdf`;

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
      console.error(`Error exporting FIRS-compliant PDF ${invoiceId}:`, error);
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
   * Export FIRS-compliant PDF with QR code (only for FIRS-approved invoices)
   */
  async exportFIRSCompliancePDF(invoiceId) {
    try {
      const response = await apiService.post(
        `/attendance/invoice/${invoiceId}/export-firs-pdf`,
        {},
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
      let filename = `firs_compliant_invoice_${invoiceId}.pdf`;

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
      console.error(
        `Error exporting FIRS-compliant PDF for invoice ${invoiceId}:`,
        error
      );
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
   * Phase 1.3: Upload with direct pay_grade_structure_id matching
   */
  async uploadWithDirectMatching(file, clientId, payrollMonth) {
    try {
      const formData = new FormData();
      formData.append("attendance_file", file);
      formData.append("client_id", clientId);
      if (payrollMonth) {
        formData.append("payroll_month", payrollMonth);
      }

      const response = await apiService.post(
        "/attendance/upload-with-direct-matching",
        formData
      );

      return response.data;
    } catch (error) {
      console.error("Error uploading with direct matching:", error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Phase 1.3: Get validation results for an upload
   */
  async getValidationResults(uploadId) {
    try {
      const response = await apiService.get(
        `/attendance/validation-results/${uploadId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching validation results for upload ${uploadId}:`,
        error
      );
      throw this.handleApiError(error);
    }
  }

  /**
   * Phase 1.3: Get template coverage analysis for an upload
   */
  async getTemplateCoverage(uploadId) {
    try {
      const response = await apiService.get(
        `/attendance/template-coverage/${uploadId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching template coverage for upload ${uploadId}:`,
        error
      );
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

  /**
   * Delete individual attendance record
   */
  async deleteAttendanceRecord(recordId) {
    try {
      const response = await apiService.delete(
        `/attendance/record/${recordId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting attendance record ${recordId}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Update individual attendance record
   */
  async updateAttendanceRecord(recordId, updates) {
    try {
      const response = await apiService.put(
        `/attendance/record/${recordId}/update`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating attendance record ${recordId}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Add staff to attendance upload
   */
  async addStaffToAttendance(uploadId, staffData) {
    try {
      const response = await apiService.post(
        `/attendance/${uploadId}/add-staff`,
        staffData
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding staff to upload ${uploadId}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Phase 1.3: Validate uploaded attendance data
   */
  async validateUploadedAttendance(uploadId) {
    try {
      const response = await apiService.get(
        `/attendance/validation-results/${uploadId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error validating upload ${uploadId}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Download attendance template for a specific client
   */
  async downloadAttendanceTemplate(clientId) {
    try {
      const response = await apiService.get(
        `/attendance/template/download/${clientId}`,
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from response headers or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `attendance_template_client_${clientId}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error(
        `Error downloading template for client ${clientId}:`,
        error
      );
      throw this.handleApiError(error);
    }
  }

  /**
   * Phase 2.1: Get comprehensive preview data for an upload
   */
  async getUploadPreview(uploadId) {
    try {
      const response = await apiService.get(`/attendance/${uploadId}/preview`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching upload preview for upload ${uploadId}:`,
        error
      );
      throw this.handleApiError(error);
    }
  }
}

export const invoiceApiService = new InvoiceApiService();
