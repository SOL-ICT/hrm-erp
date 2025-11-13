import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  Eye,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calculator,
  FileCheck,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import MatchedStaffTable from "../tables/MatchedStaffTable";
import UnmatchedStaffTable from "../tables/UnmatchedStaffTable";
import AddStaffSection from "../sections/AddStaffSection";
import TemplatePreviewCalculations from "../sections/TemplatePreviewCalculations";
import { invoiceApiService } from "@/services/modules/invoicing";

/**
 * Phase 2.1: Attendance Preview Modal
 * Comprehensive preview interface for uploaded attendance data
 * with manual editing capabilities and real-time calculations
 */
const AttendancePreviewModal = ({
  isOpen,
  onClose,
  uploadData,
  validationResults,
  templateCoverage,
  clientId,
  onProceedToGeneration,
  onRefreshData,
}) => {
  const [modalActiveTab, setModalActiveTab] = useState("matched");
  const [previewData, setPreviewData] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load detailed preview data when modal opens
  useEffect(() => {
    if (isOpen && uploadData?.upload_id) {
      loadPreviewData();
    }
  }, [isOpen, uploadData]);

  const loadPreviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load comprehensive preview data using the service
      const response = await invoiceApiService.getUploadPreview(
        uploadData.upload_id
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to load preview data");
      }

      setPreviewData(response.data);
      setCalculations(
        response.data.calculations || {
          total_amount: 0,
          staff_count: response.data.validation?.total_records || 0,
        }
      );
    } catch (error) {
      console.error("Error loading preview data:", error);
      console.error("Error details:", error.response?.data);
      setError(`Failed to load preview data: ${error.message}`);

      // Fallback to using passed data if available
      if (validationResults || templateCoverage) {
        console.log("Using fallback data...");
        console.log("validationResults:", validationResults);
        console.log("templateCoverage:", templateCoverage);
        console.log("uploadData:", uploadData);

        // Parse errors if they're in JSON string format
        let parsedErrors = [];
        if (validationResults?.errors) {
          try {
            parsedErrors =
              typeof validationResults.errors === "string"
                ? JSON.parse(validationResults.errors)
                : validationResults.errors;
          } catch (e) {
            console.error("Failed to parse errors:", e);
            parsedErrors = validationResults.errors;
          }
        }

        setPreviewData({
          matched_staff: validationResults?.matched_staff || [],
          unmatched_staff: validationResults?.unmatched_staff || [],
          duplicate_staff: validationResults?.duplicate_staff || [],
          errors: parsedErrors,
          validation_status:
            validationResults?.validation_status ||
            validationResults?.overall_status,
          calculations: {
            total_amount: 0,
            staff_count:
              validationResults?.total_records ||
              uploadData.total_records ||
              uploadData.totalRecords ||
              0,
            template_coverage: templateCoverage || {},
          },
        });
        setCalculations({
          total_amount: 0,
          staff_count:
            validationResults?.total_records ||
            uploadData.total_records ||
            uploadData.totalRecords ||
            0,
        });
        setError(null); // Clear error since we have fallback data
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStaffUpdate = async (recordId, updates) => {
    try {
      await invoiceApiService.updateAttendanceRecord(recordId, updates);

      // Refresh preview data
      await loadPreviewData();

      // Notify parent to refresh
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      alert("Failed to update staff record");
    }
  };

  const handleStaffRemoval = async (recordId) => {
    if (!confirm("Are you sure you want to remove this staff member?")) {
      return;
    }

    try {
      await invoiceApiService.deleteAttendanceRecord(recordId);

      // Refresh preview data
      await loadPreviewData();

      // Notify parent to refresh
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error("Error removing staff:", error);
      alert("Failed to remove staff record");
    }
  };

  const handleAddStaff = async (staffData) => {
    try {
      await invoiceApiService.addStaffToAttendance(
        uploadData.upload_id,
        staffData
      );

      // Refresh preview data
      await loadPreviewData();

      // Notify parent to refresh
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      alert("Failed to add staff");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Eye className="w-6 h-6 text-blue-600" />
                Attendance Preview & Editing
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Review, edit, and validate attendance data before invoice
                generation
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Upload Summary */}
          {uploadData && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-500">Upload ID</div>
                <div className="font-semibold">{uploadData.upload_id}</div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-500">Records</div>
                <div className="font-semibold">
                  {uploadData.total_records || 0}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-500">Validation Status</div>
                <div className="font-semibold text-green-600">
                  {validationResults?.overall_status || "Unknown"}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-500">Template Coverage</div>
                <div className="font-semibold text-blue-600">
                  {templateCoverage?.coverage_percentage || 0}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading preview data...</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <Tabs
              value={modalActiveTab}
              onValueChange={setModalActiveTab}
              className="h-full flex flex-col"
            >
              <div className="px-6 pt-4 border-b border-gray-100">
                <TabsList className="grid w-full grid-cols-4 bg-gray-50 p-1 rounded-xl">
                  <TabsTrigger
                    value="matched"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium"
                    style={{
                      backgroundColor:
                        modalActiveTab === "matched" ? "#10b981" : "",
                      color: modalActiveTab === "matched" ? "white" : "",
                      boxShadow:
                        modalActiveTab === "matched"
                          ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                          : "",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Matched Staff</span>
                      <span className="sm:hidden">Matched</span>
                      <div
                        className="px-2 py-1 rounded-full text-xs font-bold min-w-[24px] text-center"
                        style={{
                          backgroundColor:
                            modalActiveTab === "matched"
                              ? "#059669"
                              : "#dcfce7",
                          color:
                            modalActiveTab === "matched" ? "white" : "#166534",
                        }}
                      >
                        {previewData?.matched_staff?.length || 0}
                      </div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="unmatched"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium"
                    style={{
                      backgroundColor:
                        modalActiveTab === "unmatched" ? "#f97316" : "",
                      color: modalActiveTab === "unmatched" ? "white" : "",
                      boxShadow:
                        modalActiveTab === "unmatched"
                          ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                          : "",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="hidden sm:inline">Unmatched Staff</span>
                      <span className="sm:hidden">Unmatched</span>
                      <div
                        className="px-2 py-1 rounded-full text-xs font-bold min-w-[24px] text-center"
                        style={{
                          backgroundColor:
                            modalActiveTab === "unmatched"
                              ? "#ea580c"
                              : "#fed7aa",
                          color:
                            modalActiveTab === "unmatched"
                              ? "white"
                              : "#9a3412",
                        }}
                      >
                        {previewData?.unmatched_staff?.length || 0}
                      </div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="add-staff"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium"
                    style={{
                      backgroundColor:
                        modalActiveTab === "add-staff" ? "#3b82f6" : "",
                      color: modalActiveTab === "add-staff" ? "white" : "",
                      boxShadow:
                        modalActiveTab === "add-staff"
                          ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                          : "",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Add Staff</span>
                      <span className="sm:hidden">Add</span>
                      <div
                        className="px-2 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor:
                            modalActiveTab === "add-staff"
                              ? "#2563eb"
                              : "#dbeafe",
                          color:
                            modalActiveTab === "add-staff"
                              ? "white"
                              : "#1d4ed8",
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="calculations"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium"
                    style={{
                      backgroundColor:
                        modalActiveTab === "calculations" ? "#8b5cf6" : "",
                      color: modalActiveTab === "calculations" ? "white" : "",
                      boxShadow:
                        modalActiveTab === "calculations"
                          ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                          : "",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      <span className="hidden sm:inline">Calculations</span>
                      <span className="sm:hidden">Calc</span>
                      <div
                        className="px-2 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor:
                            modalActiveTab === "calculations"
                              ? "#7c3aed"
                              : "#ede9fe",
                          color:
                            modalActiveTab === "calculations"
                              ? "white"
                              : "#6b21a8",
                        }}
                      >
                        {templateCoverage?.coverage_percentage || 0}%
                      </div>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto bg-gray-50">
                <TabsContent
                  value="matched"
                  className="p-6 m-0 bg-gradient-to-br from-green-50 to-emerald-50 min-h-full"
                >
                  <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Matched Staff Records
                        </h3>
                        <p className="text-sm text-gray-600">
                          Staff members successfully matched with payroll data
                        </p>
                      </div>
                    </div>
                    <MatchedStaffTable
                      matchedStaff={previewData?.matched_staff || []}
                      onStaffUpdate={handleStaffUpdate}
                      onStaffRemoval={handleStaffRemoval}
                      templateCoverage={templateCoverage}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="unmatched"
                  className="p-6 m-0 bg-gradient-to-br from-orange-50 to-yellow-50 min-h-full"
                >
                  <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Unmatched Staff Records
                        </h3>
                        <p className="text-sm text-gray-600">
                          Staff records requiring manual review or correction
                        </p>
                      </div>
                    </div>
                    <UnmatchedStaffTable
                      unmatchedStaff={previewData?.unmatched_staff || []}
                      onStaffUpdate={handleStaffUpdate}
                      clientId={clientId}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="add-staff"
                  className="p-6 m-0 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-full"
                >
                  <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Add New Staff
                        </h3>
                        <p className="text-sm text-gray-600">
                          Manually add staff members not found in the uploaded
                          data
                        </p>
                      </div>
                    </div>
                    <AddStaffSection
                      clientId={clientId}
                      onAddStaff={handleAddStaff}
                      existingStaff={previewData?.matched_staff || []}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="calculations"
                  className="p-6 m-0 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-full"
                >
                  <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Calculator className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Payroll Calculations
                        </h3>
                        <p className="text-sm text-gray-600">
                          Summary of calculations and template coverage analysis
                        </p>
                      </div>
                    </div>
                    <TemplatePreviewCalculations
                      calculations={calculations}
                      templateCoverage={templateCoverage}
                      uploadData={uploadData}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {previewData && (
              <>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {previewData.matched_staff?.length || 0} Matched
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {previewData.unmatched_staff?.length || 0} Unmatched
                </span>
                <span className="flex items-center gap-1">
                  <FileCheck className="w-4 h-4" />
                  {templateCoverage?.coverage_percentage || 0}% Template
                  Coverage
                </span>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (onProceedToGeneration) {
                  onProceedToGeneration(uploadData);
                }
                onClose();
              }}
              disabled={
                !previewData?.matched_staff?.length ||
                (templateCoverage?.coverage_percentage || 0) < 100
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              Proceed to Invoice Generation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePreviewModal;
