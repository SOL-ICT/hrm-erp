import { apiService } from "@/services/api";
import {
  DB_FIELDS,
  API_FIELDS,
  FORM_FIELDS,
  ENUMS,
  DEFAULTS,
} from "@/constants/databaseFields";

const MANUAL_BOARDING_ENDPOINTS = {
  CLIENTS: "/recruitment-management/manual-boarding/clients",
  TICKETS: "/recruitment-management/manual-boarding/tickets",
  PAY_GRADES: "/recruitment-management/manual-boarding/pay-grades",
  STAFF_TYPES: "/recruitment-management/manual-boarding/staff-types",
  CREATE_STAFF: "/recruitment-management/manual-boarding/create-staff",
  EXCEL_TEMPLATE: "/recruitment-management/manual-boarding/excel/template",
  EXCEL_PREVIEW: "/recruitment-management/manual-boarding/excel/preview",
  EXCEL_UPLOAD: "/recruitment-management/manual-boarding/excel/upload",
};

export const manualBoardingAPI = {
  /**
   * Get clients with active recruitment requests
   */
  async getClients() {
    try {
      return await apiService.makeRequest(MANUAL_BOARDING_ENDPOINTS.CLIENTS);
    } catch (error) {
      console.error("Error fetching clients for manual boarding:", error);
      throw error;
    }
  },

  /**
   * Get recruitment tickets for a specific client
   */
  async getTickets(clientId) {
    try {
      const endpoint = `${MANUAL_BOARDING_ENDPOINTS.TICKETS}?client_id=${clientId}`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching recruitment tickets:", error);
      throw error;
    }
  },

  /**
   * Get recruitment tickets for a specific client (alias for compatibility)
   */
  async getTicketsByClient(clientId) {
    return this.getTickets(clientId);
  },

  /**
   * Get pay grades for a specific job structure
   */
  async getPayGrades(jobStructureId) {
    try {
      const endpoint = `${MANUAL_BOARDING_ENDPOINTS.PAY_GRADES}?job_structure_id=${jobStructureId}`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching pay grades:", error);
      throw error;
    }
  },

  /**
   * Get pay grades for a specific recruitment ticket
   */
  async getPayGradesByTicket(ticketId) {
    try {
      const endpoint = `${MANUAL_BOARDING_ENDPOINTS.PAY_GRADES}?ticket_id=${ticketId}`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching pay grades by ticket:", error);
      throw error;
    }
  },

  /**
   * Get staff types for a client
   */
  async getStaffTypes(clientId) {
    try {
      const endpoint = `${MANUAL_BOARDING_ENDPOINTS.STAFF_TYPES}?client_id=${clientId}`;
      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching staff types:", error);
      throw error;
    }
  },

  /**
   * Create a staff member manually
   */
  async createStaff(staffData) {
    try {
      return await apiService.makeRequest(
        MANUAL_BOARDING_ENDPOINTS.CREATE_STAFF,
        {
          method: "POST",
          body: JSON.stringify(staffData),
        }
      );
    } catch (error) {
      console.error("Error creating staff member:", error);
      throw error;
    }
  },

  /**
   * Generate Excel template for bulk upload
   */
  async generateExcelTemplate(formData) {
    try {
      // Use POST with FormData as the backend expects it
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${MANUAL_BOARDING_ENDPOINTS.EXCEL_TEMPLATE}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            // Don't set Content-Type, let browser set it for FormData
          },
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
        let filename = "Staff_Upload_Template.xlsx";
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

        return { success: true, message: "Template downloaded successfully" };
      } else {
        // It's a JSON response (likely an error)
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.error("Error generating Excel template:", error);
      return {
        success: false,
        message: "Error generating Excel template",
        error: error.message,
      };
    }
  },

  /**
   * Preview Excel upload data before processing
   */
  async previewExcelUpload(formData) {
    try {
      return await apiService.makeRequest(
        MANUAL_BOARDING_ENDPOINTS.EXCEL_PREVIEW,
        {
          method: "POST",
          body: formData, // FormData object with file
          // Don't pass headers object - let apiService.makeRequest handle all headers including Authorization
        }
      );
    } catch (error) {
      console.error("Error previewing Excel upload:", error);
      throw error;
    }
  },

  /**
   * Process bulk staff upload from Excel
   */
  async processBulkUpload(formData) {
    try {
      return await apiService.makeRequest(
        MANUAL_BOARDING_ENDPOINTS.EXCEL_UPLOAD,
        {
          method: "POST",
          body: formData, // FormData object with file - same as preview
          // Don't pass headers object - let apiService.makeRequest handle all headers including Authorization
        }
      );
    } catch (error) {
      console.error("Error processing bulk upload:", error);
      throw error;
    }
  },

  /**
   * Download Excel template as blob
   */
  async downloadExcelTemplate(
    params,
    filename = "manual_boarding_template.xlsx"
  ) {
    try {
      const response = await this.generateExcelTemplate(params);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, message: "Template downloaded successfully" };
    } catch (error) {
      console.error("Error downloading Excel template:", error);
      throw error;
    }
  },

  /**
   * Validate staff data before submission
   */
  validateStaffData(staffData) {
    const errors = [];

    // Required fields validation using constants
    if (!staffData[FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME]?.trim()) {
      errors.push({
        field: FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME,
        message: "First name is required",
      });
    }

    if (!staffData[FORM_FIELDS.MANUAL_BOARDING.LAST_NAME]?.trim()) {
      errors.push({
        field: FORM_FIELDS.MANUAL_BOARDING.LAST_NAME,
        message: "Last name is required",
      });
    }

    if (!staffData[FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE]) {
      errors.push({
        field: FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE,
        message: "Entry date is required",
      });
    }

    if (!staffData[FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID]) {
      errors.push({
        field: FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID,
        message: "Client selection is required",
      });
    }

    if (!staffData[FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID]) {
      errors.push({
        field: FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID,
        message: "Recruitment ticket selection is required",
      });
    }

    // Email validation (if provided)
    if (
      staffData[FORM_FIELDS.MANUAL_BOARDING.EMAIL] &&
      staffData[FORM_FIELDS.MANUAL_BOARDING.EMAIL].trim()
    ) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(staffData[FORM_FIELDS.MANUAL_BOARDING.EMAIL])) {
        errors.push({
          field: FORM_FIELDS.MANUAL_BOARDING.EMAIL,
          message: "Invalid email format",
        });
      }
    }

    // Entry date validation
    if (staffData[FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE]) {
      const entryDate = new Date(
        staffData[FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE]
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (entryDate < today) {
        errors.push({
          field: FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE,
          message: "Entry date cannot be in the past",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Format staff data for API submission
   */
  formatStaffData(rawData) {
    return {
      [DB_FIELDS.STAFF.CLIENT_ID]: parseInt(
        rawData[FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID]
      ),
      [DB_FIELDS.STAFF.RECRUITMENT_REQUEST_ID]: parseInt(
        rawData[FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID]
      ),
      [DB_FIELDS.STAFF.PAY_GRADE_STRUCTURE_ID]: rawData[
        FORM_FIELDS.MANUAL_BOARDING.PAY_GRADE_STRUCTURE_ID
      ]
        ? parseInt(rawData[FORM_FIELDS.MANUAL_BOARDING.PAY_GRADE_STRUCTURE_ID])
        : null,
      [DB_FIELDS.STAFF.FIRST_NAME]:
        rawData[FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME]?.trim(),
      [DB_FIELDS.STAFF.MIDDLE_NAME]:
        rawData[FORM_FIELDS.MANUAL_BOARDING.MIDDLE_NAME]?.trim() || null,
      [DB_FIELDS.STAFF.LAST_NAME]:
        rawData[FORM_FIELDS.MANUAL_BOARDING.LAST_NAME]?.trim(),
      [DB_FIELDS.STAFF.EMAIL]:
        rawData[FORM_FIELDS.MANUAL_BOARDING.EMAIL]?.trim() || null,
      [DB_FIELDS.STAFF.ENTRY_DATE]:
        rawData[FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE],
      [DB_FIELDS.STAFF.GENDER]:
        rawData[FORM_FIELDS.MANUAL_BOARDING.GENDER] || null,
      [DB_FIELDS.STAFF.JOB_TITLE]:
        rawData[FORM_FIELDS.MANUAL_BOARDING.JOB_TITLE]?.trim() || null,
      [DB_FIELDS.STAFF.DEPARTMENT]:
        rawData[FORM_FIELDS.MANUAL_BOARDING.DEPARTMENT]?.trim() || null,
    };
  },

  /**
   * Get summary statistics for manual boarding
   */
  async getBoardingStats(clientId = null) {
    try {
      // This would be implemented if we need dashboard stats
      const params = clientId ? { client_id: clientId } : {};
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/manual-boarding/stats${
        queryString ? "?" + queryString : ""
      }`;

      return await apiService.makeRequest(endpoint);
    } catch (error) {
      console.error("Error fetching boarding stats:", error);
      throw error;
    }
  },
};

export default manualBoardingAPI;
