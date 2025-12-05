"use client";

import React, { useState, useEffect } from "react";
import ClientSelector from "@/components/employee-management/ClientSelector";
import StaffSelector from "@/components/employee-management/StaffSelector";
import UnmatchedStaffModal from "@/components/employee-management/UnmatchedStaffModal";
import BulkUploadErrors from "@/components/employee-management/BulkUploadErrors";
import employeeManagementAPI from "@/services/employeeManagementAPI";

export default function PromotionTab({ currentTheme, preferences }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [jobStructures, setJobStructures] = useState([]);
  const [payGrades, setPayGrades] = useState([]);
  const [filteredPayGrades, setFilteredPayGrades] = useState([]);
  const [formData, setFormData] = useState({
    job_structure_id: "",
    pay_grade_structure_id: "",
    promotion_date: "",
    effective_date: "",
    reason: "",
  });
  const [oldEmoluments, setOldEmoluments] = useState(null);
  const [newEmoluments, setNewEmoluments] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [unmatchedStaff, setUnmatchedStaff] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedClient) {
      fetchJobStructures();
      fetchPayGrades();
      fetchPromotions();
    }
  }, [selectedClient]);

  useEffect(() => {
    if (selectedStaff && selectedStaff.pay_grade_structure) {
      setOldEmoluments(selectedStaff.pay_grade_structure.emoluments);
    }
  }, [selectedStaff]);

  useEffect(() => {
    if (formData.job_structure_id && payGrades.length > 0) {
      const filtered = payGrades.filter(
        (pg) => pg.job_structure_id === parseInt(formData.job_structure_id)
      );
      setFilteredPayGrades(filtered);
    } else {
      setFilteredPayGrades([]);
    }
  }, [formData.job_structure_id, payGrades]);

  useEffect(() => {
    if (formData.pay_grade_structure_id && payGrades.length > 0) {
      const selected = payGrades.find(
        (pg) => pg.id === parseInt(formData.pay_grade_structure_id)
      );
      setNewEmoluments(selected?.emoluments || null);
    } else {
      setNewEmoluments(null);
    }
  }, [formData.pay_grade_structure_id, payGrades]);

  const fetchJobStructures = async () => {
    try {
      const response = await employeeManagementAPI.getJobStructures(
        selectedClient.id
      );
      setJobStructures(response.data || []);
    } catch (error) {
      console.error("Error fetching job structures:", error);
    }
  };

  const fetchPayGrades = async () => {
    try {
      const response = await employeeManagementAPI.getPayGrades(
        selectedClient.id
      );
      setPayGrades(response.data || []);
    } catch (error) {
      console.error("Error fetching pay grades:", error);
    }
  };

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await employeeManagementAPI.getPromotions(
        selectedClient.id
      );
      setPromotions(response.data || []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
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
      await employeeManagementAPI.createPromotion({
        ...formData,
        staff_id: selectedStaff.id,
        client_id: selectedClient.id,
      });
      setMessage({ type: "success", text: "Promotion created successfully" });
      resetForm();
      fetchPromotions();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create promotion",
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
      const response = await employeeManagementAPI.bulkUploadPromotions(
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
          text: `${response.success_count} promotions uploaded successfully`,
        });
        fetchPromotions();
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
      await employeeManagementAPI.downloadPromotionTemplate();
      setMessage({ type: "success", text: "Template downloaded successfully" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to download template" });
    }
  };

  const resetForm = () => {
    setSelectedStaff(null);
    setFormData({
      job_structure_id: "",
      pay_grade_structure_id: "",
      promotion_date: "",
      effective_date: "",
      reason: "",
    });
    setOldEmoluments(null);
    setNewEmoluments(null);
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

      {/* Client Selector */}
      <div className={`${currentTheme?.cardBg || 'bg-white'} ${currentTheme?.border || 'border border-gray-200'} rounded-lg p-3 shadow-sm`}>
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
            <div className={`${currentTheme?.cardBg || 'bg-white'} ${currentTheme?.border || 'border border-gray-200'} rounded-lg shadow-sm`}>
              <div className={`px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 ${currentTheme?.border || 'border-b border-gray-200'} rounded-t-lg`}>
                <h3 className={`text-sm font-bold ${currentTheme?.textPrimary || 'text-purple-900'} flex items-center gap-2`}>
                  <span>📈</span> Single Promotion Entry
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

                  {selectedStaff && oldEmoluments && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">
                        Current Position
                      </h4>
                      <div className="space-y-1 text-xs text-blue-800">
                        <p>
                          <span className="font-semibold">Job:</span>{" "}
                          {selectedStaff.job_structure?.job_title}
                        </p>
                        <p>
                          <span className="font-semibold">Grade:</span>{" "}
                          {selectedStaff.pay_grade_structure?.grade_name}
                        </p>
                        <p className="text-[10px] font-mono bg-blue-100 p-1 rounded">
                          {JSON.stringify(oldEmoluments)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-semibold ${currentTheme?.textSecondary || 'text-gray-600'} uppercase tracking-wide mb-1.5`}>
                        New Job Structure{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.job_structure_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            job_structure_id: e.target.value,
                            pay_grade_structure_id: "",
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        required
                      >
                        <option value="">Select Job...</option>
                        {jobStructures.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.job_code} - {job.job_title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${currentTheme?.textSecondary || 'text-gray-600'} uppercase tracking-wide mb-1.5`}>
                        New Pay Grade <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.pay_grade_structure_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pay_grade_structure_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!formData.job_structure_id}
                        required
                      >
                        <option value="">Select Grade...</option>
                        {filteredPayGrades.map((grade) => (
                          <option key={grade.id} value={grade.id}>
                            {grade.grade_code} - {grade.grade_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${currentTheme?.textSecondary || 'text-gray-600'} uppercase tracking-wide mb-1.5`}>
                        Promotion Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.promotion_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            promotion_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold ${currentTheme?.textSecondary || 'text-gray-600'} uppercase tracking-wide mb-1.5`}>
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
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {newEmoluments && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <h4 className="text-xs font-bold text-green-900 uppercase tracking-wide mb-2">
                        New Position Preview
                      </h4>
                      <p className="text-[10px] font-mono bg-green-100 p-1 rounded text-green-800">
                        {JSON.stringify(newEmoluments)}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className={`block text-xs font-semibold ${currentTheme?.textSecondary || 'text-gray-600'} uppercase tracking-wide mb-1.5`}>
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      rows="2"
                      placeholder="Enter promotion reason..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    {loading ? "⏳ Creating..." : "✓ Create Promotion"}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT - Bulk Upload */}
            <div className={`${currentTheme?.cardBg || 'bg-white'} ${currentTheme?.border || 'border border-gray-200'} rounded-lg shadow-sm`}>
              <div className={`px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 ${currentTheme?.border || 'border-b border-gray-200'} rounded-t-lg`}>
                <h3 className={`text-sm font-bold ${currentTheme?.textPrimary || 'text-green-900'} flex items-center gap-2`}>
                  <span>📤</span> Bulk Upload Promotions
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
                    <label className={`block text-xs font-semibold ${currentTheme?.textSecondary || 'text-gray-600'} uppercase tracking-wide mb-1.5`}>
                      Upload Excel File
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setBulkFile(e.target.files[0])}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !bulkFile}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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

          {/* Promotions Table */}
          <div className={`${currentTheme?.cardBg || 'bg-white'} ${currentTheme?.border || 'border border-gray-200'} rounded-lg shadow-sm`}>
            <div className={`px-4 py-3 ${currentTheme?.cardBg || 'bg-gradient-to-r from-gray-50 to-gray-100'} ${currentTheme?.border || 'border-b border-gray-200'} rounded-t-lg flex items-center justify-between`}>
              <h3 className={`text-sm font-bold ${currentTheme?.textPrimary || 'text-gray-900'} flex items-center gap-2`}>
                <span>📋</span> Promotion Records
              </h3>
              <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                {promotions.length}{" "}
                {promotions.length === 1 ? "record" : "records"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${currentTheme?.cardBg || 'bg-gray-50'} ${currentTheme?.border || 'border-b border-gray-200'}`}>
                  <tr>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme?.textSecondary || 'text-gray-700'} uppercase tracking-wider`}>
                      Staff ID
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme?.textSecondary || 'text-gray-700'} uppercase tracking-wider`}>
                      Name
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme?.textSecondary || 'text-gray-700'} uppercase tracking-wider`}>
                      New Job
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme?.textSecondary || 'text-gray-700'} uppercase tracking-wider`}>
                      New Grade
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme?.textSecondary || 'text-gray-700'} uppercase tracking-wider`}>
                      Promotion Date
                    </th>
                    <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme?.textSecondary || 'text-gray-700'} uppercase tracking-wider`}>
                      Effective Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {promotions.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className={`px-4 py-8 text-center text-sm ${currentTheme?.textSecondary || 'text-gray-500'} italic`}
                      >
                        No promotion records found. Create a new entry or upload
                        in bulk.
                      </td>
                    </tr>
                  ) : (
                    promotions.map((promotion) => (
                      <tr
                        key={promotion.id}
                        className={`hover:${currentTheme?.cardBg || 'bg-gray-50'} transition-colors`}
                      >
                        <td className={`px-4 py-3 text-sm font-medium ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                          {promotion.staff?.staff_id}
                        </td>
                        <td className={`px-4 py-3 text-sm ${currentTheme?.textSecondary || 'text-gray-700'}`}>
                          {promotion.staff?.first_name}{" "}
                          {promotion.staff?.last_name}
                        </td>
                        <td className={`px-4 py-3 text-sm ${currentTheme?.textSecondary || 'text-gray-700'}`}>
                          {promotion.job_structure?.job_title}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            {promotion.pay_grade_structure?.grade_name}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm ${currentTheme?.textSecondary || 'text-gray-700'}`}>
                          {promotion.promotion_date}
                        </td>
                        <td className={`px-4 py-3 text-sm ${currentTheme?.textSecondary || 'text-gray-700'}`}>
                          {promotion.effective_date}
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

      {/* Unmatched Staff Modal */}
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
