"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const RBACManagementFull = () => {
  const { sanctumRequest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // State for RBAC data
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [saving, setSaving] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null); // Track which module is expanded

  // Permission types
  const PERMISSION_TYPES = ["read", "write", "delete", "full"];

  // Load initial data
  useEffect(() => {
    loadRBACData();
  }, []);

  const loadRBACData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load modules and roles in parallel
      const [modulesResponse, rolesResponse] = await Promise.all([
        sanctumRequest(`${process.env.NEXT_PUBLIC_API_URL}/rbac/modules`),
        sanctumRequest(`${process.env.NEXT_PUBLIC_API_URL}/rbac/roles`),
      ]);

      if (modulesResponse.ok && rolesResponse.ok) {
        const modulesData = await modulesResponse.json();
        const rolesData = await rolesResponse.json();

        if (modulesData.success) {
          setModules(modulesData.data || []);
        }

        if (rolesData.success) {
          setRoles(rolesData.data || []);
          // Auto-select first role if available
          if (rolesData.data && rolesData.data.length > 0) {
            setSelectedRole(rolesData.data[0]);
            loadRolePermissions(rolesData.data[0].id);
          }
        }
      } else {
        throw new Error("Failed to load RBAC data");
      }
    } catch (err) {
      console.error("Error loading RBAC data:", err);
      setError("Failed to load RBAC data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      const response = await sanctumRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/rbac/roles/${roleId}/permissions`
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
    moduleSlug,
    submoduleSlug,
    permissionType,
    checked
  ) => {
    const key = submoduleSlug || moduleSlug;

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
        `${process.env.NEXT_PUBLIC_API_URL}/rbac/roles/${selectedRole.id}/permissions`,
        {
          method: "PUT",
          body: JSON.stringify({ permissions }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess("Permissions updated successfully!");
          // Auto-hide success message after 3 seconds
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

  const getPermissionKey = (moduleSlug, submoduleSlug) => {
    return submoduleSlug || moduleSlug;
  };

  const isPermissionChecked = (moduleSlug, submoduleSlug, permissionType) => {
    const key = getPermissionKey(moduleSlug, submoduleSlug);
    return permissions[key]?.[permissionType] || false;
  };

  const toggleModuleExpansion = (moduleId) => {
    setExpandedModule((prev) => (prev === moduleId ? null : moduleId));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading RBAC data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Role-Based Access Control Management
        </h2>
        <p className="text-gray-600">
          Configure detailed permissions for each role in the system.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-500 text-sm">❌ {error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-green-700 text-sm">✅ {success}</div>
          </div>
        </div>
      )}

      {/* Role Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Role
        </h3>
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Permissions for {selectedRole.name}
                </h3>
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
                {modules.map((module) => (
                  <React.Fragment key={module.id}>
                    {/* Module Header - Always Visible */}
                    <tr
                      className="bg-blue-50 cursor-pointer hover:bg-blue-100"
                      onClick={() => toggleModuleExpansion(module.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{module.icon}</span>
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
                              module.slug,
                              null,
                              permission
                            )}
                            onChange={(e) => {
                              e.stopPropagation(); // Prevent row click
                              handlePermissionChange(
                                module.slug,
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
                            <div className="ml-8">
                              <div className="text-sm text-gray-900">
                                • {submodule.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {submodule.description}
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
                                  module.slug,
                                  submodule.slug,
                                  permission
                                )}
                                onChange={(e) =>
                                  handlePermissionChange(
                                    module.slug,
                                    submodule.slug,
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

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          System Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {roles.length}
            </div>
            <div className="text-xs text-gray-600">Company Roles</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {modules.length}
            </div>
            <div className="text-xs text-gray-600">System Modules</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {modules.reduce(
                (acc, module) => acc + (module.submodules?.length || 0),
                0
              )}
            </div>
            <div className="text-xs text-gray-600">Submodules</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {modules.length * PERMISSION_TYPES.length +
                modules.reduce(
                  (acc, module) => acc + (module.submodules?.length || 0),
                  0
                ) *
                  PERMISSION_TYPES.length}
            </div>
            <div className="text-xs text-gray-600">Total Permissions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACManagementFull;
