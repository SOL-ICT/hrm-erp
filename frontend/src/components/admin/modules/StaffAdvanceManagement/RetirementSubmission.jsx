"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus, MessageSquare, XCircle, Trash2 } from 'lucide-react';
import { retirementAPI } from '@/services/api/retirementAPI';
import { advanceAPI } from '@/services/api/advanceAPI';
import { RetirementCard } from '@/components/procurement-advance';
import { Button } from '@/components/ui';

export default function RetirementSubmission({ currentTheme, onBack }) {
  const [retirements, setRetirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('actions'); // 'actions' or 'approvals'
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchRetirements(1, false); // Reset to page 1 when filters change
  }, [filterStatus]);

  const fetchRetirements = async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      
      // Build clean parameters object - exclude undefined values
      const params = { page, per_page: 15 };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await retirementAPI.getAll(params);
      
      // Handle different response structures
      let newRetirements, paginationData;
      if (response?.data?.data && Array.isArray(response.data.data)) {
        // Paginated response
        newRetirements = response.data.data;
        paginationData = {
          current_page: response.data.current_page || page,
          last_page: response.data.last_page || 1,
          per_page: response.data.per_page || 15,
          total: response.data.total || newRetirements.length
        };
      } else if (Array.isArray(response?.data)) {
        // Direct array response
        newRetirements = response.data;
        paginationData = {
          current_page: 1,
          last_page: 1,
          per_page: newRetirements.length,
          total: newRetirements.length
        };
      } else {
        newRetirements = [];
        paginationData = { current_page: 1, last_page: 1, per_page: 15, total: 0 };
      }
      
      if (append && page > 1) {
        setRetirements(prev => [...prev, ...newRetirements]);
      } else {
        setRetirements(newRetirements);
      }
      
      setPagination(paginationData);
      
    } catch (error) {
      console.error('Error fetching retirements:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filteredRetirements = retirements.filter(retirement =>
    retirement.retirement_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    retirement.advance?.advance_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    retirement.advance?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (retirement) => {
    try {
      await retirementAPI.approve(retirement.id, { 
        review_comments: 'Approved via admin panel' 
      });
      fetchRetirements(1, false); // Refresh data from page 1
    } catch (error) {
      console.error('Error approving retirement:', error);
      alert('Failed to approve retirement. Please try again.');
    }
  };

  const handleReject = async (retirement) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      await retirementAPI.reject(retirement.id, { 
        rejection_reason: reason 
      });
      fetchRetirements(1, false); // Refresh data from page 1
    } catch (error) {
      console.error('Error rejecting retirement:', error);
      alert('Failed to reject retirement. Please try again.');
    }
  };

  const handleQuery = async (retirement) => {
    const query = prompt('Please provide your query or request for clarification:');
    if (!query) return;
    
    try {
      await retirementAPI.query(retirement.id, { 
        query_reason: query 
      });
      fetchRetirements(1, false); // Refresh data from page 1
    } catch (error) {
      console.error('Error querying retirement:', error);
      alert('Failed to send query. Please try again.');
    }
  };

  const handleQueryResponse = async (retirement) => {
    try {
      const response = prompt('Enter your response to the query:', '');
      if (response) {
        await retirementAPI.respondToQuery(retirement.id, { 
          query_response: response 
        });
        fetchRetirements(1, false); // Refresh data from page 1
      }
    } catch (error) {
      console.error('Error responding to query:', error);
      alert('Failed to submit response. Please try again.');
    }
  };

  const handleView = (retirement) => {
    // For now, just show details in alert - can be enhanced with modal later
    alert(`Retirement Details:\n\nCode: ${retirement.retirement_code || 'N/A'}\nAdvance: ${retirement.advance?.advance_code}\nAmount Spent: ${retirement.actual_amount_spent}\nStatus: ${retirement.status}`);
  };

  const handleNewRetirementSubmit = async (formData) => {
    try {
      setLoading(true);
      await retirementAPI.submit(formData);
      setShowNewRetirementModal(false);
      fetchRetirements(1, false); // Refresh the list
      alert('Retirement submitted successfully!');
    } catch (error) {
      console.error('Error submitting retirement:', error);
      alert('Failed to submit retirement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                Retirement Management
              </h1>
              <p className="mt-2 text-lg font-medium text-white/90">
                Complete lifecycle management for advance retirements
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-3">
                <FileText className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Modern Glass Morphism */}
      <div className="relative">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-white/20">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'actions'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-500/25'
                  : 'text-gray-600 hover:bg-white/60 hover:text-gray-800'
              }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-bold">Actions</div>
                <div className="text-xs opacity-75">Create & Respond</div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'approvals'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-2xl shadow-purple-500/25'
                  : 'text-gray-600 hover:bg-white/60 hover:text-gray-800'
              }`}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-bold">Approvals</div>
                <div className="text-xs opacity-75">Review & Approve</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'actions' ? (
        <RetirementActionsTab 
          currentTheme={currentTheme} 
          retirements={retirements}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          fetchRetirements={fetchRetirements}
          handleQueryResponse={handleQueryResponse}
          handleView={handleView}
          pagination={pagination}
          setPagination={setPagination}
          loadingMore={loadingMore}
          handleNewRetirementSubmit={handleNewRetirementSubmit}
        />
      ) : (
        <RetirementApprovalsTab
          currentTheme={currentTheme}
          retirements={retirements}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          fetchRetirements={fetchRetirements}
          handleApprove={handleApprove}
          handleReject={handleReject}
          handleQuery={handleQuery}
          handleView={handleView}
          pagination={pagination}
          setPagination={setPagination}
          loadingMore={loadingMore}
        />
      )}

    </div>
  );
}

// Retirement Actions Tab - For creating retirements and responding to queries
const RetirementActionsTab = ({ 
  currentTheme, 
  retirements, 
  loading, 
  searchTerm, 
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  fetchRetirements,
  handleQueryResponse,
  handleView,
  pagination,
  setPagination,
  loadingMore,
  handleNewRetirementSubmit
}) => {
  const [showNewRetirementModal, setShowNewRetirementModal] = useState(false);
  // Filter for user's own retirements and those with queries
  const filteredRetirements = retirements.filter(retirement => {
    const matchesSearch = retirement.retirement_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      retirement.advance?.advance_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      retirement.advance?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || retirement.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Action Header - Modern Cards Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Action Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-green-100 p-2 rounded-xl">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-800">
                  Retirement Actions
                </h3>
              </div>
              <p className="text-green-700 font-medium">
                Create new retirements and respond to administrative queries
              </p>
            </div>
            <Button 
              onClick={() => setShowNewRetirementModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Retirement
            </Button>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white border border-gray-200/50 rounded-2xl p-6 shadow-lg">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-800 text-lg">Quick Actions</h4>
            <p className="text-gray-600 text-sm mt-1">Manage your submissions</p>
          </div>
        </div>
      </div>

      {/* Advanced Filters - Modern Design */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search Retirements
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code, advance, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/70 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 font-medium text-gray-800 placeholder-gray-500 transition-all"
              />
            </div>
          </div>
          <div className="lg:w-64">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-4 bg-white/70 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 font-medium text-gray-800 transition-all"
            >
              <option value="all">🔍 All Status</option>
              <option value="pending">⏳ Pending Review</option>
              <option value="submitted">📝 Submitted (Ready for Review)</option>
              <option value="queried">❓ Awaiting Response (Queried)</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Retirements List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center`}>
            <p className={currentTheme.textSecondary}>Loading retirements...</p>
          </div>
        ) : filteredRetirements.length === 0 ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center`}>
            <p className={currentTheme.textSecondary}>No retirements found</p>
          </div>
        ) : (
          filteredRetirements.map((retirement) => (
            <RetirementCard
              key={retirement.id}
              retirement={retirement}
              onUpdate={fetchRetirements}
              onQueryResponse={handleQueryResponse}
              onView={handleView}
              currentTheme={currentTheme}
              showActions={true} // Show user actions
              variant="user-actions" // Special variant for user actions
            />
          ))
        )}
      </div>

      {/* Load More Button */}
      {pagination.current_page < pagination.last_page && (
        <div className="text-center mt-6">
          <button
            onClick={() => fetchRetirements(pagination.current_page + 1, true)}
            disabled={loadingMore}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                Loading...
              </>
            ) : (
              <>Load More ({pagination.total - retirements.length} remaining)</>
            )}
          </button>
        </div>
      )}

      {/* Pagination Info */}
      {pagination.total > 0 && (
        <div className="text-center mt-4 text-sm text-gray-600">
          Showing {retirements.length} of {pagination.total} retirements
        </div>
      )}

      {/* New Retirement Modal */}
      {showNewRetirementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Create New Retirement</h3>
                <button 
                  onClick={() => setShowNewRetirementModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <NewRetirementForm 
              onClose={() => setShowNewRetirementModal(false)}
              onSubmit={handleNewRetirementSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Retirement Approvals Tab - For admin approvals, rejections, and queries
const RetirementApprovalsTab = ({ 
  currentTheme, 
  retirements, 
  loading, 
  searchTerm, 
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  fetchRetirements,
  handleApprove,
  handleReject,
  handleQuery,
  handleView,
  pagination,
  setPagination,
  loadingMore
}) => {
  // Filter for retirements that need approval actions
  const filteredRetirements = retirements.filter(retirement => {
    const matchesSearch = retirement.retirement_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      retirement.advance?.advance_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      retirement.advance?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || retirement.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Approval Header - Modern Dashboard Style */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Header Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-2xl">
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-purple-800">
                Retirement Approvals
              </h3>
              <p className="text-purple-700 font-medium mt-1">
                Review, approve, reject, and query submissions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="bg-white border border-gray-200/50 rounded-2xl p-4 shadow-lg text-center">
          <div className="bg-yellow-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-yellow-600 font-bold text-lg">⏳</span>
          </div>
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-xl font-bold text-gray-800">{retirements.filter(r => r.status === 'pending').length}</div>
        </div>

        <div className="bg-white border border-gray-200/50 rounded-2xl p-4 shadow-lg text-center">
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-blue-600 font-bold text-lg">📝</span>
          </div>
          <div className="text-sm text-gray-600">Need Review</div>
          <div className="text-xl font-bold text-gray-800">{retirements.filter(r => ['pending', 'submitted', 'queried'].includes(r.status)).length}</div>
        </div>
      </div>

      {/* Advanced Filters - Approval Focus */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search for Approval
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search retirements requiring approval..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/70 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 font-medium text-gray-800 placeholder-gray-500 transition-all"
              />
            </div>
          </div>
          <div className="lg:w-64">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Approval Queue
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-4 bg-white/70 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 font-medium text-gray-800 transition-all"
            >
              <option value="all">🎯 All Actionable</option>
              <option value="pending">⏳ Pending Review</option>
              <option value="submitted">📝 Submitted</option>
              <option value="queried">❓ Awaiting Response</option>
            </select>
          </div>
        </div>
      </div>

      {/* Retirements List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center`}>
            <p className={currentTheme.textSecondary}>Loading retirements...</p>
          </div>
        ) : filteredRetirements.length === 0 ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center`}>
            <p className={currentTheme.textSecondary}>No retirements pending approval</p>
          </div>
        ) : (
          filteredRetirements.map((retirement) => (
            <RetirementCard
              key={retirement.id}
              retirement={retirement}
              onUpdate={fetchRetirements}
              onApprove={handleApprove}
              onReject={handleReject}
              onQuery={handleQuery}
              onView={handleView}
              currentTheme={currentTheme}
              showActions={true} // Show approval actions
              variant="admin-approvals" // Special variant for admin approvals
            />
          ))
        )}
      </div>

      {/* Load More Button - Approvals */}
      {pagination.current_page < pagination.last_page && (
        <div className="text-center mt-6">
          <button
            onClick={() => fetchRetirements(pagination.current_page + 1, true)}
            disabled={loadingMore}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium px-6 py-3 rounded-xl shadow-lg transition-all duration-200"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                Loading...
              </>
            ) : (
              <>Load More ({pagination.total - retirements.length} remaining)</>
            )}
          </button>
        </div>
      )}

      {/* Pagination Info - Approvals */}
      {pagination.total > 0 && (
        <div className="text-center mt-4 text-sm text-gray-600">
          Showing {retirements.length} of {pagination.total} retirements
        </div>
      )}
    </div>
  );
};

// New Retirement Form Component
const NewRetirementForm = ({ onClose, onSubmit }) => {
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [availableAdvances, setAvailableAdvances] = useState([]);
  const [retirementItems, setRetirementItems] = useState([{ description: '', amount: '', receipt_number: '', receipt_date: '' }]);
  const [actualAmountSpent, setActualAmountSpent] = useState(0);
  const [balanceToReturn, setBalanceToReturn] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableAdvances();
  }, []);

  useEffect(() => {
    if (selectedAdvance && retirementItems.length > 0) {
      const totalSpent = retirementItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      setActualAmountSpent(totalSpent);
      setBalanceToReturn(Math.max(0, (selectedAdvance.amount || 0) - totalSpent));
    }
  }, [selectedAdvance, retirementItems]);

  const fetchAvailableAdvances = async () => {
    try {
      const response = await advanceAPI.getMyAdvances({ status: 'disbursed' });
      setAvailableAdvances(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching advances:', error);
      setAvailableAdvances([]);
    } finally {
      setLoading(false);
    }
  };

  const addRetirementItem = () => {
    setRetirementItems([...retirementItems, { description: '', amount: '', receipt_number: '', receipt_date: '' }]);
  };

  const removeRetirementItem = (index) => {
    if (retirementItems.length > 1) {
      const newItems = retirementItems.filter((_, i) => i !== index);
      setRetirementItems(newItems);
    }
  };

  const updateRetirementItem = (index, field, value) => {
    const newItems = [...retirementItems];
    newItems[index][field] = value;
    setRetirementItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAdvance) {
      alert('Please select an advance to retire');
      return;
    }

    const validItems = retirementItems.filter(item => item.description.trim() && item.amount);
    if (validItems.length === 0) {
      alert('Please add at least one retirement item');
      return;
    }

    const formData = {
      advance_id: selectedAdvance.id,
      actual_amount_spent: actualAmountSpent,
      balance_to_return: balanceToReturn,
      retirement_items: validItems.map(item => ({
        description: item.description,
        amount: parseFloat(item.amount),
        receipt_number: item.receipt_number || null,
        receipt_date: item.receipt_date || null
      }))
    };

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading available advances...</p>
        </div>
      ) : (
        <>
          {/* Select Advance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Advance to Retire *
            </label>
            <select
              value={selectedAdvance?.id || ''}
              onChange={(e) => {
                const advance = availableAdvances.find(adv => adv.id === parseInt(e.target.value));
                setSelectedAdvance(advance);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Choose an advance...</option>
              {availableAdvances.map(advance => (
                <option key={advance.id} value={advance.id}>
                  {advance.advance_code} - ₦{advance.amount?.toLocaleString()} ({advance.purpose})
                </option>
              ))}
            </select>
          </div>

          {selectedAdvance && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Selected Advance Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Code:</span> {selectedAdvance.advance_code}
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Amount:</span> ₦{selectedAdvance.amount?.toLocaleString()}
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Purpose:</span> {selectedAdvance.purpose}
                </div>
              </div>
            </div>
          )}

          {/* Retirement Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Retirement Items *
              </label>
              <button
                type="button"
                onClick={addRetirementItem}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              >
                + Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {retirementItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-800">Item #{index + 1}</h5>
                    {retirementItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRetirementItem(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Description of expense"
                        value={item.description}
                        onChange={(e) => updateRetirementItem(index, 'description', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount (₦)"
                        value={item.amount}
                        onChange={(e) => updateRetirementItem(index, 'amount', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Receipt Number (optional)"
                        value={item.receipt_number}
                        onChange={(e) => updateRetirementItem(index, 'receipt_number', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        placeholder="Receipt Date (optional)"
                        value={item.receipt_date}
                        onChange={(e) => updateRetirementItem(index, 'receipt_date', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {selectedAdvance && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Retirement Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center bg-blue-100 p-3 rounded-lg">
                  <p className="text-blue-600 font-medium">Advance Amount</p>
                  <p className="text-lg font-bold text-blue-900">₦{selectedAdvance.amount?.toLocaleString()}</p>
                </div>
                <div className="text-center bg-green-100 p-3 rounded-lg">
                  <p className="text-green-600 font-medium">Total Spent</p>
                  <p className="text-lg font-bold text-green-900">₦{actualAmountSpent.toLocaleString()}</p>
                </div>
                <div className="text-center bg-orange-100 p-3 rounded-lg">
                  <p className="text-orange-600 font-medium">Balance to Return</p>
                  <p className="text-lg font-bold text-orange-900">₦{balanceToReturn.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button 
          type="button"
          onClick={onClose}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit"
          disabled={loading || !selectedAdvance}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Submit Retirement
        </button>
      </div>
    </form>
  );
};


