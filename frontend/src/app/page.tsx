"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [apiStatus, setApiStatus] = useState("⏳ Connecting...");
  const [apiStatusColor, setApiStatusColor] = useState("text-yellow-600");

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/health");
        if (response.ok) {
          const data = await response.json();
          if (data.status === "ok") {
            setApiStatus("✓ Connected");
            setApiStatusColor("text-green-600");
          } else {
            setApiStatus("⚠ Partial");
            setApiStatusColor("text-yellow-600");
          }
        } else {
          setApiStatus("✗ Error");
          setApiStatusColor("text-red-600");
        }
      } catch {
        setApiStatus("✗ Offline");
        setApiStatusColor("text-red-600");
      }
    };

    // Check immediately
    checkApiStatus();

    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          HRM ERP System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to your Human Resource Management System
        </p>

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
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              Employee Login
            </Link>
            <Link
              href="/register"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
            >
              Register New Employee
            </Link>
            <button
              onClick={() =>
                window.open("http://localhost:8000/api/hrm/dashboard", "_blank")
              }
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
            >
              View API Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
