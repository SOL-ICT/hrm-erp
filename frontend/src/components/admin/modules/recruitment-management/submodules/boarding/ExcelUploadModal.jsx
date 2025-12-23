import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Users,
} from "lucide-react";
import { manualBoardingAPI } from "@/services/modules/recruitment-management/manualBoardingAPI";
import { bulkStaffUploadAPI } from "@/services/modules/recruitment-management/bulkStaffUploadAPI";
import { FORM_FIELDS, EXCEL_HEADERS } from "@/constants/databaseFields";

const ExcelUploadModal = ({ isOpen, onClose, onSuccess, currentTheme }) => {
  // Form state
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedTicket, setSelectedTicket] = useState("");
  const [uploadFile, setUploadFile] = useState(null);

  // Dropdown data
  const [clients, setClients] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [templateData, setTemplateData] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [processingUpload, setProcessingUpload] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Selection, 2: Template/Upload, 3: Preview, 4: Results
  const [previewData, setPreviewData] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
      resetModal();
    }
  }, [isOpen]);

  // Load tickets when client changes
  useEffect(() => {
    if (selectedClient) {
      loadTickets();
    } else {
      setTickets([]);
      setSelectedTicket("");
    }
  }, [selectedClient]);

  const resetModal = () => {
    setSelectedClient("");
    setSelectedTicket("");
    setUploadFile(null);
    setTemplateData(null);
    setPreviewData(null);
    setUploadResults(null);
    setErrors({});
    setStep(1);
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await manualBoardingAPI.getClients();

      if (response.success) {
        setClients(response.data || []);
      } else {
        setErrors({ general: "Failed to load clients" });
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      setErrors({ general: "Error loading clients" });
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      const response = await manualBoardingAPI.getTicketsByClient(
        selectedClient
      );

      if (response.success) {
        setTickets(response.data || []);
      } else {
        setErrors({ tickets: "Failed to load recruitment tickets" });
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
      setErrors({ tickets: "Error loading recruitment tickets" });
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedClient || !selectedTicket) {
      setErrors({ template: "Please select client and ticket first" });
      return;
    }

    try {
      setLoadingTemplate(true);
      setErrors({});

      // Use the new bulk staff upload API
      const response = await bulkStaffUploadAPI.downloadTemplate(
        selectedClient,
        selectedTicket
      );

      if (response.success) {
        setTemplateData({ downloaded: true, filename: response.filename });
      } else {
        setErrors({
          template: response.message || "Failed to download template",
          details: response.errors,
        });
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      setErrors({ template: "Error downloading template" });
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file using the API service
      const validation = bulkStaffUploadAPI.validateFile(file);

      if (!validation.isValid) {
        setErrors({ file: validation.error });
        return;
      }

      setUploadFile(file);
      setErrors({});
    }
  };

  const handlePreviewUpload = async () => {
    if (!uploadFile || !selectedClient || !selectedTicket) {
      setErrors({ preview: "Please select client, ticket, and upload file" });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const formData = new FormData();
      formData.append("excel_file", uploadFile);
      formData.append("client_id", selectedClient);
      formData.append("recruitment_request_id", selectedTicket);

      const response = await bulkStaffUploadAPI.previewUpload(formData);

      if (response.success) {
        setPreviewData(response.data);
        setStep(3);
      } else {
        setErrors({
          preview: response.message || "Failed to preview upload",
          details: response.errors,
        });
      }
    } catch (error) {
      console.error("Error previewing upload:", error);
      setErrors({ preview: "Error previewing upload" });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessUpload = async () => {
    if (!uploadFile || !selectedClient || !selectedTicket) {
      setErrors({ upload: "Missing required data for upload" });
      return;
    }

    try {
      setProcessingUpload(true);
      setErrors({});

      const formData = new FormData();
      formData.append("excel_file", uploadFile);
      formData.append("client_id", selectedClient);
      formData.append("recruitment_request_id", selectedTicket);
      formData.append("offer_already_accepted", "1"); // Staff being uploaded have already accepted offers

      const response = await bulkStaffUploadAPI.processUpload(formData);

      if (response.success) {
        setUploadResults(response.data);
        setStep(4);

        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setErrors({
          upload: response.message || "Failed to process upload",
          details: response.errors,
        });
      }
    } catch (error) {
      console.error("Error processing upload:", error);
      setErrors({ upload: "Error processing upload" });
    } finally {
      setProcessingUpload(false);
    }
  };

  const selectedClientData = clients.find(
    (c) => c.id === parseInt(selectedClient)
  );
  const selectedTicketData = tickets.find(
    (t) => t.id === parseInt(selectedTicket)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${
          currentTheme === "dark" ? "bg-gray-800 text-white" : ""
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            currentTheme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            <Upload className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold">Excel Bulk Staff Upload</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              currentTheme === "dark"
                ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div
          className={`px-6 py-3 border-b ${
            currentTheme === "dark"
              ? "border-gray-700 bg-gray-750"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step >= stepNumber
                      ? "bg-green-600 text-white"
                      : currentTheme === "dark"
                      ? "bg-gray-600 text-gray-300"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {step > stepNumber ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= stepNumber
                      ? "text-green-600 font-medium"
                      : currentTheme === "dark"
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  {stepNumber === 1 && "Select Client & Ticket"}
                  {stepNumber === 2 && "Download Template & Upload"}
                  {stepNumber === 3 && "Preview Data"}
                  {stepNumber === 4 && "Process Results"}
                </span>
                {stepNumber < 4 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      step > stepNumber
                        ? "bg-green-600"
                        : currentTheme === "dark"
                        ? "bg-gray-600"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Client and Ticket Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium">
                  Select Client and Recruitment Ticket
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Client Organization *
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.client
                        ? "border-red-500"
                        : currentTheme === "dark"
                        ? "border-gray-600 bg-gray-700"
                        : "border-gray-300"
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.client_name} ({client.prefix})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ticket Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Recruitment Ticket *
                  </label>
                  <select
                    value={selectedTicket}
                    onChange={(e) => setSelectedTicket(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.ticket
                        ? "border-red-500"
                        : currentTheme === "dark"
                        ? "border-gray-600 bg-gray-700"
                        : "border-gray-300"
                    }`}
                    disabled={loadingTickets || !selectedClient}
                  >
                    <option value="">
                      {loadingTickets
                        ? "Loading tickets..."
                        : "Select a recruitment ticket..."}
                    </option>
                    {tickets.map((ticket) => (
                      <option key={ticket.id} value={ticket.id}>
                        {ticket.ticket_code} - {ticket.job_title}
                        (Available: {ticket.available_slots})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Info */}
              {selectedClientData && selectedTicketData && (
                <div
                  className={`p-4 rounded-lg ${
                    currentTheme === "dark" ? "bg-gray-700" : "bg-green-50"
                  }`}
                >
                  <h4 className="font-medium text-green-800 mb-2">
                    Selection Summary
                  </h4>
                  <div className="text-sm text-green-600 space-y-1">
                    <p>
                      <span className="font-medium">Client:</span>{" "}
                      {selectedClientData.client_name}
                    </p>
                    <p>
                      <span className="font-medium">Position:</span>{" "}
                      {selectedTicketData.job_title}
                    </p>
                    <p>
                      <span className="font-medium">Available Positions:</span>{" "}
                      {selectedTicketData.available_slots}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Template Download and File Upload */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium">
                  Download Template & Upload File
                </h3>
              </div>

              {/* Template Download */}
              <div
                className={`p-4 rounded-lg border ${
                  currentTheme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <h4 className="font-medium mb-2">Step 1: Download Template</h4>
                <p className="text-sm mb-3">
                  Download the Excel template with pre-filled information for
                  your selected client and ticket.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  disabled={
                    loadingTemplate || !selectedClient || !selectedTicket
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loadingTemplate && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <Download className="h-4 w-4" />
                  <span>
                    {loadingTemplate
                      ? "Generating..."
                      : "Download Excel Template"}
                  </span>
                </button>
                {errors.template && (
                  <p className="text-red-500 text-sm mt-2">{errors.template}</p>
                )}
                {templateData && templateData.downloaded && (
                  <p className="text-green-600 text-sm mt-2">
                    ✓ Template downloaded successfully!
                  </p>
                )}
              </div>

              {/* File Upload */}
              <div
                className={`p-4 rounded-lg border ${
                  currentTheme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <h4 className="font-medium mb-2">
                  Step 2: Upload Completed File
                </h4>
                <p className="text-sm mb-3">
                  Fill in the template and upload the completed Excel file.
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label htmlFor="excel-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to select file or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Excel (.xlsx, .xls) or CSV files up to 10MB
                    </p>
                  </label>
                </div>

                {uploadFile && (
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        {uploadFile.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(uploadFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                )}

                {errors.file && (
                  <p className="text-red-500 text-sm mt-2">{errors.file}</p>
                )}
              </div>

              {/* Template Information */}
              {templateData && templateData.downloaded && (
                <div
                  className={`p-4 rounded-lg ${
                    currentTheme === "dark" ? "bg-gray-700" : "bg-yellow-50"
                  }`}
                >
                  <h4 className="font-medium text-yellow-800 mb-2">
                    Template Downloaded
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">✓</span> Excel template with
                      pre-filled client and ticket information
                    </p>
                    <p>
                      <span className="font-medium">✓</span> Available pay
                      grades listed at the bottom of the template
                    </p>
                    <p>
                      <span className="font-medium">✓</span> Sample data row for
                      reference (delete before uploading)
                    </p>
                    <p>
                      <span className="font-medium">✓</span> Formatted fields
                      with proper validation hints
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview Data */}
          {step === 3 && previewData && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium">Preview Upload Data</h3>
              </div>

              {/* Preview Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-lg ${
                    currentTheme === "dark" ? "bg-gray-700" : "bg-blue-50"
                  }`}
                >
                  <div className="text-2xl font-bold text-blue-600">
                    {previewData.total_rows}
                  </div>
                  <div className="text-sm text-blue-600">Total Rows</div>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    currentTheme === "dark" ? "bg-gray-700" : "bg-green-50"
                  }`}
                >
                  <div className="text-2xl font-bold text-green-600">
                    {previewData.valid_rows}
                  </div>
                  <div className="text-sm text-green-600">Valid Rows</div>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    currentTheme === "dark" ? "bg-gray-700" : "bg-red-50"
                  }`}
                >
                  <div className="text-2xl font-bold text-red-600">
                    {previewData.invalid_rows}
                  </div>
                  <div className="text-sm text-red-600">Invalid Rows</div>
                </div>
              </div>

              {/* Invalid Records Details */}
              {previewData.invalid_records && previewData.invalid_records.length > 0 && (
                <div
                  className={`p-4 rounded-lg border ${
                    currentTheme === "dark"
                      ? "bg-red-900 border-red-700"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <h4 className="font-medium text-red-800 mb-3">
                    Invalid Records (First {previewData.invalid_records.length} shown)
                  </h4>
                  <div className="space-y-3">
                    {previewData.invalid_records.map((record, index) => (
                      <div key={index} className="border-l-4 border-red-500 pl-3">
                        <div className="font-medium text-red-900">
                          Row {record.row_number}: {record.data.employee_code} - {record.data.first_name} {record.data.last_name}
                        </div>
                        <ul className="text-sm text-red-700 mt-1 space-y-1">
                          {record.errors.map((error, errIndex) => (
                            <li key={errIndex}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Errors Summary */}
              {previewData.error_summary && previewData.error_summary.length > 0 && (
                <div
                  className={`p-4 rounded-lg border ${
                    currentTheme === "dark"
                      ? "bg-red-900 border-red-700"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <h4 className="font-medium text-red-800 mb-2">
                    Error Summary
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {previewData.error_summary.slice(0, 10).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Upload Results */}
          {step === 4 && uploadResults && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium">Upload Complete</h3>
              </div>

              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-green-800 mb-2">
                  Bulk Upload Successful!
                </h4>
                <div className="text-sm text-green-600 space-y-1">
                  <p>
                    Successfully processed {uploadResults.successful_records} staff
                    records
                  </p>
                  {uploadResults.failed_records > 0 && (
                    <p className="text-red-600">
                      Failed to process {uploadResults.failed_records} records
                    </p>
                  )}
                </div>
              </div>

              {/* Show Error Details */}
              {uploadResults.errors && uploadResults.errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h5 className="font-medium text-red-800 mb-2">Error Details:</h5>
                  <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                    {uploadResults.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Error Messages */}
          {errors.general && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            currentTheme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex space-x-3">
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  currentTheme === "dark"
                    ? "border-gray-600 hover:bg-gray-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                currentTheme === "dark"
                  ? "border-gray-600 hover:bg-gray-700"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {step === 4 ? "Close" : "Cancel"}
            </button>

            {step === 1 && selectedClient && selectedTicket && (
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Next
              </button>
            )}

            {step === 2 && uploadFile && (
              <button
                onClick={handlePreviewUpload}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{loading ? "Processing..." : "Preview Data"}</span>
              </button>
            )}

            {step === 3 && previewData && previewData.valid_rows > 0 && (
              <button
                onClick={handleProcessUpload}
                disabled={processingUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {processingUpload && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>
                  {processingUpload ? "Processing..." : "Process Upload"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadModal;
