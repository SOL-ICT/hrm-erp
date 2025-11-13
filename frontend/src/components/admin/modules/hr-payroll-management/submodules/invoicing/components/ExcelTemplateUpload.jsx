import React, { useState, useRef } from "react";
import { apiService } from "@/services/api";

/**
 * ExcelTemplateUpload Component
 *
 * Provides Excel template upload functionality with:
 * - Drag-and-drop file upload interface
 * - File validation and preview
 * - Integration with template import API
 * - Progress indicators and error handling
 *
 * Props:
 * - onPreviewComplete: Callback when preview is ready
 * - onImportComplete: Callback when import is successful
 * - onError: Callback for error handling
 * - selectedClient: Currently selected client for template creation
 * - selectedGrade: Currently selected pay grade
 * - disabled: Whether upload is disabled
 */
const ExcelTemplateUpload = ({
  onPreviewComplete,
  onImportComplete,
  onError,
  onFileSelected,
  selectedClient,
  selectedGrade,
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResults, setValidationResults] = useState(null);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      onError?.({
        type: "validation",
        message: "Please select a valid Excel file (.xlsx, .xls, or .csv)",
        details: "Only Excel and CSV files are supported",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      onError?.({
        type: "validation",
        message: "File size too large",
        details: "Maximum file size is 5MB",
      });
      return;
    }

    setSelectedFile(file);
    onFileSelected?.(file); // Notify parent component about file selection
    previewFile(file);
  };

  // Preview file contents
  const previewFile = async (file) => {
    setPreviewing(true);
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append("excel_file", file);

      const response = await fetch(
        `${apiService.baseURL}/invoice-templates/preview-excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiService.getAuthToken()}`,
          },
          body: formData,
        }
      );

      setUploadProgress(75);

      const result = await response.json();

      if (result.success) {
        setPreviewData(result.preview_data);
        setValidationResults({
          errors: result.validation_errors || [],
          warnings: result.validation_warnings || [],
          analysis: result.structure_analysis || {},
        });

        setUploadProgress(100);
        onPreviewComplete?.(result);
      } else {
        throw new Error(result.message || "Preview failed");
      }
    } catch (error) {
      console.error("Preview error:", error);
      onError?.({
        type: "preview",
        message: "Failed to preview Excel file",
        details: error.message,
      });
    } finally {
      setPreviewing(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Import template
  const importTemplate = async (
    templateName,
    description = "",
    setAsDefault = false
  ) => {
    if (!selectedFile || !selectedClient || !selectedGrade) {
      onError?.({
        type: "validation",
        message: "Missing required information",
        details: "Please select a file, client, and pay grade",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("excel_file", selectedFile);
      formData.append("client_id", selectedClient.id);
      formData.append("pay_grade_structure_id", selectedGrade.id);
      formData.append("template_name", templateName);
      formData.append("description", description);
      formData.append("set_as_default", setAsDefault ? "1" : "0");

      const response = await fetch("/api/invoice-templates/import-excel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onImportComplete?.(result);
        // Reset state after successful import
        resetState();
      } else {
        throw new Error(result.message || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      onError?.({
        type: "import",
        message: "Failed to import Excel template",
        details: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  // Reset component state
  const resetState = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setValidationResults(null);
    setUploadProgress(0);
    onFileSelected?.(null); // Clear parent file reference
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download sample template
  const downloadSampleTemplate = async () => {
    try {
      const response = await fetch(
        `${apiService.baseURL}/invoice-templates/download-sample`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiService.getAuthToken()}`,
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        }
      );

      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SOL_ICT_Payroll_Template_${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to download sample template");
      }
    } catch (error) {
      console.error("Download error:", error);
      onError?.({
        type: "download",
        message: "Failed to download sample template",
        details: error.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Sample Download */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Import from Excel
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload an Excel file to automatically create a template
          </p>
        </div>
        <button
          onClick={downloadSampleTemplate}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Sample Template
        </button>
      </div>

      {/* Upload Area */}
      <div className="space-y-4">
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? "border-blue-400 bg-blue-50"
              : selectedFile
              ? "border-green-400 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={(e) =>
              e.target.files[0] && handleFileSelect(e.target.files[0])
            }
            disabled={disabled}
          />

          <div className="text-center">
            {selectedFile ? (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-green-700">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetState();
                  }}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Excel files (.xlsx, .xls) or CSV up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {(uploading || previewing || uploadProgress > 0) && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {previewing
                  ? "Analyzing file..."
                  : uploading
                  ? "Importing..."
                  : "Processing..."}
              </p>
            </div>
          )}
        </div>

        {/* Context Requirements */}
        {(!selectedClient || !selectedGrade) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-yellow-400 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Template Context Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Before importing, please select:</p>
                  <ul className="list-disc list-inside mt-1">
                    {!selectedClient && <li>A client organization</li>}
                    {!selectedGrade && <li>A pay grade structure</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Results */}
      {validationResults && (
        <div className="space-y-4">
          {/* Errors */}
          {validationResults.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Validation Errors ({validationResults.errors.length})
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {validationResults.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {validationResults.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Warnings ({validationResults.warnings.length})
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      {validationResults.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Summary */}
          {validationResults.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Template Analysis
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <span className="font-medium">Total Components:</span>{" "}
                  {validationResults.analysis.total_components || 0}
                </div>
                <div>
                  <span className="font-medium">Complexity Score:</span>{" "}
                  {validationResults.analysis.complexity_score || 0}/100
                </div>
                <div>
                  <span className="font-medium">Has Formulas:</span>{" "}
                  {validationResults.analysis.has_formulas ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span
                    className={`ml-1 px-2 py-0.5 rounded text-xs ${
                      validationResults.analysis.completion_status === "valid"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {validationResults.analysis.completion_status || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Data Summary */}
      {previewData && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">
            Extracted Components Preview
          </h3>
          <div className="space-y-3 text-sm">
            {previewData.components &&
              Object.entries(previewData.components).map(
                ([section, components]) =>
                  components.length > 0 && (
                    <div key={section}>
                      <h4 className="font-medium text-gray-700 capitalize">
                        {section.replace("_", " ")} ({components.length})
                      </h4>
                      <div className="ml-4 space-y-1">
                        {components.slice(0, 3).map((component, index) => (
                          <div key={index} className="text-gray-600">
                            • {component.name}
                            {component.type === "fixed" &&
                              ` - ₦${component.amount?.toLocaleString()}`}
                            {component.type === "percentage" &&
                              ` - ${component.rate}%`}
                            {component.type === "formula" &&
                              ` - ${component.formula}`}
                          </div>
                        ))}
                        {components.length > 3 && (
                          <div className="text-gray-500">
                            ... and {components.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelTemplateUpload;
