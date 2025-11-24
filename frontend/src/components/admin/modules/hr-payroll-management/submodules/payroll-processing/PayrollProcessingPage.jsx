"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/hooks/useClients";
import { Calculator, Users, Settings } from "lucide-react";

// Import tab components
import PayrollRunsTab from "./tabs/PayrollRunsTab";
import AttendanceForPayrollTab from "./tabs/AttendanceForPayrollTab";
import PayrollSettingsTab from "./tabs/PayrollSettingsTab";

/**
 * Payroll Processing Module - Main Container
 * Modern UI matching Employee Management style
 *
 * Features:
 * 1. Payroll Runs Tab - Create, Calculate, Approve, Export payroll runs
 * 2. Attendance for Payroll Tab - Upload and manage attendance data for payroll
 * 3. Payroll Settings Tab - Configure tax rates, statutory deductions, formulas (EDITABLE)
 *
 * @component
 */
export default function PayrollProcessingPage({
  currentTheme,
  preferences,
  onBack,
}) {
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useClients();

  // Tab state
  const [activeTab, setActiveTab] = useState("runs");

  // Client filter state (shared across tabs)
  const [selectedClient, setSelectedClient] = useState(null);

  // Error state
  const [error, setError] = useState(null);

  // Tab configuration
  const tabs = [
    { id: "runs", name: "Payroll Runs", icon: Calculator },
    { id: "attendance", name: "Attendance Upload", icon: Users },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Payroll Processing
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Manage payroll runs, attendance, and system settings
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Main Card with Tabs */}
      <div
        className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl backdrop-blur-md shadow-lg overflow-hidden`}
      >
        {/* Tabs Navigation */}
        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white border-b-2 border-blue-400"
                    : `${currentTheme.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-800`
                }`}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "runs" && (
            <PayrollRunsTab
              currentTheme={currentTheme}
              selectedClient={selectedClient}
              setSelectedClient={setSelectedClient}
              clients={clients}
              user={user}
              setError={setError}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "attendance" && (
            <AttendanceForPayrollTab
              currentTheme={currentTheme}
              selectedClient={selectedClient}
              setSelectedClient={setSelectedClient}
              clients={clients}
              user={user}
              setError={setError}
            />
          )}

          {activeTab === "settings" && (
            <PayrollSettingsTab
              currentTheme={currentTheme}
              user={user}
              setError={setError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
