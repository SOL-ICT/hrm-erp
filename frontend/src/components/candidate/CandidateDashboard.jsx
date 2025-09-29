"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  User,
  CreditCard,
  Shield,
  Building,
  Check,
  AlertCircle,
  Clock,
  Download,
  Upload,
  Camera,
  Edit3,
} from "lucide-react";
import OfferLetterViewer from "./OfferLetterViewer";
import CandidateDetailsForm from "./CandidateDetailsForm";
import OfferAcceptanceForm from "./OfferAcceptanceForm";

const CandidateDashboard = ({ candidateId, currentTheme = "light" }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [candidate, setCandidate] = useState(null);
  const [offerLetter, setOfferLetter] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState(null);
  const [completionStatus, setCompletionStatus] = useState({
    personalDetails: false,
    bankingDetails: false,
    pfaDetails: false,
    offerAccepted: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidateData();
  }, [candidateId]);

  const loadCandidateData = async () => {
    try {
      setLoading(true);
      
      // Get auth token using consistent method
      let token = null;
      try {
        const authData = JSON.parse(localStorage.getItem('auth') || '{}');
        token = authData.access_token;
      } catch (e) {
        token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      }

      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Fetch real candidate data from API
      const candidateResponse = await fetch(`/api/candidate/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (candidateResponse.ok) {
        const candidateData = await candidateResponse.json();
        setCandidate(candidateData.candidate || {});
      } else {
        throw new Error('Failed to load candidate profile');
      }

      // Fetch offer letter data
      const offerResponse = await fetch(`/api/candidate/offer-letter`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (offerResponse.ok) {
        const offerData = await offerResponse.json();
        setOfferLetter(offerData.offer_letter || null);
      } else {
        // No offer letter is acceptable
        setOfferLetter(null);
      }

      // Fetch candidate details
      const detailsResponse = await fetch(`/api/candidate/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        const details = detailsData.details || {
          nin_number: "",
          bvn_number: "",
          bank_name: "",
          account_number: "",
          pfa_name: "",
          pfa_pin: "",
          signature_image: null,
        };
        setCandidateDetails(details);
        updateCompletionStatus(details);
      } else {
        // Set empty details if API fails
        const emptyDetails = {
          nin_number: "",
          bvn_number: "",
          bank_name: "",
          account_number: "",
          pfa_name: "",
          pfa_pin: "",
          signature_image: null,
        };
        setCandidateDetails(emptyDetails);
        updateCompletionStatus(emptyDetails);
      }
      
    } catch (error) {
      console.error("Error loading candidate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCompletionStatus = (details) => {
    setCompletionStatus({
      personalDetails: details.nin_number && details.bvn_number,
      bankingDetails: details.bank_name && details.account_number,
      pfaDetails: true, // Optional, so always true
      offerAccepted: details.signature_image && details.acceptance_confirmed,
    });
  };

  const handleDetailsUpdate = (updatedDetails) => {
    setCandidateDetails(updatedDetails);
    updateCompletionStatus(updatedDetails);
  };

  const handleOfferAcceptance = async (acceptanceData) => {
    try {
      // TODO: API call to submit offer acceptance
      console.log("Submitting offer acceptance:", acceptanceData);
      
      const updatedDetails = {
        ...candidateDetails,
        ...acceptanceData,
        acceptance_confirmed: true,
      };
      
      setCandidateDetails(updatedDetails);
      updateCompletionStatus(updatedDetails);
      
      // Update offer letter status
      setOfferLetter(prev => ({
        ...prev,
        status: "accepted"
      }));
      
    } catch (error) {
      console.error("Error submitting offer acceptance:", error);
      alert("Error submitting acceptance. Please try again.");
    }
  };

  const getStepStatus = (step) => {
    return completionStatus[step] ? "completed" : "pending";
  };

  const getOverallProgress = () => {
    const completed = Object.values(completionStatus).filter(Boolean).length;
    const total = Object.keys(completionStatus).length;
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your offer letter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Welcome, {candidate?.name}</h1>
                <p className="text-gray-500 mt-1">
                  {candidate?.position} • {candidate?.department}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Offer Progress</div>
                <div className="text-2xl font-bold text-blue-600">
                  {getOverallProgress()}%
                </div>
              </div>
            </div>
            
            {/* Progress Steps */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-2 ${getStepStatus('personalDetails') === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                  {getStepStatus('personalDetails') === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">Personal Details</span>
                </div>
                <div className={`flex items-center space-x-2 ${getStepStatus('bankingDetails') === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                  {getStepStatus('bankingDetails') === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">Banking Details</span>
                </div>
                <div className={`flex items-center space-x-2 ${getStepStatus('pfaDetails') === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                  {getStepStatus('pfaDetails') === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">PFA Details</span>
                </div>
                <div className={`flex items-center space-x-2 ${getStepStatus('offerAccepted') === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                  {getStepStatus('offerAccepted') === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">Offer Acceptance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-3">
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg border p-4`}>
              <h3 className="font-semibold mb-4">Complete Your Profile</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                    activeTab === "details"
                      ? "bg-blue-600 text-white"
                      : currentTheme === 'dark' 
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Personal & Banking Details</span>
                  {completionStatus.personalDetails && completionStatus.bankingDetails && (
                    <Check className="w-4 h-4 ml-auto text-green-500" />
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab("offer")}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                    activeTab === "offer"
                      ? "bg-blue-600 text-white"
                      : currentTheme === 'dark' 
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Offer Letter</span>
                  {completionStatus.offerAccepted && (
                    <Check className="w-4 h-4 ml-auto text-green-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Status Summary */}
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg border p-4 mt-4`}>
              <h3 className="font-semibold mb-4">Status Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>NIN & BVN</span>
                  <span className={completionStatus.personalDetails ? "text-green-600" : "text-orange-600"}>
                    {completionStatus.personalDetails ? "Complete" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bank Details</span>
                  <span className={completionStatus.bankingDetails ? "text-green-600" : "text-orange-600"}>
                    {completionStatus.bankingDetails ? "Complete" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Offer Letter</span>
                  <span className={completionStatus.offerAccepted ? "text-green-600" : "text-orange-600"}>
                    {completionStatus.offerAccepted ? "Signed" : "Unsigned"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {activeTab === "details" && (
              <CandidateDetailsForm
                currentTheme={currentTheme}
                candidateDetails={candidateDetails}
                onUpdate={handleDetailsUpdate}
              />
            )}
            
            {activeTab === "offer" && (
              <div className="space-y-6">
                <OfferLetterViewer
                  currentTheme={currentTheme}
                  offerLetter={offerLetter}
                  candidate={candidate}
                />
                
                {/* Show acceptance form only if details are complete */}
                {completionStatus.personalDetails && completionStatus.bankingDetails ? (
                  <OfferAcceptanceForm
                    currentTheme={currentTheme}
                    candidateDetails={candidateDetails}
                    offerLetter={offerLetter}
                    onAccept={handleOfferAcceptance}
                    isCompleted={completionStatus.offerAccepted}
                  />
                ) : (
                  <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg border p-6`}>
                    <div className="flex items-center space-x-3 text-orange-600">
                      <AlertCircle className="w-5 h-5" />
                      <div>
                        <h3 className="font-medium">Complete Your Profile First</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Please fill in your personal and banking details before signing the offer letter.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
