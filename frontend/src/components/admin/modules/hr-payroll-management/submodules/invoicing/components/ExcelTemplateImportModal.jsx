import React, { useState } from "react";
import ExcelTemplateUpload from "./ExcelTemplateUpload";
import { apiService } from "@/services/api";

/**
 * ExcelTemplateImportModal Component
 *
 * Modal interface for Excel template import with:
 * - Step-by-step import process
 * - Template naming and configuration
 * - Preview and confirmation
 * - Error handling and feedback
 */
const ExcelTemplateImportModal = ({
  isOpen,
  onClose,
  selectedClient,
  selectedGrade,
  onImportComplete,
}) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Configure, 3: Review
  const [previewData, setPreviewData] = useState(null);
  const [templateConfig, setTemplateConfig] = useState({
    name: "",
    description: "",
    setAsDefault: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  // Handle preview completion
  const handlePreviewComplete = (result) => {
    setPreviewData(result);
    setError(null);

    // Store the uploaded file for later import
    // We'll need to modify ExcelTemplateUpload to provide this

    // Auto-generate template name if not set
    if (!templateConfig.name) {
      const clientName = selectedClient?.organisation_name || "Unknown";
      const gradeName = selectedGrade?.grade_name || "Grade";
      const timestamp = new Date().toLocaleDateString();
      setTemplateConfig((prev) => ({
        ...prev,
        name: `${clientName} - ${gradeName} Template (${timestamp})`,
      }));
    }

    setStep(2);
  };

  // Handle error
  const handleError = (errorData) => {
    setError(errorData);
    console.error("Excel import error:", errorData);
  };

  // Handle import completion
  const handleImportComplete = (result) => {
    setImporting(false);
    onImportComplete?.(result);
    handleClose();
  };

  // Reset modal state
  const handleClose = () => {
    setStep(1);
    setPreviewData(null);
    setTemplateConfig({
      name: "",
      description: "",
      setAsDefault: false,
    });
    setError(null);
    setImporting(false);
    onClose();
  };

  // Go back to previous step
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  // Proceed to import
  const proceedToImport = () => {
    setStep(3);
    setError(null);
  };

  // Handle the actual import
  const handleImport = async () => {
    if (!selectedFile || !selectedClient || !selectedGrade) {
      setError({
        type: "validation",
        message: "Missing required information",
        details: "Please ensure file, client, and pay grade are selected",
      });
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("excel_file", selectedFile);
      formData.append("client_id", selectedClient.id);
      formData.append("pay_grade_structure_id", selectedGrade.id);
      formData.append("template_name", templateConfig.name);
      formData.append("description", templateConfig.description);
      formData.append(
        "set_as_default",
        templateConfig.setAsDefault ? "1" : "0"
      );

      const response = await fetch(
        `${apiService.baseURL}/invoice-templates/import-excel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiService.getAuthToken()}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        handleImportComplete(result);
      } else {
        throw new Error(result.message || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      setError({
        type: "import",
        message: "Failed to import Excel template",
        details: error.message,
      });
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Import Excel Template
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedClient?.organisation_name} -{" "}
                {selectedGrade?.grade_name}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-4">
            <div className="flex items-center space-x-4">
              {[
                { step: 1, label: "Upload File", icon: "📁" },
                { step: 2, label: "Configure Template", icon: "⚙️" },
                { step: 3, label: "Review & Import", icon: "✅" },
              ].map((item) => (
                <div key={item.step} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      step >= item.step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step > item.step ? "✓" : item.step}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      step >= item.step ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.step < 3 && (
                    <svg
                      className="w-5 h-5 text-gray-300 ml-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div>
              <ExcelTemplateUpload
                onPreviewComplete={handlePreviewComplete}
                onError={handleError}
                onFileSelected={(file) => setSelectedFile(file)}
                selectedClient={selectedClient}
                selectedGrade={selectedGrade}
              />
            </div>
          )}

          {/* Step 2: Template Configuration */}
          {step === 2 && previewData && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Configure Template Details
                </h4>

                <div className="grid grid-cols-1 gap-6">
                  {/* Template Name */}
                  <div>
                    <label
                      htmlFor="template-name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Template Name *
                    </label>
                    <input
                      id="template-name"
                      type="text"
                      value={templateConfig.name}
                      onChange={(e) =>
                        setTemplateConfig((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter template name"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="template-description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Description
                    </label>
                    <textarea
                      id="template-description"
                      value={templateConfig.description}
                      onChange={(e) =>
                        setTemplateConfig((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional description for this template"
                    />
                  </div>

                  {/* Set as Default */}
                  <div className="flex items-center">
                    <input
                      id="set-default"
                      type="checkbox"
                      checked={templateConfig.setAsDefault}
                      onChange={(e) =>
                        setTemplateConfig((prev) => ({
                          ...prev,
                          setAsDefault: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="set-default"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Set as default template for this client and pay grade
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3">
                  Template Preview
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">
                      Components Found:
                    </span>
                    <div className="mt-1 space-y-1">
                      {previewData.structure_analysis?.component_breakdown &&
                        Object.entries(
                          previewData.structure_analysis.component_breakdown
                        ).map(([type, count]) => (
                          <div key={type} className="text-gray-600">
                            • {type.replace("_", " ")}: {count}
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Analysis:</span>
                    <div className="mt-1 space-y-1 text-gray-600">
                      <div>
                        Complexity:{" "}
                        {previewData.structure_analysis?.complexity_score || 0}
                        /100
                      </div>
                      <div>
                        Has Formulas:{" "}
                        {previewData.structure_analysis?.has_formulas
                          ? "Yes"
                          : "No"}
                      </div>
                      <div>
                        Status:{" "}
                        {previewData.structure_analysis?.completion_status ||
                          "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Import */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Review & Confirm Import
                </h4>

                <div className="space-y-4">
                  {/* Template Details */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">
                      Template Details
                    </h5>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div>
                        <span className="font-medium">Name:</span>{" "}
                        {templateConfig.name}
                      </div>
                      <div>
                        <span className="font-medium">Client:</span>{" "}
                        {selectedClient?.organisation_name}
                      </div>
                      <div>
                        <span className="font-medium">Pay Grade:</span>{" "}
                        {selectedGrade?.grade_name}
                      </div>
                      {templateConfig.description && (
                        <div>
                          <span className="font-medium">Description:</span>{" "}
                          {templateConfig.description}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Default Template:</span>{" "}
                        {templateConfig.setAsDefault ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>

                  {/* Import Summary */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-green-900 mb-2">
                      What will be imported:
                    </h5>
                    <div className="space-y-2 text-sm text-green-800">
                      {previewData?.structure_analysis?.component_breakdown &&
                        Object.entries(
                          previewData.structure_analysis.component_breakdown
                        ).map(
                          ([type, count]) =>
                            count > 0 && (
                              <div key={type}>
                                • {count}{" "}
                                {type
                                  .replace("_components", "")
                                  .replace("_", " ")}{" "}
                                component{count !== 1 ? "s" : ""}
                              </div>
                            )
                        )}
                    </div>
                  </div>

                  {/* Warnings */}
                  {previewData?.validation_warnings?.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-yellow-900 mb-2">
                        Import Warnings (
                        {previewData.validation_warnings.length})
                      </h5>
                      <div className="space-y-1 text-sm text-yellow-800">
                        {previewData.validation_warnings
                          .slice(0, 3)
                          .map((warning, index) => (
                            <div key={index}>• {warning}</div>
                          ))}
                        {previewData.validation_warnings.length > 3 && (
                          <div>
                            • ... and{" "}
                            {previewData.validation_warnings.length - 3} more
                            warnings
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
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
                    {error.type === "validation"
                      ? "Validation Error"
                      : error.type === "preview"
                      ? "Preview Error"
                      : error.type === "import"
                      ? "Import Error"
                      : "Error"}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error.message}</p>
                    {error.details && (
                      <p className="mt-1 font-mono text-xs">{error.details}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={goBack}
                disabled={importing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={importing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>

            {step === 2 && (
              <button
                onClick={proceedToImport}
                disabled={
                  !templateConfig.name.trim() ||
                  previewData?.validation_errors?.length > 0
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review Import
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleImport}
                disabled={
                  importing || !templateConfig.name.trim() || !selectedFile
                }
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {importing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Importing...
                  </>
                ) : (
                  "Import Template"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelTemplateImportModal;
