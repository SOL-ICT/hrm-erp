/**
 * RBAC Context for Frontend Permission Management
 *
 * This context provides permission checking for SOL staff in the admin dashboard
 * It integrates with the backend RBAC system to ensure UI elements are shown/hidden
 * based on user permissions.
 */

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const RBACContext = createContext();

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
};

export const RBACProvider = ({ children }) => {
  const { user, sanctumRequest } = useAuth();
  const [permissions, setPermissions] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState([]);

  // Load user permissions on mount and when user changes
  useEffect(() => {
    if (user) {
      loadUserPermissions();
    } else {
      setPermissions(new Map());
      setUserRoles([]);
      setLoading(false);
    }
  }, [user]);

  /**
   * Load user's permissions from backend
   */
  const loadUserPermissions = async () => {
    try {
      setLoading(true);

      const response = await sanctumRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/rbac/me/permissions`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("RBAC API Response:", data); // Debug log

        if (data.success) {
          const permissionMap = new Map();

          // Set user roles
          if (data.data.roles) {
            setUserRoles(data.data.roles.map((role) => role.slug));
            console.log(
              "User roles set:",
              data.data.roles.map((role) => role.slug)
            ); // Debug log
          }

          // Process permissions object directly (new API format)
          if (data.data.permissions) {
            Object.entries(data.data.permissions).forEach(([key, value]) => {
              permissionMap.set(key, value);
            });
            console.log(
              "Permissions loaded:",
              permissionMap.size,
              "permissions"
            ); // Debug log
          }

          // Legacy: Process role-based permissions array
          if (data.data.rolePermissions) {
            data.data.rolePermissions.forEach((permission) => {
              const key = `${permission.submodule.module.slug}.${permission.submodule.slug}.${permission.slug}`;
              permissionMap.set(key, true);
            });
          }

          // Process direct user permissions (overrides)
          if (data.data.userPermissions) {
            data.data.userPermissions.forEach((permission) => {
              const key = `${permission.submodule.module.slug}.${permission.submodule.slug}.${permission.slug}`;
              permissionMap.set(key, true);
            });
          }

          // Process denied permissions (explicit denials)
          if (data.data.deniedPermissions) {
            data.data.deniedPermissions.forEach((permission) => {
              const key = `${permission.submodule.module.slug}.${permission.submodule.slug}.${permission.slug}`;
              permissionMap.set(key, false);
            });
          }

          setPermissions(permissionMap);

          // Extract user roles
          if (data.data.user?.staffProfile?.roles) {
            setUserRoles(
              data.data.user.staffProfile.roles.map((role) => role.slug)
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading user permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has specific permission
   *
   * @param {string} module - Module slug (e.g., 'hr-payroll-management')
   * @param {string} submodule - Submodule slug (e.g., 'payroll-processing')
   * @param {string} permission - Permission type ('read', 'write', 'delete', 'full')
   * @returns {boolean}
   */
  const hasPermission = (module, submodule, permission = "read") => {
    if (loading || !user) return false;

    // Check specific permission
    const key = `${module}.${submodule}.${permission}`;
    const hasSpecificPermission = permissions.get(key);

    // If explicit permission exists (true/false), use it
    if (hasSpecificPermission !== undefined) {
      return hasSpecificPermission;
    }

    // Check for 'full' permission as fallback
    const fullKey = `${module}.${submodule}.full`;
    const hasFullPermission = permissions.get(fullKey);

    if (hasFullPermission !== undefined) {
      return hasFullPermission;
    }

    return false;
  };

  /**
   * Check if user has any permission for a module/submodule
   */
  const hasAnyPermission = (module, submodule) => {
    if (loading || !user) return false;

    const permissionTypes = ["read", "write", "delete", "full"];

    return permissionTypes.some((permission) =>
      hasPermission(module, submodule, permission)
    );
  };

  /**
   * Check if user can access a module (has any permission for any submodule)
   */
  const canAccessModule = (module) => {
    if (loading || !user) return false;

    // Dashboard is always accessible for authenticated admin users
    if (module === "dashboard") {
      return true;
    }

    // Check if user has any permission in this module
    for (const [key, value] of permissions.entries()) {
      if (key.startsWith(`${module}.`) && value === true) {
        return true;
      }
    }

    return false;
  };

  /**
   * Get user's role slugs
   */
  const getUserRoles = () => userRoles;

  /**
   * Check if user has specific role
   */
  const hasRole = (roleSlug) => {
    return userRoles.includes(roleSlug);
  };

  /**
   * Check if user is admin (any admin role)
   */
  const isAdmin = () => {
    return userRoles.some((role) =>
      ["super-admin", "admin", "global-admin"].includes(role)
    );
  };

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = () => {
    return (
      userRoles.includes("super-admin") || userRoles.includes("global-admin")
    );
  };

  /**
   * Refresh permissions (useful after role changes)
   */
  const refreshPermissions = async () => {
    if (user) {
      await loadUserPermissions();
    }
  };

  const value = {
    permissions,
    loading,
    userRoles,
    hasPermission,
    hasAnyPermission,
    canAccessModule,
    getUserRoles,
    hasRole,
    isAdmin,
    isSuperAdmin,
    refreshPermissions,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
};

/**
 * HOC to wrap components that need RBAC protection
 */
export const withRBAC = (
  WrappedComponent,
  module,
  submodule,
  permission = "read"
) => {
  return function RBACProtectedComponent(props) {
    const { hasPermission, loading } = useRBAC();

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-500">Checking permissions...</div>
        </div>
      );
    }

    if (!hasPermission(module, submodule, permission)) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">🔒</div>
            <div className="text-gray-600">Access Denied</div>
            <div className="text-gray-400 text-sm">
              You don't have permission to view this resource
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

/**
 * Component to conditionally render children based on permissions
 */
export const RBACGuard = ({
  module,
  submodule,
  permission = "read",
  children,
  fallback = null,
  requireAll = false, // If true, requires all permissions; if false, requires any
}) => {
  const { hasPermission, hasAnyPermission, loading } = useRBAC();

  if (loading) {
    return fallback;
  }

  const hasAccess = requireAll
    ? hasPermission(module, submodule, permission)
    : hasAnyPermission(module, submodule);

  return hasAccess ? children : fallback;
};

export default RBACContext;
