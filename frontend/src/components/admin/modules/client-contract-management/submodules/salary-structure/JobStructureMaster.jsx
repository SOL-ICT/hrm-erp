"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Briefcase,
  Users,
  DollarSign,
  ChevronRight,
  Building2,
  Award,
} from "lucide-react";
import { salaryStructureAPI } from "../../../../../../services/modules/client-contract-management/salary-structure";
import JobStructureForm from "./JobStructureForm";

const JobStructureMaster = ({
  currentTheme,
  onDataChange,
  selectedClient,
  selectedJobCategory,
  onJobCategorySelect,
}) => {
  const [clientsWithJobs, setClientsWithJobs] = useState([]);
  const [expandedClients, setExpandedClients] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedClientForForm, setSelectedClientForForm] = useState(null);

  // Load clients and their job categories
  useEffect(() => {
    if (selectedClient) {
      loadJobStructuresForClient();
    }
  }, [searchTerm, selectedClient]);

  const loadJobStructuresForClient = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);

      // Load job categories filtered by selected client
      const apiResponse = await salaryStructureAPI.jobStructures.getAll({
        search: searchTerm,
        client_id: selectedClient.id,
        per_page: 1000,
      });

      // Extract the actual response from the new API structure
      const jobsResponse = apiResponse.data;

      if (jobsResponse.success) {
        // Debug: Log the actual response structure
        console.log("Job Categories API Response:", jobsResponse);

        // Check if data is in data.data (paginated) or just data
        const jobData = jobsResponse.data?.data || jobsResponse.data || [];
        console.log("Extracted job data:", jobData);

        const clientWithJobs = {
          id: selectedClient.id,
          organisation_name: selectedClient.organisation_name,
          client_category: selectedClient.client_category,
          industry_category: selectedClient.industry_category,
          status: selectedClient.status,
          job_structures: jobData,
          job_count: jobData.length || 0,
        };

        console.log("Client with jobs:", clientWithJobs);
        setClientsWithJobs([clientWithJobs]);
      } else {
        console.error(
          "Error loading job categories:",
          jobsResponse?.message || "API call failed"
        );
        setClientsWithJobs([]);
      }
    } catch (error) {
      console.error("Error loading job categories:", error);
      setClientsWithJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = (clientId = null) => {
    setEditingJob(null);
    // Pre-select the current client when adding new job category
    setSelectedClientForForm(clientId || selectedClient?.id);
    setShowJobForm(true);
  };

  const handleEditJob = (job) => {
    console.log("Edit job clicked:", job);
    setEditingJob(job);
    setSelectedClientForForm(job.client_id);
    setShowJobForm(true);
  };

  const toggleClientExpansion = (clientId) => {
    setExpandedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleDeleteJob = async (jobId) => {
    console.log("Delete job clicked:", jobId);
    if (!confirm("Are you sure you want to delete this job category?")) {
      return;
    }

    try {
      console.log("Attempting to delete job with ID:", jobId);
      const response = await salaryStructureAPI.jobStructures.delete(jobId);
      console.log("Delete API response:", response);

      // Handle both direct and nested response structures
      const isSuccess = response.success || response.data?.success;
      const message = response.message || response.data?.message;

      if (isSuccess) {
        loadJobStructuresForClient();
        onDataChange?.();
        alert("Job category deleted successfully!");
      } else {
        console.error("Delete failed:", message);
        if (message && message.includes("pay grades")) {
          alert(
            `Cannot delete this job category: ${message}\n\nPlease go to the Grading System tab and delete all pay grades for this job category first.`
          );
        } else {
          alert(`Failed to delete job category: ${message || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Error deleting job category:", error);
      // Check if it's a 422 validation error
      if (
        error.status === 422 ||
        (error.message && error.message.includes("pay grades"))
      ) {
        alert(
          "Cannot delete this job category because it has pay grades associated with it.\n\nPlease go to the Grading System tab and delete all pay grades for this job category first."
        );
      } else {
        alert(
          `Error deleting job category: ${error.message || "Please try again."}`
        );
      }
    }
  };

  const handleJobSave = () => {
    loadJobStructuresForClient();
    onDataChange?.();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getContractTypeColor = (type) => {
    switch (type) {
      case "employment":
        return "bg-green-100 text-green-800 border-green-200";
      case "service":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getContractNatureColor = (nature) => {
    switch (nature) {
      case "at_will":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "tenured":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search job categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={() => handleAddJob()}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Add Job Category</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : selectedClient ? (
        /* Flat Job Categories List for Selected Client */
        <div className="space-y-4">
          {/* Client Info Header (non-clickable) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedClient.organisation_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {clientsWithJobs[0]?.job_structures?.length || 0} job categor
                  {(clientsWithJobs[0]?.job_structures?.length || 0) !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Job Categories Grid */}
          {(clientsWithJobs[0]?.job_structures?.length || 0) === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">
                No job categories found for this client
              </p>
              <button
                onClick={() => handleAddJob()}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Create the first job category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientsWithJobs[0]?.job_structures?.map((job) => (
                <div
                  key={job.id}
                  className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                    selectedJobCategory?.id === job.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => onJobCategorySelect?.(job)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <Briefcase className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {job.job_title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {job.job_code}
                          </p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              job.status
                            )}`}
                          >
                            {job.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>
                          Grades: {job.active_grades_count || 0} active
                        </span>
                      </div>

                      {job.pay_structures && job.pay_structures.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>
                            {job.pay_structures.length} pay structure(s)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditJob(job);
                        }}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (job.active_grades_count > 0) {
                            alert(
                              `Cannot delete this job category because it has ${job.active_grades_count} pay grade(s) associated with it.\n\nPlease go to the Grading System tab and delete all pay grades for this job category first.`
                            );
                          } else {
                            handleDeleteJob(job.id);
                          }
                        }}
                        className={`flex items-center space-x-1 text-sm font-medium cursor-pointer ${
                          job.active_grades_count > 0
                            ? "text-gray-400 hover:text-gray-500"
                            : "text-red-600 hover:text-red-700"
                        }`}
                        title={
                          job.active_grades_count > 0
                            ? `Cannot delete: ${job.active_grades_count} pay grade(s) associated`
                            : "Delete job category"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Grouped Clients with Job Categories (for general management) */
        <div className="space-y-6">
          {(clientsWithJobs || []).map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200"
            >
              {/* Client Header */}
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleClientExpansion(client.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {client.organisation_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {client.job_structures?.length || 0} job categor
                      {(client.job_structures?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddJob(client.id);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Job</span>
                  </button>

                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedClients.has(client.id) ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Job Categories (Expandable) */}
              {expandedClients.has(client.id) && (
                <div className="border-t border-gray-200 p-6 space-y-4">
                  {(client.job_structures?.length || 0) === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                      <p>No job categories found for this client</p>
                      <button
                        onClick={() => handleAddJob(client.id)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Create the first job category
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(client.job_structures || []).map((job) => (
                        <div
                          key={job.id}
                          className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                        >
                          {/* Job Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-3">
                              <div className="p-2 rounded-lg bg-slate-100">
                                <Briefcase className="w-5 h-5 text-slate-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800 text-lg">
                                  {job.job_title}
                                </h4>
                                <p className="text-sm text-slate-600">
                                  {job.job_code}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 opacity-100 transition-opacity z-20 relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleEditJob(job);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer z-30 relative"
                                title="Edit job category"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (job.active_grades_count > 0) {
                                    alert(
                                      `Cannot delete this job category because it has ${job.active_grades_count} pay grade(s) associated with it.\n\nPlease go to the Grading System tab and delete all pay grades for this job category first.`
                                    );
                                  } else {
                                    handleDeleteJob(job.id);
                                  }
                                }}
                                className={`p-2 rounded-lg transition-colors cursor-pointer z-30 relative ${
                                  job.active_grades_count > 0
                                    ? "text-gray-400 hover:bg-gray-50"
                                    : "text-red-600 hover:bg-red-50"
                                }`}
                                title={
                                  job.active_grades_count > 0
                                    ? `Cannot delete: ${job.active_grades_count} pay grade(s) associated`
                                    : "Delete job category"
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Job Details */}
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600">
                                Contract Type:
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full border ${getContractTypeColor(
                                  job.contract_type
                                )}`}
                              >
                                {job.contract_type}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-slate-600">
                                Nature:
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full border ${getContractNatureColor(
                                  job.contract_nature
                                )}`}
                              >
                                {job.contract_nature}
                              </span>
                            </div>

                            {/* Pay Structures */}
                            {job.pay_structure_details &&
                              job.pay_structure_details.length > 0 && (
                                <div className="pt-2">
                                  <span className="text-sm text-slate-600 mb-2 block">
                                    Pay Structures:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {job.pay_structure_details
                                      .slice(0, 3)
                                      .map((structure) => (
                                        <span
                                          key={structure.type_code}
                                          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                                        >
                                          {structure.type_name ||
                                            structure.type_code}
                                        </span>
                                      ))}
                                    {job.pay_structure_details.length > 3 && (
                                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                        +{job.pay_structure_details.length - 3}{" "}
                                        more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Stats */}
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">
                                  Pay Grades:
                                </span>
                                <span className="font-medium text-slate-800">
                                  {job.active_grades_count || 0} active
                                </span>
                              </div>
                              {job.formatted_average_compensation && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">
                                    Avg. Compensation:
                                  </span>
                                  <span className="font-medium text-green-600">
                                    {job.formatted_average_compensation}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <div className="pt-3 mt-3 border-t border-gray-100">
                              <button
                                onClick={() =>
                                  onJobCategorySelect &&
                                  onJobCategorySelect(job)
                                }
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Award className="w-4 h-4" />
                                <span>Configure Grading System</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {(clientsWithJobs || []).length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Job Categories Found
              </h3>
              <p className="text-gray-600">
                No job categories found for this client. Create one to get
                started.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Job Category Form Modal */}
      <JobStructureForm
        isOpen={showJobForm}
        onClose={() => {
          setShowJobForm(false);
          setEditingJob(null);
          setSelectedClientForForm(null);
        }}
        editingJob={editingJob}
        selectedClientId={selectedClientForForm}
        onSave={handleJobSave}
      />
    </div>
  );
};

export default JobStructureMaster;
