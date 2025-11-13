/**
 * Template Builder API Service
 * Handles all backend communication for the visual template builder
 */

import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/**
 * Calculation Template API
 */
export const calculationTemplateAPI = {
  /**
   * Get all calculation templates
   */
  getAll: async (filters = {}) => {
    const response = await api.get("/v2/calculation-templates", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get calculation template by ID
   */
  getById: async (id) => {
    const response = await api.get(`/v2/calculation-templates/${id}`);
    return response.data;
  },

  /**
   * Get templates by pay grade code
   */
  getByPayGrade: async (payGradeCode) => {
    const response = await api.get(
      `/v2/calculation-templates/by-grade/${payGradeCode}`
    );
    return response.data;
  },

  /**
   * Create new calculation template
   * @param {Object} templateData - Template data from visual builder
   * @param {string} templateData.template_name - Name of the template
   * @param {string} templateData.pay_grade_code - Pay grade code
   * @param {string} templateData.description - Description
   * @param {Array} templateData.components - Array of components with type, label, formula, category
   */
  create: async (templateData) => {
    // Transform visual builder format to API format
    const payload = {
      name: templateData.template_name,
      pay_grade_code: templateData.pay_grade_code,
      description: templateData.description || "",

      // Separate components by category
      salary_components: [],
      allowance_components: templateData.components
        .filter((c) => c.category === "allowance")
        .map((c, index) => ({
          name: c.type,
          label: c.label,
          formula: c.formula,
          display_order: index + 1,
          is_taxable: true,
        })),
      deduction_components: templateData.components
        .filter((c) => c.category === "deduction")
        .map((c, index) => ({
          name: c.type,
          label: c.label,
          formula: c.formula,
          display_order: index + 1,
        })),
      statutory_components: templateData.components
        .filter((c) => c.category === "statutory")
        .map((c, index) => ({
          name: c.type,
          label: c.label,
          formula: c.formula,
          display_order: index + 1,
          is_statutory: true,
        })),

      // Default calculation rules
      calculation_rules: {
        prorate_salary: true,
        attendance_calculation_method: "working_days",
        minimum_attendance_factor: 0.5,
      },

      annual_division_factor: 12,
      is_active: true,
    };

    const response = await api.post("/v2/calculation-templates", payload);
    return response.data;
  },

  /**
   * Update existing calculation template
   */
  update: async (id, templateData) => {
    // Transform visual builder format to API format
    const payload = {
      name: templateData.template_name,
      description: templateData.description || "",

      // Separate components by category
      salary_components: [],
      allowance_components: templateData.components
        .filter((c) => c.category === "allowance")
        .map((c, index) => ({
          name: c.type,
          label: c.label,
          formula: c.formula,
          display_order: index + 1,
          is_taxable: true,
        })),
      deduction_components: templateData.components
        .filter((c) => c.category === "deduction")
        .map((c, index) => ({
          name: c.type,
          label: c.label,
          formula: c.formula,
          display_order: index + 1,
        })),
      statutory_components: templateData.components
        .filter((c) => c.category === "statutory")
        .map((c, index) => ({
          name: c.type,
          label: c.label,
          formula: c.formula,
          display_order: index + 1,
          is_statutory: true,
        })),
    };

    const response = await api.put(`/v2/calculation-templates/${id}`, payload);
    return response.data;
  },

  /**
   * Delete calculation template
   */
  delete: async (id) => {
    const response = await api.delete(`/v2/calculation-templates/${id}`);
    return response.data;
  },

  /**
   * Validate a formula
   */
  validateFormula: async (formula, variables = []) => {
    const response = await api.post(
      "/v2/calculation-templates/validate-formula",
      {
        formula,
        variables,
      }
    );
    return response.data;
  },

  /**
   * Test calculation with sample data
   */
  testCalculation: async (id, sampleData) => {
    const response = await api.post(
      `/v2/calculation-templates/${id}/test-calculation`,
      {
        sample_data: sampleData,
      }
    );
    return response.data;
  },

  /**
   * Create new version of template
   */
  createNewVersion: async (id, changes = {}) => {
    const response = await api.post(
      `/v2/calculation-templates/${id}/new-version`,
      changes
    );
    return response.data;
  },

  /**
   * Set template as default for its pay grade
   */
  setAsDefault: async (id) => {
    const response = await api.post(
      `/v2/calculation-templates/${id}/set-default`
    );
    return response.data;
  },
};

/**
 * Export Template API
 */
export const exportTemplateAPI = {
  /**
   * Get all export templates
   */
  getAll: async (filters = {}) => {
    const response = await api.get("/v2/export-templates", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get export templates by client
   */
  getByClient: async (clientId) => {
    const response = await api.get(
      `/v2/export-templates/by-client/${clientId}`
    );
    return response.data;
  },

  /**
   * Get supported export formats
   */
  getSupportedFormats: async () => {
    const response = await api.get("/v2/export-templates/formats");
    return response.data;
  },
};

/**
 * Bulk Operations API
 */
export const bulkOperationsAPI = {
  /**
   * Download sample template file
   */
  downloadSample: async (type) => {
    const response = await api.get(`/v2/bulk/samples/${type}`, {
      responseType: "blob",
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${type}_sample.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return response.data;
  },

  /**
   * Upload bulk templates
   */
  uploadTemplates: async (type, file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/v2/bulk/${type}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  /**
   * Validate upload file
   */
  validateUpload: async (type, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/v2/bulk/validate/${type}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /**
   * Preview upload results
   */
  previewUpload: async (type, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(`/v2/bulk/preview/${type}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /**
   * Get upload statistics
   */
  getStatistics: async () => {
    const response = await api.get("/v2/bulk/statistics");
    return response.data;
  },
};

export default {
  calculationTemplateAPI,
  exportTemplateAPI,
  bulkOperationsAPI,
};
