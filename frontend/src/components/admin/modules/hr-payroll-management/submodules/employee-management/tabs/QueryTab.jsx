"use client";

import React, { useState, useEffect } from "react";
import ClientSelector from "@/components/employee-management/ClientSelector";
import StaffSelector from "@/components/employee-management/StaffSelector";
import employeeManagementAPI from "@/services/employeeManagementAPI";

export default function QueryTab({ currentTheme, preferences }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    query_date: "",
    query_details: "",
    response: "",
    response_date: "",
    status: "pending",
  });
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedClient) {
      fetchQueries();
    }
  }, [selectedClient]);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await employeeManagementAPI.getStaffQueries(
        selectedClient.id
      );
      setQueries(response.data || []);
    } catch (error) {
      console.error("Error fetching queries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) {
      setMessage({ type: "error", text: "Please select a staff member" });
      return;
    }

    try {
      setLoading(true);
      await employeeManagementAPI.createStaffQuery({
        ...formData,
        staff_id: selectedStaff.id,
        client_id: selectedClient.id,
      });
      setMessage({ type: "success", text: "Query created successfully" });
      resetForm();
      fetchQueries();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create query",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStaff(null);
    setFormData({
      query_date: "",
      query_details: "",
      response: "",
      response_date: "",
      status: "pending",
    });
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Client Selector */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-lg p-3 shadow-sm`}>
        <ClientSelector
          value={selectedClient}
          onChange={setSelectedClient}
          label="Select Client"
          required
        />
      </div>

      {selectedClient && (
        <>
          {/* Single Column for Query (No Bulk Upload) */}
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-lg shadow-sm`}>
            <div className={`px-4 py-3 bg-gradient-to-r from-teal-50 to-teal-100 border-b ${currentTheme.border} rounded-t-lg`}>
              <h3 className="text-sm font-bold text-teal-900 flex items-center gap-2">
                <span>❓</span> Create Staff Query
              </h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <StaffSelector
                  clientId={selectedClient}
                  value={selectedStaff}
                  onChange={setSelectedStaff}
                  label="Select Staff Member"
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold ${currentTheme.mutedText} uppercase tracking-wide mb-1.5`}>
                      Query Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.query_date}
                      onChange={(e) =>
                        setFormData({ ...formData, query_date: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-teal-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${currentTheme.mutedText} uppercase tracking-wide mb-1.5`}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg ${currentTheme.cardBg} hover:border-teal-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors`}
                    >
                      <option value="pending">Pending</option>
                      <option value="responded">Responded</option>
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold ${currentTheme.mutedText} uppercase tracking-wide mb-1.5`}>
                    Query Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.query_details}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        query_details: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-teal-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    rows="4"
                    placeholder="Enter query details..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold ${currentTheme.mutedText} uppercase tracking-wide mb-1.5`}>
                      Response (Optional)
                    </label>
                    <textarea
                      value={formData.response}
                      onChange={(e) =>
                        setFormData({ ...formData, response: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-teal-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      rows="3"
                      placeholder="Enter response if available..."
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${currentTheme.mutedText} uppercase tracking-wide mb-1.5`}>
                      Response Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.response_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          response_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-teal-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-semibold rounded-lg hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  {loading ? "⏳ Creating..." : "✓ Create Query"}
                </button>
              </form>
            </div>
          </div>

          {/* Queries Table */}
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-lg shadow-sm`}>
            <div className={`px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b ${currentTheme.border} rounded-t-lg flex items-center justify-between`}>
              <h3 className={`text-sm font-bold ${currentTheme.text} flex items-center gap-2`}>
                <span>📋</span> Staff Query Records
              </h3>
              <span className="px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">
                {queries.length} {queries.length === 1 ? "record" : "records"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${currentTheme.tableHeaderBg} border-b ${currentTheme.border}`}>
                  <tr>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.mutedText} uppercase tracking-wider`}>
                      Staff ID
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.mutedText} uppercase tracking-wider`}>
                      Name
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.mutedText} uppercase tracking-wider`}>
                      Query Date
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.mutedText} uppercase tracking-wider`}>
                      Query Details
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.mutedText} uppercase tracking-wider`}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${currentTheme.border}`}>
                  {queries.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className={`px-4 py-8 text-center text-sm ${currentTheme.mutedText} italic`}
                      >
                        No query records found. Create a new query above.
                      </td>
                    </tr>
                  ) : (
                    queries.map((query) => (
                      <tr
                        key={query.id}
                        className={`${currentTheme.tableRowHover} transition-colors`}
                      >
                        <td className={`px-4 py-3 text-sm font-medium ${currentTheme.text}`}>
                          {query.staff?.staff_id}
                        </td>
                        <td className={`px-4 py-3 text-sm ${currentTheme.text}`}>
                          {query.staff?.first_name} {query.staff?.last_name}
                        </td>
                        <td className={`px-4 py-3 text-sm ${currentTheme.text}`}>
                          {query.query_date}
                        </td>
                        <td className={`px-4 py-3 text-sm ${currentTheme.text} max-w-xs truncate`}>
                          {query.query_details}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                              query.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : query.status === "responded"
                                ? "bg-blue-100 text-blue-800"
                                : query.status === "resolved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {query.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
