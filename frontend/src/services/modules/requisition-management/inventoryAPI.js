import { apiService } from "../../api";

/**
 * Store Inventory API Service
 * 
 * Handles all API calls for inventory management
 */
const inventoryAPI = {
  // ========================================
  // INVENTORY CRUD OPERATIONS
  // ========================================

  /**
   * Get all inventory items with filters
   * @param {Object} params - Query parameters
   * @param {string} params.category - Filter by category
   * @param {boolean} params.active - Filter by active status
   * @param {boolean} params.available - Filter by availability
   * @param {string} params.search - Search by name or code
   * @param {string} params.stock_status - Filter by stock status ('low', 'out')
   * @param {string} params.sort_by - Sort field (default: 'name')
   * @param {string} params.sort_order - Sort order (default: 'asc')
   * @param {number} params.per_page - Items per page (default: 15)
   */
  getAll: async (params = {}) => {
    try {
      console.log("[inventoryAPI.getAll] Request params:", params);
      const response = await apiService.makeRequest("/admin/inventory", {
        method: "GET",
        params,
      });
      console.log("[inventoryAPI.getAll] Full response:", response);
      console.log("[inventoryAPI.getAll] response.data:", response?.data);
      console.log("[inventoryAPI.getAll] response.data.data:", response?.data?.data);
      
      // Backend returns: { success: true, data: { data: [...], current_page, per_page, ... } }
      // Extract the nested data array from pagination
      if (response?.data?.data?.data) {
        console.log("[inventoryAPI.getAll] Returning paginated data, length:", response.data.data.data.length);
        return response.data.data.data; // Paginated response
      }
      const fallback = response?.data?.data || response?.data || [];
      console.log("[inventoryAPI.getAll] Returning fallback data, length:", fallback.length);
      return fallback;
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
      return []; // Return empty array on error
    }
  },

  /**
   * Get single inventory item by ID
   * @param {number} id - Inventory item ID
   */
  getById: async (id) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/inventory/${id}`
      );
      return response;
    } catch (error) {
      console.error(`Failed to fetch inventory item ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new inventory item
   * @param {Object} data - Inventory item data
   */
  create: async (data) => {
    try {
      const response = await apiService.makeRequest("/admin/inventory", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error("Failed to create inventory item:", error);
      throw error;
    }
  },

  /**
   * Update inventory item
   * @param {number} id - Inventory item ID
   * @param {Object} data - Updated data
   */
  update: async (id, data) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/inventory/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to update inventory item ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete inventory item
   * @param {number} id - Inventory item ID
   */
  delete: async (id) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/inventory/${id}`,
        {
          method: "DELETE",
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to delete inventory item ${id}:`, error);
      throw error;
    }
  },

  // ========================================
  // INVENTORY QUERIES
  // ========================================

  /**
   * Get items with available stock
   * @param {string} category - Optional category filter
   */
  getAvailableStock: async (category = null) => {
    try {
      const params = category ? { category } : {};
      const response = await apiService.makeRequest(
        "/admin/inventory/available/items",
        {
          method: "GET",
          params,
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch available items:", error);
      throw error;
    }
  },

  /**
   * Check availability for specific items
   * @param {Array} items - Array of {inventory_item_id, quantity}
   */
  checkAvailability: async (items) => {
    try {
      const response = await apiService.makeRequest(
        "/admin/inventory/check-availability",
        {
          method: "POST",
          body: JSON.stringify({ items }),
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to check availability:", error);
      throw error;
    }
  },

  /**
   * Get inventory statistics
   */
  getStatistics: async () => {
    try {
      const response = await apiService.makeRequest(
        "/admin/inventory/stats/overview"
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch inventory statistics:", error);
      // Return fallback data on error
      return {
        success: false,
        data: {
          total_items: 0,
          low_stock_items: 0,
          out_of_stock_items: 0,
          total_stock_value: 0,
          available_stock_value: 0,
          reserved_stock_value: 0,
        },
      };
    }
  },

  /**
   * Get all categories
   */
  getCategories: async () => {
    try {
      const response = await apiService.makeRequest(
        "/admin/inventory/categories/list"
      );
      // Extract data array or return empty array
      return response?.data || [];
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return []; // Return empty array on error
    }
  },

  /**
   * Get low stock items
   * @param {number} threshold - Stock threshold (default: 10)
   */
  getLowStock: async (threshold = 10) => {
    try {
      const response = await apiService.makeRequest(
        "/admin/inventory/alerts/low-stock",
        {
          method: "GET",
          params: { threshold },
        }
      );
      return response;
    } catch (error) {
      console.error("Failed to fetch low stock items:", error);
      throw error;
    }
  },

  // ========================================
  // INVENTORY ACTIONS
  // ========================================

  /**
   * Restock inventory item
   * @param {number} id - Inventory item ID
   * @param {number} quantity - Quantity to add
   */
  restock: async (id, quantity) => {
    try {
      const response = await apiService.makeRequest(
        `/admin/inventory/${id}/restock`,
        {
          method: "POST",
          body: JSON.stringify({ quantity }),
        }
      );
      return response;
    } catch (error) {
      console.error(`Failed to restock item ${id}:`, error);
      throw error;
    }
  },

  // ========================================
  // SEARCH HELPERS
  // ========================================

  /**
   * Search inventory by name or code
   * @param {string} searchTerm - Search query
   * @param {Object} additionalParams - Additional filters
   */
  search: async (searchTerm, additionalParams = {}) => {
    try {
      const response = await apiService.makeRequest("/admin/inventory", {
        method: "GET",
        params: {
          search: searchTerm,
          ...additionalParams,
        },
      });
      return response;
    } catch (error) {
      console.error("Failed to search inventory:", error);
      throw error;
    }
  },

  /**
   * Get items by category
   * @param {string} category - Category name
   * @param {Object} additionalParams - Additional filters
   */
  getByCategory: async (category, additionalParams = {}) => {
    try {
      const response = await apiService.makeRequest("/admin/inventory", {
        method: "GET",
        params: {
          category,
          ...additionalParams,
        },
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch items in category ${category}:`, error);
      throw error;
    }
  },
};

export default inventoryAPI;
