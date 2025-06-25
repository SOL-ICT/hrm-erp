"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function EducationModal({
  isOpen,
  onClose,
  onSave,
  education = null,
  candidateId,
}) {
  const { getUserPreferences } = useAuth();
  const preferences = getUserPreferences();

  const [formData, setFormData] = useState({
    institution_name: "",
    qualification_type: "",
    field_of_study: "",
    grade_result: "",
    start_year: "",
    end_year: "",
    is_current: false,
    certificate_file: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1950 + 11 },
    (_, i) => currentYear + 10 - i
  );

  const qualificationTypes = [
    "Primary School Certificate",
    "Junior Secondary Certificate",
    "Senior Secondary Certificate (SSCE/WAEC/NECO)",
    "Ordinary National Diploma (OND)",
    "Higher National Diploma (HND)",
    "National Certificate in Education (NCE)",
    "Bachelor's Degree (B.Sc/B.A/B.Tech/B.Eng)",
    "Postgraduate Diploma (PGD)",
    "Master's Degree (M.Sc/M.A/MBA/M.Tech/M.Eng)",
    "Doctor of Philosophy (Ph.D)",
    "Professional Certificate",
    "Trade Certificate",
    "Other",
  ];

  useEffect(() => {
    if (education) {
      setFormData({
        institution_name: education.institution_name || "",
        qualification_type: education.qualification_type || "",
        field_of_study: education.field_of_study || "",
        grade_result: education.grade_result || "",
        start_year: education.start_year || "",
        end_year: education.end_year || "",
        is_current: education.is_current || false,
        certificate_file: education.certificate_file || "",
      });
    } else {
      setFormData({
        institution_name: "",
        qualification_type: "",
        field_of_study: "",
        grade_result: "",
        start_year: "",
        end_year: "",
        is_current: false,
        certificate_file: "",
      });
    }
    setErrors({});
  }, [education, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (name === "is_current" && checked) {
      setFormData((prev) => ({
        ...prev,
        end_year: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.institution_name.trim()) {
      newErrors.institution_name = "Institution name is required";
    }
    if (!formData.qualification_type.trim()) {
      newErrors.qualification_type = "Qualification type is required";
    }
    if (!formData.start_year) {
      newErrors.start_year = "Start year is required";
    }

    if (formData.start_year && formData.end_year) {
      if (parseInt(formData.end_year) <= parseInt(formData.start_year)) {
        newErrors.end_year = "End year must be after start year";
      }
    }

    if (!formData.is_current && !formData.end_year) {
      newErrors.end_year = "End year is required (or mark as current)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const url = education
        ? `http://localhost:8000/api/candidates/education/${education.id}`
        : `http://localhost:8000/api/candidates/${candidateId}/education`;

      const method = education ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.education);
        onClose();
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        }
      }
    } catch (error) {
      console.error("Failed to save education:", error);
      setErrors({ general: "Failed to save. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {education ? "Edit Education" : "Add Education"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="h-6 w-6"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="institution_name"
              value={formData.institution_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.institution_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., University of Lagos"
            />
            {errors.institution_name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.institution_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qualification Type <span className="text-red-500">*</span>
            </label>
            <select
              name="qualification_type"
              value={formData.qualification_type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.qualification_type ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Qualification</option>
              {qualificationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.qualification_type && (
              <p className="text-red-500 text-xs mt-1">
                {errors.qualification_type}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field of Study
            </label>
            <input
              type="text"
              name="field_of_study"
              value={formData.field_of_study}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Computer Science, Business Administration"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade/Result
            </label>
            <input
              type="text"
              name="grade_result"
              value={formData.grade_result}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., First Class, 3.5 GPA, Distinction"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Year <span className="text-red-500">*</span>
              </label>
              <select
                name="start_year"
                value={formData.start_year}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.start_year ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.start_year && (
                <p className="text-red-500 text-xs mt-1">{errors.start_year}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Year{" "}
                {!formData.is_current && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <select
                name="end_year"
                value={formData.end_year}
                onChange={handleInputChange}
                disabled={formData.is_current}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formData.is_current ? "bg-gray-100" : ""
                } ${errors.end_year ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.end_year && (
                <p className="text-red-500 text-xs mt-1">{errors.end_year}</p>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_current"
              checked={formData.is_current}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              I am currently studying here
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificate File (Optional)
            </label>
            <input
              type="file"
              name="certificate_file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload certificate (PDF, JPG, PNG - Max 5MB)
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: preferences.primary_color }}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : education ? (
                "Update Education"
              ) : (
                "Add Education"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
