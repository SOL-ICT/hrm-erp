// Core API Configuration and Base Service
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Core API Service Class (EXACT replica from your current system)
class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  getAuthToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  }

  setAuthToken(token) {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
      }
    }
  }

  getHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    const token = this.getAuthToken();

    // Only add Bearer token if it's a real token (not our session indicator)
    if (token && token !== "session-authenticated") {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Simplified approach - no CSRF cookie fetch needed since backend bypasses it
    const config = {
      method: options.method || "GET",
      headers: this.getHeaders(options.headers),
      credentials: "include", // For session-based auth
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle different content types
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else if (contentType && contentType.includes("text/")) {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return { data, status: response.status, headers: response.headers };
    } catch (error) {
      console.error("API Request failed:", { url, error });
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.makeRequest(endpoint, { ...options, method: "GET" });
  }

  async post(endpoint, data = null, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : null,
    });
  }

  async put(endpoint, data = null, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : null,
    });
  }

  async patch(endpoint, data = null, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : null,
    });
  }

  async delete(endpoint, options = {}) {
    return this.makeRequest(endpoint, { ...options, method: "DELETE" });
  }
}

// Create and export singleton instance
const apiService = new APIService();
export default apiService;
export { apiService };
