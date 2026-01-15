import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Check, X, Clock, 
  Calendar, User, Building2, FileText, TrendingUp,
  AlertCircle, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { useSessionAware } from '@/hooks/useSessionAware';

export default function LeaveApproval() {
  const { makeRequestWithRetry } = useSessionAware();
  
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter options
  const [clients, setClients] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  
  // Statistics
  const [statistics, setStatistics] = useState(null);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leaves, statusFilter, clientFilter, leaveTypeFilter, searchQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [leavesData, clientsData, typesData, statsData] = await Promise.all([
        makeRequestWithRetry('/admin/leave-approvals', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        }),
        makeRequestWithRetry('/admin/leave-approvals/clients', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        }),
        makeRequestWithRetry('/admin/leave-approvals/types', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        }),
        makeRequestWithRetry('/admin/leave-approvals/statistics', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        })
      ]);

      setLeaves(leavesData);
      setClients(clientsData);
      setLeaveTypes(typesData);
      setStatistics(statsData);
      
    } catch (err) {
      setError('Failed to load leave data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leaves];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(l => l.client_id == clientFilter);
    }

    // Leave type filter
    if (leaveTypeFilter) {
      filtered = filtered.filter(l => l.leave_type_id == leaveTypeFilter);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.staff_name.toLowerCase().includes(query) ||
        l.staff_number.toLowerCase().includes(query)
      );
    }

    setFilteredLeaves(filtered);
  };

  const handleApprove = (leave) => {
    setSelectedLeave(leave);
    setShowApproveModal(true);
  };

  const handleViewDetails = (leave) => {
    setSelectedLeave(leave);
    setShowDetailsModal(true);
  };

  const confirmApprove = async () => {
    setIsProcessing(true);
    try {
      await makeRequestWithRetry('/sanctum/csrf-cookie', { credentials: 'include' });
      
      await makeRequestWithRetry(`/admin/leave-approvals/${selectedLeave.id}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      // Refresh data
      await fetchData();
      setShowApproveModal(false);
      setSelectedLeave(null);
      alert('Leave approved successfully! Email sent to staff.');
      
    } catch (err) {
      alert('Failed to approve leave: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = (leave) => {
    setSelectedLeave(leave);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const confirmReject = async () => {
    if (!rejectionReason || rejectionReason.length < 10) {
      alert('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    setIsProcessing(true);
    try {
      await makeRequestWithRetry('/sanctum/csrf-cookie', { credentials: 'include' });
      
      await makeRequestWithRetry(`/admin/leave-approvals/${selectedLeave.id}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      // Refresh data
      await fetchData();
      setShowRejectModal(false);
      setSelectedLeave(null);
      setRejectionReason('');
      alert('Leave rejected successfully');
      
    } catch (err) {
      alert('Failed to reject leave: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <Clock size={14} /> Pending
      </span>,
      approved: <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle size={14} /> Approved
      </span>,
      rejected: <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1">
        <XCircle size={14} /> Rejected
      </span>
    };
    return badges[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Approve, reject and manage staff leave applications</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.summary.total}</p>
              </div>
              <FileText className="text-blue-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.summary.pending}</p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.summary.approved}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.summary.rejected}</p>
              </div>
              <XCircle className="text-red-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Total Days</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.summary.total_days}</p>
              </div>
              <TrendingUp className="text-purple-500" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Filter size={20} />
          <span>Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search staff name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>

          {/* Leave Type Filter */}
          <select
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Leave Types</option>
            {leaveTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leave Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Link</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <AlertCircle className="mx-auto mb-2" size={40} />
                    <p>No leave applications found</p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="text-gray-400 mr-2" size={18} />
                        <div>
                          <div className="font-medium text-gray-900">{leave.staff_name}</div>
                          <div className="text-sm text-gray-500">{leave.staff_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building2 className="text-gray-400 mr-2" size={16} />
                        {leave.client_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{leave.leave_type}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{leave.days} day(s)</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{formatDate(leave.start_date)}</div>
                      <div className="text-xs text-gray-500">to {formatDate(leave.end_date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="px-6 py-4">
                      {leave.approval_token ? (
                        <a
                          href={`/leave-approval/${leave.approval_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1"
                        >
                          <FileText size={14} />
                          View Page
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No token</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(leave)}
                        className="text-blue-600 hover:text-blue-800 text-sm underline mb-2 w-full text-left"
                      >
                        View Details
                      </button>
                      {leave.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(leave)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(leave)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            <X size={16} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {leave.status === 'approved' ? 'Processed' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Approve Leave Application</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to approve <strong>{selectedLeave.staff_name}</strong>'s leave application for <strong>{selectedLeave.days} day(s)</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              A leave advice PDF will be automatically generated and emailed to the staff member.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={isProcessing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                {isProcessing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Leave Application</h3>
            <p className="text-gray-600 mb-4">
              Provide a reason for rejecting <strong>{selectedLeave.staff_name}</strong>'s leave request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter detailed reason (minimum 10 characters)..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />}
                {isProcessing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-blue-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Leave Application Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:text-blue-100 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Staff Information */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Staff Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedLeave.staff_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Staff ID</p>
                    <p className="text-sm font-medium text-gray-900">{selectedLeave.staff_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{selectedLeave.staff_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{selectedLeave.phone_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Leave Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Leave Type</p>
                    <p className="text-sm font-medium text-gray-900">{selectedLeave.leave_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium text-gray-900">{selectedLeave.days} day(s)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedLeave.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedLeave.end_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reason</p>
                    <p className="text-sm text-gray-900 col-span-2">{selectedLeave.reason}</p>
                  </div>
                </div>
              </div>

              {/* Supervisor Information */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Supervisor Information</h4>
                <div>
                  <p className="text-xs text-gray-500">Approval Link Sent To</p>
                  <p className="text-sm font-medium text-gray-900">{selectedLeave.supervisor_email_sent || 'N/A'}</p>
                </div>
              </div>

              {/* Approval/Rejection Information */}
              {selectedLeave.status !== 'pending' && (
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {selectedLeave.status === 'approved' ? 'Approval Details' : 'Rejection Details'}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedLeave.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Approval Method</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {selectedLeave.approval_method === 'email_link' ? 'Email Link' : 'Admin Dashboard'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date & Time</p>
                      <p className="text-sm text-gray-900">
                        {selectedLeave.approved_at ? new Date(selectedLeave.approved_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    {selectedLeave.approved_by_admin_id && (
                      <div>
                        <p className="text-xs text-gray-500">Approved By (Admin)</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLeave.admin_approval_name || 'N/A'}</p>
                      </div>
                    )}
                    {selectedLeave.approval_ip_address && (
                      <div>
                        <p className="text-xs text-gray-500">IP Address</p>
                        <p className="text-sm font-mono text-gray-900">{selectedLeave.approval_ip_address}</p>
                      </div>
                    )}
                    {selectedLeave.approval_user_agent && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Device/Browser Information</p>
                        <p className="text-xs text-gray-600 break-words">{selectedLeave.approval_user_agent}</p>
                      </div>
                    )}
                    {selectedLeave.approver_comments && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Comments</p>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedLeave.approver_comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Application Metadata */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Application Metadata</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Application ID</p>
                    <p className="text-sm font-mono text-gray-900">{selectedLeave.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Client</p>
                    <p className="text-sm text-gray-900">{selectedLeave.client_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Applied On</p>
                    <p className="text-sm text-gray-900">{new Date(selectedLeave.applied_at).toLocaleString()}</p>
                  </div>
                  {selectedLeave.approval_token && (
                    <div>
                      <p className="text-xs text-gray-500">Approval Token</p>
                      <p className="text-xs font-mono text-gray-600 truncate">{selectedLeave.approval_token}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
