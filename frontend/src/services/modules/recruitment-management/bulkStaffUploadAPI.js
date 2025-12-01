import { apiService } from "@/services/api";

/**
 * Bulk Staff Upload API Service
 *
 * Handles bulk staff upload operations via Excel templates
 * Connects to BulkStaffUploadController backend routes
 */

const BULK_UPLOAD_ENDPOINTS = {
  DOWNLOAD_TEMPLATE: "/bulk-staff-upload/download-template",
  PREVIEW: "/bulk-staff-upload/preview",
  PROCESS: "/bulk-staff-upload/process",
};

export const bulkStaffUploadAPI = {
  /**
   * Download Excel template for bulk staff upload
   *
   * @param {number} clientId - Client ID
   * @param {number} recruitmentRequestId - Recruitment Request ID
   * @returns {Promise} Template file download
   */
  async downloadTemplate(clientId, recruitmentRequestId) {
    try {
      const params = new URLSearchParams({
        client_id: clientId,
        recruitment_request_id: recruitmentRequestId,
      });

      const url = `${process.env.NEXT_PUBLIC_API_URL}${BULK_UPLOAD_ENDPOINTS.DOWNLOAD_TEMPLATE}?${params}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || "Failed to download template",
          errors: errorData.errors || {},
        };
      }

      // Check if response is a file (Excel) or JSON (error)
      const contentType = response.headers.get("content-type");

      if (
        contentType &&
        contentType.includes(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
      ) {
        // It's an Excel file - trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get("content-disposition");
        let filename = "Staff_Bulk_Upload_Template.xlsx";
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
            contentDisposition
          );
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, "");
          }
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return {
          success: true,
          message: "Template downloaded successfully",
          filename: filename,
        };
      } else {
        // It's a JSON response (likely an error)
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      return {
        success: false,
        message: "Error downloading Excel template",
        error: error.message,
      };
    }
  },

  /**
   * Preview uploaded Excel file with validation
   *
   * @param {FormData} formData - Form data containing:
   *   - excel_file: The uploaded file
   *   - client_id: Client ID
   *   - recruitment_request_id: Recruitment Request ID
   * @returns {Promise} Preview data with validation results
   */
  async previewUpload(formData) {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}${BULK_UPLOAD_ENDPOINTS.PREVIEW}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          // Don't set Content-Type, let browser set it for FormData
        },
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Failed to preview upload",
          errors: result.errors || {},
        };
      }

      return result;
    } catch (error) {
      console.error("Error previewing upload:", error);
      return {
        success: false,
        message: "Error previewing Excel upload",
        error: error.message,
      };
    }
  },

  /**
   * Process bulk staff upload from Excel
   *
   * @param {FormData} formData - Form data containing:
   *   - excel_file: The uploaded file
   *   - client_id: Client ID
   *   - recruitment_request_id: Recruitment Request ID
   * @returns {Promise} Processing results
   */
  async processUpload(formData) {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}${BULK_UPLOAD_ENDPOINTS.PROCESS}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          // Don't set Content-Type, let browser set it for FormData
        },
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || "Failed to process upload",
          errors: result.errors || {},
        };
      }

      return result;
    } catch (error) {
      console.error("Error processing upload:", error);
      return {
        success: false,
        message: "Error processing bulk upload",
        error: error.message,
      };
    }
  },

  /**
   * Validate file before upload
   *
   * @param {File} file - The file to validate
   * @returns {Object} Validation result {isValid, error}
   */
  validateFile(file) {
    // Validate file exists
    if (!file) {
      return {
        isValid: false,
        error: "No file selected",
      };
    }

    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Please select a valid Excel (.xlsx, .xls) or CSV file",
      };
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size must be less than 10MB",
      };
    }

    return {
      isValid: true,
      error: null,
    };
  },

  /**
   * Format file size for display
   *
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  },
};

export default bulkStaffUploadAPI;
