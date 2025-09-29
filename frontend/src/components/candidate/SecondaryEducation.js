"use client";

import React, { useState, useEffect } from "react";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

const Modal = ({ children, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
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

export default function SecondaryEducation({
  currentTheme,
  preferences,
  user,
  initialData = [],
}) {
  const [secondaryEducation, setSecondaryEducation] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sanctumRequest } = useAuth();

  // Fetch secondary education records
  const fetchSecondaryEducation = async () => {
    if (!user?.id) return;
    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/secondary-education`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched secondary education:", data);
        // Ensure data is an array
        setSecondaryEducation(data.data || []);
      } else {
        setSecondaryEducation([]);
        console.error("Fetch failed:", await response.text());
      }
    } catch (error) {
      setSecondaryEducation([]);
      console.error("Error fetching secondary education:", error);
    }
  };

  useEffect(() => {
    console.log("SecondaryEducation mounted with user:", user);
    console.log("SecondaryEducation received initialData:", initialData);

    // Use initialData if available, otherwise fetch
    if (initialData && initialData.length > 0) {
      console.log("Using initialData for secondary education");
      setSecondaryEducation(initialData);
    } else if (user?.id) {
      console.log("Fetching secondary education data");
      fetchSecondaryEducation();
    } else {
      setSecondaryEducation([]); // Clear data on logout
    }
  }, [user, initialData]);

  // Create or update secondary education
  const saveSecondaryEducation = async (data) => {
    try {
      const url = editingEducation
        ? `http://localhost:8000/api/candidates/${user.id}/secondary-education/${editingEducation.id}`
        : `http://localhost:8000/api/candidates/${user.id}/secondary-education`;
      const method = editingEducation ? "PUT" : "POST";

      console.log("📤 Making request to:", url, "with method:", method);

      const response = await sanctumRequest(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      //   // *** LOGGING ***
      //   console.log('––– SAVE RESP URL:', url);
      // console.log('––– SAVE RESP STATUS:', response.status);
      // console.log('––– SAVE RESP CONTENT-TYPE:', response.headers.get('content-type'));
      // const text = await response.text();
      // console.log('––– SAVE RESP BODY:', text);
      // // *** END LOGGING ***

      //  // Now try to parse JSON
      //  let payload;
      // try {
      //   payload = JSON.parse(text);
      // } catch (e) {
      //   console.error('Could not parse JSON:', e);
      //   return { success: false, errors: text };
      // }

      if (response.ok) {
        console.log("✅ Secondary Education - Response OK, parsing JSON...");
        try {
          const result = await response.json();
          console.log(
            "✅ Secondary Education - JSON parsed successfully:",
            result
          );
          if (editingEducation) {
            setSecondaryEducation((prev) =>
              prev.map((edu) =>
                edu.id === editingEducation.id ? result.education : edu
              )
            );
          } else {
            setSecondaryEducation((prev) => [...prev, result.education]);
          }
          return { success: true };
        } catch (jsonError) {
          console.error(
            "❌ Secondary Education - JSON parsing failed:",
            jsonError
          );
          // Don't try to read the response again, just return error
          return { success: false, errors: "Failed to parse response" };
        }
      } else {
        console.log(
          "❌ Secondary Education - Response not OK:",
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

  // Delete secondary education
  const deleteSecondaryEducation = async (id) => {
    try {
      const response = await sanctumRequest(
        `http://localhost:8000/api/candidates/${user.id}/secondary-education/${id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setSecondaryEducation((prev) => prev.filter((edu) => edu.id !== id));
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
    if (user?.id) {
      fetchSecondaryEducation();
    }
  }, [user]);

  // Modal form handling
  const handleAddNew = () => {
    setEditingEducation(null);
    setSchoolName("");
    setStartYear("");
    setEndYear("");
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (education) => {
    console.log("🔍 Editing education object:", education);
    setEditingEducation(education);
    setSchoolName(education.school_name || "");
    // Ensure year values are strings/numbers, not objects
    setStartYear(String(education.start_year || ""));
    setEndYear(String(education.end_year || ""));
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const result = await deleteSecondaryEducation(id);
      if (!result.success) {
        alert(`Error: ${result.message}`);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!schoolName.trim())
      newErrors.schoolName = "Please enter a valid school name";
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
      school_name: schoolName.trim(),
      start_year: startYear,
      end_year: endYear || null,
    };
    const result = await saveSecondaryEducation(data);
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
            <span className="mr-3">🏫</span> Secondary Education
          </h2>
          <p className={`text-lg ${currentTheme.textSecondary}`}>
            Manage your secondary education records
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
          Add Secondary Education
        </button>
      </div>

      {secondaryEducation.length > 0 ? (
        <div className="space-y-4">
          {secondaryEducation.map((edu) => (
            <div
              key={edu.id}
              className={`${currentTheme.cardBg} backdrop-blur-md rounded-xl p-6 ${currentTheme.border} shadow-xl hover:shadow-2xl transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className={`text-lg font-semibold ${currentTheme.textPrimary}`}
                  >
                    {edu.school_name}
                  </h3>
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
              🏫
            </div>
            <h3
              className={`text-3xl font-bold ${currentTheme.textPrimary} mb-4`}
            >
              No Secondary Education
            </h3>
            <p
              className={`text-lg ${currentTheme.textSecondary} mb-8 leading-relaxed`}
            >
              Add your secondary education details to complete your profile.
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
              Add Secondary Education
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
                  ? "Edit Secondary Education"
                  : "Add Secondary Education"}
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
                htmlFor="schoolName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                School Name
              </label>
              <input
                id="schoolName"
                type="text"
                value={schoolName}
                onChange={(e) => {
                  setSchoolName(e.target.value);
                  setErrors((prev) => ({ ...prev, schoolName: "" }));
                }}
                className={`block w-full rounded-lg border ${
                  errors.schoolName ? "border-red-300" : "border-gray-300"
                } 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200
                  disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                placeholder="e.g. Lagos Grammar School"
                required
                disabled={isSubmitting}
                aria-describedby={
                  errors.schoolName ? "schoolName-error" : undefined
                }
              />
              {errors.schoolName && (
                <p id="schoolName-error" className="mt-1 text-sm text-red-600">
                  {errors.schoolName}
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
                    //i want to conver the year value to integer
                    if (e.target.value) {
                      setStartYear(parseInt(e.target.value, 10));
                    }
                    setErrors((prev) => ({
                      ...prev,
                      startYear: "",
                      endYear: "",
                    }));
                  }}
                  className={`block w-full rounded-lg border ${
                    errors.startYear ? "border-red-300" : "border-gray-300"
                  } 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200
                    disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                  required
                  disabled={isSubmitting}
                  aria-describedby={
                    errors.startYear ? "startYear-error" : undefined
                  }
                >
                  <option value="">Select year</option>
                  {years.map((yr) => (
                    <option key={`sec-start-${yr}`} value={yr}>
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
                    // Convert the year value to integer if selected
                    if (e.target.value) {
                      setEndYear(parseInt(e.target.value, 10));
                    }
                    setErrors((prev) => ({ ...prev, endYear: "" }));
                  }}
                  className={`block w-full rounded-lg border ${
                    errors.endYear ? "border-red-300" : "border-gray-300"
                  } 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200
                    disabled:bg-gray-100 disabled:cursor-not-allowed p-2.5 text-sm`}
                  disabled={isSubmitting}
                  aria-describedby={
                    errors.endYear ? "endYear-error" : undefined
                  }
                >
                  <option value="">Select year (optional)</option>
                  {years.map((yr) => (
                    <option key={`sec-end-${yr}`} value={yr}>
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
