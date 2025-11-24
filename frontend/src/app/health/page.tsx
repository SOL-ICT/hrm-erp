"use client";

import { useState, useEffect } from "react";

export default function HealthCheck() {
  const [apiStatus, setApiStatus] = useState("⏳ Connecting...");
  const [apiStatusColor, setApiStatusColor] = useState("text-yellow-600");
  const [dbStatus, setDbStatus] = useState("⏳ Checking...");
  const [dbStatusColor, setDbStatusColor] = useState("text-yellow-600");
  const [lastChecked, setLastChecked] = useState<string>("");

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const baseUrl = apiUrl.replace("/api", "");
        const response = await fetch(`${baseUrl}/api/health`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "ok") {
            setApiStatus("✓ Connected");
            setApiStatusColor("text-green-600");

            if (data.database === "connected") {
              setDbStatus("✓ Connected");
              setDbStatusColor("text-green-600");
            } else {
              setDbStatus("✗ Error");
              setDbStatusColor("text-red-600");
            }
          } else {
            setApiStatus("⚠ Partial");
            setApiStatusColor("text-yellow-600");
          }
        } else {
          setApiStatus("✗ Error");
          setApiStatusColor("text-red-600");
          setDbStatus("✗ Unknown");
          setDbStatusColor("text-gray-600");
        }
      } catch {
        setApiStatus("✗ Offline");
        setApiStatusColor("text-red-600");
        setDbStatus("✗ Unknown");
        setDbStatusColor("text-gray-600");
      }

      // Update timestamp after check
      setLastChecked(new Date().toLocaleString());
    };

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          System Health Check
        </h1>
        <p className="text-lg text-gray-600 mb-8">HRM ERP System Status</p>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Frontend:</span>
              <span className="text-green-600">✓ Running</span>
            </div>
            <div className="flex justify-between">
              <span>API:</span>
              <span className={apiStatusColor}>{apiStatus}</span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className={dbStatusColor}>{dbStatus}</span>
            </div>
          </div>
        </div>

        {lastChecked && (
          <div className="text-sm text-gray-500">
            Last checked: {lastChecked}
          </div>
        )}
      </div>
    </div>
  );
}
