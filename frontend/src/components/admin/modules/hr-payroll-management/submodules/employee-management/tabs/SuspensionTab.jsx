"use client";

import React, { useState, useEffect } from "react";
import ClientSelector from "@/components/employee-management/ClientSelector";
import StaffSelector from "@/components/employee-management/StaffSelector";
import UnmatchedStaffModal from "@/components/employee-management/UnmatchedStaffModal";
import BulkUploadErrors from "@/components/employee-management/BulkUploadErrors";
import employeeManagementAPI from "@/services/employeeManagementAPI";

export default function SuspensionTab({ currentTheme, preferences }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    suspension_start_date: "",
    suspension_end_date: "",
    suspension_days: "",
    reason: "",
    status: "active",
  });
  const [bulkFile, setBulkFile] = useState(null);
  const [unmatchedStaff, setUnmatchedStaff] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [suspensions, setSuspensions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedClient) {
      fetchSuspensions();
    }
  }, [selectedClient]);

  useEffect(() => {
    if (formData.suspension_start_date && formData.suspension_end_date) {
      const start = new Date(formData.suspension_start_date);
      const end = new Date(formData.suspension_end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      setFormData((prev) => ({
        ...prev,
        suspension_days: days > 0 ? days : "",
      }));
    }
  }, [formData.suspension_start_date, formData.suspension_end_date]);

  const fetchSuspensions = async () => {
    try {
      setLoading(true);
      const response = await employeeManagementAPI.getSuspensions(
        selectedClient.id
      );
      setSuspensions(response.data || []);
    } catch (error) {
      console.error("Error fetching suspensions:", error);
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
      await employeeManagementAPI.createSuspension({
        ...formData,
        staff_id: selectedStaff.id,
        client_id: selectedClient.id,
      });
      setMessage({ type: "success", text: "Suspension created successfully" });
      resetForm();
      fetchSuspensions();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create suspension",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile || !selectedClient) {
      setMessage({ type: "error", text: "Please select a client and file" });
      return;
    }

    try {
      setLoading(true);
      const response = await employeeManagementAPI.bulkUploadSuspensions(
        selectedClient.id,
        bulkFile
      );

      if (response.unmatched_staff?.length > 0) {
        setUnmatchedStaff(response.unmatched_staff);
        setShowUnmatchedModal(true);
      }

      if (response.errors?.length > 0) {
        setBulkErrors(response.errors);
      }

      if (response.success_count > 0) {
        setMessage({
          type: "success",
          text: `${response.success_count} suspensions uploaded successfully`,
        });
        fetchSuspensions();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Bulk upload failed",
      });
    } finally {
      setLoading(false);
      setBulkFile(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await employeeManagementAPI.downloadSuspensionTemplate();
      setMessage({ type: "success", text: "Template downloaded successfully" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to download template" });
    }
  };

  const resetForm = () => {
    setSelectedStaff(null);
    setFormData({
      suspension_start_date: "",
      suspension_end_date: "",
      suspension_days: "",
      reason: "",
      status: "active",
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
            {/* LEFT - Single Entry Form */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-gray-200 rounded-t-lg">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <span>⏸️</span> Single Suspension Entry
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

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.suspension_start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            suspension_start_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.suspension_end_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            suspension_end_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Days
                      </label>
                      <input
                        type="number"
                        value={formData.suspension_days}
                        readOnly
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="lifted">Lifted</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      rows="3"
                      placeholder="Enter suspension reason..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    {loading ? "⏳ Creating..." : "✓ Create Suspension"}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT - Bulk Upload */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200 rounded-t-lg">
                <h3 className="text-sm font-bold text-green-900 flex items-center gap-2">
                  <span>📤</span> Bulk Upload Suspensions
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <span>📥</span> Download Excel Template
                </button>

                <form onSubmit={handleBulkUpload} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Upload Excel File
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setBulkFile(e.target.files[0])}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !bulkFile}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    {loading ? "⏳ Uploading..." : "↑ Upload & Process"}
                  </button>
                </form>

                {bulkErrors.length > 0 && (
                  <BulkUploadErrors
                    errors={bulkErrors}
                    currentTheme={currentTheme}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Suspensions Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>📋</span> Suspension Records
              </h3>
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
                {suspensions.length}{" "}
                {suspensions.length === 1 ? "record" : "records"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Staff ID
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {suspensions.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-8 text-center text-sm text-gray-500 italic"
                      >
                        No suspension records found. Create a new entry or
                        upload in bulk.
                      </td>
                    </tr>
                  ) : (
                    suspensions.map((suspension) => (
                      <tr
                        key={suspension.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {suspension.staff?.staff_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {suspension.staff?.first_name}{" "}
                          {suspension.staff?.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {suspension.suspension_start_date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {suspension.suspension_end_date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                            {suspension.suspension_days} days
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                              suspension.status === "active"
                                ? "bg-yellow-100 text-yellow-800"
                                : suspension.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {suspension.status}
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

      {showUnmatchedModal && (
        <UnmatchedStaffModal
          unmatchedStaff={unmatchedStaff}
          onClose={() => setShowUnmatchedModal(false)}
          currentTheme={currentTheme}
        />
      )}
    </div>
  );
}
