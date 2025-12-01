// File: frontend/src/components/admin/modules/recruitment-management/RecruitmentDashboard.jsx

"use client";

import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  UserCheck,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import recruitmentRequestAPI from "@/services/modules/recruitment-management/recruitmentRequestAPI";
import RecruitmentRequest from "./submodules/recruitment-request/RecruitmentRequest";
import ApplicantProfile from "./submodules/applicant-profile/ApplicantProfile";
import CurrentVacancies from "./submodules/current-vacancies/CurrentVacancies";

const RecruitmentDashboard = ({ currentTheme, preferences, onBack }) => {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalRequests: "0",
    activeRequests: "0",
    totalVacancies: "0",
    closedRequests: "0",
  });
  const [loading, setLoading] = useState(false);

  // Define recruitment modules following your exact pattern
  const modules = [
    {
      id: "recruitment-request",
      title: "Vacancy Declaration",
      description: "Create and manage vacancy declarations",
      icon: FileText,
      color: "bg-blue-500",
      stats: { label: "Active Requests", value: dashboardStats.activeRequests },
      component: RecruitmentRequest,
    },
    {
      id: "applicant-profile",
      title: "Applicant Profile List",
      description: "View and manage candidate profiles",
      icon: Users,
      color: "bg-emerald-500",
      stats: {
        label: "Total Applicants",
        value: dashboardStats.totalApplicants || "0",
      },
      component: ApplicantProfile,
    },
    {
      id: "current-vacancies",
      title: "Current Vacancies",
      description: "Manage applications and send interview invitations",
      icon: UserCheck,
      color: "bg-purple-500",
      stats: { label: "Open Vacancies", value: dashboardStats.totalVacancies },
      component: CurrentVacancies,
    },
    {
      id: "interview-scheduling",
      title: "Interview Scheduling",
      description: "Schedule and manage interviews",
      icon: Calendar,
      color: "bg-orange-500",
      stats: { label: "Scheduled", value: "18" },
      component: null, // Placeholder for future implementation
    },
    {
      id: "hierarchy",
      title: "Recruitment Hierarchy",
      description: "Manage role-based permissions for recruitment & boarding",
      icon: Shield,
      color: "bg-red-500",
      stats: { label: "Roles", value: "6" },
      component: null, // Will navigate via AdminRouter
      requiresAdmin: true, // Super Admin only
    },
  ];

  // ========================================
  // LIFECYCLE & DATA FETCHING
  // ========================================

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await recruitmentRequestAPI.getDashboard({
        year: new Date().getFullYear(),
      });

      if (response.success && response.data?.stats) {
        setDashboardStats({
          totalRequests: response.data.stats.total?.toString() || "0",
          activeRequests: response.data.stats.active?.toString() || "0",
          totalVacancies: response.data.stats.open_vacancies?.toString() || "0",
          closedRequests: response.data.stats.closed?.toString() || "0",
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleModuleClick = (module) => {
    if (module.id === "hierarchy") {
      // Navigate to hierarchy management via URL
      window.location.hash = "#/recruitment-management/hierarchy";
    } else if (module.component) {
      setSelectedModule(module);
    } else {
      // For modules not yet implemented, show a coming soon message
      alert(
        `${module.title} is coming soon! This module is under development.`
      );
    }
  };

  const handleBackToDashboard = () => {
    setSelectedModule(null);
  };

  // ========================================
  // RENDER SELECTED MODULE
  // ========================================

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

  // ========================================
  // MAIN DASHBOARD RENDER
  // ========================================

  return (
    <div className={`min-h-screen ${currentTheme.bg}`}>
      <div className="p-6">
        {/* Header - Updated with theme */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 ${currentTheme.hover} rounded-lg transition-colors ${currentTheme.textSecondary}`}
              >
                <ArrowLeft
                  className={`w-5 h-5 ${currentTheme.textSecondary}`}
                />
              </button>
            )}
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                Vacancy Management
              </h1>
              <p className={`${currentTheme.textSecondary} mt-1`}>
                Manage recruitment requests, vacancies, and candidate
                applications
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats - Updated with theme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Total Requests
                </p>
                <p
                  className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}
                >
                  {loading ? "..." : dashboardStats.totalRequests}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  All recruitment requests
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Active Requests
                </p>
                <p
                  className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}
                >
                  {loading ? "..." : dashboardStats.activeRequests}
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Currently recruiting
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Open Vacancies
                </p>
                <p
                  className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}
                >
                  {loading ? "..." : dashboardStats.totalVacancies}
                </p>
                <p className="text-xs text-purple-600 mt-2">
                  Positions to fill
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Completed
                </p>
                <p
                  className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}
                >
                  {loading ? "..." : dashboardStats.closedRequests}
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  Successfully filled
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Module Cards - Updated with theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              onClick={() => handleModuleClick(module)}
              className={`${currentTheme.cardBg} rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group ${currentTheme.border}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`${module.color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <module.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${currentTheme.textPrimary}`}
                    >
                      {loading ? "..." : module.stats.value}
                    </p>
                    <p className={`text-xs ${currentTheme.textSecondary}`}>
                      {module.stats.label}
                    </p>
                  </div>
                </div>
                <h3
                  className={`text-xl font-bold ${currentTheme.textPrimary} mb-2`}
                >
                  {module.title}
                </h3>
                <p className={`${currentTheme.textSecondary} text-sm`}>
                  {module.description}
                </p>

                {/* Status indicator for modules not yet implemented */}
                {!module.component && (
                  <div className="flex items-center mt-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-xs text-yellow-600">Coming Soon</span>
                  </div>
                )}
              </div>
              <div
                className={`${currentTheme.hover} px-6 py-3 flex items-center justify-between`}
              >
                <span className={`text-sm ${currentTheme.textSecondary}`}>
                  {module.component ? "Click to manage" : "Under development"}
                </span>
                <span
                  className={`${currentTheme.textMuted} group-hover:translate-x-1 transition-transform`}
                >
                  →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Section - Added for extra value */}
        <div className="mt-8">
          <h2 className={`text-xl font-bold ${currentTheme.textPrimary} mb-4`}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleModuleClick(modules[0])} // Direct to Recruitment Request
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border border-gray-100 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Create New Request
                  </p>
                  <p className="text-sm text-gray-600">
                    Start a recruitment process
                  </p>
                </div>
              </div>
            </button>

            <button
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border border-gray-100 text-left opacity-75 cursor-not-allowed"
              onClick={() => alert("View All Applications - Coming Soon!")}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Applications</p>
                  <p className="text-sm text-gray-600">
                    Review candidate applications
                  </p>
                </div>
              </div>
            </button>

            <button
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border border-gray-100 text-left opacity-75 cursor-not-allowed"
              onClick={() => alert("Schedule Interviews - Coming Soon!")}
            >
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Schedule Interview
                  </p>
                  <p className="text-sm text-gray-600">
                    Book candidate interviews
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentDashboard;
