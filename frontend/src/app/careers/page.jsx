"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Search,
  Filter,
  Briefcase,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const CareersPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 12,
    current_page: 1,
    last_page: 1,
  });

  // Fetch public jobs
  useEffect(() => {
    fetchJobs();
  }, [currentPage, searchTerm, selectedLocation, selectedJobType]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 12,
      });

      if (searchTerm) params.append("search", searchTerm);
      if (selectedLocation) params.append("location", selectedLocation);
      if (selectedJobType) params.append("job_type", selectedJobType);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/jobs?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log("API Response:", result);

      if (result.success && result.data) {
        const jobsData = result.data.data || [];
        console.log("Jobs loaded:", jobsData.length);
        setJobs(jobsData);
        setPagination({
          total: result.data.total || 0,
          per_page: result.data.per_page || 12,
          current_page: result.data.current_page || 1,
          last_page: result.data.last_page || 1,
        });
      } else {
        setError(result.message || "Failed to load jobs");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(`Failed to load positions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (job) => {
    // Redirect to registration with job_id
    router.push(`/register?job_id=${job.ticket_id}`);
  };

  const handleSignIn = () => {
    // Store the current URL params to preserve context after login
    const urlParams = new URLSearchParams(window.location.search);
    const currentJobId = urlParams.get('job_id');
    
    if (currentJobId) {
      // Store job_id in sessionStorage to persist through login
      sessionStorage.setItem('pending_job_application', currentJobId);
    }
    
    router.push("/login");
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  const formatSalary = (compensation) => {
    if (!compensation) return "Competitive";
    return `₦${parseFloat(compensation).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get unique locations for filter
  const locations = [
    ...new Set(jobs.map((job) => job.lga).filter(Boolean)),
  ].sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Strategic Outsourcing Limited
              </h1>
              <p className="text-gray-600 mt-1">Career Opportunities</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSignIn}
                className="px-6 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/register")}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Find Your Next Career Opportunity
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join our network of talented professionals
          </p>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Job title, keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
              </div>

              {/* Location Filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none text-gray-900"
                >
                  <option value="">All Locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Type Filter */}
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none text-gray-900"
                >
                  <option value="">All Types</option>
                  <option value="MSS">Managed Staff Services</option>
                  <option value="RS">Recruitment Services</option>
                  <option value="DSS">Domestic Staff Services</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-700">
              <span className="font-semibold">{pagination.total}</span> open
              positions available
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedLocation("");
                  setSelectedJobType("");
                }}
                className="text-indigo-600 hover:text-indigo-700 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Loading positions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No positions found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                  >
                    {/* Priority Badge */}
                    {job.priority_level === "urgent" && (
                      <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 uppercase">
                        Urgent Hiring
                      </div>
                    )}

                  <div className="p-6">
                      {/* Job Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {job.job_structure?.job_title || "Position Available"}
                      </h3>

                      {/* Company */}
                      <div className="flex items-center text-gray-600 mb-3">
                        <Building className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          {job.client?.industry_category || "Various Industries"}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>
                          {job.lga}, {job.zone}
                        </span>
                      </div>

                      {/* Job Details */}
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Compensation:</span>
                          <span className="font-medium text-gray-900">
                            {formatSalary(job.compensation)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Deadline:</span>
                          <span className="font-medium text-gray-900">
                            {formatDate(job.recruitment_period_end)}
                          </span>
                        </div>
                      </div>

                      {/* Description Preview */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {job.description || "Join our team..."}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(job)}
                          className="flex-1 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleApply(job)}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center"
                        >
                          Apply Now
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-white">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, pagination.last_page)
                    )
                  }
                  disabled={currentPage === pagination.last_page}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Job Details Modal */}
      {showDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedJob.job_structure?.job_title}
                  </h2>
                  <div className="flex items-center text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    <span>
                      <span className="font-medium">Industry - </span> {selectedJob.client?.industry_category || "Various Industries"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              

              


              {/* Job Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Location</div>
                  <div className="font-medium text-gray-900">
                    {selectedJob.lga}, {selectedJob.zone}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Compensation</div>
                  <div className="font-medium text-gray-900">
                    {formatSalary(selectedJob.compensation)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    Application Deadline
                  </div>
                  <div className="font-medium text-gray-900">
                    {formatDate(selectedJob.recruitment_period_end)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Age Range</div>
                  <div className="font-medium text-gray-900">
                    {selectedJob.age_limit_min || "N/A"} -{" "}
                    {selectedJob.age_limit_max || "N/A"} years
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Gender</div>
                  <div className="font-medium capitalize text-gray-900">
                    {selectedJob.gender_requirement || "Any"}
                  </div>
                </div>
              </div>


              {/* Experience Requirement */}
              {selectedJob.experience_requirement && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    Experience Required
                  </h3>
                  <p className="text-gray-900">
                    {selectedJob.experience_requirement}
                  </p>
                </div>
              )}
              
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Job Description</h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedJob.description}
                </p>
              </div>

              {/* Qualifications */}
              {selectedJob.qualifications &&
                selectedJob.qualifications.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">
                      Required Qualifications
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedJob.qualifications.map((qual, index) => (
                        <li key={index} className="text-gray-900">
                          {qual.name}
                          {qual.class && ` - ${qual.class}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Special Requirements */}
              {selectedJob.special_requirements && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    Special Requirements
                  </h3>
                  <p className="text-gray-900">
                    {selectedJob.special_requirements}
                  </p>
                </div>
              )}

              {/* Apply Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleApply(selectedJob);
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  Apply for this Position
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>© 2026 Strategic Outsourcing Limited. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CareersPage;