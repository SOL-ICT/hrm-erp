// Staff Selector Component
import React, { useEffect, useState } from "react";
import employeeManagementAPI from "@/services/employeeManagementAPI";

export default function StaffSelector({
  clientId,
  value,
  onChange,
  label = "Select Staff",
  required = false,
  status = "active",
  currentTheme = {}, // Support theme
}) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (clientId) {
      loadStaff();
    } else {
      setStaff([]);
    }
  }, [clientId, status]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeManagementAPI.getStaff(clientId, status);

      if (response.success) {
        setStaff(response.data);
      } else {
        setError("Failed to load staff");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) {
    return (
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
          {label}
        </label>
        <select
          disabled
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500"
        >
          <option>Please select a client first</option>
        </select>
      </div>
    );
  }

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
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
        required={required}
      >
        <option value="">Choose a staff member...</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.staff_id} - {s.first_name} {s.last_name}
            {s.department ? ` (${s.department})` : ""}
          </option>
        ))}
      </select>
      {staff.length === 0 && (
        <p className="text-xs text-gray-500 mt-1 italic">
          No {status} staff found for this client
        </p>
      )}
    </div>
  );
}
