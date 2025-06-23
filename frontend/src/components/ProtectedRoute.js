"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({
  children,
  requiredRole = null,
  requiredPermission = null,
  redirectTo = "/login",
}) => {
  const { user, loading, isAuthenticated, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      if (requiredRole && !hasRole(requiredRole)) {
        // Redirect to appropriate dashboard if wrong role
        const userDashboard = `/dashboard/${
          user?.dashboard_type || "candidate"
        }`;
        router.push(userDashboard);
        return;
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [
    loading,
    isAuthenticated,
    user,
    requiredRole,
    requiredPermission,
    router,
    redirectTo,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null; // Will redirect via useEffect
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null; // Will redirect via useEffect
  }

  return children;
};

export default ProtectedRoute;
