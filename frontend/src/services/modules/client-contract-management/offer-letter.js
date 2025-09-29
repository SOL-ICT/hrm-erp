import { apiService } from "../../api";

const OFFER_LETTER_ENDPOINTS = {
  TEMPLATES: "/offer-letter-templates",
  TEMPLATE_BY_ID: (id) => `/offer-letter-templates/${id}`,
  TEMPLATE_FOR_GRADE: "/offer-letter-templates/grade",
  SALARY_COMPONENTS: "/offer-letter-templates/salary-components",
  PREVIEW_TEMPLATE: "/offer-letter-templates/preview",
  VARIABLES: "/offer-letter-templates/variables",
  IMPORT_TEMPLATE: "/offer-letter-templates/import",
  EXPORT_TEMPLATE: (id) => `/offer-letter-templates/${id}/export`,
};

export const offerLetterAPI = {
  // Template CRUD Operations matching backend controller
  async getForGrade(params) {
    try {
      const response = await apiService.makeRequest(
        OFFER_LETTER_ENDPOINTS.TEMPLATE_FOR_GRADE,
        {
          method: "GET",
          params,
        }
      );
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.error("Error fetching template for grade:", error);
      
      // Return mock success response to prevent UI errors
      return {
        success: false,
        data: null,
        message: "No template found - will create new template when saved",
      };
    }
  },

  async createTemplate(templateData) {
    try {
      const response = await apiService.makeRequest(
        OFFER_LETTER_ENDPOINTS.TEMPLATES,
        {
          method: "POST",
          body: JSON.stringify(templateData),
        }
      );
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.error("Error creating offer letter template:", error);
      return {
        success: false,
        data: null,
        message: error.message || "Failed to create template",
      };
    }
  },

  async updateTemplate(id, templateData) {
    try {
      const response = await apiService.makeRequest(
        OFFER_LETTER_ENDPOINTS.TEMPLATE_BY_ID(id),
        {
          method: "PUT",
          body: JSON.stringify(templateData),
        }
      );
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.error("Error updating offer letter template:", error);
      return {
        success: false,
        data: null,
        message: error.message || "Failed to update template",
      };
    }
  },

  async deleteTemplate(id) {
    try {
      const response = await apiService.makeRequest(
        OFFER_LETTER_ENDPOINTS.TEMPLATE_BY_ID(id),
        {
          method: "DELETE",
        }
      );
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.error("Error deleting offer letter template:", error);
      return {
        success: false,
        data: null,
        message: error.message || "Failed to delete template",
      };
    }
  },

  async getSalaryComponents(params) {
    try {
      const response = await apiService.makeRequest(
        OFFER_LETTER_ENDPOINTS.SALARY_COMPONENTS,
        {
          method: "GET",
          params,
        }
      );
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.error("Error fetching salary components:", error);
      return {
        success: false,
        data: [],
        message: error.message || "Failed to fetch salary components",
      };
    }
  },

  async generatePreview(templateData) {
    try {
      const response = await apiService.makeRequest(
        OFFER_LETTER_ENDPOINTS.PREVIEW_TEMPLATE,
        {
          method: "POST",
          body: JSON.stringify(templateData),
        }
      );
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.error("Error generating preview:", error);
      return {
        success: false,
        data: null,
        message: error.message || "Failed to generate preview",
      };
    }
  },

  // Specialized queries
  async getTemplatesByGrade(gradeId, filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = params
        ? `${OFFER_LETTER_ENDPOINTS.TEMPLATE_BY_GRADE(gradeId)}?${params}`
        : OFFER_LETTER_ENDPOINTS.TEMPLATE_BY_GRADE(gradeId);

      const response = await apiService.get(url);
      return {
        success: true,
        data: response.data,
        message: response.message || "Grade templates retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching grade templates:", error);
      return {
        success: false,
        data: [],
        message:
          error.response?.data?.message || "Failed to fetch grade templates",
      };
    }
  },

  async getTemplatesByClient(clientId, filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = params
        ? `${OFFER_LETTER_ENDPOINTS.TEMPLATE_BY_CLIENT(clientId)}?${params}`
        : OFFER_LETTER_ENDPOINTS.TEMPLATE_BY_CLIENT(clientId);

      const response = await apiService.get(url);
      return {
        success: true,
        data: response.data,
        message: response.message || "Client templates retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching client templates:", error);
      return {
        success: false,
        data: [],
        message:
          error.response?.data?.message || "Failed to fetch client templates",
      };
    }
  },

  // Template Variables Management
  async getAvailableVariables() {
    try {
      const response = await apiService.get(OFFER_LETTER_ENDPOINTS.VARIABLES);
      return {
        success: true,
        data: response.data,
        message: response.message || "Variables retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching template variables:", error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || "Failed to fetch variables",
      };
    }
  },

  // Offer Letter Generation
  async generateOfferLetter(templateId, candidateData, overrides = {}) {
    try {
      const payload = {
        template_id: templateId,
        candidate_data: candidateData,
        overrides: overrides,
      };

      const response = await apiService.post(
        OFFER_LETTER_ENDPOINTS.GENERATE_LETTER,
        payload
      );
      return {
        success: true,
        data: response.data,
        message: response.message || "Offer letter generated successfully",
      };
    } catch (error) {
      console.error("Error generating offer letter:", error);
      return {
        success: false,
        data: null,
        message:
          error.response?.data?.message || "Failed to generate offer letter",
      };
    }
  },

  async previewOfferLetter(templateId, sampleData = {}) {
    try {
      const payload = {
        template_id: templateId,
        sample_data: sampleData,
      };

      const response = await apiService.post(
        OFFER_LETTER_ENDPOINTS.PREVIEW_LETTER,
        payload
      );
      return {
        success: true,
        data: response.data,
        message: response.message || "Preview generated successfully",
      };
    } catch (error) {
      console.error("Error generating preview:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Failed to generate preview",
      };
    }
  },

  // Import/Export Functions
  async importTemplate(templateFile, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append("template_file", templateFile);

      // Add metadata
      Object.keys(metadata).forEach((key) => {
        formData.append(key, metadata[key]);
      });

      const response = await apiService.post(
        OFFER_LETTER_ENDPOINTS.IMPORT_TEMPLATE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return {
        success: true,
        data: response.data,
        message: response.message || "Template imported successfully",
      };
    } catch (error) {
      console.error("Error importing template:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Failed to import template",
      };
    }
  },

  async exportTemplate(id, format = "json") {
    try {
      const response = await apiService.get(
        `${OFFER_LETTER_ENDPOINTS.EXPORT_TEMPLATE(id)}?format=${format}`,
        {
          responseType: "blob",
        }
      );

      return {
        success: true,
        data: response.data,
        message: "Template exported successfully",
      };
    } catch (error) {
      console.error("Error exporting template:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Failed to export template",
      };
    }
  },

  // Template Status Management
  async activateTemplate(id) {
    try {
      const response = await apiService.patch(
        OFFER_LETTER_ENDPOINTS.TEMPLATE_BY_ID(id),
        {
          status: "active",
        }
      );
      return {
        success: true,
        data: response.data,
        message: response.message || "Template activated successfully",
      };
    } catch (error) {
      console.error("Error activating template:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Failed to activate template",
      };
    }
  },

  async archiveTemplate(id) {
    try {
      const response = await apiService.patch(
        OFFER_LETTER_ENDPOINTS.TEMPLATE_BY_ID(id),
        {
          status: "archived",
        }
      );
      return {
        success: true,
        data: response.data,
        message: response.message || "Template archived successfully",
      };
    } catch (error) {
      console.error("Error archiving template:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Failed to archive template",
      };
    }
  },

  // Template Duplication
  async duplicateTemplate(id, newName = null) {
    try {
      const payload = {};
      if (newName) payload.name = newName;

      const response = await apiService.post(
        `${OFFER_LETTER_ENDPOINTS.TEMPLATE_BY_ID(id)}/duplicate`,
        payload
      );
      return {
        success: true,
        data: response.data,
        message: response.message || "Template duplicated successfully",
      };
    } catch (error) {
      console.error("Error duplicating template:", error);
      return {
        success: false,
        data: null,
        message:
          error.response?.data?.message || "Failed to duplicate template",
      };
    }
  },

  // Batch operations
  async bulkStatusUpdate(templateIds, status) {
    try {
      const payload = {
        template_ids: templateIds,
        status: status,
      };

      const response = await apiService.patch(
        `${OFFER_LETTER_ENDPOINTS.TEMPLATES}/bulk-status`,
        payload
      );
      return {
        success: true,
        data: response.data,
        message: response.message || `Templates ${status} successfully`,
      };
    } catch (error) {
      console.error("Error updating template status:", error);
      return {
        success: false,
        data: null,
        message:
          error.response?.data?.message || "Failed to update template status",
      };
    }
  },

  async bulkDelete(templateIds) {
    try {
      const payload = {
        template_ids: templateIds,
      };

      const response = await apiService.delete(
        `${OFFER_LETTER_ENDPOINTS.TEMPLATES}/bulk`,
        payload
      );
      return {
        success: true,
        data: response.data,
        message: response.message || "Templates deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting templates:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Failed to delete templates",
      };
    }
  },
};

// Utility functions for common operations
export const offerLetterUtils = {
  // Template validation
  validateTemplate(template) {
    const errors = [];

    if (!template.name || template.name.trim() === "") {
      errors.push("Template name is required");
    }

    if (!template.sections || template.sections.length === 0) {
      errors.push("Template must have at least one section");
    }

    if (!template.client_id) {
      errors.push("Client selection is required");
    }

    if (!template.job_category_id) {
      errors.push("Job category selection is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Variable replacement for preview
  replaceVariables(content, variables = {}) {
    if (typeof content !== "string") return content;

    return content.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  },

  // Format template for export
  formatForExport(template) {
    return {
      ...template,
      exported_at: new Date().toISOString(),
      version: "1.0",
      export_format: "hrm-erp-template",
    };
  },

  // Generate sample variables
  generateSampleData() {
    return {
      candidate_name: "John Doe",
      candidate_address: "123 Sample Street, Lagos, Nigeria",
      job_title: "Software Engineer",
      start_date: new Date().toISOString().split("T")[0],
      basic_salary: "150,000.00",
      housing_allowance: "75,000.00",
      transport_allowance: "30,000.00",
      net_salary: "255,000.00",
      company_name: "Strategic Outsourcing Limited",
      office_location: "Victoria Island",
      office_address: "Plot 1234, Victoria Island, Lagos",
      gross_monthly_salary: "280,000.00",
      net_monthly_salary: "220,000.00",
    };
  },
};
