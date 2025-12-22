"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { apiService } from "@/services/api";
import AdminHeader from "./AdminHeader";
import AdminNavigation from "./AdminNavigation";
import AdminRouter from "./AdminRouter";
import ActivitySidebarPanel from "./ActivitySidebarPanel";
import AuthDebugger from "@/components/debug/AuthDebugger";
import NavigationPerformanceMonitor from "@/components/NavigationPerformanceMonitor";
import RouteCacheTest from "@/components/RouteCacheTest";

// Performance notice for developers
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  import("../../performance-notice.js");
}

const AdminLayout = () => {
  const { user, loading, isAuthenticated, getUserPreferences } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [activeSubmodule, setActiveSubmodule] = useState(null);
  const [activeSubSubmodule, setActiveSubSubmodule] = useState(null);

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

  // Theme state management - Initialize and apply dark class immediately
  const [currentThemeKey, setCurrentThemeKey] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("admin_theme") || preferences.theme || "dark";
      // Apply dark class immediately
      if (savedTheme === 'dark' || savedTheme === 'transparent') {
        document.documentElement.classList.add('dark');
      }
      return savedTheme;
    }
    return preferences.theme || "dark";
  });

  // Enhanced theme configurations with modern dark mode standards
  const themes = {
    light: {
      bg: "bg-gradient-to-br from-gray-50 via-gray-100 to-white",
      cardBg: "bg-white/95 shadow-sm",
      sidebarBg: "bg-white shadow-xl border-r border-gray-200",
      headerBg: "bg-white/95 backdrop-blur-lg border-b border-gray-200",
      textPrimary: "text-gray-900",
      textSecondary: "text-gray-600",
      textMuted: "text-gray-500",
      border: "border-gray-200",
      hover: "hover:bg-gray-50",
      hoverStrong: "hover:bg-gray-100",
    },
    dark: {
      // Modern dark theme with proper depth, contrast and elevation
      bg: "bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0a0e17]",
      // Cards with subtle gradient and backdrop blur for depth
      cardBg: "bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-sm shadow-xl border border-slate-700/50",
      // Deep blue sidebar matching login dark theme
      sidebarBg: `bg-gradient-to-b from-[${MIDNIGHT_BLUE}] via-[#0f0f3d] to-[#001122] shadow-2xl border-r border-slate-700/30`,
      // Consistent header with slight translucency
      headerBg: "bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-lg border-b border-slate-700/50",
      textPrimary: "text-white",
      textSecondary: "text-slate-300",
      textMuted: "text-slate-400",
      border: "border-slate-700/50",
      hover: "hover:bg-slate-700/30",
      hoverStrong: "hover:bg-slate-600/50",
    },
    transparent: {
      bg: "bg-gradient-to-br from-slate-900/90 via-gray-900/90 to-slate-800/90",
      cardBg: "bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20",
      sidebarBg: `bg-gradient-to-b from-[${MIDNIGHT_BLUE}]/95 to-[#0f0f3d]/95 backdrop-blur-xl border-r border-white/20`,
      headerBg: "bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl border-b border-white/20",
      textPrimary: "text-white",
      textSecondary: "text-white/80",
      textMuted: "text-white/60",
      border: "border-white/20",
      hover: "hover:bg-white/10",
      hoverStrong: "hover:bg-white/20",
    },
  };

  // Function to change theme
  const handleThemeChange = (newTheme) => {
    setCurrentThemeKey(newTheme);
    // Update preferences in AuthContext if available
    if (typeof updateUserPreferences === "function") {
      updateUserPreferences({ theme: newTheme });
    }
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_theme", newTheme);
    }
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("admin_theme");
      if (savedTheme && themes[savedTheme]) {
        setCurrentThemeKey(savedTheme);
      }
    }
  }, []);

  // Apply dark class to document element for Tailwind dark mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      const htmlElement = document.documentElement;
      if (currentThemeKey === 'dark' || currentThemeKey === 'transparent') {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }
  }, [currentThemeKey]);

  const currentTheme = themes[currentThemeKey] || themes.dark;

  // Handle module changes
  const handleModuleChange = (moduleId, submoduleId = null, subSubmoduleId = null) => {
    setActiveModule(moduleId);
    setActiveSubmodule(submoduleId);
    setActiveSubSubmodule(subSubmoduleId);
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
        currentThemeKey={currentThemeKey}
        preferences={preferences}
        user={user}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onThemeChange={handleThemeChange}
        availableThemes={Object.keys(themes)}
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
                activeSubSubmodule={activeSubSubmodule}
                currentTheme={currentTheme}
                preferences={preferences}
                onModuleChange={handleModuleChange}
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

      {/* Debug Components - Remove in production */}
      <AuthDebugger />
      <NavigationPerformanceMonitor 
        currentRoute={activeSubmodule || activeModule} 
        position="bottom-left" 
      />
      <RouteCacheTest currentRoute={activeSubmodule || activeModule} />
    </div>
  );
};

export default AdminLayout;
