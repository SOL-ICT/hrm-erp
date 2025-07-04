"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Bell, Settings, LogOut, Menu, X } from "lucide-react";

// File: frontend/src/components/admin/AdminHeader.jsx

const AdminHeader = ({
  currentTheme,
  preferences,
  user,
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 ${currentTheme.headerBg} ${currentTheme.border} backdrop-blur-lg shadow-lg`}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Sidebar Toggle */}
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-lg ${currentTheme.hover} transition-colors lg:hidden`}
            >
              {isSidebarCollapsed ? (
                <Menu className={`w-5 h-5 ${currentTheme.textSecondary}`} />
              ) : (
                <X className={`w-5 h-5 ${currentTheme.textSecondary}`} />
              )}
            </button>

            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                SOL
              </div>
              <div className="hidden md:block">
                <h1 className={`text-lg font-bold ${currentTheme.textPrimary}`}>
                  Strategic Outsourcing Limited
                </h1>
                <p className={`text-xs ${currentTheme.textMuted}`}>
                  Enterprise Resource Planning System
                </p>
              </div>
            </div>
          </div>

          {/* Center Search */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${currentTheme.textMuted}`}
              />
              <input
                type="text"
                placeholder="Search modules, clients, staff..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Current Time */}
            <div className="hidden sm:block text-right">
              <p className={`text-sm font-medium ${currentTheme.textPrimary}`}>
                {new Date().toLocaleDateString()}
              </p>
              <p className={`text-xs ${currentTheme.textMuted}`}>
                {new Date().toLocaleTimeString()}
              </p>
            </div>

            {/* New Entry Button */}
            <button className="hidden md:flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              <span className="text-sm font-medium">New Entry</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} ${currentTheme.hover} transition-all`}
              >
                <Bell className={`w-5 h-5 ${currentTheme.textSecondary}`} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                  12
                </span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div
                  className={`absolute right-0 top-full mt-2 w-80 ${currentTheme.cardBg} ${currentTheme.border} rounded-xl shadow-2xl backdrop-blur-lg z-50`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`font-semibold ${currentTheme.textPrimary}`}
                      >
                        Notifications
                      </h3>
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                        12 new
                      </span>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {[
                        {
                          title: "New client registration",
                          time: "2 min ago",
                          type: "info",
                        },
                        {
                          title: "Contract expiring soon",
                          time: "1 hour ago",
                          type: "warning",
                        },
                        {
                          title: "System backup completed",
                          time: "3 hours ago",
                          type: "success",
                        },
                      ].map((notification, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${currentTheme.hover} cursor-pointer`}
                        >
                          <p
                            className={`text-sm font-medium ${currentTheme.textPrimary}`}
                          >
                            {notification.title}
                          </p>
                          <p className={`text-xs ${currentTheme.textMuted}`}>
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button
              className={`p-3 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} ${currentTheme.hover} transition-all`}
            >
              <Settings className={`w-5 h-5 ${currentTheme.textSecondary}`} />
            </button>

            {/* Admin Profile */}
            <div
              className={`flex items-center space-x-3 px-4 py-2 ${currentTheme.cardBg} rounded-xl ${currentTheme.border}`}
            >
              <div className="text-right hidden sm:block">
                <p
                  className={`text-sm font-semibold ${currentTheme.textPrimary}`}
                >
                  {user?.name || "SOL Admin"}
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
                {user?.name?.[0] || "S"}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`p-3 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} ${currentTheme.hover} transition-all group`}
              title="Logout"
            >
              <LogOut
                className={`w-5 h-5 ${currentTheme.textMuted} group-hover:text-red-500 transition-colors`}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
