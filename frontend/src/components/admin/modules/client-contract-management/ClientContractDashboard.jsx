"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const ClientContractDashboard = ({ currentTheme, preferences }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeContracts: 0,
    pendingRecruitments: 0,
    activeVacancies: 0,
    pendingClaims: 0,
    totalRevenue: 0,
    expiringContracts: 0,
    newRequestsThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await clientContractAPI.getDashboardStats();

      // Mock data for now
      setTimeout(() => {
        setStats({
          totalClients: 127,
          activeContracts: 89,
          pendingRecruitments: 23,
          activeVacancies: 45,
          pendingClaims: 8,
          totalRevenue: 45670000,
          expiringContracts: 12,
          newRequestsThisMonth: 34,
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
            Loading Client Contract Management...
          </p>
        </div>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Client Contract Management
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Comprehensive client relationship and contract administration
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div
            className={`px-4 py-2 ${currentTheme.cardBg} rounded-xl ${currentTheme.border}`}
          >
            <span className={`text-sm ${currentTheme.textSecondary}`}>
              Last Updated:
            </span>
            <span className={`ml-2 font-semibold ${currentTheme.textPrimary}`}>
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textMuted}`}>
                Total Clients
              </p>
              <p className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                {formatNumber(stats.totalClients)}
              </p>
              <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                <span className="text-green-500">↗ +5.2%</span> from last month
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textMuted}`}>
                Active Contracts
              </p>
              <p className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                {formatNumber(stats.activeContracts)}
              </p>
              <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                <span className="text-green-500">↗ +2.1%</span> from last month
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textMuted}`}>
                Active Vacancies
              </p>
              <p className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                {formatNumber(stats.activeVacancies)}
              </p>
              <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                <span className="text-orange-500">↗ +12.3%</span> from last
                month
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textMuted}`}>
                Revenue (YTD)
              </p>
              <p className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                <span className="text-green-500">↗ +18.7%</span> from last year
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
      >
        <h2
          className={`text-xl font-semibold ${currentTheme.textPrimary} mb-6`}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            {
              name: "Add New Client",
              icon: "👤",
              color: "blue",
              path: "/client-master/manual-entry",
            },
            {
              name: "Create Contract",
              icon: "📄",
              color: "green",
              path: "/client-contract/contract-details",
            },
            {
              name: "Recruitment Request",
              icon: "👥",
              color: "purple",
              path: "/recruitment-request",
            },
            {
              name: "Setup Vacancy",
              icon: "📊",
              color: "orange",
              path: "/vacancy-setup",
            },
            {
              name: "Salary Structure",
              icon: "💰",
              color: "yellow",
              path: "/salary-structure",
            },
            {
              name: "Claims Resolution",
              icon: "⚖️",
              color: "red",
              path: "/claims-resolution",
            },
          ].map((action, index) => (
            <button
              key={index}
              className={`p-4 rounded-xl border border-${action.color}-500/20 bg-${action.color}-500/10 hover:bg-${action.color}-500/20 transition-all text-center group`}
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <p
                className={`font-semibold ${currentTheme.textPrimary} text-sm`}
              >
                {action.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
        >
          <h3
            className={`text-xl font-semibold ${currentTheme.textPrimary} mb-4`}
          >
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[
              {
                action: "New contract signed",
                client: "Access Bank Nigeria",
                time: "2 hours ago",
                type: "success",
              },
              {
                action: "Recruitment request submitted",
                client: "UBA Group",
                time: "4 hours ago",
                type: "info",
              },
              {
                action: "Contract renewal pending",
                client: "Zenith Bank",
                time: "6 hours ago",
                type: "warning",
              },
              {
                action: "Claims resolution completed",
                client: "First Bank Nigeria",
                time: "1 day ago",
                type: "success",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 ${currentTheme.hover} rounded-lg`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "success"
                      ? "bg-green-500"
                      : activity.type === "warning"
                      ? "bg-yellow-500"
                      : activity.type === "info"
                      ? "bg-blue-500"
                      : "bg-gray-500"
                  }`}
                />
                <div className="flex-1">
                  <p
                    className={`font-medium ${currentTheme.textPrimary} text-sm`}
                  >
                    {activity.action}
                  </p>
                  <p className={`text-xs ${currentTheme.textMuted}`}>
                    {activity.client} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}
        >
          <h3
            className={`text-xl font-semibold ${currentTheme.textPrimary} mb-4`}
          >
            Alerts & Notifications
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-red-500">⚠️</span>
                <p
                  className={`font-semibold ${currentTheme.textPrimary} text-sm`}
                >
                  {stats.expiringContracts} Contracts Expiring Soon
                </p>
              </div>
              <p className={`text-xs ${currentTheme.textMuted}`}>
                Review and initiate renewal process
              </p>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-yellow-500">⏰</span>
                <p
                  className={`font-semibold ${currentTheme.textPrimary} text-sm`}
                >
                  {stats.pendingClaims} Pending Claims
                </p>
              </div>
              <p className={`text-xs ${currentTheme.textMuted}`}>
                Requires immediate attention
              </p>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-500">📈</span>
                <p
                  className={`font-semibold ${currentTheme.textPrimary} text-sm`}
                >
                  {stats.newRequestsThisMonth} New Requests This Month
                </p>
              </div>
              <p className={`text-xs ${currentTheme.textMuted}`}>
                Monthly target: 40 requests
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientContractDashboard;
