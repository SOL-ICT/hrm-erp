"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const RBACManagement = ({ currentTheme, preferences }) => {
  const { sanctumRequest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // State for RBAC data
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [saving, setSaving] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);

  // Permission types
  const PERMISSION_TYPES = ["read", "write", "delete", "full"];

  // Use the actual navigation modules (matching AdminNavigation.jsx exactly)
  const navigationModules = [
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
        { id: "screening-management", name: "Screening Management" },
        { id: "interview", name: "Interview" },
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
      icon: "📝",
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
        { id: "rbac-management", name: "Roles & Permissions" },
        { id: "system-settings", name: "System Settings" },
        { id: "audit-logs", name: "Audit Logs" },
      ],
    },
  ];

  // Load initial data
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await sanctumRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/rbac/roles`
      );

      // sanctumRequest returns a Response object, so we need to parse it once
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRoles(data.data || []);
          // Auto-select first role if available
          if (data.data && data.data.length > 0) {
            setSelectedRole(data.data[0]);
            loadRolePermissions(data.data[0].id);
          }
        } else {
          throw new Error(data.message || "Failed to load roles");
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }
    } catch (err) {
      console.error("Error loading roles:", err);
      setError("Failed to load roles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      const response = await sanctumRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/rbac/roles/${roleId}/permissions`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPermissions(data.data || {});
        }
      }
    } catch (err) {
      console.error("Error loading role permissions:", err);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setPermissions({});
    loadRolePermissions(role.id);
  };

  const handlePermissionChange = (
    moduleId,
    submoduleId,
    permissionType,
    checked
  ) => {
    const key = submoduleId || moduleId;

    setPermissions((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [permissionType]: checked,
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await sanctumRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/rbac/roles/${selectedRole.id}/permissions`,
        {
          method: "PUT",
          body: JSON.stringify({ permissions }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess("Permissions updated successfully!");
          setTimeout(() => setSuccess(null), 3000);
        } else {
          throw new Error(data.message || "Failed to update permissions");
        }
      } else {
        throw new Error("Failed to update permissions");
      }
    } catch (err) {
      console.error("Error saving permissions:", err);
      setError("Failed to save permissions. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isPermissionChecked = (moduleId, submoduleId, permissionType) => {
    const key = submoduleId || moduleId;
    return permissions[key]?.[permissionType] || false;
  };

  const toggleModuleExpansion = (moduleId) => {
    setExpandedModule((prev) => (prev === moduleId ? null : moduleId));
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RBAC data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Role-Based Access Control
        </h1>
        <p className="text-gray-600 mt-2">
          Configure detailed permissions for each role in the system.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-700 text-sm">❌ {error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-green-700 text-sm">✅ {success}</div>
        </div>
      )}

      {/* Role Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select Role
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleChange(role)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedRole?.id === role.id
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              <div className="font-medium text-sm">{role.name}</div>
              <div className="text-xs text-gray-500">{role.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Permission Matrix */}
      {selectedRole && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Permissions for {selectedRole.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click on module names to expand/collapse. Only one module can
                  be expanded at a time.
                </p>
              </div>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{saving ? "Saving..." : "Save Permissions"}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module / Submodule
                  </th>
                  {PERMISSION_TYPES.map((permission) => (
                    <th
                      key={permission}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {permission}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {navigationModules.map((module) => (
                  <React.Fragment key={module.id}>
                    {/* Module Header - Always Visible */}
                    <tr
                      className="bg-blue-50 cursor-pointer hover:bg-blue-100"
                      onClick={() => toggleModuleExpansion(module.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{module.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-blue-900 flex items-center">
                              {module.name}
                              <span className="ml-2 text-xs">
                                {expandedModule === module.id ? "▼" : "▶"}
                              </span>
                            </div>
                            <div className="text-xs text-blue-600">
                              {module.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      {PERMISSION_TYPES.map((permission) => (
                        <td key={permission} className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isPermissionChecked(
                              module.id,
                              null,
                              permission
                            )}
                            onChange={(e) => {
                              e.stopPropagation();
                              handlePermissionChange(
                                module.id,
                                null,
                                permission,
                                e.target.checked
                              );
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                      ))}
                    </tr>

                    {/* Submodules - Only show when module is expanded */}
                    {expandedModule === module.id &&
                      module.submodules &&
                      module.submodules.map((submodule) => (
                        <tr key={submodule.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="ml-10">
                              <div className="text-sm text-gray-900">
                                • {submodule.name}
                              </div>
                            </div>
                          </td>
                          {PERMISSION_TYPES.map((permission) => (
                            <td
                              key={permission}
                              className="px-6 py-3 text-center"
                            >
                              <input
                                type="checkbox"
                                checked={isPermissionChecked(
                                  module.id,
                                  submodule.id,
                                  permission
                                )}
                                onChange={(e) =>
                                  handlePermissionChange(
                                    module.id,
                                    submodule.id,
                                    permission,
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RBACManagement;
