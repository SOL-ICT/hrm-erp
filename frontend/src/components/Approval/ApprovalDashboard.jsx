"use client";

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  FileText,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import approvalAPI from '@/services/approvalAPI';
import ApprovalStatusBadge from './ApprovalStatusBadge';
import PendingApprovalsList from './PendingApprovalsList';
import ApprovalDetailModal from './ApprovalDetailModal';

/**
 * ApprovalDashboard Component
 * 
 * Centralized dashboard for all approval-related activities
 * Features:
 * - Statistics cards (Total Pending, Awaiting My Approval, My Submitted, Delegated)
 * - Module breakdown (Recruitment, Claims, Payroll, etc.)
 * - Different views (Pending, Submitted, Delegated, All)
 * - Quick filters and search
 */
const ApprovalDashboard = ({ currentTheme, preferences, onBack }) => {
  const { user } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState('pending'); // pending, submitted, delegated, all
  const [stats, setStats] = useState({
    totalPending: 0,
    awaitingMyApproval: 0,
    mySubmitted: 0,
    delegatedToMe: 0,
  });
  const [moduleStats, setModuleStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ========================================
  // LIFECYCLE & DATA FETCHING
  // ========================================

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all statistics in parallel
      const [statsResponse, moduleResponse, pendingResponse, submittedResponse, delegatedResponse] = await Promise.all([
        approvalAPI.getStats(),
        approvalAPI.getModuleBreakdown(),
        approvalAPI.getPending(),
        approvalAPI.getSubmitted(),
        approvalAPI.getDelegated(),
      ]);

      // Update statistics
      if (statsResponse.success) {
        setStats({
          totalPending: statsResponse.data?.total_pending || 0,
          awaitingMyApproval: pendingResponse.data?.total || 0,
          mySubmitted: submittedResponse.data?.total || 0,
          delegatedToMe: delegatedResponse.data?.total || 0,
        });
      }

      // Update module statistics
      if (moduleResponse.success) {
        setModuleStats(moduleResponse.data?.modules || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleApprovalClick = (approval) => {
    setSelectedApproval(approval);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedApproval(null);
  };

  const handleApprovalAction = async (updatedApproval) => {
    // Refresh dashboard data after approval action
    await fetchDashboardData();
    handleCloseModal();
  };

  const handleApprove = async (approval) => {
    try {
      const response = await approvalAPI.approve(approval.id, '');
      if (response.success) {
        await fetchDashboardData();
        alert('Approval successful!');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve. Please try again.');
    }
  };

  const handleReject = async (approval, reason) => {
    try {
      const response = await approvalAPI.reject(approval.id, reason, '');
      if (response.success) {
        await fetchDashboardData();
        alert('Rejection successful!');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject. Please try again.');
    }
  };

  // ========================================
  // STATISTICS CARDS
  // ========================================

  const statisticsCards = [
    {
      id: 'pending',
      title: 'Total Pending',
      value: stats.totalPending,
      icon: Clock,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgLight: 'bg-amber-50',
      description: 'All pending approvals system-wide',
    },
    {
      id: 'awaiting',
      title: 'Awaiting My Approval',
      value: stats.awaitingMyApproval,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgLight: 'bg-red-50',
      description: 'Approvals requiring your action',
      highlight: true,
    },
    {
      id: 'submitted',
      title: 'My Submitted Requests',
      value: stats.mySubmitted,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      description: 'Requests you have submitted',
    },
    {
      id: 'delegated',
      title: 'Delegated to Me',
      value: stats.delegatedToMe,
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50',
      description: 'Approvals delegated by others',
    },
  ];

  // ========================================
  // RENDER LOADING STATE
  // ========================================

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div>
          {/* Header Skeleton */}
          <div className="mb-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-3" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to modules"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Approval Center</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Manage all approval requests across modules
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statisticsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`
                  bg-white rounded-lg shadow-sm border-2 p-4 hover:shadow-md transition-all cursor-pointer
                  ${card.highlight ? 'border-red-200 ring-2 ring-red-100' : 'border-transparent'}
                `}
                onClick={() => setActiveTab(card.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${card.bgLight}`}>
                    <Icon size={20} className={card.textColor} />
                  </div>
                  {card.highlight && stats.awaitingMyApproval > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      Action Required
                    </span>
                  )}
                </div>
                
                <h3 className="text-xs font-medium text-gray-600 mb-1">
                  {card.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Module Statistics */}
        {moduleStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              <span>Module Breakdown</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {moduleStats.map((module) => (
                <div
                  key={module.module}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => {
                    // TODO: Filter by module
                    setActiveTab('all');
                  }}
                >
                  <div className="text-sm font-medium text-gray-600 mb-1 capitalize">
                    {module.module.replace('_', ' ')}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {module.count || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    pending approvals
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'pending', label: 'Pending Approvals', count: stats.awaitingMyApproval },
                { id: 'submitted', label: 'My Submissions', count: stats.mySubmitted },
                { id: 'delegated', label: 'Delegated', count: stats.delegatedToMe },
                { id: 'all', label: 'All Approvals', count: stats.totalPending },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`
                      ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                      ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <PendingApprovalsList
              activeTab={activeTab}
              onApprovalClick={handleApprovalClick}
              onApprove={handleApprove}
              onReject={handleReject}
              onRefreshData={fetchDashboardData}
            />
          </div>
        </div>
      </div>

        {/* Approval Detail Modal */}
        {showDetailModal && selectedApproval && (
          <ApprovalDetailModal
            approvalId={selectedApproval.id}
            onClose={handleCloseModal}
            onApprovalAction={handleApprovalAction}
            isOpen={showDetailModal}
          />
        )}
    </div>
  );
};

export default ApprovalDashboard;
