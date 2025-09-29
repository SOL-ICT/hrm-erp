"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Users,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Building2,
  FileText,
  Settings,
  Plus,
  Tags,
  Award,
  FileCheck,
} from "lucide-react";
import { salaryStructureAPI } from "../../../../../../services/modules/client-contract-management/salary-structure";
import { useClients } from "../../../../../../hooks/useClients";
import JobStructureMaster from "./JobStructureMaster";
import PayDetailsMaster from "./PayDetailsMaster";
import OfferLetterTemplateManager from "./OfferLetterTemplateManager";

const SalaryStructure = ({ currentTheme, onBack }) => {
  const [activeTab, setActiveTab] = useState("job-category");
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedJobCategory, setSelectedJobCategory] = useState(null);
  const [selectedPayGrade, setSelectedPayGrade] = useState(null);
  const { clients, loading: clientsLoading } = useClients();

  // Debug: Log clients when they change
  useEffect(() => {
    console.log("Clients loaded:", clients);
  }, [clients]);
  const [statistics, setStatistics] = useState({
    job_structures: { total: 0, active: 0, employment: 0, service: 0 },
    pay_grades: {
      total: 0,
      active: 0,
      avg_compensation: 0,
      max_compensation: 0,
    },
    compensation_range: { min: 0, max: 0, avg: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await salaryStructureAPI.getDashboardStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Statistics cards configuration
  const statsCards = [
    {
      label: "Total Job Categories",
      value: statistics.job_structures.total,
      change: `${statistics.job_structures.active} active`,
      icon: Briefcase,
      bgGradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Pay Grades",
      value: statistics.pay_grades.total,
      change: `${statistics.pay_grades.active} active`,
      icon: Users,
      bgGradient: "from-green-500 to-green-600",
    },
    {
      label: "Avg. Compensation",
      value: statistics.pay_grades.formatted_avg_compensation || "₦0.00",
      change: "Monthly average",
      icon: DollarSign,
      bgGradient: "from-purple-500 to-purple-600",
    },
    {
      label: "Max. Compensation",
      value: statistics.pay_grades.formatted_max_compensation || "₦0.00",
      change: "Highest grade",
      icon: TrendingUp,
      bgGradient: "from-orange-500 to-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className={`text-lg ${currentTheme.textSecondary}`}>
            Loading job function setup...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className={`p-2 rounded-lg ${currentTheme.hover} ${currentTheme.textSecondary} hover:text-blue-600 transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
              Job Function Setup
            </h1>
            <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
              Configure job categories, grading systems, and offer letters by
              client
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${currentTheme.hover} ${currentTheme.textSecondary} hover:text-blue-600 transition-colors`}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Client Selection Context */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
            Client Context
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Client Selection */}
          <div>
            <label
              className={`block text-sm font-medium ${currentTheme.textSecondary} mb-2`}
            >
              Select Client <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedClient?.id || ""}
                onChange={(e) => {
                  const client = clients.find(
                    (c) => c.id.toString() === e.target.value
                  );
                  setSelectedClient(client || null);
                  setSelectedJobCategory(null); // Reset job category when client changes
                  setSelectedPayGrade(null); // Reset pay grade when client changes
                  setActiveTab("job-category"); // Reset to first tab
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all appearance-none cursor-pointer"
                disabled={clientsLoading}
              >
                <option value="" className="text-gray-500">
                  {clientsLoading
                    ? "Loading clients..."
                    : "🏢 Choose a client organization"}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id} className="py-2">
                    🏢 {client.organisation_name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {selectedClient && (
              <div className="mt-2 text-sm text-gray-600 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>✓ {selectedClient.organisation_name} selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Context Summary */}
        {selectedClient && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 text-blue-800">
              <FileCheck className="w-4 h-4" />
              <span className="font-medium">Active Context:</span>
              <span>{selectedClient.organisation_name}</span>
              {selectedJobCategory && (
                <>
                  <span>→</span>
                  <span className="font-semibold">
                    {selectedJobCategory.job_title}
                  </span>
                </>
              )}
              {selectedPayGrade && (
                <>
                  <span>→</span>
                  <span className="text-purple-700 font-semibold">
                    {selectedPayGrade.pay_grade}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 bg-gradient-to-r ${stat.bgGradient} rounded-lg flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs font-medium text-green-600">
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("job-category")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "job-category"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Tags className="w-5 h-5" />
                <span>Job Category</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("grading-system")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "grading-system"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Grading System</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("offer-letter")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "offer-letter"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Offer Letter</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {!selectedClient ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Client to Continue
              </h3>
              <p className="text-gray-600 mb-4">
                Choose a client from the dropdown above to configure their job
                functions
              </p>
            </div>
          ) : (
            <>
              {activeTab === "job-category" && (
                <JobStructureMaster
                  currentTheme={currentTheme}
                  onDataChange={loadDashboardData}
                  selectedClient={selectedClient}
                  selectedJobCategory={selectedJobCategory}
                  onJobCategorySelect={(jobCategory) => {
                    setSelectedJobCategory(jobCategory);
                    setSelectedPayGrade(null); // Reset pay grade when job category changes
                    setActiveTab("grading-system");
                  }}
                />
              )}
              {activeTab === "grading-system" && (
                <>
                  {!selectedJobCategory ? (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a Job Category First
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Go back to Job Category tab and select a specific job
                        category to configure its grading system
                      </p>
                      <button
                        onClick={() => setActiveTab("job-category")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ← Back to Job Category
                      </button>
                    </div>
                  ) : (
                    <PayDetailsMaster
                      currentTheme={currentTheme}
                      onDataChange={loadDashboardData}
                      selectedClient={selectedClient}
                      selectedJobCategory={selectedJobCategory}
                      onNextStep={() => setActiveTab("offer-letter")}
                      onPrevStep={() => setActiveTab("job-category")}
                      onPayGradeSelect={(payGrade) =>
                        setSelectedPayGrade(payGrade)
                      }
                    />
                  )}
                </>
              )}
              {activeTab === "offer-letter" && (
                <>
                  {!selectedJobCategory || !selectedPayGrade ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select Job Category and Pay Grade First
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {!selectedJobCategory
                          ? "Go back to Job Category tab and select a specific job category"
                          : "Go back to Grading System tab and click 'Configure Offer Letter' for a specific pay grade"}
                      </p>
                      <button
                        onClick={() =>
                          setActiveTab(
                            !selectedJobCategory
                              ? "job-category"
                              : "grading-system"
                          )
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ← Back to{" "}
                        {!selectedJobCategory
                          ? "Job Category"
                          : "Grading System"}
                      </button>
                    </div>
                  ) : (
                    <OfferLetterTemplateManager
                      currentTheme={currentTheme}
                      selectedClient={selectedClient}
                      selectedJobCategory={selectedJobCategory}
                      selectedPayGrade={selectedPayGrade}
                      onBack={() => setActiveTab("grading-system")}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryStructure;
