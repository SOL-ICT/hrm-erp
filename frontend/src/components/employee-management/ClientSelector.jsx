// Client Selector Component with organisation_name
import React, { useEffect, useState } from "react";
import employeeManagementAPI from "@/services/employeeManagementAPI";

export default function ClientSelector({
  value,
  onChange,
  onClientSelect, // Support both prop names
  label = "Select Client",
  required = false,
  currentTheme = {}, // Support theme
}) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use whichever callback is provided
  const handleChange = onChange || onClientSelect;

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await employeeManagementAPI.getClients();

      if (response.success) {
        setClients(response.data);
      } else {
        setError("Failed to load clients");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
          {label}
        </label>
        <div className="animate-pulse bg-gray-200 h-9 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
          {label}
        </label>
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ""}
        onChange={(e) => handleChange && handleChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
        required={required}
      >
        <option value="">Choose a client...</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.prefix} - {client.organisation_name}
          </option>
        ))}
      </select>
    </div>
  );
}
