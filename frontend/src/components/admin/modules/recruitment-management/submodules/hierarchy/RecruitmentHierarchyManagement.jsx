// File: frontend/src/components/admin/modules/recruitment-management/submodules/hierarchy/RecruitmentHierarchyManagement.jsx

"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Edit2,
  Save,
  X,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import recruitmentHierarchyAPI from "@/services/modules/recruitment-management/recruitmentHierarchyAPI";

const RecruitmentHierarchyManagement = ({ currentTheme, preferences }) => {
  const { user } = useAuth();
  const [hierarchies, setHierarchies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Permission columns configuration
  const permissionColumns = [
    {
      key: "can_create_request",
      label: "Create Request",
      description: "Can create recruitment requests without approval",
    },
    {
      key: "can_approve_request",
      label: "Approve Request",
      description: "Can approve recruitment requests",
    },
    {
      key: "can_assign_ticket",
      label: "Assign Ticket",
      description: "Can assign tickets to subordinates",
    },
    {
      key: "can_board_without_approval",
      label: "Board w/o Approval",
      description: "Can board staff without needing approval",
    },
    {
      key: "can_approve_boarding",
      label: "Approve Boarding",
      description: "Can approve staff boarding",
    },
  ];

  useEffect(() => {
    fetchHierarchies();
  }, []);

  const fetchHierarchies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recruitmentHierarchyAPI.getAll();

      if (response.success) {
        setHierarchies(response.data || []);
      } else {
        setError("Failed to load recruitment hierarchy");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch hierarchy data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (hierarchy) => {
    // Prevent editing Control Department (role_id = 6)
    if (hierarchy.role?.id === 6) {
      setError("Control Department permissions cannot be modified (level 0)");
      return;
    }

    setEditingRole(hierarchy.role?.id);
    setEditForm({
      can_create_request: hierarchy.can_create_request || false,
      can_approve_request: hierarchy.can_approve_request || false,
      can_assign_ticket: hierarchy.can_assign_ticket || false,
      can_board_without_approval: hierarchy.can_board_without_approval || false,
      can_approve_boarding: hierarchy.can_approve_boarding || false,
      hierarchy_level: hierarchy.hierarchy_level || 99,
    });
    setError(null);
  };

  const handleCancel = () => {
    setEditingRole(null);
    setEditForm({});
    setError(null);
  };

  const handleSave = async (roleId) => {
    try {
      setSaveLoading(true);
      setError(null);
      setSuccess(null);

      // Validate hierarchy level
      if (editForm.hierarchy_level < 1 || editForm.hierarchy_level > 99) {
        setError("Hierarchy level must be between 1 and 99");
        return;
      }

      const response = await recruitmentHierarchyAPI.update(roleId, editForm);

      if (response.success) {
        setSuccess(
          `Permissions updated successfully for ${getRoleName(roleId)}`
        );
        setEditingRole(null);
        setEditForm({});
        fetchHierarchies(); // Refresh data
      } else {
        setError(response.message || "Failed to update permissions");
      }
    } catch (err) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaveLoading(false);
    }
  };

  const getRoleName = (roleId) => {
    const hierarchy = hierarchies.find((h) => h.role?.id === roleId);
    return hierarchy?.role?.name || "Unknown Role";
  };

  const getHierarchyLevelColor = (level) => {
    if (level === 0) return "text-red-600 font-bold";
    if (level === 1) return "text-purple-600 font-semibold";
    if (level <= 3) return "text-blue-600";
    if (level <= 5) return "text-green-600";
    return "text-gray-600";
  };

  const getHierarchyLevelLabel = (level) => {
    if (level === 0) return "HIGHEST (Immutable)";
    if (level === 1) return "Admin Level";
    if (level <= 3) return "Manager Level";
    if (level <= 5) return "Supervisor Level";
    return "Standard Level";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recruitment hierarchy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Recruitment Hierarchy Management
          </h1>
        </div>
        <p className="text-gray-600">
          Configure role-based permissions for recruitment and boarding
          operations
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Control Department (Level 0)</strong> has the highest
                authority and cannot be modified
              </li>
              <li>
                <strong>Hierarchy Level:</strong> Lower numbers = Higher
                authority (1-99)
              </li>
              <li>
                Only <strong>Super Admin</strong> and{" "}
                <strong>Global Admin</strong> can modify these settings
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hierarchy Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Level
                </th>
                {permissionColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                    title={col.description}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hierarchies.length === 0 ? (
                <tr>
                  <td
                    colSpan={permissionColumns.length + 3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No hierarchy data found
                  </td>
                </tr>
              ) : (
                hierarchies.map((hierarchy) => {
                  const isEditing = editingRole === hierarchy.role?.id;
                  const isControlDept = hierarchy.role?.id === 6;

                  return (
                    <tr
                      key={hierarchy.id}
                      className={`${
                        isEditing ? "bg-blue-50" : "hover:bg-gray-50"
                      } transition-colors`}
                    >
                      {/* Role Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {hierarchy.role?.name || "Unknown"}
                          </span>
                          {isControlDept && (
                            <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded">
                              PROTECTED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hierarchy Level */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isEditing ? (
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={editForm.hierarchy_level}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  hierarchy_level:
                                    parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500">
                              {getHierarchyLevelLabel(editForm.hierarchy_level)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-lg font-bold ${getHierarchyLevelColor(
                                hierarchy.hierarchy_level
                              )}`}
                            >
                              {hierarchy.hierarchy_level}
                            </span>
                            <span className="text-xs text-gray-500">
                              {getHierarchyLevelLabel(
                                hierarchy.hierarchy_level
                              )}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Permission Columns */}
                      {permissionColumns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 py-4 whitespace-nowrap text-center"
                        >
                          {isEditing ? (
                            <input
                              type="checkbox"
                              checked={editForm[col.key] || false}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  [col.key]: e.target.checked,
                                })
                              }
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                          ) : hierarchy[col.key] ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleSave(hierarchy.role?.id)}
                              disabled={saveLoading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              {saveLoading ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={saveLoading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(hierarchy)}
                            disabled={isControlDept}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
                              isControlDept
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                            title={
                              isControlDept
                                ? "Control Department cannot be edited"
                                : "Edit permissions"
                            }
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Permission Descriptions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {permissionColumns.map((col) => (
            <div key={col.key} className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{col.label}</p>
                <p className="text-sm text-gray-600">{col.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecruitmentHierarchyManagement;
