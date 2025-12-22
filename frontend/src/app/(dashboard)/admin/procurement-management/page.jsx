'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { purchaseRequestAPI } from '@/services/api/purchaseRequestAPI';
import { procurementAPI } from '@/services/api/procurementAPI';

export default function ProcurementManagementDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    purchaseRequests: { total: 0, pending: 0, approved: 0, rejected: 0 },
    procurement: { total: 0, total_value: 0, completed: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [prStats, procStats] = await Promise.all([
        purchaseRequestAPI.getStatistics().catch(() => ({ total: 0, pending: 0, approved: 0, rejected: 0 })),
        procurementAPI.getStatistics().catch(() => ({ total: 0, total_value: 0, completed: 0 }))
      ]);
      setStats({
        purchaseRequests: prStats?.data || prStats || { total: 0, pending: 0, approved: 0, rejected: 0 },
        procurement: procStats?.data || procStats || { total: 0, total_value: 0, completed: 0 }
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
          <h1 className="text-3xl font-bold text-gray-900">Procurement Management</h1>
          <p className="text-gray-600 mt-1">Purchase requests and inventory restocking system</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Purchase Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stats.purchaseRequests.total || 0}
                </p>
              </div>
              <div className="text-3xl">📝</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stats.purchaseRequests.pending || 0}
                </p>
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Procurement Logs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stats.procurement.total || 0}
                </p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : formatCurrency(stats.procurement.total_value || 0)}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/admin/procurement-management/purchase-requests')}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📝</div>
              <p className="font-semibold text-blue-900">Purchase Requests</p>
            </button>
            <button
              onClick={() => router.push('/admin/procurement-management/procurement-logging')}
              className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📦</div>
              <p className="font-semibold text-green-900">Procurement Logging</p>
            </button>
            <button
              onClick={() => router.push('/admin/procurement-management/vendor-management')}
              className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">🏢</div>
              <p className="font-semibold text-purple-900">Vendor Management</p>
            </button>
            <button
              onClick={() => router.push('/admin/procurement-management/reports')}
              className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-center"
            >
              <div className="text-3xl mb-2">📊</div>
              <p className="font-semibold text-orange-900">Reports</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
