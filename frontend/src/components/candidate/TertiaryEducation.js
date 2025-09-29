"use client";

import React, { useState, useEffect } from "react";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";

const Modal = ({ children, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
const qualificationTypes = [
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Diploma",
  "Certificate",
];

export default function TertiaryEducation({
  currentTheme,
  preferences,
  user,
  initialData = [],
}) {
  const [tertiaryEducation, setTertiaryEducation] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState(null);
  const [instituteName, setInstituteName] = useState("");
  const [qualificationType, setQualificationType] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sanctumRequest } = useAuth();

  // Fetch tertiary education records
  const fetchTertiaryEducation = async () => {
    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/tertiary-education`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTertiaryEducation(data.data || []);
      } else {
        setTertiaryEducation([]);
      }
    } catch (error) {
      setTertiaryEducation([]);
      console.error("Error fetching tertiary education:", error);
    }
  };

  // Create or update tertiary education
  const saveTertiaryEducation = async (data) => {
    try {
      const url = editingEducation
        ? `http://localhost:8000/api/candidates/${user.id}/tertiary-education/${editingEducation.id}`
        : `http://localhost:8000/api/candidates/${user.id}/tertiary-education`;
      const method = editingEducation ? "PUT" : "POST";

      console.log("📤 Making request to:", url, "with method:", method);

      const response = await sanctumRequest(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        console.log("✅ Tertiary Education - Response OK, parsing JSON...");
        try {
          const result = await response.json();
          console.log(
            "✅ Tertiary Education - JSON parsed successfully:",
            result
          );
          if (editingEducation) {
            setTertiaryEducation((prev) =>
              prev.map((edu) =>
                edu.id === editingEducation.id ? result.education : edu
              )
            );
          } else {
            setTertiaryEducation((prev) => [...prev, result.education]);
          }
          return { success: true };
        } catch (jsonError) {
          console.error(
            "❌ Tertiary Education - JSON parsing failed:",
            jsonError
          );
          // Don't try to read the response again, just return error
          return { success: false, errors: "Failed to parse response" };
        }
      } else {
        console.log(
          "❌ Tertiary Education - Response not OK:",
          response.status
        );
        try {
          // Read response as text first to handle both JSON and HTML responses
          const textResponse = await response.text();
          console.log("❌ Raw response:", textResponse);

          // Try to parse as JSON
          try {
            const errorData = JSON.parse(textResponse);
            return {
              success: false,
              errors: errorData.errors || errorData.message,
            };
          } catch {
            // If it's not JSON, return the raw text
            return {
              success: false,
              errors: `Server error (${
                response.status
              }): ${textResponse.substring(0, 200)}...`,
            };
          }
        } catch (readError) {
          console.error("❌ Failed to read response:", readError);
          return {
            success: false,
            errors: `Network error: ${response.status}`,
          };
        }
      }
    } catch (error) {
      return { success: false, errors: error.message };
    }
  };

  // Delete tertiary education
  const deleteTertiaryEducation = async (id) => {
    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/tertiary-education/${id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setTertiaryEducation((prev) => prev.filter((edu) => edu.id !== id));
        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || "Failed to delete",
        };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Fetch on mount
  useEffect(() => {
    console.log("TertiaryEducation mounted with user:", user);
    console.log("TertiaryEducation received initialData:", initialData);

    // Use initialData if available, otherwise fetch
    if (initialData && initialData.length > 0) {
      console.log("Using initialData for tertiary education");
      setTertiaryEducation(initialData);
    } else if (user?.id) {
      console.log("Fetching tertiary education data");
      fetchTertiaryEducation();
    } else {
      setTertiaryEducation([]); // Clear data on logout
    }
  }, [user, initialData]);

  // Modal form handling
  const handleAddNew = () => {
    setEditingEducation(null);
    setInstituteName("");
    setQualificationType("");
    setFieldOfStudy("");
    setStartYear("");
    setEndYear("");
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (education) => {
    console.log("🔍 Editing tertiary education object:", education);
    setEditingEducation(education);
    setInstituteName(education.institute_name || "");
    setQualificationType(education.qualification_type || "");
    setFieldOfStudy(education.field_of_study || "");
    // Ensure year values are strings/numbers, not objects
    setStartYear(String(education.start_year || ""));
    setEndYear(String(education.end_year || ""));
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const result = await deleteTertiaryEducation(id);
      if (!result.success) {
        alert(`Error: ${result.message}`);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!instituteName.trim())
      newErrors.instituteName = "Please enter a valid institute name";
    if (!qualificationType)
      newErrors.qualificationType = "Please select a qualification type";
    if (!fieldOfStudy.trim())
      newErrors.fieldOfStudy = "Please enter a field of study";
    if (!startYear) newErrors.startYear = "Please select start year";
    if (startYear && endYear && parseInt(endYear) < parseInt(startYear)) {
      newErrors.endYear = "End year must be after start year";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const data = {
      institute_name: instituteName.trim(),
      qualification_type: qualificationType,
      field_of_study: fieldOfStudy.trim(),
      start_year: startYear,
      end_year: endYear || null,
    };
    const result = await saveTertiaryEducation(data);
    setIsSubmitting(false);
    if (result.success) {
      setIsModalOpen(false);
    } else {
      setErrors({ form: result.errors || "Failed to save education details" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2 flex items-center`}
          >
            <span className="mr-3">🎓</span> Tertiary Education
          </h2>
          <p className={`text-lg ${currentTheme.textSecondary}`}>
            Manage your tertiary education records
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${
              preferences.primaryColor || "#6366f1"
            }, ${preferences.primaryColor || "#6366f1"}dd)`,
          }}
        >
          Add Tertiary Education
        </button>
      </div>

      {tertiaryEducation.length > 0 ? (
        <div className="space-y-4">
          {tertiaryEducation.map((edu) => (
            <div
              key={edu.id}
              className={`${currentTheme.cardBg} backdrop-blur-md rounded-xl p-6 ${currentTheme.border} shadow-xl hover:shadow-2xl transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className={`text-lg font-semibold ${currentTheme.textPrimary}`}
                  >
                    {edu.institute_name}
                  </h3>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>
                    {edu.qualification_type} in {edu.field_of_study}
                  </p>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>
                    {edu.start_year} - {edu.end_year || "Ongoing"}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEdit(edu)}
                    className={`px-4 py-2 ${currentTheme.cardBg} rounded-lg ${currentTheme.border} ${currentTheme.hover} transition-all`}
                  >
                    <svg
                      className={`h-5 w-5 ${currentTheme.textSecondary}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(edu.id)}
                    className={`px-4 py-2 ${currentTheme.cardBg} rounded-lg ${currentTheme.border} ${currentTheme.hover} transition-all`}
                  >
                    <svg
                      className={`h-5 w-5 ${currentTheme.textSecondary}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`${currentTheme.cardBg} backdrop-blur-md rounded-xl p-16 ${currentTheme.border} shadow-xl text-center`}
        >
          <div className="max-w-md mx-auto">
            <div
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl mb-6 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${
                  preferences.primaryColor || "#6366f1"
                }, ${preferences.primaryColor || "#6366f1"}dd)`,
              }}
            >
              🎓
            </div>
            <h3
              className={`text-3xl font-bold ${currentTheme.textPrimary} mb-4`}
            >
              No Tertiary Education
            </h3>
            <p
              className={`text-lg ${currentTheme.textSecondary} mb-8 leading-relaxed`}
            >
              Add your tertiary education details to complete your profile.
            </p>
            <button
              onClick={handleAddNew}
              className="px-8 py-4 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${
                  preferences.primaryColor || "#6366f1"
                }, ${preferences.primaryColor || "#6366f1"}dd)`,
              }}
            >
              Add Tertiary Education
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6 bg-white rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingEducation
                  ? "Edit Tertiary Education"
                  : "Add Tertiary Education"}
              </h2>
              {errors.form && (
                <div className="flex items-center text-red-600 text-sm">
                  <XCircleIcon className="h-5 w-5 mr-1" />
                  {errors.form}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="instituteName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Institute Name
              </label>
              <input
                id="instituteName"
                type="text"
                autoFocus
                value={instituteName}
                onChange={(e) => {
                  setInstituteName(e.target.value);
                  setErrors((prev) => ({ ...prev, instituteName: "" }));
                }}
                onFocus={(e) => e.target.select()}
                className={`block w-full rounded-lg border ${
                  errors.instituteName ? "border-red-300" : "border-gray-300"
                } 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-none
                  disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                placeholder="e.g. University of Lagos"
                required
                disabled={isSubmitting}
                aria-describedby={
                  errors.instituteName ? "instituteName-error" : undefined
                }
              />
              {errors.instituteName && (
                <p
                  id="instituteName-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.instituteName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="qualificationType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Qualification Type
              </label>
              <select
                id="qualificationType"
                value={qualificationType}
                onChange={(e) => {
                  setQualificationType(e.target.value);
                  setErrors((prev) => ({ ...prev, qualificationType: "" }));
                }}
                onFocus={(e) => e.target.focus()}
                className={`block w-full rounded-lg border ${
                  errors.qualificationType
                    ? "border-red-300"
                    : "border-gray-300"
                } 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-none
                  disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                required
                disabled={isSubmitting}
                aria-describedby={
                  errors.qualificationType
                    ? "qualificationType-error"
                    : undefined
                }
              >
                <option value="">Select qualification type</option>
                {qualificationTypes.map((type) => (
                  <option key={`qual-${type}`} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.qualificationType && (
                <p
                  id="qualificationType-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.qualificationType}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="fieldOfStudy"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Field of Study
              </label>
              <input
                id="fieldOfStudy"
                type="text"
                value={fieldOfStudy}
                onChange={(e) => {
                  setFieldOfStudy(e.target.value);
                  setErrors((prev) => ({ ...prev, fieldOfStudy: "" }));
                }}
                onFocus={(e) => e.target.select()}
                className={`block w-full rounded-lg border ${
                  errors.fieldOfStudy ? "border-red-300" : "border-gray-300"
                } 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-none
                  disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                placeholder="e.g. Computer Science"
                required
                disabled={isSubmitting}
                aria-describedby={
                  errors.fieldOfStudy ? "fieldOfStudy-error" : undefined
                }
              />
              {errors.fieldOfStudy && (
                <p
                  id="fieldOfStudy-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.fieldOfStudy}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="startYear"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Year
                </label>
                <select
                  id="startYear"
                  value={startYear}
                  onChange={(e) => {
                    setStartYear(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      startYear: "",
                      endYear: "",
                    }));
                  }}
                  onFocus={(e) => e.target.focus()}
                  className={`block w-full rounded-lg border ${
                    errors.startYear ? "border-red-300" : "border-gray-300"
                  } 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-none
                    disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                  required
                  disabled={isSubmitting}
                  aria-describedby={
                    errors.startYear ? "startYear-error" : undefined
                  }
                >
                  <option value="">Select year</option>
                  {years.map((yr) => (
                    <option key={`tert-start-${yr}`} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
                {errors.startYear && (
                  <p id="startYear-error" className="mt-1 text-sm text-red-600">
                    {errors.startYear}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="endYear"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Year
                </label>
                <select
                  id="endYear"
                  value={endYear}
                  onChange={(e) => {
                    setEndYear(e.target.value);
                    setErrors((prev) => ({ ...prev, endYear: "" }));
                  }}
                  onFocus={(e) => e.target.focus()}
                  className={`block w-full rounded-lg border ${
                    errors.endYear ? "border-red-300" : "border-gray-300"
                  } 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-none
                    disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                  disabled={isSubmitting}
                  aria-describedby={
                    errors.endYear ? "endYear-error" : undefined
                  }
                >
                  <option value="">Select year (optional)</option>
                  {years.map((yr) => (
                    <option key={`tert-end-${yr}`} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
                {errors.endYear && (
                  <p id="endYear-error" className="mt-1 text-sm text-red-600">
                    {errors.endYear}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 
                  hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 transition-all duration-200
                  disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg
                  hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition-all duration-200
                  disabled:bg-indigo-400 disabled:cursor-not-allowed"
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
                ) : editingEducation ? (
                  "Update"
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
