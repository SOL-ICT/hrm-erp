import React, { useState } from "react";
import { Button, Alert, AlertDescription } from "@/components/ui";
import { FileSpreadsheet, Calculator, TrendingUp } from "lucide-react";

// Utility function for date formatting
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Invoice Generation Tab Component
 * Handles invoice generation from attendance uploads with FIRS integration
 */
const InvoiceGenerationTab = ({
  clients,
  attendanceUploads = [],
  selectedUpload,
  setSelectedUpload,
  invoiceType,
  setInvoiceType,
  loading,
  error,
  handleGenerateInvoice,
  formatCurrency,
}) => {
  // Get the selected upload object
  const selectedUploadObj = attendanceUploads.find(
    (upload) => upload.id.toString() === selectedUpload
  );

  return (
    <div className="space-y-6">
      {/* Generate Invoice Form */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Generate Invoice
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Create invoices from uploaded attendance data
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                Invoice Generator
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* Upload Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Attendance Upload
            </label>
            <select
              value={selectedUpload}
              onChange={(e) => setSelectedUpload(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose an attendance upload...</option>
              {attendanceUploads
                .filter((upload) => upload.processing_status === "completed")
                .map((upload) => (
                  <option key={upload.id} value={upload.id}>
                    {upload.file_name} - {upload.client?.organisation_name} (
                    {upload.total_records} records)
                  </option>
                ))}
            </select>
          </div>

          {/* Invoice Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Type
            </label>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="with_schedule">With Schedule</option>
              <option value="without_schedule">Summary Only</option>
            </select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateInvoice}
            disabled={!selectedUpload || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Invoice...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Generate Invoice
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Available Uploads for Invoice Generation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Available for Invoice Generation
            </h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processing Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FIRS Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceUploads
                .filter((upload) => upload.processing_status === "completed")
                .map((upload) => (
                  <tr key={upload.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {upload.file_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {upload.client?.organisation_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {upload.total_records || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {upload.processing_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {upload.created_at
                        ? formatDate(upload.created_at)
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {upload.firs_submission_status === "not_submitted" ||
                      !upload.firs_submission_status ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not Submitted
                        </span>
                      ) : upload.firs_submission_status === "submitted" ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending Approval
                        </span>
                      ) : upload.firs_submission_status === "approved" ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : upload.firs_submission_status ===
                        "approved_with_qr" ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          QR Ready
                        </span>
                      ) : upload.firs_submission_status === "rejected" ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Unknown
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedUpload(upload.id.toString())
                          }
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Select
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              {attendanceUploads.filter(
                (upload) => upload.processing_status === "completed"
              ).length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No completed attendance uploads available for invoice
                    generation
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerationTab;
