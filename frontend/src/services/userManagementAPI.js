import { APIService } from "./api.js";

class UserManagementAPIService extends APIService {
  constructor() {
    super();
  }

  // Get SOL staff users with filters
  async getStaffUsers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.role_id) params.append('role_id', filters.role_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);

    const queryString = params.toString();
    return this.makeRequest(`/user-management/staff-users${queryString ? `?${queryString}` : ''}`);
  }

  // Get available roles
  async getAvailableRoles() {
    return this.makeRequest('/user-management/available-roles');
  }

  // Change user role
  async changeUserRole(userId, roleId, reason = null) {
    return this.makeRequest(`/user-management/users/${userId}/change-role`, {
      method: 'POST',
      body: JSON.stringify({ role_id: roleId, reason }),
    });
  }

  // Reset user password
  async resetPassword(userId, sendEmail = true) {
    return this.makeRequest(`/user-management/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ send_email: sendEmail }),
    });
  }

  // Get role change history
  async getRoleHistory(filters = {}) {
    const params = new URLSearchParams();
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.per_page) params.append('per_page', filters.per_page);
    if (filters.page) params.append('page', filters.page);

    const queryString = params.toString();
    return this.makeRequest(`/user-management/role-history${queryString ? `?${queryString}` : ''}`);
  }
}

// Create and export singleton instance
export const userManagementAPI = new UserManagementAPIService();
export default userManagementAPI;
