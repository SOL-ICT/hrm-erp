"use client";

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const HRMLoginPage = () => {
  const { login, loading: authLoading } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [loginType, setLoginType] = useState("candidate"); // Default to candidate
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loginError, setLoginError] = useState("");

  const [formData, setFormData] = useState({
    staffId: "",
    email: "",
    password: "",
    rememberMe: false,
  });

  // Always start with default values on both server and client
  const [settings, setSettings] = useState({
    theme: "dark",
    primaryColor: "#0949b3",
    backgroundImage: "gradient2",
    language: "en",
    deviceType: "auto",
  });

  // Load saved theme from localStorage after mount (client-side only)
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('login_theme');
    const savedColor = localStorage.getItem('login_primary_color');
    if (savedTheme || savedColor) {
      setSettings(prev => ({
        ...prev,
        theme: savedTheme || prev.theme,
        primaryColor: savedColor || prev.primaryColor,
      }));
    }
  }, []);

  // Save theme preference whenever it changes
  React.useEffect(() => {
    localStorage.setItem('login_theme', settings.theme);
    localStorage.setItem('login_primary_color', settings.primaryColor);
  }, [settings.theme, settings.primaryColor]);

  const themes = {
    light: {
      bg: "from-red-700 via-blue-700 to-blue-600",
      cardBg: "bg-white",
      textPrimary: "text-gray-900",
      textSecondary: "text-gray-600",
      inputBg: "bg-gray-50",
      inputBorder: "border-gray-300",
    },
    dark: {
      // Modern dark theme - deep slate with proper depth
      bg: "from-[#0f1419] via-[#1a1f2e] to-[#0a0e17]",
      cardBg: "bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-sm shadow-2xl",
      textPrimary: "text-white",
      textSecondary: "text-slate-300",
      inputBg: "bg-slate-700/50 backdrop-blur-sm",
      inputBorder: "border-slate-600/50",
    },
    transparent: {
      bg: "from-indigo-900/90 via-blue-900/90 to-slate-900/90",
      cardBg: "bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20",
      textPrimary: "text-white",
      textSecondary: "text-white/80",
      inputBg: "bg-white/10 backdrop-blur-sm",
      inputBorder: "border-white/30",
    },
  };

  const currentTheme = themes[settings.theme];

  const colorOptions = [
    { name: "Indigo", value: "#6366f1" },
    { name: "Blue", value: "#0949b3" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
  ];

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Update the handleLogin function in your HRMLoginPage.jsx

  const handleLogin = async () => {
    setLoginError(null);
    setIsLoading(true);

    // Determine identifier and password
    const identifier =
      loginType === "staff" ? formData.staffId : formData.email;
    if (!identifier || !formData.password) {
      setLoginError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    // Prepare login data with theme preferences
    const loginPayload = {
      email: identifier,
      identifier,
      password: formData.password,
      loginType,
      isAdminLogin,
      theme: settings.theme,
      language: settings.language,
      primaryColor: settings.primaryColor,
    };

    console.log("Sending login request with theme preferences:", loginPayload);

    try {
      const result = await login(loginPayload);
      console.log("Login result:", result);

      if (result.success) {
        showNotification("Welcome! Redirecting…", "success");
        // Navigation is handled in AuthContext
      } else {
        setLoginError(result.error);
        showNotification(result.error, "error");
      }
    } catch (error) {
      console.log("Caught error:", error);
      const errorMessage = "Login failed. Please try again.";
      setLoginError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (loginError) setLoginError("");
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setLoginError("");
    // Clear previous input when switching
    setFormData((prev) => ({
      ...prev,
      staffId: "",
      email: "",
    }));
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetAllSettings = () => {
    setSettings({
      theme: "light",
      primaryColor: "#6366f1",
      backgroundImage: "gradient1",
      language: "en",
      deviceType: "auto",
    });
    showNotification("Settings reset successfully!", "success");
  };

  return (
    <div
      className={
        "min-h-screen bg-gradient-to-br " +
        currentTheme.bg +
        " flex items-center justify-center p-4 relative"
      }
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <button
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className={
          "fixed top-6 right-6 z-50 p-3 rounded-full " +
          currentTheme.cardBg +
          " shadow-lg hover:shadow-xl transition-all duration-300 " +
          currentTheme.textPrimary
        }
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {notification && (
        <div
          className={
            "fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white " +
            (notification.type === "success"
              ? "bg-green-500"
              : notification.type === "error"
              ? "bg-red-500"
              : "bg-blue-500")
          }
        >
          {notification.type === "success" ? (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {notification.message}
        </div>
      )}

      <div className="flex w-full max-w-6xl relative">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-start p-12 text-white">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Welcome To
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              STRATEGIC OUTSOURCING LIMITED
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            Your comprehensive Human Resource Management solution. Streamline
            recruitment, manage employee data, and optimize workforce operations
            with our cutting-edge platform designed for modern businesses.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-green-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Multi-client workforce management</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-green-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Advanced role-based access control</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-green-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Seamless candidate onboarding</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div
            className={
              "w-full max-w-md " +
              currentTheme.cardBg +
              " rounded-2xl shadow-2xl p-8 border border-white/10"
            }
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div
                  style={{ backgroundColor: settings.primaryColor }}
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                >
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
              <h2
                className={
                  "text-3xl font-bold " + currentTheme.textPrimary + " mb-2"
                }
              >
                Login
              </h2>
              <p className={currentTheme.textSecondary}>
                Sign in to your account
              </p>
            </div>

            {/* Login Error Display */}
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{loginError}</p>
              </div>
            )}

            <div className="mb-6">
              <div className="flex rounded-lg p-1 bg-gray-100 dark:bg-gray-700">
                <button
                  onClick={() => handleLoginTypeChange("staff")}
                  className={
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 " +
                    (loginType === "staff"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900")
                  }
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10"
                    />
                  </svg>
                  Staff Login
                </button>
                <button
                  onClick={() => handleLoginTypeChange("candidate")}
                  className={
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 " +
                    (loginType === "candidate"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900")
                  }
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Candidate Login
                </button>
              </div>
            </div>

            {loginType === "staff" && (
              <div className="mb-6 flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-amber-800">
                    Admin Access
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAdminLogin}
                    onChange={(e) => setIsAdminLogin(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label
                  className={
                    "block text-sm font-medium " +
                    currentTheme.textPrimary +
                    " mb-2"
                  }
                >
                  {loginType === "staff" ? "Staff ID" : "Email Address"}
                </label>
                <div className="relative">
                  {loginType === "staff" ? (
                    <svg
                      className={
                        "h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 " +
                        currentTheme.textSecondary
                      }
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg>
                  ) : (
                    <svg
                      className={
                        "h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 " +
                        currentTheme.textSecondary
                      }
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                  <input
                    type={loginType === "staff" ? "text" : "email"}
                    name={loginType === "staff" ? "staffId" : "email"}
                    value={
                      loginType === "staff" ? formData.staffId : formData.email
                    }
                    onChange={handleInputChange}
                    placeholder={
                      loginType === "staff"
                        ? "Enter your Staff ID (e.g., STF001)"
                        : "Enter your email address"
                    }
                    className={
                      "w-full pl-10 pr-4 py-3 " +
                      currentTheme.inputBg +
                      " border " +
                      currentTheme.inputBorder +
                      " rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 " +
                      currentTheme.textPrimary
                    }
                    required
                  />
                </div>
                {loginType === "staff" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Staff ID format: STF001, ADM001, etc.
                  </p>
                )}
              </div>

              <div>
                <label
                  className={
                    "block text-sm font-medium " +
                    currentTheme.textPrimary +
                    " mb-2"
                  }
                >
                  Password
                </label>
                <div className="relative">
                  <svg
                    className={
                      "h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 " +
                      currentTheme.textSecondary
                    }
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={
                      "w-full pl-10 pr-12 py-3 " +
                      currentTheme.inputBg +
                      " border " +
                      currentTheme.inputBorder +
                      " rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 " +
                      currentTheme.textPrimary
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={
                      "absolute right-3 top-1/2 transform -translate-y-1/2 " +
                      currentTheme.textSecondary +
                      " hover:opacity-80"
                    }
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className={"ml-2 text-sm " + currentTheme.textSecondary}>
                  Remember me
                </label>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading || authLoading}
                className="w-full py-3 rounded-lg text-white font-semibold text-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Signing In...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>

            <div className="mt-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => (window.location.href = "/forgot-password")}
                  className="text-sm hover:underline"
                  style={{ color: settings.primaryColor }}
                >
                  Forgot Password?
                </button>
                {loginType === "staff" && (
                  <>
                    <span className="text-gray-400">|</span>
                    <button
                      onClick={() => (window.location.href = "/change-password")}
                      className="text-sm hover:underline"
                      style={{ color: settings.primaryColor }}
                    >
                      Change Password
                    </button>
                  </>
                )}
              </div>
              {loginType === "candidate" && (
                <p className={"text-sm " + currentTheme.textSecondary}>
                  Don't have an account?{" "}
                  <button
                    onClick={() => (window.location.href = "/register")}
                    className="hover:underline"
                    style={{ color: settings.primaryColor }}
                  >
                    Register as Candidate
                  </button>
                </p>
              )}
              {loginType === "staff" && (
                <p className={"text-sm " + currentTheme.textSecondary}>
                  New staff member?{" "}
                  <button
                    onClick={() =>
                      (window.location.href = "/staff-registration")
                    }
                    className="hover:underline"
                    style={{ color: settings.primaryColor }}
                  >
                    Staff enrollment here
                  </button>
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-center space-x-4">
              <button className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <span className="text-sm">fb</span>
              </button>
              <button className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-red-500 text-white hover:from-pblue-600 hover:to-pink-600 transition-all">
                <span className="text-sm">ig</span>
              </button>
              <button className="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors">
                <span className="text-sm">tw</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel - keeping your original implementation */}
      <div
        className={
          "fixed top-0 right-0 h-full w-80 " +
          currentTheme.cardBg +
          " shadow-2xl transform transition-transform duration-300 z-40 " +
          (isSettingsOpen ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="p-6 h-full overflow-y-auto">
          <h3
            className={
              "text-xl font-bold " + currentTheme.textPrimary + " mb-6"
            }
          >
            Settings
          </h3>

          <div className="mb-6">
            <h4
              className={
                "text-sm font-semibold " + currentTheme.textPrimary + " mb-3"
              }
            >
              THEME STYLE
            </h4>
            <div className="space-y-3">
              {["light", "dark", "transparent"].map((theme) => (
                <label
                  key={theme}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className={"capitalize " + currentTheme.textSecondary}>
                    {theme} Theme
                  </span>
                  <input
                    type="radio"
                    name="theme"
                    value={theme}
                    checked={settings.theme === theme}
                    onChange={(e) =>
                      handleSettingChange("theme", e.target.value)
                    }
                    className="w-4 h-4"
                    style={{ accentColor: settings.primaryColor }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4
              className={
                "text-sm font-semibold " + currentTheme.textPrimary + " mb-3"
              }
            >
              PRIMARY COLOR
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() =>
                    handleSettingChange("primaryColor", color.value)
                  }
                  className={
                    "w-12 h-12 rounded-lg border-2 " +
                    (settings.primaryColor === color.value
                      ? "border-white shadow-lg"
                      : "border-transparent")
                  }
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4
              className={
                "text-sm font-semibold " + currentTheme.textPrimary + " mb-3"
              }
            >
              LANGUAGE
            </h4>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <select
                value={settings.language}
                onChange={(e) =>
                  handleSettingChange("language", e.target.value)
                }
                className={
                  "flex-1 p-2 rounded " +
                  currentTheme.inputBg +
                  " border " +
                  currentTheme.inputBorder +
                  " " +
                  currentTheme.textPrimary
                }
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>

          <button
            onClick={resetAllSettings}
            className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default HRMLoginPage;
