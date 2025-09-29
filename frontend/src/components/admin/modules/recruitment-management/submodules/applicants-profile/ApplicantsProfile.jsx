// File: frontend/src/components/admin/modules/recruitment-management/submodules/applicants-profile/ApplicantsProfile.jsx

"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Users,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  Eye,
  UserPlus,
  GraduationCap,
  Briefcase,
  X
} from "lucide-react";
import applicantsProfileAPI from "../../../../../../services/modules/recruitment-management/applicantsProfileAPI";
import recruitmentRequestAPI from "../../../../../../services/modules/recruitment-management/recruitmentRequestAPI";

const ApplicantsProfile = ({ currentTheme, preferences, onBack }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterQualification, setFilterQualification] = useState("all");
  const [filterEmploymentStatus, setFilterEmploymentStatus] = useState("all");
  
  // Modal states
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Assignment states
  const [recruitmentRequests, setRecruitmentRequests] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState("");
  const [assignmentMotivation, setAssignmentMotivation] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  
  // States for filtering
  const [states, setStates] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  
  // Pagination
  const [pagination, setPagination] = useState({ total: 0, offset: 0, limit: 25, has_more: false });
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch data on component mount
  useEffect(() => {
    fetchApplicants();
    fetchStates();
    fetchActiveRecruitmentRequests();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchApplicants();
  }, [searchTerm, filterState, filterQualification, filterEmploymentStatus, pagination.limit]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.limit,
        offset: 0, // Reset to first page when filters change
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterState !== "all") params.state = filterState;
      if (filterQualification !== "all") params.qualification = filterQualification;
      if (filterEmploymentStatus !== "all") params.employment_status = filterEmploymentStatus;

      const response = await applicantsProfileAPI.getAll(params);
      
      if (response.success) {
        setApplicants(response.data || []);
        setPagination(response.pagination || { total: 0, offset: 0, limit: 25, has_more: false });
        
        // Extract unique qualifications for filter dropdown
        const uniqueQuals = [...new Set(response.data
          .filter(a => a.qualification_type)
          .map(a => a.qualification_type))];
        setQualifications(uniqueQuals);
      } else {
        setApplicants([]);
      }
    } catch (error) {
      console.error("Failed to fetch applicants:", error);
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await applicantsProfileAPI.getStates();
      if (response.status === 'success') {
        const uniqueStates = response.uniqueStates || [];
        setStates(uniqueStates);
      }
    } catch (error) {
      console.error("Failed to fetch states:", error);
    }
  };

  const fetchActiveRecruitmentRequests = async () => {
    try {
      const response = await recruitmentRequestAPI.getAll({
        status: 'active',
        limit: 50
      });
      if (response.success) {
        setRecruitmentRequests(response.data?.data || response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch active recruitment requests:", error);
    }
  };

  const handleViewDetails = async (candidate) => {
    setSelectedCandidate(candidate);
    setLoadingDetails(true);
    setShowDetailsModal(true);
    
    try {
      const response = await applicantsProfileAPI.getCandidateDetails(candidate.id);
      if (response.success) {
        setCandidateDetails(response.data);
      } else {
        setCandidateDetails(null);
      }
    } catch (error) {
      console.error("Failed to fetch candidate details:", error);
      setCandidateDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAssignToTicket = (candidate) => {
    setSelectedCandidate(candidate);
    setShowAssignModal(true);
    setSelectedTicket("");
    setAssignmentMotivation("");
  };

  const executeAssignment = async () => {
    if (!selectedTicket) {
      alert("Please select a recruitment request");
      return;
    }

    try {
      setAssignmentLoading(true);
      const response = await applicantsProfileAPI.assignToTicket(
        selectedCandidate.id,
        selectedTicket,
        assignmentMotivation
      );
      
      if (response.success) {
        alert("Candidate successfully assigned to recruitment request!");
        setShowAssignModal(false);
        fetchApplicants(); // Refresh the list
      } else {
        alert("Failed to assign candidate: " + (response.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Assignment error:", error);
      alert("Error assigning candidate: " + error.message);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const getStatusBadge = (candidate) => {
    if (candidate.is_currently_employed) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Briefcase className="w-3 h-3 inline mr-1" />
          Employed
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="w-3 h-3 inline mr-1" />
          Available
        </span>
      );
    }
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setPagination(prev => ({ ...prev, limit: newLimit, offset: 0 }));
  };

  const filteredApplicants = applicants.filter(applicant => {
    return true; // Filtering is now done on the server side
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading applicants...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className={`p-2 rounded-lg mr-4 ${
              currentTheme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            } transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${
              currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Applicants Profile
            </h1>
            <p className={`${
              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Manage and view all candidate profiles ({pagination.total} total)
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              currentTheme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>

        {/* State Filter */}
        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            currentTheme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="all">All States</option>
          {states.map((state) => (
            <option key={state.code} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>

        {/* Qualification Filter */}
        <select
          value={filterQualification}
          onChange={(e) => setFilterQualification(e.target.value)}
          className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            currentTheme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="all">All Qualifications</option>
          {qualifications.map((qual) => (
            <option key={qual} value={qual}>
              {qual}
            </option>
          ))}
        </select>

        {/* Employment Status Filter */}
        <select
          value={filterEmploymentStatus}
          onChange={(e) => setFilterEmploymentStatus(e.target.value)}
          className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            currentTheme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="all">All Candidates</option>
          <option value="available">Available</option>
          <option value="employed">Currently Employed</option>
        </select>
      </div>

      {/* Pagination Options */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Show
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
            className={`px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 ${
              currentTheme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>
          <span className={`text-sm ${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            entries per page
          </span>
        </div>
        <div className={`text-sm ${
          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} entries
        </div>
      </div>

      {/* Applicants List */}
      <div className="grid gap-4">
        {filteredApplicants.length === 0 ? (
          <div className={`text-center py-12 ${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No applicants found</p>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredApplicants.map((applicant) => (
            <div
              key={applicant.id}
              className={`p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                currentTheme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-2">
                {/* Header with Name and Status */}
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-medium ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {applicant.first_name} {applicant.middle_name} {applicant.last_name}
                  </h3>
                  {getStatusBadge(applicant)}
                </div>

                {/* Single Line with Essential Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                    {/* Email */}
                    <div className={`flex items-center text-xs ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{applicant.email}</span>
                    </div>

                    {/* Phone */}
                    {applicant.phone && (
                      <div className={`flex items-center text-xs ${
                        currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{applicant.phone}</span>
                      </div>
                    )}

                    {/* Qualification */}
                    {applicant.qualification_type && (
                      <div className={`flex items-center text-xs ${
                        currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <GraduationCap className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{applicant.qualification_type}</span>
                      </div>
                    )}

                    {/* Date of Birth */}
                    {applicant.date_of_birth && (
                      <div className={`flex items-center text-xs ${
                        currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{new Date(applicant.date_of_birth).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Location */}
                    {applicant.state_of_residence && (
                      <div className={`flex items-center text-xs ${
                        currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{applicant.state_of_residence}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={() => handleViewDetails(applicant)}
                      className={`px-2 py-1 rounded transition-colors flex items-center text-xs ${
                        currentTheme === 'dark'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                      title="View Details"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </button>
                    
                    {!applicant.is_currently_employed && (
                      <button
                        onClick={() => handleAssignToTicket(applicant)}
                        className={`px-2 py-1 rounded transition-colors flex items-center text-xs ${
                          currentTheme === 'dark'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                        title="Assign to Ticket"
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.has_more && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
              fetchApplicants();
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              currentTheme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Load More
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg ${
            currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${
                  currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Candidate Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`p-2 rounded-lg ${
                    currentTheme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Loading details...
                  </p>
                </div>
              ) : candidateDetails ? (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className={`p-4 rounded-lg ${
                    currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <h3 className={`font-semibold mb-3 ${
                      currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>Full Name:</strong> {candidateDetails.candidate.first_name} {candidateDetails.candidate.middle_name} {candidateDetails.candidate.last_name}
                        </p>
                        <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>Email:</strong> {candidateDetails.candidate.email}
                        </p>
                        <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>Phone:</strong> {candidateDetails.candidate.phone}
                        </p>
                        <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>Gender:</strong> {candidateDetails.candidate.gender || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>Date of Birth:</strong> {candidateDetails.candidate.date_of_birth || 'Not specified'}
                        </p>
                        <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>Marital Status:</strong> {candidateDetails.candidate.marital_status || 'Not specified'}
                        </p>
                        <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>Nationality:</strong> {candidateDetails.candidate.nationality || 'Not specified'}
                        </p>
                        <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          <strong>State of Residence:</strong> {candidateDetails.candidate.state_of_residence || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Education */}
                  {/* Education - Updated to handle the correct data structure */}
                  {candidateDetails.education && (
                    <div className={`p-4 rounded-lg ${
                      currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h3 className={`font-semibold mb-3 ${
                        currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        <GraduationCap className="w-5 h-5 inline mr-2" />
                        Education History
                      </h3>

                      {/* Primary Education */}
                      {candidateDetails.education.primary && (
                        <div className="mb-4">
                          <h4 className={`font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Primary Education
                          </h4>
                          <div className={`p-3 rounded border-l-4 border-blue-400 ${
                            currentTheme === 'dark' ? 'bg-gray-600' : 'bg-blue-50'
                          }`}>
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              <strong>Primary Year:</strong> {candidateDetails.education.primary.primary_year}
                            </p>
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              <strong>Secondary Year:</strong> {candidateDetails.education.primary.secondary_year}
                            </p>
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              <strong>Highest Level:</strong> {candidateDetails.education.primary.highest_level}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Secondary Education */}
                      {candidateDetails.education.secondary && candidateDetails.education.secondary.length > 0 && (
                        <div className="mb-4">
                          <h4 className={`font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Secondary Education
                          </h4>
                          {candidateDetails.education.secondary.map((sec, index) => (
                            <div key={index} className={`mb-2 p-3 rounded border-l-4 border-green-400 ${
                              currentTheme === 'dark' ? 'bg-gray-600' : 'bg-green-50'
                            }`}>
                              <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                <strong>School:</strong> {sec.school_name}
                              </p>
                              <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                <strong>Period:</strong> {sec.start_year} - {sec.end_year || 'Present'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tertiary Education */}
                      {candidateDetails.education.tertiary && candidateDetails.education.tertiary.length > 0 && (
                        <div className="mb-4">
                          <h4 className={`font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Tertiary Education
                          </h4>
                          {candidateDetails.education.tertiary.map((ter, index) => (
                            <div key={index} className={`mb-2 p-3 rounded border-l-4 border-purple-400 ${
                              currentTheme === 'dark' ? 'bg-gray-600' : 'bg-purple-50'
                            }`}>
                              <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                <strong>Institution:</strong> {ter.institute_name}
                              </p>
                              <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                <strong>Qualification:</strong> {ter.qualification_type}
                              </p>
                              <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                <strong>Field of Study:</strong> {ter.field_of_study || 'Not specified'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Emergency Contacts */}
                  {candidateDetails.emergency_contacts && candidateDetails.emergency_contacts.length > 0 && (
                    <div className={`p-4 rounded-lg ${
                      currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h3 className={`font-semibold mb-3 ${
                        currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        <Phone className="w-5 h-5 inline mr-2" />
                        Emergency Contacts
                      </h3>
                      {candidateDetails.emergency_contacts.map((contact, index) => (
                        <div key={index} className={`mb-3 p-3 rounded border-l-4 border-red-400 ${
                          currentTheme === 'dark' ? 'bg-gray-600' : 'bg-red-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <p className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {contact.full_name}
                            </p>
                            {contact.is_primary && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <strong>Relationship:</strong> {contact.relationship}
                          </p>
                          <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <strong>Phone:</strong> {contact.phone_primary}
                            {contact.phone_secondary && ` • ${contact.phone_secondary}`}
                          </p>
                          {contact.email && (
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong>Email:</strong> {contact.email}
                            </p>
                          )}
                          {contact.address && (
                            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <strong>Address:</strong> {contact.address}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Experience */}
                  {candidateDetails.experience && candidateDetails.experience.length > 0 && (
                    <div className={`p-4 rounded-lg ${
                      currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h3 className={`font-semibold mb-3 ${
                        currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Work Experience
                      </h3>
                      {candidateDetails.experience.map((exp, index) => (
                        <div key={index} className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                          <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            <strong>{exp.job_title}</strong> at {exp.company_name}
                          </p>
                          <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {exp.start_date} - {exp.end_date || 'Present'}
                          </p>
                          {exp.description && (
                            <p className={`text-sm mt-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Applications History */}
                  {candidateDetails.applications && candidateDetails.applications.length > 0 && (
                    <div className={`p-4 rounded-lg ${
                      currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h3 className={`font-semibold mb-3 ${
                        currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Application History
                      </h3>
                      {candidateDetails.applications.map((app, index) => (
                        <div key={index} className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                          <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            <strong>{app.job_title}</strong> - {app.client_name}
                          </p>
                          <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Ticket: {app.ticket_id} • Status: {app.application_status} • Applied: {app.applied_at}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className={currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Failed to load candidate details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-lg rounded-lg ${
            currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${
                  currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Assign to Recruitment Request
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className={`p-2 rounded-lg ${
                    currentTheme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Candidate
                  </label>
                  <p className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {selectedCandidate?.first_name} {selectedCandidate?.last_name} ({selectedCandidate?.email})
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Select Recruitment Request <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedTicket}
                    onChange={(e) => setSelectedTicket(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      currentTheme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select a recruitment request...</option>
                    {recruitmentRequests.map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.ticket_id} - {request.job_title} ({request.client_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Motivation/Notes (Optional)
                  </label>
                  <textarea
                    value={assignmentMotivation}
                    onChange={(e) => setAssignmentMotivation(e.target.value)}
                    rows={3}
                    placeholder="Why is this candidate suitable for this position?"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                      currentTheme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                      currentTheme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeAssignment}
                    disabled={assignmentLoading || !selectedTicket}
                    className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                      assignmentLoading || !selectedTicket
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {assignmentLoading ? 'Assigning...' : 'Assign Candidate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantsProfile;
