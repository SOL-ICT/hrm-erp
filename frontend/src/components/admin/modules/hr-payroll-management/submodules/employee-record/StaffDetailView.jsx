"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  CreditCard,
  GraduationCap,
  Briefcase,
  Users,
  Shield,
  FileText,
  UserCheck,
  Edit3,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
} from "lucide-react";
import employeeRecordAPI from "../../../../../../services/modules/hr-payroll-management/employeeRecordAPI";

const StaffDetailView = ({ staff, onBack, onSave }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load complete staff data when component mounts
  useEffect(() => {
    loadStaffDetails();
  }, [staff.id]);

  const loadStaffDetails = async () => {
    try {
      setLoading(true);
      
      // Make actual API call to fetch staff details
      const response = await employeeRecordAPI.getStaffDetails(staff.id);
      
      if (response.success) {
        // Transform API response to match component expectations
        const apiData = response.data;
        const transformedData = {
          // Basic staff info (from staff table)
          basic: {
            id: apiData.id,
            candidate_id: apiData.candidate_id,
            client_id: apiData.client_id,
            staff_type_id: apiData.staff_type_id,
            employee_code: apiData.employee_code,
            staff_id: apiData.staff_id,
            email: apiData.email,
            first_name: apiData.first_name,
            middle_name: apiData.middle_name,
            last_name: apiData.last_name,
            gender: apiData.gender,
            entry_date: apiData.entry_date,
            end_date: apiData.end_date,
            appointment_status: apiData.appointment_status,
            employment_type: apiData.employment_type,
            status: apiData.status,
            job_title: apiData.job_title,
            department: apiData.department,
            location: apiData.location,
            supervisor_id: apiData.supervisor_id,
            leave_category_level: apiData.leave_category_level,
            appraisal_category: apiData.appraisal_category,
            tax_id_no: apiData.tax_id_no,
            pf_no: apiData.pf_no,
            pf_administrator: apiData.pf_administrator,
            pfa_code: apiData.pfa_code,
            bv_no: apiData.bv_no,
            nhf_account_no: apiData.nhf_account_no,
            client_assigned_code: apiData.client_assigned_code,
            deployment_code: apiData.deployment_code,
            onboarding_method: apiData.onboarding_method,
            custom_fields: apiData.custom_fields
          },
          
          // Personal information (from staff_personal_info table)
          personal: apiData.personal_info ? {
            middle_name: apiData.personal_info.middle_name,
            marital_status: apiData.personal_info.marital_status,
            nationality: apiData.personal_info.nationality,
            state_of_origin: apiData.personal_info.state_of_origin,
            local_government_of_origin: apiData.personal_info.local_government_of_origin,
            current_address: apiData.personal_info.current_address,
            permanent_address: apiData.personal_info.permanent_address,
            nearby_landmark: apiData.personal_info.nearby_landmark,
            mobile_phone: apiData.personal_info.mobile_phone,
            personal_email: apiData.personal_info.personal_email,
            blood_group: apiData.personal_info.blood_group,
            state_of_residence: apiData.personal_info.state_of_residence,
            lga_of_residence: apiData.personal_info.lga_of_residence,
            country: apiData.personal_info.country
          } : {},
          
          // Banking information (from staff_banking table)
          banking: apiData.banking_info ? {
            payment_mode: apiData.banking_info.payment_mode,
            bank_name: apiData.banking_info.bank_name,
            account_number: apiData.banking_info.account_number,
            wages_type: apiData.banking_info.wages_type,
            weekday_ot_rate: apiData.banking_info.weekday_ot_rate,
            holiday_ot_rate: apiData.banking_info.holiday_ot_rate,
            entitled_to_ot: apiData.banking_info.entitled_to_ot,
            pension_deduction: apiData.banking_info.pension_deduction
          } : {},
          
          // Education records (from staff_education table)
          education: apiData.education || [],
          
          // Work experience (from staff_experience table)  
          experience: apiData.experience || [],
          
          // Emergency contacts (from staff_emergency_contacts table)
          emergency_contacts: apiData.emergency_contacts || [],
          
          // Guarantors (from staff_guarantors table)
          guarantors: apiData.guarantors || [],
          
          // Legal IDs (from staff_legal_ids table)
          legal_ids: apiData.legal_ids ? {
            national_id_no: apiData.legal_ids.national_id_no,
            tax_id_no: apiData.legal_ids.tax_id_no,
            pension_pin: apiData.legal_ids.pension_pin,
            pfa_name: apiData.legal_ids.pfa_name,
            bank_verification_no: apiData.legal_ids.bank_verification_no,
            nhf_account_no: apiData.legal_ids.nhf_account_no
          } : {},
          
          // References (from staff_references table)
          references: apiData.references || [],
          
          // Client and location info
          client: apiData.client || {},
          location: apiData.service_location || {}
        };
        
        setStaffData(transformedData);
      } else {
        console.error("Failed to fetch staff details:", response.message);
        setStaffData(null);
      }
    } catch (error) {
      console.error("Error loading staff details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // TODO: Implement save functionality
      // await employeeRecordAPI.updateStaffDetails(staff.id, staffData);
      setIsEditing(false);
      if (onSave) onSave();
    } catch (error) {
      console.error("Error saving staff details:", error);
    }
  };

  const tabs = [
    { id: "personal", name: "Personal Info", icon: User },
    { id: "banking", name: "Banking", icon: CreditCard },
    { id: "education", name: "Education", icon: GraduationCap },
    { id: "experience", name: "Experience", icon: Briefcase },
    { id: "emergency", name: "Emergency Contacts", icon: Users },
    { id: "guarantors", name: "Guarantors", icon: Shield },
    { id: "legal", name: "Legal IDs", icon: FileText },
    { id: "references", name: "References", icon: UserCheck },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff details...</p>
        </div>
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load staff details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Staff List</span>
            </button>
            <div className="h-6 border-l border-gray-300" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {staffData.basic.first_name} {staffData.personal.middle_name ? staffData.personal.middle_name + ' ' : ''}{staffData.basic.last_name}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className="flex items-center text-sm text-gray-600">
                  <Building2 className="w-4 h-4 mr-1" />
                  {staffData.client.client_name || staffData.client.organisation_name || 'N/A'}
                </span>
                <span className="flex items-center text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 mr-1" />
                  {staffData.basic.job_title || 'N/A'}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  staffData.basic.status === 'active' 
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {staffData.basic.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Details</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Code
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={staffData.basic.employee_code || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    ) : (
                      <p className="text-gray-900">{staffData.basic.employee_code}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Staff ID
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={staffData.basic.staff_id || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                    ) : (
                      <p className="text-gray-900">{staffData.basic.staff_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={staffData.basic.first_name || ""}
                        onChange={(e) => setStaffData({
                          ...staffData,
                          basic: { ...staffData.basic, first_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{staffData.basic.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={staffData.personal.middle_name || ""}
                        onChange={(e) => setStaffData({
                          ...staffData,
                          personal: { ...staffData.personal, middle_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{staffData.personal.middle_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={staffData.basic.last_name || ""}
                        onChange={(e) => setStaffData({
                          ...staffData,
                          basic: { ...staffData.basic, last_name: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{staffData.basic.last_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={staffData.basic.email || ""}
                        onChange={(e) => setStaffData({
                          ...staffData,
                          basic: { ...staffData.basic, email: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{staffData.basic.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        value={staffData.basic.gender || ""}
                        onChange={(e) => setStaffData({
                          ...staffData,
                          basic: { ...staffData.basic, gender: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 capitalize">{staffData.basic.gender || 'Not specified'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Phone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={staffData.personal.mobile_phone || ""}
                        onChange={(e) => setStaffData({
                          ...staffData,
                          personal: { ...staffData.personal, mobile_phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{staffData.personal.mobile_phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marital Status
                    </label>
                    {isEditing ? (
                      <select
                        value={staffData.personal.marital_status || ""}
                        onChange={(e) => setStaffData({
                          ...staffData,
                          personal: { ...staffData.personal, marital_status: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 capitalize">{staffData.personal.marital_status}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Group
                    </label>
                    {isEditing ? (
                      <select
                        value={staffData.personal.blood_group || ""}
                        onChange={(e) => setStaffData({
                          ...staffData,
                          personal: { ...staffData.personal, blood_group: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{staffData.personal.blood_group}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Address
                    </label>
                    {isEditing ? (
                      <textarea
                        value={staffData.personal.current_address || ""}
                        onChange={(e) => setStaffData({
                          ...staffData,
                          personal: { ...staffData.personal, current_address: e.target.value }
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{staffData.personal.current_address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permanent Address
                    </label>
                    {isEditing ? (
                      <textarea
                        value={staffData.personal.permanent_address || ""}
                        onChange={(e) => setStaffData({
                          ...staffData,
                          personal: { ...staffData.personal, permanent_address: e.target.value }
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{staffData.personal.permanent_address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Banking Tab */}
          {activeTab === "banking" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Banking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                    <p className="text-gray-900 capitalize">{staffData.banking.payment_mode || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <p className="text-gray-900">{staffData.banking.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <p className="text-gray-900">{staffData.banking.account_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wages Type</label>
                    <p className="text-gray-900">{staffData.banking.wages_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weekday OT Rate</label>
                    <p className="text-gray-900">{staffData.banking.weekday_ot_rate ? `₦${staffData.banking.weekday_ot_rate}` : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Holiday OT Rate</label>
                    <p className="text-gray-900">{staffData.banking.holiday_ot_rate ? `₦${staffData.banking.holiday_ot_rate}` : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entitled to Overtime</label>
                    <p className="text-gray-900 capitalize">{staffData.banking.entitled_to_ot || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pension Deduction</label>
                    <p className="text-gray-900 capitalize">{staffData.banking.pension_deduction || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === "education" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Education Records</h3>
                {staffData.education && staffData.education.length > 0 ? (
                  <div className="space-y-4">
                    {staffData.education.map((edu, index) => (
                      <div key={edu.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                            <p className="text-gray-900">{edu.institution_name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
                            <p className="text-gray-900">{edu.certificate_type || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                            <p className="text-gray-900">{edu.specialization || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
                            <p className="text-gray-900">{edu.start_year || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Year</label>
                            <p className="text-gray-900">{edu.end_year || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                            <p className="text-gray-900">{edu.graduation_year || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Score/Class</label>
                            <p className="text-gray-900">{edu.score_class || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year Obtained</label>
                            <p className="text-gray-900">{edu.year_obtained || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No education records found</p>
                )}
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === "experience" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Work Experience</h3>
                {staffData.experience && staffData.experience.length > 0 ? (
                  <div className="space-y-4">
                    {staffData.experience.map((exp, index) => (
                      <div key={exp.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                            <p className="text-gray-900">{exp.employer_name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                            <p className="text-gray-900">{exp.designation || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <p className="text-gray-900">{exp.start_date || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <p className="text-gray-900">{exp.end_date || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Salary</label>
                            <p className="text-gray-900">{exp.last_salary ? `₦${exp.last_salary}` : 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
                            <p className="text-gray-900">{exp.reason_for_leaving || 'N/A'}</p>
                          </div>
                          <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                            <p className="text-gray-900">{exp.job_description || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No work experience records found</p>
                )}
              </div>
            </div>
          )}

          {/* Emergency Contacts Tab */}
          {activeTab === "emergency" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Emergency Contacts</h3>
                {staffData.emergency_contacts && staffData.emergency_contacts.length > 0 ? (
                  <div className="space-y-4">
                    {staffData.emergency_contacts.map((contact, index) => (
                      <div key={contact.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <p className="text-gray-900">{contact.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                            <p className="text-gray-900 capitalize">{contact.relationship || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <p className="text-gray-900">{contact.phone_number || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <p className="text-gray-900">{contact.email || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <p className="text-gray-900 capitalize">{contact.gender || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <p className="text-gray-900">{contact.date_of_birth || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Type</label>
                            <p className="text-gray-900 capitalize">{contact.contact_type || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact</label>
                            <p className="text-gray-900">{contact.is_primary ? 'Yes' : 'No'}</p>
                          </div>
                          <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <p className="text-gray-900">{contact.address || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No emergency contacts found</p>
                )}
              </div>
            </div>
          )}

          {/* Guarantors Tab */}
          {activeTab === "guarantors" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Guarantors</h3>
                {staffData.guarantors && staffData.guarantors.length > 0 ? (
                  <div className="space-y-4">
                    {staffData.guarantors.map((guarantor, index) => (
                      <div key={guarantor.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <p className="text-gray-900">{guarantor.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <p className="text-gray-900">{guarantor.phone_number || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <p className="text-gray-900">{guarantor.email || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                            <p className="text-gray-900">{guarantor.relationship_to_applicant || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <p className="text-gray-900">{guarantor.date_of_birth || 'N/A'}</p>
                          </div>
                          <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <p className="text-gray-900">{guarantor.address || 'N/A'}</p>
                          </div>
                          <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Details</label>
                            <p className="text-gray-900">{guarantor.bank_details || 'N/A'}</p>
                          </div>
                          <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employer Details</label>
                            <p className="text-gray-900">{guarantor.employer_details || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No guarantors found</p>
                )}
              </div>
            </div>
          )}

          {/* Legal IDs Tab */}
          {activeTab === "legal" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Legal Identification Numbers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">National ID Number</label>
                    <p className="text-gray-900">{staffData.legal_ids.national_id_no || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID Number</label>
                    <p className="text-gray-900">{staffData.legal_ids.tax_id_no || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pension PIN</label>
                    <p className="text-gray-900">{staffData.legal_ids.pension_pin || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PFA Name</label>
                    <p className="text-gray-900">{staffData.legal_ids.pfa_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Verification Number</label>
                    <p className="text-gray-900">{staffData.legal_ids.bank_verification_no || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NHF Account Number</label>
                    <p className="text-gray-900">{staffData.legal_ids.nhf_account_no || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* References Tab */}
          {activeTab === "references" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">References</h3>
                {staffData.references && staffData.references.length > 0 ? (
                  <div className="space-y-4">
                    {staffData.references.map((ref, index) => (
                      <div key={ref.id || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <p className="text-gray-900">{ref.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <p className="text-gray-900">{ref.phone_number || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <p className="text-gray-900">{ref.email || 'N/A'}</p>
                          </div>
                          <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <p className="text-gray-900">{ref.address || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No references found</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDetailView;
