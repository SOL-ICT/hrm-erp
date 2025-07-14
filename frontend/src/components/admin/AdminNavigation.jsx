"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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
      icon: "📦",
      type: "module",
      description: "Procurement and vendor management",
      submodules: [
        { id: "vendor-management", name: "Vendor Management", icon: "🏢" },
        { id: "purchase-orders", name: "Purchase Orders", icon: "📄" },
        { id: "inventory-tracking", name: "Inventory Tracking", icon: "📦" },
      ],
    },
    {
      id: "business-development",
      name: "Business Development",
      icon: "📈",
      type: "module",
      description: "Business growth and development",
      submodules: [
        { id: "lead-management", name: "Lead Management", icon: "🎯" },
        {
          id: "opportunity-tracking",
          name: "Opportunity Tracking",
          icon: "💡",
        },
        { id: "market-analysis", name: "Market Analysis", icon: "📊" },
      ],
    },
    {
      id: "administration",
      name: "Administration",
      icon: "⚙️",
      type: "module",
      description: "System administration and settings",
      submodules: [
        { id: "user-management", name: "User Management", icon: "👥" },
        { id: "system-settings", name: "System Settings", icon: "⚙️" },
        { id: "audit-logs", name: "Audit Logs", icon: "📋" },
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
      // Toggle expanded state for modules with submodules
      setExpandedModules((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(module.id)) {
          newSet.delete(module.id);
        } else {
          newSet.add(module.id);
        }
        return newSet;
      });

      // If module is not active, activate it
      if (!isModuleActive(module.id)) {
        onModuleChange(module.id);
      }
    }
  };

  // Handle submodule click
  const handleSubmoduleClick = (moduleId, submodule) => {
    onModuleChange(moduleId, submodule.id);
  };

  return (
    <aside
      className={`h-full bg-gradient-to-b from-[#191970] to-[#0f0f3d] border-r border-slate-700/30 shadow-2xl transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* SOL Brand Section - Compact */}
      <div className="p-3 border-b border-slate-600/30">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md">
            <span className="text-[10px] font-bold text-[#191970]">SOL</span>
          </div>
          {!isCollapsed && (
            <div>
              <h3 className="font-semibold text-xs text-white leading-tight">
                Strategic Outsourcing
              </h3>
              <p className="text-[10px] text-slate-300 leading-tight">
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
                    ? "bg-white/20 text-white shadow-lg border border-white/30"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
                title={isCollapsed ? module.name : ""}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{module.icon}</span>
                  {!isCollapsed && (
                    <span className="font-medium text-xs">{module.name}</span>
                  )}
                </div>
                {!isCollapsed && module.type === "module" && (
                  <div className="transition-transform duration-200">
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </div>
                )}
              </button>

              {/* Submodules - Ultra Compact */}
              {!isCollapsed &&
                module.type === "module" &&
                expandedModules.has(module.id) && (
                  <div className="mt-1 ml-6 space-y-0.5">
                    {module.submodules.map((submodule) => (
                      <button
                        key={submodule.id}
                        onClick={() =>
                          handleSubmoduleClick(module.id, submodule)
                        }
                        className={`w-full flex items-center space-x-2 p-1.5 text-[11px] rounded-md transition-all duration-150 ${
                          activeSubmodule === submodule.id
                            ? "bg-white/25 text-white border-l-2 border-white"
                            : "text-slate-300 hover:bg-white/15 hover:text-white hover:border-l-2 hover:border-slate-200"
                        }`}
                      >
                        <span className="text-[10px]">{submodule.icon}</span>
                        <span>{submodule.name}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer - SOL Branding */}
      <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-slate-600/30">
        <div className="text-center">
          {!isCollapsed ? (
            <div>
              <p className="text-[10px] text-slate-300">SOL Nigeria Ltd</p>
              <p className="text-[9px] text-slate-400">v2.1.0</p>
            </div>
          ) : (
            <div className="w-2 h-2 bg-white/30 rounded-full mx-auto"></div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AdminNavigation;
