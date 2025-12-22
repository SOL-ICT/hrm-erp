"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, X, Trash2 } from 'lucide-react';
import { purchaseRequestAPI } from '@/services/api/purchaseRequestAPI';
import { PurchaseRequestCard, StatusBadge } from '@/components/procurement-advance';
import { ReviewModal } from '@/components/procurement-advance/ReviewModal';
import { ApproveModal } from '@/components/procurement-advance/ApproveModal';
import { RejectModal } from '@/components/procurement-advance/RejectModal';
import { Button } from '@/components/ui';

export default function PurchaseRequests({ currentTheme, onBack }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  // Action modals state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async (page = 1) => {
    try {
      setLoading(true);
      // Build clean parameters object - exclude undefined values
      const params = { page };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await purchaseRequestAPI.getAll(params);
      console.log("🔍 Purchase Requests API Response:", response);
      
      // Data is in response.data.data for this endpoint (paginated)
      const dataArray = response?.data?.data || [];
      setRequests(dataArray);
      
      console.log("📊 Purchase Requests data:", { 
        count: dataArray.length, 
        hasData: !!response?.data,
        hasDataData: !!response?.data?.data
      });
      
      // Handle pagination metadata
      if (response?.data?.meta) {
        setPagination({
          currentPage: response.data.meta.current_page || 1,
          totalPages: response.data.meta.last_page || 1,
          total: response.data.meta.total || 0
        });
      } else {
        // Set basic pagination if no meta
        setPagination({
          currentPage: 1,
          totalPages: Math.ceil(dataArray.length / 15),
          total: dataArray.length
        });
      }
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleView = (request) => {
    console.log('View request:', request);
    // You can implement a detail view modal here
    alert(`Viewing request: ${request.request_code}`);
  };

  const handleReview = (request) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleCancel = async (request) => {
    const reason = prompt('Enter reason for cancellation:');
    if (!reason) return;

    try {
      setIsSubmitting(true);
      await purchaseRequestAPI.cancel(request.id, reason);
      alert('Purchase request cancelled successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Failed to cancel purchase request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (id, comments) => {
    try {
      setIsSubmitting(true);
      await purchaseRequestAPI.review(id, comments);
      alert('Purchase request reviewed successfully');
      setShowReviewModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error reviewing request:', error);
      alert('Failed to review purchase request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveSubmit = async (id, data) => {
    try {
      setIsSubmitting(true);
      await purchaseRequestAPI.approve(id, data);
      alert('Purchase request approved successfully');
      setShowApproveModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve purchase request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (id, reason) => {
    try {
      setIsSubmitting(true);
      await purchaseRequestAPI.reject(id, reason);
      alert('Purchase request rejected');
      setShowRejectModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject purchase request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // First check what properties exist in the request objects
  const filteredRequests = requests.filter(request =>
    request.request_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.priority?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Purchase Requests
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Manage and track purchase requests
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Filters */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 backdrop-blur-md shadow-lg`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
            <input
              type="text"
              placeholder="Search by PR number, description, or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center backdrop-blur-md shadow-lg col-span-full`}>
            <p className={currentTheme.textSecondary}>Loading purchase requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center backdrop-blur-md shadow-lg col-span-full`}>
            <p className={currentTheme.textSecondary}>No purchase requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <PurchaseRequestCard
              key={request.id}
              purchaseRequest={request}
              onView={handleView}
              onApprove={request.status === 'pending' ? handleReview : handleApprove}
              onReject={handleReject}
              onCancel={handleCancel}
              currentTheme={currentTheme}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 flex justify-between items-center`}>
          <div className={currentTheme.textSecondary}>
            Showing {requests.length} of {pagination.total} purchase requests
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchRequests(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className={`px-4 py-2 rounded-lg ${pagination.currentPage <= 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            <span className={`px-4 py-2 ${currentTheme.textPrimary}`}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchRequests(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className={`px-4 py-2 rounded-lg ${pagination.currentPage >= pagination.totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Purchase Request Modal */}
      {showCreateModal && (
        <CreatePurchaseRequestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRequests();
          }}
          currentTheme={currentTheme}
        />
      )}

      {/* Action Modals */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedRequest(null);
        }}
        purchaseRequest={selectedRequest}
        onSubmit={handleReviewSubmit}
        isSubmitting={isSubmitting}
      />

      <ApproveModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedRequest(null);
        }}
        purchaseRequest={selectedRequest}
        onSubmit={handleApproveSubmit}
        isSubmitting={isSubmitting}
      />

      <RejectModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRequest(null);
        }}
        purchaseRequest={selectedRequest}
        onSubmit={handleRejectSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// Create Purchase Request Modal Component
function CreatePurchaseRequestModal({ onClose, onSuccess, currentTheme }) {
  const [formData, setFormData] = useState({
    branch: '',
    priority: 'medium',
    justification: '',
    required_date: '',
    items: [
      {
        item_name: '',
        item_category: '',
        item_code: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
        justification: ''
      }
    ]
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Auto-calculate total
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(newItems[index].quantity) || 0;
      const unitPrice = field === 'unit_price' ? parseFloat(value) || 0 : parseFloat(newItems[index].unit_price) || 0;
      newItems[index].total = quantity * unitPrice;
    }

    setFormData(prev => ({ ...prev, items: newItems }));
    
    // Clear item-specific errors
    if (errors[`items.${index}.${field}`]) {
      setErrors(prev => ({ ...prev, [`items.${index}.${field}`]: '' }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_name: '',
          item_category: '',
          item_code: '',
          quantity: 1,
          unit_price: 0,
          total: 0,
          justification: ''
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      await purchaseRequestAPI.create(formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating purchase request:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(error.response?.data?.message || 'Failed to create purchase request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-md`}>
        {/* Modal Header */}
        <div className={`sticky top-0 ${currentTheme.cardBg} border-b ${currentTheme.border} px-6 py-4 flex items-center justify-between z-10`}>
          <h2 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
            New Purchase Request
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${currentTheme.textSecondary} hover:${currentTheme.textPrimary} rounded-lg hover:bg-gray-100/10 transition-colors`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                Branch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="e.g., Lagos Branch"
                required
              />
              {errors.branch && <p className="text-red-500 text-sm mt-1">{errors.branch}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              {errors.priority && <p className="text-red-500 text-sm mt-1">{errors.priority}</p>}
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                Required Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="required_date"
                value={formData.required_date}
                onChange={handleInputChange}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                className={`w-full px-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
              {errors.required_date && <p className="text-red-500 text-sm mt-1">{errors.required_date}</p>}
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                Justification
              </label>
              <textarea
                name="justification"
                value={formData.justification}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Explain why these items are needed..."
              />
              {errors.justification && <p className="text-red-500 text-sm mt-1">{errors.justification}</p>}
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
                Items <span className="text-red-500">*</span>
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className={`${currentTheme.inputBg} ${currentTheme.border} rounded-xl p-4 space-y-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${currentTheme.textPrimary}`}>Item {index + 1}</span>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className={`block text-sm ${currentTheme.textSecondary} mb-1`}>
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                      className={`w-full px-3 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="e.g., Laptop Dell Latitude 5420"
                      required
                    />
                    {errors[`items.${index}.item_name`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`items.${index}.item_name`]}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm ${currentTheme.textSecondary} mb-1`}>
                      Category
                    </label>
                    <input
                      type="text"
                      value={item.item_category}
                      onChange={(e) => handleItemChange(index, 'item_category', e.target.value)}
                      className={`w-full px-3 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="e.g., Electronics"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm ${currentTheme.textSecondary} mb-1`}>
                      Item Code
                    </label>
                    <input
                      type="text"
                      value={item.item_code}
                      onChange={(e) => handleItemChange(index, 'item_code', e.target.value)}
                      className={`w-full px-3 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="e.g., LAPTOP-001"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm ${currentTheme.textSecondary} mb-1`}>
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                      className={`w-full px-3 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm ${currentTheme.textSecondary} mb-1`}>
                      Unit Price (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm ${currentTheme.textSecondary} mb-1`}>
                      Total: ₦{item.total.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </label>
                    <div className={`px-3 py-2 ${currentTheme.inputBg} ${currentTheme.border} rounded-lg ${currentTheme.textPrimary} bg-gray-50 dark:bg-gray-800/50`}>
                      ₦{item.total.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm ${currentTheme.textSecondary} mb-1`}>
                      Justification
                    </label>
                    <textarea
                      value={item.justification}
                      onChange={(e) => handleItemChange(index, 'justification', e.target.value)}
                      rows={2}
                      className={`w-full px-3 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Why is this item needed?"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Amount Summary */}
          <div className={`${currentTheme.inputBg} ${currentTheme.border} rounded-xl p-4`}>
            <div className="flex justify-between items-center">
              <span className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
                Total Request Amount:
              </span>
              <span className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                ₦{totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Purchase Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
