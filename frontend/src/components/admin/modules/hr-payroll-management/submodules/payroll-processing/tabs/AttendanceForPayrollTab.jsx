"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Trash2,
  Calendar,
} from "lucide-react";
import ClientSelector from "@/components/employee-management/ClientSelector";
import { invoiceApiService } from "@/services/modules/invoicing";

/**
 * AttendanceForPayrollTab Component
 *
 * Purpose: Upload and manage attendance data specifically for payroll processing
 * Differences from invoice attendance:
 * - Uses is_for_payroll=true flag
 * - Integrates with payroll runs
 * - Modern UI with gradient headers
 *
 * API Endpoints:
 * - GET /api/attendance/uploads/payroll (returns is_for_payroll=true only)
 * - POST /api/attendance-export/upload (with is_for_payroll flag)
 * - POST /api/attendance-export/{id}/validate
 */
export default function AttendanceForPayrollTab({
  currentTheme,
  preferences,
  selectedClient,
  setSelectedClient,
}) {
  // State Management
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState(null);

  // Upload Form State
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM format
  const [selectedFile, setSelectedFile] = useState(null);

  // Uploads List State
  const [payrollUploads, setPayrollUploads] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [validationResults, setValidationResults] = useState(null);

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Fetch payroll attendance uploads when client changes
  useEffect(() => {
    if (selectedClient) {
      fetchPayrollUploads();
    } else {
      setPayrollUploads([]);
    }
  }, [selectedClient]);

  /**
   * Fetch attendance uploads filtered by is_for_payroll=true
   */
  const fetchPayrollUploads = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Use the dedicated payroll uploads endpoint
      const response = await invoiceApiService.getPayrollAttendanceUploads({
        client_id: selectedClient,
      });

      if (response.success) {
        setPayrollUploads(response.data || []);
      } else {
        setMessage({
          type: "error",
          text:
            response.message || "Failed to fetch payroll attendance uploads",
        });
      }
    } catch (error) {
      console.error("Error fetching payroll uploads:", error);
      setMessage({
        type: "error",
        text: "An error occurred while fetching uploads. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedExtensions = ["csv", "xlsx", "xls"];
    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      setMessage({
        type: "error",
        text: "Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
      });
      event.target.value = ""; // Reset file input
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: "File size exceeds 5MB limit. Please upload a smaller file.",
      });
      event.target.value = ""; // Reset file input
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    setValidationResults(null);
    setMessage(null);
  };

  /**
   * Handle attendance upload with is_for_payroll=true
   */
  const handleUpload = async () => {
    if (!selectedClient) {
      setMessage({
        type: "error",
        text: "Please select a client first",
      });
      return;
    }

    if (!selectedMonth) {
      setMessage({
        type: "error",
        text: "Please select a month",
      });
      return;
    }

    if (!selectedFile) {
      setMessage({
        type: "error",
        text: "Please select a file to upload",
      });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // Step 1: Upload file with is_for_payroll flag
      const uploadResponse = await invoiceApiService.uploadWithDirectMatching(
        selectedFile,
        selectedClient,
        selectedMonth,
        true // is_for_payroll flag
      );

      if (!uploadResponse.success) {
        setMessage({
          type: "error",
          text: uploadResponse.message || "Upload failed",
        });
        setUploading(false);
        return;
      }

      const uploadId =
        uploadResponse.data?.upload_id || uploadResponse.data?.id;

      setUploadResult({
        upload_id: uploadId,
        matched_count:
          uploadResponse.data?.matched_count ||
          uploadResponse.data?.matchedCount ||
          0,
        unmatched_count:
          uploadResponse.data?.unmatched_count ||
          uploadResponse.data?.unmatchedCount ||
          0,
        total_records:
          uploadResponse.data?.total_records ||
          uploadResponse.data?.totalRecords ||
          0,
        file_name:
          uploadResponse.data?.file_name ||
          uploadResponse.data?.fileName ||
          selectedFile.name,
        uploaded_at:
          uploadResponse.data?.uploaded_at ||
          uploadResponse.data?.uploadedAt ||
          new Date().toISOString(),
      });

      // Step 2: Run validation
      setValidating(true);
      const validationResponse =
        await invoiceApiService.validateUploadedAttendance(uploadId);

      if (validationResponse.success) {
        setValidationResults(validationResponse.data);

        // Extract counts from validation response
        const matchedCount =
          validationResponse.data?.matched_staff?.length ||
          validationResponse.data?.valid_records ||
          0;
        const unmatchedCount =
          validationResponse.data?.unmatched_staff?.length || 0;
        const totalCount = validationResponse.data?.total_records || 0;

        setMessage({
          type: "success",
          text: `Upload successful! ${matchedCount} records matched.`,
        });

        // Step 3: Show preview modal with corrected data
        setPreviewData({
          upload_id: uploadId,
          total_records: totalCount,
          matched_count: matchedCount,
          unmatched_count: unmatchedCount,
          month: selectedMonth,
          payrollMonth: selectedMonth,
          validation: validationResponse.data,
        });
        setShowPreviewModal(true);

        // Refresh uploads list
        fetchPayrollUploads();

        // Reset form
        setSelectedFile(null);
        document.getElementById("attendance-file-input").value = "";
      } else {
        setMessage({
          type: "warning",
          text: "Upload completed but validation failed. Please review the data.",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text:
          error.message || "An error occurred during upload. Please try again.",
      });
    } finally {
      setUploading(false);
      setValidating(false);
    }
  };

  /**
   * Handle upload deletion
   */
  const handleDeleteUpload = async (uploadId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this upload? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await invoiceApiService.deleteAttendanceUpload(uploadId);

      if (response.success) {
        setMessage({
          type: "success",
          text: "Upload deleted successfully",
        });

        fetchPayrollUploads();
      } else {
        setMessage({
          type: "error",
          text: response.message || "Failed to delete upload",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage({
        type: "error",
        text: "Failed to delete upload. Please try again.",
      });
    }
  };

  /**
   * Handle view upload details
   */
  const handleViewUpload = (upload) => {
    setPreviewData(upload);
    setShowPreviewModal(true);
  };

  /**
   * Download template CSV with all active staff pre-filled
   */
  const handleDownloadTemplate = async () => {
    if (!selectedClient) {
      setMessage({
        type: "error",
        text: "Please select a client first",
      });
      return;
    }

    try {
      setMessage({
        type: "info",
        text: "Generating template...",
      });

      // Call backend to download template with all staff
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payroll/attendance-template/${selectedClient}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to download template");
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `payroll_attendance_template_${
            selectedMonth || new Date().toISOString().slice(0, 7)
          }.csv`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage({
        type: "success",
        text: "Template downloaded with all active staff",
      });
    } catch (error) {
      console.error("Download template error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to download template. Please try again.",
      });
    }
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "⏳ Pending",
      },
      validated: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "✓ Validated",
      },
      error: { bg: "bg-red-100", text: "text-red-800", label: "✗ Error" },
      processing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "⚙ Processing",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  /**
   * Format date to readable string
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /**
   * Format month to readable string
   * Handles both YYYY-MM and YYYY-MM-DD formats
   */
  const formatMonth = (monthString) => {
    if (!monthString) return "N/A";
    try {
      // Extract year and month from either YYYY-MM or YYYY-MM-DD
      const parts = monthString.split("-");
      if (parts.length < 2) return "N/A";

      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed

      const date = new Date(year, month);
      return date.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting month:", error);
      return "N/A";
    }
  };

  return (
    <div className="space-y-4">
      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : message.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : message.type === "warning"
              ? "bg-yellow-50 border-yellow-200 text-yellow-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {message.type === "success" && (
                <CheckCircle className="h-5 w-5" />
              )}
              {message.type === "error" && <XCircle className="h-5 w-5" />}
              {message.type === "warning" && (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Client Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <ClientSelector value={selectedClient} onChange={setSelectedClient} />
      </div>

      {!selectedClient ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
          <div className="text-gray-400 mb-2">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 font-medium">
            Please select a client to view and upload attendance
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Use the client selector above to get started
          </p>
        </div>
      ) : (
        <>
          {/* Two-Column Layout: Upload Form + Instructions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT: Upload Form */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                  <Upload className="h-4 w-4 mr-2 text-blue-600" />
                  📤 Upload Attendance for Payroll
                </h3>
              </div>

              <div className="p-4 space-y-4">
                {/* Month Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    Payroll Month
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* File Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    <FileText className="inline h-3 w-3 mr-1" />
                    Attendance File
                  </label>
                  <input
                    id="attendance-file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFile && (
                    <p className="mt-1.5 text-xs text-gray-600">
                      Selected:{" "}
                      <span className="font-medium">{selectedFile.name}</span> (
                      {(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading || validating}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </span>
                  ) : validating ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Validating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Attendance
                    </span>
                  )}
                </button>

                {/* Download Template Button */}
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <Download className="inline h-4 w-4 mr-2" />
                  Download Template
                </button>
              </div>
            </div>

            {/* RIGHT: Upload Instructions */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-purple-600" />
                  📋 Upload Instructions
                </h3>
              </div>

              <div className="p-4 space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    File Format Requirements:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Accepted formats: CSV, Excel (.xlsx, .xls)</li>
                    <li>Maximum file size: 5MB</li>
                    <li>
                      Required columns: Employee ID, Employee Name, Days Present
                    </li>
                    <li>
                      System will automatically match employees by ID and name
                    </li>
                    <li>
                      Days Absent is calculated automatically from working days
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    Upload Process:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Download the template using the button below</li>
                    <li>Fill in Days Present for each employee</li>
                    <li>Select the payroll month from the dropdown</li>
                    <li>Choose your completed file</li>
                    <li>Click "Upload Attendance" to process</li>
                    <li>Review matching results and map any unmatched staff</li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-1">
                    💡 Pro Tip:
                  </p>
                  <p className="text-xs text-blue-700">
                    Employee IDs in your file must match the IDs in the system.
                    The system will automatically validate and match records
                    during upload.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">
                    ⚠️ Important:
                  </p>
                  <p className="text-xs text-yellow-700">
                    This attendance data is specifically for payroll processing.
                    It will be used to calculate employee salaries and
                    deductions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Payroll Attendance Uploads Table */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-b">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-green-600" />
                📋 Recent Payroll Attendance Uploads
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <svg
                  className="animate-spin h-8 w-8 mx-auto text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="mt-2 text-sm text-gray-600">Loading uploads...</p>
              </div>
            ) : payrollUploads.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">
                  No attendance uploads yet
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Upload your first attendance file using the form above
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        File Name
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Month
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Upload Date
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Records
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrollUploads.map((upload, index) => (
                      <tr
                        key={upload.id || index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {upload.file_name || upload.fileName || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500">
                                Uploaded by:{" "}
                                {upload.uploader
                                  ? upload.uploader.name
                                  : upload.uploaded_by ||
                                    upload.uploadedBy ||
                                    "System"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {formatMonth(
                            upload.payroll_month ||
                              upload.payrollMonth ||
                              upload.month
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(
                            upload.created_at ||
                              upload.uploaded_at ||
                              upload.uploadedAt
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {upload.total_records || upload.totalRecords || 0}{" "}
                              total
                            </div>
                            <div className="text-xs text-gray-500">
                              {upload.successfully_matched ||
                                upload.matched_count ||
                                upload.matchedCount ||
                                0}{" "}
                              matched /{" "}
                              {upload.failed_matches ||
                                upload.unmatched_count ||
                                upload.unmatchedCount ||
                                0}{" "}
                              unmatched
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(
                            upload.validation_status ||
                              upload.status ||
                              "pending"
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewUpload(upload)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUpload(upload.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                              title="Delete Upload"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Preview Modal (Simplified - full modal would be in separate component) */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Upload Preview
                </h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="space-y-4">
                {/* Upload Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-600 uppercase">
                      Total Records
                    </p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {previewData.total_records ||
                        previewData.totalRecords ||
                        0}
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-600 uppercase">
                      Matched
                    </p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {previewData.matched_count ||
                        previewData.matchedCount ||
                        0}
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-yellow-600 uppercase">
                      Unmatched
                    </p>
                    <p className="text-2xl font-bold text-yellow-700 mt-1">
                      {previewData.unmatched_count ||
                        previewData.unmatchedCount ||
                        0}
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-600 uppercase">
                      Month
                    </p>
                    <p className="text-lg font-bold text-purple-700 mt-1">
                      {formatMonth(
                        previewData.month || previewData.payrollMonth
                      )}
                    </p>
                  </div>
                </div>

                {/* Validation Results - User Friendly Display */}
                {previewData.validation && (
                  <div className="space-y-4">
                    {/* Matched Staff Section */}
                    {previewData.validation.matched_staff &&
                      previewData.validation.matched_staff.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg">
                          <div className="bg-green-50 border-b border-green-200 px-4 py-3">
                            <h4 className="text-sm font-semibold text-green-800 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Successfully Matched Staff (
                              {previewData.validation.matched_staff.length})
                            </h4>
                          </div>
                          <div className="p-4">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Employee Code
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Name
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Days Worked
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {previewData.validation.matched_staff.map(
                                    (staff, index) => (
                                      <tr
                                        key={index}
                                        className="hover:bg-gray-50"
                                      >
                                        <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                          {staff.employee_code}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-700">
                                          {staff.employee_name}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-700">
                                          {staff.days_worked} days
                                        </td>
                                        <td className="px-3 py-2">
                                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            {staff.direct_id_matched
                                              ? "✓ Exact Match"
                                              : "≈ Fuzzy Match"}
                                          </span>
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Unmatched Staff Section */}
                    {previewData.validation.unmatched_staff &&
                      previewData.validation.unmatched_staff.length > 0 && (
                        <div className="bg-white border border-yellow-200 rounded-lg">
                          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
                            <h4 className="text-sm font-semibold text-yellow-800 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Unmatched Staff (
                              {previewData.validation.unmatched_staff.length})
                            </h4>
                          </div>
                          <div className="p-4">
                            <div className="space-y-2">
                              {previewData.validation.unmatched_staff.map(
                                (staff, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded p-2"
                                  >
                                    <div>
                                      <span className="font-medium text-gray-900">
                                        {staff.employee_code}
                                      </span>
                                      <span className="text-gray-600 ml-2">
                                        - {staff.employee_name}
                                      </span>
                                    </div>
                                    <span className="text-xs text-yellow-700">
                                      Not found in system
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Errors Section */}
                    {previewData.validation.errors &&
                      JSON.parse(previewData.validation.errors).length > 0 && (
                        <div className="bg-white border border-red-200 rounded-lg">
                          <div className="bg-red-50 border-b border-red-200 px-4 py-3">
                            <h4 className="text-sm font-semibold text-red-800 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Validation Errors (
                              {JSON.parse(previewData.validation.errors).length}
                              )
                            </h4>
                          </div>
                          <div className="p-4">
                            <ul className="space-y-1">
                              {JSON.parse(previewData.validation.errors).map(
                                (error, index) => (
                                  <li
                                    key={index}
                                    className="text-sm text-red-700"
                                  >
                                    • {error}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                    {/* Template Coverage Summary */}
                    {previewData.validation.template_coverage && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">
                          Template Coverage
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">
                              Covered Pay Grades:
                            </span>
                            <span className="ml-2 font-semibold text-blue-700">
                              {
                                previewData.validation.template_coverage
                                  .covered_pay_grades
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Coverage:</span>
                            <span className="ml-2 font-semibold text-blue-700">
                              {
                                previewData.validation.template_coverage
                                  .coverage_percentage
                              }
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
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
