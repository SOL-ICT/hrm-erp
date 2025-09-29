"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const AdminNavigation = ({
  currentTheme,
  preferences,
  activeModule,
  activeSubmodule,
  activeSubSubmodule,
  onModuleChange,
  isCollapsed,
}) => {
  // Only one module can be expanded at a time
  const [expandedModule, setExpandedModule] = useState("dashboard");
  const [expandedSubmodule, setExpandedSubmodule] = useState(null);
  const [hoveredModule, setHoveredModule] = useState(null);

  // SOL Official Colors
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";
  const MIDNIGHT_BLUE = "#191970";

  // Navigation configuration
  const navigationConfig = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "📊",
      type: "single",
      description: "Main administrative dashboard",
    },
    {
      id: "client-contract-management",
      name: "Contract Management Module",
      icon: "📋",
      type: "module",
      description: "Client relationships and contracts",
      submodules: [
        { id: "client-master", name: "Master Setup" },
        { id: "client-service-location", name: "Service Location" },
        { id: "salary-structure", name: "Job Function Setup" },
      ],
    },
    {
      id: "recruitment-management",
      name: "Recruitment Mgt.",
      icon: "👥",
      type: "module",
      description: "Recruitment and candidate management",
      submodules: [
        { id: "recruitment-request", name: "Vacancy Declaration" },
        { id: "check-blacklist", name: "Check Blacklist" },
        {
          id: "screening-management",
          name: "Screening Management",
          submodules: [
            { id: "shortlisted-candidates", name: "Applicants Profile" },
            { id: "current-vacancy-invite", name: "Current Vacancy Invites" },
          ],
        },
        {
          id: "interview",
          name: "Interview",
          submodules: [
            {
              id: "invitation-to-client-interview",
              name: "Invitation To Client Interview",
            },
            {
              id: "client-interview-feedback",
              name: "Client Interview Feedback",
            },
          ],
        },
        { id: "boarding", name: "Boarding" },
        { id: "reports", name: "Reports" },
      ],
    },
    {
      id: "hr-payroll-management",
      name: "HR & Payroll Mgt.",
      icon: "💼",
      type: "module",
      description: "Human resources and payroll management",
      submodules: [
        { id: "employee-record", name: "Employee Record" },
        { id: "employee-management", name: "Employee Management" },
        { id: "payroll-processing", name: "Payroll Processing" },
        { id: "attendance-tracking", name: "Attendance Tracking" },
        { id: "leave-management", name: "Leave Management" },
        { id: "performance-review", name: "Performance Review" },
        { id: "invoicing", name: "Invoicing" },
      ],
    },
    {
      id: "claims",
      name: "Claims",
      icon: "⚖️",
      type: "module",
      description: "Claims resolution and management",
      submodules: [
        { id: "claims-resolution", name: "Claims Resolution" },
        { id: "claims-resolution-list", name: "Claims Resolution List" },
      ],
    },
    {
      id: "requisition-management",
      name: "Requisition Mgt.",
      icon: "�",
      type: "module",
      description: "Staff requisition and approvals",
      submodules: [
        { id: "create-requisition", name: "Create Requisition" },
        { id: "approve-requisition", name: "Approve Requisition" },
        { id: "requisition-history", name: "Requisition History" },
      ],
    },
    {
      id: "procurement-management",
      name: "Procurement Mgt.",
      icon: "📦",
      type: "module",
      description: "Procurement and vendor management",
      submodules: [
        { id: "vendor-management", name: "Vendor Management" },
        { id: "purchase-orders", name: "Purchase Orders" },
        { id: "inventory-tracking", name: "Inventory Tracking" },
      ],
    },
    {
      id: "business-development",
      name: "Business Development",
      icon: "📈",
      type: "module",
      description: "Business growth and development",
      submodules: [
        { id: "lead-management", name: "Lead Management" },
        { id: "opportunity-tracking", name: "Opportunity Tracking" },
        { id: "market-analysis", name: "Market Analysis" },
      ],
    },
    {
      id: "administration",
      name: "Administration",
      icon: "⚙️",
      type: "module",
      description: "System administration and settings",
      submodules: [
        { id: "sol-master", name: "SOL Master" },
        { id: "user-management", name: "User Management" },
        { id: "system-settings", name: "System Settings" },
        { id: "audit-logs", name: "Audit Logs" },
      ],
    },
  ];

  // Check if module is active
  const isModuleActive = (moduleId) => {
    return activeModule === moduleId;
  };

  // Handle module click
  const handleModuleClick = (module) => {
    if (module.type === "single") {
      onModuleChange(module.id);
    } else {
      setExpandedModule((prev) => (prev === module.id ? null : module.id));
      if (!isModuleActive(module.id)) {
        onModuleChange(module.id);
      }
    }
  };

  // Handle submodule click
  const handleSubmoduleClick = (moduleId, submodule) => {
    if (submodule.submodules) {
      // This is a parent submodule with nested items
      setExpandedSubmodule((prev) =>
        prev === submodule.id ? null : submodule.id
      );
    } else {
      // Regular submodule
      onModuleChange(moduleId, submodule.id);
    }
  };

  // Handle sub-submodule click
  const handleSubSubmoduleClick = (moduleId, submoduleId, subSubmodule) => {
    onModuleChange(moduleId, submoduleId, subSubmodule.id);
  };

  return (
    <aside
      className={`h-full ${currentTheme.sidebarBg} ${
        currentTheme.border
      } shadow-2xl transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* SOL Brand Section - Compact */}
      <div className={`p-3 ${currentTheme.border}`}>
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md">
            <span className="text-[10px] font-bold text-[#191970]">SOL</span>
          </div>
          {!isCollapsed && (
            <div>
              <h3
                className={`font-semibold text-xs ${currentTheme.textPrimary} leading-tight`}
              >
                Strategic Outsourcing
              </h3>
              <p
                className={`text-[10px] ${currentTheme.textSecondary} leading-tight`}
              >
                Admin Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu - Compact */}
      <nav
        className="p-2 h-full overflow-y-auto"
        style={{ height: "calc(100vh - 120px)" }}
      >
        <div className="space-y-1">
          {navigationConfig.map((module) => (
            <div key={module.id}>
              {/* Module Header - Compact */}
              <button
                onClick={() => handleModuleClick(module)}
                onMouseEnter={() => setHoveredModule(module.id)}
                onMouseLeave={() => setHoveredModule(null)}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 group ${
                  isModuleActive(module.id)
                    ? `bg-blue-600 ${currentTheme.textPrimary} shadow-lg border border-blue-400/30`
                    : `${currentTheme.textSecondary} ${currentTheme.hover}`
                }`}
                title={isCollapsed ? module.name : ""}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-md">{module.icon}</span>
                  {!isCollapsed && (
                    <span className="font-medium text-xs">{module.name}</span>
                  )}
                </div>
                {!isCollapsed && module.type === "module" && (
                  <div className="transition-transform duration-200">
                    {expandedModule === module.id ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </div>
                )}
              </button>

              {/* Submodules - Ultra Compact, No Icons */}
              {!isCollapsed &&
                module.type === "module" &&
                expandedModule === module.id && (
                  <div className="mt-1 ml-6 space-y-0.5">
                    {module.submodules.map((submodule) => (
                      <div key={submodule.id}>
                        <button
                          onClick={() =>
                            handleSubmoduleClick(module.id, submodule)
                          }
                          className={`w-full flex items-center justify-between p-1.5 text-[11px] rounded-md transition-all duration-150 ${
                            activeSubmodule === submodule.id ||
                            expandedSubmodule === submodule.id
                              ? `bg-blue-600 ${currentTheme.textPrimary} border-l-2 border-blue-400`
                              : `${currentTheme.textSecondary} ${currentTheme.hover} hover:border-l-2 hover:border-blue-300`
                          }`}
                        >
                          <span>{submodule.name}</span>
                          {submodule.submodules && (
                            <div className="transition-transform duration-200">
                              {expandedSubmodule === submodule.id ? (
                                <ChevronDown className="w-2 h-2" />
                              ) : (
                                <ChevronRight className="w-2 h-2" />
                              )}
                            </div>
                          )}
                        </button>

                        {/* Sub-submodules */}
                        {submodule.submodules &&
                          expandedSubmodule === submodule.id && (
                            <div className="mt-1 ml-4 space-y-0.5">
                              {submodule.submodules.map((subSubmodule) => (
                                <button
                                  key={subSubmodule.id}
                                  onClick={() =>
                                    handleSubSubmoduleClick(
                                      module.id,
                                      submodule.id,
                                      subSubmodule
                                    )
                                  }
                                  className={`w-full flex items-center space-x-2 p-1 text-[10px] rounded-md transition-all duration-150 ${
                                    activeSubSubmodule === subSubmodule.id
                                      ? `bg-blue-500 ${currentTheme.textPrimary} border-l-2 border-blue-300`
                                      : `${currentTheme.textSecondary} ${currentTheme.hover} hover:border-l-2 hover:border-blue-200`
                                  }`}
                                >
                                  <span>• {subSubmodule.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer - SOL Branding */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-2 ${currentTheme.border}`}
      >
        <div className="text-center">
          {!isCollapsed ? (
            <div>
              <p className={`text-[10px] ${currentTheme.textSecondary}`}>
                SOL Nigeria Ltd
              </p>
              <p className={`text-[9px] ${currentTheme.textMuted}`}>v2.1.0</p>
            </div>
          ) : (
            <div
              className={`w-2 h-2 ${currentTheme.textMuted} bg-current rounded-full mx-auto opacity-30`}
            ></div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AdminNavigation;
