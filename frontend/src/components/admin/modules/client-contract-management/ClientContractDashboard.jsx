"use client";

import { useState, Suspense } from "react";
import {
  Building2,
  Users,
  FileText,
  UserPlus,
  Briefcase,
  DollarSign,
  Calendar,
  Shield,
  TrendingUp,
  ArrowRight,
  Eye,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import ClientMaster from "./submodules/client-master/ClientMaster";

const ClientContractDashboard = ({ currentTheme, preferences }) => {
  const [activeSubmodule, setActiveSubmodule] = useState(null);

  // SOL Colors
  const MIDNIGHT_BLUE = "#191970";
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";

  // Compact submodules configuration
  const submodules = [
    {
      id: "client-master",
      name: "Client Master",
      icon: Building2,
      description: "Manage client profiles and information",
      component: ClientMaster,
      color: SOL_BLUE,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      stats: { total: "127", active: "124", new: "+8" },
      status: "active",
    },
    {
      id: "client-service",
      name: "Client Service",
      icon: Users,
      description: "Service locations and regional mapping",
      component: null,
      color: "#10B981",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      stats: { total: "245", active: "238", new: "+12" },
      status: "ready",
    },
    {
      id: "client-contract",
      name: "Client Contract",
      icon: FileText,
      description: "Contract management and renewals",
      component: null,
      color: "#8B5CF6",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      stats: { total: "98", active: "94", new: "+5" },
      status: "coming-soon",
    },
    {
      id: "recruitment-request",
      name: "Recruitment Request",
      icon: UserPlus,
      description: "Handle recruitment requisitions",
      component: null,
      color: "#F59E0B",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      stats: { total: "156", active: "89", new: "+23" },
      status: "coming-soon",
    },
    {
      id: "vacancy-setup",
      name: "Vacancy Setup",
      icon: Briefcase,
      description: "Configure job positions and requirements",
      component: null,
      color: SOL_RED,
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      stats: { total: "67", active: "45", new: "+7" },
      status: "coming-soon",
    },
    {
      id: "salary-structure",
      name: "Salary Structure",
      icon: DollarSign,
      description: "Define compensation and benefits",
      component: null,
      color: "#10B981",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      stats: { total: "34", active: "34", new: "0" },
      status: "coming-soon",
    },
    {
      id: "client-week-off",
      name: "Client Week Off",
      icon: Calendar,
      description: "Manage client holiday schedules",
      component: null,
      color: "#6B7280",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      stats: { total: "52", active: "48", new: "+4" },
      status: "coming-soon",
    },
    {
      id: "claims-resolution",
      name: "Claims Resolution",
      icon: Shield,
      description: "Handle disputes and claims",
      component: null,
      color: SOL_RED,
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      stats: { total: "23", active: "8", new: "+3" },
      status: "coming-soon",
    },
  ];

  // If a submodule is active, render it
  if (activeSubmodule) {
    const module = submodules.find((m) => m.id === activeSubmodule);
    if (module?.component) {
      const Component = module.component;
      return (
        <div className="space-y-4">
          {/* Breadcrumb - Compact */}
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => setActiveSubmodule(null)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Client Contract Management
            </button>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className={currentTheme.textPrimary}>{module.name}</span>
          </div>

          <Component
            currentTheme={currentTheme}
            preferences={preferences}
            onBack={() => setActiveSubmodule(null)}
          />
        </div>
      );
    }
  }

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${currentTheme.textPrimary}`}>
            Client Contract Management
          </h1>
          <p className={`text-sm ${currentTheme.textMuted}`}>
            Comprehensive client relationship and contract management system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${currentTheme.textMuted}`}>
            8 modules available
          </span>
          <button className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Stats - Compact Row */}
      <div
        className={`${currentTheme.cardBg} rounded-xl p-4 border ${currentTheme.border}`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-lg font-bold ${currentTheme.textPrimary}`}>
              127
            </div>
            <div className={`text-xs ${currentTheme.textMuted}`}>
              Total Clients
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold text-green-600`}>94%</div>
            <div className={`text-xs ${currentTheme.textMuted}`}>
              Active Contracts
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold text-blue-600`}>156</div>
            <div className={`text-xs ${currentTheme.textMuted}`}>
              Open Requests
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold text-purple-600`}>₦2.8B</div>
            <div className={`text-xs ${currentTheme.textMuted}`}>
              Contract Value
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {submodules.map((module) => (
          <div
            key={module.id}
            className={`${currentTheme.cardBg} rounded-xl p-4 border ${currentTheme.border} hover:shadow-lg transition-all cursor-pointer group relative`}
            onClick={() => {
              if (module.status === "active" || module.status === "ready") {
                setActiveSubmodule(module.id);
              }
            }}
          >
            {/* Status Indicator */}
            <div className="absolute top-2 right-2">
              {module.status === "active" && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
              {module.status === "ready" && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              {module.status === "coming-soon" && (
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              )}
            </div>

            {/* Module Header */}
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-8 h-8 rounded-lg ${module.bgColor} flex items-center justify-center`}
              >
                <module.icon
                  className="w-4 h-4"
                  style={{ color: module.color }}
                />
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </button>
            </div>

            {/* Module Info */}
            <div className="space-y-2">
              <h3
                className={`text-sm font-semibold ${currentTheme.textPrimary} leading-tight`}
              >
                {module.name}
              </h3>
              <p className={`text-xs ${currentTheme.textMuted} leading-tight`}>
                {module.description}
              </p>
            </div>

            {/* Stats - Compact */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className={currentTheme.textMuted}>Total: </span>
                  <span className={`font-semibold ${currentTheme.textPrimary}`}>
                    {module.stats.total}
                  </span>
                </div>
                <div>
                  <span className={currentTheme.textMuted}>Active: </span>
                  <span className={`font-semibold ${currentTheme.textPrimary}`}>
                    {module.stats.active}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-2.5 h-2.5 text-green-500" />
                  <span className="font-semibold text-green-600">
                    {module.stats.new}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Indicator */}
            <div className="mt-3 flex items-center justify-between">
              <span
                className={`text-xs ${
                  module.status === "active"
                    ? "text-green-600"
                    : module.status === "ready"
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {module.status === "active"
                  ? "Active"
                  : module.status === "ready"
                  ? "Ready"
                  : "Coming Soon"}
              </span>

              {(module.status === "active" || module.status === "ready") && (
                <div className="flex items-center space-x-1 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3 h-3" />
                  <span>Open</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

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
          {[
            {
              action: "Client Master updated",
              client: "Access Bank",
              time: "5m ago",
              type: "update",
            },
            {
              action: "New contract created",
              client: "Zenith Bank",
              time: "12m ago",
              type: "create",
            },
            {
              action: "Service location added",
              client: "First Bank",
              time: "1h ago",
              type: "create",
            },
            {
              action: "Recruitment request approved",
              client: "GTB",
              time: "2h ago",
              type: "approve",
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    activity.type === "create"
                      ? "bg-green-500"
                      : activity.type === "update"
                      ? "bg-blue-500"
                      : activity.type === "approve"
                      ? "bg-purple-500"
                      : "bg-gray-400"
                  }`}
                ></div>
                <div>
                  <p
                    className={`text-xs font-medium ${currentTheme.textPrimary}`}
                  >
                    {activity.action}
                  </p>
                  <p className={`text-xs ${currentTheme.textMuted}`}>
                    {activity.client}
                  </p>
                </div>
              </div>
              <span className={`text-xs ${currentTheme.textMuted}`}>
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientContractDashboard;
