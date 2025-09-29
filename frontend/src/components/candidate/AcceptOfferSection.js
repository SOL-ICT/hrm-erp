"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

const AcceptOfferSection = ({ currentTheme, preferences, candidateProfile, user }) => {
  const { sanctumRequest } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [offerLetters, setOfferLetters] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState({
    nin_number: '',
    bvn_number: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    pfa_name: '',
    pfa_pin: '',
    signature_image: null,
    signature_preview: null,
  });

  const [errors, setErrors] = useState({});

  // Fetch offer letters on component mount
  useEffect(() => {
    fetchOfferLetters();
  }, []);

  const fetchOfferLetters = async () => {
    try {
      setIsLoading(true);
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/offer-letters`,
        { method: 'GET' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setOfferLetters(data.offer_letters || []);
      }
    } catch (error) {
      console.error('Failed to fetch offer letters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCandidateDetails(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSignatureUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrors(prev => ({
          ...prev,
          signature_image: 'Signature image must be less than 2MB'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setCandidateDetails(prev => ({
          ...prev,
          signature_image: file,
          signature_preview: e.target.result
        }));
      };
      reader.readAsDataURL(file);
      
      // Clear error
      setErrors(prev => ({
        ...prev,
        signature_image: null
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 2) {
      if (!candidateDetails.nin_number || candidateDetails.nin_number.length !== 11) {
        newErrors.nin_number = 'NIN must be exactly 11 digits';
      }
      if (!candidateDetails.bvn_number || candidateDetails.bvn_number.length !== 11) {
        newErrors.bvn_number = 'BVN must be exactly 11 digits';
      }
    }

    if (step === 3) {
      if (!candidateDetails.bank_name) newErrors.bank_name = 'Bank name is required';
      if (!candidateDetails.account_number || candidateDetails.account_number.length !== 10) {
        newErrors.account_number = 'Account number must be exactly 10 digits';
      }
      if (!candidateDetails.account_name) newErrors.account_name = 'Account name is required';
      if (!candidateDetails.pfa_name) newErrors.pfa_name = 'PFA name is required';
      if (!candidateDetails.pfa_pin) newErrors.pfa_pin = 'PFA PIN is required';
    }

    if (step === 4) {
      if (!candidateDetails.signature_image) {
        newErrors.signature_image = 'Signature upload is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleSubmitAcceptance = async () => {
    if (!validateStep(4)) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('offer_letter_id', selectedOffer.id);
      formData.append('nin_number', candidateDetails.nin_number);
      formData.append('bvn_number', candidateDetails.bvn_number);
      formData.append('bank_name', candidateDetails.bank_name);
      formData.append('account_number', candidateDetails.account_number);
      formData.append('account_name', candidateDetails.account_name);
      formData.append('pfa_name', candidateDetails.pfa_name);
      formData.append('pfa_pin', candidateDetails.pfa_pin);
      formData.append('signature_image', candidateDetails.signature_image);

      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/accept-offer`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        alert('Offer accepted successfully! HR will be notified.');
        // Reset form
        setCandidateDetails({
          nin_number: '',
          bvn_number: '',
          bank_name: '',
          account_number: '',
          account_name: '',
          pfa_name: '',
          pfa_pin: '',
          signature_image: null,
          signature_preview: null,
        });
        setCurrentStep(1);
        fetchOfferLetters(); // Refresh offers
      } else {
        const errorData = await response.json();
        alert(`Failed to accept offer: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to submit acceptance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = [
    'Select Offer Letter',
    'Identity Verification', 
    'Banking & Pension Details',
    'Digital Signature'
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${currentTheme.textPrimary} mb-2 flex items-center`}>
            <span className="mr-3">📋</span>
            Accept Job Offer
          </h1>
          <p className={`text-xl ${currentTheme.textSecondary}`}>
            Complete the acceptance process for your job offer
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className={`${currentTheme.cardBg} backdrop-blur-md rounded-2xl p-6 ${currentTheme.border} shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          {stepTitles.map((title, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                  index + 1 <= currentStep
                    ? 'bg-gradient-to-r text-white shadow-lg'
                    : `${currentTheme.cardBg} ${currentTheme.textMuted} ${currentTheme.border} border-2`
                }`}
                style={
                  index + 1 <= currentStep
                    ? {
                        background: `linear-gradient(135deg, ${preferences.primaryColor || '#6366f1'}, ${
                          preferences.primaryColor || '#6366f1'
                        }dd)`,
                      }
                    : {}
                }
              >
                {index + 1}
              </div>
              {index < stepTitles.length - 1 && (
                <div
                  className={`flex-1 h-2 mx-4 rounded ${
                    index + 1 < currentStep
                      ? 'bg-gradient-to-r'
                      : `${currentTheme.border} border-t-2`
                  }`}
                  style={
                    index + 1 < currentStep
                      ? {
                          background: `linear-gradient(135deg, ${preferences.primaryColor || '#6366f1'}, ${
                            preferences.primaryColor || '#6366f1'
                          }dd)`,
                        }
                      : {}
                  }
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h3 className={`text-xl font-bold ${currentTheme.textPrimary}`}>
            {stepTitles[currentStep - 1]}
          </h3>
        </div>
      </div>

      {/* Step Content */}
      <div className={`${currentTheme.cardBg} backdrop-blur-md rounded-2xl p-8 ${currentTheme.border} shadow-xl`}>
        {/* Step 1: Select Offer Letter */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-6`}>
              Available Offer Letters
            </h3>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : offerLetters.length > 0 ? (
              <div className="grid gap-4">
                {offerLetters.map((offer) => (
                  <div
                    key={offer.id}
                    onClick={() => setSelectedOffer(offer)}
                    className={`p-6 rounded-xl cursor-pointer transition-all border-2 ${
                      selectedOffer?.id === offer.id
                        ? 'border-blue-500 bg-blue-50'
                        : `${currentTheme.border} hover:border-blue-300`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
                          {offer.position_title}
                        </h4>
                        <p className={`${currentTheme.textSecondary}`}>
                          {offer.department} • {offer.location}
                        </p>
                        <p className={`text-sm ${currentTheme.textMuted}`}>
                          Salary: ₦{offer.salary_amount?.toLocaleString()} {offer.salary_frequency}
                        </p>
                      </div>
                      <div className={`text-right ${currentTheme.textMuted}`}>
                        <p className="text-sm">Issued: {new Date(offer.created_at).toLocaleDateString()}</p>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {offer.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className={`text-xl font-semibold ${currentTheme.textPrimary} mb-2`}>
                  No Offer Letters Available
                </h3>
                <p className={`${currentTheme.textSecondary}`}>
                  You don't have any pending offer letters at the moment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Identity Verification */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-6`}>
              Identity Verification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                  NIN Number *
                </label>
                <input
                  type="text"
                  value={candidateDetails.nin_number}
                  onChange={(e) => handleInputChange('nin_number', e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className={`w-full p-4 rounded-xl ${currentTheme.cardBg} ${currentTheme.border} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nin_number ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter your 11-digit NIN"
                  maxLength="11"
                />
                {errors.nin_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.nin_number}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                  BVN Number *
                </label>
                <input
                  type="text"
                  value={candidateDetails.bvn_number}
                  onChange={(e) => handleInputChange('bvn_number', e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className={`w-full p-4 rounded-xl ${currentTheme.cardBg} ${currentTheme.border} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.bvn_number ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter your 11-digit BVN"
                  maxLength="11"
                />
                {errors.bvn_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.bvn_number}</p>
                )}
              </div>
            </div>

            <div className={`bg-blue-50 border border-blue-200 rounded-xl p-4`}>
              <div className="flex items-start">
                <div className="text-blue-500 mr-3 mt-0.5">ℹ️</div>
                <div>
                  <h4 className="text-blue-800 font-semibold mb-1">Privacy Notice</h4>
                  <p className="text-blue-700 text-sm">
                    Your NIN and BVN are required for identity verification and compliance purposes. 
                    This information is securely encrypted and handled according to data protection regulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Banking & Pension Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-6`}>
              Banking & Pension Details
            </h3>
            
            <div className="space-y-6">
              {/* Banking Details */}
              <div className="space-y-4">
                <h4 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>Bank Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                      Bank Name *
                    </label>
                    <select
                      value={candidateDetails.bank_name}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      className={`w-full p-4 rounded-xl ${currentTheme.cardBg} ${currentTheme.border} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.bank_name ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select Bank</option>
                      <option value="Access Bank">Access Bank</option>
                      <option value="First Bank">First Bank</option>
                      <option value="GTBank">GTBank</option>
                      <option value="UBA">UBA</option>
                      <option value="Zenith Bank">Zenith Bank</option>
                      <option value="Fidelity Bank">Fidelity Bank</option>
                      <option value="Union Bank">Union Bank</option>
                      <option value="Stanbic IBTC">Stanbic IBTC</option>
                      <option value="Sterling Bank">Sterling Bank</option>
                      <option value="FCMB">FCMB</option>
                    </select>
                    {errors.bank_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                      Account Number *
                    </label>
                    <input
                      type="text"
                      value={candidateDetails.account_number}
                      onChange={(e) => handleInputChange('account_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={`w-full p-4 rounded-xl ${currentTheme.cardBg} ${currentTheme.border} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.account_number ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter your 10-digit account number"
                      maxLength="10"
                    />
                    {errors.account_number && (
                      <p className="text-red-500 text-sm mt-1">{errors.account_number}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={candidateDetails.account_name}
                    onChange={(e) => handleInputChange('account_name', e.target.value)}
                    className={`w-full p-4 rounded-xl ${currentTheme.cardBg} ${currentTheme.border} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.account_name ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter account holder name"
                  />
                  {errors.account_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.account_name}</p>
                  )}
                </div>
              </div>

              {/* PFA Details */}
              <div className="space-y-4 border-t pt-6">
                <h4 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>Pension Fund Administrator (PFA)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                      PFA Name *
                    </label>
                    <select
                      value={candidateDetails.pfa_name}
                      onChange={(e) => handleInputChange('pfa_name', e.target.value)}
                      className={`w-full p-4 rounded-xl ${currentTheme.cardBg} ${currentTheme.border} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.pfa_name ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select PFA</option>
                      <option value="ARM Pension Managers">ARM Pension Managers</option>
                      <option value="AXA Mansard Pension">AXA Mansard Pension</option>
                      <option value="Crusader Sterling Pensions">Crusader Sterling Pensions</option>
                      <option value="Fidelity Pension Managers">Fidelity Pension Managers</option>
                      <option value="First Guarantee Pension">First Guarantee Pension</option>
                      <option value="Investment One Pension Managers">Investment One Pension Managers</option>
                      <option value="Leadway Pensure">Leadway Pensure</option>
                      <option value="NLPC Pension Fund Administrators">NLPC Pension Fund Administrators</option>
                      <option value="NPF Pensions">NPF Pensions</option>
                      <option value="OAK Pensions">OAK Pensions</option>
                      <option value="Pensions Alliance Limited">Pensions Alliance Limited</option>
                      <option value="Premium Pension">Premium Pension</option>
                      <option value="Sigma Pensions">Sigma Pensions</option>
                      <option value="Stanbic IBTC Pension Managers">Stanbic IBTC Pension Managers</option>
                      <option value="Tangerine APT Pensions">Tangerine APT Pensions</option>
                      <option value="Trustfund Pensions">Trustfund Pensions</option>
                      <option value="Veritas Glanvills Pensions">Veritas Glanvills Pensions</option>
                    </select>
                    {errors.pfa_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.pfa_name}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                      PFA PIN *
                    </label>
                    <input
                      type="text"
                      value={candidateDetails.pfa_pin}
                      onChange={(e) => handleInputChange('pfa_pin', e.target.value)}
                      className={`w-full p-4 rounded-xl ${currentTheme.cardBg} ${currentTheme.border} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.pfa_pin ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter your PFA PIN"
                    />
                    {errors.pfa_pin && (
                      <p className="text-red-500 text-sm mt-1">{errors.pfa_pin}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Digital Signature */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-6`}>
              Digital Signature
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                  Upload Signature Image *
                </label>
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  candidateDetails.signature_preview 
                    ? 'border-green-400 bg-green-50' 
                    : errors.signature_image 
                    ? 'border-red-400 bg-red-50' 
                    : `${currentTheme.border} hover:border-blue-400`
                }`}>
                  {candidateDetails.signature_preview ? (
                    <div>
                      <img 
                        src={candidateDetails.signature_preview} 
                        alt="Signature Preview" 
                        className="max-h-32 mx-auto mb-4 border rounded"
                      />
                      <p className="text-green-600 font-medium">Signature uploaded successfully</p>
                      <button
                        onClick={() => handleInputChange('signature_preview', null)}
                        className="text-blue-500 hover:underline text-sm mt-2"
                      >
                        Change signature
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-4">✍️</div>
                      <p className={`${currentTheme.textPrimary} font-medium mb-2`}>
                        Upload your signature image
                      </p>
                      <p className={`${currentTheme.textMuted} text-sm mb-4`}>
                        PNG, JPG or GIF (MAX. 2MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                        id="signature-upload"
                      />
                      <label
                        htmlFor="signature-upload"
                        className="cursor-pointer px-6 py-3 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${preferences.primaryColor || '#6366f1'}, ${
                            preferences.primaryColor || '#6366f1'
                          }dd)`,
                        }}
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
                {errors.signature_image && (
                  <p className="text-red-500 text-sm mt-1">{errors.signature_image}</p>
                )}
              </div>

              <div className={`bg-yellow-50 border border-yellow-200 rounded-xl p-4`}>
                <div className="flex items-start">
                  <div className="text-yellow-500 mr-3 mt-0.5">⚠️</div>
                  <div>
                    <h4 className="text-yellow-800 font-semibold mb-1">Important</h4>
                    <p className="text-yellow-700 text-sm">
                      By providing your digital signature, you confirm that you accept the terms and conditions 
                      of the job offer. This action is legally binding and cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className={`${currentTheme.cardBg} rounded-xl p-6 ${currentTheme.border}`}>
                <h4 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4`}>
                  Acceptance Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={`${currentTheme.textMuted}`}>Position:</p>
                    <p className={`${currentTheme.textPrimary} font-medium`}>
                      {selectedOffer?.position_title}
                    </p>
                  </div>
                  <div>
                    <p className={`${currentTheme.textMuted}`}>Department:</p>
                    <p className={`${currentTheme.textPrimary} font-medium`}>
                      {selectedOffer?.department}
                    </p>
                  </div>
                  <div>
                    <p className={`${currentTheme.textMuted}`}>Salary:</p>
                    <p className={`${currentTheme.textPrimary} font-medium`}>
                      ₦{selectedOffer?.salary_amount?.toLocaleString()} {selectedOffer?.salary_frequency}
                    </p>
                  </div>
                  <div>
                    <p className={`${currentTheme.textMuted}`}>Bank Account:</p>
                    <p className={`${currentTheme.textPrimary} font-medium`}>
                      {candidateDetails.bank_name} - {candidateDetails.account_number}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8 border-t">
          <button
            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 1
                ? `${currentTheme.textMuted} cursor-not-allowed`
                : `${currentTheme.textPrimary} ${currentTheme.hover}`
            } ${currentTheme.cardBg} ${currentTheme.border}`}
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && !selectedOffer) ||
                isLoading
              }
              className={`px-8 py-3 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
                (currentStep === 1 && !selectedOffer) || isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${preferences.primaryColor || '#6366f1'}, ${
                  preferences.primaryColor || '#6366f1'
                }dd)`,
              }}
            >
              {isLoading ? 'Processing...' : 'Next Step'}
            </button>
          ) : (
            <button
              onClick={handleSubmitAcceptance}
              disabled={isLoading}
              className={`px-8 py-3 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, #10b981, #047857)`,
              }}
            >
              {isLoading ? 'Submitting...' : 'Accept Offer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptOfferSection;
