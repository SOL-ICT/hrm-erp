"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search } from 'lucide-react';
import { advanceAPI } from '@/services/api/advanceAPI';
import { AdvanceCard } from '@/components/procurement-advance';

export default function AdvanceApprovals({ currentTheme, onBack }) {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchAdvances();
  }, [activeTab]);

  const fetchAdvances = async (page = 1) => {
    try {
      setLoading(true);
      
      let response;
      if (activeTab === 'pending') {
        response = await advanceAPI.getPendingApprovals();
      } else {
        // For approved/rejected, use getAll with status filter
        response = await advanceAPI.getAll({ status: activeTab });
      }
      
      console.log("🔍 AdvanceApprovals API Response:", response, "Tab:", activeTab);
      
      // Handle different response structures
      let dataArray;
      if (Array.isArray(response?.data)) {
        dataArray = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        dataArray = response.data.data;
      } else {
        dataArray = [];
      }
      
      console.log("📊 Advances data:", { 
        count: dataArray.length, 
        activeTab,
        sampleAdvance: dataArray[0]
      });
      
      setAdvances(dataArray);
      
      // No pagination from backend, set up basic pagination
      setPagination({
        currentPage: 1,
        totalPages: 1,
        total: dataArray.length
      });
    } catch (error) {
      console.error('Error fetching advances for approval:', error);
      setAdvances([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdvances = advances.filter(advance =>
    advance.advance_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advance.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advance.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (advance) => {
    try {
      await advanceAPI.approve(advance.id, { 
        approval_comments: 'Approved via admin panel' 
      });
      fetchAdvances(); // Refresh data
    } catch (error) {
      console.error('Error approving advance:', error);
      alert('Failed to approve advance. Please try again.');
    }
  };

  const handleReject = async (advance) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      await advanceAPI.reject(advance.id, { 
        rejection_reason: reason 
      });
      fetchAdvances(); // Refresh data
    } catch (error) {
      console.error('Error rejecting advance:', error);
      alert('Failed to reject advance. Please try again.');
    }
  };
  


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Advance Approvals
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Review and approve staff advance requests
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl backdrop-blur-md shadow-lg overflow-hidden`}>
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {['pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : `${currentTheme.textSecondary} hover:bg-gray-50 dark:hover:bg-slate-800/50`
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 backdrop-blur-md shadow-lg`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
          <input
            type="text"
            placeholder="Search advances..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>

      {/* Advances List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center col-span-full`}>
            <p className={currentTheme.textSecondary}>Loading advances...</p>
          </div>
        ) : filteredAdvances.length === 0 ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center col-span-full`}>
            <p className={currentTheme.textSecondary}>No advances to approve</p>
          </div>
        ) : (
          filteredAdvances.map((advance) => (
            <AdvanceCard
              key={advance.id}
              advance={advance}
              onUpdate={fetchAdvances}
              currentTheme={currentTheme}
              onApprove={activeTab === 'pending' ? handleApprove : null}
              onReject={activeTab === 'pending' ? handleReject : null}
              showActions={true}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 flex justify-between items-center`}>
          <div className={currentTheme.textSecondary}>
            Showing {advances.length} of {pagination.total} advances
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchAdvances(pagination.currentPage - 1)}
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
              onClick={() => fetchAdvances(pagination.currentPage + 1)}
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
    </div>
  );
}
