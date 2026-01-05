"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post("/password/forgot", { staff_id: staffId });
      
      if (response.success) {
        setEmailSent(true);
        setResetInfo({
          maskedEmail: response.masked_email,
          staffName: response.staff_name,
        });
        setMessage({
          type: "success",
          text: response.message || "Password reset link sent to your email!",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Staff ID not found. Please check and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
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
            Forgot Password?
          </h1>
          <p className="text-gray-600">
            {emailSent
              ? "Check your email for the reset link"
              : "Enter your Staff ID to receive a password reset link"}
          </p>
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

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Staff ID Input */}
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
                value={staffId}
                onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                required
                placeholder="Enter your Staff ID (e.g., SOL001)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors uppercase"
              />
              <p className="mt-2 text-xs text-gray-500">
                💡 Your Staff ID is on your employee badge or payslip
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
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
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center mb-3">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  ✅ Reset link sent successfully!
                </p>
                {resetInfo && (
                  <p className="text-xs text-blue-700">
                    Staff: {resetInfo.staffName}
                  </p>
                )}
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 mb-1">📧 Email sent to:</p>
                <p className="font-mono font-semibold text-blue-900">
                  {resetInfo?.maskedEmail}
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>⏰ Important:</strong> The reset link expires in 60 minutes.
                Check your spam/junk folder if you don't see it.
              </p>
            </div>
            <button
              onClick={() => {
                setEmailSent(false);
                setMessage(null);
                setStaffId("");
                setResetInfo(null);
              }}
              className="w-full text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              ← Didn't receive the email? Try again
            </button>
          </div>
        )}

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
