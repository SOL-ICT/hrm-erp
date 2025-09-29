// File: frontend/src/components/admin/modules/recruitment-management/submodules/current-vacancies/CurrentVacancies.jsx

"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Mail,
  Users,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import currentVacanciesAPI from "@/services/modules/recruitment-management/currentVacanciesAPI";
import TicketGroup from "./TicketGroup";
import InviteModal from "./InviteModal";
import TestManagement from "../screening-management/TestManagement";

const CurrentVacancies = ({ currentTheme, preferences, onBack }) => {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState(new Set());
  const [summary, setSummary] = useState({
    total_vacancies: 0,
    total_applications: 0,
    total_invited: 0,
  });

  // Filter states
  const [filters, setFilters] = useState({
    priority_level: "",
    client_id: "",
    status: "active",
  });

  // Tab state - Enhanced with test results and scoring
  const [activeTab, setActiveTab] = useState("applications");

  // Test pass criteria state
  const [passScoreCriteria, setPassScoreCriteria] = useState({
    global_pass_score: 70, // Universal pass score
    ticket_specific: {}, // Ticket-specific pass scores
  });

  useEffect(() => {
    fetchCurrentVacancies();
  }, [filters]);

  const fetchCurrentVacancies = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters,
      };

      // Only add search parameter if there's actually a search term
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await currentVacanciesAPI.getCurrentVacancies(params);

      console.log("API Response:", response); // Debug log

      if (response.success) {
        let vacanciesData = response.data || [];
        
        // Handle paginated response structure from Laravel
        if (vacanciesData.data && Array.isArray(vacanciesData.data)) {
          console.log("Found paginated data structure");
          vacanciesData = vacanciesData.data;
        } else if (!Array.isArray(vacanciesData)) {
          console.log("Data is not an array, checking for nested structure:", vacanciesData);
          // Try different possible structures
          if (vacanciesData.vacancies && Array.isArray(vacanciesData.vacancies)) {
            vacanciesData = vacanciesData.vacancies;
          } else {
            // If we still don't have an array, create empty array
            console.warn("Could not find array data in response, using empty array");
            vacanciesData = [];
          }
        }

        console.log("Final vacanciesData:", vacanciesData); // Debug log

        // Ensure we have an array before doing operations
        if (!Array.isArray(vacanciesData)) {
          console.error("vacanciesData is still not an array:", typeof vacanciesData, vacanciesData);
          vacanciesData = [];
        }

        // Calculate summary from the data since API doesn't return summary
        const summaryData = {
          total_vacancies: vacanciesData.length,
          total_applications: vacanciesData.length > 0 ? vacanciesData.reduce((sum, v) => sum + (v.applications_count || 0), 0) : 0,
          total_invited: vacanciesData.length > 0 ? vacanciesData.reduce((sum, v) => sum + (v.invited_count || 0), 0) : 0,
        };

        setVacancies(vacanciesData);
        setSummary(summaryData);

        // Auto-expand tickets with applications
        const ticketsWithApps = new Set(
          vacanciesData.filter((v) => v.applications_count > 0).map((v) => v.id)
        );
        setExpandedTickets(ticketsWithApps);
      } else {
        throw new Error(response.message || "Failed to fetch vacancies");
      }
    } catch (error) {
      console.error("Error fetching current vacancies:", error);
      setError(error.message || "Failed to load current vacancies");
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCurrentVacancies();
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const toggleTicketExpansion = (ticketId) => {
    setExpandedTickets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const openInviteModal = (vacancy, selectedCandidates = []) => {
    setSelectedVacancy({ ...vacancy, selectedCandidates });
    setShowInviteModal(true);
  };

  const handleInvitationSent = () => {
    fetchCurrentVacancies(); // Refresh data
    setShowInviteModal(false);
    setSelectedVacancy(null);
  };

  // Schedule interview function for qualified candidates
  const scheduleInterview = (candidateId, vacancyId) => {
    // TODO: Implement interview scheduling logic
    console.log(`Scheduling interview for candidate ${candidateId} for vacancy ${vacancyId}`);
    // This will integrate with the interview scheduling system
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colors[priority] || colors.medium;
  };

  const priorityOptions = [
    { value: "", label: "All Priorities" },
    { value: "low", label: "Low Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "high", label: "High Priority" },
    { value: "urgent", label: "Urgent" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-9xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded-md w-1/3"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-md"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-9xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Current Vacancies
              </h1>
              <p className="text-gray-600 mt-1">
                Manage recruitment applications and send interview invitations
              </p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.total_vacancies}
                </div>
                <div className="text-sm text-blue-600">Active Vacancies</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.total_applications}
                </div>
                <div className="text-sm text-green-600">Applications</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {summary.total_invited}
                </div>
                <div className="text-sm text-purple-600">Invited</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by ticket ID or job title..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-400" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.priority_level}
              onChange={(e) =>
                handleFilterChange("priority_level", e.target.value)
              }
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Enhanced Tabs - Applications, Test Results, Invitations */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("applications")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "applications"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  Applications ({summary.total_applications || 0})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("test-management")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "test-management"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Test Management
                </div>
              </button>
              <button
                onClick={() => setActiveTab("invitations")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "invitations"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  Invitations ({summary.total_invited || 0})
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Test Management Tab Content */}
        {activeTab === "test-management" && (
          <TestManagement currentTheme={currentTheme} />
        )}

        {/* Applications Tab Content */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading vacancies...</p>
              </div>
            ) : vacancies.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Current Vacancies
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "No vacancies match your search criteria."
                    : "There are no active recruitment requests with applications at the moment."}
                </p>
              </div>
            ) : (
              vacancies.map((vacancy) => (
                <TicketGroup
                  key={vacancy.id}
                  vacancy={vacancy}
                  expanded={expandedTickets.has(vacancy.id)}
                  onToggleExpansion={toggleTicketExpansion}
                  onOpenInviteModal={openInviteModal}
                  getPriorityColor={getPriorityColor}
                  currentTheme={currentTheme}
                />
              ))
            )}
          </div>
        )}

        {/* Invitations Tab Content */}
        {activeTab === "invitations" && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Mail className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Interview Invitations
            </h3>
            <p className="text-gray-600 mb-4">
              Track and manage interview invitations sent to candidates.
            </p>
            <div className="text-sm text-gray-500">
              This feature will show candidates who have been invited for
              interviews, their invitation status, and response tracking.
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && selectedVacancy && (
          <InviteModal
            vacancy={selectedVacancy}
            onClose={() => {
              setShowInviteModal(false);
              setSelectedVacancy(null);
            }}
            onInvitationSent={handleInvitationSent}
            currentTheme={currentTheme}
          />
        )}
      </div>
    </div>
  );
};

export default CurrentVacancies;
