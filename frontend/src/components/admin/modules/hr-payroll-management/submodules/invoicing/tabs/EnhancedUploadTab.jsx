import React, { useState, useCallback, useEffect } from "react";
import {
  Button,
  Alert,
  AlertDescription,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Progress,
} from "@/components/ui";
import { useClients } from "@/hooks/useClients";
import { invoiceApiService } from "@/services/modules/invoicing";
import AttendancePreviewModal from "../modals/AttendancePreviewModal";
import {
  Upload,
  FileSpreadsheet,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  AlertTriangle,
  Calculator,
  Target,
  FileCheck,
  TrendingUp,
  Trash2,
} from "lucide-react";

/**
 * Enhanced Attendance Upload Tab Component
 * Phase 1.3: Enhanced Attendance Upload Process with Direct ID Matching
 * Includes uploaded files management table
 */
const EnhancedUploadTab = ({
  currentTheme,
  attendanceUploads = [],
  onUploadSuccess,
  onProceedToGeneration: parentProceedToGeneration,
  clients: propClients,
}) => {
  // Use prop clients if provided, otherwise fetch from hook
  const { clients: hookClients } = useClients();
  const clients = propClients || hookClients;

  // Upload state
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // Default to current month
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [templateCoverage, setTemplateCoverage] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");

  // Phase 2.1: Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUploadData, setPreviewUploadData] = useState(null);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setValidationResults(null);
      setTemplateCoverage(null);
      setError(null);
    }
  };

  // Phase 1.3: Enhanced upload with direct ID matching
  const handleEnhancedUpload = async () => {
    if (!selectedFile || !selectedClient || !selectedMonth) {
      alert("Please select a file, client, and payroll month");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setActiveTab("validation");

      // Step 1: Upload with direct ID matching
      const uploadResponse = await invoiceApiService.uploadWithDirectMatching(
        selectedFile,
        selectedClient,
        selectedMonth
      );

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || "Upload failed");
      }

      setUploadResult(uploadResponse.data);

      // Step 2: Run validation
      setValidating(true);
      console.log(
        "Calling validation for upload ID:",
        uploadResponse.data.upload_id
      );

      const validationResponse =
        await invoiceApiService.validateUploadedAttendance(
          uploadResponse.data.upload_id
        );

      console.log("Validation response:", validationResponse);

      if (validationResponse.success) {
        setValidationResults(validationResponse.data);
        setTemplateCoverage(validationResponse.data.template_coverage);

        // Open preview modal after successful validation
        setPreviewUploadData({
          uploadId: uploadResponse.data.upload_id,
          upload_id: uploadResponse.data.upload_id, // Alternative key for modal compatibility
          total_records: validationResponse.data.total_records,
          valid_records: validationResponse.data.valid_records,
          invalid_records: validationResponse.data.invalid_records,
          errors: validationResponse.data.errors,
          status: validationResponse.data.validation_status,
          validation_status: validationResponse.data.validation_status,
          // Keep camelCase versions for compatibility
          totalRecords: validationResponse.data.total_records,
          validRecords: validationResponse.data.valid_records,
          invalidRecords: validationResponse.data.invalid_records,
        });

        // Set proper validation results with expected structure
        setValidationResults({
          ...validationResponse.data,
          overall_status: validationResponse.data.validation_status, // Map to expected property
        });

        setShowPreviewModal(true);
      } else {
        console.error("Validation failed:", validationResponse);
        setError(
          "Validation failed: " +
            (validationResponse.message || "Unknown error")
        );
      }

      // Notify parent component of successful upload
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Enhanced upload error:", error);
      setError(error.message);
    } finally {
      setUploading(false);
      setValidating(false);
    }
  };

  // Handle download template
  const handleDownloadTemplate = async () => {
    if (!selectedClient) {
      alert("Please select a client first");
      return;
    }

    try {
      await invoiceApiService.downloadAttendanceTemplate(selectedClient);
    } catch (error) {
      console.error("Template download error:", error);

      // Show user-friendly error messages
      let errorMessage = "Failed to download template";

      if (error.message) {
        if (error.message.includes("No active staff found")) {
          errorMessage =
            "This client has no active staff members. The template will include sample entries for available pay grades.";
        } else if (error.message.includes("No valid templates found")) {
          errorMessage =
            "No invoice templates found for this client. Please set up invoice templates first in the Template Setup section.";
        } else if (error.message.includes("Template validation failed")) {
          errorMessage =
            "Some pay grades are missing invoice templates. Please check the Template Setup section.";
        } else {
          errorMessage = `Download failed: ${error.message}`;
        }
      }

      alert(errorMessage);
    }
  };

  // Handle upload deletion
  const handleDeleteUpload = async (uploadId) => {
    if (!confirm("Are you sure you want to delete this upload?")) {
      return;
    }

    try {
      const response = await invoiceApiService.deleteAttendanceUpload(uploadId);
      if (response.success && onUploadSuccess) {
        onUploadSuccess(); // Refresh the list
      }
    } catch (error) {
      console.error("Delete upload error:", error);
      alert("Failed to delete upload");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300", label: "Pending" },
      processing: { color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300", label: "Processing" },
      completed: { color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300", label: "Completed" },
      failed: { color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300", label: "Failed" },
      validated: { color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300", label: "Validated" },
    };

    const config = statusMap[status] || statusMap.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Phase 2.1: Preview modal handlers
  const handleProceedToGeneration = (uploadData) => {
    // Navigate to invoice generation with the upload data
    console.log("Proceeding to invoice generation with:", uploadData);
    // Close the preview modal first
    setShowPreviewModal(false);
    // Switch to the invoice generation tab
    if (parentProceedToGeneration) {
      parentProceedToGeneration(uploadData);
    }
  };

  const handleRefreshData = () => {
    // Refresh validation results and template coverage
    if (uploadResult?.upload_id) {
      // Reload validation data
      setValidating(true);
      invoiceApiService
        .validateUploadedAttendance(uploadResult.upload_id)
        .then((response) => {
          if (response.success) {
            setValidationResults(response.data);
            setTemplateCoverage(response.data.template_coverage);
          }
        })
        .catch((error) => {
          console.error("Error refreshing data:", error);
        })
        .finally(() => {
          setValidating(false);
        });
    }
  };

  return (
    <div className="space-y-6">
      {/* Phase 1.3 Enhanced Upload */}
      <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-lg shadow-sm ${currentTheme?.border || 'border'}`}>
        <div className={`p-6 border-b ${currentTheme?.border || 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className={`text-lg font-medium ${currentTheme?.textPrimary || 'text-gray-900'}`}>
              Attendance Upload
            </h3>
          </div>
          <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} mt-2`}>
            Direct pay_grade_structure_id matching with real-time validation and
            template coverage analysis
          </p>
        </div>
        <div className="p-6">{/* CardContent equivalent */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Select Client
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
                      {client.organisation_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payroll Month Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Payroll Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Upload Attendance File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleEnhancedUpload}
                disabled={
                  !selectedFile ||
                  !selectedClient ||
                  !selectedMonth ||
                  uploading
                }
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Attendance File
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownloadTemplate}
                disabled={!selectedClient}
                variant="outline"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>

      {/* Upload Results */}
      {(uploadResult || validationResults) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Result</TabsTrigger>
            <TabsTrigger value="validation" disabled={!validationResults}>
              Validation
            </TabsTrigger>
            <TabsTrigger value="coverage" disabled={!templateCoverage}>
              Coverage Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-lg shadow-sm ${currentTheme?.border || 'border'}`}>
              <div className={`p-6 border-b ${currentTheme?.border || 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className={`text-lg font-medium ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                    Upload Successful
                  </h3>
                </div>
              </div>
              <div className="p-6">
                {uploadResult && (
                  <div className="space-y-3 text-gray-900 dark:text-slate-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Records Processed:</span>{" "}
                        {uploadResult.records_processed || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Upload ID:</span>{" "}
                        {uploadResult.upload_id || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">File Name:</span>{" "}
                        {uploadResult.file_name || selectedFile?.name}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {getStatusBadge(uploadResult.status || "completed")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="validation">
            {validationResults && (
              <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-lg shadow-sm ${currentTheme?.border || 'border'}`}>
                <div className={`p-6 border-b ${currentTheme?.border || 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    {validating ? (
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
                    ) : (
                      <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                    <h3 className={`text-lg font-medium ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                      Validation Results
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4 text-gray-900 dark:text-slate-200">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {validationResults.summary?.successful_matches || 0}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          Successful Matches
                        </div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {validationResults.summary?.failed_matches || 0}
                        </div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">
                          Failed Matches
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {validationResults.summary?.total_records || 0}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          Total Records
                        </div>
                      </div>
                    </div>

                    {validationResults.summary?.validation_rate && (
                      <div className="space-y-2 text-gray-900 dark:text-slate-200">
                        <div className="flex justify-between text-sm">
                          <span>Validation Success Rate</span>
                          <span className="font-medium">
                            {(
                              validationResults.summary.validation_rate * 100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            validationResults.summary.validation_rate * 100
                          }
                        />
                      </div>
                    )}

                    {/*Preview & Edit Button */}
                    <div className="flex justify-center pt-4 border-t">
                      <Button
                        onClick={() => {
                          setPreviewUploadData(uploadResult);
                          setShowPreviewModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        disabled={!uploadResult?.upload_id}
                      >
                        <Eye className="w-4 h-4" />
                        Preview & Edit Attendance Data
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="coverage">
            {templateCoverage && (
              <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-lg shadow-sm ${currentTheme?.border || 'border'}`}>
                <div className={`p-6 border-b ${currentTheme?.border || 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className={`text-lg font-medium ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                      Template Coverage Analysis
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4 text-gray-900 dark:text-slate-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {templateCoverage.coverage_percentage?.toFixed(1) ||
                            0}
                          %
                        </div>
                        <div className="text-sm text-purple-700 dark:text-purple-300">
                          Template Coverage
                        </div>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {templateCoverage.matched_structures || 0}
                        </div>
                        <div className="text-sm text-indigo-700 dark:text-indigo-300">
                          Matched Structures
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Uploaded Files Table */}
      <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-lg shadow-sm ${currentTheme?.border || 'border'}`}>
        <div className={`p-6 border-b ${currentTheme?.border || 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className={`text-lg font-medium ${currentTheme?.textPrimary || 'text-gray-900'}`}>
              Uploaded Attendance Files
            </h3>
          </div>
        </div>
        <div className="p-6">
          {!Array.isArray(attendanceUploads) ||
          attendanceUploads.length === 0 ? (
            <div className={`text-center py-8 ${currentTheme?.textSecondary || 'text-gray-500'}`}>
              <FileSpreadsheet className={`w-12 h-12 mx-auto mb-4 ${currentTheme?.textMuted || 'text-gray-300'}`} />
              <p>No attendance files uploaded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${currentTheme?.border || 'divide-gray-200'}`}>
                <thead className={`${currentTheme?.cardBg || 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>File Name</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>Client</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>Upload Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>Records</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${currentTheme?.border || 'divide-gray-200'}`}>
                  {attendanceUploads.map((upload) => (
                    <tr key={upload.id} className={`${currentTheme?.cardBg || 'bg-white'} hover:bg-slate-700/50 transition-colors`}>
                      <td className={`px-6 py-4 whitespace-nowrap font-medium ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className={`w-4 h-4 ${currentTheme?.textSecondary || 'text-gray-500'}`} />
                          <div>
                            <div>{upload.file_name}</div>
                            <div className={`text-xs ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                              {upload.file_size &&
                                formatFileSize(upload.file_size)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                        {upload.client?.organisation_name || "N/A"}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                        {upload.created_at
                          ? new Date(upload.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${currentTheme?.textPrimary || 'text-gray-900'}`}>{upload.total_records || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(upload.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              window.open(
                                `/api/attendance-uploads/${upload.id}/download`,
                                "_blank"
                              )
                            }
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUpload(upload.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/*Attendance Preview Modal */}
      <AttendancePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        uploadData={previewUploadData}
        validationResults={validationResults}
        templateCoverage={templateCoverage}
        clientId={selectedClient}
        onProceedToGeneration={handleProceedToGeneration}
        onRefreshData={handleRefreshData}
      />
    </div>
  );
};

export default EnhancedUploadTab;
