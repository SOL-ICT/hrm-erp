"use client";

import { useEffect, useState } from 'react';
import { purchaseRequestAPI } from '@/services/api/purchaseRequestAPI';
import { procurementAPI } from '@/services/api/procurementAPI';

const ProcurementManagementDashboard = ({ currentTheme, preferences, onModuleChange }) => {
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
        purchaseRequestAPI.getStatistics(),
        procurementAPI.getStatistics()
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Procurement Management
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Purchase requests and inventory restocking system
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Total Purchase Requests</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.purchaseRequests.total || 0}
              </p>
            </div>
            <div className="text-3xl">📝</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Pending Approval</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.purchaseRequests.pending || 0}
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Procurement Logs</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.procurement.total || 0}
              </p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Total Procurement Value</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : formatCurrency(stats.procurement.total_value || 0)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>
      </div>

      {/* Module Description */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 backdrop-blur-md shadow-lg`}>
        <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-4`}>
          Procurement Management System
        </h2>
        <p className={`${currentTheme.textSecondary} mb-6 leading-relaxed`}>
          Comprehensive procurement workflow from purchase request creation through approval, 
          vendor management, procurement logging, and detailed reporting.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">📝</span>
              Purchase Requests
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Store Keepers create purchase requests for inventory restocking with detailed item specifications, 
              quantities, and justification. Finance Director reviews and approves/rejects requests.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Create detailed purchase requests</li>
              <li>Multi-item support with specifications</li>
              <li>Approval workflow tracking</li>
              <li>Finance Director final approval</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">📦</span>
              Procurement Logging
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Admin Officer logs received items, tracks suppliers, delivery dates, quantities received, 
              and automatically updates inventory levels when items are received.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Log received items</li>
              <li>Track supplier performance</li>
              <li>Delivery date monitoring</li>
              <li>Auto-update inventory stock</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">🏢</span>
              Vendor Management
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Maintain vendor database with contact details, payment terms, and performance ratings. 
              Track vendor history and reliability for better procurement decisions.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Vendor database management</li>
              <li>Performance ratings</li>
              <li>Payment terms tracking</li>
              <li>Vendor history reports</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">📊</span>
              Reports
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Comprehensive procurement reports including spending analysis, vendor performance, 
              procurement cycle times, and inventory impact assessments.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Spending analysis</li>
              <li>Vendor performance metrics</li>
              <li>Procurement cycle tracking</li>
              <li>Inventory impact reports</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
        <h3 className={`text-xl font-semibold ${currentTheme.textPrimary} mb-4`}>
          Quick Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => onModuleChange("procurement-management", "purchase-requests")}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">📝</div>
            <p className="font-semibold text-blue-900">Purchase Requests</p>
          </button>
          <button
            onClick={() => onModuleChange("procurement-management", "procurement-logging")}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">📦</div>
            <p className="font-semibold text-green-900">Procurement Logging</p>
          </button>
          <button
            onClick={() => onModuleChange("procurement-management", "vendor-management")}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">🏢</div>
            <p className="font-semibold text-purple-900">Vendor Management</p>
          </button>
          <button
            onClick={() => onModuleChange("procurement-management", "procurement-reports")}
            className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">📊</div>
            <p className="font-semibold text-orange-900">Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcurementManagementDashboard;
