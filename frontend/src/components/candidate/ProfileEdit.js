"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileEdit({ candidateProfile, onSave, onCancel }) {
  const { getUserPreferences } = useAuth();
  const preferences = getUserPreferences();

  // Form data state
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    formal_name: "",
    gender: "",
    date_of_birth: "",
    marital_status: "",
    nationality: "Nigeria",
    state_of_origin: "",
    local_government: "",
    state_of_residence: "",
    local_government_residence: "",
    national_id_no: "",
    phone_primary: "",
    phone_secondary: "",
    address_current: "",
    address_permanent: "",
    blood_group: "",
  });

  // Component state
  const [statesLgas, setStatesLgas] = useState([]);
  const [selectedOriginState, setSelectedOriginState] = useState("");
  const [selectedResidenceState, setSelectedResidenceState] = useState("");
  const [availableOriginLgas, setAvailableOriginLgas] = useState([]);
  const [availableResidenceLgas, setAvailableResidenceLgas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [errors, setErrors] = useState({});

  // Helper function to update available LGAs
  const updateAvailableLgas = (stateName, type) => {
    if (!stateName || !statesLgas.length) return;

    const lgas = statesLgas
      .filter((item) => item.state_name === stateName)
      .map((item) => ({
        name: item.lga_name,
        code: item.lga_code,
        isCapital: item.is_capital,
      }))
      .sort((a, b) => {
        if (a.isCapital && !b.isCapital) return -1;
        if (!a.isCapital && b.isCapital) return 1;
        return a.name.localeCompare(b.name);
      });

    if (type === "origin") {
      setAvailableOriginLgas(lgas);
    } else {
      setAvailableResidenceLgas(lgas);
    }
  };

  // Calculate unique states
  const uniqueStates = [...new Set(statesLgas.map((item) => item.state_name))]
    .map((stateName) => {
      const stateData = statesLgas.find(
        (item) => item.state_name === stateName
      );
      return {
        name: stateName,
        code: stateData?.state_code || "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Fetch states/LGAs data
  useEffect(() => {
    const fetchStatesLgas = async () => {
      try {
        setIsLoadingStates(true);
        console.log("Fetching states/LGAs from API...");

        const response = await fetch("http://localhost:8000/api/states-lgas", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        console.log("API Response status:", response.status);

        if (response.ok) {
          const result = await response.json();
          console.log("API Response data:", result);

          // Based on your actual API response structure
          if (result.status === "success" && Array.isArray(result.states)) {
            // Flatten the nested structure
            const flattenedData = [];
            result.states.forEach((stateObj) => {
              if (stateObj.lgas && Array.isArray(stateObj.lgas)) {
                stateObj.lgas.forEach((lga) => {
                  flattenedData.push({
                    state_name: stateObj.state,
                    state_code: stateObj.code,
                    lga_name: lga.name,
                    lga_code: lga.code,
                    is_capital: lga.isCapital || false,
                  });
                });
              }
            });

            setStatesLgas(flattenedData);
            console.log(
              "States loaded successfully:",
              flattenedData.length,
              "LGA records"
            );
          } else {
            console.error("Unexpected API response structure:", result);
            setStatesLgas([]);
          }
        } else {
          console.error(
            "API request failed:",
            response.status,
            response.statusText
          );
          setStatesLgas([]);
        }
      } catch (error) {
        console.error("Error fetching states/LGAs:", error);
        setStatesLgas([]);
      } finally {
        setIsLoadingStates(false);
      }
    };

    fetchStatesLgas();
  }, []);

  // Populate form data when candidateProfile changes
  useEffect(() => {
    if (candidateProfile) {
      setFormData({
        first_name: candidateProfile.first_name || "",
        middle_name: candidateProfile.middle_name || "",
        last_name: candidateProfile.last_name || "",
        formal_name: candidateProfile.formal_name || "",
        gender: candidateProfile.gender || "",
        date_of_birth: candidateProfile.date_of_birth || "",
        marital_status: candidateProfile.marital_status || "",
        nationality: candidateProfile.nationality || "Nigeria",
        state_of_origin: candidateProfile.state_of_origin || "",
        local_government: candidateProfile.local_government || "",
        state_of_residence: candidateProfile.state_of_residence || "",
        local_government_residence:
          candidateProfile.local_government_residence || "",
        national_id_no: candidateProfile.national_id_no || "",
        phone_primary: candidateProfile.phone_primary || "",
        phone_secondary: candidateProfile.phone_secondary || "",
        address_current: candidateProfile.address_current || "",
        address_permanent: candidateProfile.address_permanent || "",
        blood_group: candidateProfile.blood_group || "",
      });

      // Set up origin state and LGAs
      if (candidateProfile.state_of_origin) {
        setSelectedOriginState(candidateProfile.state_of_origin);
      }

      // Set up residence state and LGAs
      if (candidateProfile.state_of_residence) {
        setSelectedResidenceState(candidateProfile.state_of_residence);
      }
    }
  }, [candidateProfile]);

  // Update LGAs when states data is loaded or selected states change
  useEffect(() => {
    if (statesLgas.length > 0) {
      if (selectedOriginState) {
        updateAvailableLgas(selectedOriginState, "origin");
      }
      if (selectedResidenceState) {
        updateAvailableLgas(selectedResidenceState, "residence");
      }
    }
  }, [statesLgas, selectedOriginState, selectedResidenceState]);

  // Handle state changes
  const handleOriginStateChange = (stateName) => {
    setSelectedOriginState(stateName);
    setFormData((prev) => ({
      ...prev,
      state_of_origin: stateName,
      local_government: "",
    }));
    updateAvailableLgas(stateName, "origin");
  };

  const handleResidenceStateChange = (stateName) => {
    setSelectedResidenceState(stateName);
    setFormData((prev) => ({
      ...prev,
      state_of_residence: stateName,
      local_government_residence: "",
    }));
    updateAvailableLgas(stateName, "residence");
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Auto-generate formal name
    if (
      name === "first_name" ||
      name === "middle_name" ||
      name === "last_name"
    ) {
      const firstName = name === "first_name" ? value : formData.first_name;
      const middleName = name === "middle_name" ? value : formData.middle_name;
      const lastName = name === "last_name" ? value : formData.last_name;

      let formalName = "";
      if (firstName && lastName) {
        const prefix =
          formData.gender === "male"
            ? "Mr."
            : formData.gender === "female"
            ? "Ms."
            : "";
        formalName = `${prefix} ${firstName}${
          middleName ? ` ${middleName}` : ""
        } ${lastName}`.trim();
        setFormData((prev) => ({
          ...prev,
          formal_name: formalName,
        }));
      }
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "first_name",
      "last_name",
      "gender",
      "date_of_birth",
      "nationality",
      "phone_primary",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    // Phone validation
    if (
      formData.phone_primary &&
      !/^(\+234|0)[0-9]{10}$/.test(formData.phone_primary.replace(/\s/g, ""))
    ) {
      newErrors.phone_primary = "Please enter a valid Nigerian phone number";
    }

    // Age validation
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 16 || age > 100) {
        newErrors.date_of_birth = "Age must be between 16 and 100 years";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const copyCurrentToPermanent = () => {
    setFormData((prev) => ({
      ...prev,
      address_permanent: prev.address_current,
    }));
  };

  const copyOriginToResidence = () => {
    setFormData((prev) => ({
      ...prev,
      state_of_residence: prev.state_of_origin,
      local_government_residence: prev.local_government,
    }));
    setSelectedResidenceState(selectedOriginState);
    setAvailableResidenceLgas(availableOriginLgas);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Edit Personal Information
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: preferences.primaryColor || "#6366f1" }}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Debug Information */}
      {statesLgas.length === 0 && !isLoadingStates && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">
            ⚠️ No States/LGAs Data Found
          </p>
          <p className="text-red-600 text-sm mt-1">
            Please check if the states_lgas table has data and the API endpoint
            is working.
          </p>
          <p className="text-red-600 text-sm">
            API URL: <code>http://localhost:8000/api/states-lgas</code>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.first_name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your first name"
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your middle name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.last_name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your last name"
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.gender ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date_of_birth ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.date_of_birth && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.date_of_birth}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marital Status
              </label>
              <select
                name="marital_status"
                value={formData.marital_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Marital Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location Information - STATE OF ORIGIN */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            State of Origin
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nigeria"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State of Origin
              </label>
              <select
                name="state_of_origin"
                value={formData.state_of_origin}
                onChange={(e) => handleOriginStateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {isLoadingStates
                    ? "Loading states..."
                    : uniqueStates.length > 0
                    ? "Select State"
                    : "No states available"}
                </option>
                {uniqueStates.map((state) => (
                  <option key={state.code} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
              {uniqueStates.length === 0 && !isLoadingStates && (
                <p className="text-red-500 text-xs mt-1">No states available</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local Government Area
              </label>
              <select
                name="local_government"
                value={formData.local_government}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedOriginState}
              >
                <option value="">
                  {selectedOriginState ? "Select LGA" : "Select state first"}
                </option>
                {availableOriginLgas.map((lga) => (
                  <option key={lga.code} value={lga.name}>
                    {lga.name} {lga.isCapital && "(Capital)"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone_primary"
                value={formData.phone_primary}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone_primary ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+234 801 234 5678"
              />
              {errors.phone_primary && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phone_primary}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Phone
              </label>
              <input
                type="tel"
                name="phone_secondary"
                value={formData.phone_secondary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+234 801 234 5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                National ID Number
              </label>
              <input
                type="text"
                name="national_id_no"
                value={formData.national_id_no}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your National ID number"
              />
            </div>
          </div>
        </div>

        {/* Address Information with State of Residence */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Address Information
          </h3>

          {/* State of Residence */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-800">
                State of Residence
              </h4>
              <button
                type="button"
                onClick={copyOriginToResidence}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Same as state of origin
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State of Residence
                </label>
                <select
                  name="state_of_residence"
                  value={formData.state_of_residence}
                  onChange={(e) => handleResidenceStateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {isLoadingStates
                      ? "Loading states..."
                      : uniqueStates.length > 0
                      ? "Select State"
                      : "No states available"}
                  </option>
                  {uniqueStates.map((state) => (
                    <option key={`res-${state.code}`} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local Government Area
                </label>
                <select
                  name="local_government_residence"
                  value={formData.local_government_residence}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedResidenceState}
                >
                  <option value="">
                    {selectedResidenceState
                      ? "Select LGA"
                      : "Select state first"}
                  </option>
                  {availableResidenceLgas.map((lga) => (
                    <option key={`res-${lga.code}`} value={lga.name}>
                      {lga.name} {lga.isCapital && "(Capital)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Address
              </label>
              <textarea
                name="address_current"
                value={formData.address_current}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your current residential address"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Permanent Address
                </label>
                <button
                  type="button"
                  onClick={copyCurrentToPermanent}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Same as current address
                </button>
              </div>
              <textarea
                name="address_permanent"
                value={formData.address_permanent}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your permanent address"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
