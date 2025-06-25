"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ExperienceModal({
  isOpen,
  onClose,
  onSave,
  experience = null,
  candidateId,
}) {
  const { getUserPreferences } = useAuth();
  const preferences = getUserPreferences();

  const [formData, setFormData] = useState({
    company_name: "",
    position: "",
    job_description: "",
    start_date: "",
    end_date: "",
    is_current: false,
    reason_for_leaving: "",
    last_salary: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const reasonsForLeaving = [
    "Career advancement",
    "Better compensation",
    "Company restructuring",
    "Contract ended",
    "Educational pursuits",
    "Family reasons",
    "Health reasons",
    "Job dissatisfaction",
    "Layoff/Retrenchment",
    "Location change",
    "New career path",
    "Personal reasons",
    "Resignation",
    "Retirement",
    "Other",
  ];

  useEffect(() => {
    if (experience) {
      setFormData({
        company_name: experience.company_name || "",
        position: experience.position || "",
        job_description: experience.job_description || "",
        start_date: experience.start_date || "",
        end_date: experience.end_date || "",
        is_current: experience.is_current || false,
        reason_for_leaving: experience.reason_for_leaving || "",
        last_salary: experience.last_salary || "",
      });
    } else {
      setFormData({
        company_name: "",
        position: "",
        job_description: "",
        start_date: "",
        end_date: "",
        is_current: false,
        reason_for_leaving: "",
        last_salary: "",
      });
    }
    setErrors({});
  }, [experience, isOpen]);

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
        end_date: "",
        reason_for_leaving: "",
      }));
    }
  };

  const formatSalary = (value) => {
    const numericValue = value.replace(/[^\d]/g, "");
    if (numericValue) {
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return "";
  };

  const handleSalaryChange = (e) => {
    const formattedValue = formatSalary(e.target.value);
    setFormData((prev) => ({
      ...prev,
      last_salary: formattedValue,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = "Company name is required";
    }
    if (!formData.position.trim()) {
      newErrors.position = "Position is required";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (endDate <= startDate) {
        newErrors.end_date = "End date must be after start date";
      }
    }

    if (!formData.is_current && !formData.end_date) {
      newErrors.end_date = "End date is required (or mark as current position)";
    }

    if (!formData.is_current && !formData.reason_for_leaving.trim()) {
      newErrors.reason_for_leaving = "Reason for leaving is recommended";
    }

    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      const today = new Date();
      if (startDate > today) {
        newErrors.start_date = "Start date cannot be in the future";
      }
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
      const submissionData = {
        ...formData,
        last_salary: formData.last_salary
          ? parseInt(formData.last_salary.replace(/,/g, ""))
          : null,
      };

      const url = experience
        ? `http://localhost:8000/api/candidates/experience/${experience.id}`
        : `http://localhost:8000/api/candidates/${candidateId}/experience`;

      const method = experience ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.experience);
        onClose();
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        }
      }
    } catch (error) {
      console.error("Failed to save experience:", error);
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
            {experience ? "Edit Work Experience" : "Add Work Experience"}
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
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.company_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Strategic Outsourcing Limited"
            />
            {errors.company_name && (
              <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position/Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.position ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Software Developer, HR Manager"
            />
            {errors.position && (
              <p className="text-red-500 text-xs mt-1">{errors.position}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              name="job_description"
              value={formData.job_description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your key responsibilities and achievements..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Include your main responsibilities, achievements, and skills used
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.start_date ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.start_date && (
                <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date{" "}
                {!formData.is_current && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                disabled={formData.is_current}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formData.is_current ? "bg-gray-100" : ""
                } ${errors.end_date ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.end_date && (
                <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>
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
              I currently work here
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Salary (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₦</span>
              <input
                type="text"
                name="last_salary"
                value={formData.last_salary}
                onChange={handleSalaryChange}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 350,000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Monthly salary (optional - for matching purposes)
            </p>
          </div>

          {!formData.is_current && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Leaving
              </label>
              <select
                name="reason_for_leaving"
                value={formData.reason_for_leaving}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reason_for_leaving
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="">Select reason</option>
                {reasonsForLeaving.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {errors.reason_for_leaving && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.reason_for_leaving}
                </p>
              )}
            </div>
          )}

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
              ) : experience ? (
                "Update Experience"
              ) : (
                "Add Experience"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
