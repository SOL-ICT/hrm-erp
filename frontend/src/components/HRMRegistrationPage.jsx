"use client";

import React, { useState } from "react";

const HRMRegistrationPage = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeToTerms: false,
    subscribeNewsletter: false,
  });

  const [errors, setErrors] = useState({});

  const [settings, setSettings] = useState({
    theme: "light",
    primaryColor: "#6366f1",
    backgroundImage: "gradient1",
    language: "en",
    deviceType: "auto",
  });

  const themes = {
    light: {
      bg: "from-indigo-600 via-purple-600 to-blue-600",
      cardBg: "bg-white",
      textPrimary: "text-gray-900",
      textSecondary: "text-gray-600",
      inputBg: "bg-gray-50",
      inputBorder: "border-gray-300",
    },
    dark: {
      bg: "from-gray-900 via-gray-800 to-black",
      cardBg: "bg-gray-800",
      textPrimary: "text-white",
      textSecondary: "text-gray-300",
      inputBg: "bg-gray-700",
      inputBorder: "border-gray-600",
    },
    transparent: {
      bg: "from-indigo-600/80 via-purple-600/80 to-blue-600/80",
      cardBg: "bg-white/10 backdrop-blur-md",
      textPrimary: "text-white",
      textSecondary: "text-white/70",
      inputBg: "bg-white/20",
      inputBorder: "border-white/30",
    },
  };

  const currentTheme = themes[settings.theme];

  const colorOptions = [
    { name: "Indigo", value: "#6366f1" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
  ];

  const checkPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    return { requirements, score };
  };

  const passwordStrength = checkPasswordStrength(formData.password);

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.password) newErrors.password = "Password is required";
    else if (passwordStrength.score < 3)
      newErrors.password = "Password is too weak";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the terms and conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegistration = async () => {
    if (!validateForm()) {
      showNotification("Please fix the errors in the form.", "error");
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        subscribeNewsletter: formData.subscribeNewsletter,
        theme: settings.theme,
        language: settings.language,
      };

      console.log("Registration data:", registrationData);

      setCurrentStep(3);
      showNotification(
        "Registration successful! Please check your email for verification.",
        "success"
      );
    } catch (error) {
      showNotification("Registration failed. Please try again.", "error");
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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
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

  const renderRegistrationForm = () => {
    if (currentStep === 3) {
      return (
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2
              className={
                "text-3xl font-bold " + currentTheme.textPrimary + " mb-2"
              }
            >
              Registration Successful!
            </h2>
            <p className={currentTheme.textSecondary + " mb-6"}>
              We've sent a verification email to{" "}
              <strong>{formData.email}</strong>
            </p>
          </div>

          <div className={currentTheme.inputBg + " p-4 rounded-lg mb-6"}>
            <h3
              className={"font-semibold " + currentTheme.textPrimary + " mb-2"}
            >
              Next Steps:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className={currentTheme.textSecondary}>
                  Check your email inbox
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className={currentTheme.textSecondary}>
                  Click the verification link
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className={currentTheme.textSecondary}>
                  Complete your profile
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className={currentTheme.textSecondary}>
                  Start applying for jobs
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/login")}
              className="w-full py-3 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg"
              style={{ backgroundColor: settings.primaryColor }}
            >
              Go to Login
            </button>
            <button
              onClick={() =>
                showNotification("Verification email resent!", "success")
              }
              className={
                "w-full py-3 rounded-lg border-2 font-semibold transition-all duration-200 " +
                currentTheme.textPrimary
              }
              style={{
                borderColor: settings.primaryColor,
                color: settings.primaryColor,
              }}
            >
              Resend Verification Email
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className={
                "block text-sm font-medium " +
                currentTheme.textPrimary +
                " mb-2"
              }
            >
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="John"
              className={
                "w-full px-4 py-3 " +
                currentTheme.inputBg +
                " border " +
                (errors.firstName
                  ? "border-red-500"
                  : currentTheme.inputBorder) +
                " rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 " +
                currentTheme.textPrimary
              }
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
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
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Doe"
              className={
                "w-full px-4 py-3 " +
                currentTheme.inputBg +
                " border " +
                (errors.lastName
                  ? "border-red-500"
                  : currentTheme.inputBorder) +
                " rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 " +
                currentTheme.textPrimary
              }
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label
            className={
              "block text-sm font-medium " + currentTheme.textPrimary + " mb-2"
            }
          >
            Email Address *
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
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john.doe@example.com"
              className={
                "w-full pl-10 pr-4 py-3 " +
                currentTheme.inputBg +
                " border " +
                (errors.email ? "border-red-500" : currentTheme.inputBorder) +
                " rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 " +
                currentTheme.textPrimary
              }
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            className={
              "block text-sm font-medium " + currentTheme.textPrimary + " mb-2"
            }
          >
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+234 801 234 5678"
            className={
              "w-full px-4 py-3 " +
              currentTheme.inputBg +
              " border " +
              (errors.phone ? "border-red-500" : currentTheme.inputBorder) +
              " rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 " +
              currentTheme.textPrimary
            }
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label
            className={
              "block text-sm font-medium " + currentTheme.textPrimary + " mb-2"
            }
          >
            Password *
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
              placeholder="Create a strong password"
              className={
                "w-full pl-10 pr-12 py-3 " +
                currentTheme.inputBg +
                " border " +
                (errors.password
                  ? "border-red-500"
                  : currentTheme.inputBorder) +
                " rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 " +
                currentTheme.textPrimary
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={
                "absolute right-3 top-1/2 transform -translate-y-1/2 " +
                currentTheme.textSecondary
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

          {formData.password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={
                      "h-1 flex-1 rounded " +
                      (level <= passwordStrength.score
                        ? passwordStrength.score <= 2
                          ? "bg-red-500"
                          : passwordStrength.score <= 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-gray-300")
                    }
                  />
                ))}
              </div>
              <div className="text-xs mt-1 space-y-1">
                {Object.entries(passwordStrength.requirements).map(
                  ([req, met]) => (
                    <div
                      key={req}
                      className={
                        met
                          ? "text-green-600"
                          : "text-gray-400" + " flex items-center gap-1"
                      }
                    >
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        {req === "length" && "8+ characters"}
                        {req === "uppercase" && "Uppercase letter"}
                        {req === "lowercase" && "Lowercase letter"}
                        {req === "number" && "Number"}
                        {req === "special" && "Special character"}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label
            className={
              "block text-sm font-medium " + currentTheme.textPrimary + " mb-2"
            }
          >
            Confirm Password *
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
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              className={
                "w-full pl-10 pr-12 py-3 " +
                currentTheme.inputBg +
                " border " +
                (errors.confirmPassword
                  ? "border-red-500"
                  : currentTheme.inputBorder) +
                " rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 " +
                currentTheme.textPrimary
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={
                "absolute right-3 top-1/2 transform -translate-y-1/2 " +
                currentTheme.textSecondary
              }
            >
              {showConfirmPassword ? (
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
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className={
                "mt-1 w-4 h-4 rounded border-gray-300 " +
                (errors.agreeToTerms ? "border-red-500" : "")
              }
              style={{ accentColor: settings.primaryColor }}
            />
            <span className={"text-sm " + currentTheme.textSecondary}>
              I agree to the{" "}
              <button
                className="underline"
                style={{ color: settings.primaryColor }}
              >
                Terms and Conditions
              </button>{" "}
              and{" "}
              <button
                className="underline"
                style={{ color: settings.primaryColor }}
              >
                Privacy Policy
              </button>
              *
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="subscribeNewsletter"
              checked={formData.subscribeNewsletter}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-gray-300"
              style={{ accentColor: settings.primaryColor }}
            />
            <span className={"text-sm " + currentTheme.textSecondary}>
              Subscribe to our newsletter for job updates and company news
            </span>
          </label>
        </div>

        <button
          onClick={handleRegistration}
          disabled={isLoading}
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
              Creating Account...
            </>
          ) : (
            <>
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Create Account
            </>
          )}
        </button>
      </div>
    );
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

      <button
        onClick={() => (window.location.href = "/login")}
        className={
          "fixed top-6 left-6 z-50 p-3 rounded-full " +
          currentTheme.cardBg +
          " shadow-lg hover:shadow-xl transition-all duration-300 " +
          currentTheme.textPrimary +
          " flex items-center gap-2"
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
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span className="hidden sm:inline">Back to Login</span>
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
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Join Our
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Talent Network
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            Create your candidate profile and unlock access to exciting career
            opportunities. Connect with top employers, showcase your skills, and
            take the next step in your professional journey with our
            comprehensive HRM platform.
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
              <span>Access to exclusive job opportunities</span>
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
              <span>Professional profile builder</span>
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
              <span>Real-time application tracking</span>
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
              <span>Direct communication with HR teams</span>
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
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
              </div>
              <h2
                className={
                  "text-3xl font-bold " + currentTheme.textPrimary + " mb-2"
                }
              >
                {currentStep === 3 ? "Welcome!" : "Create Account"}
              </h2>
              <p className={currentTheme.textSecondary}>
                {currentStep === 3
                  ? "Your account has been created successfully"
                  : "Join our platform and start your career journey"}
              </p>
            </div>

            {currentStep !== 3 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={"text-xs " + currentTheme.textSecondary}>
                    Step {currentStep} of 2
                  </span>
                  <span className={"text-xs " + currentTheme.textSecondary}>
                    {currentStep === 1 ? "Account Details" : "Verification"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: settings.primaryColor,
                      width: (currentStep / 2) * 100 + "%",
                    }}
                  />
                </div>
              </div>
            )}

            {renderRegistrationForm()}

            {currentStep !== 3 && (
              <div className="mt-6 text-center">
                <p className={"text-sm " + currentTheme.textSecondary}>
                  Already have an account?{" "}
                  <button
                    onClick={() => (window.location.href = "/login")}
                    className="hover:underline"
                    style={{ color: settings.primaryColor }}
                  >
                    Sign In
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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

export default HRMRegistrationPage;
