import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Upload, Lock, Info, CheckCircle, AlertCircle, FileText, User, Mail, Phone, MapPin, Users, Heart, CreditCard, Building, Edit3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MiscApplicationChange = ({ userId }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [staffProfile, setStaffProfile] = useState(null);
  const [applicationHistory, setApplicationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const availableFields = [
    { id: 'accountNumber', label: 'Account Number', icon: CreditCard, sensitive: true, proofRequired: true },
    { id: 'placeOfService', label: 'Place of Service', icon: Building, proofRequired: false },
    { id: 'residentialAddress', label: 'Residential Address', icon: MapPin, proofRequired: true },
    { id: 'stateOfResidence', label: 'State of Residence', icon: MapPin, proofRequired: true },
    { id: 'guarantorDetails', label: 'Guarantor Details', icon: Users, proofRequired: true },
    { id: 'nextOfKin', label: 'Next of Kin', icon: User, proofRequired: true },
    { id: 'maritalStatus', label: 'Marital Status', icon: Heart, proofRequired: true },
    { id: 'mobileNumber', label: 'Mobile Number', icon: Phone, proofRequired: false },
    { id: 'emailAddress', label: 'Email Address', icon: Mail, proofRequired: false },
    { id: 'pensionDetails', label: 'Pension Details', icon: FileText, proofRequired: true },
    { id: 'other', label: 'Other', icon: Edit3, proofRequired: false, freeText: true }
  ];

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
        console.log('Fetching staff profile for user ID:', user.id);
        const profileResponse = await fetch(`http://localhost:8000/api/staff/staff-profiles/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
        console.log('Profile API response status:', profileResponse.status);
        if (!profileResponse.ok) {
          if (profileResponse.status === 401) {
            setErrorMessage('Authentication failed. Please log in again.');
          } else {
            setErrorMessage(`Failed to fetch profile: HTTP ${profileResponse.status}`);
          }
          throw new Error(`Profile fetch failed: ${profileResponse.status}`);
        }
        const profileData = await profileResponse.json();
        setStaffProfile(profileData);

        console.log('Fetching application history');
        const historyResponse = await fetch(`http://localhost:8000/api/staff/change-requests/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
        console.log('History API response status:', historyResponse.status);
        if (!historyResponse.ok) {
          if (historyResponse.status === 401) {
            setErrorMessage('Authentication failed. Please log in again.');
          } else {
            setErrorMessage(`Failed to fetch history: HTTP ${historyResponse.status}`);
          }
          throw new Error(`History fetch failed: ${historyResponse.status}`);
        }
        const historyData = await historyResponse.json();
        setApplicationHistory(historyData);
      } catch (error) {
        console.error('Failed to fetch data:', error.message);
        if (!errorMessage) setErrorMessage('An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
  };

  const handleFileUpload = (fieldId, file) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldId]: file
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
          formDataToSend.append(`${fieldId}_proof`, uploadedFiles[fieldId]);
        }
      });
      formDataToSend.append('userId', user.id);

      console.log('Submitting change request');
      const response = await fetch(`http://localhost:8000/api/staff/change-requests`, {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });
      console.log('Submit API response status:', response.status);
      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage('Authentication failed. Please log in again.');
        } else {
          setErrorMessage(`Failed to submit request: HTTP ${response.status}`);
        }
        throw new Error(`Submit failed: ${response.status}`);
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCurrentStep(0);
      }, 3000);
    } catch (error) {
      console.error('Error submitting change request:', error.message);
      if (!errorMessage) setErrorMessage('An error occurred while submitting the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldIcon = (fieldId) => {
    const field = availableFields.find(f => f.id === fieldId);
    const IconComponent = field?.icon || Edit3;
    return <IconComponent className="w-5 h-5" />;
  };

  const isFormValid = () => {
    return selectedFields.every(fieldId => {
      const field = availableFields.find(f => f.id === fieldId);
      const currentValue = staffProfile?.[fieldId] || 'Not set';
      const newValue = formData[fieldId] || '';
      const isValueChanged = newValue !== currentValue && newValue.trim() !== '';
      const hasFileIfRequired = field?.proofRequired ? !!uploadedFiles[fieldId] : true;
      return isValueChanged && hasFileIfRequired;
    });
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
                { label: 'Client Name', value: staffProfile?.clientName },
                { label: 'Service Location', value: staffProfile?.location },
               // for employee name i want to concat .first_name , .middle_name and .last_name from staffprofile, if middle_name exists
                { label: 'Employee Name', value: `${staffProfile?.first_name} ${staffProfile?.middle_name ? staffProfile?.middle_name + ' ' : ''}${staffProfile?.last_name}` },
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
                <div className="grid md:grid-cols-2 gap-4">
                  {availableFields.map((field) => (
                    <div key={field.id} className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedFields.includes(field.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`} onClick={() => handleFieldSelection(field.id)}>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field.id)}
                          onChange={() => handleFieldSelection(field.id)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-2">
                          {getFieldIcon(field.id)}
                          <span className="font-medium text-gray-800">{field.label}</span>
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
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 2: Provide New Information & Upload Proof</h2>
                <div className="space-y-6">
                  {selectedFields.map((fieldId) => {
                    const field = availableFields.find(f => f.id === fieldId);
                    const oldValue = staffProfile?.[fieldId] || 'Not set';

                    return (
                      <div key={fieldId} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <div className="flex items-center space-x-2 mb-4">
                          {getFieldIcon(fieldId)}
                          <h3 className="text-lg font-medium text-gray-800">{field?.label}</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Current Value</label>
                            <div className="p-3 bg-white border border-gray-200 rounded-lg flex items-center space-x-2">
                              <Lock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{oldValue}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              New Value <span className="text-red-500">*</span>
                            </label>
                            {field?.freeText ? (
                              <textarea
                                value={formData[fieldId] || ''}
                                onChange={(e) => handleInputChange(fieldId, e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                rows="3"
                                placeholder="Describe the changes you need..."
                              />
                            ) : (
                              <input
                                type={fieldId === 'emailAddress' ? 'email' : fieldId === 'mobileNumber' ? 'tel' : 'text'}
                                value={formData[fieldId] || ''}
                                onChange={(e) => handleInputChange(fieldId, e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500  text-gray-800"
                                placeholder={`Enter new  ${field?.label.toLowerCase()}`}
                              />
                            )}
                          </div>
                        </div>

                        {field?.proofRequired && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Upload Proof <span className="text-red-500">*</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                              <input
                                type="file"
                                onChange={(e) => handleFileUpload(fieldId, e.target.files[0])}
                                accept=".pdf,.jpg,.jpeg,.png"
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
                                    {uploadedFiles[fieldId] ? uploadedFiles[fieldId].name : 'Click to upload or drag and drop'}
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 5MB</p>
                                </div>
                              </label>
                            </div>
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
                      const field = availableFields.find(f => f.id === fieldId);
                      const oldValue = staffProfile?.[fieldId] || 'Not set';
                      const newValue = formData[fieldId] || 'Not provided';
                      const hasFile = uploadedFiles[fieldId];

                      return (
                        <div key={fieldId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getFieldIcon(fieldId)}
                            <div>
                              <p className="font-medium text-gray-800">{field?.label}</p>
                              <p className="text-sm text-gray-600">
                                <span className="line-through">{oldValue}</span> → <span className="font-medium text-indigo-600">{newValue}</span>
                              </p>
                              {hasFile && (
                                <p className="text-xs text-green-600 flex items-center space-x-1 mt-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Document uploaded: {hasFile.name}</span>
                                </p>
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
    </div>
  );
};

export default MiscApplicationChange;