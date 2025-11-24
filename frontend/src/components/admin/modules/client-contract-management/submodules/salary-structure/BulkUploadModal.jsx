"use client";

import { useState, useCallback } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Info,
  Loader,
  Check,
} from "lucide-react";
import EmolumentGridEditor from "./EmolumentGridEditor";

/**
 * BulkUploadModal - Excel bulk upload workflow for pay grade emoluments
 *
 * 4-Step Workflow:
 * 1. Download Excel template (includes all pay grades with universal + custom component columns)
 * 2. Fill amounts offline in Excel
 * 3. Upload filled Excel → Preview with validation
 * 4. Confirm → Saves all pay grades
 *
 * Used in: SalaryStructure.jsx or PayGradesMaster component
 */
const BulkUploadModal = ({
  isOpen,
  onClose,
  onSuccess,
  currentClient = null,
  selectedJobStructure = null,
  currentTheme = "light",
}) => {
  const [step, setStep] = useState(1); // 1: Download, 2: Upload, 3: Preview, 4: Success
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const isDark = currentTheme === "dark";

  const handleDownloadTemplate = async () => {
    if (!currentClient) {
      alert("Please select a client first.");
      return;
    }

    if (!selectedJobStructure) {
      alert("Please select a job structure first.");
      return;
    }

    setDownloading(true);
    setErrors([]);

    try {
      const token = localStorage.getItem("token");
      const url = `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
      }/salary-structure/pay-grades/bulk-template?client_id=${
        currentClient.id
      }&job_structure_id=${selectedJobStructure.id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to download template");
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `PayGrades_${selectedJobStructure.job_code}_Template.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setStep(2); // Move to upload step
    } catch (error) {
      console.error("Error downloading template:", error);
      setErrors([
        error.message || "Failed to download template. Please try again.",
      ]);
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setErrors([
          "Invalid file type. Please upload an Excel file (.xlsx or .xls)",
        ]);
        setFile(null);
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        setErrors(["File size exceeds 5MB. Please upload a smaller file."]);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setErrors([]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrors(["Please select a file to upload."]);
      return;
    }

    setUploading(true);
    setErrors([]);
    setValidationErrors({});

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", currentClient.id);
      formData.append("job_structure_id", selectedJobStructure.id);

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
        }/salary-structure/pay-grades/bulk-upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setValidationErrors(result.errors);
        }
        throw new Error(result.message || "Failed to upload file");
      }

      // Parse preview data - backend returns result.data as array
      const preview = result.data || [];
      console.log("Preview data received:", preview);
      setPreviewData(preview);
      setStep(3); // Move to preview step
    } catch (error) {
      console.error("Error uploading file:", error);
      setErrors([error.message || "Failed to upload file. Please try again."]);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    console.log("handleConfirm called - previewData:", previewData);
    console.log("previewData length:", previewData.length);

    if (!previewData || previewData.length === 0) {
      setErrors(["No data to confirm. Please upload a valid file."]);
      return;
    }

    setConfirming(true);
    setErrors([]);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
        }/salary-structure/pay-grades/bulk-confirm`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preview_data: previewData,
            client_id: currentClient.id,
            job_structure_id: selectedJobStructure.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save pay grades");
      }

      const savedCount = result.data?.saved_count || previewData.length;
      setSuccessMessage(
        `Successfully updated ${savedCount} pay grade${
          savedCount !== 1 ? "s" : ""
        }!`
      );
      setStep(4); // Move to success step

      // Call onSuccess callback after delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Error confirming bulk upload:", error);
      setErrors([
        error.message || "Failed to save pay grades. Please try again.",
      ]);
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setValidationErrors({});
    setSuccessMessage("");
    onClose();
  };

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setValidationErrors({});
    setSuccessMessage("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isDark ? "bg-gray-900" : "bg-white"
        } rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden`}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">BULK UPLOAD PAY GRADES</h2>
              <p className="text-sm opacity-90 mt-1">
                {currentClient?.client_name || currentClient?.organisation_name}{" "}
                - {selectedJobStructure?.job_title}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div
          className={`px-6 py-4 border-b ${
            isDark
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1: Download */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                  step >= 1
                    ? "bg-indigo-600 text-white"
                    : isDark
                    ? "bg-gray-700 text-gray-400"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > 1 ? <Check className="w-5 h-5" /> : "1"}
              </div>
              <span
                className={`text-xs font-medium ${
                  step >= 1
                    ? isDark
                      ? "text-gray-200"
                      : "text-gray-900"
                    : isDark
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              >
                Download Template
              </span>
            </div>

            {/* Connector */}
            <div
              className={`flex-1 h-0.5 mx-2 ${
                step >= 2
                  ? "bg-indigo-600"
                  : isDark
                  ? "bg-gray-700"
                  : "bg-gray-200"
              }`}
            />

            {/* Step 2: Upload */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                  step >= 2
                    ? "bg-indigo-600 text-white"
                    : isDark
                    ? "bg-gray-700 text-gray-400"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > 2 ? <Check className="w-5 h-5" /> : "2"}
              </div>
              <span
                className={`text-xs font-medium ${
                  step >= 2
                    ? isDark
                      ? "text-gray-200"
                      : "text-gray-900"
                    : isDark
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              >
                Upload File
              </span>
            </div>

            {/* Connector */}
            <div
              className={`flex-1 h-0.5 mx-2 ${
                step >= 3
                  ? "bg-indigo-600"
                  : isDark
                  ? "bg-gray-700"
                  : "bg-gray-200"
              }`}
            />

            {/* Step 3: Preview */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                  step >= 3
                    ? "bg-indigo-600 text-white"
                    : isDark
                    ? "bg-gray-700 text-gray-400"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > 3 ? <Check className="w-5 h-5" /> : "3"}
              </div>
              <span
                className={`text-xs font-medium ${
                  step >= 3
                    ? isDark
                      ? "text-gray-200"
                      : "text-gray-900"
                    : isDark
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              >
                Preview & Confirm
              </span>
            </div>

            {/* Connector */}
            <div
              className={`flex-1 h-0.5 mx-2 ${
                step >= 4
                  ? "bg-green-600"
                  : isDark
                  ? "bg-gray-700"
                  : "bg-gray-200"
              }`}
            />

            {/* Step 4: Success */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                  step >= 4
                    ? "bg-green-600 text-white"
                    : isDark
                    ? "bg-gray-700 text-gray-400"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step >= 4 ? <Check className="w-5 h-5" /> : "4"}
              </div>
              <span
                className={`text-xs font-medium ${
                  step >= 4
                    ? isDark
                      ? "text-gray-200"
                      : "text-gray-900"
                    : isDark
                    ? "text-gray-500"
                    : "text-gray-400"
                }`}
              >
                Complete
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                    Errors:
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                    Validation Errors:
                  </h4>
                  <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    {Object.entries(validationErrors).map(
                      ([field, messages]) => (
                        <li key={field}>
                          <strong>{field}:</strong>{" "}
                          {Array.isArray(messages)
                            ? messages.join(", ")
                            : messages}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Download Template */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                className={`p-6 border-2 border-dashed ${
                  isDark
                    ? "border-gray-700 bg-gray-800/50"
                    : "border-gray-300 bg-gray-50"
                } rounded-xl`}
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3
                    className={`text-lg font-semibold ${
                      isDark ? "text-gray-200" : "text-gray-900"
                    } mb-2`}
                  >
                    Download Excel Template
                  </h3>
                  <p
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    } mb-6 max-w-md mx-auto`}
                  >
                    Download the pre-filled Excel template with all pay grades
                    for this job structure. The template includes columns for
                    all universal and client-specific emolument components.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    disabled={
                      downloading || !currentClient || !selectedJobStructure
                    }
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors shadow-lg disabled:cursor-not-allowed"
                  >
                    {downloading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Generating Template...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Download Template</span>
                      </>
                    )}
                  </button>

                  {/* Skip to Upload Option */}
                  <button
                    onClick={() => setStep(2)}
                    className={`ml-4 inline-flex items-center space-x-2 px-6 py-3 ${
                      isDark
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    } font-medium rounded-lg transition-colors`}
                  >
                    <span>Skip to Upload</span>
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div
                className={`p-4 border ${
                  isDark
                    ? "border-blue-800 bg-blue-900/20"
                    : "border-blue-200 bg-blue-50"
                } rounded-lg`}
              >
                <div className="flex items-start">
                  <Info
                    className={`w-5 h-5 ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    } mr-2 flex-shrink-0 mt-0.5`}
                  />
                  <div>
                    <h4
                      className={`text-sm font-semibold ${
                        isDark ? "text-blue-300" : "text-blue-800"
                      } mb-2`}
                    >
                      Instructions:
                    </h4>
                    <ol
                      className={`list-decimal list-inside text-sm ${
                        isDark ? "text-blue-400" : "text-blue-700"
                      } space-y-1`}
                    >
                      <li>Download the Excel template</li>
                      <li>
                        Open it in Microsoft Excel, Google Sheets, or compatible
                        software
                      </li>
                      <li>
                        Fill in the amount values for each emolument component
                        (leave empty for ₦0)
                      </li>
                      <li>
                        Do NOT modify grade names, codes, or component column
                        headers
                      </li>
                      <li>Save the file and return here to upload</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Upload File */}
          {step === 2 && (
            <div className="space-y-6">
              <div
                className={`p-6 border-2 border-dashed ${
                  isDark
                    ? "border-gray-700 bg-gray-800/50"
                    : "border-gray-300 bg-gray-50"
                } rounded-xl`}
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                    <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3
                    className={`text-lg font-semibold ${
                      isDark ? "text-gray-200" : "text-gray-900"
                    } mb-2`}
                  >
                    Upload Filled Template
                  </h3>
                  <p
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    } mb-6`}
                  >
                    Select the Excel file you filled with emolument amounts
                  </p>

                  {/* File Input */}
                  <div className="max-w-md mx-auto">
                    <label
                      className={`flex flex-col items-center px-6 py-8 border-2 border-dashed ${
                        file
                          ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                          : isDark
                          ? "border-gray-600 bg-gray-800"
                          : "border-gray-300 bg-white"
                      } rounded-lg cursor-pointer hover:border-purple-400 transition-colors`}
                    >
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <FileSpreadsheet
                        className={`w-12 h-12 mb-3 ${
                          file
                            ? "text-green-600"
                            : isDark
                            ? "text-gray-400"
                            : "text-gray-400"
                        }`}
                      />
                      {file ? (
                        <div className="text-center">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                            {file.name}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Click to change file
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p
                            className={`text-sm font-medium ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Click to select file
                          </p>
                          <p
                            className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-500"
                            } mt-1`}
                          >
                            .xlsx or .xls (max 5MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  } font-medium transition-colors`}
                >
                  Back to Download
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors shadow-lg disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload & Preview</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <div
                className={`p-4 border ${
                  isDark
                    ? "border-green-800 bg-green-900/20"
                    : "border-green-200 bg-green-50"
                } rounded-lg`}
              >
                <div className="flex items-start">
                  <CheckCircle
                    className={`w-5 h-5 ${
                      isDark ? "text-green-400" : "text-green-600"
                    } mr-2 flex-shrink-0 mt-0.5`}
                  />
                  <div>
                    <h4
                      className={`text-sm font-semibold ${
                        isDark ? "text-green-300" : "text-green-800"
                      } mb-1`}
                    >
                      File Uploaded Successfully!
                    </h4>
                    <p
                      className={`text-sm ${
                        isDark ? "text-green-400" : "text-green-700"
                      }`}
                    >
                      Preview the data below. Click "Confirm & Save" to update
                      all pay grades, or "Cancel" to discard changes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Data */}
              <div>
                <h3
                  className={`text-lg font-semibold ${
                    isDark ? "text-gray-200" : "text-gray-900"
                  } mb-4`}
                >
                  Preview ({previewData.length} pay grade
                  {previewData.length !== 1 ? "s" : ""})
                </h3>

                {previewData.map((grade, index) => (
                  <div
                    key={index}
                    className={`mb-6 p-4 rounded-lg border ${
                      isDark
                        ? "border-gray-700 bg-gray-800/50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="mb-3">
                      <h4
                        className={`text-md font-semibold ${
                          isDark ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {grade.grade_name} ({grade.grade_code})
                      </h4>
                      {grade.pay_grade_id && (
                        <p
                          className={`text-xs ${
                            isDark ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          ID: {grade.pay_grade_id}
                        </p>
                      )}
                    </div>

                    {/* Use EmolumentGridEditor in read-only mode */}
                    <EmolumentGridEditor
                      emoluments={grade.emoluments || []}
                      currentTheme={currentTheme}
                      readOnly={true}
                      showRemoveButton={false}
                      className=""
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setStep(2)}
                  className={`px-4 py-2 rounded-lg border ${
                    isDark
                      ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  } font-medium transition-colors`}
                >
                  Back to Upload
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors shadow-lg disabled:cursor-not-allowed"
                >
                  {confirming ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Confirm & Save All</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
                <h3
                  className={`text-2xl font-bold ${
                    isDark ? "text-gray-200" : "text-gray-900"
                  } mb-2`}
                >
                  Bulk Upload Complete!
                </h3>
                <p
                  className={`text-lg ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  } mb-4`}
                >
                  {successMessage}
                </p>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  This window will close automatically...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {step !== 4 && (
          <div
            className={`px-6 py-4 border-t ${
              isDark
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-gray-50"
            } flex items-center justify-end`}
          >
            <button
              onClick={handleClose}
              className={`px-6 py-2 rounded-lg border ${
                isDark
                  ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              } font-medium transition-colors`}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadModal;
