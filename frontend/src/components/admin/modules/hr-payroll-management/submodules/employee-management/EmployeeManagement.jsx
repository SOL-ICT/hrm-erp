"use client";

import React, { useState } from "react";
import TerminationTab from "./tabs/TerminationTab";
import PromotionTab from "./tabs/PromotionTab";
import RedeploymentTab from "./tabs/RedeploymentTab";
import CautionTab from "./tabs/CautionTab";
import WarningTab from "./tabs/WarningTab";
import SuspensionTab from "./tabs/SuspensionTab";
import QueryTab from "./tabs/QueryTab";
import BlacklistTab from "./tabs/BlacklistTab";

export default function EmployeeManagement({
  currentTheme,
  preferences,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState("termination");

  const tabs = [
    { id: "termination", name: "Termination", icon: "⛔" },
    { id: "promotion", name: "Promotion", icon: "📈" },
    { id: "redeployment", name: "Redeployment", icon: "🔄" },
    { id: "caution", name: "Caution", icon: "⚠️" },
    { id: "warning", name: "Warning", icon: "🚨" },
    { id: "suspension", name: "Suspension", icon: "⏸️" },
    { id: "query", name: "Query", icon: "❓" },
    { id: "blacklist", name: "Blacklist", icon: "🚫" },
  ];

  const renderTabContent = () => {
    const tabProps = { currentTheme, preferences };

    switch (activeTab) {
      case "termination":
        return <TerminationTab {...tabProps} />;
      case "promotion":
        return <PromotionTab {...tabProps} />;
      case "redeployment":
        return <RedeploymentTab {...tabProps} />;
      case "caution":
        return <CautionTab {...tabProps} />;
      case "warning":
        return <WarningTab {...tabProps} />;
      case "suspension":
        return <SuspensionTab {...tabProps} />;
      case "query":
        return <QueryTab {...tabProps} />;
      case "blacklist":
        return <BlacklistTab {...tabProps} />;
      default:
        return <TerminationTab {...tabProps} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Employee Management
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Manage all staff actions: terminations, promotions, redeployments,
            and disciplinary actions
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

      {/* Tabs Navigation */}
      <div
        className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl backdrop-blur-md shadow-lg overflow-hidden`}
      >
        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white border-b-2 border-blue-400"
                  : `${currentTheme.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-800`
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTabContent()}</div>
      </div>
    </div>
  );
}
