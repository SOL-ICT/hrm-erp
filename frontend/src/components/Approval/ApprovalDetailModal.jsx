"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  MessageCircle,
  ArrowUpCircle,
  Ban,
  Clock,
  User,
  FileText,
  AlertTriangle,
  Send,
  Loader2,
} from 'lucide-react';
import approvalAPI from '@/services/approvalAPI';
import ApprovalStatusBadge from './ApprovalStatusBadge';
import ApprovalHistoryTimeline from './ApprovalHistoryTimeline';

/**
 * ApprovalDetailModal Component
 * 
 * Displays full approval details with:
 * - Complete approval information
 * - Timeline view of approval chain
 * - Complete audit trail via ApprovalHistoryTimeline
 * - Approval/rejection form with validation
 * - Comment functionality
 * - Escalation capability
 * - Real-time status updates
 */
const ApprovalDetailModal = ({ 
  approvalId, 
  onClose, 
  onApprovalAction,
  isOpen = true 
}) => {
  // State management
  const [approval, setApproval] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // details, history

  // Action form state
  const [action, setAction] = useState(null); // 'approve', 'reject', 'comment', 'escalate'
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [escalateTo, setEscalateTo] = useState('');

  // ========================================
  // LIFECYCLE & DATA FETCHING
  // ========================================

  useEffect(() => {
    if (approvalId && isOpen) {
      fetchApprovalDetails();
      fetchApprovalHistory();
    }
  }, [approvalId, isOpen]);

  const fetchApprovalDetails = async () => {
    try {
      setLoading(true);
      const response = await approvalAPI.getById(approvalId);
      
      if (response.success) {
        setApproval(response.data);
        // Store batch data separately for easier access
        if (response.batch_data) {
          setApproval(prev => ({ ...response.data, batch_data: response.batch_data }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch approval details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalHistory = async () => {
    try {
      const response = await approvalAPI.getHistory(approvalId);
      
      if (response.success) {
        setHistory(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch approval history:', error);
    }
  };

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleAction = async (actionType) => {
    setAction(actionType);
    setComments('');
    setRejectionReason('');
    setEscalationReason('');
    setEscalateTo('');
  };

  const handleSubmitAction = async () => {
    if (!approval) return;

    try {
      setActionLoading(true);
      let response;

      switch (action) {
        case 'approve':
          response = await approvalAPI.approve(approval.id, comments);
          break;
        
        case 'reject':
          if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
          }
          response = await approvalAPI.reject(approval.id, rejectionReason, comments);
          break;
        
        case 'comment':
          if (!comments.trim()) {
            alert('Please enter a comment');
            return;
          }
          response = await approvalAPI.addComment(approval.id, comments);
          break;
        
        case 'escalate':
          if (!escalationReason.trim() || !escalateTo) {
            alert('Please provide escalation reason and select user');
            return;
          }
          response = await approvalAPI.escalate(approval.id, escalateTo, escalationReason);
          break;
        
        default:
          return;
      }

      if (response.success) {
        // Refresh data
        await fetchApprovalDetails();
        await fetchApprovalHistory();
        
        // Reset form
        setAction(null);
        setComments('');
        setRejectionReason('');
        setEscalationReason('');
        setEscalateTo('');
        
        // Notify parent
        if (onApprovalAction) {
          onApprovalAction(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to submit action:', error);
      alert('Failed to perform action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAction = () => {
    setAction(null);
    setComments('');
    setRejectionReason('');
    setEscalationReason('');
    setEscalateTo('');
  };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const canApprove = () => {
    return approval?.status === 'pending' && !approval?.is_approved;
  };

  // Don't render if not open
  if (!isOpen) return null;

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Approval Details
              </h2>
              {approval && (
                <p className="text-sm text-gray-600">
                  #{approval.id} • {approval.approvable_type?.replace('_', ' ')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              History
              {history.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                  {history.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            // Loading state
            <div className="flex items-center justify-center py-12">
              <Loader2 size={48} className="animate-spin text-blue-600" />
            </div>
          ) : !approval ? (
            // Error state
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
              <p>Failed to load approval details</p>
            </div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Status and Priority */}
                  <div className="flex items-center gap-4">
                    <ApprovalStatusBadge status={approval.status} size="lg" />
                    {approval.priority && (
                      <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${
                        approval.priority === 'high' ? 'bg-red-100 text-red-700' :
                        approval.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {approval.priority} Priority
                      </span>
                    )}
                    {approval.due_date && isOverdue(approval.due_date) && (
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        Overdue
                      </span>
                    )}
                  </div>

                  {/* Key Information */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Requester</label>
                      <div className="mt-1 flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {approval.requester?.full_name || approval.requester?.name || '-'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Current Approver</label>
                      <div className="mt-1 flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {approval.currentApprover?.full_name || approval.currentApprover?.name || '-'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Module</label>
                      <div className="mt-1 text-sm text-gray-900 capitalize">
                        {approval.module || '-'}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <div className="mt-1 text-sm text-gray-900 capitalize">
                        {approval.approvable_type?.replace('_', ' ') || '-'}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Submitted</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(approval.created_at)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Due Date</label>
                      <div className={`mt-1 flex items-center gap-2 ${isOverdue(approval.due_date) ? 'text-red-600' : ''}`}>
                        <Clock size={16} className={isOverdue(approval.due_date) ? 'text-red-600' : 'text-gray-400'} />
                        <span className="text-sm">
                          {formatDate(approval.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Progress */}
                  {approval.current_level && approval.total_levels && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        Workflow Progress
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${(approval.current_level / approval.total_levels) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          Level {approval.current_level} of {approval.total_levels}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Comments/Notes */}
                  {approval.comments && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        Comments
                      </label>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">{approval.comments}</p>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {approval.rejection_reason && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        Rejection Reason
                      </label>
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm text-red-700">{approval.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Batch Staff List */}
                  {approval.batch_data && approval.batch_data.staff_list && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">
                        Staff in this Upload Batch ({approval.batch_data.staff_count} staff)
                      </label>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Employee Code
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Recruitment Ticket
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Phone
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {approval.batch_data.staff_list.map((staff, index) => (
                                <tr key={staff.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {staff.employee_code}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {staff.first_name} {staff.last_name}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">
                                    {staff.recruitment_ticket || '-'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {staff.phone_number || '-'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      staff.boarding_approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                                      staff.boarding_approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {staff.boarding_approval_status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <ApprovalHistoryTimeline history={history} />
              )}
            </>
          )}
        </div>

        {/* Footer with Actions */}
        {approval && canApprove() && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            {!action ? (
              // Action buttons
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => handleAction('comment')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MessageCircle size={16} />
                  <span>Add Comment</span>
                </button>
                
                <button
                  onClick={() => handleAction('escalate')}
                  className="flex items-center gap-2 px-4 py-2 text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <ArrowUpCircle size={16} />
                  <span>Escalate</span>
                </button>
                
                <button
                  onClick={() => handleAction('reject')}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle size={16} />
                  <span>Reject</span>
                </button>
                
                <button
                  onClick={() => handleAction('approve')}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle size={16} />
                  <span>Approve</span>
                </button>
              </div>
            ) : (
              // Action form
              <div className="space-y-4">
                {action === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval Comments (Optional)
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                      placeholder="Add any comments about your approval..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                )}

                {action === 'reject' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        placeholder="Please provide a reason for rejection..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Comments (Optional)
                      </label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows={2}
                        placeholder="Add any additional comments..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {action === 'comment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={3}
                      placeholder="Enter your comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {action === 'escalate' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Escalate To <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={escalateTo}
                        onChange={(e) => setEscalateTo(e.target.value)}
                        placeholder="Enter user ID..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Escalation Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                        rows={3}
                        placeholder="Please provide a reason for escalation..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Form buttons */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleCancelAction}
                    disabled={actionLoading}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitAction}
                    disabled={actionLoading}
                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                      action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                      action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                      action === 'escalate' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalDetailModal;
