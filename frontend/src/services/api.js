// src/services/api.js
class APIService {
  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      credentials: "include",
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async register(userData) {
    return this.makeRequest("/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.makeRequest("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  // Generic methods for CRUD operations
  async get(endpoint, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
    
    return this.makeRequest(url, {
      method: 'GET',
    });
  }

  async post(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.makeRequest(endpoint, {
      method: 'DELETE',
    });
  }

  // Service Location API methods
  async getServiceLocations(params = {}) {
    return this.get('/service-locations', params);
  }

  async createServiceLocation(data) {
    return this.post('/service-locations', data);
  }

  async updateServiceLocation(id, data) {
    return this.put(`/service-locations/${id}`, data);
  }

  async deleteServiceLocation(id) {
    return this.delete(`/service-locations/${id}`);
  }

  // Client API methods
  async getClients(params = {}) {
    return this.get('/clients', params);
  }

  // Utilities API methods
  async getStatesLgas() {
    return this.get('/states-lgas');
  }

  async getRegions() {
    return this.get('/service-locations/regions/list');
  }

  async getZones() {
    return this.get('/service-locations/zones/list');
  }
}

export default new APIService();
