"use client";

import { useState, useEffect } from "react";
import {
  X,
  Save,
  AlertCircle,
  Building2,
  FileText,
  Settings,
} from "lucide-react";
import { salaryStructureAPI } from "../../../../../../services/api";

const JobStructureForm = ({
  isOpen,
  onClose,
  editingJob = null,
  selectedClientId = null,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    client_id: "",
    job_code: "",
    job_title: "",
    description: "",
    contract_type: "employment",
    contract_nature: "at_will",
    pay_structures: [],
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [payStructureTypes, setPayStructureTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [errors, setErrors] = useState({});

  // Load pay structure types and clients on mount
  useEffect(() => {
    if (isOpen) {
      loadPayStructureTypes();
      loadClients();
    }
  }, [isOpen]);

  // Reset form when editing job changes or selectedClientId changes
  useEffect(() => {
    if (isOpen) {
      if (editingJob) {
        // Ensure pay_structures is always an array
        let payStructures = [];
        if (editingJob.pay_structures) {
          if (Array.isArray(editingJob.pay_structures)) {
            payStructures = editingJob.pay_structures;
          } else if (typeof editingJob.pay_structures === "string") {
            try {
              // Try to parse if it's a JSON string
              payStructures = JSON.parse(editingJob.pay_structures);
            } catch (e) {
              // If JSON parse fails, try splitting by comma
              payStructures = editingJob.pay_structures
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s);
            }
          }
        }

        setFormData({
          client_id: editingJob.client_id || selectedClientId || "",
          job_code: editingJob.job_code || "",
          job_title: editingJob.job_title || "",
          description: editingJob.description || "",
          contract_type: editingJob.contract_type || "employment",
          contract_nature: editingJob.contract_nature || "at_will",
          pay_structures: payStructures,
          is_active:
            editingJob.is_active !== undefined ? editingJob.is_active : true,
        });
      } else {
        resetForm();
      }
      setErrors({});
    }
  }, [editingJob, isOpen, selectedClientId]);

  const loadPayStructureTypes = async () => {
    try {
      const response =
        await salaryStructureAPI.utilities.getPayStructureTypes();

      if (response.success) {
        const payTypes = response.data.all || [];
        setPayStructureTypes(payTypes);
      } else if (response.data && response.data.success) {
        // Handle nested success structure
        const payTypes = response.data.data?.all || response.data.all || [];
        setPayStructureTypes(payTypes);
      }
    } catch (error) {
      console.error("Error loading pay structure types:", error);
    }
  };

  const loadClients = async () => {
    try {
      const response = await salaryStructureAPI.utilities.getClients();

      if (response.success) {
        const clientsData = response.data || [];
        setClients(clientsData);
      } else if (response.data && response.data.success) {
        // Handle nested success structure
        const clientsData = response.data.data || [];
        setClients(clientsData);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: selectedClientId || "",
      job_code: "",
      job_title: "",
      description: "",
      contract_type: "employment",
      contract_nature: "at_will",
      pay_structures: [],
      is_active: true,
    });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePayStructureToggle = (typeCode) => {
    setFormData((prev) => {
      // Ensure pay_structures is always an array
      const currentPayStructures = Array.isArray(prev.pay_structures)
        ? prev.pay_structures
        : [];

      return {
        ...prev,
        pay_structures: currentPayStructures.includes(typeCode)
          ? currentPayStructures.filter((code) => code !== typeCode)
          : [...currentPayStructures, typeCode],
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.client_id) {
      newErrors.client_id = "Client is required";
    }

    if (!formData.job_code.trim()) {
      newErrors.job_code = "Job code is required";
    } else if (formData.job_code.length > 20) {
      newErrors.job_code = "Job code must be 20 characters or less";
    }

    if (!formData.job_title.trim()) {
      newErrors.job_title = "Job title is required";
    } else if (formData.job_title.length > 255) {
      newErrors.job_title = "Job title must be 255 characters or less";
    }

    if (formData.pay_structures.length === 0) {
      newErrors.pay_structures =
        "At least one pay structure type must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        job_code: formData.job_code.trim().toUpperCase(),
      };

      let response;
      if (editingJob) {
        response = await salaryStructureAPI.jobStructures.update(
          editingJob.id,
          dataToSubmit
        );
      } else {
        response = await salaryStructureAPI.jobStructures.create(dataToSubmit);
      }

      console.log("Save/Update API response:", response);

      // Handle both direct and nested response structures
      const isSuccess = response.success || response.data?.success;

      if (isSuccess) {
        alert(
          editingJob
            ? "Job structure updated successfully!"
            : "Job structure created successfully!"
        );
        onSave();
        onClose();
        resetForm();
      } else {
        const errorMessage =
          response.message ||
          response.data?.message ||
          "Unknown error occurred";
        alert(
          `Failed to ${
            editingJob ? "update" : "create"
          } job structure: ${errorMessage}`
        );
      }
    } catch (error) {
      console.error("Error saving job structure:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert("Error saving job structure. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter pay structure types based on contract type and nature
  const getFilteredPayStructureTypes = () => {
    return payStructureTypes.filter(
      (type) =>
        type.contract_type === formData.contract_type &&
        type.contract_nature === formData.contract_nature
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              JOB STRUCTURE - {editingJob ? "EDIT" : "ADD"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/50 to-transparent">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Basic Information
                </h3>

                <div className="space-y-4">
                  {!selectedClientId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client *
                      </label>
                      <select
                        value={formData.client_id}
                        onChange={(e) =>
                          handleInputChange("client_id", e.target.value)
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.client_id
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200"
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="">Select a client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.organisation_name}
                          </option>
                        ))}
                      </select>
                      {errors.client_id && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.client_id}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedClientId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client
                      </label>
                      <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
                        {clients.find((c) => c.id == selectedClientId)
                          ?.organisation_name || "Loading client..."}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Code *
                    </label>
                    <input
                      type="text"
                      value={formData.job_code}
                      onChange={(e) =>
                        handleInputChange("job_code", e.target.value)
                      }
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.job_code
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="e.g., DSA01, SEC01"
                      maxLength="20"
                    />
                    {errors.job_code && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.job_code}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) =>
                        handleInputChange("job_title", e.target.value)
                      }
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.job_title
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="e.g., Data Security Analyst"
                      maxLength="255"
                    />
                    {errors.job_title && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.job_title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows="4"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of the job role and responsibilities..."
                    />
                  </div>
                </div>
              </div>

              {/* Contract Configuration */}
              <div className="p-4 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/50 to-transparent">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-600" />
                  Contract Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Type *
                    </label>
                    <select
                      value={formData.contract_type}
                      onChange={(e) =>
                        handleInputChange("contract_type", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="employment">Employment</option>
                      <option value="service">Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Nature *
                    </label>
                    <select
                      value={formData.contract_nature}
                      onChange={(e) =>
                        handleInputChange("contract_nature", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="at_will">At Will</option>
                      <option value="tenured">Tenured</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 rounded-xl border border-green-200 bg-gradient-to-r from-green-50/50 to-transparent">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-green-600" />
                  Status
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Active Status
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Deactivate to prevent new pay grade assignments
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        handleInputChange("is_active", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Pay Structure Types */}
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50/50 to-transparent">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pay Structure Types *
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select applicable pay structure types for this job (
                  {formData.contract_type} - {formData.contract_nature})
                </p>
                <div className="text-xs text-gray-500 mb-4 p-3 bg-blue-50 rounded-lg">
                  <strong>
                    Available Pay Structures for {formData.contract_type} -{" "}
                    {formData.contract_nature}:
                  </strong>
                  <br />
                  {formData.contract_type === "employment" &&
                    formData.contract_nature === "at_will" &&
                    "T1: Salary | T2: Daily Wages | T3: Salary + Reimbursable | T4: Daily + Reimbursable | T5: Nominal Salary + Piece Rate + Reimbursable | T6: Piece Rate + Reimbursable"}
                  {formData.contract_type === "employment" &&
                    formData.contract_nature === "tenured" &&
                    "T7: Salary | T8: Daily Wage | T9: Salary + Reimbursable | T10: Daily + Reimbursable | T11: Nominal Salary + Piece Rate + Reimbursable | T12: Piece Rate + Reimbursable"}
                  {formData.contract_type === "service" &&
                    formData.contract_nature === "at_will" &&
                    "T13: Monthly Fee | T14: Daily Fee | T15: Piece Rate"}
                  {formData.contract_type === "service" &&
                    formData.contract_nature === "tenured" &&
                    "T16: Monthly Fee | T17: Daily Fee | T18: Piece Rate"}
                </div>

                {errors.pay_structures && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      <p className="text-sm text-red-600">
                        {errors.pay_structures}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getFilteredPayStructureTypes().map((type) => (
                    <div
                      key={type.type_code}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.pay_structures.includes(type.type_code)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => handlePayStructureToggle(type.type_code)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.pay_structures.includes(
                                type.type_code
                              )}
                              onChange={() =>
                                handlePayStructureToggle(type.type_code)
                              }
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {type.type_code} - {type.type_name}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {type.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>Primary: {type.primary_component}</span>
                                {type.secondary_component && (
                                  <span>
                                    Secondary: {type.secondary_component}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {getFilteredPayStructureTypes().length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No pay structure types available for{" "}
                      {formData.contract_type} - {formData.contract_nature}
                    </p>
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> {formData.pay_structures.length}{" "}
                    pay structure type(s)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {editingJob
                      ? "Update Job Structure"
                      : "Create Job Structure"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobStructureForm;
