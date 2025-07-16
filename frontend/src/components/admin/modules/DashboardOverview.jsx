"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  TrendingUp,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Plus,
} from "lucide-react";

const DashboardOverview = ({ currentTheme, preferences }) => {
  const [stats, setStats] = useState({
    totalClients: 127,
    activeStaff: 8942,
    pendingRequisitions: 23,
    // monthlyRevenue: 142500000,
    completedPlacements: 89,
    pendingInterviews: 34,
    riskAlerts: 3,
    complianceIssues: 1,
  });

  const [loading, setLoading] = useState(true);

  // SOL Colors
  const MIDNIGHT_BLUE = "#191970";
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";

  useEffect(() => {
    // Simulate API call
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Compact stat cards data
  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      change: "+8",
      changeType: "positive",
      icon: Building2,
      color: SOL_BLUE,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      title: "Active Staff",
      value: stats.activeStaff.toLocaleString(),
      change: "+124",
      changeType: "positive",
      icon: Users,
      color: "#10B981",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequisitions,
      change: "-5",
      changeType: "positive",
      icon: FileText,
      color: "#F59E0B",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
    },
    // {
    //   title: "Monthly Revenue",
    //   value: `₦${(stats.monthlyRevenue / 1000000).toFixed(1)}M`,
    //   change: "+12.5%",
    //   changeType: "positive",
    //   icon: DollarSign,
    //   color: "#10B981",
    //   bgColor: "bg-green-50",
    //   textColor: "text-green-700",
    // },
    {
      title: "Placements",
      value: stats.completedPlacements,
      change: "+15",
      changeType: "positive",
      icon: TrendingUp,
      color: SOL_BLUE,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      title: "Interviews",
      value: stats.pendingInterviews,
      change: "+7",
      changeType: "positive",
      icon: Calendar,
      color: "#8B5CF6",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      title: "Risk Alerts",
      value: stats.riskAlerts,
      change: "-2",
      changeType: "positive",
      icon: AlertCircle,
      color: SOL_RED,
      bgColor: "bg-red-50",
      textColor: "text-red-700",
    },
    {
      title: "Compliance",
      value: stats.complianceIssues,
      change: "0",
      changeType: "neutral",
      icon: FileText,
      color: "#6B7280",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
    },
  ];

  // Recent activities - compact
  const recentActivities = [
    {
      id: 1,
      type: "client",
      title: "New client registration",
      subtitle: "Zenith Bank - Branch Operations",
      time: "5m ago",
      status: "pending",
    },
    {
      id: 2,
      type: "placement",
      title: "Successful placement",
      subtitle: "Access Bank - Software Developer",
      time: "12m ago",
      status: "completed",
    },
    {
      id: 3,
      type: "interview",
      title: "Interview scheduled",
      subtitle: "First Bank - 3 candidates",
      time: "1h ago",
      status: "scheduled",
    },
    {
      id: 4,
      type: "alert",
      title: "Contract expiry alert",
      subtitle: "GTB Contract - 30 days",
      time: "2h ago",
      status: "warning",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: SOL_BLUE, borderTopColor: "transparent" }}
        ></div>
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

  return (
    <div className="space-y-4">
      {" "}
      {/* Reduced from space-y-6 */}
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${currentTheme.textPrimary}`}>
            Dashboard Overview
          </h1>
          <p className={`text-sm ${currentTheme.textMuted}`}>
            Strategic Outsourcing Limited - Real-time insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${currentTheme.textMuted}`}>
            Last updated:{" "}
            {new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <button className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
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
                {stats ? stats.totalClients : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>Active Contracts</span>
              <span className={`font-bold ${currentTheme.textPrimary}`}>
                {stats ? stats.activeContracts : 0}
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
        ))}
      </div>
      {/* Content Grid - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity - Compact */}
        <div
          className={`${currentTheme.cardBg} rounded-xl p-4 border ${currentTheme.border}`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${currentTheme.textPrimary}`}>
              Recent Activity
            </h3>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>Total</span>
              <span className={`font-bold ${currentTheme.textPrimary}`}>
                {stats ? stats.totalStaff : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${currentTheme.textMuted}`}>Monthly Revenue</span>
              <span className={`font-bold ${currentTheme.textPrimary}`}>
                ₦{stats ? stats.monthlyRevenue.toLocaleString() : 0}
              </span>
            </div>
          </div>
      </div>
      {/* Content Grid - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity - Compact */}
        <div
          className={`${currentTheme.cardBg} rounded-xl p-4 border ${currentTheme.border}`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold ${currentTheme.textPrimary}`}>
              Recent Activity
            </h3>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all
            </button>
          </div>
          <div className="space-y-2">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    activity.status === "completed"
                      ? "bg-green-100 text-green-600"
                      : activity.status === "pending"
                      ? "bg-yellow-100 text-yellow-600"
                      : activity.status === "warning"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {activity.type === "client"
                    ? "C"
                    : activity.type === "placement"
                    ? "P"
                    : activity.type === "interview"
                    ? "I"
                    : "!"}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-medium ${currentTheme.textPrimary} truncate`}
                  >
                    {activity.title}
                  </p>
                  <p className={`text-xs ${currentTheme.textMuted} truncate`}>
                    {activity.subtitle}
                  </p>
                </div>
                <span className={`text-xs ${currentTheme.textMuted}`}>
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - Compact */}
        <div
          className={`${currentTheme.cardBg} rounded-xl p-4 border ${currentTheme.border}`}
        >
          <h3
            className={`text-sm font-semibold ${currentTheme.textPrimary} mb-3`}
          >
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Add Client", icon: Building2, color: SOL_BLUE },
              { label: "New Request", icon: FileText, color: "#10B981" },
              { label: "Schedule Interview", icon: Calendar, color: "#8B5CF6" },
              { label: "Generate Report", icon: TrendingUp, color: "#F59E0B" },
            ].map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <action.icon
                  className="w-4 h-4 mb-1"
                  style={{ color: action.color }}
                />
                <span className="text-xs font-medium text-gray-700">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Performance Summary - Compact */}
        <div
          className={`${currentTheme.cardBg} rounded-xl p-4 border ${currentTheme.border}`}
        >
          <h3
            className={`text-sm font-semibold ${currentTheme.textPrimary} mb-3`}
          >
            This Month
          </h3>
          <div className="space-y-3">
            {[
              {
                label: "Placement Rate",
                value: "89%",
                change: "+5%",
                positive: true,
              },
              {
                label: "Client Satisfaction",
                value: "4.8/5",
                change: "+0.2",
                positive: true,
              },
              {
                label: "Response Time",
                value: "2.3h",
                change: "-0.5h",
                positive: true,
              },
              {
                label: "Revenue Target",
                value: "94%",
                change: "+12%",
                positive: true,
              },
            ].map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className={`text-xs ${currentTheme.textMuted}`}>
                  {metric.label}
                </span>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-semibold ${currentTheme.textPrimary}`}
                  >
                    {metric.value}
                  </span>
                  <span
                    className={`text-xs ${
                      metric.positive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
