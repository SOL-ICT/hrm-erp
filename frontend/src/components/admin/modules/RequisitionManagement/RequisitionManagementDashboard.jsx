"use client";

import { useEffect, useState } from 'react';
import { requisitionAPI, inventoryAPI } from '@/services/modules/requisition-management';

const RequisitionManagementDashboard = ({ currentTheme, preferences }) => {
  const [stats, setStats] = useState({
    requisitions: { total: 0, pending: 0, approved: 0, collected: 0 },
    inventory: { total: 0, low_stock: 0, total_value: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [reqStats, invStats] = await Promise.all([
        requisitionAPI.getStatistics(),
        inventoryAPI.getStatistics()
      ]);
      setStats({
        requisitions: reqStats,
        inventory: invStats?.data || invStats || { total: 0, low_stock: 0, total_value: 0 }
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
            Requisition Management
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Staff requisition system for Strategic Outsourcing Limited
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Total Requisitions</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.requisitions.total || 0}
              </p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Pending Approval</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.requisitions.pending || 0}
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Inventory Items</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.inventory.total || stats.inventory.total_items || 0}
              </p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Low Stock Items</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}>
                {loading ? '...' : stats.inventory.low_stock || stats.inventory.low_stock_items || 0}
              </p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Module Description */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 backdrop-blur-md shadow-lg`}>
        <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-4`}>
          Requisition Management System
        </h2>
        <p className={`${currentTheme.textSecondary} mb-6 leading-relaxed`}>
          Three-tier requisition workflow for SOL staff to request inventory items, Store Keepers to approve and prepare items, 
          and Admin Officers to track all requisitions and manage inventory.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">🛒</span>
              Create Requisition
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              SOL staff can browse the inventory catalog, add items to cart, and submit requisition requests with purpose details.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Browse inventory catalog</li>
              <li>Real-time stock availability</li>
              <li>Shopping cart with quantities</li>
              <li>Track your requisitions</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">✅</span>
              Approve Requisition
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Store Keepers review pending requisitions, approve or reject with reasons, mark items ready, and track collections.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Review pending requests</li>
              <li>Approve/Reject with validation</li>
              <li>Mark ready for collection</li>
              <li>Track collected items</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">📊</span>
              Requisition History
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Complete archive of all requisitions with advanced filtering, search, export capabilities, and detailed audit trail.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Advanced filtering by status/date/dept</li>
              <li>Export to CSV</li>
              <li>Detailed requisition view</li>
              <li>Complete status log</li>
            </ul>
          </div>

          <div className={`${currentTheme.border} rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-2xl">🏪</span>
              Inventory Management
            </h3>
            <p className={`${currentTheme.textSecondary} text-sm mb-4`}>
              Store Keepers and Admin Officers manage inventory items, stock levels, categories, and pricing information.
            </p>
            <ul className={`${currentTheme.textSecondary} text-sm space-y-2 list-disc list-inside`}>
              <li>Add/Edit/Delete inventory items</li>
              <li>Restock with price updates</li>
              <li>Track stock movements</li>
              <li>Monitor low stock alerts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
        <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4`}>
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => window.location.href = '/dashboard/admin#create-requisition'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Create Requisition
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard/admin#approve-requisition'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Approve Requisitions
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard/admin#requisition-history'}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            View History
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard/admin#inventory-management'}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            Manage Inventory
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequisitionManagementDashboard;
