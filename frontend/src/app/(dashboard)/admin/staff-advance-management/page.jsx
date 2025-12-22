'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { advanceAPI } from '@/services/api/advanceAPI';
import { budgetAPI } from '@/services/api/budgetAPI';

export default function StaffAdvanceManagementDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    advances: { total: 0, pending: 0, approved: 0, disbursed: 0, overdue: 0 },
    budgets: { total: 0, total_allocated: 0, total_utilized: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [advStats, budStats] = await Promise.all([
        advanceAPI.getStatistics().catch(() => ({ total: 0, pending: 0, approved: 0, disbursed: 0, overdue: 0 })),
        budgetAPI.getStatistics().catch(() => ({ total: 0, total_allocated: 0, total_utilized: 0 }))
      ]);
      setStats({
        advances: advStats?.data || advStats || { total: 0, pending: 0, approved: 0, disbursed: 0, overdue: 0 },
        budgets: budStats?.data || budStats || { total: 0, total_allocated: 0, total_utilized: 0 }
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Advance Management</h1>
          <p className="text-gray-600 mt-1">Cash advances and retirement management system</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Advances</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stats.advances.total || 0}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stats.advances.pending || 0}
                </p>
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disbursed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stats.advances.disbursed || 0}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stats.advances.overdue || 0}
                </p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Allocated</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : formatCurrency(stats.budgets.total_allocated || 0)}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <button
              onClick={() => router.push('/admin/staff-advance-management/my-advances')}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">💵</div>
              <p className="font-semibold text-blue-900 text-sm">My Advances</p>
            </button>
            <button
              onClick={() => router.push('/admin/staff-advance-management/advance-approvals')}
              className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold text-green-900 text-sm">Approvals</p>
            </button>
            <button
              onClick={() => router.push('/admin/staff-advance-management/disbursement')}
              className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">💸</div>
              <p className="font-semibold text-purple-900 text-sm">Disbursement</p>
            </button>
            <button
              onClick={() => router.push('/admin/staff-advance-management/retirement-submission')}
              className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📝</div>
              <p className="font-semibold text-orange-900 text-sm">Retirement</p>
            </button>
            <button
              onClick={() => router.push('/admin/staff-advance-management/compliance-review')}
              className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">🔍</div>
              <p className="font-semibold text-red-900 text-sm">Compliance</p>
            </button>
            <button
              onClick={() => router.push('/admin/staff-advance-management/budget-allocation')}
              className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📊</div>
              <p className="font-semibold text-indigo-900 text-sm">Budget</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
