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
} from "lucide-react";
import { salaryStructureAPI } from "../../../../../../services/api";
import JobStructureForm from "./JobStructureForm";

const JobStructureMaster = ({ currentTheme, onDataChange }) => {
  const [clientsWithJobs, setClientsWithJobs] = useState([]);
  const [expandedClients, setExpandedClients] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Load clients and their job structures
  useEffect(() => {
    loadClientsWithJobStructures();
  }, [searchTerm]);

  const loadClientsWithJobStructures = async () => {
    try {
      setLoading(true);

      // Load clients and all job structures
      const [clientsResponse, jobsResponse] = await Promise.all([
        salaryStructureAPI.utilities.getClients(),
        salaryStructureAPI.jobStructures.getAll({
          search: searchTerm,
          per_page: 1000, // Get all job structures
        }),
      ]);

      if (clientsResponse.success && jobsResponse.success) {
        const clients = clientsResponse.data || [];
        const jobStructures = jobsResponse.data.data || [];

        // Group job structures by client
        const clientsWithJobs = clients.map((client) => ({
          ...client,
          jobStructures: jobStructures.filter(
            (job) => job.client_id == client.id
          ),
        }));

        setClientsWithJobs(clientsWithJobs);
      }
    } catch (error) {
      console.error("Error loading clients with job structures:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = (clientId = null) => {
    setEditingJob(null);
    setSelectedClient(clientId);
    setShowJobForm(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setSelectedClient(job.client_id);
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
    if (!confirm("Are you sure you want to delete this job structure?")) {
      return;
    }

    try {
      const response = await salaryStructureAPI.jobStructures.delete(jobId);
      if (response.success) {
        loadClientsWithJobStructures();
        onDataChange?.();
        alert("Job structure deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting job structure:", error);
      alert("Error deleting job structure. Please try again.");
    }
  };

  const handleJobSave = () => {
    loadClientsWithJobStructures();
    onDataChange?.();
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
              placeholder="Search job structures..."
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
          <span>Add Job Structure</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        /* Clients with Job Structures */
        <div className="space-y-6">
          {clientsWithJobs.map((client) => (
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
                      {client.jobStructures.length} job structure
                      {client.jobStructures.length !== 1 ? "s" : ""}
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

              {/* Job Structures (Expandable) */}
              {expandedClients.has(client.id) && (
                <div className="border-t border-gray-200 p-6 space-y-4">
                  {client.jobStructures.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                      <p>No job structures found for this client</p>
                      <button
                        onClick={() => handleAddJob(client.id)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Create the first job structure
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {client.jobStructures.map((job) => (
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

                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditJob(job)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {clientsWithJobs.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Clients Found
              </h3>
              <p className="text-gray-600">
                No clients match your search criteria.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Job Structure Form Modal */}
      <JobStructureForm
        isOpen={showJobForm}
        onClose={() => {
          setShowJobForm(false);
          setEditingJob(null);
          setSelectedClient(null);
        }}
        editingJob={editingJob}
        selectedClientId={selectedClient}
        onSave={handleJobSave}
      />
    </div>
  );
};

export default JobStructureMaster;
