// Approval API Service
import { apiService } from "./api";

const approvalAPI = {
  // ========================================
  // CORE APPROVAL ENDPOINTS
  // ========================================

  /**
   * Get all approvals with optional filters
   * @param {Object} filters - Optional filters: module, status, priority, date_range, overdue, search
   * @returns {Promise} Paginated approval list
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.module) params.append("module", filters.module);
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.date_range) params.append("date_range", filters.date_range);
    if (filters.overdue) params.append("overdue", "1");
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.per_page) params.append("per_page", filters.per_page);

    const queryString = params.toString();
    const url = `/admin/approvals${queryString ? `?${queryString}` : ""}`;
    
    return apiService.makeRequest(url);
  },

  /**
   * Get my pending approvals (approvals waiting for my action)
   * @returns {Promise} Pending approvals with summary stats
   */
  getPending: async () => {
    return apiService.makeRequest("/admin/approvals/pending");
  },

  /**
   * Get my submitted approvals (approvals I requested)
   * @returns {Promise} Submitted approvals with counts by status
   */
  getSubmitted: async () => {
    return apiService.makeRequest("/admin/approvals/submitted");
  },

  /**
   * Get approvals delegated to me
   * @returns {Promise} Delegated approvals
   */
  getDelegated: async () => {
    return apiService.makeRequest("/admin/approvals/delegated");
  },

  /**
   * Get single approval details
   * @param {number} id - Approval ID
   * @returns {Promise} Approval details with relationships
   */
  getById: async (id) => {
    return apiService.makeRequest(`/admin/approvals/${id}`);
  },

  /**
   * Get approval history/timeline
   * @param {number} id - Approval ID
   * @returns {Promise} Complete approval history
   */
  getHistory: async (id) => {
    return apiService.makeRequest(`/admin/approvals/${id}/history`);
  },

  // ========================================
  // APPROVAL ACTIONS
  // ========================================

  /**
   * Approve an approval request
   * @param {number} id - Approval ID
   * @param {string} comments - Optional approval comments
   * @returns {Promise} Updated approval
   */
  approve: async (id, comments = "") => {
    return apiService.makeRequest(`/admin/approvals/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ comments }),
    });
  },

  /**
   * Reject an approval request
   * @param {number} id - Approval ID
   * @param {string} reason - Rejection reason (required)
   * @param {string} comments - Optional additional comments
   * @returns {Promise} Updated approval
   */
  reject: async (id, reason, comments = "") => {
    return apiService.makeRequest(`/admin/approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: reason, comments }),
    });
  },

  /**
   * Add comment to approval
   * @param {number} id - Approval ID
   * @param {string} comment - Comment text
   * @returns {Promise} Comment record
   */
  addComment: async (id, comment) => {
    return apiService.makeRequest(`/admin/approvals/${id}/comment`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  },

  /**
   * Escalate approval to higher authority
   * @param {number} id - Approval ID
   * @param {number} escalate_to - User ID to escalate to
   * @param {string} reason - Escalation reason
   * @returns {Promise} Updated approval
   */
  escalate: async (id, escalate_to, reason) => {
    return apiService.makeRequest(`/admin/approvals/${id}/escalate`, {
      method: "POST",
      body: JSON.stringify({ escalate_to, escalation_reason: reason }),
    });
  },

  /**
   * Cancel approval request
   * @param {number} id - Approval ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} Cancelled approval
   */
  cancel: async (id, reason) => {
    return apiService.makeRequest(`/admin/approvals/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ cancellation_reason: reason }),
    });
  },

  // ========================================
  // STATISTICS & ANALYTICS
  // ========================================

  /**
   * Get approval statistics
   * @returns {Promise} Approval stats with module breakdown
   */
  getStats: async () => {
    return apiService.makeRequest("/admin/approvals/stats");
  },

  /**
   * Get overdue approvals
   * @returns {Promise} List of overdue approvals
   */
  getOverdue: async () => {
    return apiService.makeRequest("/admin/approvals/overdue");
  },

  /**
   * Get user-specific approval statistics
   * @param {number} userId - User ID
   * @returns {Promise} User approval stats
   */
  getUserStats: async (userId) => {
    return apiService.makeRequest(`/admin/approvals/user-stats/${userId}`);
  },

  // ========================================
  // DASHBOARD ENDPOINTS
  // ========================================

  /**
   * Get dashboard overview
   * @returns {Promise} Dashboard data with metrics
   */
  getDashboard: async () => {
    return apiService.makeRequest("/admin/approvals/dashboard");
  },

  /**
   * Get system metrics
   * @returns {Promise} System-wide approval metrics
   */
  getMetrics: async () => {
    return apiService.makeRequest("/admin/approvals/dashboard/metrics");
  },

  /**
   * Get module breakdown
   * @returns {Promise} Approval counts by module
   */
  getModuleBreakdown: async () => {
    return apiService.makeRequest("/admin/approvals/dashboard/modules");
  },

  /**
   * Get approval trends
   * @param {string} period - Time period (day, week, month, year)
   * @returns {Promise} Trend data
   */
  getTrends: async (period = "month") => {
    return apiService.makeRequest(`/admin/approvals/dashboard/trends?period=${period}`);
  },

  /**
   * Get bottleneck analysis
   * @returns {Promise} Bottleneck data (slowest approvers, overdue items)
   */
  getBottlenecks: async () => {
    return apiService.makeRequest("/admin/approvals/dashboard/bottlenecks");
  },

  /**
   * Get approver performance metrics
   * @param {string} period - Time period (day, week, month, year)
   * @returns {Promise} Performance data by approver
   */
  getApproverPerformance: async (period = "month") => {
    return apiService.makeRequest(`/admin/approvals/dashboard/performance?period=${period}`);
  },

  // ========================================
  // DELEGATION ENDPOINTS
  // ========================================

  /**
   * Create delegation
   * @param {Object} data - Delegation data: delegate_to, start_date, end_date, reason
   * @returns {Promise} Created delegation
   */
  createDelegation: async (data) => {
    return apiService.makeRequest("/admin/approval-delegations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Get my delegations
   * @returns {Promise} List of active delegations
   */
  getMyDelegations: async () => {
    return apiService.makeRequest("/admin/approval-delegations/my");
  },

  /**
   * Update delegation
   * @param {number} id - Delegation ID
   * @param {Object} data - Updated delegation data
   * @returns {Promise} Updated delegation
   */
  updateDelegation: async (id, data) => {
    return apiService.makeRequest(`/admin/approval-delegations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Revoke delegation
   * @param {number} id - Delegation ID
   * @returns {Promise} Revoked delegation
   */
  revokeDelegation: async (id) => {
    return apiService.makeRequest(`/admin/approval-delegations/${id}`, {
      method: "DELETE",
    });
  },

  // ========================================
  // WORKFLOW MANAGEMENT (Admin)
  // ========================================

  /**
   * Get all workflows
   * @returns {Promise} List of approval workflows
   */
  getAllWorkflows: async () => {
    return apiService.makeRequest("/admin/approval-workflows");
  },

  /**
   * Get workflow by ID
   * @param {number} id - Workflow ID
   * @returns {Promise} Workflow details with levels
   */
  getWorkflowById: async (id) => {
    return apiService.makeRequest(`/admin/approval-workflows/${id}`);
  },

  /**
   * Create workflow
   * @param {Object} data - Workflow data
   * @returns {Promise} Created workflow
   */
  createWorkflow: async (data) => {
    return apiService.makeRequest("/admin/approval-workflows", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update workflow
   * @param {number} id - Workflow ID
   * @param {Object} data - Updated workflow data
   * @returns {Promise} Updated workflow
   */
  updateWorkflow: async (id, data) => {
    return apiService.makeRequest(`/admin/approval-workflows/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Deactivate workflow
   * @param {number} id - Workflow ID
   * @returns {Promise} Deactivated workflow
   */
  deactivateWorkflow: async (id) => {
    return apiService.makeRequest(`/admin/approval-workflows/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Get workflow levels
   * @param {number} workflowId - Workflow ID
   * @returns {Promise} Workflow levels
   */
  getWorkflowLevels: async (workflowId) => {
    return apiService.makeRequest(`/admin/approval-workflows/${workflowId}/levels`);
  },

  /**
   * Add workflow level
   * @param {number} workflowId - Workflow ID
   * @param {Object} data - Level data
   * @returns {Promise} Created level
   */
  addWorkflowLevel: async (workflowId, data) => {
    return apiService.makeRequest(`/admin/approval-workflows/${workflowId}/levels`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update workflow level
   * @param {number} levelId - Level ID
   * @param {Object} data - Updated level data
   * @returns {Promise} Updated level
   */
  updateWorkflowLevel: async (levelId, data) => {
    return apiService.makeRequest(`/admin/approval-workflows/levels/${levelId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // ========================================
  // POLICY MANAGEMENT (Admin)
  // ========================================

  /**
   * Get all policies
   * @returns {Promise} List of approval policies
   */
  getAllPolicies: async () => {
    return apiService.makeRequest("/admin/approval-policies");
  },

  /**
   * Get policy by ID
   * @param {number} id - Policy ID
   * @returns {Promise} Policy details
   */
  getPolicyById: async (id) => {
    return apiService.makeRequest(`/admin/approval-policies/${id}`);
  },

  /**
   * Create policy
   * @param {Object} data - Policy data
   * @returns {Promise} Created policy
   */
  createPolicy: async (data) => {
    return apiService.makeRequest("/admin/approval-policies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update policy
   * @param {number} id - Policy ID
   * @param {Object} data - Updated policy data
   * @returns {Promise} Updated policy
   */
  updatePolicy: async (id, data) => {
    return apiService.makeRequest(`/admin/approval-policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Deactivate policy
   * @param {number} id - Policy ID
   * @returns {Promise} Deactivated policy
   */
  deactivatePolicy: async (id) => {
    return apiService.makeRequest(`/admin/approval-policies/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Evaluate policy (test)
   * @param {Object} data - Test data
   * @returns {Promise} Evaluation result
   */
  evaluatePolicy: async (data) => {
    return apiService.makeRequest("/admin/approval-policies/evaluate", {
      method: "GET",
      body: JSON.stringify(data),
    });
  },

  // ========================================
  // BULK OPERATIONS
  // ========================================

  /**
   * Bulk approve multiple approvals
   * @param {Array<number>} approvalIds - Array of approval IDs
   * @param {string} comments - Optional comments
   * @returns {Promise} Bulk operation result
   */
  bulkApprove: async (approvalIds, comments = "") => {
    return apiService.makeRequest("/admin/approvals/bulk-approve", {
      method: "POST",
      body: JSON.stringify({ approval_ids: approvalIds, comments }),
    });
  },

  /**
   * Bulk reject multiple approvals
   * @param {Array<number>} approvalIds - Array of approval IDs
   * @param {string} reason - Rejection reason (required)
   * @param {string} comments - Optional additional comments
   * @returns {Promise} Bulk operation result
   */
  bulkReject: async (approvalIds, reason, comments = "") => {
    return apiService.makeRequest("/admin/approvals/bulk-reject", {
      method: "POST",
      body: JSON.stringify({ 
        approval_ids: approvalIds, 
        rejection_reason: reason, 
        comments 
      }),
    });
  },

  /**
   * Bulk delete multiple approvals
   * @param {Array<number>} approvalIds - Array of approval IDs
   * @returns {Promise} Bulk operation result
   */
  bulkDelete: async (approvalIds) => {
    return apiService.makeRequest("/admin/approvals/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ approval_ids: approvalIds }),
    });
  },
};

export default approvalAPI;
