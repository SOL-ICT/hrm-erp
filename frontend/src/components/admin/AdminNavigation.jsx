"use client";

import { useState, useEffect } from "react";

const AdminNavigation = ({
  currentTheme,
  preferences,
  activeModule,
  activeSubmodule,
  onModuleChange,
  isCollapsed,
}) => {
  const [expandedModules, setExpandedModules] = useState(
    new Set(["dashboard"])
  );
  const [hoveredModule, setHoveredModule] = useState(null);

  // Navigation configuration
  const navigationConfig = [
    {
      id: "dashboard",
      name: "Dashboard Overview",
      icon: "📊",
      type: "single",
      description: "Main administrative dashboard",
    },
    {
      id: "client-contract-management",
      name: "Client Contract Mgt.",
      icon: "📋",
      type: "module",
      description: "Client relationships and contracts",
      submodules: [
        { id: "client-master", name: "Client Master", icon: "👤" },
        { id: "client-service", name: "Client Service", icon: "🌍" },
        { id: "client-contract", name: "Client Contract", icon: "📄" },
        { id: "recruitment-request", name: "Recruitment Request", icon: "👥" },
        { id: "vacancy-setup", name: "Vacancy Setup", icon: "📊" },
        { id: "salary-structure", name: "Salary Structure", icon: "💰" },
        { id: "client-week-off", name: "Client Week Off", icon: "🏖️" },
        { id: "claims-resolution", name: "Claims Resolution", icon: "⚖️" },
        {
          id: "claims-resolution-list",
          name: "Claims Resolution List",
          icon: "📋",
        },
        {
          id: "recruitment-tracker-list",
          name: "Recruitment Tracker List",
          icon: "📈",
        },
      ],
    },
    {
      id: "requisition-management",
      name: "Requisition Mgt.",
      icon: "📝",
      type: "module",
      description: "Staff requisition and approvals",
      submodules: [
        { id: "create-requisition", name: "Create Requisition", icon: "➕" },
        { id: "approve-requisition", name: "Approve Requisition", icon: "✅" },
        { id: "requisition-history", name: "Requisition History", icon: "📚" },
      ],
    },
    {
      id: "hr-payroll-management",
      name: "HR & Payroll Mgt.",
      icon: "👥",
      type: "module",
      description: "Human resources and payroll",
      submodules: [
        { id: "employee-management", name: "Employee Management", icon: "👤" },
        { id: "payroll-processing", name: "Payroll Processing", icon: "💰" },
        { id: "attendance-tracking", name: "Attendance Tracking", icon: "⏰" },
        { id: "leave-management", name: "Leave Management", icon: "🏖️" },
        { id: "performance-review", name: "Performance Review", icon: "📈" },
      ],
    },
    {
      id: "procurement-management",
      name: "Procurement Mgt.",
      icon: "🛒",
      type: "module",
      description: "Procurement and vendor management",
      submodules: [
        { id: "vendor-management", name: "Vendor Management", icon: "🏢" },
        { id: "purchase-orders", name: "Purchase Orders", icon: "📋" },
        {
          id: "procurement-approval",
          name: "Procurement Approval",
          icon: "✅",
        },
      ],
    },
    {
      id: "billing-receivable-management",
      name: "Billing & Receivable Mgt.",
      icon: "💳",
      type: "module",
      description: "Billing and accounts receivable",
      submodules: [
        { id: "invoice-generation", name: "Invoice Generation", icon: "📄" },
        { id: "payment-tracking", name: "Payment Tracking", icon: "💰" },
        { id: "receivables-report", name: "Receivables Report", icon: "📊" },
      ],
    },
    {
      id: "financial-accounting",
      name: "Financial Accounting",
      icon: "📈",
      type: "module",
      description: "Financial reporting and accounting",
      submodules: [
        { id: "chart-of-accounts", name: "Chart of Accounts", icon: "📚" },
        { id: "journal-entries", name: "Journal Entries", icon: "✏️" },
        { id: "financial-reports", name: "Financial Reports", icon: "📊" },
      ],
    },
    {
      id: "fixed-assets-management",
      name: "Fixed Assets Mgt.",
      icon: "🏢",
      type: "module",
      description: "Fixed assets and depreciation",
      submodules: [
        { id: "asset-register", name: "Asset Register", icon: "📝" },
        { id: "depreciation", name: "Depreciation", icon: "📉" },
        { id: "asset-disposal", name: "Asset Disposal", icon: "🗑️" },
      ],
    },
    {
      id: "risk-control-management",
      name: "Risk & Control Mgt.",
      icon: "🛡️",
      type: "module",
      description: "Risk assessment and controls",
      submodules: [
        { id: "risk-assessment", name: "Risk Assessment", icon: "⚠️" },
        { id: "control-monitoring", name: "Control Monitoring", icon: "👁️" },
        { id: "compliance-tracking", name: "Compliance Tracking", icon: "✅" },
      ],
    },
  ];

  const toggleModule = (moduleId) => {
    if (isCollapsed) return;

    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleModuleClick = (module, submodule = null) => {
    if (module.type === "single") {
      onModuleChange(module.id);
    } else if (submodule) {
      onModuleChange(module.id, submodule.id);
    } else {
      toggleModule(module.id);
    }
  };

  const isModuleActive = (moduleId) => activeModule === moduleId;
  const isSubmoduleActive = (moduleId, submoduleId) =>
    activeModule === moduleId && activeSubmodule === submoduleId;

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] ${
        currentTheme.sidebarBg
      } backdrop-blur-md border-r ${
        currentTheme.border
      } shadow-xl transition-all duration-300 z-30 ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* SOL Brand Section */}
      <div className={`p-4 border-b ${currentTheme.border}`}>
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${
                preferences.primaryColor || "#6366f1"
              }, ${preferences.primaryColor || "#6366f1"}cc)`,
            }}
          >
            SOL
          </div>
          {!isCollapsed && (
            <div>
              <h3 className={`font-bold text-sm ${currentTheme.textPrimary}`}>
                Strategic Outsourcing
              </h3>
              <p className={`text-xs ${currentTheme.textMuted}`}>
                Admin Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 h-full overflow-y-auto">
        <div className="space-y-2">
          {navigationConfig.map((module) => (
            <div key={module.id}>
              {/* Module Header */}
              <button
                onClick={() => handleModuleClick(module)}
                onMouseEnter={() => setHoveredModule(module.id)}
                onMouseLeave={() => setHoveredModule(null)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                  isModuleActive(module.id)
                    ? "text-white shadow-lg"
                    : `${currentTheme.textSecondary} ${currentTheme.hover}`
                }`}
                style={
                  isModuleActive(module.id)
                    ? {
                        background: `linear-gradient(135deg, ${
                          preferences.primaryColor || "#6366f1"
                        }, ${preferences.primaryColor || "#6366f1"}dd)`,
                      }
                    : {}
                }
                title={isCollapsed ? module.name : ""}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{module.icon}</span>
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{module.name}</span>
                  )}
                </div>
                {!isCollapsed && module.type === "module" && (
                  <div className="transition-transform duration-200">
                    {expandedModules.has(module.id) ? (
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
                          d="M19 9l-7 7-7-7"
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </button>

              {/* Submodules */}
              {!isCollapsed &&
                module.submodules &&
                expandedModules.has(module.id) && (
                  <div className="ml-6 mt-2 space-y-1">
                    {module.submodules.map((submodule) => (
                      <button
                        key={submodule.id}
                        onClick={() => handleModuleClick(module, submodule)}
                        className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 text-sm ${
                          isSubmoduleActive(module.id, submodule.id)
                            ? "text-white bg-white/20"
                            : `${currentTheme.textMuted} hover:bg-white/10 hover:text-white`
                        }`}
                      >
                        <span className="text-sm">{submodule.icon}</span>
                        <span>{submodule.name}</span>
                      </button>
                    ))}
                  </div>
                )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && hoveredModule === module.id && (
                <div className="fixed left-24 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg z-50 text-sm whitespace-nowrap">
                  <div className="font-medium">{module.name}</div>
                  <div className="text-xs text-gray-300">
                    {module.description}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Stats (when not collapsed) */}
        {!isCollapsed && (
          <div
            className={`mt-6 p-4 ${currentTheme.cardBg} rounded-xl ${currentTheme.border}`}
          >
            <div className="text-center">
              <div className={`text-lg font-bold ${currentTheme.textPrimary}`}>
                127
              </div>
              <div className={`text-xs ${currentTheme.textMuted}`}>
                Active Clients
              </div>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default AdminNavigation;
