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
    uploadLogo,
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

  const [formData, setFormData] = useState({
    client_code: "",
    name: "",
    alias: "",
    address: "",
    state_lga_id: "",
    contact_person: "",
    industry_category: "",
    client_category: "",
    pay_structure: false,
    client_status: "Client",
    opening_balance: 0,
    currency: "Dr",
    logoFile: null,
    is_active: true,
    contract_start_date: "",
    contract_end_date: "",
  });

  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filter clients based on search and filter criteria
  useEffect(() => {
    let filtered = clients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.client_code
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          client.configuration?.contact_person
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filter !== "all") {
      filtered = filtered.filter((client) => {
        if (filter === "active") return client.status === "active";
        if (filter === "inactive") return client.status === "inactive";
        if (filter === "client")
          return client.configuration?.client_status === "Client";
        if (filter === "sundry")
          return client.configuration?.client_status === "Sundry Customer";
        return true;
      });
    }

    setFilteredClients(filtered);
  }, [searchTerm, filter, clients]);

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

    if (!formData.name.trim()) newErrors.name = "Client name is required";
    if (!formData.client_code.trim())
      newErrors.client_code = "Client code is required";
    if (!formData.contact_person.trim())
      newErrors.contact_person = "Contact person is required";
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
      // Handle logo upload first if there's a file
      let logoPath = null;
      if (formData.logoFile) {
        const uploadResult = await uploadLogo(formData.logoFile);
        if (uploadResult.success) {
          logoPath = uploadResult.data.path;
        }
      }

      // Prepare client data for API
      const clientData = {
        client_code: formData.client_code.toUpperCase(),
        name: formData.name,
        alias: formData.alias,
        prefix: formData.client_code.substring(0, 3).toUpperCase(),
        address: formData.address,
        state_lga_id: formData.state_lga_id || null,
        contact_person: formData.contact_person,
        industry_category: formData.industry_category,
        client_category: formData.client_category,
        pay_structure: formData.pay_structure,
        client_status: formData.client_status,
        opening_balance: parseFloat(formData.opening_balance) || 0,
        currency: formData.currency,
        is_active: formData.is_active,
        contract_start_date: formData.contract_start_date || null,
        contract_end_date: formData.contract_end_date || null,
        logo_path: logoPath,
      };

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
      client_code: "",
      name: "",
      alias: "",
      address: "",
      state_lga_id: "",
      contact_person: "",
      industry_category: "",
      client_category: "",
      pay_structure: false,
      client_status: "Client",
      opening_balance: 0,
      currency: "Dr",
      logoFile: null,
      is_active: true,
      contract_start_date: "",
      contract_end_date: "",
    });
    setErrors({});
    setIsEditMode(false);
    setSelectedClient(null);
  };

  const handleEdit = (client) => {
    const config = client.configuration || {};
    setFormData({
      client_code: client.client_code || "",
      name: client.name || "",
      alias: config.alias || "",
      address: client.address || "",
      state_lga_id: client.state_lga_id || "",
      contact_person: config.contact_person || "",
      industry_category: config.industry_category || "",
      client_category: config.client_category || "",
      pay_structure: config.pay_structure || false,
      client_status: config.client_status || "Client",
      opening_balance: config.opening_balance || 0,
      currency: config.currency || "Dr",
      logoFile: null,
      is_active: client.status === "active",
      contract_start_date: client.contract_start_date || "",
      contract_end_date: client.contract_end_date || "",
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
      console.error("Error toggling status:", error);
      alert("Failed to toggle status: " + error.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/gif",
        "image/svg+xml",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload a valid image file (JPEG, PNG, JPG, GIF, SVG)");
        return;
      }

      setFormData((prev) => ({ ...prev, logoFile: file }));
    }
  };

  const getClientDisplayData = (client) => {
    const config = client.configuration || {};
    return {
      ...client,
      contactPerson: config.contact_person || "N/A",
      industryCategory: config.industry_category || "N/A",
      clientCategory: config.client_category || "N/A",
      payStructure: config.pay_structure || false,
      clientStatus: config.client_status || "Client",
      openingBalance: config.opening_balance || 0,
      currency: config.currency || "Dr",
      isActive: client.status === "active",
    };
  };

  // Render directly as Client Master (no dashboard)
  return (
    <div className={`min-h-screen ${currentTheme.bg} p-6`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-blue-600 text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                Client Master
              </h1>
              <p className={`${currentTheme.textSecondary} mt-1`}>
                Manage client information and profiles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${currentTheme.hover} ${currentTheme.textSecondary} hover:text-red-500 transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 mb-6 backdrop-blur-md shadow-lg`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${currentTheme.textMuted} w-4 h-4`}
            />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Filter & Add Button */}
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">All Clients</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="client">Clients</option>
              <option value="sundry">Sundry Customers</option>
            </select>

            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-200 group`}
          >
            {/* Client Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3
                    className={`font-semibold ${currentTheme.textPrimary} text-lg`}
                  >
                    {client.name}
                  </h3>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>
                    {client.clientCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(client)}
                  className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Client Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className={`w-4 h-4 ${currentTheme.textMuted}`} />
                <span
                  className={`text-sm ${currentTheme.textSecondary} truncate`}
                >
                  {client.address || "No address provided"}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Building2 className={`w-4 h-4 ${currentTheme.textMuted}`} />
                <span className={`text-sm ${currentTheme.textSecondary}`}>
                  {client.industryCategory}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Phone className={`w-4 h-4 ${currentTheme.textMuted}`} />
                <span className={`text-sm ${currentTheme.textSecondary}`}>
                  {client.contactPerson}
                </span>
              </div>

              {getClientDisplayData(client).openingBalance !== 0 && (
                <div className="flex items-center space-x-2">
                  <DollarSign className={`w-4 h-4 ${currentTheme.textMuted}`} />
                  <span
                    className={`text-sm font-medium ${
                      getClientDisplayData(client).currency === "Dr"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    ₦
                    {getClientDisplayData(
                      client
                    ).openingBalance.toLocaleString()}{" "}
                    ({getClientDisplayData(client).currency})
                  </span>
                </div>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.status === "Client"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                  }`}
                >
                  {client.status}
                </span>

                {client.payStructure && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Pay Structure
                  </span>
                )}
              </div>

              <div
                className={`w-3 h-3 rounded-full ${
                  client.isActive ? "bg-green-500" : "bg-red-500"
                }`}
                title={client.isActive ? "Active" : "Inactive"}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`${currentTheme.cardBg} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-inherit rounded-t-2xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2
                  className={`text-2xl font-bold ${currentTheme.textPrimary}`}
                >
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
            <form onSubmit={handleSubmit} className="p-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                        >
                          Client Code *
                        </label>
                        <input
                          type="text"
                          value={formData.clientCode}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              clientCode: e.target.value.toUpperCase(),
                            }))
                          }
                          className={`w-full px-4 py-3 rounded-lg border ${
                            errors.clientCode
                              ? "border-red-500"
                              : currentTheme.border
                          } ${currentTheme.cardBg} ${
                            currentTheme.textPrimary
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="e.g., ACC001"
                        />
                        {errors.clientCode && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.clientCode}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                        >
                          PF Number
                        </label>
                        <input
                          type="text"
                          value={formData.pfNo}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pfNo: e.target.value,
                            }))
                          }
                          className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="PF Number"
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                        >
                          Registration Number
                        </label>
                        <input
                          type="text"
                          value={formData.regNo}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              regNo: e.target.value,
                            }))
                          }
                          className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Registration Number"
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                        >
                          FIRS Number
                        </label>
                        <input
                          type="text"
                          value={formData.firsNo}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firsNo: e.target.value,
                            }))
                          }
                          className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="FIRS Number"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Client/Customer Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.name ? "border-red-500" : currentTheme.border
                        } ${currentTheme.cardBg} ${
                          currentTheme.textPrimary
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Enter client name"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Alias
                      </label>
                      <input
                        type="text"
                        value={formData.alias}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            alias: e.target.value,
                          }))
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Client alias or short name"
                      />
                    </div>

                    <div className="mt-4">
                      <label
                        className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                      >
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        rows={3}
                        className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                        placeholder="Client address"
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
                      Contact & Classification
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label
                          className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                        >
                          Contact Person *
                        </label>
                        <input
                          type="text"
                          value={formData.contactPerson}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              contactPerson: e.target.value,
                            }))
                          }
                          className={`w-full px-4 py-3 rounded-lg border ${
                            errors.contactPerson
                              ? "border-red-500"
                              : currentTheme.border
                          } ${currentTheme.cardBg} ${
                            currentTheme.textPrimary
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Primary contact person"
                        />
                        {errors.contactPerson && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.contactPerson}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                        >
                          Industry/Sector *
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
                          {industryCategories.map((industry) => (
                            <option key={industry} value={industry}>
                              {industry}
                            </option>
                          ))}
                        </select>

                        {errors.industryCategory && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.industryCategory}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                        >
                          Client Category *
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
                          <option value="">Select Category</option>
                          {clientCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        {errors.clientCategory && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.clientCategory}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Settings & Status */}
                  <div
                    className={`p-4 rounded-xl border ${currentTheme.border} bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/20`}
                  >
                    <h3
                      className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4 flex items-center`}
                    >
                      <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                      Settings & Status
                    </h3>

                    <div className="space-y-4">
                      {/* Pay Structure Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                        <div>
                          <label
                            className={`text-sm font-medium ${currentTheme.textPrimary}`}
                          >
                            Pay Structure
                          </label>
                          <p
                            className={`text-xs ${currentTheme.textSecondary}`}
                          >
                            Enable structured payroll
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.payStructure}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                payStructure: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Status Selection */}
                      <div>
                        <label
                          className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                        >
                          Status
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label
                            className={`flex items-center p-3 rounded-lg border ${
                              formData.status === "Client"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                : currentTheme.border
                            } cursor-pointer transition-colors`}
                          >
                            <input
                              type="radio"
                              name="status"
                              value="Client"
                              checked={formData.status === "Client"}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  status: e.target.value,
                                }))
                              }
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                formData.status === "Client"
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              } flex items-center justify-center`}
                            >
                              {formData.status === "Client" && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${currentTheme.textPrimary}`}
                            >
                              Client
                            </span>
                          </label>

                          <label
                            className={`flex items-center p-3 rounded-lg border ${
                              formData.status === "Sundry Customer"
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                                : currentTheme.border
                            } cursor-pointer transition-colors`}
                          >
                            <input
                              type="radio"
                              name="status"
                              value="Sundry Customer"
                              checked={formData.status === "Sundry Customer"}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  status: e.target.value,
                                }))
                              }
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                formData.status === "Sundry Customer"
                                  ? "border-purple-500 bg-purple-500"
                                  : "border-gray-300"
                              } flex items-center justify-center`}
                            >
                              {formData.status === "Sundry Customer" && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${currentTheme.textPrimary}`}
                            >
                              Sundry Customer
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Opening Balance */}
                      <div>
                        <label
                          className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
                        >
                          Opening Balance
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.openingBalance}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                openingBalance: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className={`flex-1 px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="0.00"
                          />
                          <select
                            value={formData.currency}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                currency: e.target.value,
                              }))
                            }
                            className={`px-4 py-3 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="Dr">Dr</option>
                            <option value="Cr">Cr</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div
                    className={`p-4 rounded-xl border ${currentTheme.border} bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-900/20`}
                  >
                    <h3
                      className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4 flex items-center`}
                    >
                      <Upload className="w-5 h-5 mr-2 text-orange-600" />
                      Client Logo
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <label
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${currentTheme.border} rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload
                              className={`w-8 h-8 mb-2 ${currentTheme.textMuted}`}
                            />
                            <p
                              className={`mb-2 text-sm ${currentTheme.textSecondary}`}
                            >
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className={`text-xs ${currentTheme.textMuted}`}>
                              PNG, JPG or SVG (MAX. 2MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>

                      {formData.logoFile && (
                        <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800 dark:text-green-300">
                            {formData.logoFile.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Status */}
                  <div
                    className={`p-4 rounded-xl border ${currentTheme.border} bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/20`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3
                          className={`text-lg font-semibold ${currentTheme.textPrimary} flex items-center`}
                        >
                          <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                          Active Status
                        </h3>
                        <p
                          className={`text-sm ${currentTheme.textSecondary} mt-1`}
                        >
                          Deactivate to suspend client operations
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              isActive: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-6 py-3 rounded-lg ${currentTheme.hover} ${currentTheme.textSecondary} font-medium transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isEditMode ? "Update Client" : "Add Client"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div
          className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-12 text-center backdrop-blur-md shadow-lg`}
        >
          <Building2
            className={`w-16 h-16 ${currentTheme.textMuted} mx-auto mb-4`}
          />
          <h3
            className={`text-xl font-semibold ${currentTheme.textPrimary} mb-2`}
          >
            {searchTerm || filter !== "all"
              ? "No clients found"
              : "No clients yet"}
          </h3>
          <p className={`${currentTheme.textSecondary} mb-6`}>
            {searchTerm || filter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first client"}
          </p>
          {!searchTerm && filter === "all" && (
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Client</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientMaster;
