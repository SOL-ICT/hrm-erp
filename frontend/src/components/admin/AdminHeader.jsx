"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  Clock,
  User,
  ChevronDown,
} from "lucide-react";

const AdminHeader = ({
  currentTheme,
  currentThemeKey,
  preferences,
  user,
  isSidebarCollapsed,
  onToggleSidebar,
  onThemeChange,
  availableThemes,
}) => {
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // SOL Colors
  const MIDNIGHT_BLUE = "#191970";
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  // Sample notifications
  const notifications = [
    {
      id: 1,
      title: "New Client Registration",
      message: "Zenith Bank has submitted registration",
      time: "5 mins ago",
      type: "info",
      unread: true,
    },
    {
      id: 2,
      title: "Vacancy Declaration",
      message: "Access Bank - 15 new positions",
      time: "12 mins ago",
      type: "success",
      unread: true,
    },
    {
      id: 3,
      title: "System Alert",
      message: "Server maintenance scheduled",
      time: "1 hour ago",
      type: "warning",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[60] ${currentTheme.headerBg} ${currentTheme.border} backdrop-blur-lg shadow-xl`}
      style={{ height: "64px" }} // Reduced from 80px to 64px for compactness
    >
      <div className="px-4 py-2 h-full">
        {" "}
        {/* Reduced padding */}
        <div className="flex items-center justify-between h-full">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            {" "}
            {/* Reduced space */}
            {/* Sidebar Toggle */}
            <button
              onClick={onToggleSidebar}
              className={`p-1.5 rounded-lg ${currentTheme.textSecondary} hover:${currentTheme.textPrimary} ${currentTheme.hover} transition-colors`}
            >
              {isSidebarCollapsed ? (
                <Menu className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
            {/* Search Bar - Compact */}
            <div className="relative">
              <Search
                className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${currentTheme.textMuted}`}
              />
              <input
                type="text"
                placeholder="Search..."
                className={`w-64 pl-8 pr-3 py-2 text-sm ${
                  currentThemeKey === "light"
                    ? "bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    : "bg-white/10 border-white/20 text-white placeholder-slate-400 focus:ring-white/30 focus:border-white/40"
                } rounded-lg focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            {/* Date & Time - Compact */}
            <div
              className={`hidden md:flex items-center space-x-3 ${currentTheme.textSecondary}`}
            >
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  {new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  {new Date().toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {" "}
            {/* Reduced space */}
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg ${currentTheme.textSecondary} hover:${currentTheme.textPrimary} ${currentTheme.hover} transition-all`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <span className="text-xs text-gray-500">
                        {unreadCount} unread
                      </span>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          notification.unread ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 ${
                              notification.type === "info"
                                ? "bg-blue-500"
                                : notification.type === "warning"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Theme Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className={`p-2 rounded-lg ${currentTheme.textSecondary} hover:${currentTheme.textPrimary} ${currentTheme.hover} transition-all`}
                title="Change Theme"
              >
                {currentThemeKey === "light" ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : currentThemeKey === "transparent" ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              {/* Theme Menu */}
              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Theme Settings
                    </h3>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        onThemeChange("light");
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-xs rounded-lg transition-colors ${
                        currentThemeKey === "light"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      <span>Light Theme</span>
                    </button>
                    <button
                      onClick={() => {
                        onThemeChange("dark");
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-xs rounded-lg transition-colors ${
                        currentThemeKey === "dark"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                        />
                      </svg>
                      <span>Dark Theme</span>
                    </button>
                    <button
                      onClick={() => {
                        onThemeChange("transparent");
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-xs rounded-lg transition-colors ${
                        currentThemeKey === "transparent"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>Transparent</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Settings */}
            <button
              className={`p-2 rounded-lg ${currentTheme.textSecondary} hover:${currentTheme.textPrimary} ${currentTheme.hover} transition-all`}
              title="System Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center space-x-2 px-2 py-1.5 ${
                  currentThemeKey === "light"
                    ? "bg-gray-100 border-gray-300 hover:bg-gray-200"
                    : "bg-white/10 border-white/20 hover:bg-white/15"
                } rounded-lg border transition-all`}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${SOL_BLUE}, ${MIDNIGHT_BLUE})`,
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div className="hidden sm:block text-left">
                  <p
                    className={`text-xs font-semibold ${currentTheme.textPrimary} leading-tight`}
                  >
                    {user?.name || "SOL Admin"}
                  </p>
                  <p
                    className={`text-[10px] ${currentTheme.textSecondary} leading-tight`}
                  >
                    System Admin
                  </p>
                </div>
                <ChevronDown className={`w-3 h-3 ${currentTheme.textMuted}`} />
              </button>

              {/* Profile Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                        style={{
                          background: `linear-gradient(135deg, ${SOL_BLUE}, ${MIDNIGHT_BLUE})`,
                        }}
                      >
                        {user?.name?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.name || "SOL Admin"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.email || "admin@sol.ng"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <User className="w-3.5 h-3.5" />
                      <span>Profile Settings</span>
                    </button>
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                      <span>Account Settings</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
