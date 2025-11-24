"use client";

import React, { useState, useEffect } from "react";
import ClientSelector from "@/components/employee-management/ClientSelector";

/**
 * Payroll Runs Tab Component - Modern UI
 * Matches EmployeeManagement design patterns
 *
 * Features:
 * - Create payroll run (draft status)
 * - Calculate payroll (draft → calculated)
 * - Approve payroll (calculated → approved)
 * - Export payroll Excel (approved → exported)
 * - Cancel/Delete payroll runs
 *
 * Status Flow: draft → calculated → approved → exported
 *
 * @component
 */
export default function PayrollRunsTab({
  currentTheme,
  preferences,
  selectedClient,
  setSelectedClient,
  setActiveTab,
}) {
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Form state for creating new payroll run
  const [formData, setFormData] = useState({
    run_name: "",
    month: "",
    year: new Date().getFullYear().toString(),
    notes: "",
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Fetch payroll runs when client changes
  useEffect(() => {
    if (selectedClient) {
      fetchPayrollRuns();
    }
  }, [selectedClient, statusFilter]);

  const fetchPayrollRuns = async () => {
    try {
      setLoading(true);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        client_id: selectedClient,
      });

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`${API_URL}/payroll/runs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payroll runs");
      }

      const data = await response.json();
      setPayrollRuns(data.data || []);
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
      setMessage({ type: "error", text: "Failed to load payroll runs" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayroll = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      setMessage({ type: "error", text: "Please select a client first" });
      return;
    }

    try {
      setLoading(true);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/payroll/runs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: selectedClient,
          month: parseInt(formData.month),
          year: parseInt(formData.year),
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Handle 409 Conflict (duplicate) specially
        if (response.status === 409) {
          throw new Error(
            error.message ||
              error.error ||
              "A payroll run already exists for this period"
          );
        }
        throw new Error(error.message || "Failed to create payroll run");
      }

      setMessage({ type: "success", text: "Payroll run created successfully" });
      setShowCreateModal(false);
      resetForm();
      fetchPayrollRuns();
    } catch (error) {
      console.error("Error creating payroll run:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to create payroll run",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePayroll = async (runId) => {
    console.log("🧮 Calculate button clicked for run ID:", runId);

    if (
      !confirm(
        "Calculate payroll for this run? This will process all employee payments."
      )
    ) {
      console.log("❌ User cancelled calculation");
      return;
    }

    console.log("✅ User confirmed, starting calculation...");

    try {
      setLoading(true);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("token");

      console.log(
        "📡 Making API request to:",
        `${API_URL}/payroll/runs/${runId}/calculate`
      );

      const response = await fetch(
        `${API_URL}/payroll/runs/${runId}/calculate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 API Response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Payroll calculation error response:", error);
        throw new Error(
          error.error || error.message || "Failed to calculate payroll"
        );
      }

      const result = await response.json();
      console.log("✅ Calculation success:", result);
      console.log("📊 Processed count:", result.data?.processed_count);
      console.log("⚠️ Skipped count:", result.data?.skipped_count);
      console.log("❌ Failed count:", result.data?.failed_count);
      console.log("📋 Skipped staff:", result.data?.skipped_staff);
      console.log("📋 Failed staff:", result.data?.failed_staff);
      console.log("⚠️ Warnings:", result.warnings);

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        const warningMsg = result.warnings.join(". ");
        setMessage({
          type: "warning",
          text: `${result.message}. ${warningMsg}`,
        });
      } else {
        setMessage({
          type: "success",
          text: result.message || "Payroll calculated successfully",
        });
      }

      fetchPayrollRuns();
    } catch (error) {
      console.error("Error calculating payroll:", error);
      setMessage({
        type: "error",
        text: error.message || "Calculation failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayroll = async (runId) => {
    if (!confirm("Approve this payroll run? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/payroll/runs/${runId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to approve payroll");
      }

      setMessage({ type: "success", text: "Payroll approved successfully" });
      fetchPayrollRuns();
    } catch (error) {
      console.error("Error approving payroll:", error);
      setMessage({ type: "error", text: error.message || "Approval failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPayroll = async (runId, runName) => {
    try {
      setLoading(true);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/payroll/runs/${runId}/export`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export payroll");
      }

      // Download the Excel file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payroll_${runName || runId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: "success", text: "Payroll exported successfully" });
      fetchPayrollRuns();
    } catch (error) {
      console.error("Error exporting payroll:", error);
      setMessage({ type: "error", text: error.message || "Export failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (runId) => {
    try {
      setPreviewLoading(true);
      setShowPreviewModal(true);

      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/payroll/runs/${runId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payroll details");
      }

      const data = await response.json();
      setPreviewData(data.data || data); // Handle both wrapped and unwrapped responses
    } catch (error) {
      console.error("Error fetching payroll details:", error);
      setMessage({ type: "error", text: "Failed to load details" });
      setShowPreviewModal(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDeletePayroll = async (runId) => {
    if (!confirm("Delete this payroll run? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/payroll/runs/${runId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete payroll run");
      }

      setMessage({ type: "success", text: "Payroll run deleted" });
      fetchPayrollRuns();
    } catch (error) {
      console.error("Error deleting payroll run:", error);
      setMessage({ type: "error", text: error.message || "Deletion failed" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      run_name: "",
      month: "",
      year: new Date().getFullYear().toString(),
      notes: "",
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      calculated:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      exported:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return badges[status] || badges.draft;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Message Display */}
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

      {/* Attendance Dependency Info Banner */}
      {selectedClient && payrollRuns.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                📋 No Payroll Runs Yet - Need Attendance Data First?
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                Before creating a payroll run, ensure attendance data is
                uploaded for the payroll month.
              </p>
              <button
                onClick={() => setActiveTab && setActiveTab("attendance")}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                → Go to Attendance Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <ClientSelector
          value={selectedClient}
          onChange={setSelectedClient}
          label="Select Client"
          required
        />
      </div>

      {selectedClient && (
        <>
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT - Create Payroll Run Form */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 rounded-t-lg">
                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <span>➕</span> Create New Payroll Run
                </h3>
              </div>
              <div className="p-4">
                <form onSubmit={handleCreatePayroll} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Run Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.run_name}
                      onChange={(e) =>
                        setFormData({ ...formData, run_name: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., December 2025 Payroll"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Month <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.month}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            month: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      >
                        <option value="">Select Month</option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="2020"
                        max="2100"
                        value={formData.year}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            year: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows="2"
                      placeholder="Optional notes about this payroll run..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    {loading ? "⏳ Creating..." : "✓ Create Draft Payroll Run"}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT - Filters & Quick Stats */}
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-gray-200 rounded-t-lg">
                  <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <span>🔍</span> Filters
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="calculated">Calculated</option>
                      <option value="approved">Approved</option>
                      <option value="exported">Exported</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Period
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="all">All Periods</option>
                      <option value="current_month">Current Month</option>
                      <option value="last_month">Last Month</option>
                      <option value="current_quarter">Current Quarter</option>
                      <option value="current_year">Current Year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200 rounded-t-lg">
                  <h3 className="text-sm font-bold text-green-900 flex items-center gap-2">
                    <span>📊</span> Quick Stats
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">0</div>
                    <div className="text-xs text-yellow-600 uppercase font-semibold">
                      Draft
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">0</div>
                    <div className="text-xs text-blue-600 uppercase font-semibold">
                      Calculated
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">0</div>
                    <div className="text-xs text-green-600 uppercase font-semibold">
                      Approved
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">0</div>
                    <div className="text-xs text-purple-600 uppercase font-semibold">
                      Exported
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Runs Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>📋</span> Payroll Runs ({payrollRuns.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-500">
                  Loading payroll runs...
                </p>
              </div>
            ) : payrollRuns.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No Payroll Runs Yet
                </h3>
                <p className="text-sm text-gray-500">
                  Create your first payroll run using the form above
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide">
                        Run Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide">
                        Period
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 uppercase tracking-wide">
                        Employees
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 uppercase tracking-wide">
                        Net Pay
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {payrollRuns.map((run) => (
                      <tr
                        key={run.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {run.run_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Created by{" "}
                            {typeof run.created_by === "object" &&
                            run.created_by !== null
                              ? `${run.created_by.first_name || ""} ${
                                  run.created_by.last_name || ""
                                }`.trim() || "System"
                              : run.created_by || "System"}{" "}
                            on {formatDate(run.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-700">
                            {new Date(
                              run.year,
                              run.month - 1
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-bold rounded-full uppercase ${getStatusBadge(
                              run.status
                            )}`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium text-gray-900">
                            {run.employee_count}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold text-green-700">
                            {formatCurrency(run.total_net)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Gross: {formatCurrency(run.total_gross)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {/* Calculate Button (Only for draft status) */}
                            {run.status === "draft" && (
                              <button
                                onClick={() => handleCalculatePayroll(run.id)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                title="Calculate Payroll"
                              >
                                🧮 Calculate
                              </button>
                            )}

                            {/* Approve Button (Only for calculated status) */}
                            {run.status === "calculated" && (
                              <button
                                onClick={() => handleApprovePayroll(run.id)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                                title="Approve Payroll"
                              >
                                ✓ Approve
                              </button>
                            )}

                            {/* Export Button (approved or exported status) */}
                            {(run.status === "approved" ||
                              run.status === "exported") && (
                              <button
                                onClick={() =>
                                  handleExportPayroll(run.id, run.run_name)
                                }
                                disabled={loading}
                                className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                title="Export to Excel"
                              >
                                📥 Export
                              </button>
                            )}

                            {/* Delete Button (Only for draft and calculated) */}
                            {(run.status === "draft" ||
                              run.status === "calculated") && (
                              <button
                                onClick={() => handleDeletePayroll(run.id)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                                title="Delete Payroll Run"
                              >
                                🗑️
                              </button>
                            )}

                            {/* View Details Button (Always visible) */}
                            <button
                              onClick={() => handleViewDetails(run.id)}
                              className="px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded hover:bg-gray-700 transition-colors"
                              title="View Details"
                            >
                              👁️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* No Client Selected */}
      {!selectedClient && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Select a Client to Begin
          </h3>
          <p className="text-sm text-gray-500">
            Choose a client from the dropdown above to manage their payroll runs
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">📊 Payroll Run Details</h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {previewLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                    Loading payroll details...
                  </p>
                </div>
              ) : previewData ? (
                <>
                  {/* Summary Section */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Period</p>
                        <p className="font-semibold text-gray-800">
                          {previewData.month}/{previewData.year}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Total Staff
                        </p>
                        <p className="font-semibold text-gray-800">
                          {previewData.total_staff_count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Total Gross
                        </p>
                        <p className="font-semibold text-green-600">
                          ₦
                          {Number(
                            previewData.total_gross_pay || 0
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Net</p>
                        <p className="font-semibold text-blue-600">
                          ₦
                          {Number(
                            previewData.total_net_pay || 0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Staff Breakdown */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Staff Breakdown ({previewData.payroll_items?.length || 0}{" "}
                      employees)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left">
                              Staff Name
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-left">
                              Code
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-right">
                              Days
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-right">
                              Gross Pay
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-right">
                              PAYE
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-right">
                              Pension
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-right">
                              Deductions
                            </th>
                            <th className="border border-gray-300 px-3 py-2 text-right">
                              Net Pay
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.payroll_items?.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2">
                                {item.staff_name}
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                {item.staff_code}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right">
                                {item.days_present}/{item.days_worked}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right">
                                ₦
                                {Number(
                                  item.monthly_gross || 0
                                ).toLocaleString()}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right">
                                ₦{Number(item.paye_tax || 0).toLocaleString()}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right">
                                ₦
                                {Number(
                                  item.pension_deduction || 0
                                ).toLocaleString()}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right">
                                ₦
                                {Number(
                                  item.total_deductions || 0
                                ).toLocaleString()}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right font-semibold">
                                ₦{Number(item.net_pay || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
