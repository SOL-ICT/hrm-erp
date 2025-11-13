/**
 * Invoice Template API Service
 * Handles all API calls related to invoice template management
 */

import apiService from "../../apiService";

const ENDPOINTS = {
  BASE: "/invoice-templates",
  DEFAULT: "/invoice-templates/default",
  CLONE: (id) => `/invoice-templates/${id}/clone`,
};

export const invoiceTemplateService = {
  /**
   * Get all invoice templates with optional filtering
   */
  async getTemplates(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.client_id) queryParams.append("client_id", params.client_id);
      if (params.pay_grade_structure_id)
        queryParams.append(
          "pay_grade_structure_id",
          params.pay_grade_structure_id
        );
      if (params.active_only) queryParams.append("active_only", "true");
      if (params.default_only) queryParams.append("default_only", "true");

      const url = queryParams.toString()
        ? `${ENDPOINTS.BASE}?${queryParams}`
        : ENDPOINTS.BASE;
      const response = await apiService.get(url);

      return {
        success: true,
        data: response.data || [],
        message: "Templates retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching invoice templates:", error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || "Failed to fetch templates",
      };
    }
  },

  /**
   * Get specific template by ID
   */
  async getTemplate(id) {
    try {
      const response = await apiService.get(`${ENDPOINTS.BASE}/${id}`);
      return {
        success: true,
        data: response.data,
        message: "Template retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching invoice template:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Failed to fetch template",
      };
    }
  },

  /**
   * Get default template for specific client and pay grade
   */
  async getDefaultTemplate(clientId, payGradeId) {
    try {
      const response = await apiService.get(ENDPOINTS.DEFAULT, {
        params: {
          client_id: clientId,
          pay_grade_structure_id: payGradeId,
        },
      });

      return {
        success: true,
        data: response.data,
        message: "Default template retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching default template:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "No default template found",
      };
    }
  },

  /**
   * Create new invoice template
   */
  async createTemplate(templateData) {
    try {
      // Validate required fields
      const required = [
        "client_id",
        "pay_grade_structure_id",
        "template_name",
        "custom_components",
        "statutory_components",
      ];
      const missing = required.filter((field) => !templateData[field]);

      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
      }

      const response = await apiService.post(ENDPOINTS.BASE, templateData);

      return {
        success: true,
        data: response.data,
        message: "Template created successfully",
      };
    } catch (error) {
      console.error("Error creating invoice template:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Failed to create template",
        errors: error.response?.data?.errors || {},
      };
    }
  },

  /**
   * Update existing invoice template
   */
  async updateTemplate(id, templateData) {
    try {
      const response = await apiService.put(
        `${ENDPOINTS.BASE}/${id}`,
        templateData
      );

      return {
        success: true,
        data: response.data,
        message: "Template updated successfully",
      };
    } catch (error) {
      console.error("Error updating invoice template:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Failed to update template",
        errors: error.response?.data?.errors || {},
      };
    }
  },

  /**
   * Delete invoice template
   */
  async deleteTemplate(id) {
    try {
      await apiService.delete(`${ENDPOINTS.BASE}/${id}`);

      return {
        success: true,
        message: "Template deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting invoice template:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete template",
      };
    }
  },

  /**
   * Clone existing template
   */
  async cloneTemplate(id, newData) {
    try {
      const response = await apiService.post(ENDPOINTS.CLONE(id), newData);

      return {
        success: true,
        data: response.data,
        message: "Template cloned successfully",
      };
    } catch (error) {
      console.error("Error cloning invoice template:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Failed to clone template",
      };
    }
  },

  /**
   * Set template as default for its client-grade combination
   */
  async setAsDefault(id) {
    try {
      const response = await apiService.put(`${ENDPOINTS.BASE}/${id}`, {
        is_default: true,
      });

      return {
        success: true,
        data: response.data,
        message: "Template set as default successfully",
      };
    } catch (error) {
      console.error("Error setting template as default:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to set template as default",
      };
    }
  },

  /**
   * Format template data for API submission
   */
  formatTemplateData(templateSettings, metadata) {
    return {
      client_id: metadata.client_id,
      pay_grade_structure_id: metadata.pay_grade_structure_id,
      template_name:
        metadata.template_name || `Template for ${metadata.grade_name}`,
      description: metadata.description || "",
      custom_components: templateSettings.custom || [],
      statutory_components: templateSettings.statutory || {},
      calculation_rules: templateSettings.calculation_rules || null,
      use_credit_to_bank_model: metadata.use_credit_to_bank_model ?? true,
      service_fee_percentage: metadata.service_fee_percentage || 0,
      attendance_calculation_method:
        metadata.attendance_calculation_method || "working_days",
      prorate_salary: metadata.prorate_salary ?? true,
      minimum_attendance_factor: metadata.minimum_attendance_factor || 0,
      is_active: metadata.is_active ?? true,
      is_default: metadata.is_default ?? false,
    };
  },

  /**
   * Extract component names referenced in a formula
   */
  extractComponentsFromFormula(formula, availableComponents = []) {
    if (!formula) return [];

    const componentNames = [];

    // Create a list of all possible component names to look for
    const componentPatterns = [
      "BASIC_SALARY",
      "HOUSING",
      "TRANSPORT_ALLOWANCE",
      "UTILITY_ALLOWANCE",
      "GROSS_SALARY",
      "MANAGEMENT_FEE",
      "VAT_ON_MGT_FEE",
      "TOTAL_DEDUCTIONS",
      "NET_SALARY",
      "PENSION",
      "PAYE_TAX",
      "ECA",
      "ITF",
      "FIDELITY_GUARANTEE",
      "BACKGROUD_CHECK",
      "GROUP_LIFE_INSURANCE",
      "EMPLOYER_S_CONTRIBUTION_TO_PENSION",
    ];

    // Add available components if they exist and are valid
    if (Array.isArray(availableComponents)) {
      availableComponents.forEach((component) => {
        if (component && typeof component === "string") {
          componentPatterns.push(component);
        } else if (
          component &&
          component.name &&
          typeof component.name === "string"
        ) {
          componentPatterns.push(component.name);
        }
      });
    }

    // Find which components are referenced in the formula
    componentPatterns.forEach((componentName) => {
      // Ensure componentName is a string
      if (typeof componentName === "string") {
        const regex = new RegExp(`\\b${componentName}\\b`, "gi");
        if (formula.match(regex)) {
          componentNames.push({
            name: componentName,
            originalName: componentName.replace(/_/g, " "),
            id: componentName.toLowerCase(),
          });
        }
      }
    });

    return componentNames;
  },

  /**
   * Parse template data from API response for frontend use
   */
  parseTemplateData(template) {
    if (!template) return null;

    // Parse JSON strings from database
    let customComponents = [];
    let statutoryComponents = {};

    try {
      const rawCustomComponents =
        typeof template.custom_components === "string"
          ? JSON.parse(template.custom_components)
          : template.custom_components || [];

      // Convert database format to frontend format
      customComponents = rawCustomComponents.map((component) => {
        const componentData = {
          id: component.id || `custom_${Date.now()}_${Math.random()}`,
          name: component.name || "",
          description: component.description || component.name || "",
          type: component.type || "fixed",
          calculation_type: component.type || "fixed", // frontend expects this field
          rate: component.amount || component.rate || 0, // Map amount to rate for frontend
          amount: component.amount || component.rate || 0, // Keep amount as well
          formula: component.formula || "",
          enabled: true,
          source_cell: component.source_cell || null,
          sample_value: component.sample_value || null,
          imported_from_excel: component.imported_from_excel || false,
        };

        // Extract components from formula if it's a formula type
        if (component.type === "formula" && component.formula) {
          componentData.components = this.extractComponentsFromFormula(
            component.formula
          );
        } else {
          componentData.components = [];
        }

        return componentData;
      });
    } catch (error) {
      console.error("Error parsing custom_components:", error);
      customComponents = [];
    }

    try {
      const rawStatutoryComponents =
        typeof template.statutory_components === "string"
          ? JSON.parse(template.statutory_components)
          : template.statutory_components || {};

      // Check if rawStatutoryComponents is already an object (not an array)
      if (Array.isArray(rawStatutoryComponents)) {
        // Convert array of statutory components to object format expected by frontend
        statutoryComponents = {};
        rawStatutoryComponents.forEach((component) => {
          const key = component.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
          const componentData = {
            enabled: true,
            name: component.name,
            type: component.type,
            calculation_type: component.type, // Add this field
            rate:
              component.type === "fixed"
                ? component.amount || 0
                : this.extractRateFromFormula(component.formula),
            amount: component.amount || null, // Keep original amount
            fixed_amount: component.amount || null, // Add this field for fixed components
            annual_amount: component.amount || null, // Add this field
            formula: component.formula || null,
            description: component.description || component.name,
            source_cell: component.source_cell || null,
            sample_value: component.sample_value || null,
            imported_from_excel: component.imported_from_excel || false,
          };

          // Extract components from formula if it's a formula type
          if (component.type === "formula" && component.formula) {
            componentData.components = this.extractComponentsFromFormula(
              component.formula
            );
          } else {
            componentData.components = [];
          }

          statutoryComponents[key] = componentData;
        });
      } else {
        // Data is already in object format - use it directly but add components array
        statutoryComponents = {};
        Object.entries(rawStatutoryComponents).forEach(([key, component]) => {
          const componentData = { ...component };

          // Extract components from formula if it's a formula type
          if (component.type === "formula" && component.formula) {
            componentData.components = this.extractComponentsFromFormula(
              component.formula
            );
          } else if (!componentData.components) {
            componentData.components = [];
          }

          statutoryComponents[key] = componentData;
        });
      }
    } catch (error) {
      console.error("Error parsing statutory_components:", error);
      statutoryComponents = {};
    }

    return {
      id: template.id,
      client_id: template.client_id,
      pay_grade_structure_id: template.pay_grade_structure_id,
      template_name: template.template_name,
      description: template.description,
      templateSettings: {
        custom: customComponents,
        statutory: statutoryComponents,
        calculation_rules: template.calculation_rules || null,
      },
      metadata: {
        client_name: template.client?.client_name,
        grade_name: template.pay_grade_structure?.grade_name,
        use_credit_to_bank_model: template.use_credit_to_bank_model,
        service_fee_percentage: template.service_fee_percentage,
        attendance_calculation_method: template.attendance_calculation_method,
        prorate_salary: template.prorate_salary,
        minimum_attendance_factor: template.minimum_attendance_factor,
        is_active: template.is_active,
        is_default: template.is_default,
        created_by: template.created_by,
        updated_by: template.updated_by,
        last_used_at: template.last_used_at,
        created_at: template.created_at,
        updated_at: template.updated_at,
      },
    };
  },

  /**
   * Extract percentage rate from formula strings
   */
  extractRateFromFormula(formula) {
    if (!formula || typeof formula !== "string") return null;

    // Look for percentage patterns like "8%", "7.5%", "* 0.01" (1%), etc.
    const percentageMatch = formula.match(/(\d+(?:\.\d+)?)%/);
    if (percentageMatch) {
      return parseFloat(percentageMatch[1]);
    }

    // Look for decimal patterns like "* 0.08" (8%), "* 0.075" (7.5%)
    const decimalMatch = formula.match(/\*\s*0\.(\d+)/);
    if (decimalMatch) {
      const decimal = parseFloat("0." + decimalMatch[1]);
      return decimal * 100; // Convert to percentage
    }

    return null;
  },
};

export default invoiceTemplateService;
