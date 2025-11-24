/**
 * FRONTEND PAYLOAD VALIDATOR
 *
 * This utility intercepts API calls from the frontend and validates payloads
 * against expected backend schemas.
 *
 * Usage:
 * 1. Add this to your browser console on localhost:3000
 * 2. Perform actions in the UI (create pay grade, upload attendance, etc.)
 * 3. Check console for payload validation results
 *
 * Or import into a test file for automated frontend testing
 */

class PayloadValidator {
  constructor() {
    this.validationResults = [];
    this.interceptFetch();
  }

  // Expected payload schemas
  schemas = {
    "/salary-structure/pay-grades": {
      method: "POST",
      required: [
        "client_id",
        "job_structure_id",
        "grade_name",
        "grade_code",
        "pay_structure_type",
      ],
      optional: ["emoluments", "currency", "is_active"],
      types: {
        client_id: "number",
        job_structure_id: "number",
        grade_name: "string",
        grade_code: "string",
        pay_structure_type: "string",
        emoluments: "object",
        currency: "string",
        is_active: "boolean",
      },
    },
    "/salary-structure/pay-grades/bulk-upload": {
      method: "POST",
      required: ["client_id", "job_structure_id", "file"],
      optional: [],
      types: {
        client_id: "number",
        job_structure_id: "number",
        file: "File",
      },
    },
    "/salary-structure/pay-grades/bulk-confirm": {
      method: "POST",
      required: ["client_id", "job_structure_id", "data"],
      optional: [],
      types: {
        client_id: "number",
        job_structure_id: "number",
        data: "array",
      },
    },
    "/payroll/attendance-uploads": {
      method: "POST",
      required: ["client_id", "file", "pay_period_start", "pay_period_end"],
      optional: ["description"],
      types: {
        client_id: "number",
        file: "File",
        pay_period_start: "string", // YYYY-MM-DD
        pay_period_end: "string",
        description: "string",
      },
    },
    "/payroll/runs": {
      method: "POST",
      required: [
        "client_id",
        "pay_period_start",
        "pay_period_end",
        "payment_date",
      ],
      optional: ["description"],
      types: {
        client_id: "number",
        pay_period_start: "string",
        pay_period_end: "string",
        payment_date: "string",
        description: "string",
      },
    },
    "/payroll/runs/:id/calculate": {
      method: "POST",
      required: [],
      optional: ["force"],
      types: {
        force: "boolean",
      },
    },
  };

  interceptFetch() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (...args) {
      const [url, options = {}] = args;

      // Only intercept API calls
      if (url.includes("/api/")) {
        const endpoint = url.replace(/.*\/api/, "").split("?")[0];
        const method = options.method || "GET";

        console.group(`🔍 API Call: ${method} ${endpoint}`);

        // Get payload
        let payload = null;
        if (options.body) {
          try {
            if (options.body instanceof FormData) {
              payload = {};
              for (let [key, value] of options.body.entries()) {
                payload[key] = value;
              }
            } else {
              payload = JSON.parse(options.body);
            }
          } catch (e) {
            payload = options.body;
          }
        }

        // Validate payload
        if (payload && method !== "GET") {
          const validation = self.validatePayload(endpoint, method, payload);

          if (validation.valid) {
            console.log("%c✓ Payload Valid", "color: green; font-weight: bold");
          } else {
            console.error(
              "%c✗ Payload Invalid",
              "color: red; font-weight: bold"
            );
            console.error("Errors:", validation.errors);
          }

          console.log("Payload:", payload);

          self.validationResults.push({
            timestamp: new Date().toISOString(),
            endpoint,
            method,
            payload,
            validation,
          });
        }

        console.groupEnd();
      }

      return originalFetch.apply(this, args);
    };

    console.log("✅ Payload validator initialized");
    console.log("📝 Perform actions in the UI to see payload validation");
  }

  validatePayload(endpoint, method, payload) {
    // Find matching schema (handle dynamic routes like /payroll/runs/123/calculate)
    let schema = null;
    let matchedEndpoint = null;

    for (const [schemaEndpoint, schemaData] of Object.entries(this.schemas)) {
      if (schemaData.method === method) {
        const pattern = schemaEndpoint.replace(/:id/g, "\\d+");
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(endpoint)) {
          schema = schemaData;
          matchedEndpoint = schemaEndpoint;
          break;
        }
      }
    }

    if (!schema) {
      return {
        valid: true,
        warnings: [`No schema defined for ${method} ${endpoint}`],
        errors: [],
      };
    }

    const errors = [];
    const warnings = [];

    // Check required fields
    for (const field of schema.required) {
      if (!(field in payload)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check types
    for (const [field, value] of Object.entries(payload)) {
      if (field in schema.types) {
        const expectedType = schema.types[field];
        const actualType = this.getType(value);

        if (expectedType !== actualType) {
          errors.push(
            `Field '${field}' should be ${expectedType}, got ${actualType}`
          );
        }
      } else if (!schema.optional.includes(field)) {
        warnings.push(`Unknown field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      schema: matchedEndpoint,
    };
  }

  getType(value) {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return "array";
    if (value instanceof File) return "File";
    if (value instanceof Date) return "Date";
    return typeof value;
  }

  getReport() {
    console.group("📊 Payload Validation Report");
    console.log(
      `Total API calls intercepted: ${this.validationResults.length}`
    );

    const valid = this.validationResults.filter(
      (r) => r.validation.valid
    ).length;
    const invalid = this.validationResults.filter(
      (r) => !r.validation.valid
    ).length;

    console.log(`%c✓ Valid: ${valid}`, "color: green");
    console.log(`%c✗ Invalid: ${invalid}`, "color: red");

    if (invalid > 0) {
      console.group("❌ Invalid Payloads:");
      this.validationResults
        .filter((r) => !r.validation.valid)
        .forEach((result) => {
          console.log(
            `${result.method} ${result.endpoint}:`,
            result.validation.errors
          );
        });
      console.groupEnd();
    }

    console.groupEnd();

    return {
      total: this.validationResults.length,
      valid,
      invalid,
      results: this.validationResults,
    };
  }

  exportResults() {
    const report = this.getReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payload-validation-${Date.now()}.json`;
    a.click();
    console.log("✅ Results exported");
  }
}

// Auto-initialize if in browser
if (typeof window !== "undefined") {
  window.payloadValidator = new PayloadValidator();

  // Add helper commands
  console.log("Commands:");
  console.log("  payloadValidator.getReport() - View validation summary");
  console.log("  payloadValidator.exportResults() - Export results as JSON");
}

// Export for Node.js/testing environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = PayloadValidator;
}
