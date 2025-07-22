"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  FileText,
  UserPlus,
  Briefcase,
  DollarSign,
  BarChart3,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
} from "lucide-react";

const ActivitySidebarPanel = ({
  currentTheme,
  preferences,
  isOpen,
  onToggle,
  onActionClick,
}) => {
  const [activeTab, setActiveTab] = useState("activity");

  // Recent Activity Data
  const recentActivities = [
    {
      name: "Access Bank Nigeria",
      action: "Client profile updated",
      time: "2 hours ago",
      type: "update",
      icon: "✏️",
    },
    {
      name: "Zenith Bank PLC",
      action: "Contract renewal initiated",
      time: "4 hours ago",
      type: "contract",
      icon: "📋",
    },
    {
      name: "First Bank Nigeria",
      action: "New client added",
      time: "6 hours ago",
      type: "new",
      icon: "➕",
    },
    {
      name: "UBA Nigeria",
      action: "Salary structure updated",
      time: "8 hours ago",
      type: "update",
      icon: "💰",
    },
    {
      name: "GTBank Nigeria",
      action: "Recruitment request processed",
      time: "1 day ago",
      type: "recruitment",
      icon: "👥",
    },
  ];

  // Quick Actions Data
  const quickActions = [
    {
      action: "Add Client",
      icon: Building2,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      onClick: () => onActionClick?.("client-master", "add"),
    },
    {
      action: "New Contract",
      icon: FileText,
      color: "green",
      gradient: "from-green-500 to-green-600",
      onClick: () => onActionClick?.("client-contract", "add"),
    },
    {
      action: "Post Vacancy",
      icon: Briefcase,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      onClick: () => onActionClick?.("vacancy-setup", "add"),
    },
    {
      action: "View Reports",
      icon: BarChart3,
      color: "orange",
      gradient: "from-orange-500 to-orange-600",
      onClick: () => onActionClick?.("reports", "view"),
    },
    {
      action: "Add Employee",
      icon: UserPlus,
      color: "teal",
      gradient: "from-teal-500 to-teal-600",
      onClick: () => onActionClick?.("hr-payroll-management", "add"),
    },
    {
      action: "Salary Review",
      icon: DollarSign,
      color: "indigo",
      gradient: "from-indigo-500 to-indigo-600",
      onClick: () => onActionClick?.("salary-structure", "review"),
    },
  ];

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={onToggle}
        className={`fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          isOpen ? "right-80" : "right-4"
        } ${currentTheme.cardBg} ${
          currentTheme.border
        } rounded-l-xl shadow-lg hover:shadow-xl p-3 group`}
        style={{
          background: isOpen
            ? currentTheme.cardBg
            : `linear-gradient(135deg, ${
                preferences.primaryColor || "#c90620"
              }, ${preferences.primaryColor || "#c90620"}dd)`,
        }}
      >
        {isOpen ? (
          <ChevronRight
            className={`w-5 h-5 ${currentTheme.textPrimary} group-hover:scale-110 transition-transform`}
          />
        ) : (
          <ChevronLeft className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`${currentTheme.sidebarBg} ${currentTheme.border} border-l backdrop-blur-md shadow-2xl h-full flex flex-col`}
        >
          {/* Header */}
          <div className={`p-6 border-b ${currentTheme.border}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                Activity Center
              </h2>
              <button
                onClick={onToggle}
                className={`p-2 rounded-lg ${currentTheme.hover} ${currentTheme.textSecondary} hover:text-red-500 transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === "activity"
                    ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                    : `${currentTheme.textSecondary} hover:bg-white/50 dark:hover:bg-gray-700/50`
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Activity</span>
              </button>
              <button
                onClick={() => setActiveTab("actions")}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === "actions"
                    ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                    : `${currentTheme.textSecondary} hover:bg-white/50 dark:hover:bg-gray-700/50`
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Actions</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "activity" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-lg font-semibold ${currentTheme.textPrimary}`}
                  >
                    Recent Activity
                  </h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-3 ${currentTheme.hover} rounded-xl transition-colors group cursor-pointer`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                          activity.type === "new"
                            ? "from-green-500 to-green-600"
                            : activity.type === "update"
                            ? "from-blue-500 to-blue-600"
                            : activity.type === "contract"
                            ? "from-purple-500 to-purple-600"
                            : "from-orange-500 to-orange-600"
                        } flex items-center justify-center text-white shadow-lg flex-shrink-0`}
                      >
                        <span className="text-xs">{activity.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${currentTheme.textPrimary} group-hover:text-blue-600 transition-colors text-sm truncate`}
                        >
                          {activity.name}
                        </p>
                        <p
                          className={`text-xs ${currentTheme.textSecondary} mt-1`}
                        >
                          {activity.action}
                        </p>
                        <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`text-lg font-semibold ${currentTheme.textPrimary}`}
                  >
                    Quick Actions
                  </h3>
                  <span className={`text-sm ${currentTheme.textMuted}`}>
                    Most used
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={`flex flex-col items-center space-y-2 p-4 ${currentTheme.hover} rounded-xl text-center transition-all duration-200 hover:scale-105 group`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all`}
                      >
                        <action.icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs font-medium ${currentTheme.textPrimary} group-hover:text-${action.color}-600 transition-colors text-center`}
                      >
                        {action.action}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-6 border-t ${currentTheme.border}`}>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${currentTheme.textPrimary} mb-1`}
              >
                127
              </div>
              <div className={`text-xs ${currentTheme.textMuted}`}>
                Active Clients Today
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default ActivitySidebarPanel;
