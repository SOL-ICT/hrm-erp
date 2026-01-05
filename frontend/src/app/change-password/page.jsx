"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    staff_id: "",
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.new_password !== formData.new_password_confirmation) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (formData.new_password.length < 8) {
      setMessage({
        type: "error",
        text: "New password must be at least 8 characters",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.makeRequest("/password/change", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (response.success) {
        setMessage({
          type: "success",
          text: "Password changed successfully! Redirecting to login...",
        });

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to change password. Please check your details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Change Password
          </h1>
          <p className="text-gray-600">Update your account password</p>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Staff ID */}
          <div>
            <label
              htmlFor="staff_id"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Staff ID / Employee Code
            </label>
            <input
              type="text"
              id="staff_id"
              value={formData.staff_id}
              onChange={(e) =>
                setFormData({ ...formData, staff_id: e.target.value.toUpperCase() })
              }
              required
              placeholder="Enter your Staff ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors uppercase"
            />
          </div>

          {/* Current Password */}
          <div>
            <label
              htmlFor="current_password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="current_password"
                value={formData.current_password}
                onChange={(e) =>
                  setFormData({ ...formData, current_password: e.target.value })
                }
                required
                placeholder="Enter your current password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.current ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="new_password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="new_password"
                value={formData.new_password}
                onChange={(e) =>
                  setFormData({ ...formData, new_password: e.target.value })
                }
                required
                minLength={8}
                placeholder="Enter new password (min. 8 characters)"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.new ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="new_password_confirmation"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="new_password_confirmation"
                value={formData.new_password_confirmation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    new_password_confirmation: e.target.value,
                  })
                }
                required
                placeholder="Confirm your new password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Password Requirements:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center">
                <span
                  className={`mr-2 ${
                    formData.new_password.length >= 8
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {formData.new_password.length >= 8 ? "✓" : "○"}
                </span>
                At least 8 characters
              </li>
              <li className="flex items-center">
                <span
                  className={`mr-2 ${
                    formData.new_password ===
                      formData.new_password_confirmation &&
                    formData.new_password.length > 0
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {formData.new_password ===
                    formData.new_password_confirmation &&
                  formData.new_password.length > 0
                    ? "✓"
                    : "○"}
                </span>
                Passwords match
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Changing Password...
              </span>
            ) : (
              "Change Password"
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
