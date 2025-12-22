"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Upload,
  X,
  Check,
  AlertCircle,
  Filter,
  Save,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useClients, useUtilityData } from "@/hooks/useClients";

const ClientMaster = ({ currentTheme, onClose }) => {
  const {
    clients,
    loading,
    error,
    pagination,
    statistics,
    createClient,
    updateClient,
    deleteClient,
    toggleStatus,
    fetchClients,
  } = useClients();

  const { industryCategories, clientCategories, statesLgas } = useUtilityData();

  const [filteredClients, setFilteredClients] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const [formData, setFormData] = useState({
    organisation_name: "",
    cac_registration_number: "",
    head_office_address: "",
    phone: "",
    industry_category: "",
    client_category: "",
    payment_terms: "",
    contact_person_name: "",
    contact_person_position: "",
    contact_person_address: "",
    pay_calculation_basis: "working_days",
    status: "active",
    contracts: [],
    // FIRS e-invoicing fields
    firs_tin: "",
    firs_business_description: "",
    firs_city: "",
    firs_postal_zone: "",
    firs_country: "NG",
    firs_contact_telephone: "",
    firs_contact_email: "",
  });

  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filter clients - only do local filtering if no pagination is being used
  useEffect(() => {
    // For paginated results, just display what the API returns
    // The backend handles search and filtering
    setFilteredClients(clients);
  }, [clients]);

  // Initialize data on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch clients when currentPage changes
  useEffect(() => {
    fetchClients({ page: currentPage, search: searchTerm, filter });
  }, [currentPage]);

  // Handle search and filter changes
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchClients({ search: term, filter, page: 1 });
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    fetchClients({ search: searchTerm, filter: newFilter, page: 1 });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.organisation_name.trim())
      newErrors.organisation_name = "Organisation name is required";
    if (!formData.industry_category)
      newErrors.industry_category = "Industry category is required";
    if (!formData.client_category)
      newErrors.client_category = "Client category is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitLoading(true);

    try {
      // Prepare client data for API
      const clientData = {
        organisation_name: formData.organisation_name,
        cac_registration_number: formData.cac_registration_number,
        head_office_address: formData.head_office_address,
        phone: formData.phone,
        industry_category: formData.industry_category,
        client_category: formData.client_category,
        payment_terms: formData.payment_terms,
        contact_person_name: formData.contact_person_name,
        contact_person_position: formData.contact_person_position,
        contact_person_address: formData.contact_person_address,
        pay_calculation_basis: formData.pay_calculation_basis,
        status: formData.status,
        contracts: formData.contracts,
        // FIRS e-invoicing fields
        firs_tin: formData.firs_tin,
        firs_business_description: formData.firs_business_description,
        firs_city: formData.firs_city,
        firs_postal_zone: formData.firs_postal_zone,
        firs_country: formData.firs_country,
        firs_contact_telephone: formData.firs_contact_telephone,
        firs_contact_email: formData.firs_contact_email,
      };

      console.log("Client data being sent to API:", clientData);
      console.log("FIRS fields in payload:", {
        firs_tin: clientData.firs_tin,
        firs_business_description: clientData.firs_business_description,
        firs_city: clientData.firs_city,
        firs_country: clientData.firs_country,
      });

      if (isEditMode) {
        await updateClient(selectedClient.id, clientData);
      } else {
        await createClient(clientData);
      }

      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error saving client:", error);
      // Handle validation errors from API
      if (error.message.includes("validation")) {
        // Extract validation errors if available
        setErrors({ submit: error.message });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      organisation_name: "",
      cac_registration_number: "",
      head_office_address: "",
      phone: "",
      industry_category: "",
      client_category: "",
      payment_terms: "",
      contact_person_name: "",
      contact_person_position: "",
      contact_person_address: "",
      pay_calculation_basis: "working_days",
      status: "active",
      contracts: [],
    });
    setErrors({});
    setIsEditMode(false);
    setSelectedClient(null);
  };

  // Helper function to format date for HTML date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    // Extract just the date part (YYYY-MM-DD) from datetime string
    return dateString.split("T")[0];
  };

  // Helper function to format date for display (user-friendly format)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
      // Extract just the date part and format it nicely
      const date = new Date(dateString.split("T")[0]);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      // Fallback to just the date part if parsing fails
      return dateString.split("T")[0];
    }
  };

  const handleEdit = (client) => {
    // Format contract dates for HTML date inputs
    const formattedContracts = (client.contracts || []).map((contract) => ({
      ...contract,
      contract_start_date: formatDateForInput(contract.contract_start_date),
      contract_end_date: formatDateForInput(contract.contract_end_date),
    }));

    setFormData({
      organisation_name: client.organisation_name || "",
      cac_registration_number: client.cac_registration_number || "",
      head_office_address: client.head_office_address || "",
      phone: client.phone || "",
      industry_category: client.industry_category || "",
      client_category: client.client_category || "",
      payment_terms: client.payment_terms || "",
      contact_person_name: client.contact_person_name || "",
      contact_person_position: client.contact_person_position || "",
      contact_person_address: client.contact_person_address || "",
      pay_calculation_basis: client.pay_calculation_basis || "working_days",
      status: client.status || "active",
      contracts: formattedContracts,
      // FIRS e-invoicing fields
      firs_tin: client.firs_tin || "",
      firs_business_description: client.firs_business_description || "",
      firs_city: client.firs_city || "",
      firs_postal_zone: client.firs_postal_zone || "",
      firs_country: client.firs_country || "NG",
      firs_contact_telephone: client.firs_contact_telephone || "",
      firs_contact_email: client.firs_contact_email || "",
    });
    setSelectedClient(client);
    setIsEditMode(true);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (clientId) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        await deleteClient(clientId);
      } catch (error) {
        console.error("Error deleting client:", error);
        alert("Failed to delete client: " + error.message);
      }
    }
  };

  const handleStatusToggle = async (clientId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await toggleStatus(clientId, newStatus);
    } catch (error) {
      console.error("Error toggling client status:", error);
      alert("Failed to update client status: " + error.message);
    }
  };

  const addContract = () => {
    const newContract = {
      id: null, // New contract
      service_type: "",
      contract_start_date: "",
      contract_end_date: "",
      status: "active",
      notes: "",
    };
    setFormData((prev) => ({
      ...prev,
      contracts: [...prev.contracts, newContract],
    }));
  };

  const removeContract = (index) => {
    setFormData((prev) => ({
      ...prev,
      contracts: prev.contracts.filter((_, i) => i !== index),
    }));
  };

  const updateContract = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      contracts: prev.contracts.map((contract, i) =>
        i === index ? { ...contract, [field]: value } : contract
      ),
    }));
  };

  const toggleRowExpansion = (clientId) => {
    setExpandedRows((prev) => {
      const newExpandedRows = new Set(prev);
      if (newExpandedRows.has(clientId)) {
        newExpandedRows.delete(clientId);
      } else {
        newExpandedRows.add(clientId);
      }
      return newExpandedRows;
    });
  };

  // Main render - show form modal if open
  if (isAddModalOpen) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {isEditMode ? "Edit Client" : "Add New Client"}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={`p-2 rounded-lg ${currentTheme.hover} ${currentTheme.textSecondary} hover:text-red-500 transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div
                  className={`p-4 rounded-xl border ${currentTheme.border} bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/20`}
                >
                  <h3
                    className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4 flex items-center`}
                  >
                    <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                    Basic Information
                  </h3>

                  {/* Organisation Name - FIRST POSITION */}
                  <div className="mb-4">
                    <label
                      className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                    >
                      Name of Organisation *
                    </label>
                    <input
                      type="text"
                      value={formData.organisation_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          organisation_name: e.target.value,
                        }))
                      }
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.organisation_name
                          ? "border-red-500"
                          : currentTheme.border
                      } ${currentTheme.cardBg} ${
                        currentTheme.textPrimary
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Enter organisation name"
                    />
                    {errors.organisation_name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.organisation_name}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        CAC Registration Number
                      </label>
                      <input
                        type="text"
                        value={formData.cac_registration_number || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cac_registration_number: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="CAC Registration Number"
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                    >
                      Head Office Address
                    </label>
                    <textarea
                      value={formData.head_office_address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          head_office_address: e.target.value,
                        }))
                      }
                      rows={3}
                      className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                      placeholder="Head office address"
                    />
                  </div>
                </div>

                {/* Contact & Category */}
                <div
                  className={`p-4 rounded-xl border ${currentTheme.border} bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-900/20`}
                >
                  <h3
                    className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4 flex items-center`}
                  >
                    <Phone className="w-5 h-5 mr-2 text-green-600" />
                    Classification
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Industry Category *
                      </label>
                      <select
                        value={formData.industry_category}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            industry_category: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.industry_category
                            ? "border-red-500"
                            : currentTheme.border
                        } ${currentTheme.cardBg} ${
                          currentTheme.textPrimary
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">Select Industry</option>
                        {industryCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {errors.industry_category && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.industry_category}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Business Entity Type *
                      </label>
                      <select
                        value={formData.client_category}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            client_category: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.client_category
                            ? "border-red-500"
                            : currentTheme.border
                        } ${currentTheme.cardBg} ${
                          currentTheme.textPrimary
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">Select Business Entity Type</option>
                        {clientCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {errors.client_category && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.client_category}
                        </p>
                      )}
                    </div>

                    {/* Pay Calculation Basis */}
                    <div>
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Pay Calculation Basis *
                      </label>
                      <select
                        value={formData.pay_calculation_basis}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pay_calculation_basis: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.pay_calculation_basis
                            ? "border-red-500"
                            : currentTheme.border
                        } ${currentTheme.cardBg} ${
                          currentTheme.textPrimary
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="working_days">
                          Working Days (Monday-Friday)
                        </option>
                        <option value="calendar_days">
                          Calendar Days (Full Month)
                        </option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Basis for payroll calculations and invoicing
                      </p>
                      {errors.pay_calculation_basis && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.pay_calculation_basis}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Contract Management */}
              <div className="space-y-6">
                {/* Contract Management */}
                <div
                  className={`p-4 rounded-xl border ${currentTheme.border} bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/20`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className={`text-lg font-semibold ${currentTheme.textPrimary} flex items-center`}
                    >
                      <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                      Client Contracts
                    </h3>
                    <button
                      type="button"
                      onClick={addContract}
                      className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Contract</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {formData.contracts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No contracts added yet</p>
                        <p className="text-sm">
                          Click "Add Contract" to get started
                        </p>
                      </div>
                    ) : (
                      formData.contracts.map((contract, index) => (
                        <div
                          key={index}
                          className={`p-4 border ${currentTheme.border} rounded-lg bg-white dark:bg-gray-800 space-y-3`}
                        >
                          <div className="flex items-center justify-between">
                            <h4
                              className={`font-medium ${currentTheme.textPrimary}`}
                            >
                              Contract {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeContract(index)}
                              className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label
                                className={`block text-xs font-medium ${currentTheme.textPrimary} mb-1`}
                              >
                                Service Type
                              </label>
                              <select
                                value={contract.service_type}
                                onChange={(e) =>
                                  updateContract(
                                    index,
                                    "service_type",
                                    e.target.value
                                  )
                                }
                                className={`w-full px-3 py-2 rounded border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} text-sm focus:outline-none focus:ring-1 focus:ring-purple-500`}
                              >
                                <option value="">Select Service Type</option>
                                <option value="Recruitment Service">
                                  Recruitment Service
                                </option>
                                <option value="Temporary Staff Service">
                                  Temporary Staff Service
                                </option>
                                <option value="Managed Staff Service">
                                  Managed Staff Service
                                </option>
                                <option value="Payroll Services">
                                  Payroll Services
                                </option>
                              </select>
                            </div>

                            <div>
                              <label
                                className={`block text-xs font-medium ${currentTheme.textPrimary} mb-1`}
                              >
                                Status
                              </label>
                              <select
                                value={contract.status}
                                onChange={(e) =>
                                  updateContract(
                                    index,
                                    "status",
                                    e.target.value
                                  )
                                }
                                className={`w-full px-3 py-2 rounded border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} text-sm focus:outline-none focus:ring-1 focus:ring-purple-500`}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="expired">Expired</option>
                                <option value="terminated">Terminated</option>
                              </select>
                            </div>

                            <div>
                              <label
                                className={`block text-xs font-medium ${currentTheme.textPrimary} mb-1`}
                              >
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={contract.contract_start_date}
                                onChange={(e) =>
                                  updateContract(
                                    index,
                                    "contract_start_date",
                                    e.target.value
                                  )
                                }
                                className={`w-full px-3 py-2 rounded border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} text-sm focus:outline-none focus:ring-1 focus:ring-purple-500`}
                              />
                            </div>

                            <div>
                              <label
                                className={`block text-xs font-medium ${currentTheme.textPrimary} mb-1`}
                              >
                                End Date
                              </label>
                              <input
                                type="date"
                                value={contract.contract_end_date}
                                onChange={(e) =>
                                  updateContract(
                                    index,
                                    "contract_end_date",
                                    e.target.value
                                  )
                                }
                                className={`w-full px-3 py-2 rounded border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} text-sm focus:outline-none focus:ring-1 focus:ring-purple-500`}
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              className={`block text-xs font-medium ${currentTheme.textPrimary} mb-1`}
                            >
                              Notes
                            </label>
                            <textarea
                              value={contract.notes || ""}
                              onChange={(e) =>
                                updateContract(index, "notes", e.target.value)
                              }
                              rows={2}
                              className={`w-full px-3 py-2 rounded border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none`}
                              placeholder="Contract notes..."
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Invoice & Payment Information */}
                <div
                  className={`p-4 rounded-xl border ${currentTheme.border} bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-900/20`}
                >
                  <h3
                    className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4 flex items-center`}
                  >
                    <DollarSign className="w-5 h-5 mr-2 text-orange-600" />
                    Invoice & Payment Information
                  </h3>

                  <div className="space-y-4">
                    {/* Payment Terms */}
                    <div>
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Payment Terms
                      </label>
                      <input
                        type="text"
                        value={formData.payment_terms || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            payment_terms: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                        placeholder="e.g., Net 30 days, 15 days from invoice date"
                      />
                    </div>

                    {/* Contact Person Name */}
                    <div>
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Contact Person Name
                      </label>
                      <input
                        type="text"
                        value={formData.contact_person_name || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contact_person_name: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                        placeholder="Primary contact person name"
                      />
                    </div>

                    {/* Contact Person Position */}
                    <div>
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Contact Person Position
                      </label>
                      <input
                        type="text"
                        value={formData.contact_person_position || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contact_person_position: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                        placeholder="e.g., HR Manager, Finance Director"
                      />
                    </div>

                    {/* Contact Person Address */}
                    <div>
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Contact Person Address
                      </label>
                      <textarea
                        value={formData.contact_person_address || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contact_person_address: e.target.value,
                          }))
                        }
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none`}
                        placeholder="Contact person address"
                      />
                    </div>

                    {/* FIRS E-Invoicing Section */}
                    <div className="pt-6 border-t border-orange-200">
                      <h4
                        className={`text-md font-semibold ${currentTheme.textPrimary} mb-4 flex items-center`}
                      >
                        <FileText className="w-4 h-4 mr-2 text-orange-600" />
                        FIRS E-Invoicing Settings
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* TIN */}
                        <div>
                          <label
                            className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                          >
                            Tax Identification Number (TIN) *
                          </label>
                          <input
                            type="text"
                            value={formData.firs_tin || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                firs_tin: e.target.value,
                              }))
                            }
                            className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                            placeholder="Enter TIN for FIRS compliance"
                          />
                        </div>

                        {/* Business Description */}
                        <div>
                          <label
                            className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                          >
                            Business Description
                          </label>
                          <input
                            type="text"
                            value={formData.firs_business_description || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                firs_business_description: e.target.value,
                              }))
                            }
                            className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                            placeholder="Brief description of business"
                          />
                        </div>

                        {/* City */}
                        <div>
                          <label
                            className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                          >
                            City
                          </label>
                          <input
                            type="text"
                            value={formData.firs_city || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                firs_city: e.target.value,
                              }))
                            }
                            className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                            placeholder="City"
                          />
                        </div>

                        {/* Postal Zone */}
                        <div>
                          <label
                            className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                          >
                            Postal Zone
                          </label>
                          <input
                            type="text"
                            value={formData.firs_postal_zone || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                firs_postal_zone: e.target.value,
                              }))
                            }
                            className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                            placeholder="Postal code or zone"
                          />
                        </div>

                        {/* Country */}
                        <div>
                          <label
                            className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                          >
                            Country
                          </label>
                          <select
                            value={formData.firs_country || "NG"}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                firs_country: e.target.value,
                              }))
                            }
                            className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                          >
                            <option value="NG">Nigeria</option>
                            <option value="US">United States</option>
                            <option value="GB">United Kingdom</option>
                            <option value="CA">Canada</option>
                            <option value="AU">Australia</option>
                          </select>
                        </div>

                        {/* Contact Telephone */}
                        <div>
                          <label
                            className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                          >
                            Contact Telephone
                          </label>
                          <input
                            type="text"
                            value={formData.firs_contact_telephone || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                firs_contact_telephone: e.target.value,
                              }))
                            }
                            className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                            placeholder="+234-XXX-XXX-XXXX"
                          />
                        </div>
                      </div>

                      {/* Contact Email - Full Width */}
                      <div className="mt-4">
                        <label
                          className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                        >
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={formData.firs_contact_email || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firs_contact_email: e.target.value,
                            }))
                          }
                          className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                          placeholder="contact@company.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Used for FIRS correspondence and notifications
                        </p>
                      </div>

                      {/* FIRS Status Indicator */}
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              formData.firs_tin ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          <span
                            className={`text-sm ${
                              formData.firs_tin
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {formData.firs_tin
                              ? "Ready for FIRS e-invoicing"
                              : "TIN required for FIRS integration"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div
                  className={`p-4 rounded-xl border ${currentTheme.border} bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-900/20`}
                >
                  <h3
                    className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4`}
                  >
                    Status
                  </h3>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status === "active"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: e.target.checked ? "active" : "inactive",
                          }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.status === "active"
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.status === "active"
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </div>
                      <span
                        className={`ml-3 text-sm font-medium ${currentTheme.textPrimary}`}
                      >
                        {formData.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <Save className="w-4 h-4" />
                <span>{isEditMode ? "Update Client" : "Save Client"}</span>
              </button>
            </div>

            {errors.submit && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className={`p-6 ${currentTheme.cardBg} min-h-screen`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
              Client Master
            </h1>
            <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
              Manage client information and configurations
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          className={`p-6 rounded-xl border ${currentTheme.border} ${currentTheme.cardBg}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Total Clients
              </p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {statistics.totalClients || 0}
              </p>
            </div>
            <Building2 className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div
          className={`p-6 rounded-xl border ${currentTheme.border} ${currentTheme.cardBg}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Active Clients
              </p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {statistics.activeClients || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div
          className={`p-6 rounded-xl border ${currentTheme.border} ${currentTheme.cardBg}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Active Contracts
              </p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {statistics.activeContracts || 0}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div
          className={`p-6 rounded-xl border ${currentTheme.border} ${currentTheme.cardBg}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Total Contracts
              </p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {statistics.totalContracts || 0}
              </p>
            </div>
            <Globe className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div
        className={`p-6 rounded-xl border ${currentTheme.border} ${currentTheme.cardBg} mb-6`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className={`px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">All Clients</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div
        className={`rounded-xl border ${currentTheme.border} ${currentTheme.cardBg} overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`bg-gray-50 dark:bg-gray-800`}>
              <tr>
                <th
                  className={`px-6 py-4 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider w-12`}
                ></th>
                <th
                  className={`px-6 py-4 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Organisation
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Contact
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Category
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Contracts
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Status
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${currentTheme.border}`}>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className={`mt-2 text-sm ${currentTheme.textSecondary}`}>
                      Loading clients...
                    </p>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p
                      className={`text-lg font-medium ${currentTheme.textPrimary}`}
                    >
                      No clients found
                    </p>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>
                      {searchTerm || filter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "Get started by adding your first client"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isExpanded = expandedRows.has(client.id);
                  const hasContracts =
                    client.contracts && client.contracts.length > 0;

                  return (
                    <React.Fragment key={client.id}>
                      {/* Main Client Row */}
                      <tr
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                      >
                        {/* Expand Button */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleRowExpansion(client.id)}
                            className={`p-1 rounded transition-colors ${
                              hasContracts
                                ? "text-blue-600 hover:bg-blue-50"
                                : "text-gray-300 cursor-not-allowed"
                            }`}
                            disabled={!hasContracts}
                            title={
                              hasContracts ? "View contracts" : "No contracts"
                            }
                          >
                            {hasContracts ? (
                              isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )
                            ) : (
                              <div className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Organisation */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div
                                className={`text-sm font-medium ${currentTheme.textPrimary}`}
                              >
                                {client.organisation_name}
                              </div>
                              <div
                                className={`text-sm ${currentTheme.textSecondary}`}
                              >
                                {client.cac_registration_number ||
                                  "No CAC Number"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div
                            className={`text-sm ${currentTheme.textPrimary}`}
                          >
                            {client.phone || "No phone"}
                          </div>
                          <div
                            className={`text-sm ${currentTheme.textSecondary}`}
                          >
                            {client.head_office_address || "No address"}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <div
                            className={`text-sm ${currentTheme.textPrimary}`}
                          >
                            {client.industry_category || "N/A"}
                          </div>
                          <div
                            className={`text-sm ${currentTheme.textSecondary}`}
                          >
                            {client.client_category || "N/A"}
                          </div>
                        </td>

                        {/* Contracts Count */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-sm font-medium ${currentTheme.textPrimary}`}
                            >
                              {hasContracts ? client.contracts.length : 0}
                            </span>
                            <span
                              className={`text-xs ${currentTheme.textSecondary}`}
                            >
                              {hasContracts ? "contracts" : "no contracts"}
                            </span>
                            {hasContracts && (
                              <div className="flex space-x-1">
                                {client.contracts.map((contract, index) => (
                                  <span
                                    key={index}
                                    className={`inline-block w-2 h-2 rounded-full ${
                                      contract.status === "active"
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                                    }`}
                                    title={`${
                                      contract.service_type || "Service"
                                    } - ${contract.status || "unknown"}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              client.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {client.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(client)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Client"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleStatusToggle(client.id, client.status)
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                client.status === "active"
                                  ? "text-red-600 hover:bg-red-50"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                              title={
                                client.status === "active"
                                  ? "Deactivate"
                                  : "Activate"
                              }
                            >
                              {client.status === "active" ? (
                                <X className="w-4 h-4" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Client"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Contracts Row */}
                      {isExpanded && hasContracts && (
                        <tr className={`bg-gray-50 dark:bg-gray-800/30`}>
                          <td></td>
                          <td colSpan="6" className="px-6 py-4">
                            <div className="space-y-3">
                              <h4
                                className={`text-sm font-medium ${currentTheme.textPrimary} mb-3`}
                              >
                                Contracts ({client.contracts.length})
                              </h4>
                              <div className="grid gap-3">
                                {client.contracts.map((contract, index) => (
                                  <div
                                    key={index}
                                    className={`border ${currentTheme.border} rounded-lg p-4 bg-white dark:bg-gray-900`}
                                  >
                                    <div className="grid md:grid-cols-4 gap-4">
                                      <div>
                                        <label
                                          className={`text-xs font-medium ${currentTheme.textSecondary}`}
                                        >
                                          Service Type
                                        </label>
                                        <p
                                          className={`text-sm ${currentTheme.textPrimary} mt-1`}
                                        >
                                          {contract.service_type || "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <label
                                          className={`text-xs font-medium ${currentTheme.textSecondary}`}
                                        >
                                          Start Date
                                        </label>
                                        <p
                                          className={`text-sm ${currentTheme.textPrimary} mt-1`}
                                        >
                                          {formatDateForDisplay(
                                            contract.contract_start_date
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <label
                                          className={`text-xs font-medium ${currentTheme.textSecondary}`}
                                        >
                                          End Date
                                        </label>
                                        <p
                                          className={`text-sm ${currentTheme.textPrimary} mt-1`}
                                        >
                                          {formatDateForDisplay(
                                            contract.contract_end_date
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <label
                                          className={`text-xs font-medium ${currentTheme.textSecondary}`}
                                        >
                                          Status
                                        </label>
                                        <p className="mt-1">
                                          <span
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                              contract.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : contract.status === "inactive"
                                                ? "bg-gray-100 text-gray-800"
                                                : contract.status === "expired"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                            }`}
                                          >
                                            {(contract.status || "unknown")
                                              .charAt(0)
                                              .toUpperCase() +
                                              (
                                                contract.status || "unknown"
                                              ).slice(1)}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                    {contract.notes && (
                                      <div className="mt-3">
                                        <label
                                          className={`text-xs font-medium ${currentTheme.textSecondary}`}
                                        >
                                          Notes
                                        </label>
                                        <p
                                          className={`text-sm ${currentTheme.textPrimary} mt-1`}
                                        >
                                          {contract.notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div
            className={`px-6 py-4 border-t ${currentTheme.border} flex items-center justify-between`}
          >
            <div className={`text-sm ${currentTheme.textSecondary}`}>
              Showing {(currentPage - 1) * pagination.per_page + 1} to{" "}
              {Math.min(currentPage * pagination.per_page, pagination.total)} of{" "}
              {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border ${currentTheme.border} ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                Previous
              </button>
              <span className={`px-3 py-1 text-sm ${currentTheme.textPrimary}`}>
                Page {currentPage} of {pagination.total_pages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, pagination.total_pages)
                  )
                }
                disabled={currentPage === pagination.total_pages}
                className={`px-3 py-1 rounded border ${currentTheme.border} ${
                  currentPage === pagination.total_pages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ClientMaster;
