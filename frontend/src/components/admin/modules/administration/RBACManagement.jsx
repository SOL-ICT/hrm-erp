import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Settings,
  Search,
  Filter,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  Edit3,
  Plus,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { rbacAPI } from "../../../../services/rbacAPI";

const RBACManagement = ({ onBack }) => {
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
  const [activeTab, setActiveTab] = useState("roles");
  const [modules, setModules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());

  // SOL Colors
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";
  const MIDNIGHT_BLUE = "#191970";

  // Load data on component mount
  useEffect(() => {
    loadModulesStructure();
    loadRoles();
  }, []);

  const loadModulesStructure = async () => {
    setLoading(true);
    try {
      const data = await rbacAPI.getModulesStructure();
      if (data.success) {
        setModules(data.data);
      } else {
        console.error("Failed to fetch modules:", data.message);
      }
    } catch (error) {
      console.error("Error loading modules:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await rbacAPI.getRoles();
      if (data.success) {
        setRoles(data.data);
      } else {
        console.error("Failed to fetch roles:", data.message);
      }
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  };

  const loadRolePermissions = async (roleId) => {
    console.log("🔄 Loading permissions for role:", roleId);
    try {
      const data = await rbacAPI.getRolePermissions(roleId);
      console.log("📦 Loaded permissions data:", data);
      
      if (data.success) {
        const permissions = new Set();
        Object.values(data.data.permissions).forEach((modulePerms) => {
          modulePerms.forEach((perm) => permissions.add(perm.id));
        });
        console.log("✅ Processed permissions Set:", Array.from(permissions));
        setSelectedPermissions(permissions);
      }
    } catch (error) {
      console.error("❌ Error loading role permissions:", error);
    }
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    
    console.log("🔄 Saving permissions for role:", selectedRole.id);
    console.log("📦 Permissions to save:", Array.from(selectedPermissions));
    
    try {
      const data = await rbacAPI.updateRolePermissions(
        selectedRole.id,
        Array.from(selectedPermissions)
      );
      
      console.log("✅ Save response:", data);
      
      if (data.success) {
        setSuccess("Role permissions updated successfully");
        
        // Reload the permissions from backend to reflect the saved state
        console.log("🔄 Reloading permissions from backend...");
        await loadRolePermissions(selectedRole.id);
        
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
        
        console.log("Role permissions updated successfully");
      } else {
        setError(data.message || "Failed to update permissions");
        console.error("❌ Failed to update permissions:", data.message);
      }
    } catch (error) {
      setError("An error occurred while saving permissions");
      console.error("❌ Error saving permissions:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    loadRolePermissions(role.id);
  };

  const handlePermissionToggle = (permissionId) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permissionId)) {
      newPermissions.delete(permissionId);
    } else {
      newPermissions.add(permissionId);
    }
    setSelectedPermissions(newPermissions);
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRolesTab = () => (
    <div className="flex h-full">
      {/* Roles List */}
      <div className="w-1/3 border-r border-gray-200 p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleRoleSelect(role)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedRole?.id === role.id
                  ? "bg-blue-50 border border-blue-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{role.name}</h4>
                  <p className="text-sm text-gray-500">{role.slug}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {role.is_active ? (
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  ) : (
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  )}
                </div>
              </div>
              {role.description && (
                <p className="text-xs text-gray-600 mt-1">{role.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="flex-1 p-4">
        {selectedRole ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Permissions for {selectedRole.name}
                </h3>
                <p className="text-gray-600">{selectedRole.description}</p>
              </div>
              <button
                onClick={saveRolePermissions}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>

            <div className="space-y-6">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{module.icon || "📁"}</span>
                      <h4 className="font-semibold text-gray-900">
                        {module.name}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {module.description}
                    </p>
                  </div>

                  <div className="p-4">
                    {module.submodules && module.submodules.length > 0 ? (
                      <div className="space-y-4">
                        {module.submodules.map((submodule) => (
                          <div
                            key={submodule.id}
                            className="border border-gray-100 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {submodule.name}
                                </h5>
                                <p className="text-sm text-gray-500">
                                  {submodule.description}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                              {submodule.permissions &&
                                submodule.permissions.map((permission) => (
                                  <label
                                    key={permission.id}
                                    className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedPermissions.has(
                                        permission.id
                                      )}
                                      onChange={() =>
                                        handlePermissionToggle(permission.id)
                                      }
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      {permission.name}
                                    </span>
                                  </label>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No submodules configured
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Role
              </h3>
              <p className="text-gray-500">
                Choose a role from the list to manage its permissions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          User Permissions Management
        </h3>
        <p className="text-gray-500 mb-6">
          Individual user permission overrides will be available here
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
          Coming Soon
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Administration</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Roles & Permissions Management
              </h1>
              <p className="text-gray-600">
                Configure role-based access control for the system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <p className="text-sm font-medium text-green-800">{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("roles")}
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === "roles"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Role Permissions
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === "users"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            User Overrides
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 h-[calc(100vh-12rem)]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading RBAC data...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "roles" && renderRolesTab()}
            {activeTab === "users" && renderUsersTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default RBACManagement;
