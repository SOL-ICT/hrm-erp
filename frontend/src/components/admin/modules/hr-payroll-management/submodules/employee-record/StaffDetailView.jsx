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
      
      // TODO: Replace with actual API call
      // const response = await employeeRecordAPI.getStaffDetails(staff.id);
      
      // Mock comprehensive data structure based on database schema
      const mockData = {
        // Basic staff info (from staff table)
        basic: {
          id: staff.id,
          candidate_id: staff.candidate_id,
          client_id: staff.client_id,
          staff_type_id: staff.staff_type_id,
          employee_code: staff.employee_code,
          staff_id: staff.staff_id,
          email: staff.email,
          first_name: staff.first_name,
          last_name: staff.last_name,
          entry_date: staff.entry_date,
          end_date: staff.end_date,
          appointment_status: staff.appointment_status,
          employment_type: staff.employment_type,
          status: staff.status,
          job_title: staff.job_title,
          department: staff.department,
          location: staff.location,
          supervisor_id: staff.supervisor_id,
          leave_category_level: staff.leave_category_level,
          appraisal_category: staff.appraisal_category,
          tax_id_no: staff.tax_id_no,
          pf_no: staff.pf_no,
          pf_administrator: staff.pf_administrator,
          pfa_code: staff.pfa_code,
          bv_no: staff.bv_no,
          nhf_account_no: staff.nhf_account_no,
          client_assigned_code: staff.client_assigned_code,
          deployment_code: staff.deployment_code,
          onboarding_method: staff.onboarding_method,
          custom_fields: staff.custom_fields
        },
        
        // Personal information (from staff_personal_info table)
        personal: {
          middle_name: "Michael",
          marital_status: "single",
          nationality: "Nigerian",
          state_of_origin: "Lagos",
          local_government_of_origin: "Lagos Island",
          current_address: "123 Victoria Island, Lagos",
          permanent_address: "456 Mainland, Lagos",
          nearby_landmark: "Near City Mall",
          mobile_phone: "+234-801-234-5678",
          personal_email: "john.doe.personal@email.com",
          blood_group: "O+",
          state_of_residence: "Lagos",
          lga_of_residence: "Victoria Island",
          country: "Nigeria"
        },
        
        // Banking information (from staff_banking table)
        banking: {
          payment_mode: "bank_transfer",
          bank_name: "First Bank",
          account_number: "1234567890",
          wages_type: "Monthly",
          weekday_ot_rate: 1500.00,
          holiday_ot_rate: 2000.00,
          entitled_to_ot: "yes",
          pension_deduction: "yes"
        },
        
        // Education records (from staff_education table)
        education: [
          {
            id: 1,
            institution_name: "University of Lagos",
            certificate_type: "Bachelor's Degree",
            specialization: "Computer Science",
            start_year: 2018,
            end_year: 2022,
            graduation_year: 2022,
            score_class: "Second Class Upper",
            year_obtained: 2022,
            education_order: 1
          }
        ],
        
        // Work experience (from staff_experience table)
        experience: [
          {
            id: 1,
            employer_name: "Tech Solutions Ltd",
            designation: "Junior Developer",
            start_date: "2022-08-01",
            end_date: "2023-12-31",
            job_description: "Developed web applications using React and Node.js",
            reason_for_leaving: "Career advancement",
            last_salary: 150000.00,
            experience_order: 1
          }
        ],
        
        // Emergency contacts (from staff_emergency_contacts table)
        emergency_contacts: [
          {
            id: 1,
            contact_type: "emergency",
            name: "Jane Doe",
            relationship: "Sister",
            phone_number: "+234-802-345-6789",
            email: "jane.doe@email.com",
            address: "789 Surulere, Lagos",
            gender: "female",
            date_of_birth: "1995-03-15",
            is_primary: true,
            contact_order: 1
          }
        ],
        
        // Guarantors (from staff_guarantors table)
        guarantors: [
          {
            id: 1,
            name: "Dr. Smith Johnson",
            address: "101 Ikoyi, Lagos",
            date_of_birth: "1970-05-20",
            phone_number: "+234-803-456-7890",
            email: "smith.johnson@email.com",
            bank_details: "GTBank - 0123456789",
            employer_details: "Lagos University Teaching Hospital",
            relationship_to_applicant: "Family Doctor",
            guarantor_order: 1
          }
        ],
        
        // Legal IDs (from staff_legal_ids table)
        legal_ids: {
          national_id_no: "12345678901",
          tax_id_no: "TIN123456789",
          pension_pin: "PEN987654321",
          pfa_name: "Stanbic IBTC Pension",
          bank_verification_no: "12345678901",
          nhf_account_no: "NHF123456789"
        },
        
        // References (from staff_references table)
        references: [
          {
            id: 1,
            name: "Prof. Mary Williams",
            address: "University of Lagos, Akoka",
            phone_number: "+234-804-567-8901",
            email: "mary.williams@unilag.edu.ng",
            reference_order: 1
          }
        ],
        
        // Client and location info
        client: {
          id: staff.client_id,
          organisation_name: "ABC Corporation"
        },
        location: {
          id: 1,
          location_name: "Lagos Office",
          city: "Lagos",
          state: "Lagos"
        }
      };
      
      setStaffData(mockData);
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
                {staffData.basic.first_name} {staffData.personal.middle_name} {staffData.basic.last_name}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className="flex items-center text-sm text-gray-600">
                  <Building2 className="w-4 h-4 mr-1" />
                  {staffData.client.organisation_name}
                </span>
                <span className="flex items-center text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 mr-1" />
                  {staffData.basic.job_title}
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

          {/* Other tabs content will be implemented similarly */}
          {activeTab !== "personal" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tabs.find(t => t.id === activeTab)?.name} Tab
                </h3>
                <p className="text-gray-600">
                  This section will display detailed {tabs.find(t => t.id === activeTab)?.name.toLowerCase()} information and will be fully implemented with editable fields.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDetailView;
