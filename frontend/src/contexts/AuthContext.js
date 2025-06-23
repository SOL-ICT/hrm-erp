"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/check", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginData) => {
    console.log("🚀 AuthContext login called with:", loginData);
    setLoading(true);

    try {
      console.log("📡 Making API request to: http://localhost:8000/api/login");

      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      console.log("📥 API Response status:", response.status);
      const data = await response.json();
      console.log("📋 API Response data:", data);

      if (response.ok && data.status === "success") {
        setUser(data.session);
        setIsAuthenticated(true);

        // Redirect to appropriate dashboard
        const dashboardRoute = `/dashboard/${data.session.dashboard_type}`;
        router.push(dashboardRoute);

        return { success: true, data };
      } else {
        return {
          success: false,
          error: data.message || "Login failed",
        };
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:8000/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      router.push("/login");
    }
  };

  const register = async (registerData) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        return { success: true, data };
      } else {
        return {
          success: false,
          error: data.message || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role) => {
    return user?.user_role === role;
  };

  const hasPermission = (permission) => {
    // You can expand this based on your permission system
    if (user?.user_role === "admin") return true;
    if (
      user?.user_role === "staff" &&
      ["view_candidates", "edit_assigned"].includes(permission)
    )
      return true;
    if (
      user?.user_role === "candidate" &&
      ["view_profile", "edit_profile"].includes(permission)
    )
      return true;
    return false;
  };

  const getDashboardRoute = () => {
    if (!user) return "/login";
    return `/dashboard/${user.dashboard_type}`;
  };

  const getUserPreferences = () => {
    return (
      user?.preferences || {
        theme: "light",
        language: "en",
        primary_color: "#6366f1",
      }
    );
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    checkAuth,
    hasRole,
    hasPermission,
    getDashboardRoute,
    getUserPreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
