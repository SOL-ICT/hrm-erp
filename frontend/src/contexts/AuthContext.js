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

  // Enhanced cookie helper with URL decoding
  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop().split(";").shift();
      // URL decode the cookie value
      return decodeURIComponent(cookieValue);
    }
    return null;
  };

  // Enhanced Sanctum CSRF setup
  const sanctumRequest = async (url, options = {}) => {
    const method = options.method?.toUpperCase();

    // Get CSRF cookie first for stateful requests
    if (method && ["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      try {
        await fetch("http://localhost:8000/sanctum/csrf-cookie", {
          credentials: "include",
        });

        // Small delay to ensure cookie is set
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error("Failed to fetch CSRF cookie:", error);
      }
    }

    // Get the CSRF token
    const csrfToken = getCookie("XSRF-TOKEN");

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options.headers,
    };

    // Add CSRF token to headers if available
    if (csrfToken) {
      headers["X-XSRF-TOKEN"] = csrfToken;
    }

    console.log("Making request with headers:", headers);
    console.log("CSRF Token:", csrfToken);

    return fetch(url, {
      credentials: "include",
      headers,
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
      // First, ensure we get a fresh CSRF cookie
      console.log("Getting CSRF cookie...");
      await fetch("http://localhost:8000/sanctum/csrf-cookie", {
        method: "GET",
        credentials: "include",
      });

      // Wait a bit for cookie to be set
      await new Promise((resolve) => setTimeout(resolve, 100));

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

      // Get the CSRF token and decode it properly
      const csrfToken = getCookie("XSRF-TOKEN");
      console.log("Raw CSRF Token from cookie:", csrfToken);

      if (!csrfToken) {
        console.error("No CSRF token found in cookies");
        // Try to get cookies again
        const allCookies = document.cookie;
        console.log("All cookies:", allCookies);
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      };

      // Add CSRF token if available
      if (csrfToken) {
        headers["X-XSRF-TOKEN"] = csrfToken;
      }

      console.log("Login request headers:", headers);

      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        credentials: "include",
        headers,
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
    sanctumRequest,
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
