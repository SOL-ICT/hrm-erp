"use client";

import { useState, Suspense } from "react";
import {
  Building2,
  Users,
  FileText,
  UserPlus,
  Briefcase,
  DollarSign,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Calendar,
  Shield,
} from "lucide-react";
import ClientMaster from "./submodules/client-master/ClientMaster";

// File: frontend/src/components/admin/modules/client-contract-management/ClientContractDashboard.jsx

const ClientContractDashboard = ({ currentTheme, preferences }) => {
  const [activeSubmodule, setActiveSubmodule] = useState(null);

  // Define available submodules
  const submodules = [
    {
      id: "client-master",
      name: "Client Master",
      icon: Building2,
      description: "Add, edit, and manage client information and profiles",
      component: ClientMaster,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      stats: { count: "127", change: "+8" },
    },
    {
      id: "client-service",
      name: "Client Service",
      icon: Users,
      description: "Manage service locations and regional zones",
      component: null,
      color: "emerald",
      gradient: "from-emerald-500 to-emerald-600",
      stats: { count: "45", change: "+12" },
      comingSoon: true,
    },
    {
      id: "client-contract",
      name: "Client Contract",
      icon: FileText,
      description: "Handle contract management and renewals",
      component: null,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      stats: { count: "98", change: "+5" },
      comingSoon: true,
    },
    {
      id: "recruitment-request",
      name: "Recruitment Request",
      icon: UserPlus,
      description: "Process and manage recruitment requests",
      component: null,
      color: "orange",
      gradient: "from-orange-500 to-orange-600",
      stats: { count: "23", change: "+7" },
      comingSoon: true,
    },
    {
      id: "vacancy-setup",
      name: "Vacancy Setup",
      icon: Briefcase,
      description: "Configure and post job vacancies",
      component: null,
      color: "teal",
      gradient: "from-teal-500 to-teal-600",
      stats: { count: "15", change: "+3" },
      comingSoon: true,
    },
    {
      id: "salary-structure",
      name: "Salary Structure",
      icon: DollarSign,
      description: "Define and manage salary structures",
      component: null,
      color: "indigo",
      gradient: "from-indigo-500 to-indigo-600",
      stats: { count: "12", change: "+2" },
      comingSoon: true,
    },
  ];

  // Render active submodule (DIRECT - no intermediate dashboard)
  if (activeSubmodule) {
    const module = submodules.find((m) => m.id === activeSubmodule);
    if (module && module.component) {
      const Component = module.component;
      return (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          }
        >
          <Component
            currentTheme={currentTheme}
            preferences={preferences}
            onClose={() => setActiveSubmodule(null)}
          />
        </Suspense>
      );
    }
  }

  // Main dashboard view
  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`text-4xl font-bold ${currentTheme.textPrimary} mb-2`}
              >
                Client Contract Management
              </h1>
              <p className={`text-lg ${currentTheme.textSecondary}`}>
                Comprehensive client relationship and contract oversight
              </p>
              <div className="flex items-center mt-3 space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  ✅ Active
                </span>
                <span className={`text-sm ${currentTheme.textMuted}`}>
                  Last updated: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-xl">
                <FileText className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics (Removed Monthly Revenue) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Total Clients",
            value: "127",
            change: "+8",
            icon: Building2,
            color: "blue",
            trend: "up",
          },
          {
            label: "Active Contracts",
            value: "98",
            change: "+5",
            icon: FileText,
            color: "green",
            trend: "up",
          },
          {
            label: "Open Vacancies",
            value: "45",
            change: "+12",
            icon: Briefcase,
            color: "purple",
            trend: "up",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden ${currentTheme.cardBg} ${currentTheme.border} rounded-2xl p-6 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 group`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/5 to-${stat.color}-600/5 group-hover:from-${stat.color}-500/10 group-hover:to-${stat.color}-600/10 transition-all`}
            ></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl bg-${stat.color}-500/20 group-hover:bg-${stat.color}-500/30 transition-colors`}
                >
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-${stat.color}-700 bg-${stat.color}-100 dark:text-${stat.color}-300 dark:bg-${stat.color}-900/30`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                  )}{" "}
                  {stat.change}
                </span>
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${currentTheme.textSecondary} mb-1`}
                >
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                  {stat.value}
                </p>
                <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                  This month
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Submodules Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
            Management Modules
          </h2>
          <div className={`text-sm ${currentTheme.textMuted}`}>
            Click any module to access its features
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {submodules.map((module) => (
            <div
              key={module.id}
              className={`relative overflow-hidden ${currentTheme.cardBg} ${
                currentTheme.border
              } rounded-2xl backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer ${
                module.comingSoon
                  ? "opacity-60 hover:opacity-80"
                  : "hover:scale-105 hover:-translate-y-1"
              }`}
              onClick={() => {
                if (!module.comingSoon && module.component) {
                  setActiveSubmodule(module.id);
                }
              }}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              ></div>

              {/* Content */}
              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-4 rounded-xl bg-gradient-to-br ${module.gradient} text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}
                  >
                    <module.icon className="w-6 h-6" />
                  </div>
                  {module.comingSoon && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      <Calendar className="w-3 h-3 mr-1" />
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div className="mb-4">
                  <h3
                    className={`text-xl font-bold ${currentTheme.textPrimary} mb-2 group-hover:text-${module.color}-600 transition-colors`}
                  >
                    {module.name}
                  </h3>
                  <p
                    className={`text-sm ${currentTheme.textSecondary} leading-relaxed`}
                  >
                    {module.description}
                  </p>
                </div>

                {/* Stats */}
                {module.stats && (
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p
                        className={`text-2xl font-bold ${currentTheme.textPrimary}`}
                      >
                        {module.stats.count}
                      </p>
                      <p className={`text-xs ${currentTheme.textMuted}`}>
                        Total Records
                      </p>
                    </div>
                    <div className={`text-right`}>
                      <p
                        className={`text-sm font-medium text-${module.color}-600`}
                      >
                        {module.stats.change} this month
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {!module.comingSoon && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <span
                      className={`text-sm font-medium ${currentTheme.textPrimary} group-hover:text-${module.color}-600 transition-colors`}
                    >
                      Access Module
                    </span>
                    <div className="flex items-center space-x-1 text-${module.color}-600 group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-medium">Open</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-2xl p-6 backdrop-blur-md shadow-xl`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold ${currentTheme.textPrimary}`}>
              Recent Activity
            </h3>
            <button
              className={`text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1`}
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {[
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
            ].map((activity, index) => (
              <div
                key={index}
                className={`flex items-center space-x-4 p-4 ${currentTheme.hover} rounded-xl transition-colors group`}
              >
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                    activity.type === "new"
                      ? "from-green-500 to-green-600"
                      : activity.type === "update"
                      ? "from-blue-500 to-blue-600"
                      : "from-purple-500 to-purple-600"
                  } flex items-center justify-center text-white shadow-lg`}
                >
                  <span className="text-sm">{activity.icon}</span>
                </div>
                <div className="flex-1">
                  <p
                    className={`font-semibold ${currentTheme.textPrimary} group-hover:text-blue-600 transition-colors`}
                  >
                    {activity.name}
                  </p>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>
                    {activity.action}
                  </p>
                </div>
                <p className={`text-xs ${currentTheme.textMuted}`}>
                  {activity.time}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-2xl p-6 backdrop-blur-md shadow-xl`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold ${currentTheme.textPrimary}`}>
              Quick Actions
            </h3>
            <span className={`text-sm ${currentTheme.textMuted}`}>
              Most used features
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                action: "Add Client",
                icon: Building2,
                color: "blue",
                gradient: "from-blue-500 to-blue-600",
              },
              {
                action: "New Contract",
                icon: FileText,
                color: "green",
                gradient: "from-green-500 to-green-600",
              },
              {
                action: "Post Vacancy",
                icon: Briefcase,
                color: "purple",
                gradient: "from-purple-500 to-purple-600",
              },
              {
                action: "View Reports",
                icon: BarChart3,
                color: "orange",
                gradient: "from-orange-500 to-orange-600",
              },
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (action.action === "Add Client") {
                    setActiveSubmodule("client-master");
                  }
                }}
                className={`flex flex-col items-center space-y-3 p-4 ${currentTheme.hover} rounded-xl text-center transition-all duration-200 hover:scale-105 group`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-sm font-medium ${currentTheme.textPrimary} group-hover:text-${action.color}-600 transition-colors`}
                >
                  {action.action}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientContractDashboard;
