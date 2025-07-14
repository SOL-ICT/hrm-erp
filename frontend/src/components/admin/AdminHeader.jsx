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
  preferences,
  user,
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
      title: "Recruitment Request",
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
      className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#191970] to-[#0f0f3d] border-b border-slate-600/30 backdrop-blur-lg shadow-xl"
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
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isSidebarCollapsed ? (
                <Menu className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
            {/* Search Bar - Compact */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-8 pr-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>
            {/* Date & Time - Compact */}
            <div className="hidden md:flex items-center space-x-3 text-slate-300">
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
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
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
            {/* Settings */}
            <button className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all">
              <Settings className="w-4 h-4" />
            </button>
            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 px-2 py-1.5 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-all"
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
                  <p className="text-xs font-semibold text-white leading-tight">
                    {user?.name || "SOL Admin"}
                  </p>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    System Admin
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
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
