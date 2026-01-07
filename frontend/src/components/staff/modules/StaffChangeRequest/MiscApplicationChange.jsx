import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Upload, Lock, Info, CheckCircle, AlertCircle, FileText, User, Mail, Phone, MapPin, Users, Heart, CreditCard, Building, Edit3, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

const MiscApplicationChange = ({ userId }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [staffProfile, setStaffProfile] = useState(null);
  const [currentValues, setCurrentValues] = useState({});
  const [applicationHistory, setApplicationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [showSensitiveData, setShowSensitiveData] = useState({});

  // Field categories for better organization
  const fieldCategories = {
    banking: {
      title: 'Banking Information',
      icon: CreditCard,
      fields: [
        { id: 'bankName', label: 'Bank Name', type: 'select', sensitive: false, proofRequired: true },
        { id: 'accountNumber', label: 'Account Number', type: 'text', sensitive: true, proofRequired: true },
        { id: 'accountType', label: 'Account Type', type: 'select', sensitive: false, proofRequired: true },
        { id: 'bvn', label: 'Bank Verification Number (BVN)', type: 'text', sensitive: true, proofRequired: true },
        { id: 'sortCode', label: 'Sort Code', type: 'text', sensitive: false, proofRequired: false }
      ]
    },
    identification: {
      title: 'Identification Information',
      icon: FileText,
      fields: [
        { id: 'nin', label: 'National Identification Number (NIN)', type: 'text', sensitive: true, proofRequired: true },
        { id: 'tin', label: 'Tax Identification Number (TIN)', type: 'text', sensitive: true, proofRequired: true },
        { id: 'driverLicense', label: "Driver's License Number", type: 'text', sensitive: false, proofRequired: true },
        { id: 'passportNumber', label: 'International Passport Number', type: 'text', sensitive: false, proofRequired: true }
      ]
    },
    location: {
      title: 'Location Information',
      icon: MapPin,
      fields: [
        { id: 'residentialAddress', label: 'Residential Address', type: 'textarea', sensitive: false, proofRequired: true },
        { id: 'stateOfResidence', label: 'State of Residence', type: 'select', sensitive: false, proofRequired: true },
        { id: 'lga', label: 'Local Government Area (LGA)', type: 'select', sensitive: false, proofRequired: true },
        { id: 'landmark', label: 'Landmark/Directions', type: 'textarea', sensitive: false, proofRequired: false },
        { id: 'residenceType', label: 'Residence Type', type: 'select', sensitive: false, proofRequired: true },
        { id: 'gpsCoordinates', label: 'GPS Coordinates', type: 'text', sensitive: false, proofRequired: false }
      ]
    },
    employment: {
      title: 'Employment Information',
      icon: Building,
      fields: [
        { id: 'placeOfService', label: 'Place of Service', type: 'text', sensitive: false, proofRequired: false },
        { id: 'department', label: 'Department/Division', type: 'text', sensitive: false, proofRequired: false },
        { id: 'employmentGrade', label: 'Employment Grade/Level', type: 'text', sensitive: false, proofRequired: false },
        { id: 'employmentType', label: 'Employment Type', type: 'select', sensitive: false, proofRequired: false },
        { id: 'lastPromotionDate', label: 'Date of Last Promotion', type: 'date', sensitive: false, proofRequired: false }
      ]
    },
    contact: {
      title: 'Contact Information',
      icon: Phone,
      fields: [
        { id: 'mobileNumber', label: 'Mobile Number', type: 'tel', sensitive: false, proofRequired: false },
        { id: 'alternativeNumber', label: 'Alternative Phone Number', type: 'tel', sensitive: false, proofRequired: false },
        { id: 'emailAddress', label: 'Email Address', type: 'email', sensitive: false, proofRequired: false }
      ]
    },
    personal: {
      title: 'Personal Information',
      icon: User,
      fields: [
        { id: 'maritalStatus', label: 'Marital Status', type: 'select', sensitive: false, proofRequired: true }
      ]
    },
    pension: {
      title: 'Pension Information',
      icon: Heart,
      fields: [
        { id: 'pfaName', label: 'Pension Fund Administrator (PFA) Name', type: 'select', sensitive: false, proofRequired: true },
        { id: 'pensionPin', label: 'Pension PIN', type: 'text', sensitive: true, proofRequired: true },
        { id: 'rsaNumber', label: 'Retirement Savings Account (RSA) Number', type: 'text', sensitive: true, proofRequired: true }
      ]
    },
    nextOfKin: {
      title: 'Next of Kin Information',
      icon: Users,
      fields: [
        { id: 'nokFullName', label: 'Next of Kin Full Name', type: 'text', sensitive: false, proofRequired: true },
        { id: 'nokRelationship', label: 'Relationship to Employee', type: 'select', sensitive: false, proofRequired: true },
        { id: 'nokDateOfBirth', label: 'Next of Kin Date of Birth', type: 'date', sensitive: false, proofRequired: true },
        { id: 'nokOccupation', label: 'Next of Kin Occupation', type: 'text', sensitive: false, proofRequired: true },
        { id: 'nokEmployer', label: 'Next of Kin Employer', type: 'text', sensitive: false, proofRequired: true },
        { id: 'nokAddress', label: 'Next of Kin Complete Address', type: 'textarea', sensitive: false, proofRequired: true },
        { id: 'nokPhone', label: 'Next of Kin Phone Number', type: 'tel', sensitive: false, proofRequired: true },
        { id: 'nokAlternativePhone', label: 'Next of Kin Alternative Phone', type: 'tel', sensitive: false, proofRequired: false },
        { id: 'nokEmail', label: 'Next of Kin Email Address', type: 'email', sensitive: false, proofRequired: false }
      ]
    },
    guarantor: {
      title: 'Guarantor Information',
      icon: Users,
      fields: [
        { id: 'guarantorFullName', label: 'Guarantor Full Name', type: 'text', sensitive: false, proofRequired: true },
        { id: 'guarantorRelationship', label: 'Relationship to Employee', type: 'text', sensitive: false, proofRequired: true },
        { id: 'guarantorOccupation', label: 'Guarantor Occupation', type: 'text', sensitive: false, proofRequired: true },
        { id: 'guarantorEmployer', label: 'Guarantor Employer', type: 'text', sensitive: false, proofRequired: true },
        { id: 'guarantorAddress', label: 'Guarantor Complete Address', type: 'textarea', sensitive: false, proofRequired: true },
        { id: 'guarantorPhone', label: 'Guarantor Phone Number', type: 'tel', sensitive: false, proofRequired: true },
        { id: 'guarantorEmail', label: 'Guarantor Email Address', type: 'email', sensitive: false, proofRequired: true },
        { id: 'guarantorIncome', label: 'Guarantor Monthly Income', type: 'number', sensitive: true, proofRequired: true }
      ]
    },
    other: {
      title: 'Other Information',
      icon: Edit3,
      fields: [
        { id: 'other', label: 'Other', type: 'textarea', sensitive: false, proofRequired: false, freeText: true }
      ]
    }
  };

  // Nigerian-specific data for dropdowns
  const nigerianData = {
    banks: [
      'Access Bank', 'Citibank', 'Ecobank', 'Fidelity Bank', 'First Bank of Nigeria',
      'First City Monument Bank', 'Guaranty Trust Bank', 'Heritage Bank', 'Keystone Bank',
      'Polaris Bank', 'Stanbic IBTC Bank', 'Standard Chartered Bank', 'Sterling Bank',
      'Union Bank of Nigeria', 'United Bank for Africa', 'Unity Bank', 'Wema Bank', 'Zenith Bank'
    ],
    accountTypes: ['Savings Account', 'Current Account', 'Domiciliary Account'],
    states: [
      'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
      'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
      'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
      'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
      'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
    ],
    residenceTypes: ['Owned', 'Rented', 'Family Home', 'Company Accommodation'],
    maritalStatus: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'],
    employmentTypes: ['Permanent', 'Contract', 'Temporary', 'Consultant'],
    relationships: ['Father', 'Mother', 'Spouse', 'Sibling', 'Child', 'Uncle', 'Aunt', 'Cousin', 'Friend', 'Other'],
    pfaNames: [
      'ARM Pension Managers', 'AXA Mansard Pension', 'Crusader Sterling Pensions',
      'FCMB Pensions', 'Fidelity Pension Managers', 'IEI-Anchor Pension Managers',
      'IGI Pension Fund Managers', 'Investment One Pension Managers', 'Leadway Pensure',
      'NLPC Pension Fund Administrators', 'NPF Pensions', 'OAK Pensions',
      'Pensions Alliance Limited', 'Premium Pension', 'Radix Pension Managers',
      'Sigma Pensions', 'Stanbic IBTC Pension Managers', 'Trustfund Pensions',
      'Veritas Glanvills Pensions', 'Zenith Pension Custodian'
    ]
  };

  // Validation functions
  const validateField = (fieldId, value, fieldConfig) => {
    const errors = [];

    if (!value || value.toString().trim() === '') {
      errors.push('This field is required');
      return errors;
    }

    switch (fieldId) {
      case 'bvn':
        if (!/^\d{11}$/.test(value)) {
          errors.push('BVN must be exactly 11 digits');
        }
        break;
      case 'nin':
        if (!/^\d{11}$/.test(value)) {
          errors.push('NIN must be exactly 11 digits');
        }
        break;
      case 'tin':
        if (!/^\d{10,12}$/.test(value)) {
          errors.push('TIN must be 10-12 digits');
        }
        break;
      case 'accountNumber':
        if (!/^\d{10}$/.test(value)) {
          errors.push('Nigerian account numbers must be exactly 10 digits');
        }
        break;
      case 'rsaNumber':
        if (!/^\d{15}$/.test(value)) {
          errors.push('RSA number must be exactly 15 digits');
        }
        break;
      case 'mobileNumber':
      case 'alternativeNumber':
      case 'nokPhone':
      case 'nokAlternativePhone':
      case 'guarantorPhone':
        if (!/^(080|081|090|091|070|071)\d{8}$/.test(value.replace(/\s/g, ''))) {
          errors.push('Nigerian phone numbers must follow the format 080xxxxxxxx, 081xxxxxxxx, 090xxxxxxxx, 091xxxxxxxx, 070xxxxxxxx, or 071xxxxxxxx');
        }
        break;
      case 'emailAddress':
      case 'nokEmail':
      case 'guarantorEmail':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push('Please enter a valid email address');
        }
        break;
      case 'nokDateOfBirth':
        const birthDate = new Date(value);
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        if (birthDate > eighteenYearsAgo) {
          errors.push('Next of kin must be at least 18 years old');
        }
        break;
      case 'guarantorIncome':
        if (isNaN(value) || parseFloat(value) <= 0) {
          errors.push('Please enter a valid monthly income amount');
        }
        break;
    }

    return errors;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        console.log('No user object available, skipping API calls');
        setErrorMessage('Please log in to view your profile.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        console.log('Fetching staff profile using /me endpoint for current user (id:', user.id, ')');

        // Use centralized apiService and the server-side /me route to resolve the correct staff profile
        const profileRaw = await apiService.makeRequest('staff/staff-profiles/me', { method: 'GET' });
        const profileData = Array.isArray(profileRaw) ? profileRaw[0] || null : profileRaw || null;
        setStaffProfile(profileData);

        // Attempt to fetch current values (mock endpoint that will fail gracefully)
        try {
          console.log('Attempting to fetch current values (using /me)');
          const currentValuesData = await apiService.makeRequest('staff/current-values/me', { method: 'GET' });
          setCurrentValues(currentValuesData || {});
        } catch (currentValuesError) {
          console.log('Current values endpoint failed gracefully:', currentValuesError.message);
          setCurrentValues({});
        }

        console.log('Fetching application history');
        const historyData = await apiService.makeRequest('staff/change-requests/history', { method: 'GET' });
        setApplicationHistory(Array.isArray(historyData) ? historyData : []);
      } catch (error) {
        console.error('Failed to fetch data:', error.message);
        if (error?.message && error.message.toLowerCase().includes('401')) {
          setErrorMessage('Authentication failed. Please log in again.');
        } else if (!errorMessage) {
          setErrorMessage('An error occurred while fetching data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getCurrentValue = (fieldId) => {
    return currentValues[fieldId] || staffProfile?.[fieldId] || 'Not set';
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleSensitiveData = (fieldId) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const handleFieldSelection = (fieldId) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Real-time validation
    const fieldConfig = Object.values(fieldCategories)
      .flatMap(cat => cat.fields)
      .find(field => field.id === fieldId);

    if (fieldConfig) {
      const errors = validateField(fieldId, value, fieldConfig);
      setValidationErrors(prev => ({
        ...prev,
        [fieldId]: errors
      }));
    }
  };

  const handleFileUpload = (fieldId, files) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldId]: Array.from(files)
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
      try {
      const formDataToSend = new FormData();
      selectedFields.forEach(fieldId => {
        formDataToSend.append(fieldId, formData[fieldId] || '');
        if (uploadedFiles[fieldId]) {
          uploadedFiles[fieldId].forEach((file, index) => {
            formDataToSend.append(`${fieldId}_proof_${index}`, file);
          });
        }
      });

      // Prefer sending the staff identifier if already fetched; otherwise rely on backend auth to map the request.
      if (staffProfile && staffProfile.staff_id) {
        formDataToSend.append('staffId', staffProfile.staff_id);
      }

      console.log('Submitting change request');
      try {
        await apiService.makeRequest('staff/change-requests', {
          method: 'POST',
          body: formDataToSend,
          headers: {}, // allow browser to set Content-Type for FormData
        });

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setCurrentStep(0);
          setSelectedFields([]);
          setFormData({});
          setUploadedFiles({});
        }, 3000);
      } catch (submitError) {
        console.error('Submit API error:', submitError.message);
        if (submitError?.message && submitError.message.toLowerCase().includes('401')) {
          setErrorMessage('Authentication failed. Please log in again.');
        } else if (!errorMessage) {
          setErrorMessage('An error occurred while submitting the request.');
        }
        throw submitError;
      }
    } catch (error) {
      console.error('Error submitting change request:', error.message);
      if (!errorMessage) setErrorMessage('An error occurred while submitting the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldConfig = (fieldId) => {
    return Object.values(fieldCategories)
      .flatMap(cat => cat.fields)
      .find(field => field.id === fieldId);
  };

  const isFormValid = () => {
    return selectedFields.every(fieldId => {
      const field = getFieldConfig(fieldId);
      const currentValue = getCurrentValue(fieldId);
      const newValue = formData[fieldId] || '';
      const isValueChanged = newValue !== currentValue && newValue.trim() !== '';
      const hasFileIfRequired = field?.proofRequired ? 
        (uploadedFiles[fieldId] && uploadedFiles[fieldId].length > 0) : true;
      const hasNoValidationErrors = !validationErrors[fieldId] || validationErrors[fieldId].length === 0;
      return isValueChanged && hasFileIfRequired && hasNoValidationErrors;
    });
  };

  const renderInput = (field, value, onChange) => {
    const hasError = validationErrors[field.id] && validationErrors[field.id].length > 0;

    const baseInputClass = `w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
      hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
    }`;

    switch (field.type) {
      case 'select':
        let options = [];
        if (field.id === 'bankName') options = nigerianData.banks;
        else if (field.id === 'accountType') options = nigerianData.accountTypes;
        else if (field.id === 'stateOfResidence') options = nigerianData.states;
        else if (field.id === 'residenceType') options = nigerianData.residenceTypes;
        else if (field.id === 'maritalStatus') options = nigerianData.maritalStatus;
        else if (field.id === 'employmentType') options = nigerianData.employmentTypes;
        else if (field.id === 'nokRelationship') options = nigerianData.relationships;
        else if (field.id === 'pfaName') options = nigerianData.pfaNames;

        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select {field.label}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={baseInputClass}
            rows="3"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'tel':
      case 'email':
      case 'text':
      case 'date':
      case 'number':
        const inputElement = (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className={baseInputClass}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

        if (field.sensitive) {
          return (
            <div className="relative">
              <input
                type={showSensitiveData[field.id] ? 'text' : 'password'}
                value={value || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                className={`${baseInputClass} pr-12`}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
              <button
                type="button"
                onClick={() => toggleSensitiveData(field.id)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showSensitiveData[field.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          );
        }

        return inputElement;

      default:
        return inputElement;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
          {errorMessage && (
            <p className="text-red-600 mt-4 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span>Your change request has been submitted and is pending review.</span>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {currentStep === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Your Profile Summary</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              {[
                { label: 'Entry Date', value: staffProfile?.entry_date },
                { label: 'Employee Code', value: staffProfile?.employee_code },
                { label: 'Client Name', value: staffProfile?.client_name },
                { label: 'Service Location', value: staffProfile?.location },
                { label: 'Employee Name', value: `${staffProfile?.first_name || ''} ${staffProfile?.middle_name ? staffProfile?.middle_name + ' ' : ''}${staffProfile?.last_name || ''}`.trim() || 'Not set' },
                { label: 'Designation', value: staffProfile?.designation },
                { label: 'Email ID', value: staffProfile?.email },
                { label: 'SOL RM Email', value: staffProfile?.solRmEmail },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">{label}</label>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    {value || 'Not set'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2 mb-4"
              >
                <FileText className="w-4 h-4" />
                <span>{showHistory ? 'Hide' : 'View'} Application History</span>
              </button>
              {showHistory && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Application History</h3>
                  <div className="space-y-2">
                    {applicationHistory.length > 0 ? (
                      applicationHistory.map((item) => (
                        <div key={item.id} className="flex justify-between p-3 bg-white rounded-lg">
                          <span>{item.date} - {item.field}</span>
                          <span className={`text-sm ${item.status === 'Approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {item.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No application history available.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Apply for Information Change</span>
            </button>
          </div>
        )}

        {currentStep > 0 && (
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Request to Update Your Personal or Employment Information
              </h1>
              <p className="text-gray-600 mb-6">
                Select the fields you wish to update. You will be asked to provide the new details and upload supporting documents.
              </p>

              <div className="flex items-center space-x-4 mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-12 h-0.5 mx-2 ${currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {currentStep === 1 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 1: Select Fields to Change</h2>
                
                <div className="space-y-4">
                  {Object.entries(fieldCategories).map(([categoryId, category]) => (
                    <div key={categoryId} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleCategory(categoryId)}
                        className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <category.icon className="w-5 h-5 text-indigo-600" />
                          <span className="font-medium text-gray-800">{category.title}</span>
                          <span className="text-sm text-gray-500">
                            ({category.fields.filter(field => selectedFields.includes(field.id)).length} selected)
                          </span>
                        </div>
                        {expandedCategories[categoryId] ? 
                          <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        }
                      </button>
                      
                      {expandedCategories[categoryId] && (
                        <div className="p-4 border-t border-gray-200">
                          <div className="grid md:grid-cols-2 gap-3">
                            {category.fields.map((field) => (
                              <div key={field.id} className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                selectedFields.includes(field.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                              }`} onClick={() => handleFieldSelection(field.id)}>
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedFields.includes(field.id)}
                                    onChange={() => handleFieldSelection(field.id)}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                  />
                                  <div className="flex items-center space-x-2 flex-1">
                                    <span className="font-medium text-gray-800 text-sm">{field.label}</span>
                                    {field.proofRequired && (
                                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                                        📎 Proof Required
                                      </span>
                                    )}
                                    {field.sensitive && (
                                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                        🔒 Sensitive
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={selectedFields.length === 0}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Provide New Information & Upload Proof</h2>
                <div className="space-y-6">
                  {selectedFields.map((fieldId) => {
                    const field = getFieldConfig(fieldId);
                    const oldValue = getCurrentValue(fieldId);

                    return (
                      <div key={fieldId} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <div className="flex items-center space-x-2 mb-4">
                          {Object.values(fieldCategories).map(cat => {
                            const categoryField = cat.fields.find(f => f.id === fieldId);
                            if (categoryField) {
                              return <cat.icon key={cat.title} className="w-5 h-5 text-indigo-600" />;
                            }
                            return null;
                          })}
                          {/* the texts are not visible */}
                          <h3 className="text-lg font-medium text-gray-900">{field?.label}</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-900">Current Value</label>
                            <div className="p-3 bg-white border border-gray-200 rounded-lg flex items-center space-x-2">
                              <Lock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{oldValue}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              New Value <span className="text-red-500">*</span>
                            </label>
                            {renderInput(field, formData[fieldId], handleInputChange)}
                            {validationErrors[fieldId] && validationErrors[fieldId].length > 0 && (
                              <div className="text-red-600 text-sm space-y-1">
                                {validationErrors[fieldId].map((error, index) => (
                                  <p key={index} className="flex items-center space-x-1">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {field?.proofRequired && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Upload Proof <span className="text-red-500">*</span>
                              <span className="text-xs text-gray-500 block mt-1">
                                You can upload multiple files. PDF format is preferred.
                              </span>
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                              <input
                                type="file"
                                onChange={(e) => handleFileUpload(fieldId, e.target.files)}
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple
                                className="hidden"
                                id={`file-${fieldId}`}
                              />
                              <label
                                htmlFor={`file-${fieldId}`}
                                className="cursor-pointer flex flex-col items-center space-y-2"
                              >
                                <Upload className="w-8 h-8 text-gray-400" />
                                <div className="text-center">
                                  <span className="text-sm text-gray-600">
                                    {uploadedFiles[fieldId] && uploadedFiles[fieldId].length > 0 
                                      ? `${uploadedFiles[fieldId].length} file(s) selected`
                                      : 'Click to upload or drag and drop'
                                    }
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB each</p>
                                </div>
                              </label>
                            </div>
                            {uploadedFiles[fieldId] && uploadedFiles[fieldId].length > 0 && (
                              <div className="mt-2 space-y-1">
                                {uploadedFiles[fieldId].map((file, index) => (
                                  <p key={index} className="text-xs text-green-600 flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>{file.name}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 flex items-center space-x-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!isFormValid()}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>Review</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 3: Review & Submit</h2>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Summary of Your Change Request</span>
                  </h3>

                  <div className="space-y-4">
                    {selectedFields.map((fieldId) => {
                      const field = getFieldConfig(fieldId);
                      const oldValue = getCurrentValue(fieldId);
                      const newValue = formData[fieldId] || 'Not provided';
                      const hasFiles = uploadedFiles[fieldId] && uploadedFiles[fieldId].length > 0;

                      return (
                        <div key={fieldId} className="flex items-start justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-start space-x-3">
                            {Object.values(fieldCategories).map(cat => {
                              const categoryField = cat.fields.find(f => f.id === fieldId);
                              if (categoryField) {
                                return <cat.icon key={cat.title} className="w-5 h-5 text-indigo-600 mt-1" />;
                              }
                              return null;
                            })}
                            <div>
                              <p className="font-medium text-gray-800">{field?.label}</p>
                              <p className="text-sm text-gray-600">
                                <span className="line-through">{oldValue}</span> → <span className="font-medium text-indigo-600">{newValue}</span>
                              </p>
                              {hasFiles && (
                                <div className="text-xs text-green-600 mt-1 space-y-1">
                                  {uploadedFiles[fieldId].map((file, index) => (
                                    <p key={index} className="flex items-center space-x-1">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Document {index + 1}: {file.name}</span>
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 flex items-center space-x-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MiscApplicationChange;