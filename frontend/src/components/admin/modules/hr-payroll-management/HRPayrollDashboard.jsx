"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  ArrowLeft,
  DollarSign,
  Calendar,
  FileText,
  Settings,
  Award,
  BarChart3,
} from "lucide-react";
import EmployeeRecord from "./submodules/employee-record/EmployeeRecord";
import InvoiceManagement from "../../../invoicing/InvoiceManagement";
import employeeRecordAPI from "../../../../services/modules/hr-payroll-management/employeeRecordAPI";

const HRPayrollDashboard = ({
  currentTheme,
  preferences,
  activeSubmodule,
  onBack,
}) => {
  const [selectedModule, setSelectedModule] = useState(activeSubmodule || null);
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: "0",
    activeEmployees: "0",
    onLeave: "0",
    newHires: "0",
  });
  const [loading, setLoading] = useState(false);

  // Define HR & Payroll modules following the same pattern as other dashboards
  const modules = [
    {
      id: "employee-record",
      title: "Employee Record",
      description:
        "View and manage all employee records by client and location",
      icon: Users,
      color: "bg-blue-500",
      stats: { label: "Total Employees", value: dashboardStats.totalEmployees },
      component: EmployeeRecord,
    },
    {
      id: "employee-management",
      title: "Employee Management",
      description: "Manage employee lifecycle and administrative tasks",
      icon: UserCheck,
      color: "bg-emerald-500",
      stats: {
        label: "Active Employees",
        value: dashboardStats.activeEmployees,
      },
      component: null, // Will be created later
    },
    {
      id: "payroll-processing",
      title: "Payroll Processing",
      description:
        "Process payroll, generate pay slips and manage compensation",
      icon: DollarSign,
      color: "bg-green-500",
      stats: { label: "Monthly Cycles", value: "12" },
      component: null, // Will be created later
    },
    {
      id: "attendance-tracking",
      title: "Attendance Tracking",
      description: "Monitor employee attendance, time tracking and work hours",
      icon: Clock,
      color: "bg-orange-500",
      stats: { label: "On Leave Today", value: dashboardStats.onLeave },
      component: null, // Will be created later
    },
    {
      id: "leave-management",
      title: "Leave Management",
      description: "Manage leave requests, approvals and leave balances",
      icon: Calendar,
      color: "bg-purple-500",
      stats: { label: "Pending Requests", value: "0" },
      component: null, // Will be created later
    },
    {
      id: "performance-review",
      title: "Performance Review",
      description: "Conduct performance evaluations and career development",
      icon: Award,
      color: "bg-indigo-500",
      stats: { label: "Reviews Due", value: "0" },
      component: null, // Will be created later
    },
    {
      id: "invoicing",
      title: "Invoicing",
      description: "Generate and manage client invoices from attendance data",
      icon: FileText,
      color: "bg-teal-500",
      stats: { label: "Monthly Invoices", value: "0" },
      component: InvoiceManagement,
    },
  ];

  const handleModuleClick = (module) => {
    if (module.component) {
      setSelectedModule(module);
    }
  };

  const handleBackToDashboard = () => {
    setSelectedModule(null);
  };

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        // Get actual staff statistics
        const statsResponse = await employeeRecordAPI.getStaffStatistics();

        if (statsResponse.success) {
          const stats = statsResponse.data;
          setDashboardStats({
            totalEmployees: stats.total_staff?.toString() || "0",
            activeEmployees: stats.active_staff?.toString() || "0",
            onLeave:
              (stats.total_staff - stats.active_staff)?.toString() || "0",
            newHires: stats.recent_hires?.toString() || "0",
          });
        } else {
          // Fallback to zeros if API fails
          setDashboardStats({
            totalEmployees: "0",
            activeEmployees: "0",
            onLeave: "0",
            newHires: "0",
          });
        }
      } catch (error) {
        console.error("Error loading HR dashboard stats:", error);
        // Set to zeros on error
        setDashboardStats({
          totalEmployees: "0",
          activeEmployees: "0",
          onLeave: "0",
          newHires: "0",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // If a specific module is selected, render that module
  if (selectedModule && selectedModule.component) {
    const Component = selectedModule.component;
    return (
      <Component
        currentTheme={currentTheme}
        preferences={preferences}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg}`}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 ${currentTheme.hover} rounded-lg transition-colors`}
              >
                <ArrowLeft
                  className={`w-5 h-5 ${currentTheme.textSecondary}`}
                />
              </button>
            )}
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                HR & Payroll Management
              </h1>
              <p className={`${currentTheme.textSecondary} mt-1`}>
                Comprehensive human resources and payroll management system
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>
                  Total Employees
                </p>
                <div
                  className={`text-2xl font-bold ${currentTheme.textPrimary}`}
                >
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    dashboardStats.totalEmployees
                  )}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>
                  Active Employees
                </p>
                <div
                  className={`text-2xl font-bold ${currentTheme.textPrimary}`}
                >
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    dashboardStats.activeEmployees
                  )}
                </div>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>
                  Inactive/On Leave
                </p>
                <div
                  className={`text-2xl font-bold ${currentTheme.textPrimary}`}
                >
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    dashboardStats.onLeave
                  )}
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>
                  New Hires (30 days)
                </p>
                <div
                  className={`text-2xl font-bold ${currentTheme.textPrimary}`}
                >
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    dashboardStats.newHires
                  )}
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon;
            const isAvailable = module.component !== null;

            return (
              <div
                key={module.id}
                onClick={() => isAvailable && handleModuleClick(module)}
                className={`${currentTheme.cardBg} rounded-xl shadow-sm ${
                  currentTheme.border
                } p-6 transition-all duration-200 ${
                  isAvailable
                    ? `cursor-pointer hover:shadow-lg ${currentTheme.hover}`
                    : "opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${module.color} rounded-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  {!isAvailable && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${currentTheme.textSecondary}`}
                    >
                      Coming Soon
                    </span>
                  )}
                </div>

                <h3
                  className={`text-lg font-semibold ${currentTheme.textPrimary} mb-2`}
                >
                  {module.title}
                </h3>

                <p
                  className={`text-sm ${currentTheme.textSecondary} mb-4 line-clamp-2`}
                >
                  {module.description}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${currentTheme.textSecondary}`}>
                      {module.stats.label}
                    </p>
                    <p
                      className={`text-lg font-bold ${currentTheme.textPrimary}`}
                    >
                      {module.stats.value}
                    </p>
                  </div>
                  <div
                    className={`p-2 rounded-lg ${currentTheme.cardBg} ${currentTheme.border}`}
                  >
                    <BarChart3
                      className={`w-4 h-4 ${currentTheme.textSecondary}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm ${currentTheme.border} p-6`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-lg font-semibold ${currentTheme.textPrimary}`}
              >
                Recent HR Activity
              </h3>
              <button
                className={`text-sm ${currentTheme.textSecondary} hover:${currentTheme.textPrimary}`}
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {dashboardStats.totalEmployees === "0" ? (
                <div className="text-center py-8">
                  <p className={`text-sm ${currentTheme.textSecondary}`}>
                    No recent activity to display
                  </p>
                  <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>
                    Activity will appear here once you start managing employees
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start space-x-4 p-4 rounded-lg bg-blue-50">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${currentTheme.textPrimary}`}
                      >
                        Employee Records Available
                      </p>
                      <p className={`text-xs ${currentTheme.textSecondary}`}>
                        {dashboardStats.totalEmployees} employees in the system
                        ready for management
                      </p>
                    </div>
                  </div>

                  {parseInt(dashboardStats.activeEmployees) > 0 && (
                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-green-50">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <UserCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${currentTheme.textPrimary}`}
                        >
                          Active Employees
                        </p>
                        <p className={`text-xs ${currentTheme.textSecondary}`}>
                          {dashboardStats.activeEmployees} employees currently
                          active in the system
                        </p>
                      </div>
                    </div>
                  )}

                  {parseInt(dashboardStats.newHires) > 0 && (
                    <div className="flex items-start space-x-4 p-4 rounded-lg bg-emerald-50">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${currentTheme.textPrimary}`}
                        >
                          Recent Hires
                        </p>
                        <p className={`text-xs ${currentTheme.textSecondary}`}>
                          {dashboardStats.newHires} new employees hired in the
                          last 30 days
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRPayrollDashboard;
