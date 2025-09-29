// File: frontend/src/components/admin/modules/recruitment-management/submodules/current-vacancies/InviteModal.jsx

"use client";

import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Users,
  Send,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Search,
} from "lucide-react";
import currentVacanciesAPI from "@/services/modules/recruitment-management/currentVacanciesAPI";
import testManagementAPI from "@/services/modules/recruitment-management/testManagementAPI";

const InviteModal = ({ vacancy, onClose, onInvitationSent, currentTheme }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState(
    vacancy.selectedCandidates?.map((app) => app.candidate_id) || []
  );

  // Tab state for dual invite system
  const [activeInviteTab, setActiveInviteTab] = useState("interview");

  const [invitationData, setInvitationData] = useState({
    interview_date: "",
    interview_time: "",
    location: "",
    interview_type: "physical", // Changed from "in_person" to "physical"
    meeting_link: "",
    phone_number: "",
    duration_minutes: 60, // Default duration in minutes
    instructions: "",
    message: `Dear Candidate,

We are pleased to inform you that your application for the position of ${vacancy.job_title} at ${vacancy.client_name} has been reviewed and we would like to invite you for an interview.

Please confirm your availability for the scheduled interview.

Best regards,
Recruitment Team`,
  });

  // Test invite data - simplified to only existing test selection
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [loadingTests, setLoadingTests] = useState(false);

  const interviewTypes = [
    { value: "physical", label: "In-Person Interview", icon: Users }, // Changed from "in_person" to "physical"
    { value: "virtual", label: "Video Interview", icon: Video }, // Changed from "video" to "virtual"
    { value: "phone", label: "Phone Interview", icon: Phone },
  ];

  const handleInputChange = (field, value) => {
    setInvitationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Load available tests when modal opens
  useEffect(() => {
    const loadAvailableTests = async () => {
      try {
        setLoadingTests(true);
        const response = await testManagementAPI.getTests({ status: 'active' });
        if (response.success) {
          // Handle paginated response or direct array
          const testsData = response.data?.data || response.data || [];
          setAvailableTests(testsData);
        } else {
          console.error('Failed to load tests:', response.message);
          setAvailableTests([]);
        }
      } catch (error) {
        console.error("Failed to load available tests:", error);
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          console.error('Authentication required for test management');
        }
        setAvailableTests([]);
      } finally {
        setLoadingTests(false);
      }
    };

    loadAvailableTests();
  }, []);

  // Handle existing test selection
  const handleTestSelection = (test) => {
    setSelectedTest(test);
  };

  const handleCandidateToggle = (candidateId) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAllCandidates = () => {
    const allCandidateIds = vacancy.selectedCandidates?.map(
      (app) => app.candidate_id
    ) || [];
    if (selectedCandidates.length === allCandidateIds.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(allCandidateIds);
    }
  };

  const handleSendTestInvitations = async () => {
    if (selectedCandidates.length === 0) {
      setError("Please select at least one candidate");
      return;
    }

    if (!selectedTest) {
      setError("Please select a test to send to candidates");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const payload = {
        recruitment_request_id: vacancy.id,
        candidate_ids: selectedCandidates,
        existing_test_id: selectedTest.id,
      };

      const response = await currentVacanciesAPI.sendTestInvitations(payload);

      if (response.success) {
        setSuccess(
          `Successfully sent ${response.data.sent_count} test invitations`
        );
        setTimeout(() => {
          onInvitationSent();
        }, 2000);
      } else {
        throw new Error(response.message || "Failed to send test invitations");
      }
    } catch (error) {
      console.error("Error sending test invitations:", error);
      setError(error.message || "Failed to send test invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInterviewInvitations = async () => {
    if (selectedCandidates.length === 0) {
      setError("Please select at least one candidate");
      return;
    }

    if (!invitationData.interview_date || !invitationData.interview_time) {
      setError("Please provide interview date and time");
      return;
    }

    if (invitationData.interview_type !== "phone" && !invitationData.location) {
      setError("Please provide interview location or meeting link");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const payload = {
        recruitment_request_id: vacancy.id,
        candidate_ids: selectedCandidates,
        interview_date: invitationData.interview_date,
        interview_time: invitationData.interview_time,
        interview_type: invitationData.interview_type,
        location: invitationData.location,
        message: invitationData.message,
      };

      const response = await currentVacanciesAPI.sendInterviewInvitations(payload);

      if (response.success) {
        setSuccess(
          `Successfully sent ${response.data.sent_count} interview invitations`
        );
        setTimeout(() => {
          onInvitationSent();
        }, 2000);
      } else {
        throw new Error(response.message || "Failed to send interview invitations");
      }
    } catch (error) {
      console.error("Error sending interview invitations:", error);
      setError(error.message || "Failed to send interview invitations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Send Invitations - {vacancy.job_title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-100px)]">
          {/* Candidate Selection */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Candidates
            </h3>
            
            <div className="mb-4">
              <button
                onClick={handleSelectAllCandidates}
                className="text-sm text-blue-600 hover:text-blue-800 mb-3"
              >
                {selectedCandidates.length === (vacancy.selectedCandidates?.length || 0)
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <div className="text-sm text-gray-500 mb-3">
                {selectedCandidates.length} of {vacancy.selectedCandidates?.length || 0} candidates selected
              </div>
            </div>

            <div className="space-y-3">
              {vacancy.selectedCandidates?.map((application) => (
                <div
                  key={application.candidate_id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedCandidates.includes(application.candidate_id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleCandidateToggle(application.candidate_id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(application.candidate_id)}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {application.candidate_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.candidate_email}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invitation Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveInviteTab("interview")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeInviteTab === "interview"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    Interview Invite
                  </div>
                </button>
                <button
                  onClick={() => setActiveInviteTab("test")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeInviteTab === "test"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} />
                    Test Invite
                  </div>
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Interview Invitation Tab */}
              {activeInviteTab === "interview" && (
                <div className="space-y-6">
                  {/* Interview Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Interview Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {interviewTypes.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <label
                            key={type.value}
                            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                              invitationData.interview_type === type.value
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="interview_type"
                              value={type.value}
                              checked={invitationData.interview_type === type.value}
                              onChange={(e) =>
                                handleInputChange("interview_type", e.target.value)
                              }
                              className="sr-only"
                            />
                            <IconComponent size={20} className="text-gray-500" />
                            <span className="font-medium text-gray-900">{type.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar size={16} className="inline mr-1" />
                        Interview Date
                      </label>
                      <input
                        type="date"
                        value={invitationData.interview_date}
                        onChange={(e) =>
                          handleInputChange("interview_date", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock size={16} className="inline mr-1" />
                        Interview Time
                      </label>
                      <input
                        type="time"
                        value={invitationData.interview_time}
                        onChange={(e) =>
                          handleInputChange("interview_time", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Location/Meeting Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      {invitationData.interview_type === "virtual"
                        ? "Meeting Link"
                        : invitationData.interview_type === "phone"
                        ? "Phone Details"
                        : "Interview Location"}
                    </label>
                    <input
                      type="text"
                      value={invitationData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder={
                        invitationData.interview_type === "virtual"
                          ? "https://meet.google.com/... or Zoom link"
                          : invitationData.interview_type === "phone"
                          ? "Phone number will be provided"
                          : "Enter interview location"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Custom Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail size={16} className="inline mr-1" />
                      Interview Invitation Message
                    </label>
                    <textarea
                      value={invitationData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendInterviewInvitations}
                    disabled={loading || selectedCandidates.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send size={18} />
                    )}
                    Send Interview Invitations ({selectedCandidates.length})
                  </button>
                </div>
              )}

              {/* Test Invitation Tab */}
              {activeInviteTab === "test" && (
                <div className="space-y-6">
                  {/* Test Selection */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Select Test to Send
                    </h4>

                    {/* Test Selection */}
                    {loadingTests ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading tests...</p>
                      </div>
                    ) : availableTests.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableTests.map((test) => (
                          <div
                            key={test.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedTest?.id === test.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => handleTestSelection(test)}
                          >
                            <div className="font-medium text-gray-900">{test.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {test.question_count} questions • {test.time_limit} minutes
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                              Pass Score: {test.pass_score}%
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <BookOpen size={40} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600 mb-2">No tests available</p>
                        <p className="text-sm text-gray-500">
                          Please create tests first in the Test Management section
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendTestInvitations}
                    disabled={loading || selectedCandidates.length === 0 || !selectedTest}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send size={18} />
                    )}
                    Send Test Invitations ({selectedCandidates.length})
                  </button>
                </div>
              )}

              {/* Status Messages */}
              {error && (
                <div className="mt-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-600" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {success && (
                <div className="mt-4 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 size={20} className="text-green-600" />
                  <span className="text-green-700">{success}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
