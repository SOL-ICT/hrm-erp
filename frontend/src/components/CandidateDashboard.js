"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

const CandidateDashboard = () => {
  const { user, logout, getUserPreferences } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [candidateEducation, setCandidateEducation] = useState([]);
  const [candidateExperience, setCandidateExperience] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [profileCompletion, setProfileCompletion] = useState(0);

  const preferences = getUserPreferences();

  useEffect(() => {
    fetchCandidateData();
  }, []);

  const fetchCandidateData = async () => {
    try {
      // Fetch dashboard data
      const dashboardResponse = await fetch(
        "http://localhost:8000/api/dashboard/candidate",
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json();
        setDashboardData(data);
      }

      // You'll need to create these API endpoints for the candidate data
      // For now, we'll use mock data structure matching your database

      // Mock candidate profile data matching your database structure
      const mockProfile = {
        candidate_id: user?.user_id || 1,
        first_name: "John",
        middle_name: "Michael",
        last_name: "Doe",
        formal_name: "Mr. John Michael Doe",
        gender: "Male",
        date_of_birth: "1990-05-15",
        marital_status: "Single",
        nationality: "Nigerian",
        state_of_origin: "Lagos",
        local_government: "Ikeja",
        national_id_no: "",
        phone_primary: "+234801234567",
        phone_secondary: "",
        address_current: "123 Lagos Street, Ikeja",
        address_permanent: "123 Lagos Street, Ikeja",
        profile_picture: null,
        blood_group: "O+",
      };

      setCandidateProfile(mockProfile);
      calculateProfileCompletion(mockProfile);
    } catch (error) {
      console.error("Failed to fetch candidate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile) => {
    if (!profile) return;

    const requiredFields = [
      "first_name",
      "last_name",
      "gender",
      "date_of_birth",
      "marital_status",
      "nationality",
      "state_of_origin",
      "local_government",
      "phone_primary",
      "address_current",
      "blood_group",
    ];

    const completedFields = requiredFields.filter(
      (field) => profile[field] && profile[field].toString().trim() !== ""
    ).length;

    const completion = Math.round(
      (completedFields / requiredFields.length) * 100
    );
    setProfileCompletion(completion);
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const applicationStatus =
    dashboardData?.application_status || "Profile Setup";
  const nextSteps = dashboardData?.next_steps || [
    "Complete personal information",
    "Add education details",
    "Upload required documents",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white mr-3"
                style={{ backgroundColor: preferences.primary_color }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Candidate Portal
                </h1>
                <p className="text-sm text-gray-500">
                  Strategic Outsourcing Limited
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Welcome, {candidateProfile?.first_name || "Candidate"}
                </p>
                <p className="text-xs text-gray-500">
                  {candidateProfile?.formal_name || "Complete your profile"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow p-4">
              <div className="space-y-2">
                {[
                  {
                    id: "overview",
                    name: "Overview",
                    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
                  },
                  {
                    id: "profile",
                    name: "Personal Info",
                    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                  },
                  {
                    id: "education",
                    name: "Education",
                    icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
                  },
                  {
                    id: "experience",
                    name: "Experience",
                    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2V6",
                  },
                  {
                    id: "emergency",
                    name: "Emergency Contacts",
                    icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                  },
                  {
                    id: "documents",
                    name: "Documents",
                    icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L16.414 6.293A1 1 0 0016 6H4a2 2 0 00-2 2v11a2 2 0 002 2z",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                      activeSection === item.id
                        ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <svg
                      className="h-4 w-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={item.icon}
                      />
                    </svg>
                    {item.name}
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === "overview" && (
              <div className="space-y-6">
                {/* Welcome Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Welcome, {candidateProfile?.first_name || "Candidate"}!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Complete your candidate profile to enhance your application
                    with Strategic Outsourcing Limited.
                  </p>

                  {/* Profile Completion */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Profile Completion
                      </span>
                      <span className="text-sm text-gray-500">
                        {profileCompletion}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${profileCompletion}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {profileCompletion >= 80
                        ? "Excellent! Your profile is almost complete."
                        : profileCompletion >= 50
                        ? "Good progress! Add more details to improve your profile."
                        : "Get started by completing your basic information."}
                    </p>
                  </div>

                  {/* Application Status */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-6">
                    <div className="flex items-center">
                      <svg
                        className="h-5 w-5 text-blue-600 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-blue-800">
                        Application Status
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        applicationStatus === "In Review"
                          ? "bg-yellow-100 text-yellow-800"
                          : applicationStatus === "Approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {applicationStatus}
                    </span>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recommended Next Steps
                  </h3>
                  <div className="space-y-3">
                    {nextSteps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-200"
                      >
                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-semibold text-amber-600">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-amber-800">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveSection("profile")}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                      <svg
                        className="h-5 w-5 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">Personal Info</h4>
                    <p className="text-sm text-gray-600">
                      Complete basic details
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveSection("education")}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">Education</h4>
                    <p className="text-sm text-gray-600">
                      Add your qualifications
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveSection("experience")}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                      <svg
                        className="h-5 w-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2V6"
                        />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900">Experience</h4>
                    <p className="text-sm text-gray-600">Add work history</p>
                  </button>
                </div>
              </div>
            )}

            {activeSection === "profile" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Personal Information
                </h2>

                {candidateProfile && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.first_name || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.last_name || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Middle Name
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.middle_name || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.gender || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.date_of_birth || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nationality
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.nationality || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State of Origin
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.state_of_origin || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Local Government
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.local_government || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Phone
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.phone_primary || "Not provided"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Blood Group
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.blood_group || "Not provided"}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Address
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.address_current || "Not provided"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    style={{ backgroundColor: preferences.primary_color }}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            {activeSection === "education" && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Education History
                  </h2>
                  <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    style={{ backgroundColor: preferences.primary_color }}
                  >
                    Add Education
                  </button>
                </div>

                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="h-16 w-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                  </svg>
                  <p className="text-lg mb-2">No Education Records</p>
                  <p className="text-sm">
                    Add your educational qualifications to complete your
                    profile.
                  </p>
                </div>
              </div>
            )}

            {activeSection === "experience" && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Work Experience
                  </h2>
                  <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    style={{ backgroundColor: preferences.primary_color }}
                  >
                    Add Experience
                  </button>
                </div>

                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="h-16 w-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2V6"
                    />
                  </svg>
                  <p className="text-lg mb-2">No Work Experience</p>
                  <p className="text-sm">
                    Add your work history to showcase your professional
                    background.
                  </p>
                </div>
              </div>
            )}

            {activeSection === "emergency" && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Emergency Contacts
                  </h2>
                  <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    style={{ backgroundColor: preferences.primary_color }}
                  >
                    Add Contact
                  </button>
                </div>

                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="h-16 w-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <p className="text-lg mb-2">No Emergency Contacts</p>
                  <p className="text-sm">
                    Add emergency contact information for safety purposes.
                  </p>
                </div>
              </div>
            )}

            {activeSection === "documents" && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Documents
                  </h2>
                  <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    style={{ backgroundColor: preferences.primary_color }}
                  >
                    Upload Document
                  </button>
                </div>

                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="h-16 w-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L16.414 6.293A1 1 0 0016 6H4a2 2 0 00-2 2v11a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-lg mb-2">No Documents Uploaded</p>
                  <p className="text-sm">
                    Upload your CV, certificates, and other required documents.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
