import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Clock, DollarSign, Users, Calendar, AlertCircle, 
  CheckCircle, Eye, Send, Filter, Star, Building, X 
} from 'lucide-react';
import API from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const ApplyForPosition = ({ candidateProfile, currentTheme, onClose }) => {
  const { sanctumRequest, user } = useAuth(); // Add user to get current user info
  const [availableJobs, setAvailableJobs] = useState([]);
  const [statesLgas, setStatesLgas] = useState([]); // For state matching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [viewingJob, setViewingJob] = useState(null);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    expectedSalary: '',
    availableStartDate: '',
  });
  const [pendingJobHighlight, setPendingJobHighlight] = useState(null);

  // Check for pending job application from registration
  useEffect(() => {
    const pendingJobId = sessionStorage.getItem('pending_job_application');
    if (pendingJobId) {
      console.log('📋 Found pending job application:', pendingJobId);
      setPendingJobHighlight(pendingJobId);
      // Don't clear yet - wait until jobs are loaded
    }
  }, []);

  // Auto-open job details when pending job is found and jobs are loaded
  useEffect(() => {
    if (pendingJobHighlight && availableJobs.length > 0) {
      const targetJob = availableJobs.find(
        (job) => job.ticketId === pendingJobHighlight || job.ticket_id === pendingJobHighlight
      );
      
      if (targetJob) {
        console.log('✅ Found target job, opening details:', targetJob);
        handleViewDetails(targetJob);
        // Clear from storage after opening
        sessionStorage.removeItem('pending_job_application');
        // Clear highlight after 5 seconds
        setTimeout(() => setPendingJobHighlight(null), 5000);
      }
    }
  }, [pendingJobHighlight, availableJobs]);

  // Fetch available jobs from API
  useEffect(() => {
    const fetchAvailableJobs = async () => {
      setLoading(true);
      try {
        console.log('🔍 Fetching available jobs...');
        
        // Check token availability
        const token = localStorage.getItem('auth_token') || 
                     localStorage.getItem('token') || 
                     (localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).access_token : null);
        
        console.log('🔐 Token available:', !!token);
        
        // Fetch available jobs with application status from current vacancies
        const response = await sanctumRequest('/api/current-vacancies', {
          method: 'GET'
        });

        console.log('📡 Raw response:', response);
        console.log('📡 Response ok:', response.ok);
        console.log('📡 Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('📊 API Data:', data);
          
          if (data.success && data.data && data.data.data) {
            console.log('✅ Jobs found:', data.data.data.length);
            console.log('👤 Current user ID:', user?.profile_id || user?.id);
            
            // Transform the response to match our expected format
            const transformedJobs = data.data.data.map(job => {
              // Check if current candidate has already applied to this job
              const currentCandidateId = user?.profile_id || user?.id;
              const existingApplication = job.applications?.find(app => app.candidate_id === currentCandidateId);
              
              console.log(`📋 Job ${job.id} (${job.job_structure?.job_title}):`, {
                applications: job.applications?.length || 0,
                candidateAlreadyApplied: !!existingApplication,
                applicationStatus: existingApplication?.application_status
              });

              return {
                id: job.id,
                ticketId: job.ticket_id || `TCK_${job.id}`,
                title: job.job_structure?.job_title || job.job_title || `Position ${job.id}`,
                company: job.client?.organisation_name || job.client_name || 'SOL Nigeria',
                location: job.location || job.lga || 'Lagos',
                state: job.state || 'Lagos',
                salaryMin: job.min_salary || 200000,
                salaryMax: job.max_salary || 400000,
                ageMin: job.age_limit_min || 18,
                ageMax: job.age_limit_max || 65,
                experience: job.experience_requirement || '1-3 years',
                deadline: job.deadline || job.recruitment_period_end,
                description: job.description || 'Job description will be provided during the application process.',
                requirements: job.requirements ? (Array.isArray(job.requirements) ? job.requirements : job.requirements.split('\n')) : [
                  'Relevant educational background',
                  'Good communication skills',
                  'Professional attitude'
                ],
                jobType: job.employment_type || 'Full-time',
                minimumQualification: job.minimum_qualification || 'SSCE',
                department: job.department || job.job_structure?.description || 'Operations',
                // Application status fields from the API - updated to use actual application data
                has_applied: !!existingApplication,
                application_status: existingApplication?.application_status || null,
                applied_at: existingApplication?.applied_at || null,
                application_id: existingApplication?.id || null
              };
            });

            // Apply eligibility checking to transformed jobs
            const jobsWithEligibility = transformedJobs.map(job => {
              const eligibilityCheck = checkEligibility(job, candidateProfile);
              return {
                ...job,
                ...eligibilityCheck
              };
            });

            setAvailableJobs(jobsWithEligibility);
          } else {
            throw new Error(data.message || 'Failed to fetch jobs');
          }
        } else {
          throw new Error('Failed to fetch jobs');
        }
      } catch (error) {
        console.error('Error fetching available jobs:', error);
        setAvailableJobs([]);
        setError('Failed to load available jobs from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableJobs();
  }, [candidateProfile]);

  // Fetch states/LGAs data for proper state matching
  useEffect(() => {
    const fetchStatesLgas = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/states-lgas", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === "success" && Array.isArray(result.states)) {
            // Flatten the nested structure
            const flattenedData = [];
            result.states.forEach((stateObj) => {
              if (stateObj.lgas && Array.isArray(stateObj.lgas)) {
                stateObj.lgas.forEach((lga) => {
                  flattenedData.push({
                    id: lga.id,
                    state_name: stateObj.state,
                    lga_name: lga.name,
                  });
                });
              }
            });
            setStatesLgas(flattenedData);
            console.log("States/LGAs loaded for job matching:", flattenedData.length, "records");
          }
        }
      } catch (error) {
        console.error("Error fetching states/LGAs for job matching:", error);
      }
    };

    fetchStatesLgas();
  }, []);

  // Function to check job eligibility based on candidate profile
  const checkEligibility = (job, candidate) => {
    if (!candidate) {
      return {
        eligibilityMatch: false,
        matchReasons: [],
        warnings: ['Profile not complete'],
        missingFields: ['Complete profile required']
      };
    }

    const matchReasons = [];
    const warnings = [];
    const missingFields = [];
    let isEligible = true;

    // Check required profile fields
    if (!candidate.date_of_birth) {
      missingFields.push('Date of birth');
      isEligible = false;
    }

    // Use state_lga_id for proper state matching
    let candidateState = null;
    if (candidate.state_lga_id && statesLgas.length > 0) {
      // Find the state from state_lga_id (proper approach)
      const stateLgaRecord = statesLgas.find(item => item.id == candidate.state_lga_id);
      candidateState = stateLgaRecord?.state_name;
    } else {
      // Fallback to text-based fields for legacy data
      candidateState = candidate.state_of_residence_permanent || 
                      candidate.state_of_residence || 
                      candidate.permanent_address_state || 
                      candidate.state;
    }

    if (!candidateState) {
      missingFields.push('State/LGA information (please update your profile)');
      isEligible = false;
    }

    // If basic profile is incomplete, return early
    if (missingFields.length > 0) {
      return {
        eligibilityMatch: false,
        matchReasons: [],
        warnings: [`Please complete your profile: ${missingFields.join(', ')}`],
        missingFields
      };
    }

    // Check location match (state) - now using proper state_lga_id approach
    if (candidateState && job.state) {
      if (candidateState.toLowerCase() === job.state.toLowerCase()) {
        matchReasons.push('Location match');
      } else {
        warnings.push(`Location mismatch - Job in ${job.state}, candidate in ${candidateState}`);
        isEligible = false;
      }
    }

    // Check age requirement
    if (candidate.date_of_birth && job.ageMin && job.ageMax) {
      const candidateAge = calculateAge(candidate.date_of_birth);
      if (candidateAge >= job.ageMin && candidateAge <= job.ageMax) {
        matchReasons.push('Age requirement met');
      } else {
        warnings.push(`Age requirement not met - Required: ${job.ageMin}-${job.ageMax}, Candidate: ${candidateAge}`);
        isEligible = false;
      }
    }

    return {
      eligibilityMatch: isEligible,
      matchReasons,
      warnings,
      missingFields: []
    };
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Filter jobs based on search and location
  const filteredJobs = availableJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !selectedLocation || job.state === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleViewDetails = (job) => {
    setViewingJob(job);
    setShowJobDetailsModal(true);
  };

  const submitApplication = async () => {
    try {
      // Check if candidate profile exists
      if (!candidateProfile || !candidateProfile.id) {
        alert('Candidate profile not found. Please complete your profile first.');
        return;
      }

      const applicationPayload = {
        candidate_id: candidateProfile.id, // Add candidate ID from profile
        recruitment_request_id: selectedJob.id, // Use the actual recruitment request ID
        cover_letter: applicationData.coverLetter,
        expected_salary: applicationData.expectedSalary ? parseFloat(applicationData.expectedSalary) : null,
        available_start_date: applicationData.availableStartDate,
        motivation: `Application for ${selectedJob.title} position`,
      };

      console.log('Submitting application:', applicationPayload);
      
      const response = await sanctumRequest('http://localhost:8000/api/apply-for-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationPayload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`Application submitted successfully! We will review your application and contact you soon.`);
          setShowApplicationModal(false);
          setSelectedJob(null);
          setApplicationData({
            coverLetter: '',
            expectedSalary: '',
            availableStartDate: '',
          });
          // Refresh the jobs list to update application status without reloading entire page
          if (typeof fetchJobs === 'function') {
            fetchJobs();
          } else {
            // Fallback: trigger a gentle refresh of the component
            window.location.hash = '#refreshed';
            window.location.hash = '';
          }
        } else {
          throw new Error(data.message || 'Failed to submit application');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application: ' + error.message);
    }
  };

  const formatSalary = (min, max) => {
    return `₦${min.toLocaleString()} - ₦${max.toLocaleString()}`;
  };

  const getJobCard = (job) => {
    const isHighlighted = 
      pendingJobHighlight && 
      (job.ticketId === pendingJobHighlight || job.ticket_id === pendingJobHighlight);
    
    return (
      <div 
        key={job.id} 
        className={`p-6 border rounded-lg ${currentTheme.border} ${currentTheme.cardBg} hover:shadow-md transition-all ${
          isHighlighted 
            ? 'ring-4 ring-blue-500 ring-opacity-50 animate-pulse shadow-xl' 
            : ''
        }`}
      >
        {/* Pending Application Badge */}
        {isHighlighted && (
          <div className="mb-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Star className="w-5 h-5 mr-2 fill-current" />
              <span className="font-semibold">You were applying for this position!</span>
            </div>
          </div>
        )}
        
        {/* Job Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-1`}>
            {job.title}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center">
              <Building className="w-4 h-4 mr-1" />
              {job.company}
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {job.location}, {job.state}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {job.jobType}
            </div>
          </div>
          <p className={`text-sm ${currentTheme.textSecondary} mb-3`}>
            {job.description.substring(0, 150)}...
          </p>
        </div>
        
        {/* Status Badges */}
        <div className="ml-4 space-y-2">
          {/* Application Status Badge */}
          {job.has_applied && (
            <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4 mr-1" />
              Applied
            </div>
          )}
          {job.has_applied && job.application_status && (
            <div className="flex items-center bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs">
              Status: {job.application_status.replace('_', ' ').toUpperCase()}
            </div>
          )}
          
          {/* Eligibility Badge */}
          {job.eligibilityMatch ? (
            <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Eligible
            </div>
          ) : (
            <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              Not Eligible
            </div>
          )}
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-1">
            <DollarSign className="w-4 h-4 mr-1" />
            Salary Range
          </div>
          <div className={`font-medium ${currentTheme.textPrimary}`}>
            {formatSalary(job.salaryMin, job.salaryMax)}
          </div>
        </div>
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-1">
            <Users className="w-4 h-4 mr-1" />
            Experience
          </div>
          <div className={`font-medium ${currentTheme.textPrimary}`}>
            {job.experience}
          </div>
        </div>
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-1">
            <Clock className="w-4 h-4 mr-1" />
            Age Range
          </div>
          <div className={`font-medium ${currentTheme.textPrimary}`}>
            {job.ageMin} - {job.ageMax} years
          </div>
        </div>
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-1">
            <Calendar className="w-4 h-4 mr-1" />
            Deadline
          </div>
          <div className={`font-medium ${currentTheme.textPrimary}`}>
            {new Date(job.deadline).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Match Indicators */}
      {job.matchReasons.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-green-600 font-medium mb-2">✓ Why you're a good match:</div>
          <ul className="text-sm text-green-600 space-y-1">
            {job.matchReasons.map((reason, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-2" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {job.warnings.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-orange-600 font-medium mb-2">⚠ Requirements not met:</div>
          <ul className="text-sm text-orange-600 space-y-1">
            {job.warnings.map((warning, index) => (
              <li key={index} className="flex items-center">
                <AlertCircle className="w-3 h-3 mr-2" />
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => handleViewDetails(job)}
          className={`px-4 py-2 border rounded-lg ${currentTheme.border} ${currentTheme.textSecondary} hover:bg-gray-50 transition-colors`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          View Details
        </button>
        
        <div className="flex flex-col items-end">
          <button
            onClick={() => handleApply(job)}
            disabled={!job.eligibilityMatch || job.has_applied}
            className={`px-6 py-2 rounded-lg transition-colors ${
              job.has_applied
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : job.eligibilityMatch
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={
              job.has_applied 
                ? `Already applied on ${new Date(job.applied_at).toLocaleDateString()}`
                : !job.eligibilityMatch && job.missingFields?.length > 0 
                  ? `Complete your profile: ${job.missingFields.join(', ')}` 
                  : job.warnings?.join('; ') || ''
            }
          >
            <Send className="w-4 h-4 inline mr-2" />
            {job.has_applied 
              ? 'Already Applied'
              : job.eligibilityMatch 
                ? 'Apply Now' 
                : job.missingFields?.length > 0 
                  ? 'Complete Profile' 
                  : 'Not Eligible'
            }
          </button>
          {job.has_applied && (
            <div className="text-xs mt-1 text-right">
              <p className="text-blue-600">
                Applied: {new Date(job.applied_at).toLocaleDateString()}
              </p>
              {job.application_status && (
                <p className="text-gray-600 capitalize">
                  Status: {job.application_status.replace('_', ' ')}
                </p>
              )}
            </div>
          )}
          {!job.eligibilityMatch && job.missingFields?.length > 0 && (
            <p className="text-xs text-red-500 mt-1 text-right">
              Please complete: {job.missingFields.join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className={`min-h-screen ${currentTheme.bgSecondary}`}>
      {/* Header */}
      <div className={`${currentTheme.cardBg} border-b ${currentTheme.border} p-6`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2`}>
              Apply for Position
            </h1>
            <p className={`${currentTheme.textSecondary}`}>
              Find and apply for jobs that match your profile and qualifications
            </p>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 border rounded-lg ${currentTheme.border} ${currentTheme.textSecondary} hover:bg-gray-50`}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${currentTheme.cardBg} border-b ${currentTheme.border} p-6`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
              />
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className={`px-4 py-2 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
            >
              <option value="">All Locations</option>
              <option value="Lagos">Lagos</option>
              <option value="FCT">Abuja (FCT)</option>
              <option value="Rivers">Port Harcourt</option>
              <option value="Kano">Kano</option>
            </select>
          </div>

          {/* Show Eligible Only */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="eligibleOnly"
              className="mr-2"
            />
            <label htmlFor="eligibleOnly" className={`text-sm ${currentTheme.textPrimary}`}>
              Show eligible jobs only
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`${currentTheme.textSecondary}`}>Loading available positions...</p>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="mb-6">
              <p className={`${currentTheme.textSecondary}`}>
                Found {filteredJobs.length} position{filteredJobs.length !== 1 ? 's' : ''} 
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedLocation && ` in ${selectedLocation}`}
              </p>
            </div>

            {/* Jobs List */}
            <div className="space-y-6">
              {filteredJobs.length > 0 ? (
                filteredJobs.map(job => getJobCard(job))
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className={`text-lg font-medium ${currentTheme.textPrimary} mb-2`}>
                    No positions found
                  </h3>
                  <p className={`${currentTheme.textSecondary}`}>
                    Try adjusting your search criteria or check back later for new opportunities.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.cardBg} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <h2 className={`text-xl font-bold ${currentTheme.textPrimary} mb-4`}>
                Apply for {selectedJob.title}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                    Cover Letter
                  </label>
                  <textarea
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
                    rows="6"
                    className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                    placeholder="Write a brief cover letter explaining why you're interested in this position..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                      Expected Salary (₦)
                    </label>
                    <input
                      type="number"
                      value={applicationData.expectedSalary}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                      className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                      placeholder="Enter your expected salary"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                      Available Start Date
                    </label>
                    <input
                      type="date"
                      value={applicationData.availableStartDate}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, availableStartDate: e.target.value }))}
                      className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className={`px-6 py-2 border rounded-lg ${currentTheme.border} ${currentTheme.textSecondary} hover:bg-gray-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={submitApplication}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetailsModal && viewingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {viewingJob.title}
                </h2>
                <button
                  onClick={() => {
                    setShowJobDetailsModal(false);
                    setViewingJob(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Department</p>
                    <p className="text-gray-800">{viewingJob.department}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    <p className="text-gray-800">{viewingJob.location}, {viewingJob.state}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Salary Range</p>
                    <p className="text-gray-800">{formatSalary(viewingJob.salaryMin, viewingJob.salaryMax)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Employment Type</p>
                    <p className="text-gray-800">{viewingJob.jobType}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Job Description</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {viewingJob.description}
                    </p>
                  </div>
                </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Requirements</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">Age Range</p>
                          <p className="text-gray-800">
                            {viewingJob.ageMin && viewingJob.ageMax 
                              ? `${viewingJob.ageMin} - ${viewingJob.ageMax} years`
                              : 'Not specified'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">Location</p>
                          <p className="text-gray-800">{viewingJob.state || 'Any'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Experience Required</p>
                        <p className="text-gray-800">{viewingJob.experience}</p>
                      </div>
                      
                      {viewingJob.minimumQualification && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-gray-500 uppercase mb-2">Minimum Qualification</p>
                          <p className="text-gray-800">{viewingJob.minimumQualification}</p>
                        </div>
                      )}
                    </div>
                  </div>                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    {viewingJob.eligibilityMatch ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        ✓ Eligible
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                        ✗ Not Eligible
                      </span>
                    )}
                    
                    {viewingJob.matchReasons.length > 0 && (
                      <div className="text-xs text-green-600">
                        {viewingJob.matchReasons.length} requirement{viewingJob.matchReasons.length !== 1 ? 's' : ''} met
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowJobDetailsModal(false);
                        setViewingJob(null);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowJobDetailsModal(false);
                        setViewingJob(null);
                        handleApply(viewingJob);
                      }}
                      disabled={!viewingJob.eligibilityMatch}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        viewingJob.eligibilityMatch
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={!viewingJob.eligibilityMatch && viewingJob.missingFields?.length > 0 
                        ? `Complete your profile: ${viewingJob.missingFields.join(', ')}` 
                        : viewingJob.warnings?.join('; ') || ''
                      }
                    >
                      <Send className="w-4 h-4 inline mr-2" />
                      {viewingJob.eligibilityMatch 
                        ? 'Apply Now' 
                        : viewingJob.missingFields?.length > 0 
                          ? 'Complete Profile' 
                          : 'Not Eligible'
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyForPosition;
