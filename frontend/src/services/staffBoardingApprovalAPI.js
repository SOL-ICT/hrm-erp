import { apiService } from "../api";

/**
 * Staff Boarding Approval API Service
 * 
 * Handles staff boarding approvals, rejections, and pending lists.
 * This is separate from the generic approval system.
 */
class StaffBoardingApprovalAPI {

  /**
   * Get pending boarding approvals for current user
   * Based on user's role and permissions:
   * - Control Department: pending_control_approval status
   * - Supervisors: pending status  
   * - Regular users: their own uploaded staff
   */
  async getPendingApprovals(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.client_id) params.append('client_id', filters.client_id);
      if (filters.page) params.append('page', filters.page);
      if (filters.per_page) params.append('per_page', filters.per_page);

      const queryString = params.toString();
      const url = `/boarding/pending-approvals${queryString ? `?${queryString}` : ''}`;
      
      return apiService.makeRequest(url);
    } catch (error) {
      console.error('Failed to fetch pending boarding approvals:', error);
      throw error;
    }
  }

  /**
   * Approve a staff boarding (supervisor level)
   * Moves from 'pending' to 'pending_control_approval'
   */
  async approve(staffId, notes = '') {
    try {
      return apiService.makeRequest(`/boarding/${staffId}/approve`, {
        method: 'POST',
        body: { approval_notes: notes }
      });
    } catch (error) {
      console.error('Failed to approve boarding:', error);
      throw error;
    }
  }

  /**
   * Reject a staff boarding (supervisor level)
   * Sets status to 'rejected'
   */
  async reject(staffId, reason, notes = '') {
    try {
      return apiService.makeRequest(`/boarding/${staffId}/reject`, {
        method: 'POST',
        body: { 
          rejection_reason: reason,
          approval_notes: notes
        }
      });
    } catch (error) {
      console.error('Failed to reject boarding:', error);
      throw error;
    }
  }

  /**
   * Control approve a staff boarding (final approval)
   * Activates staff for payroll
   */
  async controlApprove(staffId, notes = '') {
    try {
      return apiService.makeRequest(`/boarding/${staffId}/control-approve`, {
        method: 'POST',
        body: { control_approval_notes: notes }
      });
    } catch (error) {
      console.error('Failed to control approve boarding:', error);
      throw error;
    }
  }

  /**
   * Control reject a staff boarding (compliance issues)
   * Sets status to 'control_rejected'
   */
  async controlReject(staffId, reason, notes = '') {
    try {
      return apiService.makeRequest(`/boarding/${staffId}/control-reject`, {
        method: 'POST',
        body: { 
          control_rejection_reason: reason,
          control_approval_notes: notes
        }
      });
    } catch (error) {
      console.error('Failed to control reject boarding:', error);
      throw error;
    }
  }

  /**
   * Bulk approve multiple staff boardings
   */
  async bulkApprove(staffIds, notes = '') {
    try {
      return apiService.makeRequest('/boarding/bulk-approve', {
        method: 'POST',
        body: { 
          staff_ids: staffIds,
          approval_notes: notes
        }
      });
    } catch (error) {
      console.error('Failed to bulk approve boardings:', error);
      throw error;
    }
  }

  /**
   * Bulk control approve multiple staff boardings
   */
  async bulkControlApprove(staffIds, notes = '') {
    try {
      return apiService.makeRequest('/boarding/bulk-control-approve', {
        method: 'POST',
        body: { 
          staff_ids: staffIds,
          control_approval_notes: notes
        }
      });
    } catch (error) {
      console.error('Failed to bulk control approve boardings:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const staffBoardingApprovalAPI = new StaffBoardingApprovalAPI();
export default staffBoardingApprovalAPI;