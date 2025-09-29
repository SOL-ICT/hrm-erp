"use client";

import { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Request deduplication to prevent multiple simultaneous identical requests
  const requestCache = new Map();
  const pendingRequests = new Map();

  // Enhanced Sanctum request with better security and deduplication
  const sanctumRequest = async (url, options = {}) => {
    // Handle relative URLs by prepending the backend base URL
    const fullUrl = url.startsWith('/') ? `http://localhost:8000${url}` : url;
    
    // Create a unique key for this request to prevent duplicates
    const requestKey = `${options.method || 'GET'}:${fullUrl}:${JSON.stringify(options.body || {})}`;
    
    // If the same request is already pending, return the existing promise
    if (pendingRequests.has(requestKey)) {
      console.log("🔄 Deduplicating request:", fullUrl);
      return pendingRequests.get(requestKey);
    }

    console.log("🔒 Making authenticated API request to:", fullUrl);

    // Try multiple token storage methods for compatibility
    let bearerToken = null;
    
    if (typeof window !== "undefined") {
      // Method 1: Check for JSON auth data (used by candidate components)
      try {
        const authData = JSON.parse(localStorage.getItem('auth') || '{}');
        bearerToken = authData.access_token;
      } catch (e) {
        console.log("No JSON auth data found");
      }
      
      // Method 2: Check for direct token storage (fallback)
      if (!bearerToken) {
        bearerToken = localStorage.getItem("auth_token") || localStorage.getItem("token");
      }
    }

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest", // This helps with CSRF bypass for SPA
      Origin: window.location.origin, // Explicit origin for CORS validation
      ...options.headers,
    };

    // Only add Bearer token if it's a real token (not session indicator)
    if (bearerToken && bearerToken !== "session-authenticated") {
      headers["Authorization"] = `Bearer ${bearerToken}`;
      console.log("Using token-based authentication");
    } else {
      console.log("Using session-based authentication - No valid token found");
    }

    // Only log headers in development or for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log("Request headers:", headers);
    }

    try {
      // Create the request promise
      const requestPromise = fetch(fullUrl, {
        credentials: "include", // Important for session auth
        ...options,
        headers,
      });

      // Store the pending request to prevent duplicates
      pendingRequests.set(requestKey, requestPromise);

      const response = await requestPromise;

      // Clean up the pending request
      pendingRequests.delete(requestKey);

      // Log response status for debugging
      if (!response.ok) {
        console.warn(`API request failed: ${response.status} ${response.statusText} for ${fullUrl}`);
      }

      return response;
    } catch (error) {
      // Clean up the pending request on error
      pendingRequests.delete(requestKey);
      console.error(`Network error for ${fullUrl}:`, error.message);
      throw error;
    }
  };

  const [userPreferences, setUserPreferences] = useState({
    theme: "light",
    primary_color: "#6366f1",
    language: "en",
  });

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

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if we have a token in localStorage first
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      if (!storedToken) {
        console.log("No stored authentication token found");
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      console.log(
        "Checking authentication with stored token:",
        storedToken ? "Present" : "Missing"
      );

      // Fetch CSRF cookie for Sanctum SPA authentication
      try {
        await fetch("http://localhost:8000/sanctum/csrf-cookie", {
          credentials: "include",
        });
        console.log("✅ CSRF cookie fetched successfully");
      } catch (csrfError) {
        console.warn("⚠️ CSRF cookie fetch failed:", csrfError);
      }

      const response = await fetch("http://localhost:8000/api/user", {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(storedToken && storedToken !== "session-authenticated"
            ? { Authorization: `Bearer ${storedToken}` }
            : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);

          // Set user preferences if they exist
          if (data.user.preferences) {
            setUserPreferences(data.user.preferences);
          }

          console.log("✅ Auth check successful - user:", data.user.email);
        } else {
          console.log("❌ Auth response invalid format:", data);
          throw new Error("Invalid response format");
        }
      } else {
        console.log("❌ Auth check failed - status:", response.status);
        // Clear token if auth fails
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
        }
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      // Clear token on error
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginData) => {
    try {
      // Simplified approach - just use XMLHttpRequest header which backend recognizes
      console.log("Starting login process...");

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

      console.log("Preparing login request:", {
        identifier: loginIdentifier,
        loginType,
        theme,
      });

      // Fetch CSRF cookie before login for Sanctum SPA authentication
      try {
        await fetch("http://localhost:8000/sanctum/csrf-cookie", {
          credentials: "include",
        });
        console.log("✅ CSRF cookie fetched for login");
      } catch (csrfError) {
        console.warn("⚠️ CSRF cookie fetch failed:", csrfError);
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest", // This triggers CSRF bypass in backend
      };

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
      console.log("Available keys in response:", Object.keys(data));
      console.log("Access token in response:", data.access_token ? "YES" : "NO");

      if (response.ok && data.success) {
        setUser(data.user);
        setIsAuthenticated(true);

        // Store the actual Bearer token if available in multiple formats for compatibility
        if (data.access_token) {
          // Method 1: Store as auth_token (existing format)
          localStorage.setItem("auth_token", data.access_token);
          
          // Method 2: Store as JSON in 'auth' key (what InterviewManager expects)
          localStorage.setItem("auth", JSON.stringify({
            access_token: data.access_token,
            user: data.user
          }));
          
          // Method 3: Store as direct token (fallback)
          localStorage.setItem("token", data.access_token);
          
          console.log("✅ Using token-based authentication with Bearer token");
          console.log("✅ Token stored in localStorage - length:", data.access_token.length);
        } else {
          localStorage.setItem("auth_token", "session-authenticated");
          console.log("❌ No access_token found in response, using session-based authentication");
          console.log("Response data structure:", JSON.stringify(data, null, 2));
        }

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
      localStorage.removeItem("auth_token");
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

  // Debug function to check token status
  const getTokenStatus = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    return {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      isAuthenticated,
      userEmail: user?.email || "Not logged in",
    };
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
    getTokenStatus,
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
