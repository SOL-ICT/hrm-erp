"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { advanceAPI } from '@/services/api/advanceAPI';
import { AdvanceCard, BudgetSummary } from '@/components/procurement-advance';
import { Button } from '@/components/ui';

export default function MyAdvances({ currentTheme, onBack }) {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [showNewAdvanceModal, setShowNewAdvanceModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    budget_line: '',
    purpose: '',
    justification: ''
  });

  useEffect(() => {
    fetchAdvances();
  }, [filterStatus]);

  const fetchAdvances = async (page = 1) => {
    try {
      setLoading(true);
      // Build clean parameters object - exclude undefined values
      const params = { page };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await advanceAPI.getAll(params);
      
      // Handle paginated response
      const dataArray = response?.data?.data || response?.data || [];
      setAdvances(dataArray);
      
      // Update pagination info
      if (response?.data?.current_page) {
        setPagination({
          currentPage: response.data.current_page,
          totalPages: response.data.last_page,
          total: response.data.total
        });
      }
    } catch (error) {
      console.error('Error fetching advances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdvances = advances.filter(advance =>
    advance.advance_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advance.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitAdvance = async (e) => {
    e.preventDefault();
    try {
      await advanceAPI.create(formData);
      setShowNewAdvanceModal(false);
      setFormData({ amount: '', budget_line: '', purpose: '', justification: '' });
      fetchAdvances(); // Refresh the list
      alert('Advance request submitted successfully!');
    } catch (error) {
      console.error('Error creating advance:', error);
      alert('Failed to submit advance request. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            My Advances
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Request and track your staff advances
          </p>
        </div>
        <Button 
          onClick={() => setShowNewAdvanceModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Advance Request
        </Button>
      </div>

      {/* Budget Summary */}
      <BudgetSummary currentTheme={currentTheme} />

      {/* Filters */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 backdrop-blur-md shadow-lg`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
            <input
              type="text"
              placeholder="Search advances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg`}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="disbursed">Disbursed</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Advances List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center`}>
            <p className={currentTheme.textSecondary}>Loading advances...</p>
          </div>
        ) : filteredAdvances.length === 0 ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center`}>
            <p className={currentTheme.textSecondary}>No advances found</p>
          </div>
        ) : (
          filteredAdvances.map((advance) => (
            <AdvanceCard
              key={advance.id}
              advance={advance}
              onUpdate={fetchAdvances}
              currentTheme={currentTheme}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 flex justify-between items-center`}>
          <div className={currentTheme.textSecondary}>
            Showing {advances.length} of {pagination.total} advances
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchAdvances(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className={`px-3 py-1 rounded ${
                pagination.currentPage <= 1 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              Previous
            </button>
            <span className={`px-3 py-1 ${currentTheme.textPrimary}`}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchAdvances(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className={`px-3 py-1 rounded ${
                pagination.currentPage >= pagination.totalPages 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* New Advance Request Modal */}
      {showNewAdvanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${currentTheme.cardBg} rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto`}>
            <h2 className={`text-xl font-bold ${currentTheme.textPrimary} mb-4`}>
              New Advance Request
            </h2>
            
            <form onSubmit={handleSubmitAdvance} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                  Amount Requested (₦) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className={`w-full p-3 ${currentTheme.inputBg} ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                  Budget Line *
                </label>
                <select
                  required
                  value={formData.budget_line}
                  onChange={(e) => setFormData({...formData, budget_line: e.target.value})}
                  className={`w-full p-3 ${currentTheme.inputBg} ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select Budget Line</option>
                  <option value="administrative_expenses">Administrative Expenses</option>
                  <option value="procurement">Procurement</option>
                  <option value="training_development">Training & Development</option>
                  <option value="transportation">Transportation</option>
                  <option value="communication">Communication</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                  Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  className={`w-full p-3 ${currentTheme.inputBg} ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="Brief description of the advance purpose"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                  Detailed Justification *
                </label>
                <textarea
                  required
                  value={formData.justification}
                  onChange={(e) => setFormData({...formData, justification: e.target.value})}
                  className={`w-full p-3 ${currentTheme.inputBg} ${currentTheme.border} rounded-lg focus:ring-2 focus:ring-blue-500 h-24`}
                  placeholder="Provide detailed justification for this advance request..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowNewAdvanceModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
