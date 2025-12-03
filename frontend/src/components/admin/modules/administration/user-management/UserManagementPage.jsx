import React, { useState } from "react";
import { Users, History, ArrowLeft } from "lucide-react";
import StaffUsersTab from "./tabs/StaffUsersTab";
import RoleHistoryTab from "./tabs/RoleHistoryTab";

const UserManagementPage = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("staff-users");

  const tabs = [
    { id: "staff-users", label: "Staff Users", icon: Users },
    { id: "role-history", label: "Role History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to Administration"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-7 h-7 text-blue-600" />
                  User Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage SOL staff roles and access permissions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "staff-users" && <StaffUsersTab />}
        {activeTab === "role-history" && <RoleHistoryTab />}
      </div>
    </div>
  );
};

export default UserManagementPage;
