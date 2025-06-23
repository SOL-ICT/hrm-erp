"use client";

import { useAuth } from "../components/AuthContext";

export default function UnauthorizedPage() {
  const { user, getDashboardRoute } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>

          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your
            administrator if you believe this is an error.
          </p>

          <div className="space-y-3">
            <a
              href={getDashboardRoute()}
              className="block w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
            >
              Go to My Dashboard
            </a>

            <p className="text-sm text-gray-500">
              Current Role:{" "}
              <span className="font-medium">
                {user?.user_role || "Unknown"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
