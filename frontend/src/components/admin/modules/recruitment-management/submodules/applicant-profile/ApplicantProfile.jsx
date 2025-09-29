// File: frontend/src/components/admin/modules/recruitment-management/submodules/applicant-profile/ApplicantProfile.jsx

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  Users,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import applicantProfileAPI from "@/services/modules/recruitment-management/applicantProfileAPI";

const ApplicantProfile = ({ currentTheme, preferences, onBack }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [statistics, setStatistics] = useState({
    total_applicants: 0,
    completed_profiles: 0,
    incomplete_profiles: 0,
  });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [profileStatusFilter, setProfileStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // AbortController for cancelling requests when component unmounts or modal closes
  const [abortController, setAbortController] = useState(null);

  // ========================================
  // LIFECYCLE & DATA FETCHING
  // ========================================

  useEffect(() => {
    fetchApplicants();
    fetchStatistics();

    // Cleanup function to cancel pending requests
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [currentPage, profileStatusFilter]);

  useEffect(() => {
    handleSearch();
  }, [searchTerm]);

  // Handle escape key to close modal safely
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && showProfileModal) {
        handleCloseModal();
      }
    };

    if (showProfileModal) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [showProfileModal]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 25,
        sort: "created_at",
        order: "desc",
      };

      if (profileStatusFilter) {
        params.profile_status = profileStatusFilter;
      }

      const response = await applicantProfileAPI.getAll(params);

      if (response.success && response.data) {
        const applicantsData = response.data.data || response.data;
        setApplicants(applicantsData);
        setFilteredApplicants(applicantsData);

        if (response.data.last_page) {
          setTotalPages(response.data.last_page);
        }
      }
    } catch (error) {
      console.error("Failed to fetch applicants:", error);
      setApplicants([]);
      setFilteredApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await applicantProfileAPI.getStatistics();
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const fetchApplicantDetails = async (id) => {
    try {
      setLoading(true);

      // Cancel any existing request
      if (abortController) {
        abortController.abort();
      }

      // Create new abort controller for this request
      const controller = new AbortController();
      setAbortController(controller);

      const response = await applicantProfileAPI.getById(id, controller.signal);

      // Only update state if request wasn't aborted
      if (!controller.signal.aborted && response.success && response.data) {
        setSelectedApplicant(response.data);
        setShowProfileModal(true);
      }
    } catch (error) {
      // Only log error if it's not an aborted request
      if (error.name !== "AbortError") {
        console.error("Failed to fetch applicant details:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Safe modal close function that cancels pending requests
  const handleCloseModal = () => {
    // Cancel any pending requests
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    // Clear selected applicant and close modal
    setSelectedApplicant(null);
    setShowProfileModal(false);
  };

  // ========================================
  // SEARCH & FILTER HANDLERS
  // ========================================

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredApplicants(applicants);
      return;
    }

    const filtered = applicants.filter((applicant) => {
      const fullName = `${applicant.first_name || ""} ${
        applicant.last_name || ""
      }`.toLowerCase();
      const email = (applicant.email || "").toLowerCase();
      const phone = (applicant.phone || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      return (
        fullName.includes(search) ||
        email.includes(search) ||
        phone.includes(search)
      );
    });

    setFilteredApplicants(filtered);
  };

  const handleProfileStatusFilter = (profileStatus) => {
    setProfileStatusFilter(profileStatus);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setProfileStatusFilter("");
    setCurrentPage(1);
  };

  // ========================================
  // UI HELPER FUNCTIONS
  // ========================================

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFullName = (applicant) => {
    const firstName = applicant.first_name || "";
    const lastName = applicant.last_name || "";
    return `${firstName} ${lastName}`.trim() || "N/A";
  };

  // ========================================
  // COMPONENT RENDERS
  // ========================================

  const renderStatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              Total Applicants
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.total_applicants}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              Complete Profiles
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.completed_profiles}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center">
          <div className="p-2 bg-orange-50 rounded-lg">
            <AlertCircle className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              Incomplete Profiles
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.incomplete_profiles}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearchAndFilters = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Profile Status Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Profile Status:
            </span>
          </div>
          <select
            value={profileStatusFilter}
            onChange={(e) => handleProfileStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Profiles</option>
            <option value="completed">Complete Profiles</option>
            <option value="incomplete">Incomplete Profiles</option>
          </select>

          {(searchTerm || profileStatusFilter) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderApplicantsList = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Applicant Profiles ({filteredApplicants.length})
        </h3>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No applicants found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || profileStatusFilter
                ? "Try adjusting your search criteria"
                : "No applicant profiles available"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplicants.map((applicant) => (
                  <tr key={applicant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatFullName(applicant)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          {applicant.email || "N/A"}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {applicant.phone || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          applicant.profile_completed
                            ? "text-green-600 bg-green-50"
                            : "text-orange-600 bg-orange-50"
                        }`}
                      >
                        {applicant.profile_completed ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Incomplete
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {formatDate(applicant.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => fetchApplicantDetails(applicant.id)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfileModal = () => {
    if (!showProfileModal || !selectedApplicant) return null;

    const { profile, education, experience, emergency_contacts, documents } =
      selectedApplicant;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          // Close modal if clicking on backdrop
          if (e.target === e.currentTarget) {
            handleCloseModal();
          }
        }}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Applicant Profile: {formatFullName(profile)}
            </h2>
            <button
              onClick={handleCloseModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-8">
            {/* Basic Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900 border-l-4 border-blue-600 pl-3">
                  Basic Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Full Name
                    </label>
                    <p className="text-sm text-gray-900 font-medium">
                      {formatFullName(profile)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">
                      {profile.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Phone
                    </label>
                    <p className="text-sm text-gray-900">
                      {profile.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Date of Birth
                    </label>
                    <p className="text-sm text-gray-900">
                      {formatDate(profile.date_of_birth)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Gender
                    </label>
                    <p className="text-sm text-gray-900 capitalize">
                      {profile.gender || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Nationality
                    </label>
                    <p className="text-sm text-gray-900">
                      {profile.nationality || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      State of Origin
                    </label>
                    <p className="text-sm text-gray-900">
                      {profile.state_of_origin || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Marital Status
                    </label>
                    <p className="text-sm text-gray-900 capitalize">
                      {profile.marital_status || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Blood Group
                    </label>
                    <p className="text-sm text-gray-900">
                      {profile.blood_group || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      National ID
                    </label>
                    <p className="text-sm text-gray-900">
                      {profile.national_id_no || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900 border-l-4 border-green-600 pl-3">
                  Address Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Current Address
                  </h4>
                  <p className="text-sm text-gray-900">
                    {[
                      profile.address_current,
                      profile.address_line_2_current,
                      profile.local_government_residence_current,
                      profile.state_of_residence_current,
                    ]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Permanent Address
                  </h4>
                  <p className="text-sm text-gray-900">
                    {[
                      profile.address_permanent,
                      profile.address_line_2_permanent,
                      profile.local_government_residence_permanent,
                      profile.state_of_residence_permanent,
                    ]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Education Section */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900 border-l-4 border-purple-600 pl-3">
                  Education Background
                </h3>
              </div>

              {education ? (
                <div className="space-y-6">
                  {/* Primary Education */}
                  {education.primary && (
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <h4 className="text-lg font-semibold text-blue-900 mb-3">
                        Primary Education
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Primary Year
                          </label>
                          <p className="text-sm text-gray-900">
                            {education.primary.primary_year || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Secondary Year
                          </label>
                          <p className="text-sm text-gray-900">
                            {education.primary.secondary_year || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Highest Level
                          </label>
                          <p className="text-sm text-gray-900">
                            {education.primary.highest_level || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Secondary Education */}
                  {education.secondary && education.secondary.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <h4 className="text-lg font-semibold text-green-900 mb-3">
                        Secondary Education
                      </h4>
                      <div className="space-y-4">
                        {education.secondary.map((edu, index) => (
                          <div
                            key={index}
                            className="bg-white p-3 rounded border"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600">
                                  School Name
                                </label>
                                <p className="text-sm text-gray-900">
                                  {edu.school_name || "N/A"}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">
                                  Start Year
                                </label>
                                <p className="text-sm text-gray-900">
                                  {edu.start_year || "N/A"}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">
                                  End Year
                                </label>
                                <p className="text-sm text-gray-900">
                                  {edu.end_year || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tertiary Education */}
                  {education.tertiary && education.tertiary.length > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                      <h4 className="text-lg font-semibold text-purple-900 mb-3">
                        Tertiary Education
                      </h4>
                      <div className="space-y-4">
                        {education.tertiary.map((edu, index) => (
                          <div
                            key={index}
                            className="bg-white p-3 rounded border"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600">
                                  Institute Name
                                </label>
                                <p className="text-sm text-gray-900">
                                  {edu.institute_name || "N/A"}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">
                                  Qualification
                                </label>
                                <p className="text-sm text-gray-900">
                                  {edu.qualification_type || "N/A"}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">
                                  Field of Study
                                </label>
                                <p className="text-sm text-gray-900">
                                  {edu.field_of_study || "N/A"}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">
                                  Grade/Result
                                </label>
                                <p className="text-sm text-gray-900">
                                  {edu.grade_result || "N/A"}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">
                                  Start Year
                                </label>
                                <p className="text-sm text-gray-900">
                                  {edu.start_year || "N/A"}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">
                                  End Year
                                </label>
                                <p className="text-sm text-gray-900">
                                  {edu.end_year ||
                                    (edu.is_current ? "Current" : "N/A")}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Education Data */}
                  {!education.primary &&
                    (!education.secondary ||
                      education.secondary.length === 0) &&
                    (!education.tertiary ||
                      education.tertiary.length === 0) && (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">
                          No education information available
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No education information available
                  </p>
                </div>
              )}
            </div>

            {/* Work Experience Section */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-5 w-5 text-orange-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900 border-l-4 border-orange-600 pl-3">
                  Work Experience
                </h3>
              </div>

              {experience && experience.length > 0 ? (
                <div className="space-y-4">
                  {experience.map((exp, index) => (
                    <div
                      key={index}
                      className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Company
                          </label>
                          <p className="text-sm text-gray-900 font-medium">
                            {exp.company_name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Position
                          </label>
                          <p className="text-sm text-gray-900">
                            {exp.position || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Duration
                          </label>
                          <p className="text-sm text-gray-900">
                            {formatDate(exp.start_date)} -{" "}
                            {exp.end_date
                              ? formatDate(exp.end_date)
                              : "Present"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Last Salary
                          </label>
                          <p className="text-sm text-gray-900">
                            {exp.last_salary || "N/A"}
                          </p>
                        </div>
                        {exp.job_description && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-600">
                              Job Description
                            </label>
                            <p className="text-sm text-gray-900">
                              {exp.job_description}
                            </p>
                          </div>
                        )}
                        {exp.reason_for_leaving && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-600">
                              Reason for Leaving
                            </label>
                            <p className="text-sm text-gray-900">
                              {exp.reason_for_leaving}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No work experience information available
                  </p>
                </div>
              )}
            </div>

            {/* Emergency Contacts Section */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <Phone className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900 border-l-4 border-red-600 pl-3">
                  Emergency Contacts
                </h3>
              </div>

              {emergency_contacts && emergency_contacts.length > 0 ? (
                <div className="space-y-4">
                  {emergency_contacts.map((contact, index) => (
                    <div
                      key={index}
                      className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Name
                          </label>
                          <p className="text-sm text-gray-900 font-medium">
                            {contact.full_name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Relationship
                          </label>
                          <p className="text-sm text-gray-900">
                            {contact.relationship || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Phone
                          </label>
                          <p className="text-sm text-gray-900">
                            {contact.phone_primary || "N/A"}
                          </p>
                        </div>
                        {contact.address && (
                          <div className="md:col-span-3">
                            <label className="text-sm font-medium text-gray-600">
                              Address
                            </label>
                            <p className="text-sm text-gray-900">
                              {contact.address}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No emergency contact information available
                  </p>
                </div>
              )}
            </div>

            {/* Documents Section */}
            {documents && documents.length > 0 && (
              <div className="pb-6">
                <div className="flex items-center mb-4">
                  <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-900 border-l-4 border-indigo-600 pl-3">
                    Documents
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500"
                    >
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Document Type
                          </label>
                          <p className="text-sm text-gray-900 font-medium">
                            {doc.document_type || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Original Name
                          </label>
                          <p className="text-sm text-gray-900">
                            {doc.original_name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            File Size
                          </label>
                          <p className="text-sm text-gray-900">
                            {doc.file_size
                              ? `${(doc.file_size / 1024).toFixed(2)} KB`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Applicant Profiles
            </h1>
            <p className="text-gray-600">Manage and view candidate profiles</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {renderStatisticsCards()}

      {/* Search and Filters */}
      {renderSearchAndFilters()}

      {/* Applicants List */}
      {renderApplicantsList()}

      {/* Profile Modal */}
      {renderProfileModal()}
    </div>
  );
};

export default ApplicantProfile;
