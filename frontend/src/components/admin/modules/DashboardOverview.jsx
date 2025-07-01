// components/admin/modules/DashboardOverview.jsx
// Fixed syntax errors and imports

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const DashboardOverview = ({ currentTheme, preferences }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await adminAPI.getStats();

      // Mock comprehensive stats for SOL Nigeria
      setTimeout(() => {
        setStats({
          // Core business metrics
          totalClients: 127,
          activeContracts: 89,
          totalStaff: 6578,
          monthlyRevenue: 45670000,

          // Client contract metrics
          newClientsThisMonth: 8,
          expiringContracts: 12,
          pendingRenewals: 23,

          // HR & Payroll metrics
          activeEmployees: 6234,
          pendingPayroll: 34,
          leaveRequests: 18,

          // Recruitment metrics
          openVacancies: 45,
          pendingApplications: 156,
          interviewsScheduled: 28,

          // Financial metrics
          monthlyBilling: 28430000,
          pendingInvoices: 15,
          overduePayments: 7,

          // Operational metrics
          pendingRequisitions: 19,
          procurementRequests: 12,
          riskAlerts: 3,
          complianceIssues: 2,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={currentTheme.textSecondary}>
            Loading dashboard overview...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className={currentTheme.textSecondary}>
          Failed to load dashboard statistics
        </p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div
        className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 backdrop-blur-md shadow-lg`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={`text-4xl font-bold ${currentTheme.textPrimary} mb-2`}
            >
              Welcome back, {user?.name}! 👋
            </h1>
            <p className={`text-lg ${currentTheme.textSecondary}`}>
              Here's your Strategic Outsourcing Limited business overview for
              today.
            </p>
          </div>
          <div className="text-6xl">🏢</div>
        </div>
      </div>

      {/* Core Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
              Total Clients
            </h3>
            <span className="text-2xl">🏢</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>Active</span>
              <span className={`font-bold ${currentTheme.textPrimary}`}>
                {formatNumber(stats.totalClients)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>
                New This Month
              </span>
              <span className={`font-bold text-green-500`}>
                +{stats.newClientsThisMonth}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>
                Contracts Expiring
              </span>
              <span className={`font-bold text-orange-500`}>
                {stats.expiringContracts}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
              Staff Deployed
            </h3>
            <span className="text-2xl">👥</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>Total</span>
              <span className={`font-bold ${currentTheme.textPrimary}`}>
                {formatNumber(stats.totalStaff)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>Active</span>
              <span className={`font-bold text-green-500`}>
                {formatNumber(stats.activeEmployees)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>
                Open Vacancies
              </span>
              <span className={`font-bold text-blue-500`}>
                {stats.openVacancies}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
              Monthly Revenue
            </h3>
            <span className="text-2xl">💰</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>This Month</span>
              <span className={`font-bold ${currentTheme.textPrimary}`}>
                {formatCurrency(stats.monthlyRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>Billing</span>
              <span className={`font-bold text-green-500`}>
                {formatCurrency(stats.monthlyBilling)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>
                Pending Invoices
              </span>
              <span className={`font-bold text-yellow-500`}>
                {stats.pendingInvoices}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
              Operations
            </h3>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>
                Pending Requisitions
              </span>
              <span className={`font-bold ${currentTheme.textPrimary}`}>
                {stats.pendingRequisitions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>Risk Alerts</span>
              <span className={`font-bold text-red-500`}>
                {stats.riskAlerts}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>
                Compliance Issues
              </span>
              <span className={`font-bold text-orange-500`}>
                {stats.complianceIssues}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Quick Actions */}
      <div
        className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
      >
        <h2
          className={`text-xl font-semibold ${currentTheme.textPrimary} mb-6`}
        >
          Business Module Quick Access
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            {
              name: "Client Contract",
              icon: "📋",
              color: "blue",
              module: "client-contract-management",
            },
            {
              name: "Requisition",
              icon: "📝",
              color: "green",
              module: "requisition-management",
            },
            {
              name: "HR & Payroll",
              icon: "👥",
              color: "purple",
              module: "hr-payroll-management",
            },
            {
              name: "Procurement",
              icon: "🛒",
              color: "orange",
              module: "procurement-management",
            },
            {
              name: "Billing",
              icon: "💳",
              color: "yellow",
              module: "billing-receivable-management",
            },
            {
              name: "Financial",
              icon: "📈",
              color: "indigo",
              module: "financial-accounting",
            },
            {
              name: "Fixed Assets",
              icon: "🏢",
              color: "gray",
              module: "fixed-assets-management",
            },
            {
              name: "Risk Control",
              icon: "🛡️",
              color: "red",
              module: "risk-control-management",
            },
          ].map((module, index) => (
            <button
              key={index}
              className="p-4 rounded-xl border border-gray-500/20 bg-gray-500/10 hover:bg-gray-500/20 transition-all text-center group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {module.icon}
              </div>
              <p
                className={`font-semibold ${currentTheme.textPrimary} text-sm`}
              >
                {module.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Rest of the component continues... */}
    </div>
  );
};

export default DashboardOverview;
