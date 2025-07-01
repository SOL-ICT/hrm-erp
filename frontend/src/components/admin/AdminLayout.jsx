"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import AdminHeader from "./AdminHeader";
import AdminNavigation from "./AdminNavigation";
import AdminRouter from "./AdminRouter";

const AdminLayout = () => {
  const { user, loading, isAuthenticated, getUserPreferences } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [activeSubmodule, setActiveSubmodule] = useState(null);

  // Get user preferences
  const preferences = getUserPreferences() || {
    theme: "dark",
    primaryColor: "#6366f1",
    language: "en",
  };

  // Theme configurations
  const themes = {
    light: {
      bg: "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50",
      cardBg: "bg-white/95",
      sidebarBg: "bg-white/90",
      headerBg: "bg-white/95",
      textPrimary: "text-gray-900",
      textSecondary: "text-gray-600",
      textMuted: "text-gray-500",
      border: "border-gray-200",
      hover: "hover:bg-gray-50",
    },
    dark: {
      bg: "bg-gradient-to-br from-slate-900 via-gray-900 to-black",
      cardBg: "bg-slate-800/95",
      sidebarBg: "bg-slate-800/90",
      headerBg: "bg-slate-800/95",
      textPrimary: "text-white",
      textSecondary: "text-gray-300",
      textMuted: "text-gray-400",
      border: "border-gray-700",
      hover: "hover:bg-slate-700/50",
    },
    transparent: {
      bg: "bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-slate-900/80",
      cardBg: "bg-white/10 backdrop-blur-md",
      sidebarBg: "bg-white/10 backdrop-blur-md",
      headerBg: "bg-white/10 backdrop-blur-md",
      textPrimary: "text-white",
      textSecondary: "text-white/80",
      textMuted: "text-white/60",
      border: "border-white/20",
      hover: "hover:bg-white/20",
    },
  };

  const currentTheme = themes[preferences.theme] || themes.dark;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div
        className={`min-h-screen ${currentTheme.bg} flex items-center justify-center`}
      >
        <div
          className={`text-center ${currentTheme.cardBg} backdrop-blur-md rounded-3xl p-12 border ${currentTheme.border} shadow-2xl`}
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2`}>
            Loading Admin Dashboard
          </h3>
          <p className={currentTheme.textSecondary}>
            Preparing administration workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleModuleChange = (module, submodule = null) => {
    setActiveModule(module);
    setActiveSubmodule(submodule);
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg}`}>
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${
              preferences.primaryColor?.replace("#", "") || "6366f1"
            }' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header */}
      <AdminHeader
        currentTheme={currentTheme}
        preferences={preferences}
        user={user}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex">
        {/* Navigation Sidebar */}
        <AdminNavigation
          currentTheme={currentTheme}
          preferences={preferences}
          activeModule={activeModule}
          activeSubmodule={activeSubmodule}
          onModuleChange={handleModuleChange}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? "ml-20" : "ml-72"
          }`}
        >
          <div className="p-8">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className={currentTheme.textSecondary}>
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
    </div>
  );
};

export default AdminLayout;
