"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  ArrowLeft,
  DollarSign,
} from "lucide-react";
import { salaryStructureAPI } from "../../../../../../services/api";
import PayGradeForm from "./PayGradeForm";
import BulkUploadModal from "./BulkUploadModal";

/**
 * PayGradesList - Display and manage pay grades for a specific job structure
 *
 * This component provides:
 * - List view of all pay grades for a job category
 * - Single pay grade creation (manual via form)
 * - Bulk pay grade creation (Excel upload via BulkUploadModal)
 * - Edit and delete individual pay grades
 *
 * Integration Points:
 * - Called from PayDetailsMaster with selectedJobStructure
 * - Opens PayGradeForm for single grade creation/editing
 * - Opens BulkUploadModal for Excel upload workflow
 *
 * Reference: PAY_GRADE_EXCEL_UPLOAD_IMPLEMENTATION_PLAN.md
 */
const PayGradesList = ({
  selectedJobStructure = null,
  currentClient = null,
  jobStructures = [],
  onBack = null,
  currentTheme = "light",
}) => {
  // State Management
  const [payGrades, setPayGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPayGradeForm, setShowPayGradeForm] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingPayGrade, setEditingPayGrade] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const isDark = currentTheme === "dark";

  // Fetch pay grades when component mounts or job structure changes
  useEffect(() => {
    if (selectedJobStructure?.id) {
      fetchPayGrades();
    }
  }, [selectedJobStructure?.id]);

  /**
   * Fetch all pay grades for the selected job structure
   * API: GET /api/salary-structure/pay-grades with job_structure_id param
   */
  const fetchPayGrades = async () => {
    if (!selectedJobStructure?.id) {
      setError("No job structure selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        client_id: currentClient?.id,
        job_structure_id: selectedJobStructure.id,
        per_page: 100, // Get all grades for this job structure
      };

      const response = await salaryStructureAPI.payGrades.getAll(params);

      if (response.data?.success) {
        const paginatedData = response.data.data || {};
        const payGradesData = paginatedData.data || [];
        setPayGrades(Array.isArray(payGradesData) ? payGradesData : []);
      } else {
        setError(response.data?.message || "Failed to load pay grades");
        setPayGrades([]);
      }
    } catch (err) {
      console.error("Error fetching pay grades:", err);
      setError("Failed to load pay grades. Please try again.");
      setPayGrades([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle successful pay grade creation/update from form
   */
  const handlePayGradeSaved = () => {
    setShowPayGradeForm(false);
    setEditingPayGrade(null);
    fetchPayGrades(); // Refresh list
  };

  /**
   * Handle successful bulk upload
   */
  const handleBulkUploadSuccess = () => {
    setShowBulkUploadModal(false);
    fetchPayGrades(); // Refresh list to show newly uploaded grades
  };

  /**
   * Handle edit button click
   */
  const handleEdit = (payGrade) => {
    setEditingPayGrade(payGrade);
    setShowPayGradeForm(true);
  };

  /**
   * Handle delete button click with confirmation
   */
  const handleDelete = async (payGradeId) => {
    if (
      !confirm(
        "Are you sure you want to delete this pay grade? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(payGradeId);

    try {
      const response = await salaryStructureAPI.payGrades.delete(payGradeId);

      const isSuccess = response.success || response.data?.success;

      if (isSuccess) {
        fetchPayGrades(); // Refresh list
        alert("Pay grade deleted successfully!");
      } else {
        const errorMessage =
          response.message ||
          response.data?.message ||
          "Unknown error occurred";
        alert(`Failed to delete pay grade: ${errorMessage}`);
      }
    } catch (err) {
      console.error("Error deleting pay grade:", err);
      alert("Failed to delete pay grade. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Count emolument components in a pay grade
   */
  const countEmoluments = (emoluments) => {
    if (!emoluments) return 0;

    try {
      const parsed =
        typeof emoluments === "string" ? JSON.parse(emoluments) : emoluments;

      return Object.keys(parsed || {}).length;
    } catch (err) {
      return 0;
    }
  };

  // If no job structure selected, show message
  if (!selectedJobStructure) {
    return (
      <div
        className={`p-8 text-center ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Please select a job category to view pay grades</p>
      </div>
    );
  }

  return (
    <div className={`${isDark ? "bg-gray-800 text-white" : "bg-white"}`}>
      {/* Header with Back Button and Job Structure Info */}
      <div
        className={`border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        } p-6`}
      >
        <div className="flex items-center justify-between mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Job Categories
            </button>
          )}

          <div className="flex-1 ml-4">
            <h2 className="text-2xl font-bold">Pay Grades</h2>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {selectedJobStructure.job_category} - {currentClient?.name || ""}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingPayGrade(null);
              setShowPayGradeForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Pay Grade
          </button>

          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Upload
          </button>

          <button
            onClick={fetchPayGrades}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center">
          <Loader className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            Loading pay grades...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && payGrades.length === 0 && !error && (
        <div className="p-12 text-center">
          <DollarSign
            className={`w-16 h-16 mx-auto mb-4 ${
              isDark ? "text-gray-600" : "text-gray-300"
            }`}
          />
          <p
            className={`text-lg font-medium mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            No Pay Grades Yet
          </p>
          <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Create your first pay grade using the form or upload multiple grades
            via Excel
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowPayGradeForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Pay Grade
            </button>
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Upload via Excel
            </button>
          </div>
        </div>
      )}

      {/* Pay Grades Table */}
      {!loading && payGrades.length > 0 && (
        <div className="p-6">
          <div className="overflow-x-auto">
            <table
              className={`min-w-full ${isDark ? "bg-gray-800" : "bg-white"}`}
            >
              <thead className={isDark ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Grade Name
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Grade Code
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Pay Structure
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Components
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                      isDark ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                {payGrades.map((grade) => (
                  <tr
                    key={grade.id}
                    className={`${
                      isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${
                        isDark ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      <div className="font-medium">{grade.grade_name}</div>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {grade.grade_code}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          isDark
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {grade.pay_structure_type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {countEmoluments(grade.emoluments)} components
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {grade.is_active ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(grade)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-blue-400"
                              : "hover:bg-blue-50 text-blue-600"
                          }`}
                          title="Edit pay grade"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(grade.id)}
                          disabled={deletingId === grade.id}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? "hover:bg-gray-700 text-red-400"
                              : "hover:bg-red-50 text-red-600"
                          } ${
                            deletingId === grade.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          title="Delete pay grade"
                        >
                          {deletingId === grade.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div
            className={`mt-4 p-4 rounded-lg ${
              isDark ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <p
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Total: <span className="font-semibold">{payGrades.length}</span>{" "}
              pay grade{payGrades.length !== 1 ? "s" : ""}
              {" • "}
              Active:{" "}
              <span className="font-semibold">
                {payGrades.filter((g) => g.is_active).length}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* PayGradeForm Modal */}
      <PayGradeForm
        isOpen={showPayGradeForm}
        onClose={() => {
          setShowPayGradeForm(false);
          setEditingPayGrade(null);
        }}
        editingPayGrade={editingPayGrade}
        onSave={handlePayGradeSaved}
        jobStructures={jobStructures}
        selectedJobStructure={selectedJobStructure}
        currentClient={currentClient}
      />

      {/* BulkUploadModal */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={handleBulkUploadSuccess}
        currentClient={currentClient}
        selectedJobStructure={selectedJobStructure}
        currentTheme={currentTheme}
      />
    </div>
  );
};

export default PayGradesList;
