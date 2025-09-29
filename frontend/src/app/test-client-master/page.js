"use client";

import { useState } from "react";
import ClientMaster from "@/components/admin/modules/client-contract-management/submodules/client-master/ClientMaster";

// Simple test page to verify Client Master functionality
export default function TestClientMasterPage() {
  const [showComponent, setShowComponent] = useState(true);

  // Mock theme for testing
  const currentTheme = {
    bg: "bg-gray-50",
    cardBg: "bg-white",
    textPrimary: "text-gray-900",
    textSecondary: "text-gray-600",
    border: "border-gray-200",
    accent: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Client Master Test Page
          </h1>
          <p className="text-gray-600 mt-2">
            Testing Client Master component with bypassed authentication
          </p>
          <div className="mt-4">
            <button
              onClick={() => setShowComponent(!showComponent)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {showComponent ? "Hide" : "Show"} Client Master
            </button>
          </div>
        </div>
        
        {showComponent && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <ClientMaster 
              currentTheme={currentTheme}
              onClose={() => setShowComponent(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
