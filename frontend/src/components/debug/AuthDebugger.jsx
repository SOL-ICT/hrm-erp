"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";

const AuthDebugger = () => {
  const { isAuthenticated, user, getTokenStatus } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [isOptimized, setIsOptimized] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true); // Add collapsed state

  useEffect(() => {
    if (typeof window !== "undefined" && window.optimizedAPI) {
      setIsOptimized(true);
    }

    // Get token status
    if (typeof window !== "undefined" && getTokenStatus) {
      setTokenStatus(getTokenStatus());
    }
  }, [getTokenStatus]);

  // Update token status when auth state changes
  useEffect(() => {
    if (typeof window !== "undefined" && getTokenStatus) {
      setTokenStatus(getTokenStatus());
    }
  }, [isAuthenticated, user, getTokenStatus]);

  const testAPI = async () => {
    try {
      setTestResult("Testing...");
      const start = performance.now();

      let response;
      if (isOptimized && window.optimizedAPI) {
        response = await window.optimizedAPI.request("/api/user", {
          priority: "high",
          cache: true,
        });
      } else {
        response = await apiService.makeRequest("/user");
      }

      const duration = Math.round(performance.now() - start);
      setTestResult(
        `Success (${duration}ms): ${JSON.stringify(response, null, 2)}`
      );
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-green-400 rounded-lg text-xs font-mono z-50 max-w-sm">
      {/* Collapsible Header */}
      <div
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-800 rounded-t-lg"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-white font-bold">
          🔐 Auth Debug {isOptimized && "⚡"}
        </h3>
        <span className="text-white text-lg">{isCollapsed ? "▼" : "▲"}</span>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-4 pt-0">
          <div className="space-y-1 mb-3">
            <div>Status: {isAuthenticated ? "✅" : "❌"}</div>
            <div>User: {user?.username || user?.email || "None"}</div>
            <div>Mode: {isOptimized ? "⚡ Optimized" : "📡 Standard"}</div>
            {tokenStatus && (
              <>
                <div>
                  Token: {tokenStatus.hasToken ? "✅ Present" : "❌ Missing"}
                </div>
                <div>Token Length: {tokenStatus.tokenLength || 0}</div>
                {typeof window !== "undefined" &&
                  localStorage.getItem("auth_token") && (
                    <div className="text-xs text-gray-300 break-all">
                      Bearer:{" "}
                      {localStorage.getItem("auth_token")?.substring(0, 20)}...
                    </div>
                  )}
              </>
            )}
          </div>
          <button
            onClick={testAPI}
            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white text-xs mb-2"
          >
            Test API
          </button>
          {testResult && (
            <div className="mt-2 p-2 bg-gray-800 rounded max-h-32 overflow-auto">
              <pre className="whitespace-pre-wrap text-xs">{testResult}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthDebugger;
