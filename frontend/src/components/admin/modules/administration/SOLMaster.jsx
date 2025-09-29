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
  Loader,
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
  const [statistics, setStatistics] = useState({
    total_offices: 0,
    active_offices: 0,
    states_covered: 0,
  });

  // SOL Colors
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";
  const MIDNIGHT_BLUE = "#191970";

  // Form state - ✅ FIX 4: Remove created_by from frontend
  const [formData, setFormData] = useState({
    office_name: "",
    office_code: "",
    zone: "",
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
    loadStatistics();
  }, []);

  // Robust: Load states/LGAs every time modal opens, with error handling
  useEffect(() => {
    let isMounted = true;
    const fetchStates = async () => {
      if (showForm) {
        try {
          console.log("[SOLMaster] Fetching states and LGAs...");
          const response = await solOfficeAPI.getStatesAndLGAs();
          const statesData = response.states || [];
          const mappedStates = statesData.map((state) => ({
            name: state.state,
            code: state.code,
            zone: state.zone || "",
            lgas: state.lgas || [],
          }));
          console.log("[SOLMaster] Mapped states:", mappedStates);
          if (isMounted) setStates(mappedStates);
          // Flatten LGAs for easier access
          const lgasData = [];
          mappedStates.forEach((state) => {
            if (Array.isArray(state.lgas)) {
              state.lgas.forEach((lga) => {
                lgasData.push({
                  name: lga.name,
                  code: lga.code,
                  state_code: state.code,
                  isCapital: lga.isCapital,
                });
              });
            }
          });
          if (isMounted) setLgas(lgasData);
        } catch (error) {
          console.error("[SOLMaster] Error loading states and LGAs:", error);
          if (isMounted) setStates([]);
        }
      }
    };
    fetchStates();
    return () => { isMounted = false; };
  }, [showForm]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadOffices();
    }, 300); // Debounce search

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filterState]);

  // ✅ FIX 3: Restored proper API call for loading offices
  const loadOffices = async () => {
    setLoading(true);
    try {
      const params = {};

      if (searchTerm) params.search = searchTerm;
      if (filterState !== "all") params.state = filterState;

      const response = await solOfficeAPI.getAll(params);
      setOffices(response.data || []);
    } catch (error) {
      console.error("Error loading offices:", error);
      alert("Error loading offices: " + (error.message || "Please try again."));
      setOffices([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const loadStatesAndLGAs = async () => {
    try {
  console.log("[SOLMaster] Fetching states and LGAs...");
      const response = await solOfficeAPI.getStatesAndLGAs();
      const statesData = response.data?.states || [];
      // Map backend state objects to expected frontend format
      const mappedStates = statesData.map((state) => ({
        name: state.state, // backend uses 'state', frontend expects 'name'
        code: state.code,
        zone: state.zone || "",
        lgas: state.lgas || [],
      }));
  console.log("[SOLMaster] Mapped states:", mappedStates);
      setStates(mappedStates);
      // Flatten LGAs for easier access
      const lgasData = [];
      mappedStates.forEach((state) => {
        if (Array.isArray(state.lgas)) {
          state.lgas.forEach((lga) => {
            lgasData.push({
              name: lga.name,
              code: lga.code,
              state_code: state.code,
              isCapital: lga.isCapital,
            });
          });
        }
      });
  console.log("[SOLMaster] Flattened LGAs:", lgasData);
      setLgas(lgasData);
    } catch (error) {
      console.error("Error loading states and LGAs:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await solOfficeAPI.getStatistics();
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      office_name: "",
      office_code: "",
      zone: "",
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Auto-generate office code when office name or state changes
    if (name === "office_name" || name === "state_code") {
      const officeName = name === "office_name" ? value : formData.office_name;
      const stateCode = name === "state_code" ? value : formData.state_code;

      if (officeName && stateCode) {
        const officePrefix = officeName.substring(0, 3).toUpperCase();
        const generatedCode = `SOL-${stateCode}-${officePrefix}`;
        setFormData((prev) => ({
          ...prev,
          office_code: generatedCode,
        }));
      }
    }

    // Update state name and zone when state code changes
    if (name === "state_code") {
      const selectedState = states.find((state) => state.code === value);
      if (selectedState) {
        setFormData((prev) => ({
          ...prev,
          state_name: selectedState.name,
          zone: selectedState.zone ? selectedState.zone.replace(/_/g, " ").toUpperCase() : "",
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
      // Patch: Ensure zone is sent in backend format (lowercase, underscores)
      const patchedFormData = {
        ...formData,
        zone:
          formData.zone && typeof formData.zone === "string"
            ? formData.zone.replace(/\s+/g, "_").toLowerCase()
            : formData.zone,
      };
      if (editingOffice) {
        await solOfficeAPI.update(editingOffice.id, patchedFormData);
      } else {
        await solOfficeAPI.create(patchedFormData);
      }

      loadOffices();
      loadStatistics(); // Refresh statistics
      resetForm();
      setShowForm(false);

      alert(
        `SOL office ${editingOffice ? "updated" : "created"} successfully!`
      );
    } catch (error) {
      console.error("Error saving office:", error);
      alert(
        `Error ${editingOffice ? "updating" : "creating"} office: ${
          error.message || "Please try again."
        }`
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (office) => {
    setEditingOffice(office);
    setFormData({
      office_name: office.office_name || "",
      office_code: office.office_code || "",
      zone: office.zone || "",
      state_name: office.state_name || "",
      state_code: office.state_code || "",
      control_type: office.control_type || "lga",
      controlled_areas: office.controlled_areas
        ? JSON.parse(office.controlled_areas)
        : [],
      office_address: office.office_address || "",
      office_phone: office.office_phone || "",
      office_email: office.office_email || "",
      manager_name: office.manager_name || "",
      is_active: office.is_active !== undefined ? office.is_active : true,
    });
    setShowForm(true);
  };

  const handleDelete = async (officeId) => {
    if (confirm("Are you sure you want to delete this office?")) {
      try {
        await solOfficeAPI.delete(officeId);
        loadOffices();
        loadStatistics(); // Refresh statistics
        alert("SOL office deleted successfully!");
      } catch (error) {
        console.error("Error deleting office:", error);
        alert(
          "Error deleting office: " + (error.message || "Please try again.")
        );
      }
    }
  };

  // Filter offices based on search and state
  const filteredOffices = offices.filter((office) => {
    const matchesSearch = searchTerm
      ? office.office_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        office.office_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        office.state_name?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

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
            className={`p-2 rounded-lg ${currentTheme.hover} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
              SOL Office Master
            </h2>
            <p className={`${currentTheme.textSecondary} mt-1`}>
              Manage SOL Nigeria office locations and administrative zones
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          style={{ backgroundColor: SOL_BLUE }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add SOL Office
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          className={`${currentTheme.cardBg} rounded-xl p-6 ${currentTheme.border} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Total Offices
              </p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {statistics.total_offices}
              </p>
            </div>
            <Building2 className="w-8 h-8" style={{ color: SOL_BLUE }} />
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} rounded-xl p-6 ${currentTheme.border} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Active Offices
              </p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {statistics.active_offices}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} rounded-xl p-6 ${currentTheme.border} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                States Covered
              </p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {statistics.states_covered}
              </p>
            </div>
            <MapPin className="w-8 h-8" style={{ color: SOL_RED }} />
          </div>
        </div>

        <div
          className={`${currentTheme.cardBg} rounded-xl p-6 ${currentTheme.border} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>
                Coverage Rate
              </p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {Math.round((statistics.states_covered / 36) * 100)}%
              </p>
            </div>
            <Globe className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div
        className={`${currentTheme.cardBg} rounded-xl p-6 ${currentTheme.border} shadow-sm`}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search offices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.border}`}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.border}`}
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
        className={`${currentTheme.cardBg} rounded-xl ${currentTheme.border} shadow-sm overflow-hidden`}
      >
        {loading ? (
          <div className="p-12 text-center">
            <Loader
              className="w-8 h-8 animate-spin mx-auto mb-4"
              style={{ color: SOL_BLUE }}
            />
            <p className={currentTheme.textSecondary}>Loading offices...</p>
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
              {searchTerm || filterState !== "all"
                ? "No offices match your search criteria"
                : "Get started by adding your first SOL office"}
            </p>
            {!searchTerm && filterState === "all" && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 text-white rounded-lg transition-colors"
                style={{ backgroundColor: SOL_BLUE }}
              >
                Add First Office
              </button>
            )}
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
                    Location & Zone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Control Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
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
                      <div>
                        <div className="text-sm text-gray-900">
                          {office.state_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Zone: {office.zone?.replace("_", " ").toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          office.control_type === "state"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {office.control_type?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {office.manager_name || "Not assigned"}
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(office)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(office.id)}
                          className="text-red-600 hover:text-red-900"
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${currentTheme.cardBg} rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3
                className={`text-lg font-semibold ${currentTheme.textPrimary}`}
              >
                {editingOffice ? "Edit SOL Office" : "Add New SOL Office"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className={`p-2 ${currentTheme.hover} rounded-lg`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Office Name */}
              <div>
                <label
                  className={`block text-sm font-medium ${currentTheme.textPrimary} mb-1`}
                >
                  Office Name *
                </label>
                <input
                  type="text"
                  name="office_name"
                  value={formData.office_name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.border}`}
                  placeholder="Enter office name"
                />
              </div>

              {/* Office Code */}
              <div>
                <label
                  className={`block text-sm font-medium ${currentTheme.textPrimary} mb-1`}
                >
                  Office Code *
                </label>
                <input
                  type="text"
                  name="office_code"
                  value={formData.office_code}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.border}`}
                  placeholder="Auto-generated or enter custom code"
                />
              </div>

              {/* State Selection */}
              <div>
                <label
                  className={`block text-sm font-medium ${currentTheme.textPrimary} mb-1`}
                >
                  State *
                </label>
                {/* Debug log for modal rendering */}
                {console.log("[SOLMaster Modal] States for dropdown:", states)}
                {states.length === 0 ? (
                  <div className="py-2 text-center text-gray-500">
                    Loading states...
                  </div>
                ) : (
                  <select
                    name="state_code"
                    value={formData.state_code}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.border}`}
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Zone (Auto-filled) */}
              <div>
                <label
                  className={`block text-sm font-medium ${currentTheme.textPrimary} mb-1`}
                >
                  Zone
                </label>
                <input
                  type="text"
                  name="zone"
                  value={formData.zone}
                  readOnly
                  className={`w-full px-3 py-2 border rounded-lg bg-gray-50 ${currentTheme.border}`}
                  placeholder="Auto-filled based on state"
                />
              </div>

              {/* Control Type */}
              <div>
                <label
                  className={`block text-sm font-medium ${currentTheme.textPrimary} mb-1`}
                >
                  Control Type *
                </label>
                <select
                  name="control_type"
                  value={formData.control_type}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.border}`}
                >
                  <option value="lga">LGA Level Control</option>
                  <option value="state">State Level Control</option>
                </select>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium ${currentTheme.textPrimary} mb-1`}
                  >
                    Manager Name
                  </label>
                  <input
                    type="text"
                    name="manager_name"
                    value={formData.manager_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.border}`}
                    placeholder="Office manager name"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${currentTheme.textPrimary} mb-1`}
                  >
                    Office Phone
                  </label>
                  <input
                    type="tel"
                    name="office_phone"
                    value={formData.office_phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.border}`}
                    placeholder="Office phone number"
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${currentTheme.textPrimary} mb-1`}
                >
                  Office Email
                </label>
                <input
                  type="email"
                  name="office_email"
                  value={formData.office_email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.border}`}
                  placeholder="office@solnigeria.com"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${currentTheme.textPrimary} mb-1`}
                >
                  Office Address
                </label>
                <textarea
                  name="office_address"
                  value={formData.office_address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${currentTheme.border}`}
                  placeholder="Complete office address"
                />
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <label
                  className={`text-sm font-medium ${currentTheme.textPrimary}`}
                >
                  Active Office
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${currentTheme.hover} ${currentTheme.textSecondary}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: SOL_BLUE }}
                >
                  {formLoading && (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingOffice ? "Update Office" : "Create Office"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOLMaster;
