"use client";

import React, { useState, useEffect } from "react";
import ClientSelector from "@/components/employee-management/ClientSelector";
import StaffSelector from "@/components/employee-management/StaffSelector";
import UnmatchedStaffModal from "@/components/employee-management/UnmatchedStaffModal";
import BulkUploadErrors from "@/components/employee-management/BulkUploadErrors";
import employeeManagementAPI from "@/services/employeeManagementAPI";

export default function RedeploymentTab({ currentTheme, preferences }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [clients, setClients] = useState([]);
  const [jobStructures, setJobStructures] = useState([]);
  const [payGrades, setPayGrades] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [serviceLocations, setServiceLocations] = useState([]);
  const [formData, setFormData] = useState({
    redeployment_type: "department",
    department: "",
    designation: "",
    service_location: "",
    new_client_id: "",
    job_structure_id: "",
    pay_grade_structure_id: "",
    redeployment_date: "",
    effective_date: "",
    reason: "",
  });
  const [bulkFile, setBulkFile] = useState(null);
  const [unmatchedStaff, setUnmatchedStaff] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [redeployments, setRedeployments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedClient) {
      fetchRedeployments();
      fetchClients();
    }
  }, [selectedClient]);

  useEffect(() => {
    if (formData.redeployment_type === "client" && formData.new_client_id) {
      fetchJobStructures(formData.new_client_id);
      fetchPayGrades(formData.new_client_id);
    } else if (selectedClient) {
      fetchJobStructures(selectedClient.id);
      fetchPayGrades(selectedClient.id);
    }
  }, [formData.redeployment_type, formData.new_client_id, selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await employeeManagementAPI.getClients();
      setClients(response.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchJobStructures = async (clientId) => {
    try {
      const response = await employeeManagementAPI.getJobStructures(clientId);
      setJobStructures(response.data || []);
    } catch (error) {
      console.error("Error fetching job structures:", error);
    }
  };

  const fetchPayGrades = async (clientId) => {
    try {
      const response = await employeeManagementAPI.getPayGrades(clientId);
      setPayGrades(response.data || []);
    } catch (error) {
      console.error("Error fetching pay grades:", error);
    }
  };

  const fetchRedeployments = async () => {
    try {
      setLoading(true);
      const response = await employeeManagementAPI.getRedeployments(
        selectedClient.id
      );
      setRedeployments(response.data || []);
    } catch (error) {
      console.error("Error fetching redeployments:", error);
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
      await employeeManagementAPI.createRedeployment({
        ...formData,
        staff_id: selectedStaff.id,
        old_client_id: selectedClient.id,
      });
      setMessage({
        type: "success",
        text: "Redeployment created successfully",
      });
      resetForm();
      fetchRedeployments();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create redeployment",
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
      const response = await employeeManagementAPI.bulkUploadRedeployments(
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
          text: `${response.success_count} redeployments uploaded successfully`,
        });
        fetchRedeployments();
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
      await employeeManagementAPI.downloadRedeploymentTemplate();
      setMessage({ type: "success", text: "Template downloaded successfully" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to download template" });
    }
  };

  const resetForm = () => {
    setSelectedStaff(null);
    setFormData({
      redeployment_type: "department",
      department: "",
      designation: "",
      service_location: "",
      new_client_id: "",
      job_structure_id: "",
      pay_grade_structure_id: "",
      redeployment_date: "",
      effective_date: "",
      reason: "",
    });
  };

  const renderTypeSpecificFields = () => {
    switch (formData.redeployment_type) {
      case "department":
        return (
          <div>
            <label className={`block mb-2 ${currentTheme.textPrimary}`}>
              New Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              className={`w-full p-2 rounded ${currentTheme.cardBg} ${currentTheme.border}`}
              required
            />
          </div>
        );
      case "service_location":
        return (
          <div>
            <label className={`block mb-2 ${currentTheme.textPrimary}`}>
              New Service Location
            </label>
            <input
              type="text"
              value={formData.service_location}
              onChange={(e) =>
                setFormData({ ...formData, service_location: e.target.value })
              }
              className={`w-full p-2 rounded ${currentTheme.cardBg} ${currentTheme.border}`}
              required
            />
          </div>
        );
      case "client":
        return (
          <>
            <div>
              <label className={`block mb-2 ${currentTheme.textPrimary}`}>
                New Client
              </label>
              <select
                value={formData.new_client_id}
                onChange={(e) =>
                  setFormData({ ...formData, new_client_id: e.target.value })
                }
                className={`w-full p-2 rounded ${currentTheme.cardBg} ${currentTheme.border}`}
                required
              >
                <option value="">Select Client</option>
                {clients
                  .filter((c) => c.id !== selectedClient?.id)
                  .map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.prefix} - {client.organisation_name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={`block mb-2 ${currentTheme.textPrimary}`}>
                New Job Structure
              </label>
              <select
                value={formData.job_structure_id}
                onChange={(e) =>
                  setFormData({ ...formData, job_structure_id: e.target.value })
                }
                className={`w-full p-2 rounded ${currentTheme.cardBg} ${currentTheme.border}`}
                disabled={!formData.new_client_id}
                required
              >
                <option value="">Select Job</option>
                {jobStructures.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.job_code} - {job.job_title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block mb-2 ${currentTheme.textPrimary}`}>
                New Pay Grade
              </label>
              <select
                value={formData.pay_grade_structure_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pay_grade_structure_id: e.target.value,
                  })
                }
                className={`w-full p-2 rounded ${currentTheme.cardBg} ${currentTheme.border}`}
                disabled={!formData.new_client_id}
                required
              >
                <option value="">Select Grade</option>
                {payGrades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.grade_code} - {grade.grade_name}
                  </option>
                ))}
              </select>
            </div>
          </>
        );
      default:
        return null;
    }
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
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-gray-200 rounded-t-lg">
                <h3 className="text-sm font-bold text-orange-900 flex items-center gap-2">
                  <span>🔄</span> Single Redeployment Entry
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

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Redeployment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.redeployment_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          redeployment_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="department">Department</option>
                      <option value="service_location">Service Location</option>
                      <option value="client">Client</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {renderTypeSpecificFields()}

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Redeployment Date{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.redeployment_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            redeployment_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Effective Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.effective_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            effective_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        required
                      />
                    </div>
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      rows="2"
                      placeholder="Enter redeployment reason..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white text-sm font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    {loading ? "⏳ Creating..." : "✓ Create Redeployment"}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT - Bulk Upload */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200 rounded-t-lg">
                <h3 className="text-sm font-bold text-green-900 flex items-center gap-2">
                  <span>📤</span> Bulk Upload Redeployments
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !bulkFile}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white text-sm font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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

          {/* Redeployments Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>📋</span> Redeployment Records
              </h3>
              <span className="px-2.5 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                {redeployments.length}{" "}
                {redeployments.length === 1 ? "record" : "records"}
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
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Redeployment Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Effective Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {redeployments.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-8 text-center text-sm text-gray-500 italic"
                      >
                        No redeployment records found. Create a new entry or
                        upload in bulk.
                      </td>
                    </tr>
                  ) : (
                    redeployments.map((redeployment) => (
                      <tr
                        key={redeployment.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {redeployment.staff?.staff_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {redeployment.staff?.first_name}{" "}
                          {redeployment.staff?.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold capitalize">
                            {redeployment.redeployment_type?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {redeployment.redeployment_date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {redeployment.effective_date}
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
