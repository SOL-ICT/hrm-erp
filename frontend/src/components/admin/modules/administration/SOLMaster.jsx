"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  Settings,
  Edit3,
  Trash2,
  Eye,
  ArrowLeft,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Globe,
} from "lucide-react";
import { solOfficeAPI } from "../../../../services/api";

const SOLMaster = ({ currentTheme, preferences, onBack }) => {
  const [activeTab, setActiveTab] = useState("offices");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [offices, setOffices] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // SOL Colors
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";
  const MIDNIGHT_BLUE = "#191970";

  // Form state
  const [formData, setFormData] = useState({
    office_name: "",
    office_code: "",
    zone_name: "",
    state_name: "",
    state_code: "",
    control_type: "lga",
    controlled_areas: [],
    office_address: "",
    office_phone: "",
    office_email: "",
    manager_name: "",
    is_active: true,
  });

  // Load initial data
  useEffect(() => {
    loadOffices();
    loadStatesAndLGAs();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadOffices();
    }, 300); // Debounce search

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filterState]);

  const loadOffices = async () => {
    setLoading(true);
    try {
      // Use a simpler approach for now - just set empty array
      setOffices([]);
    } catch (error) {
      console.error("Error loading offices:", error);
      alert("Error loading offices. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const loadStatesAndLGAs = async () => {
    try {
      const response = await solOfficeAPI.getStatesAndLGAs();
      const statesData = response.data;

      // Extract unique states with their zones
      const uniqueStates = [];
      const stateMap = new Map();
      statesData.forEach((item) => {
        if (!stateMap.has(item.state_code)) {
          stateMap.set(item.state_code, {
            name: item.state_name,
            code: item.state_code,
            zone: item.zone, // Map the zone to the state
          });
          uniqueStates.push({
            name: item.state_name,
            code: item.state_code,
            zone: item.zone,
          });
        }
      });
      setStates(uniqueStates);

      // Set LGAs without zone (since zone is state-dependent)
      const lgasData = statesData.map((item) => ({
        name: item.lga_name,
        code:
          item.lga_code ||
          `${item.state_code}${Math.random().toString(36).substr(2, 2)}`,
        state_code: item.state_code,
      }));
      setLgas(lgasData);
    } catch (error) {
      console.error("Error loading states and LGAs:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Auto-generate office code when office name or state changes
    if ((name === "office_name" || name === "state_code") && value) {
      const officeName = formData.office_name || ""; // Use current or empty if not set
      const stateCode = formData.state_code || ""; // Use current or empty if not set

      if (officeName.trim() && stateCode.trim()) {
        const officePrefix = officeName.substring(0, 3).toUpperCase();
        const generatedCode = `SOL-${stateCode}-${officePrefix}`;
        setFormData((prev) => ({
          ...prev,
          office_code: generatedCode,
        }));
      } else {
        // Reset office_code if either field is empty
        setFormData((prev) => ({
          ...prev,
          office_code: "",
        }));
      }
    }

    // Update state name and zone name when state code changes
    if (name === "state_code") {
      const selectedState = states.find((state) => state.code === value);
      if (selectedState) {
        setFormData((prev) => ({
          ...prev,
          state_name: selectedState.name,
          zone_name: selectedState.zone || "",
        }));
      }
    }
  };

  const handleControlledAreasChange = (areaCode, checked) => {
    setFormData((prev) => ({
      ...prev,
      controlled_areas: checked
        ? [...prev.controlled_areas, areaCode]
        : prev.controlled_areas.filter((code) => code !== areaCode),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingOffice) {
        await solOfficeAPI.update(editingOffice.id, formData);
      } else {
        await solOfficeAPI.create(formData);
      }

      loadOffices();
      resetForm();
      setShowForm(false);

      alert(
        `SOL office ${editingOffice ? "updated" : "created"} successfully!`
      );
    } catch (error) {
      console.error("Error saving office:", error);
      alert(
        `Error ${
          editingOffice ? "updating" : "creating"
        } office. Please try again.`
      );
    } finally {
      setFormLoading(false);
    }
  };
  const handleEdit = (office) => {
    setEditingOffice(office);
    setFormData(office);
    setShowForm(true);
  };

  const handleDelete = async (officeId) => {
    if (confirm("Are you sure you want to delete this office?")) {
      try {
        await solOfficeAPI.delete(officeId);
        loadOffices();
        alert("SOL office deleted successfully!");
      } catch (error) {
        console.error("Error deleting office:", error);
        alert("Error deleting office. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      office_name: "",
      office_code: "",
      state_name: "",
      state_code: "",
      control_type: "lga",
      controlled_areas: [],
      office_address: "",
      office_phone: "",
      office_email: "",
      manager_name: "",
      is_active: true,
    });
    setEditingOffice(null);
  };

  const filteredOffices = offices.filter((office) => {
    const matchesSearch =
      office.office_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.office_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState =
      filterState === "all" || office.state_code === filterState;
    return matchesSearch && matchesState;
  });

  const getAvailableAreas = () => {
    if (formData.control_type === "lga") {
      return lgas.filter((lga) => lga.state_code === formData.state_code);
    } else {
      return states.filter((state) => state.code !== formData.state_code);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
              SOL Master Management
            </h1>
            <p className={`${currentTheme.textSecondary} mt-1`}>
              Manage SOL offices and their controlled areas
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Office</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          className={`${currentTheme.cardBg} rounded-xl p-6 border ${currentTheme.border}`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {offices.length}
              </p>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Total Offices
              </p>
            </div>
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} rounded-xl p-6 border ${currentTheme.border}`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {offices.filter((o) => o.is_active).length}
              </p>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Active Offices
              </p>
            </div>
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} rounded-xl p-6 border ${currentTheme.border}`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {new Set(offices.map((o) => o.state_code)).size}
              </p>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                States Covered
              </p>
            </div>
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} rounded-xl p-6 border ${currentTheme.border}`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Globe className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {offices.reduce(
                  (total, office) =>
                    total + (office.controlled_areas?.length || 0),
                  0
                )}
              </p>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Areas Controlled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div
        className={`${currentTheme.cardBg} rounded-xl p-6 border ${currentTheme.border}`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search offices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All States</option>
              {states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Offices Table */}
      <div
        className={`${currentTheme.cardBg} rounded-xl border ${currentTheme.border} overflow-hidden`}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
            SOL Offices ({filteredOffices.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className={`mt-4 ${currentTheme.textSecondary}`}>
              Loading offices...
            </p>
          </div>
        ) : filteredOffices.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3
              className={`text-lg font-semibold ${currentTheme.textPrimary} mb-2`}
            >
              No offices found
            </h3>
            <p className={`${currentTheme.textSecondary} mb-6`}>
              Get started by adding your first SOL office
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Add First Office
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Office Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Control Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Areas Controlled
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOffices.map((office) => (
                  <tr key={office.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {office.office_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {office.office_code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {office.state_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {office.manager_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          office.control_type === "lga"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {office.control_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {office.controlled_areas?.length || 0} areas
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          office.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {office.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(office)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(office.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Office Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingOffice ? "Edit" : "Add New"} SOL Office
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]"
            >
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="office_name"
                      value={formData.office_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., Lekki Office"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="office_code"
                      value={formData.office_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., SOL-LG-LEK"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="state_code"
                      value={formData.state_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zone
                    </label>
                    <input
                      type="text"
                      value={formData.zone_name || ""}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                      placeholder={
                        formData.zone_name
                          ? ""
                          : "Automatically populated from state"
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Control Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="control_type"
                      value={formData.control_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    >
                      <option value="lga">LGA Control</option>
                      <option value="state">State Control</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Controlled Areas */}
              {formData.state_code && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Controlled{" "}
                    {formData.control_type === "lga" ? "LGAs" : "States"}
                  </h3>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {getAvailableAreas().map((area) => (
                        <label
                          key={area.code}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={formData.controlled_areas.includes(
                              area.code
                            )}
                            onChange={(e) =>
                              handleControlledAreasChange(
                                area.code,
                                e.target.checked
                              )
                            }
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-700">
                            {area.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office Address
                    </label>
                    <textarea
                      name="office_address"
                      value={formData.office_address}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder="Complete office address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office Phone
                    </label>
                    <input
                      type="tel"
                      name="office_phone"
                      value={formData.office_phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office Email
                    </label>
                    <input
                      type="email"
                      name="office_email"
                      value={formData.office_email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="office@solnigeria.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manager Name
                    </label>
                    <input
                      type="text"
                      name="manager_name"
                      value={formData.manager_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Office manager name"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">
                        Active Office
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={formLoading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{formLoading ? "Saving..." : "Save Office"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOLMaster;
