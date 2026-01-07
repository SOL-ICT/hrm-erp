"use client";

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import approvalAPI from '@/services/approvalAPI';
import ApprovalStatusBadge from './ApprovalStatusBadge';

/**
 * PendingApprovalsList Component
 * 
 * Displays a list of pending approvals with:
 * - Sortable columns
 * - Inline filtering (module, priority, age)
 * - Quick search
 * - Status color coding
 * - Quick action buttons (Approve/Reject/View)
 * - Pagination
 */
const PendingApprovalsList = ({ 
  activeTab = 'pending',
  onApprovalClick, 
  onApprove, 
  onReject,
  onRefreshData,
  className = '' 
}) => {
  // State management
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  // Filter state
  const [localFilters, setLocalFilters] = useState({
    search: '',
    module: '',
    priority: '',
    status: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);
  
  // Selection and bulk actions
  const [selectedApprovals, setSelectedApprovals] = useState([]);
  const [groupBy, setGroupBy] = useState('none'); // none, module, batch

  // ========================================
  // LIFECYCLE & DATA FETCHING
  // ========================================

  useEffect(() => {
    fetchApprovals();
  }, [localFilters, pagination.current_page, activeTab]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      
      let response;
      
      // Call different API endpoints based on active tab
      switch (activeTab) {
        case 'pending':
          response = await approvalAPI.getPending({
            ...localFilters,
            page: pagination.current_page,
            per_page: pagination.per_page,
          });
          break;
        case 'submitted':
          response = await approvalAPI.getSubmitted({
            ...localFilters,
            page: pagination.current_page,
            per_page: pagination.per_page,
          });
          break;
        case 'delegated':
          response = await approvalAPI.getDelegated({
            ...localFilters,
            page: pagination.current_page,
            per_page: pagination.per_page,
          });
          break;
        case 'all':
        default:
          response = await approvalAPI.getAll({
            ...localFilters,
            page: pagination.current_page,
            per_page: pagination.per_page,
          });
          break;
      }

      if (response.success) {
        setApprovals(response.data?.data || []);
        setPagination({
          current_page: response.data?.current_page || 1,
          last_page: response.data?.last_page || 1,
          per_page: response.data?.per_page || 10,
          total: response.data?.total || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleSort = (column) => {
    setLocalFilters(prev => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSearch = (e) => {
    setLocalFilters(prev => ({
      ...prev,
      search: e.target.value,
    }));
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      current_page: page,
    }));
  };

  const handleQuickApprove = async (approval) => {
    if (window.confirm(`Are you sure you want to approve this ${approval.approvable_type}?`)) {
      if (onApprove) {
        onApprove(approval);
      }
    }
  };

  const handleQuickReject = async (approval) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      if (onReject) {
        onReject(approval, reason);
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedApprovals(approvals.map(a => a.id));
    } else {
      setSelectedApprovals([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedApprovals(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedApprovals.length === 0) return;
    if (window.confirm(`Approve ${selectedApprovals.length} selected approval(s)?`)) {
      // Call bulk approve API
      try {
        const response = await approvalAPI.bulkApprove(selectedApprovals);
        if (response.success) {
          setSelectedApprovals([]);
          fetchApprovals();
          onRefreshData && onRefreshData();
          alert(`Successfully approved ${selectedApprovals.length} approval(s)`);
        }
      } catch (error) {
        console.error('Bulk approve failed:', error);
        alert('Failed to approve. Please try again.');
      }
    }
  };

  const handleBulkReject = async () => {
    if (selectedApprovals.length === 0) return;
    const reason = window.prompt(`Provide rejection reason for ${selectedApprovals.length} approval(s):`);
    if (reason) {
      try {
        const response = await approvalAPI.bulkReject(selectedApprovals, reason);
        if (response.success) {
          setSelectedApprovals([]);
          fetchApprovals();
          onRefreshData && onRefreshData();
          alert(`Successfully rejected ${selectedApprovals.length} approval(s)`);
        }
      } catch (error) {
        console.error('Bulk reject failed:', error);
        alert('Failed to reject. Please try again.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedApprovals.length === 0) return;
    if (window.confirm(`Delete ${selectedApprovals.length} approval request(s)? This cannot be undone and will allow re-upload.`)) {
      try {
        const response = await approvalAPI.bulkDelete(selectedApprovals);
        if (response.success) {
          setSelectedApprovals([]);
          fetchApprovals();
          onRefreshData && onRefreshData();
          alert(`Successfully deleted ${selectedApprovals.length} approval(s)`);
        }
      } catch (error) {
        console.error('Bulk delete failed:', error);
        alert('Failed to delete. Please try again.');
      }
    }
  };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAge = (createdAt) => {
    if (!createdAt) return '-';
    const now = new Date();
    const created = new Date(createdAt);
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    return `${Math.floor(diffDays / 30)} months`;
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50',
    };
    return colors[priority?.toLowerCase()] || 'text-gray-600 bg-gray-50';
  };

  // ========================================
  // RENDER FUNCTIONS
  // ========================================

  const renderSortIcon = (column) => {
    if (localFilters.sort_by !== column) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return localFilters.sort_order === 'asc' 
      ? <ChevronUp size={14} /> 
      : <ChevronDown size={14} />;
  };

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header with Search and Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search approvals..."
              value={localFilters.search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={18} />
            <span>Filters</span>
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module
              </label>
              <select
                value={localFilters.module}
                onChange={(e) => handleFilterChange('module', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Modules</option>
                <option value="recruitment">Recruitment</option>
                <option value="claims">Claims</option>
                <option value="payroll">Payroll</option>
                <option value="procurement">Procurement</option>
                <option value="requisition">Requisition</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={localFilters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={localFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="escalated">Escalated</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedApprovals.length > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            {selectedApprovals.length} approval(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Bulk Approve
            </button>
            <button
              onClick={handleBulkReject}
              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
            >
              <XCircle size={16} />
              Bulk Reject
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedApprovals([])}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedApprovals.length === approvals.length && approvals.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </th>
              <th
                onClick={() => handleSort('id')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  ID {renderSortIcon('id')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Requester
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Request Date
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-6 bg-gray-200 rounded w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-6 bg-gray-200 rounded w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-8 bg-gray-200 rounded w-32" />
                  </td>
                </tr>
              ))
            ) : approvals.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center">
                  <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">No approvals found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your filters or search query
                  </p>
                </td>
              </tr>
            ) : (
              // Approval rows
              approvals.map((approval) => (
                <tr
                  key={approval.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedApprovals.includes(approval.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedApprovals.includes(approval.id)}
                      onChange={() => handleSelectOne(approval.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td 
                    className="px-4 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => onApprovalClick && onApprovalClick(approval)}
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        #{approval.id}
                      </span>
                      <div className="text-xs text-gray-500">
                        {approval.approvable_type?.replace('App\\Models\\', '').replace('_', ' ')}
                      </div>
                    </div>
                  </td>
                  <td 
                    className="px-4 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => onApprovalClick && onApprovalClick(approval)}
                  >
                    <div className="text-sm text-gray-900">
                      {approval.requester?.full_name || approval.requester?.name || '-'}
                    </div>
                  </td>
                  <td 
                    className="px-4 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => onApprovalClick && onApprovalClick(approval)}
                  >
                    <ApprovalStatusBadge status={approval.status} size="sm" />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {formatDate(approval.created_at || approval.requested_at)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprovalClick && onApprovalClick(approval);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      {approval.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickApprove(approval);
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickReject(approval);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {[...Array(pagination.last_page)].map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === pagination.last_page ||
                (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border rounded transition-colors ${
                      page === pagination.current_page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === pagination.current_page - 2 || page === pagination.current_page + 2) {
                return <span key={page} className="px-2 text-gray-400">...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsList;
