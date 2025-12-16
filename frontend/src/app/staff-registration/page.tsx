"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { staffRegistrationAPI } from "@/services/modules/auth/staffRegistrationAPI";

// Type definitions
interface Client {
  id: number;
  organisation_name: string;
}

interface StaffMember {
  staff_id: number;
  employee_code: string;
  staff_internal_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
}

interface LoginCredentials {
  id: number;
  email: string;
  staff_id: number;
  access_token: string;
  username: string;
  display_name: string;
}

interface APIError {
  message: string;
  status?: number;
}

interface FormData {
  email: string;
  clientId: string;
  password: string;
  passwordConfirmation: string;
}

export default function StaffRegistrationPage() {
  const router = useRouter();

  // Form states
  const [step, setStep] = useState<number>(1); // 1: Search, 2: Confirm, 3: Create Password
  const [formData, setFormData] = useState<FormData>({
    email: "",
    clientId: "",
    password: "",
    passwordConfirmation: "",
  });

  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [foundStaff, setFoundStaff] = useState<StaffMember | null>(null);
  const [loginCredentials, setLoginCredentials] =
    useState<LoginCredentials | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Load clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await staffRegistrationAPI.getClients();
      if (response.success) {
        setClients(response.data);
      }
    } catch (error) {
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email || !formData.clientId) {
      setError("Please enter your email and select your organization");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await staffRegistrationAPI.searchStaff(
        formData.email,
        formData.clientId
      );

      if (response.success) {
        setFoundStaff(response.data);
        setStep(2);
        setSuccess(response.message);
      }
    } catch (error) {
      const apiError = error as APIError;
      setError(apiError.message || "Staff record not found");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.password || !formData.passwordConfirmation) {
      setError("Please enter and confirm your password");
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!foundStaff) {
      setError("Staff information not found");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await staffRegistrationAPI.createUserAccount(
        foundStaff.staff_id,
        formData.password,
        formData.passwordConfirmation
      );

      if (response.success) {
        setStep(4);
        setLoginCredentials(response.data.login_credentials);
        setSuccess(response.message || "Account created successfully!");

        // Redirect to login after 5 seconds (increased time to read credentials)
        setTimeout(() => {
          router.push("/login");
        }, 5000);
      }
    } catch (error) {
      const apiError = error as APIError;
      setError(apiError.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">SOL</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Staff Account Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your user account using your staff record
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div
                className={`flex items-center ${
                  step >= 1 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step >= 1
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {step > 1 ? "✓" : "1"}
                </div>
                <span className="ml-2 text-sm font-medium">Search</span>
              </div>

              <div
                className={`flex items-center ${
                  step >= 2 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step >= 2
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {step > 2 ? "✓" : "2"}
                </div>
                <span className="ml-2 text-sm font-medium">Confirm</span>
              </div>

              <div
                className={`flex items-center ${
                  step >= 3 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step >= 3
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {step > 3 ? "✓" : "3"}
                </div>
                <span className="ml-2 text-sm font-medium">Create</span>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Step 1: Search for Staff */}
          {step === 1 && (
            <form onSubmit={handleSearchStaff} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your work email address"
                />
              </div>

              <div>
                <label
                  htmlFor="client"
                  className="block text-sm font-medium text-gray-700"
                >
                  Organization
                </label>
                <select
                  id="client"
                  required
                  value={formData.clientId}
                  onChange={(e) =>
                    setFormData({ ...formData, clientId: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select your organization</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.organisation_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search Staff Record"}
              </button>
            </form>
          )}

          {/* Step 2: Confirm Staff Details */}
          {step === 2 && foundStaff && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Confirm Your Details
                </h3>
                <p className="text-sm text-gray-600">
                  Please verify this is your staff record
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Employee Code:
                    </span>
                    <p>{foundStaff.employee_code}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Staff ID:</span>
                    <p>{foundStaff.staff_internal_id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      First Name:
                    </span>
                    <p>{foundStaff.first_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Last Name:
                    </span>
                    <p>{foundStaff.last_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p>{foundStaff.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">
                      Department:
                    </span>
                    <p>{foundStaff.department || "Not specified"}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Confirm & Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Create Password */}
          {step === 3 && foundStaff && (
            <form onSubmit={handleCreateAccount} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Create Your Password
                </h3>
                <p className="text-sm text-gray-600">
                  Choose a secure password for your account
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter password (minimum 8 characters)"
                  minLength={8}
                />
              </div>

              <div>
                <label
                  htmlFor="passwordConfirmation"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  type="password"
                  required
                  value={formData.passwordConfirmation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      passwordConfirmation: e.target.value,
                    })
                  }
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          {/* Success State */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Account Created Successfully!
                </h3>
                <p className="text-sm text-gray-600 mt-2">{success}</p>
              </div>

              {/* Login Credentials Display */}
              {loginCredentials && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h4 className="text-md font-semibold text-blue-900">
                    🔑 Your Login Credentials
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center bg-white p-2 rounded border">
                      <span className="font-medium text-gray-700">
                        Username:
                      </span>
                      <span className="font-mono text-blue-600 font-bold">
                        {loginCredentials.username}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded border">
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="text-gray-600">
                        {loginCredentials.email}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded border">
                      <span className="font-medium text-gray-700">Name:</span>
                      <span className="text-gray-600">
                        {loginCredentials.display_name}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                    💡 <strong>Important:</strong> Please remember your username{" "}
                    <strong>{loginCredentials.username}</strong> for future
                    logins.
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600">
                You will be redirected to the login page in 5 seconds, or click
                below to go now.
              </p>

              <button
                onClick={() => router.push("/login")}
                className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login Now
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
