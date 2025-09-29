"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ProfileEdit from "./ProfileEdit";
//import EducationModal from "./EducationModal";
import ExperienceModal from "./ExperienceModal";
import EmergencyContactModal from "./EmergencyContactModal";
import NextOfKin from "./NextofKin";
import FamilyContact from "./FamilyContact";
import EmergencyContact from "./EmergencyContact";
//import EducationItem from "./EducationItem";
import EducationSection from "./EducationSection";
import SecondaryEducation from "./SecondaryEducation";
import TertiaryEducation from "./TertiaryEducation";
import ApplyForPosition from "./ApplyForPosition";
import TestCenter from "./TestCenter";
import InterviewManager from "./InterviewManager";
import AcceptOfferSection from "./AcceptOfferSection";
//import PrimaryEducationForm from './PrimaryEducationForm';
//import SecondaryEducationForm from './SecondaryEducationForm';
//import TertiaryEducationForm from './TertiaryEducationForm';
//import ReactModal from 'react-modal'; not working in nextjs
//import Modal from "../common/Modal.jsx";

// Inline Modal component (temporary)
const InlineModal = ({ children, onClose }) => {
  React.useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

// Accept Offer Section Component
const CandidateDashboard = () => {
  const {
    user,
    loading,
    isAuthenticated,
    logout,
    getUserPreferences,
    sanctumRequest,
  } = useAuth();

  const [activeSection, setActiveSection] = useState("overview");
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState({
    applications: 0,
    interviews: 0,
    offers: 0,
    profileViews: 0,
  });
  const [candidateEducation, setCandidateEducation] = useState([]);

  // TODO: Implement primary education save handler when PrimaryEducationForm is created
  // const handlePrimarySave = (values) => {
  //   console.log("Primary form submitted:", values);
  //   // TODO: here you could POST to your API or merge into state
  //   // then close the modal:
  //   setEducationModal({
  //     isOpen: false,
  //     formType: null,
  //     editingEducation: null,
  //   });
  // };

  // console.log("🔖 isEduModalOpen =", isEduModalOpen);
  const [candidateExperience, setCandidateExperience] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  // const [statesLgas, setStatesLgas] = useState([]); // TODO: Remove if not used in render
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [educationModal, setEducationModal] = useState({
    isOpen: false,
    formtype: null, // 'primary', 'secondary' or 'tertiary'
    editingEducation: null,
  });
  const [experienceModal, setExperienceModal] = useState({
    isOpen: false,
    editingExperience: null,
  });
  const [contactModal, setContactModal] = useState({
    isOpen: false,
    editingContact: null,
  });

  const router = useRouter();

  // Get user preferences from login
  const preferences = getUserPreferences() || {
    theme: "dark",
    primaryColor: "#6366f1",
    language: "en",
  };

  // Theme configurations matching login page
  const themes = {
    light: {
      bg: "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50",
      cardBg: "bg-white/95",
      sidebarBg: "bg-white/90",
      headerBg: "bg-white/95",
      textPrimary: "text-gray-900",
      textSecondary: "text-gray-600",
      textMuted: "text-gray-500",
      border: "border-gray-200",
      hover: "hover:bg-gray-50",
    },
    dark: {
      bg: "bg-gradient-to-br from-slate-900 via-gray-900 to-black",
      cardBg: "bg-slate-800/95",
      sidebarBg: "bg-slate-800/90",
      headerBg: "bg-slate-800/95",
      textPrimary: "text-white",
      textSecondary: "text-gray-300",
      textMuted: "text-gray-400",
      border: "border-gray-700",
      hover: "hover:bg-slate-700/50",
    },
    transparent: {
      bg: "bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-slate-900/80",
      cardBg: "bg-white/10 backdrop-blur-md",
      sidebarBg: "bg-white/10 backdrop-blur-md",
      headerBg: "bg-white/10 backdrop-blur-md",
      textPrimary: "text-white",
      textSecondary: "text-white/80",
      textMuted: "text-white/60",
      border: "border-white/20",
      hover: "hover:bg-white/20",
    },
  };

  const currentTheme = themes[preferences.theme] || themes.dark;

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // Only fetch data if user is authenticated and we have a valid user object
    if (user && isAuthenticated && !loading) {
      console.log("🚀 Fetching candidate data for user:", user);
      fetchAllCandidateData();
    }
  }, [user, loading, isAuthenticated, router]);

  const fetchAllCandidateData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchCandidateProfile(),
        fetchCandidateEducation(),
        fetchCandidateExperience(),
        fetchEmergencyContacts(),
        fetchStatesLgas(),
        fetchDashboardStats(),
      ]);
    } catch (error) {
      console.error("Failed to fetch candidate data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCandidateProfile = async () => {
    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/profile`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCandidateProfile(data.profile);
        calculateProfileCompletion(data.profile);
      } else {
        // Default profile structure
        const defaultProfile = {
          candidate_id: user.id,
          first_name: "",
          middle_name: "",
          last_name: "",
          formal_name: "",
          gender: "",
          date_of_birth: "",
          marital_status: "",
          nationality: "Nigeria",
          state_of_origin: "",
          local_government: "",
          phone_primary: "",
          address_current: "",
          address_permanent: "",
          // blood_group: "",
          position: "Candidate",
          department: "Human Resources",
          employee_id: `CAND${user.id}`,
        };
        setCandidateProfile(defaultProfile);
        calculateProfileCompletion(defaultProfile);
      }
    } catch (error) {
      console.error("Failed to fetch candidate profile:", error);
    }
  };

  const fetchCandidateEducation = async () => {
    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/education`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Education data received:", data);
        setCandidateEducation(data.education || []);
      } else {
        console.error(
          "❌ Education fetch failed:",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error fetching education:", error);
      setCandidateEducation([]);
    }
  };

  const fetchCandidateExperience = async () => {
    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/experience`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCandidateExperience(data.data || []);
      }
    } catch {
      setCandidateExperience([]);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/emergency-contacts`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setEmergencyContacts(data.contacts || []);
      }
    } catch {
      setEmergencyContacts([]);
    }
  };

  const fetchStatesLgas = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/states-lgas", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        // const data = await response.json(); // TODO: Remove if not using states/LGAs
        // setStatesLgas(data.states_lgas || []);
      }
    } catch {
      // setStatesLgas([]);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/dashboard-stats`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(
          data.stats || {
            applications: 0,
            interviews: 0,
            offers: 0,
            profileViews: 0,
          }
        );
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
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
      "full_current_address",
      "full_permanent_address",
      //"blood_group",
    ];

    const completedFields = requiredFields.filter(
      (field) => profile[field] && profile[field].toString().trim() !== ""
    ).length;

    const completion = Math.round(
      (completedFields / requiredFields.length) * 100
    );
    setProfileCompletion(completion);
  };

  const handleProfileSave = async (updatedProfile) => {
    console.log("Saving profile...");
    console.log("User object:", user);
    console.log("Updated profile data:", updatedProfile);

    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/profile`,
        {
          method: "PUT",
          body: JSON.stringify(updatedProfile),
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Profile save successful:", data);
        setCandidateProfile(data.profile);
        calculateProfileCompletion(data.profile);
        setIsEditingProfile(false);
      } else {
        console.error("❌ Failed response:", response.status);
        // Get the error details
        const errorText = await response.text();
        console.error("❌ Error details:", errorText);
        alert(`Failed to save profile: ${errorText}`);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert(`Error saving profile: ${error.message}`);
    }
  };

  // TODO: Implement education save handler when EducationModal is restored
  // const handleEducationSave = (newEducation) => {
  //   setCandidateEducation((prev) => {
  //     if (educationModal.editingEducation) {
  //       return prev.map((edu) =>
  //         edu.id === educationModal.editingEducation.id ? newEducation : edu
  //       );
  //     } else {
  //       return [newEducation, ...prev];
  //     }
  //   });
  //   setEducationModal({ isOpen: false, editingEducation: null });
  // };

  const handleExperienceSave = (newExperience) => {
    setCandidateExperience((prev) => {
      if (experienceModal.editingExperience) {
        return prev.map((exp) =>
          exp.id === experienceModal.editingExperience.id ? newExperience : exp
        );
      } else {
        return [newExperience, ...prev];
      }
    });
    setExperienceModal({ isOpen: false, editingExperience: null });
  };

  const handleContactSave = (newContact) => {
    setEmergencyContacts((prev) => {
      if (contactModal.editingContact) {
        return prev.map((contact) =>
          contact.id === contactModal.editingContact.id ? newContact : contact
        );
      } else {
        return [newContact, ...prev];
      }
    });
    setContactModal({ isOpen: false, editingContact: null });
  };

  const handleLogout = () => {
    logout();
  };

  // you mean here ??

  if (loading || isLoading) {
    return (
      <div
        className={`min-h-screen ${currentTheme.bg} flex items-center justify-center`}
      >
        <div
          className={`text-center ${currentTheme.cardBg} backdrop-blur-md rounded-3xl p-12 border ${currentTheme.border} shadow-2xl`}
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2`}>
            Loading Dashboard
          </h3>
          <p className={currentTheme.textSecondary}>
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  // 3 constants for 3 types of contacts

  const emergencyOnly = emergencyContacts.filter(
    (c) => c.contact_type === "Emergency Contact"
  );
  const nextOfKinOnly = emergencyContacts.filter(
    (c) => c.contact_type === "Next of Kin"
  );
  const familyOnly = emergencyContacts.filter(
    (c) => c.contact_type === "Family Contact"
  );

  if (!isAuthenticated) {
    return null;
  }

  const navigationItems = [
    { id: "overview", name: "Dashboard", icon: "🏠", section: "MAIN" },
    { id: "profile", name: "Profile", icon: "👤", section: "MAIN" },
    {
      id: "education",
      name: "Education",
      icon: "🎓",
      section: "MAIN",
      count: candidateEducation.length,
    },
    {
      id: "experience",
      name: "Experience",
      icon: "💼",
      section: "MAIN",
      count: candidateExperience.length,
    },
    {
      id: "emergency",
      name: "Emergency Contacts",
      icon: "📞",
      section: "MAIN",
      count: emergencyContacts.length,
    },
    {
      id: "apply-position",
      name: "Apply for Position",
      icon: "📝",
      section: "MAIN",
    },
    {
      id: "test-center",
      name: "Test Center",
      icon: "📊",
      section: "MAIN",
    },
    {
      id: "interviews",
      name: "Interviews",
      icon: "🎯",
      section: "MAIN",
      count: dashboardStats.interviews,
    },

    {
      id: "applications",
      name: "Accept Offer",
      icon: "📋",
      section: "MAIN",
      count: dashboardStats.applications,
    },

    { id: "documents", name: "Documents", icon: "📄", section: "TOOLS" },
    { id: "calendar", name: "Calendar", icon: "📅", section: "TOOLS" },
    {
      id: "messages",
      name: "Messages",
      icon: "💬",
      section: "TOOLS",
      count: 3,
    },
    { id: "settings", name: "Settings", icon: "⚙️", section: "TOOLS" },
  ];

  return (
    <div className={`min-h-screen ${currentTheme.bg}`}>
      {/* Decorative Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${
              preferences.primaryColor?.replace("#", "") || "6366f1"
            }' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Top Navigation Header */}
      <header
        className={`${currentTheme.headerBg} backdrop-blur-md border-b ${currentTheme.border} shadow-xl relative z-10`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <div className="flex items-center space-x-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${
                    preferences.primaryColor || "#6366f1"
                  }, ${preferences.primaryColor || "#6366f1"}dd)`,
                }}
              >
                <span className="font-bold text-lg">S</span>
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${currentTheme.textPrimary}`}
                >
                  Strategic Outsourcing
                </h1>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Human Resource Management System
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search applications, documents, or contacts..."
                  className={`w-full ${currentTheme.cardBg} ${currentTheme.border} rounded-xl px-4 py-3 pl-12 ${currentTheme.textPrimary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm`}
                />
                <svg
                  className={`w-5 h-5 ${currentTheme.textMuted} absolute left-4 top-4`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Date & Time */}
              <div
                className={`text-right px-4 py-2 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} backdrop-blur-sm`}
              >
                <p
                  className={`text-sm font-medium ${currentTheme.textPrimary}`}
                >
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className={`text-xs ${currentTheme.textMuted}`}>
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Notifications */}
              <button
                className={`relative p-3 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} ${currentTheme.hover} transition-all backdrop-blur-sm`}
              >
                <svg
                  className={`w-6 h-6 ${currentTheme.textSecondary}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                  />
                </svg>
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs text-white flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: preferences.primaryColor || "#6366f1",
                  }}
                >
                  3
                </span>
              </button>

              {/* User Profile */}
              <div
                className={`flex items-center space-x-3 px-4 py-2 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} backdrop-blur-sm`}
              >
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${currentTheme.textPrimary}`}
                  >
                    {candidateProfile?.first_name} {candidateProfile?.last_name}
                  </p>
                  <p className={`text-xs ${currentTheme.textMuted}`}>
                    {candidateProfile?.position || "Candidate"}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${
                      preferences.primaryColor || "#6366f1"
                    }, ${preferences.primaryColor || "#6366f1"}dd)`,
                  }}
                >
                  {candidateProfile?.first_name?.[0] || "C"}
                  {candidateProfile?.last_name?.[0] || ""}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`p-3 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} ${currentTheme.hover} transition-all backdrop-blur-sm group`}
              >
                <svg
                  className={`w-6 h-6 ${currentTheme.textMuted} group-hover:text-red-500 transition-colors`}
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
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Professional Sidebar */}
        <aside
          className={`w-72 ${currentTheme.sidebarBg} backdrop-blur-md border-r ${currentTheme.border} min-h-screen sticky top-0 shadow-xl`}
        >
          {/* User Profile Section */}
          <div className={`p-6 border-b ${currentTheme.border}`}>
            <div className="flex items-center space-x-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${
                    preferences.primaryColor || "#6366f1"
                  }, ${preferences.primaryColor || "#6366f1"}cc)`,
                }}
              >
                {candidateProfile?.first_name?.[0] || "C"}
                {candidateProfile?.last_name?.[0] || ""}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${currentTheme.textPrimary}`}>
                  {candidateProfile?.first_name} {candidateProfile?.last_name}
                </h3>
                <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>
                  {candidateProfile?.position || "Candidate"}
                </p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-500 text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div
                className={`text-center p-3 ${currentTheme.cardBg} rounded-xl ${currentTheme.border}`}
              >
                <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                  {profileCompletion}%
                </p>
                <p className={`text-xs ${currentTheme.textMuted}`}>Profile</p>
              </div>
              <div
                className={`text-center p-3 ${currentTheme.cardBg} rounded-xl ${currentTheme.border}`}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: preferences.primaryColor || "#6366f1" }}
                >
                  {dashboardStats.applications}
                </p>
                <p className={`text-xs ${currentTheme.textMuted}`}>Applied</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4">
            {/* Main Section */}
            <div className="mb-6">
              <p
                className={`text-xs font-bold uppercase tracking-wider ${currentTheme.textMuted} mb-4 px-2`}
              >
                MAIN MENU
              </p>
              <div className="space-y-1">
                {navigationItems
                  .filter((item) => item.section === "MAIN")
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        activeSection === item.id
                          ? "text-white shadow-lg"
                          : `${currentTheme.textSecondary} ${currentTheme.hover}`
                      }`}
                      style={
                        activeSection === item.id
                          ? {
                              background: `linear-gradient(135deg, ${
                                preferences.primaryColor || "#6366f1"
                              }, ${preferences.primaryColor || "#6366f1"}dd)`,
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {item.count !== undefined && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-bold ${
                            activeSection === item.id
                              ? "bg-white/20 text-white"
                              : "bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* Tools Section */}
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-wider ${currentTheme.textMuted} mb-4 px-2`}
              >
                TOOLS
              </p>
              <div className="space-y-1">
                {navigationItems
                  .filter((item) => item.section === "TOOLS")
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        activeSection === item.id
                          ? "text-white shadow-lg"
                          : `${currentTheme.textSecondary} ${currentTheme.hover}`
                      }`}
                      style={
                        activeSection === item.id
                          ? {
                              background: `linear-gradient(135deg, ${
                                preferences.primaryColor || "#6366f1"
                              }, ${preferences.primaryColor || "#6366f1"}dd)`,
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {item.count && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-bold ${
                            activeSection === item.id
                              ? "bg-white/20 text-white"
                              : "bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {activeSection === "overview" && (
            <div className="space-y-8">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${currentTheme.textPrimary} mb-2`}
                  >
                    Welcome back, {candidateProfile?.first_name || "Candidate"}!
                    👋
                  </h1>
                  <p className={`text-xl ${currentTheme.textSecondary}`}>
                    Here&apos;s your application overview and recent activity.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveSection("apply-position")}
                    className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${
                        preferences.primaryColor || "#6366f1"
                      }, ${preferences.primaryColor || "#6366f1"}dd)`,
                    }}
                  >
                    Apply for Position
                  </button>
                  <button
                    onClick={() => setActiveSection("test-center")}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    Test Center
                  </button>
                  <button
                    onClick={() => setActiveSection("interviews")}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    Interviews
                  </button>
                  <button
                    onClick={() => setActiveSection("profile")}
                    className={`px-6 py-3 ${currentTheme.cardBg} ${currentTheme.textPrimary} ${currentTheme.border} rounded-xl font-semibold ${currentTheme.hover} transition-all`}
                  >
                    Update Profile
                  </button>
                </div>
              </div>

              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: "Total Applications",
                    value: dashboardStats.applications,
                    change: "+0 this week",
                    trend: "up",
                    icon: "📋",
                    color: "blue",
                  },
                  {
                    title: "Interviews Scheduled",
                    value: dashboardStats.interviews,
                    change: "+0 this week",
                    trend: "up",
                    icon: "🎯",
                    color: "green",
                  },
                  {
                    title: "Offers Received",
                    value: dashboardStats.offers,
                    change: "+0 this week",
                    trend: "up",
                    icon: "🏆",
                    color: "purple",
                  },
                  {
                    title: "Profile Views",
                    value: dashboardStats.profileViews,
                    change: "+0 this week",
                    trend: "up",
                    icon: "👁️",
                    color: "orange",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className={`${currentTheme.cardBg} backdrop-blur-md rounded-2xl p-6 ${currentTheme.border} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${
                            stat.color === "blue"
                              ? "#3b82f6"
                              : stat.color === "green"
                              ? "#10b981"
                              : stat.color === "purple"
                              ? "#8b5cf6"
                              : "#f59e0b"
                          }, ${
                            stat.color === "blue"
                              ? "#1d4ed8"
                              : stat.color === "green"
                              ? "#047857"
                              : stat.color === "purple"
                              ? "#7c3aed"
                              : "#d97706"
                          })`,
                        }}
                      >
                        {stat.icon}
                      </div>
                      <div className="text-right">
                        <p
                          className={`${currentTheme.textMuted} text-sm font-medium`}
                        >
                          {stat.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p
                          className={`text-3xl font-bold ${currentTheme.textPrimary} mb-1`}
                        >
                          {stat.value}
                        </p>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 text-green-500 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-green-500 text-sm font-medium">
                            {stat.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Profile Completion Card */}
              <div
                className={`${currentTheme.cardBg} backdrop-blur-md rounded-2xl p-8 ${currentTheme.border} shadow-xl`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className={`text-2xl font-bold ${currentTheme.textPrimary}`}
                  >
                    Profile Completion
                  </h3>
                  <div className="text-right">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: preferences.primaryColor || "#6366f1" }}
                    >
                      {profileCompletion}%
                    </span>
                    <p className={`text-sm ${currentTheme.textMuted}`}>
                      Complete
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="w-full bg-gray-700/30 rounded-full h-4 mb-4 overflow-hidden">
                    <div
                      className="h-4 rounded-full transition-all duration-1000 shadow-lg relative overflow-hidden"
                      style={{
                        width: `${profileCompletion}%`,
                        background: `linear-gradient(90deg, ${
                          preferences.primaryColor || "#6366f1"
                        }, ${preferences.primaryColor || "#6366f1"}dd)`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setActiveSection("profile")}
                    className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${
                        preferences.primaryColor || "#6366f1"
                      }, ${preferences.primaryColor || "#6366f1"}dd)`,
                    }}
                  >
                    Complete Your Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Section */}
          {activeSection === "profile" && (
            <div className="space-y-8">
              {isEditingProfile ? (
                <ProfileEdit
                  candidateProfile={candidateProfile} // ✅ Fixed: using correct variable name
                  onSave={handleProfileSave} // ✅ Fixed: using correct function name
                  onCancel={() => setIsEditingProfile(false)} // ✅ Fixed: using correct function
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1
                        className={`text-4xl font-bold ${currentTheme.textPrimary} mb-2`}
                      >
                        Profile Information
                      </h1>
                      <p className={`text-xl ${currentTheme.textSecondary}`}>
                        Manage your personal information and professional
                        details
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${
                          preferences.primaryColor || "#6366f1"
                        }, ${preferences.primaryColor || "#6366f1"}dd)`,
                      }}
                    >
                      Edit Profile
                    </button>
                  </div>

                  {candidateProfile && (
                    <div
                      className={`${currentTheme.cardBg} backdrop-blur-md rounded-2xl p-8 ${currentTheme.border} shadow-xl`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                          {
                            label: "Full Name",
                            value: `${candidateProfile.first_name || ""} ${
                              candidateProfile.middle_name || ""
                            } ${candidateProfile.last_name || ""}`.trim(),
                            icon: "👤",
                          },
                          {
                            label: "Employee ID",
                            value: candidateProfile.employee_id,
                            icon: "🏷️",
                          },
                          {
                            label: "Position",
                            value: candidateProfile.position,
                            icon: "💼",
                          },
                          {
                            label: "Department",
                            value: candidateProfile.department,
                            icon: "🏢",
                          },
                          {
                            label: "Gender",
                            value: candidateProfile.gender,
                            icon: "⚡",
                          },
                          {
                            label: "Date of Birth",
                            value: candidateProfile.date_of_birth,
                            icon: "📅",
                          },
                          {
                            label: "Marital Status",
                            value: candidateProfile.marital_status,
                            icon: "💑",
                          },
                          {
                            label: "Nationality",
                            value: candidateProfile.nationality,
                            icon: "🌍",
                          },
                          {
                            label: "State of Origin",
                            value: candidateProfile.state_of_origin,
                            icon: "📍",
                          },
                          {
                            label: "Local Government",
                            value: candidateProfile.local_government,
                            icon: "🏛️",
                          },
                          {
                            label: "Phone Number",
                            value: candidateProfile.phone_primary,
                            icon: "📱",
                          },
                          {
                            label: "Secondary Phone Number",
                            value: candidateProfile.phone_secondary,
                          },
                        ].map((field, index) => (
                          <div
                            key={index}
                            className={`${currentTheme.cardBg} rounded-xl p-5 ${currentTheme.border} hover:shadow-md transition-all group`}
                          >
                            <div className="flex items-center mb-3">
                              <span className="text-xl mr-3">{field.icon}</span>
                              <label
                                className={`text-xs font-bold uppercase tracking-wide ${currentTheme.textMuted}`}
                              >
                                {field.label}
                              </label>
                            </div>
                            <p
                              className={`text-lg font-semibold ${currentTheme.textPrimary} transition-colors`}
                            >
                              {field.value || (
                                <span
                                  className={`${currentTheme.textMuted} italic text-sm`}
                                >
                                  Not provided
                                </span>
                              )}
                            </p>
                          </div>
                        ))}

                        <div
                          className={`md:col-span-2 lg:col-span-3 ${currentTheme.cardBg} rounded-xl p-5 ${currentTheme.border} hover:shadow-md transition-all group`}
                        >
                          <div className="flex items-center mb-3">
                            <span className="text-xl mr-3">🏠</span>
                            <label
                              className={`text-xs font-bold uppercase tracking-wide ${currentTheme.textMuted}`}
                            >
                              Current Address
                            </label>
                          </div>
                          <p
                            className={`text-lg font-semibold ${currentTheme.textPrimary} transition-colors`}
                          >
                            {candidateProfile.full_current_address || (
                              <span
                                className={`${currentTheme.textMuted} italic text-sm`}
                              >
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>

                        <div
                          className={`md:col-span-3 lg:col-span-3 ${currentTheme.cardBg} rounded-xl p-5 ${currentTheme.border} hover:shadow-md transition-all group`}
                        >
                          <div className="flex items-center mb-3">
                            <span className="text-xl mr-3">🏠</span>
                            <label
                              className={`text-xs font-bold uppercase tracking-wide ${currentTheme.textMuted}`}
                            >
                              Permanent Address
                            </label>
                          </div>
                          <p
                            className={`text-lg font-semibold ${currentTheme.textPrimary} transition-colors`}
                          >
                            {candidateProfile.full_permanent_address || (
                              <span
                                className={`${currentTheme.textMuted} italic text-sm`}
                              >
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* end Profile Section */}

          {/* Education Section */}
          {activeSection === "education" && (
            <EducationSection
              currentTheme={currentTheme}
              preferences={preferences}
              candidateEducation={candidateEducation}
              setEducationModal={setEducationModal}
              initialPrimaryData={candidateEducation?.primary || null}
            />
          )}
          {/* end primary Education Section */}

          {/* add spacing between sections */}
          <div className="my-8 border-t border-gray-200"></div>

          {/* <SecondaryEducation /> */}

          {activeSection === "education" && (
            <SecondaryEducation
              currentTheme={currentTheme}
              preferences={preferences}
              user={user}
              initialData={candidateEducation?.secondary || []}
            />
          )}
          {/* end Secondary Education Section */}
          {/* add spacing between sections */}
          <div className="my-8 border-t border-gray-200"></div>

          {/* Tertiary Education Section */}

          {activeSection === "education" && (
            <TertiaryEducation
              currentTheme={currentTheme}
              preferences={preferences}
              user={user}
              initialData={candidateEducation?.tertiary || []}
            />
          )}
          {/* end Tertiary Education Section */}

          {/* === Modal (always in the tree, outside of activeSection) === */}
          {educationModal.isOpen && (
            <InlineModal
              onClose={() =>
                setEducationModal({
                  isOpen: false,
                  formType: null,
                  editingEducation: null,
                })
              }
            >
              {/* TODO: Implement PrimaryEducationForm component */}
              {/* {educationModal.formType === "primary" && (
                <PrimaryEducationForm
                  onSave={handlePrimarySave}
                  onCancel={() =>
                    setEducationModal({
                      isOpen: false,
                      formType: null,
                      editingEducation: null,
                    })
                  }
                />
              )} */}
              {/* {educationModal.formType === "secondary" && (
                  <SecondaryEducationForm
                    onSave={handleSecondarySave}
                    onCancel={() =>
                      setEducationModal({ isOpen: false, formType: null, editingEducation: null })
                    }
                  />
                )} */}
              {/* {educationModal.formType === "tertiary" && (
                  <TertiaryEducationForm
                    onSave={handleTertiarySave}
                    onCancel={() =>
                      setEducationModal({ isOpen: false, formType: null, editingEducation: null })
                    }
                  />
                )} */}
            </InlineModal>
          )}

          {/* end Education Section */}

          {/* Experience Section */}
          {activeSection === "experience" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-4xl font-bold ${currentTheme.textPrimary} mb-2 flex items-center`}
                  >
                    <span className="mr-3">💼</span>
                    Work Experience
                  </h1>
                  <p className={`text-xl ${currentTheme.textSecondary}`}>
                    Showcase your professional background and career
                    achievements
                  </p>
                </div>
                <button
                  onClick={() =>
                    setExperienceModal({
                      isOpen: true,
                      editingExperience: null,
                    })
                  }
                  className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${
                      preferences.primaryColor || "#6366f1"
                    }, ${preferences.primaryColor || "#6366f1"}dd)`,
                  }}
                >
                  Add Experience
                </button>
              </div>

              {candidateExperience.length > 0 ? (
                <div className="space-y-6">
                  {candidateExperience.map((experience, index) => (
                    <div
                      key={experience.id || index}
                      className={`${currentTheme.cardBg} backdrop-blur-md rounded-2xl p-6 ${currentTheme.border} shadow-xl hover:shadow-2xl transition-all duration-300`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2`}
                          >
                            {experience.position}
                          </h3>
                          <p
                            className={`text-lg ${currentTheme.textSecondary} mb-2`}
                          >
                            {experience.company_name}
                          </p>
                          <p
                            className={`text-sm ${currentTheme.textMuted} mb-3`}
                          >
                            {new Date(
                              experience.start_date
                            ).toLocaleDateString()}
                            {experience.end_date
                              ? ` - ${new Date(
                                  experience.end_date
                                ).toLocaleDateString()}`
                              : " - Present"}
                          </p>
                          {experience.job_description && (
                            <p
                              className={`text-sm ${currentTheme.textSecondary} mb-3`}
                            >
                              {experience.job_description}
                            </p>
                          )}
                          {experience.last_salary && (
                            <p
                              className={`text-sm ${currentTheme.textSecondary} font-medium`}
                            >
                              Last Salary: ₦
                              {experience.last_salary.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() =>
                              setExperienceModal({
                                isOpen: true,
                                editingExperience: experience,
                              })
                            }
                            className={`p-3 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} ${currentTheme.hover} transition-all`}
                          >
                            <svg
                              className={`h-5 w-5 ${currentTheme.textSecondary}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`${currentTheme.cardBg} backdrop-blur-md rounded-2xl p-16 ${currentTheme.border} shadow-xl text-center`}
                >
                  <div className="max-w-md mx-auto">
                    <div
                      className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${
                          preferences.primaryColor || "#6366f1"
                        }, ${preferences.primaryColor || "#6366f1"}dd)`,
                      }}
                    >
                      💼
                    </div>
                    <h3
                      className={`text-3xl font-bold ${currentTheme.textPrimary} mb-4`}
                    >
                      No Work Experience
                    </h3>
                    <p
                      className={`text-lg ${currentTheme.textSecondary} mb-8 leading-relaxed`}
                    >
                      Add your work history to showcase your professional
                      background and attract potential employers.
                    </p>
                    <button
                      onClick={() =>
                        setExperienceModal({
                          isOpen: true,
                          editingExperience: null,
                        })
                      }
                      className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${
                          preferences.primaryColor || "#6366f1"
                        }, ${preferences.primaryColor || "#6366f1"}dd)`,
                      }}
                    >
                      Add Your First Experience
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Emergency Contacts Section */}
          {activeSection === "emergency" && (
            <div className="space-y-8">
              <EmergencyContact
                contacts={emergencyOnly}
                currentTheme={currentTheme}
                preferences={preferences}
                onAdd={() =>
                  setContactModal({
                    isOpen: true,
                    editingContact: null,
                    type: "Emergency Contact",
                  })
                }
                onEdit={(contact) =>
                  setContactModal({ isOpen: true, editingContact: contact })
                }
              />
            </div>
          )}
          {/* End of Emergency Contacts Section */}

          <div className="my-6"></div>

          {/* Next of Kin Section */}
          {activeSection === "emergency" && (
            <NextOfKin
              contacts={nextOfKinOnly}
              currentTheme={currentTheme}
              preferences={preferences}
              onAdd={() =>
                setContactModal({
                  isOpen: true,
                  editingContact: null,
                  type: "Next of Kin",
                })
              }
              onEdit={(contact) =>
                setContactModal({ isOpen: true, editingContact: contact })
              }
            />
          )}

          {/* End ofNext of Kin Section */}

          <div className="my-6"></div>

          {/* family contact Section */}

          {activeSection === "emergency" && (
            <FamilyContact
              contacts={familyOnly}
              currentTheme={currentTheme}
              preferences={preferences}
              onAdd={() =>
                setContactModal({
                  isOpen: true,
                  editingContact: null,
                  type: "Family Contact",
                })
              }
              onEdit={(contact) =>
                setContactModal({ isOpen: true, editingContact: contact })
              }
            />
          )}

          {/* End family contact Section */}

          {/* Apply for Position Section */}
          {activeSection === "apply-position" && (
            <ApplyForPosition
              candidateProfile={candidateProfile}
              currentTheme={currentTheme}
              onClose={() => setActiveSection("overview")}
            />
          )}

          {/* Test Center Section */}
          {activeSection === "test-center" && (
            <TestCenter
              candidateProfile={candidateProfile}
              currentTheme={currentTheme}
              onClose={() => setActiveSection("overview")}
            />
          )}

          {/* Interview Manager Section */}
          {activeSection === "interviews" && (
            <InterviewManager
              candidateProfile={candidateProfile}
              currentTheme={currentTheme}
              onClose={() => setActiveSection("overview")}
            />
          )}

          {/* Accept Offer Section */}
          {activeSection === "applications" && (
            <AcceptOfferSection
              currentTheme={currentTheme}
              preferences={preferences}
              candidateProfile={candidateProfile}
              user={user}
            />
          )}

          {/* Other sections with professional empty states */}
          {[
            "documents",
            "calendar",
            "messages",
            "settings",
          ].map(
            (section) =>
              activeSection === section && (
                <div key={section} className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1
                        className={`text-4xl font-bold ${currentTheme.textPrimary} mb-2 capitalize flex items-center`}
                      >
                        <span className="mr-3">
                          {section === "documents" && "📄"}
                          {section === "calendar" && "📅"}
                          {section === "messages" && "💬"}
                          {section === "settings" && "⚙️"}
                        </span>
                        {section}
                      </h1>
                      <p className={`text-xl ${currentTheme.textSecondary}`}>
                        {section === "documents" &&
                          "Upload and organize your professional documents"}
                        {section === "calendar" &&
                          "Manage your schedule and appointments"}
                        {section === "messages" &&
                          "Communicate with HR representatives and hiring managers"}
                        {section === "settings" &&
                          "Configure your account preferences and privacy settings"}
                      </p>
                    </div>
                    <button
                      className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${
                          preferences.primaryColor || "#6366f1"
                        }, ${preferences.primaryColor || "#6366f1"}dd)`,
                      }}
                    >
                      {section === "documents" && "Upload Document"}
                      {section === "calendar" && "Add Event"}
                      {section === "messages" && "New Message"}
                      {section === "settings" && "Edit Settings"}
                    </button>
                  </div>

                  <div
                    className={`${currentTheme.cardBg} backdrop-blur-md rounded-2xl p-16 ${currentTheme.border} shadow-xl text-center`}
                  >
                    <div className="max-w-md mx-auto">
                      <div
                        className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${
                            preferences.primaryColor || "#6366f1"
                          }, ${preferences.primaryColor || "#6366f1"}dd)`,
                        }}
                      >
                        {section === "documents" && "📄"}
                        {section === "calendar" && "📅"}
                        {section === "messages" && "💬"}
                        {section === "settings" && "⚙️"}
                      </div>

                      <h3
                        className={`text-3xl font-bold ${currentTheme.textPrimary} mb-4 capitalize`}
                      >
                        {section} Module
                      </h3>

                      <p
                        className={`text-lg ${currentTheme.textSecondary} mb-8 leading-relaxed`}
                      >
                        This feature is currently under development. We&apos;re
                        working hard to bring you a comprehensive {section}{" "}
                        management system that will enhance your experience.
                      </p>

                      <div className="space-y-4">
                        <button
                          className="w-full py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                          style={{
                            background: `linear-gradient(135deg, ${
                              preferences.primaryColor || "#6366f1"
                            }, ${preferences.primaryColor || "#6366f1"}dd)`,
                          }}
                        >
                          Get Notified When Available
                        </button>
                        <button
                          onClick={() => setActiveSection("overview")}
                          className={`w-full py-4 ${currentTheme.cardBg} ${currentTheme.textPrimary} ${currentTheme.border} rounded-xl font-semibold ${currentTheme.hover} transition-all`}
                        >
                          Return to Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
          )}
        </main>
      </div>

      {/* Modals */}
      {/* <EducationModal
        isOpen={educationModal.isOpen}
        onClose={() =>
          setEducationModal({ isOpen: false, editingEducation: null })
        }
        onSave={handleEducationSave}
        education={educationModal.editingEducation}
        candidateId={user?.id}
      /> */}

      <ExperienceModal
        isOpen={experienceModal.isOpen}
        onClose={() =>
          setExperienceModal({ isOpen: false, editingExperience: null })
        }
        onSave={handleExperienceSave}
        experience={experienceModal.editingExperience}
        candidateId={user?.id}
      />

      <EmergencyContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ isOpen: false, editingContact: null })}
        onSave={handleContactSave}
        contact={contactModal.editingContact}
        candidateId={user?.id}
        defaultContactType={contactModal.type}
        type={contactModal.type} // Added type prop
      />
    </div>
  );
};

export default CandidateDashboard;
