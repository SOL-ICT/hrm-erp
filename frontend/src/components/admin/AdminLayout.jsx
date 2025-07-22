"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AdminHeader from "./AdminHeader";
import AdminNavigation from "./AdminNavigation";
import AdminRouter from "./AdminRouter";
import ActivitySidebarPanel from "./ActivitySidebarPanel";

const AdminLayout = () => {
  const { user, loading, isAuthenticated, getUserPreferences } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [activeSubmodule, setActiveSubmodule] = useState(null);

  // SOL Colors
  const MIDNIGHT_BLUE = "#191970";
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";

  // Get user preferences with SOL defaults
  const preferences = getUserPreferences() || {
    theme: "dark",
    primaryColor: SOL_BLUE,
    language: "en",
  };

  // Enhanced theme configurations with SOL branding
  const themes = {
    light: {
      bg: "bg-gradient-to-br from-gray-280 via-gray-280 to-white-50",
      cardBg: "bg-white/95",
      sidebarBg: "bg-white/100",
      headerBg: "bg-white/95",
      textPrimary: "text-gray-900",
      textSecondary: "text-gray-600",
      textMuted: "text-gray-500",
      border: "border-gray-200",
      hover: "hover:bg-gray-50",
    },
    dark: {
      bg: "bg-gradient-to-br from-blue-950 via-[#001023] to-blue-900",
      cardBg: "bg-blue-950",
      sidebarBg: `bg-gradient-to-b from-[${MIDNIGHT_BLUE}] to-[#0f0f3d]`,
      headerBg: `bg-gradient-to-r from-[${MIDNIGHT_BLUE}] to-[#0f0f3d]`,
      textPrimary: "text-white",
      textSecondary: "text-gray-300",
      textMuted: "text-gray-400",
      border: "border-slate-600/30",
      hover: "hover:bg-slate-700/50",
    },
    transparent: {
      bg: "bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-800/90",
      cardBg: "bg-white/10 backdrop-blur-md",
      sidebarBg: `bg-gradient-to-b from-[${MIDNIGHT_BLUE}]/95 to-[#0f0f3d]/95 backdrop-blur-md`,
      headerBg: `bg-gradient-to-r from-[${MIDNIGHT_BLUE}]/95 to-[#0f0f3d]/95 backdrop-blur-md`,
      textPrimary: "text-white",
      textSecondary: "text-white/80",
      textMuted: "text-white/60",
      border: "border-white/20",
      hover: "hover:bg-white/10",
    },
  };

  const currentTheme = themes[preferences.theme] || themes.dark;

  // Handle module changes
  const handleModuleChange = (moduleId, submoduleId = null) => {
    setActiveModule(moduleId);
    setActiveSubmodule(submoduleId);
  };

  // Handle activity panel actions
  const handleActivityAction = (moduleId, action) => {
    console.log(`Activity action: ${action} for module: ${moduleId}`);
    // Handle specific actions based on module and action type
    if (action === "add") {
      handleModuleChange(moduleId, "create");
    } else if (action === "view") {
      handleModuleChange(moduleId);
    }
  };

  // Check authentication
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#011b3f] via-slate-900 to-black">
        <div className="text-center">
          <div
            className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: SOL_BLUE, borderTopColor: "transparent" }}
          ></div>
          <p className="text-white/80 text-sm">
            Loading SOL Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg}`}>
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 opacity-3 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${SOL_BLUE.replace(
              "#",
              ""
            )}' fill-opacity='0.05'%3E%3Cpath d='m20 20v-8h-4v8h-8v4h8v8h4v-8h8v-4h-8z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Compact Fixed Header */}
      <AdminHeader
        currentTheme={currentTheme}
        preferences={preferences}
        user={user}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex">
        {/* Navigation Sidebar - Compact positioning */}
        <div
          className={`fixed left-0 bottom-0 z-40 transition-all duration-300 ${
            isSidebarCollapsed ? "w-16" : "w-64"
          }`}
          style={{
            top: "64px", // Matches new compact header height
            height: "calc(100vh - 64px)",
          }}
        >
          <AdminNavigation
            currentTheme={currentTheme}
            preferences={preferences}
            activeModule={activeModule}
            activeSubmodule={activeSubmodule}
            onModuleChange={handleModuleChange}
            isCollapsed={isSidebarCollapsed}
          />
        </div>

        {/* Main Content Area - Compact spacing */}
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? "ml-16" : "ml-64"
          }`}
          style={{
            marginTop: "64px", // Compact header height
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <div
            className={`p-6 ${
              isActivityPanelOpen ? "pr-80" : ""
            } transition-all duration-300`}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div
                      className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                      style={{
                        borderColor: SOL_BLUE,
                        borderTopColor: "transparent",
                      }}
                    ></div>
                    <p className={`${currentTheme.textSecondary} text-sm`}>
                      Loading module...
                    </p>
                  </div>
                </div>
              }
            >
              <AdminRouter
                activeModule={activeModule}
                activeSubmodule={activeSubmodule}
                currentTheme={currentTheme}
                preferences={preferences}
              />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Activity Sidebar Panel */}
      <ActivitySidebarPanel
        currentTheme={currentTheme}
        preferences={preferences}
        isOpen={isActivityPanelOpen}
        onToggle={() => setIsActivityPanelOpen(!isActivityPanelOpen)}
        onActionClick={handleActivityAction}
      />
    </div>
  );
};

export default AdminLayout;
