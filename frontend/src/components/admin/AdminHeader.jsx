"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const AdminHeader = ({
  currentTheme,
  preferences,
  user,
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  const { logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 ${currentTheme.headerBg} backdrop-blur-md border-b ${currentTheme.border} shadow-xl z-40`}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Brand & Toggle */}
          <div className="flex items-center space-x-4">
            {/* Sidebar Toggle - Using SVG instead of Heroicons */}
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-lg ${currentTheme.hover} transition-colors`}
            >
              <svg
                className={`w-6 h-6 ${currentTheme.textPrimary}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* SOL Brand */}
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${
                    preferences.primaryColor || "#6366f1"
                  }, ${preferences.primaryColor || "#6366f1"}dd)`,
                }}
              >
                <span className="font-bold text-sm">SOL</span>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                  Strategic Outsourcing Limited
                </h1>
                <p className={`text-xs ${currentTheme.textSecondary}`}>
                  Enterprise Resource Planning System
                </p>
              </div>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search modules, clients, staff..."
                className={`w-full ${currentTheme.cardBg} ${currentTheme.border} rounded-xl px-4 py-3 pl-12 ${currentTheme.textPrimary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm`}
              />
              <svg
                className={`w-5 h-5 ${currentTheme.textMuted} absolute left-4 top-4`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Right Section - Time, Notifications, Profile */}
          <div className="flex items-center space-x-4">
            {/* Current Date */}
            <div
              className={`flex items-center space-x-2 px-4 py-2 ${currentTheme.cardBg} rounded-xl ${currentTheme.border}`}
            >
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span
                className={`text-sm font-medium ${currentTheme.textPrimary}`}
              >
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Current Time */}
            <div
              className={`flex items-center space-x-2 px-4 py-2 ${currentTheme.cardBg} rounded-xl ${currentTheme.border}`}
            >
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                className={`text-sm font-medium ${currentTheme.textPrimary}`}
              >
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Quick Actions */}
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm">
              New Entry
            </button>

            {/* Notifications */}
            <button
              className={`relative p-3 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} ${currentTheme.hover} transition-all`}
            >
              <svg
                className={`w-6 h-6 ${currentTheme.textSecondary}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5v-5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                12
              </span>
            </button>

            {/* Admin Profile */}
            <div
              className={`flex items-center space-x-3 px-4 py-2 ${currentTheme.cardBg} rounded-xl ${currentTheme.border}`}
            >
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${currentTheme.textPrimary}`}
                >
                  {user?.name || "Admin User"}
                </p>
                <p className={`text-xs ${currentTheme.textMuted}`}>
                  System Administrator
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${
                    preferences.primaryColor || "#6366f1"
                  }, ${preferences.primaryColor || "#6366f1"}dd)`,
                }}
              >
                {user?.name?.[0] || "A"}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`p-3 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} ${currentTheme.hover} transition-all group`}
            >
              <svg
                className={`w-6 h-6 ${currentTheme.textMuted} group-hover:text-red-500 transition-colors`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
