// src/contexts/AuthContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    theme: "light",
    primary_color: "#6366f1",
    language: "en",
  });
  const router = useRouter();

  // Sanctum CSRF setup
  const sanctumRequest = async (url, options = {}) => {
    // Get CSRF cookie first for stateful requests
    if (
      options.method &&
      ["POST", "PUT", "DELETE", "PATCH"].includes(options.method.toUpperCase())
    ) {
      await fetch("http://localhost:8000/sanctum/csrf-cookie", {
        credentials: "include",
      });
    }

    return fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...options.headers,
      },
      ...options,
    });
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await sanctumRequest("http://localhost:8000/api/user");

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setIsAuthenticated(true);

        // Set user preferences if they exist
        if (userData.user.preferences) {
          setUserPreferences(userData.user.preferences);
        }
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
    try {
      // Get CSRF cookie first
      await fetch("http://localhost:8000/sanctum/csrf-cookie", {
        credentials: "include",
      });

      const {
        email,
        identifier,
        password,
        loginType,
        isAdminLogin,
        theme,
        language,
        primaryColor,
      } = loginData;

      const loginIdentifier = identifier || email;

      console.log("Preparing login request with Sanctum:", {
        identifier: loginIdentifier,
        loginType,
        theme,
      });

      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password,
          login_type: loginType,
          is_admin: isAdminLogin || false,
          preferences: {
            theme: theme || "light",
            language: language || "en",
            primary_color: primaryColor || "#6366f1",
          },
        }),
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok && data.success) {
        setUser(data.user);
        setIsAuthenticated(true);

        const preferences = {
          theme: theme || "light",
          language: language || "en",
          primary_color: primaryColor || "#6366f1",
        };
        setUserPreferences(preferences);

        const dashboardPath = `/dashboard/${
          data.user.dashboard_type || "candidate"
        }`;
        router.push(dashboardPath);

        return { success: true, user: data.user };
      } else {
        console.error("Login failed:", data);
        return {
          success: false,
          error: data.message || "Login failed",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error:
          "Network error occurred. Please check your connection and try again.",
      };
    }
  };

  const logout = async () => {
    try {
      await sanctumRequest("http://localhost:8000/api/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setUserPreferences({
        theme: "light",
        primary_color: "#6366f1",
        language: "en",
      });
      router.push("/login");
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await sanctumRequest(
        "http://localhost:8000/api/user/preferences",
        {
          method: "PUT",
          body: JSON.stringify(newPreferences),
        }
      );

      if (response.ok) {
        setUserPreferences((prev) => ({ ...prev, ...newPreferences }));
        return { success: true };
      } else {
        return { success: false, error: "Failed to update preferences" };
      }
    } catch (error) {
      console.error("Update preferences error:", error);
      return { success: false, error: "Network error occurred" };
    }
  };

  const hasRole = (role) => {
    return user?.dashboard_type === role || user?.role === role;
  };

  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission) || false;
  };

  const getUserPreferences = () => {
    return userPreferences;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    hasRole,
    hasPermission,
    getUserPreferences,
    updatePreferences,
    userPreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
