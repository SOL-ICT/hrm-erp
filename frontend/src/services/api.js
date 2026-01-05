// Core API Configuration and Base Service
export class APIService {
  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    this.authToken = null;

    // Try to get token from localStorage on initialization
    if (typeof window !== "undefined") {
      this.authToken = localStorage.getItem("token");
    }
  }

  setAuthToken(token) {
    this.authToken = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
  }

  getAuthToken() {
    return this.authToken;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // For authenticated requests, ensure CSRF cookie is available
    if (!options.skipCsrf && typeof window !== "undefined") {
      try {
        await fetch(`${this.baseURL.replace("/api", "")}/sanctum/csrf-cookie`, {
          credentials: "include",
        });
        console.log("✅ CSRF cookie ensured for:", endpoint);
      } catch (csrfError) {
        console.warn("⚠️ CSRF cookie fetch failed:", csrfError);
      }
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest", // Required for Laravel Sanctum
      ...options.headers,
    };

    // Remove Content-Type for FormData uploads to let browser set proper boundary
    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    // Add Authorization header if token is available
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    // Handle params for GET requests
    if (
      options.params &&
      options.method !== "POST" &&
      options.method !== "PUT"
    ) {
      const urlParams = new URLSearchParams(options.params);
      const finalUrl = `${url}?${urlParams}`;
      delete options.params;

      const config = {
        method: options.method || "GET",
        headers,
        credentials: "include", // Include cookies for session-based auth
        signal: options.signal, // Support for AbortController
        ...options,
      };

      try {
        const response = await fetch(finalUrl, config);
        const contentType = response.headers.get("content-type");
        let data;

        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (!response.ok) {
          if (response.status === 401) {
            // Only redirect to login if we're not already on login page
            const currentPath =
              typeof window !== "undefined" ? window.location.pathname : "";
            if (currentPath !== "/login") {
              console.warn("Authentication expired, redirecting to login");
              this.setAuthToken(null);
              if (typeof window !== "undefined") {
                // Use setTimeout to prevent immediate redirect during component cleanup
                setTimeout(() => {
                  window.location.href = "/login";
                }, 100);
              }
            }
          }

          // For 404s, return the response data so individual APIs can handle them
          if (response.status === 404 && data && data.message) {
            return data;
          }

          throw new Error(
            data.message || `HTTP error! status: ${response.status}`
          );
        }

        return data;
      } catch (error) {
        console.error("API Request failed:", error);
        throw error;
      }
    }

    const config = {
      method: options.method || "GET",
      headers,
      credentials: "include", // Include cookies for session-based auth
      body: options.body,
      signal: options.signal, // Support for AbortController
      ...options,
    };

    // Debug logging
    console.log("API Request:", {
      url,
      method: config.method,
      hasToken: !!this.authToken,
      hasCSRF: !!headers["X-XSRF-TOKEN"],
      headers,
    });

    try {
      const response = await fetch(url, config);

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Only redirect to login if we're not already on login page
          // and if this isn't from an aborted request
          const currentPath =
            typeof window !== "undefined" ? window.location.pathname : "";
          if (currentPath !== "/login" && !error?.name?.includes("Abort")) {
            console.warn("Authentication expired, redirecting to login");
            this.setAuthToken(null);
            if (typeof window !== "undefined") {
              // Use setTimeout to prevent immediate redirect during component cleanup
              setTimeout(() => {
                window.location.href = "/login";
              }, 100);
            }
          }
        }

        // For validation errors, include the validation details
        if (response.status === 422 && data.errors) {
          const validationErrors = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("; ");
          throw new Error(
            `${data.message || "Validation failed"}: ${validationErrors}`
          );
        }

        // Include the error field if it exists (e.g., from backend exceptions)
        const errorMessage = data.error
          ? `${data.message}: ${data.error}`
          : data.message || `HTTP error! status: ${response.status}`;

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    try {
      const response = await this.makeRequest("/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      return response;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }
}

// Create singleton instance
export const apiService = new APIService();

// Import all modular APIs
import clientMasterAPI from "./modules/client-contract-management/clientMasterAPI";
import serviceLocationsAPI from "./modules/client-contract-management/serviceLocationsAPI";
import serviceRequestsAPI from "./modules/client-contract-management/serviceRequestsAPI"; // Stub for removed functionality
import clientContractsAPI from "./modules/client-contract-management/clientContractsAPI";
import { salaryStructureAPI } from "./modules/client-contract-management/salary-structure";
import solOfficeAPI from "./modules/administration/solOfficeAPI";

// RECRUITMENT MANAGEMENT IMPORT
import recruitmentRequestAPI from "./modules/recruitment-management/recruitmentRequestAPI";
import clientInterviewAPI from "./modules/recruitment-management/clientInterviewAPI";

// OFFER LETTER MANAGEMENT IMPORT
import { offerLetterAPI } from "./modules/client-contract-management/offer-letter";

// INVOICING MANAGEMENT IMPORT
import firsAPI from "./modules/invoicing/firsAPI";

// Clean, organized exports (no legacy naming confusion)
export {
  // Client Contract Management APIs
  clientMasterAPI,
  serviceLocationsAPI,
  serviceRequestsAPI, // Stub for removed functionality
  clientContractsAPI,
  salaryStructureAPI,

  // Administration APIs
  solOfficeAPI,

  // Recruitment Management APIs
  recruitmentRequestAPI,
  clientInterviewAPI,

  // Offer Letter Management APIs
  offerLetterAPI,

  // Invoicing Management APIs
  firsAPI,
};

// Legacy aliases for backward compatibility (clean version)
export const clientAPI = clientMasterAPI;
export const serviceLocationAPI = serviceLocationsAPI; // Simple alias
export const serviceRequestAPI = serviceRequestsAPI; // Stub for removed functionality
export const solMasterAPI = solOfficeAPI;

// Default export
export default apiService;
