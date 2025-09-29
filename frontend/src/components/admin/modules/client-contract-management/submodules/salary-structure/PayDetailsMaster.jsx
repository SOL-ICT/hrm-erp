"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Eye,
  DollarSign,
  Users,
  Award,
  ChevronRight,
  Building2,
  FileText,
  Settings,
  X,
} from "lucide-react";
import { salaryStructureAPI } from "../../../../../../services/modules/client-contract-management/salary-structure";
import EmolumentComponentMaster from "../salary-structure/emolument/EmolumentComponentMaster";
import PayGradeForm from "./PayGradeForm";

const PayDetailsMaster = ({
  currentTheme,
  onDataChange,
  selectedClient,
  selectedJobCategory,
  onNextStep,
  onPrevStep,
  onPayGradeSelect, // New prop to pass selected pay grade to parent
}) => {
  const [payGrades, setPayGrades] = useState([]);
  const [jobStructures, setJobStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobStructureFilter, setJobStructureFilter] = useState("");
  const [payStructureTypeFilter, setPayStructureTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showPayGradeForm, setShowPayGradeForm] = useState(false);
  const [editingPayGrade, setEditingPayGrade] = useState(null);
  const [showEmolumentModal, setShowEmolumentModal] = useState(false);

  // Load data
  useEffect(() => {
    if (selectedClient) {
      loadInitialData();
    }
  }, [selectedClient]);

  useEffect(() => {
    if (selectedClient) {
      loadJobStructures();
    }
  }, [selectedClient]);

  useEffect(() => {
    if (selectedClient && selectedJobCategory) {
      loadPayGrades();
    }
  }, [
    selectedClient,
    selectedJobCategory,
    searchTerm,
    jobStructureFilter,
    payStructureTypeFilter,
    statusFilter,
  ]);

  const loadInitialData = async () => {
    if (!selectedClient) return;

    try {
      // Only load job structures here, let the useEffect handle pay grades
      await loadJobStructures();
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const loadJobStructures = async () => {
    if (!selectedClient) return;

    try {
      const params = {
        per_page: 100,
        client_id: selectedClient.id,
      };

      const response = await salaryStructureAPI.jobStructures.getAll(params);
      if (response.success) {
        setJobStructures(response.data.data || []);
        // Clear job structure filter if current selection is not in new list
        if (
          jobStructureFilter &&
          !response.data.data.find((job) => job.id == jobStructureFilter)
        ) {
          setJobStructureFilter("");
        }
      }
    } catch (error) {
      console.error("Error loading job structures:", error);
    }
  };

  const loadPayGrades = async () => {
    if (!selectedClient || !selectedJobCategory) return;

    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        client_id: selectedClient.id,
        job_structure_id: selectedJobCategory.id, // Filter by selected job category
        pay_structure_type: payStructureTypeFilter,
        status: statusFilter,
        per_page: 50,
      };

      const response = await salaryStructureAPI.payGrades.getAll(params);

      if (response.data.success) {
        const paginatedData = response.data.data || {};
        const payGradesData = paginatedData.data || [];

        // Ensure we always set an array
        const safePayGrades = Array.isArray(payGradesData) ? payGradesData : [];
        setPayGrades(safePayGrades);
      } else {
        setPayGrades([]); // Ensure empty array on failure
      }
    } catch (error) {
      console.error("Error loading pay grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayGrade = () => {
    setEditingPayGrade(null);
    setShowPayGradeForm(true);
  };

  const handleEditPayGrade = (payGrade) => {
    setEditingPayGrade(payGrade);
    setShowPayGradeForm(true);
  };

  const handleDeletePayGrade = async (payGradeId) => {
    if (!confirm("Are you sure you want to delete this pay grade?")) {
      return;
    }

    try {
      console.log("Attempting to delete pay grade with ID:", payGradeId);
      const response = await salaryStructureAPI.payGrades.delete(payGradeId);
      console.log("Delete Pay Grade API response:", response);

      // Handle both direct and nested response structures
      const isSuccess = response.success || response.data?.success;

      if (isSuccess) {
        loadPayGrades();
        onDataChange?.();
        alert("Pay grade deleted successfully!");
      } else {
        const errorMessage =
          response.message ||
          response.data?.message ||
          "Unknown error occurred";
        alert(`Failed to delete pay grade: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error deleting pay grade:", error);
      alert("Error deleting pay grade. Please try again.");
    }
  };

  const handlePayGradeSave = () => {
    loadPayGrades();
    onDataChange?.();
  };

  const handleConfigureOfferLetter = (payGrade) => {
    console.log("Configuring offer letter for pay grade:", payGrade);
    // Pass the selected pay grade to the parent component
    if (onPayGradeSelect) {
      onPayGradeSelect(payGrade);
    }
    // Navigate to the offer letter tab
    if (onNextStep) {
      onNextStep();
    }
  };

  const getPayStructureTypeColor = (type) => {
    const typeNum = parseInt(type.substring(1));
    if (typeNum <= 6) return "bg-blue-100 text-blue-800 border-blue-200"; // Employment At Will
    if (typeNum <= 12) return "bg-purple-100 text-purple-800 border-purple-200"; // Employment Tenured
    if (typeNum <= 15) return "bg-green-100 text-green-800 border-green-200"; // Service At Will
    return "bg-orange-100 text-orange-800 border-orange-200"; // Service Tenured
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Job Category Context Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">
              Configuring Grading System for: {selectedJobCategory?.job_title}
            </h3>
            <p className="text-sm text-blue-700">
              {selectedClient?.organisation_name} • Job Code:{" "}
              {selectedJobCategory?.job_code}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search pay grades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={jobStructureFilter}
              onChange={(e) => setJobStructureFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Job Structures</option>
              {jobStructures.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.job_code} - {job.job_title}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* ... existing search and filters ... */}

          <div className="flex items-center space-x-3">
            {" "}
            {/* Add this wrapper div */}
            {/* Manage Components Button - ADD THIS */}
            <button
              onClick={() => setShowEmolumentModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Components</span>
            </button>
            {/* Existing Add Pay Grade Button */}
            <button
              onClick={handleAddPayGrade}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pay Grade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pay Grades Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.isArray(payGrades) && payGrades.length > 0 ? (
            payGrades.map((grade) => (
              <div
                key={grade.id}
                className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group"
              >
                {/* Grade Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {grade.grade_name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {grade.grade_code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditPayGrade(grade)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePayGrade(grade.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grade Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">
                      Job Structure:
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {grade.job_structure?.job_code}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">
                      Pay Structure:
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getPayStructureTypeColor(
                        grade.pay_structure_type
                      )}`}
                    >
                      {grade.pay_structure_type}
                    </span>
                  </div>

                  {/* Total Compensation */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-800">
                        Total Compensation:
                      </span>
                      <span className="text-lg font-bold text-green-900">
                        {formatCurrency(grade.total_compensation)}
                      </span>
                    </div>
                  </div>

                  {/* Emolument Breakdown Preview */}
                  {grade.emolument_breakdown &&
                    grade.emolument_breakdown.length > 0 && (
                      <div className="pt-2">
                        <span className="text-sm text-slate-600 mb-2 block">
                          Emoluments:
                        </span>
                        <div className="space-y-1">
                          {grade.emolument_breakdown
                            .slice(0, 3)
                            .map((emolument, index) => (
                              <div
                                key={index}
                                className="flex justify-between text-xs"
                              >
                                <span className="text-slate-600">
                                  {emolument.name}:
                                </span>
                                <span className="text-slate-800 font-medium">
                                  {formatCurrency(emolument.amount)}
                                </span>
                              </div>
                            ))}
                          {grade.emolument_breakdown.length > 3 && (
                            <div className="text-xs text-slate-500 text-center pt-1">
                              +{grade.emolument_breakdown.length - 3} more
                              components
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-300">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4" />
                      <span>{grade.job_structure?.job_title || "N/A"}</span>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        grade.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {grade.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Offer Letter Action Button */}
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => handleConfigureOfferLetter(grade)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors group-hover:shadow-md"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Configure Offer Letter</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pay grades found
              </h3>
              <p className="text-gray-600 mb-6">
                No pay grades are configured for this job category yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State for when not loading and no results */}
      {!loading && (!Array.isArray(payGrades) || payGrades.length === 0) && (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No pay grades found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || jobStructureFilter || statusFilter
              ? "Try adjusting your search criteria"
              : "Get started by creating your first pay grade"}
          </p>
          {!searchTerm && !jobStructureFilter && !statusFilter && (
            <button
              onClick={handleAddPayGrade}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pay Grade</span>
            </button>
          )}
        </div>
      )}

      {/* Pay Grade Form Modal */}
      <PayGradeForm
        isOpen={showPayGradeForm}
        onClose={() => setShowPayGradeForm(false)}
        editingPayGrade={editingPayGrade}
        onSave={handlePayGradeSave}
        jobStructures={jobStructures}
      />

      {showEmolumentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Manage Emolument Components
              </h2>
              <button
                onClick={() => setShowEmolumentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <EmolumentComponentMaster
                onBack={() => setShowEmolumentModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        {onPrevStep && (
          <button
            onClick={onPrevStep}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <ChevronRight className="w-4 h-4 transform rotate-180" />
            <span>Back to Job Category</span>
          </button>
        )}

        {onNextStep && (
          <button
            onClick={onNextStep}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>Continue to Offer Letter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PayDetailsMaster;
