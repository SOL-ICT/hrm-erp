"use client";

import React, { useState, useEffect } from "react";
import ClientSelector from "@/components/employee-management/ClientSelector";
import StaffSelector from "@/components/employee-management/StaffSelector";
import UnmatchedStaffModal from "@/components/employee-management/UnmatchedStaffModal";
import BulkUploadErrors from "@/components/employee-management/BulkUploadErrors";
import employeeManagementAPI from "@/services/employeeManagementAPI";

export default function CautionTab({ currentTheme, preferences }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    issued_date: "",
    reason: "",
    status: "active",
  });
  const [bulkFile, setBulkFile] = useState(null);
  const [unmatchedStaff, setUnmatchedStaff] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [cautions, setCautions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedClient) {
      fetchCautions();
    }
  }, [selectedClient]);

  const fetchCautions = async () => {
    try {
      setLoading(true);
      const response = await employeeManagementAPI.getCautions(
        selectedClient.id
      );
      setCautions(response.data || []);
    } catch (error) {
      console.error("Error fetching cautions:", error);
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
      await employeeManagementAPI.createCaution({
        ...formData,
        staff_id: selectedStaff.id,
        client_id: selectedClient.id,
      });
      setMessage({ type: "success", text: "Caution created successfully" });
      resetForm();
      fetchCautions();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create caution",
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
      const response = await employeeManagementAPI.bulkUploadCautions(
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
          text: `${response.success_count} cautions uploaded successfully`,
        });
        fetchCautions();
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
      await employeeManagementAPI.downloadCautionTemplate();
      setMessage({ type: "success", text: "Template downloaded successfully" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to download template" });
    }
  };

  const resetForm = () => {
    setSelectedStaff(null);
    setFormData({
      issued_date: "",
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
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT - Single Entry Form */}
            <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-lg shadow-sm`}>
              <div className={`px-4 py-3 bg-gradient-to-r from-yellow-50 to-yellow-100 border-b ${currentTheme.border} rounded-t-lg`}>
                <h3 className="text-sm font-bold text-yellow-900 flex items-center gap-2">
                  <span>⚠️</span> Single Caution Entry
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
                        Caution Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.issued_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            issued_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-yellow-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
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
                        className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg ${currentTheme.cardBg} hover:border-yellow-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors`}
                      >
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold ${currentTheme.mutedText} uppercase tracking-wide mb-1.5`}>
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-yellow-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      rows="3"
                      placeholder="Enter caution reason..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white text-sm font-semibold rounded-lg hover:from-yellow-700 hover:to-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    {loading ? "⏳ Creating..." : "✓ Create Caution"}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT - Bulk Upload */}
            <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-lg shadow-sm`}>
              <div className={`px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-b ${currentTheme.border} rounded-t-lg`}>
                <h3 className="text-sm font-bold text-green-900 flex items-center gap-2">
                  <span>📤</span> Bulk Upload Cautions
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
                    <label className={`block text-xs font-semibold ${currentTheme.mutedText} uppercase tracking-wide mb-1.5`}>
                      Upload Excel File
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setBulkFile(e.target.files[0])}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !bulkFile}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white text-sm font-semibold rounded-lg hover:from-yellow-700 hover:to-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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

          {/* Cautions Table */}
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-lg shadow-sm`}>
            <div className={`px-4 py-3 ${currentTheme.tableHeaderBg} border-b ${currentTheme.border} rounded-t-lg flex items-center justify-between`}>
              <h3 className={`text-sm font-bold ${currentTheme.text} flex items-center gap-2`}>
                <span>📋</span> Caution Records
              </h3>
              <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                {cautions.length} {cautions.length === 1 ? "record" : "records"}
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
                      Caution Date
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.mutedText} uppercase tracking-wider`}>
                      Reason
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.mutedText} uppercase tracking-wider`}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${currentTheme.border}`}>
                  {cautions.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className={`px-4 py-8 text-center text-sm ${currentTheme.mutedText} italic`}
                      >
                        No caution records found. Create a new entry or upload
                        in bulk.
                      </td>
                    </tr>
                  ) : (
                    cautions.map((caution) => (
                      <tr
                        key={caution.id}
                        className={`${currentTheme.hover} transition-colors`}
                      >
                        <td className={`px-4 py-3 text-sm font-medium ${currentTheme.text}`}>
                          {caution.staff?.staff_id}
                        </td>
                        <td className={`px-4 py-3 text-sm ${currentTheme.text}`}>
                          {caution.staff?.first_name} {caution.staff?.last_name}
                        </td>
                        <td className={`px-4 py-3 text-sm ${currentTheme.text}`}>
                          {caution.issued_date}
                        </td>
                        <td className={`px-4 py-3 text-sm ${currentTheme.text} max-w-xs truncate`}>
                          {caution.reason}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                              caution.status === "active"
                                ? "bg-yellow-100 text-yellow-800"
                                : caution.status === "resolved"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {caution.status}
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
