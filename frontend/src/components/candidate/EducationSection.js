"use client";

import React, { useState, useEffect } from "react";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";

export default function EducationForm() {
  const { user, sanctumRequest } = useAuth();
  const [primaryYear, setPrimaryYear] = useState("");
  const [secondaryYear, setSecondaryYear] = useState("");
  const [highestLevel, setHighestLevel] = useState("");
  const [primaryEducation, setPrimaryEducation] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  //for primary education
  const currentYear = new Date().getFullYear(); // 2025
  const endYear = currentYear - 5; // 2020
  const years = Array.from({ length: endYear - 1949 }, (_, i) => endYear - i); // From 1950 to 2020

  // Fetch primary education on mount
  const fetchPrimaryEducation = async () => {
    if (!user?.id) {
      setPrimaryEducation(null);
      setIsFormVisible(true);
      return;
    }
    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/primary-education`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.data) {
          setPrimaryEducation(data.data);
          setPrimaryYear(data.data.primary_year || "");
          setSecondaryYear(data.data.secondary_year || "");
          setHighestLevel(data.data.highest_level || "");
          setIsFormVisible(false);
        } else {
          setPrimaryEducation(null);
          setIsFormVisible(true);
        }
      } else {
        const errorText = await response.text();
        console.error("Fetch failed:", errorText);
        setPrimaryEducation(null);
        setIsFormVisible(true);
      }
    } catch (error) {
      console.error("Error fetching primary education:", error);
      setPrimaryEducation(null);
      setIsFormVisible(true);
    }
  };

  // Save primary education
  const savePrimaryEducation = async (data) => {
    if (!user?.id) return;
    try {
      const url = `http://localhost:8000/api/candidates/${user.id}/primary-education`;
      const method = primaryEducation ? "PUT" : "POST";
      const response = await sanctumRequest(url, {
        method,
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.status === "success" && result.education) {
          setPrimaryEducation(result.education);
          return { success: true };
        }
      } else {
        const errorData = await response.json();
        return {
          success: false,
          errors: errorData.errors || errorData.message,
        };
      }
    } catch (error) {
      return { success: false, errors: error.message };
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!primaryYear)
      newErrors.primaryYear = "Please select primary school completion year";
    if (!secondaryYear)
      newErrors.secondaryYear =
        "Please select secondary school completion year";
    if (!highestLevel)
      newErrors.highestLevel = "Please select highest education level";
    if (
      primaryYear &&
      secondaryYear &&
      parseInt(secondaryYear) < parseInt(primaryYear)
    ) {
      newErrors.secondaryYear = "Secondary year must be after primary year";
    }
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await savePrimaryEducation({
        primary_year: primaryYear,
        secondary_year: secondaryYear,
        highest_level: highestLevel,
      });
      if (result.success) {
        setErrors({});
        setIsFormVisible(false);
      } else {
        setErrors({
          form: result.errors || "Failed to save education details",
        });
      }
    } catch {
      setErrors({
        form: "Failed to save education details. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit button
  const handleEdit = () => {
    setIsFormVisible(true);
  };

  // Handle cancel button
  const handleCancel = () => {
    setIsFormVisible(false);
    if (primaryEducation) {
      setPrimaryYear(primaryEducation.primary_year || "");
      setSecondaryYear(primaryEducation.secondary_year || "");
      setHighestLevel(primaryEducation.highest_level || "");
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (user?.id) {
      fetchPrimaryEducation();
    } else {
      setPrimaryEducation(null);
      setIsFormVisible(true);
    }
  }, [user]);

  return (
    <div className="w-full p-8 bg-white rounded-xl shadow-lg">
      {isFormVisible ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-start justify-between">
            <h2 className="text-3xl font-bold text-gray-900">
              Summary of Educational Information 🏫
            </h2>
            <p className="text-sm text-gray-600"></p>
            {errors.form && (
              <div className="flex items-center text-red-600 text-sm mt-2">
                <XCircleIcon className="h-5 w-5 mr-1" />
                {errors.form}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="primaryYear"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                What Year Did You Complete Primary School?
              </label>
              <select
                id="primaryYear"
                value={primaryYear}
                onChange={(e) => {
                  setPrimaryYear(e.target.value);
                  setErrors((prev) => ({ ...prev, primaryYear: "" }));
                }}
                className={`block w-full rounded-lg border ${
                  errors.primaryYear ? "border-red-300" : "border-gray-300"
                } 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200
                  disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                required
                disabled={isSubmitting}
                aria-describedby={
                  errors.primaryYear ? "primaryYear-error" : undefined
                }
              >
                <option value="">Select year</option>
                {years.map((yr) => (
                  <option key={`p-${yr}`} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              {errors.primaryYear && (
                <p id="primaryYear-error" className="mt-1 text-sm text-red-600">
                  {errors.primaryYear}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="secondaryYear"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                What Year Did You Complete Secondary School?
              </label>
              <select
                id="secondaryYear"
                value={secondaryYear}
                onChange={(e) => {
                  setSecondaryYear(e.target.value);
                  setErrors((prev) => ({ ...prev, secondaryYear: "" }));
                }}
                className={`block w-full rounded-lg border ${
                  errors.secondaryYear ? "border-red-300" : "border-gray-300"
                } 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200
                  disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                required
                disabled={isSubmitting}
                aria-describedby={
                  errors.secondaryYear ? "secondaryYear-error" : undefined
                }
              >
                <option value="">Select year</option>
                {years.map((yr) => (
                  <option key={`s-${yr}`} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              {errors.secondaryYear && (
                <p
                  id="secondaryYear-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.secondaryYear}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="highestLevel"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Highest Level of Education
              </label>
              <select
                id="highestLevel"
                value={highestLevel}
                onChange={(e) => {
                  setHighestLevel(e.target.value);
                  setErrors((prev) => ({ ...prev, highestLevel: "" }));
                }}
                className={`block w-full rounded-lg border ${
                  errors.highestLevel ? "border-red-300" : "border-gray-300"
                } 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200
                  disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                required
                disabled={isSubmitting}
                aria-describedby={
                  errors.highestLevel ? "highestLevel-error" : undefined
                }
              >
                <option value="">Select education level</option>
                <option value="primary">Secondary Education</option>
                <option value="secondary">Ordinary National Diploma</option>
                <option value="tertiary">HND/Bsc</option>
                <option value="tertiary">Master&apos;s Degree</option>
                <option value="tertiary">Ph.D</option>
              </select>
              {errors.highestLevel && (
                <p
                  id="highestLevel-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.highestLevel}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition-all duration-200 disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              <span className="flex items-center">
                <XCircleIcon className="h-5 w-5 mr-1" />
                Cancel
              </span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Summary of Educational Information 🏫
          </h3>
          <p className="text-sm text-gray-600">
            Primary Year: {primaryEducation?.primary_year}, Secondary Year:{" "}
            {primaryEducation?.secondary_year}, Highest Level:{" "}
            {primaryEducation?.highest_level}
          </p>
          <button
            onClick={handleEdit}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
