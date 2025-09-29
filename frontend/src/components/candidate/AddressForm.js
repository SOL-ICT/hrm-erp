"use client";

import React, { useState, useEffect } from "react";

export default function AddressForm({
  formData,
  setFormData,
  errors,
  handleInputChange,
  type = "current",
}) {
  const [statesLgas, setStatesLgas] = useState([]);
  const [uniqueStates, setUniqueStates] = useState([]);
  const [availableLgas, setAvailableLgas] = useState([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);

  const addressPrefix = type === "permanent" ? "permanent" : "current";

  // Fetch states/LGAs data
  useEffect(() => {
    const fetchStatesLgas = async () => {
      try {
        setIsLoadingStates(true);
        const response = await fetch("http://localhost:8000/api/states-lgas", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === "success" && Array.isArray(result.states)) {
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

            // Calculate unique states
            const unique = [
              ...new Set(flattenedData.map((item) => item.state_name)),
            ]
              .map((stateName) => {
                const stateData = flattenedData.find(
                  (item) => item.state_name === stateName
                );
                return {
                  name: stateName,
                  code: stateData?.state_code || "",
                };
              })
              .sort((a, b) => a.name.localeCompare(b.name));
            setUniqueStates(unique);
          } else {
            setStatesLgas([]);
            setUniqueStates([]);
          }
        } else {
          setStatesLgas([]);
          setUniqueStates([]);
        }
      } catch (error) {
        console.error("Error fetching states/LGAs:", error);
        setStatesLgas([]);
        setUniqueStates([]);
      } finally {
        setIsLoadingStates(false);
      }
    };

    fetchStatesLgas();
  }, []);

  // Handle state changes
  const handleResidenceStateChange = (stateName) => {
    setFormData((prev) => ({
      ...prev,
      [`state_of_residence_${addressPrefix}`]: stateName,
      [`local_government_residence_${addressPrefix}`]: "",
    }));

    if (stateName && statesLgas.length) {
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
      setAvailableLgas(lgas);
    } else {
      setAvailableLgas([]);
    }
  };

  return (
    <div className="mb-6 p-4  rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Address Section */}
        <div>
          <h5 className="text-lg font-semibold text-gray-800 mb-2">
            {type === "permanent" ? "Permanent Address" : "Address Information"}
          </h5>

          {/* State of Residence */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 ">
              {type === "permanent"
                ? "Permanent State of Residence"
                : "Current State of Residence"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              name={`state_of_residence_${addressPrefix}`}
              value={formData[`state_of_residence_${addressPrefix}`] || ""}
              onChange={(e) => handleResidenceStateChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`state_of_residence_${addressPrefix}`]
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            >
              <option value="">
                {isLoadingStates
                  ? "Loading states..."
                  : uniqueStates.length
                  ? "Select State"
                  : "No states available"}
              </option>
              {uniqueStates.map((st) => (
                <option key={st.code} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>
            {errors[`state_of_residence_${addressPrefix}`] && (
              <p className="text-red-500 text-xs mt-1">
                {errors[`state_of_residence_${addressPrefix}`]}
              </p>
            )}
          </div>

          {/* City */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <select
              name={`local_government_residence_${addressPrefix}`}
              value={
                formData[`local_government_residence_${addressPrefix}`] || ""
              }
              onChange={handleInputChange}
              disabled={!formData[`state_of_residence_${addressPrefix}`]}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`local_government_residence_${addressPrefix}`]
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            >
              <option value="">
                {formData[`state_of_residence_${addressPrefix}`]
                  ? "Select City"
                  : "Select state first"}
              </option>
              {availableLgas.map((lga) => (
                <option key={lga.code} value={lga.name}>
                  {lga.name}
                </option>
              ))}
            </select>
            {errors[`local_government_residence_${addressPrefix}`] && (
              <p className="text-red-500 text-xs mt-1">
                {errors[`local_government_residence_${addressPrefix}`]}
              </p>
            )}
          </div>

          {/* Street Address */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name={`address_${addressPrefix}`}
              value={formData[`address_${addressPrefix}`] || ""}
              onChange={handleInputChange}
              rows={1}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`address_${addressPrefix}`]
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder={`Enter your ${
                type === "permanent" ? "permanent" : "current"
              } address`}
            />
            {errors[`address_${addressPrefix}`] && (
              <p className="text-red-500 text-xs mt-1">
                {errors[`address_${addressPrefix}`]}
              </p>
            )}
          </div>

          {/* Address Line 2 - NOT required */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 2 (if necessary)
            </label>
            <textarea
              name={`address_line_2_${addressPrefix}`}
              value={formData[`address_line_2_${addressPrefix}`] || ""}
              onChange={handleInputChange}
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Eg: Apartment 3B, 2nd Floor, Near ShopRite, etc." // Adjusted placeholder
            />
          </div>
        </div>
        {/* end Address Section */}
      </div>
    </div>
  );
}
