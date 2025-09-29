"use client";

import { useState } from "react";
import ClientMaster from "@/components/admin/modules/client-contract-management/submodules/client-master/ClientMaster";

// Test page to verify all 4 clients show up
export default function TestAllClientsPage() {
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
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            🧪 Client Master Test - All 4 Clients
          </h1>
          <p className="text-gray-600 mt-2">
            Testing that all 4 clients from the database are displayed:
          </p>
          <ul className="mt-2 text-sm text-gray-700">
            <li>1. Strategic Outsourcing Limited (Financial Services, Corporate)</li>
            <li>2. Access Bank (Banking, Corporate)</li>
            <li>3. First Bank Nigeria (Banking, Corporate)</li>
            <li>4. Zenith Bank PLC (Banking, Corporate)</li>
          </ul>
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
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
            <h2 className="text-lg font-semibold mb-4 text-blue-800">
              Client Master Component (Should show 4 clients)
            </h2>
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
