// app/dashboard/candidate/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function CandidatePage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      // Create mock profile data
      const mockProfile = {
        candidate_id: user.id,
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
        phone_primary: "+234801234567",
        address_current: "123 Lagos Street, Ikeja",
        blood_group: "O+",
      };

      setCandidateProfile(mockProfile);

      // Calculate completion
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
        (field) =>
          mockProfile[field] && mockProfile[field].toString().trim() !== ""
      ).length;

      const completion = Math.round(
        (completedFields / requiredFields.length) * 100
      );
      setProfileCompletion(completion);
    }
  }, [user, loading, isAuthenticated, router]);

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

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  const navigationItems = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "profile", name: "Personal Info", icon: "👤" },
    { id: "education", name: "Education", icon: "🎓" },
    { id: "experience", name: "Experience", icon: "💼" },
    { id: "emergency", name: "Emergency Contacts", icon: "📞" },
    { id: "documents", name: "Documents", icon: "📄" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white mr-3 bg-indigo-600">
                👤
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
                  {user?.username || "Complete your profile"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                🚪 Logout
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
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                      activeSection === item.id
                        ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
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
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-blue-800">
                        📋 Application Status
                      </span>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      Profile Setup
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveSection("profile")}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                      👤
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
                      🎓
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
                      💼
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
                        Phone Number
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {candidateProfile.phone_primary || "Not provided"}
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
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            {["education", "experience", "emergency", "documents"].map(
              (section) =>
                activeSection === section && (
                  <div key={section} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </h2>
                      <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                        Add {section.charAt(0).toUpperCase() + section.slice(1)}
                      </button>
                    </div>

                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">
                        {section === "education" && "🎓"}
                        {section === "experience" && "💼"}
                        {section === "emergency" && "📞"}
                        {section === "documents" && "📄"}
                      </div>
                      <p className="text-lg mb-2">No {section} records</p>
                      <p className="text-sm">
                        Add your {section} information to complete your profile.
                      </p>
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
