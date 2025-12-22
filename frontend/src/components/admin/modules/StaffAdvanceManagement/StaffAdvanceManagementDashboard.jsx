"use client";

import { useEffect, useState } from 'react';
import { advanceAPI } from '@/services/api/advanceAPI';
import { budgetAPI } from '@/services/api/budgetAPI';
import { retirementAPI } from '@/services/api/retirementAPI';

const StaffAdvanceManagementDashboard = ({ currentTheme, preferences, onModuleChange }) => {
  const [stats, setStats] = useState({
    advances: { total: 0, pending: 0, approved: 0, disbursed: 0, retired: 0, overdue: 0 },
    budgets: { total: 0, total_allocated: 0, total_utilized: 0 },
    retirements: { total: 0, pending: 0, approved: 0, rejected: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [advStats, budStats, retStats] = await Promise.all([
        advanceAPI.getStatistics().catch(() => ({ total: 0, pending: 0, approved: 0, disbursed: 0, retired: 0, overdue: 0 })),
        budgetAPI.getStatistics().catch(() => ({ total: 0, total_allocated: 0, total_utilized: 0 })),
        retirementAPI.getStatistics().catch(() => ({ total: 0, pending: 0, approved: 0, rejected: 0 }))
      ]);
      setStats({
        advances: advStats?.data || advStats || { total: 0, pending: 0, approved: 0, disbursed: 0, retired: 0, overdue: 0 },
        budgets: budStats?.data || budStats || { total: 0, total_allocated: 0, total_utilized: 0 },
        retirements: retStats?.data || retStats || { total: 0, pending: 0, approved: 0, rejected: 0 }
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Staff Advance Management
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Cash advances and retirement management system
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Total Advances</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.advances.total || 0}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Pending Approval</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.advances.pending || 0}
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Disbursed</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.advances.disbursed || 0}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Overdue</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.advances.overdue || 0}
              </p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Budget Allocated</p>
              <p className={`text-xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : formatCurrency(stats.budgets.total_allocated || 0)}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Module Description */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 backdrop-blur-md shadow-lg`}>
        <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-4`}>
          Staff Advance Management System
        </h2>
        <p className={`${currentTheme.textSecondary} mb-6 leading-relaxed`}>
          Comprehensive staff advance workflow with 4-tier approval process (Regional → Zonal → Admin → Finance), 
          disbursement tracking, retirement submission, compliance review, and budget allocation management.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">💵</span>
              My Advances
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              All staff can request cash advances for operational expenses, track request status through 
              the approval pipeline, and view advance history.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Create advance requests</li>
              <li>Link to budget allocations</li>
              <li>Real-time status tracking</li>
              <li>Advance history</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">✅</span>
              Advance Approvals
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              4-tier approval workflow: Regional Officer (Level 1) → Zonal Officer (Level 2) → 
              Admin Officer (Level 3) → Finance Director (Final Approval).
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Multi-level approval process</li>
              <li>Approve/Reject with comments</li>
              <li>Auto-routing to next level</li>
              <li>Approval history tracking</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">💸</span>
              Disbursement
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Accounts Officer processes approved advances for disbursement, records payment details, 
              tracks disbursement dates, and manages payment methods.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Process disbursements</li>
              <li>Payment method tracking</li>
              <li>Disbursement date records</li>
              <li>Auto-trigger retirement deadline</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">📝</span>
              Retirement Submission
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Staff submit retirement details with receipts for disbursed advances. System tracks expenses, 
              calculates balances, and flags overdue retirements (&gt;2 weeks).
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Submit retirement details</li>
              <li>Upload receipt attachments</li>
              <li>Auto-calculate balance</li>
              <li>Overdue tracking</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">🔍</span>
              Compliance Review
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Risk Management Officer reviews retirements for compliance, validates expenses against 
              policies, approves/rejects/queries retirements, and ensures proper documentation.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Review retirement submissions</li>
              <li>Validate against policies</li>
              <li>Query with explanations</li>
              <li>Compliance tracking</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">📊</span>
              Budget Allocation
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Finance Director manages budget allocations for departments/staff, tracks utilization rates, 
              monitors remaining balances, and ensures fiscal compliance.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Create budget allocations</li>
              <li>Assign to users/departments</li>
              <li>Real-time utilization tracking</li>
              <li>Budget vs. actual reporting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
        <h3 className={`text-xl font-semibold ${currentTheme.textPrimary} mb-4`}>
          Quick Links
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <button
            onClick={() => onModuleChange("staff-advance-management", "my-advances")}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">💵</div>
            <p className="font-semibold text-blue-900 text-sm">My Advances</p>
          </button>
          <button
            onClick={() => onModuleChange("staff-advance-management", "advance-approvals")}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">✅</div>
            <p className="font-semibold text-green-900 text-sm">Approvals</p>
          </button>
          <button
            onClick={() => onModuleChange("staff-advance-management", "disbursement")}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">💸</div>
            <p className="font-semibold text-purple-900 text-sm">Disbursement</p>
          </button>
          <button
            onClick={() => onModuleChange("staff-advance-management", "retirement-submission")}
            className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">📝</div>
            <p className="font-semibold text-orange-900 text-sm">Retirement</p>
          </button>
          <button
            onClick={() => onModuleChange("staff-advance-management", "compliance-review")}
            className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">🔍</div>
            <p className="font-semibold text-red-900 text-sm">Compliance</p>
          </button>
          <button
            onClick={() => onModuleChange("staff-advance-management", "budget-allocation")}
            className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">📊</div>
            <p className="font-semibold text-indigo-900 text-sm">Budget</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffAdvanceManagementDashboard;
