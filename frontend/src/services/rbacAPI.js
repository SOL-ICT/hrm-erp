import { APIService } from "./api.js";

class RBACAPIService extends APIService {
  constructor() {
    super();
  }

  // Get modules structure for RBAC management
  async getModulesStructure() {
    return this.makeRequest("/admin/rbac/modules");
  }

  // Get all roles
  async getRoles() {
    return this.makeRequest("/admin/rbac/roles");
  }

  // Get permissions for a specific role
  async getRolePermissions(roleId) {
    return this.makeRequest(`/admin/rbac/roles/${roleId}/permissions`);
  }

  // Update permissions for a role
  async updateRolePermissions(roleId, permissions) {
    return this.makeRequest(`/admin/rbac/roles/${roleId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    });
  }

  // Get user permissions (role-based + direct)
  async getUserPermissions(userId) {
    return this.makeRequest(`/admin/rbac/users/${userId}/permissions`);
  }

  // Grant or deny permission to a user
  async updateUserPermission(userId, permissionData) {
    return this.makeRequest(`/admin/rbac/users/${userId}/permissions`, {
      method: "POST",
      body: JSON.stringify(permissionData),
    });
  }

  // Check if user has specific permission
  async checkUserPermission(userId, module, submodule, permission) {
    return this.makeRequest(
      `/admin/rbac/users/${userId}/check/${module}/${submodule}/${permission}`
    );
  }
}

// Create and export singleton instance
export const rbacAPI = new RBACAPIService();
export default rbacAPI;
