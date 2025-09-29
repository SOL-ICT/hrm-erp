"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AddressForm from "./AddressForm"; // Import the AddressForm component

export default function EmergencyContactModal({
  isOpen,
  onClose,
  onSave,
  contact = null,
  candidateId,
  type, // "Emergency Contact" or "Next of Kin" or "Family Contact"
}) {
  const { getUserPreferences, sanctumRequest } = useAuth();
  const preferences = getUserPreferences();

  const [formData, setFormData] = useState({
    contact_type: "",
    full_name: "",
    relationship: "",
    phone_primary: "",
    phone_secondary: "",
    email: "",
    address: "",
    is_primary: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // const contactTypes = ["Emergency Contact", "Next of Kin", "Family Contact"];

  const relationships = [
    "Parent",
    "Spouse",
    "Sibling",
    "Child",
    "Grandparent",
    "Grandchild",
    "Uncle",
    "Aunt",
    "Cousin",
    "Nephew",
    "Niece",
    "Friend",
    "Colleague",
    "Neighbor",
    "Guardian",
    "Partner",
    "In-law",
    "Other Relative",
    "Other",
  ];

  useEffect(() => {
    if (contact) {
      // Edit mode - populate form with existing data
      setFormData({
        contact_type: contact.contact_type || "",
        full_name: contact.full_name || "",
        relationship: contact.relationship || "",
        phone_primary: contact.phone_primary || "",
        phone_secondary: contact.phone_secondary || "",
        email: contact.email || "",
        address: contact.address || "",
        is_primary: contact.is_primary || false,
        state_of_residence_current: contact.emergency_state_of_residence || "",
        local_government_residence_current:
          contact.emergency_local_government_residence || "",
        address_current: contact.emergency_address || "",
        address_line_2_current: contact.emergency_address_line_2 || "",
      });
    } else {
      // Add mode - reset form
      // Add mode - auto-fill contact type from modal context
      setFormData({
        contact_type: type || "Emergency Contact", // ✅ use `type` prop, not `contactModal`
        full_name: "",
        relationship: "",
        phone_primary: "",
        phone_secondary: "",
        email: "",
        address: "",
        is_primary: false,
        state_of_residence_current: "",
        local_government_residence_current: "",
        address_current: "",
        address_line_2_current: "",
      });
    }
    setErrors({});
  }, [contact, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, "");

    // Nigerian phone number formatting
    if (numbers.startsWith("234")) {
      // +234 format
      if (numbers.length <= 3) return `+${numbers}`;
      if (numbers.length <= 6)
        return `+${numbers.slice(0, 3)} ${numbers.slice(3)}`;
      if (numbers.length <= 9)
        return `+${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(
          6
        )}`;
      return `+${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(
        6,
        9
      )} ${numbers.slice(9, 13)}`;
    } else if (numbers.startsWith("0") && numbers.length > 1) {
      // 0 format
      if (numbers.length <= 4) return numbers;
      if (numbers.length <= 7)
        return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
      return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(
        7,
        11
      )}`;
    }

    return value;
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = formatPhoneNumber(value);
    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    {
      /*
      
    if (!formData.contact_type.trim()) {
      newErrors.contact_type = "Contact type is required";
    }
    */
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }
    if (!formData.relationship.trim()) {
      newErrors.relationship = "Relationship is required";
    }
    if (!formData.phone_primary.trim()) {
      newErrors.phone_primary = "Primary phone is required";
    }

    // Phone validation
    const phoneRegex = /^(\+234|0)[0-9]{10}$/;
    if (formData.phone_primary) {
      const cleanPhone = formData.phone_primary.replace(/\s/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone_primary = "Please enter a valid Nigerian phone number";
      }
    }

    if (formData.phone_secondary) {
      const cleanPhone = formData.phone_secondary.replace(/\s/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone_secondary =
          "Please enter a valid Nigerian phone number";
      }
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log("🚀 Contact Type:", formData.contact_type); // to check if form type based on current modal
    try {
      const url = contact
        ? `http://localhost:8000/api/candidates/emergency-contacts/${contact.id}`
        : `http://localhost:8000/api/candidates/${candidateId}/emergency-contacts`;

      const method = contact ? "PUT" : "POST";

      // Transform formData to match API/database column names
      const submissionData = {
        contact_type: formData.contact_type,
        full_name: formData.full_name,
        relationship: formData.relationship,
        phone_primary: formData.phone_primary,
        phone_secondary: formData.phone_secondary,
        email: formData.email,
        is_primary: formData.is_primary,
        emergency_state_of_residence: formData.state_of_residence_current,
        emergency_local_government_residence:
          formData.local_government_residence_current,
        emergency_address: formData.address_current,
        emergency_address_line_2: formData.address_line_2_current,
      };

      const response = await sanctumRequest(url, {
        method,
        credentials: "include", // Required for Sanctum authentication
        headers: { "Content-Type": "application/json" }, // Ensure JSON payload
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.contact);
        onClose();
      } else {
        const errorData = await response.json();
        setErrors(
          errorData.errors || { general: "An unexpected error occurred." }
        );
      }
    } catch (error) {
      console.error("Failed to save emergency contact:", error);
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
            {contact ? `Edit ${type}` : `Add ${type}`}
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

          {/* Contact Type 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Type <span className="text-red-500">*</span>
            </label>
            <select
              name="contact_type"
              value={formData.contact_type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.contact_type ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Contact Type</option>
              {contactTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.contact_type && (
              <p className="text-red-500 text-xs mt-1">{errors.contact_type}</p>
            )}
          </div>
            */}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.full_name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., John Doe"
            />
            {errors.full_name && (
              <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship <span className="text-red-500">*</span>
            </label>
            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.relationship ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Relationship</option>
              {relationships.map((relationship) => (
                <option key={relationship} value={relationship}>
                  {relationship}
                </option>
              ))}
            </select>
            {errors.relationship && (
              <p className="text-red-500 text-xs mt-1">{errors.relationship}</p>
            )}
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone_primary"
                value={formData.phone_primary}
                onChange={handlePhoneChange}
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
                onChange={handlePhoneChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone_secondary ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+234 801 234 5678"
              />
              {errors.phone_secondary && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phone_secondary}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="john.doe@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Address */}

          <AddressForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            handleInputChange={handleInputChange}
            type="current"
          />

          {/* end Address */}

          {/* Primary Contact */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_primary"
              checked={formData.is_primary}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Set as primary emergency contact
            </label>
          </div>
          {formData.is_primary && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-blue-600 text-sm">
                <strong>Note:</strong> Setting this as primary will remove the
                primary status from any existing contact.
              </p>
            </div>
          )}

          {/* Form Actions */}
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
              ) : contact ? (
                "Update Contact"
              ) : (
                "Add Contact"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
