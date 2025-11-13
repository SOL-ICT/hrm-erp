"use client";

import { useState, useEffect } from "react";
import {
  X,
  Save,
  AlertCircle,
  DollarSign,
  Calculator,
  Plus,
  Trash2,
} from "lucide-react";
import { salaryStructureAPI } from "../../../../../../services/api";

const PayGradeForm = ({
  isOpen,
  onClose,
  editingPayGrade = null,
  onSave,
  jobStructures = [],
  selectedJobStructure = null, // New prop for pre-selecting job structure
}) => {
  // Debug logging for props
  console.log("🔍 PayGradeForm Props Debug:");
  console.log("- isOpen:", isOpen);
  console.log("- jobStructures:", jobStructures);
  console.log("- jobStructures length:", jobStructures.length);
  console.log("- selectedJobStructure:", selectedJobStructure);
  console.log("- editingPayGrade:", editingPayGrade);

  const [formData, setFormData] = useState({
    job_structure_id: "",
    grade_name: "",
    grade_code: "",
    pay_structure_type: "",
    emoluments: {},
    currency: "NGN",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [payStructureTypes, setPayStructureTypes] = useState([]);
  const [emolumentComponents, setEmolumentComponents] = useState([]);
  const [currentJobStructure, setCurrentJobStructure] = useState(null);
  const [totalCompensation, setTotalCompensation] = useState(0);
  const [errors, setErrors] = useState({});

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      // Only load emolument components - we don't need pay structure types for editing
      loadEmolumentComponents();
    }
  }, [isOpen]);

  // Reset form when editing grade changes
  useEffect(() => {
    console.log("🔄 PayGradeForm useEffect triggered:");
    console.log("- isOpen:", isOpen);
    console.log("- editingPayGrade:", editingPayGrade);
    console.log("- selectedJobStructure:", selectedJobStructure);
    console.log("- jobStructures:", jobStructures);

    if (isOpen) {
      if (editingPayGrade) {
        // Find the job structure for this pay grade
        const jobStructure = jobStructures.find(
          (js) => js.id == editingPayGrade.job_structure_id
        );

        // Parse emoluments data - handle both object and JSON string formats
        let parsedEmoluments = {};
        if (editingPayGrade.emoluments) {
          try {
            if (typeof editingPayGrade.emoluments === "string") {
              parsedEmoluments = JSON.parse(editingPayGrade.emoluments);
            } else if (typeof editingPayGrade.emoluments === "object") {
              parsedEmoluments = editingPayGrade.emoluments;
            }
          } catch (error) {
            console.error("Error parsing emoluments:", error);
            parsedEmoluments = {};
          }
        }

        console.log("🔧 Original emoluments:", editingPayGrade.emoluments);
        console.log("🔧 Parsed emoluments:", parsedEmoluments);

        // Set form data with pre-populated values
        setFormData({
          job_structure_id: editingPayGrade.job_structure_id || "",
          grade_name: editingPayGrade.grade_name || "",
          grade_code: editingPayGrade.grade_code || "",
          pay_structure_type: editingPayGrade.pay_structure_type || "",
          emoluments: parsedEmoluments,
          currency: editingPayGrade.currency || "NGN",
          is_active:
            editingPayGrade.is_active !== undefined
              ? editingPayGrade.is_active
              : true,
        });

        setCurrentJobStructure(jobStructure);

        // If job structure has pay_structures, set the available types
        if (jobStructure?.pay_structures) {
          try {
            let payStructures = jobStructure.pay_structures;
            // Handle both string and array formats
            if (typeof payStructures === "string") {
              payStructures = JSON.parse(payStructures);
            }

            // Convert to the format expected by the dropdown
            const availableTypes = payStructures.map((type) => ({
              id: type,
              name: type,
              code: type,
            }));

            setPayStructureTypes(availableTypes);

            // If pay structure type is not set, auto-select the first available one
            if (
              !editingPayGrade.pay_structure_type &&
              availableTypes.length > 0
            ) {
              setFormData((prev) => ({
                ...prev,
                pay_structure_type: availableTypes[0].code,
              }));
            }
          } catch (error) {
            console.error("Error parsing pay_structures:", error);
          }
        }
      } else {
        // For new pay grades, pre-populate with selectedJobStructure if provided
        if (selectedJobStructure) {
          setFormData({
            job_structure_id: selectedJobStructure.id || "",
            grade_name: "",
            grade_code: "",
            pay_structure_type: "",
            emoluments: {},
            currency: "NGN",
            is_active: true,
          });
          setCurrentJobStructure(selectedJobStructure);

          // Load pay structure types for the selected job structure
          if (selectedJobStructure.pay_structures) {
            try {
              let payStructures = selectedJobStructure.pay_structures;
              // Handle both string and array formats
              if (typeof payStructures === "string") {
                payStructures = JSON.parse(payStructures);
              }

              // Convert to the format expected by the dropdown
              const availableTypes = payStructures.map((type) => ({
                id: type,
                name: type,
                code: type,
              }));

              setPayStructureTypes(availableTypes);

              // Auto-select the first available pay structure type
              if (availableTypes.length > 0) {
                setFormData((prev) => ({
                  ...prev,
                  pay_structure_type: availableTypes[0].code,
                }));
              }
            } catch (error) {
              console.error("Error parsing pay_structures:", error);
            }
          }
        } else {
          resetForm();
          // For new pay grades without selectedJobStructure, load all pay structure types
          loadPayStructureTypes();
        }
      }
      setErrors({});
    }
  }, [editingPayGrade, isOpen, jobStructures, selectedJobStructure]);

  // Calculate total compensation when emoluments change
  useEffect(() => {
    calculateTotalCompensation();
  }, [formData.emoluments, emolumentComponents]);

  const loadEmolumentComponents = async () => {
    try {
      console.log("🔄 Loading emolument components...");
      const emolumentsResponse =
        await salaryStructureAPI.utilities.getEmolumentComponents();
      console.log("💰 Emoluments Response:", emolumentsResponse);

      // Handle both direct and nested response structures
      const emolumentsSuccess =
        emolumentsResponse.success || emolumentsResponse.data?.success;

      if (emolumentsSuccess) {
        const emoluments =
          emolumentsResponse.data?.all ||
          emolumentsResponse.data?.data?.all ||
          emolumentsResponse.data ||
          [];
        console.log(
          "✅ Setting emolument components:",
          emoluments.length,
          "items"
        );
        setEmolumentComponents(emoluments);

        // Trigger calculation after components are loaded
        setTimeout(() => {
          calculateTotalCompensation();
        }, 100);
      } else {
        console.error("❌ Emoluments response failed:", emolumentsResponse);
      }
    } catch (error) {
      console.error("❌ Error loading emolument components:", error);
    }
  };

  const loadPayStructureTypes = async () => {
    try {
      console.log("🔄 Loading pay structure types...");
      const payTypesResponse =
        await salaryStructureAPI.utilities.getPayStructureTypes();
      console.log("📊 Pay Types Response:", payTypesResponse);

      // Handle both direct and nested response structures
      const payTypesSuccess =
        payTypesResponse.success || payTypesResponse.data?.success;

      if (payTypesSuccess) {
        const payTypes =
          payTypesResponse.data?.all ||
          payTypesResponse.data?.data?.all ||
          payTypesResponse.data ||
          [];
        console.log(
          "✅ Setting pay structure types:",
          payTypes.length,
          "items"
        );
        setPayStructureTypes(payTypes);
      } else {
        console.error("❌ Pay types response failed:", payTypesResponse);
      }
    } catch (error) {
      console.error("❌ Error loading pay structure types:", error);
    }
  };

  const loadUtilityData = async () => {
    await Promise.all([loadPayStructureTypes(), loadEmolumentComponents()]);
  };

  const resetForm = () => {
    setFormData({
      job_structure_id: "",
      grade_name: "",
      grade_code: "",
      pay_structure_type: "",
      emoluments: {},
      currency: "NGN",
      is_active: true,
    });
    setCurrentJobStructure(null);
    setTotalCompensation(0);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }

    // Handle job structure selection
    if (field === "job_structure_id") {
      const jobStructure = jobStructures.find((js) => js.id == value);
      setCurrentJobStructure(jobStructure);
      // Reset pay structure type when job structure changes
      setFormData((prev) => ({ ...prev, pay_structure_type: "" }));
    }
  };

  const handleEmolumentChange = (componentCode, value) => {
    const numericValue = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      emoluments: {
        ...prev.emoluments,
        [componentCode]: numericValue,
      },
    }));
  };

  const addEmolumentComponent = (componentCode) => {
    if (!formData.emoluments[componentCode]) {
      handleEmolumentChange(componentCode, 0);
    }
  };

  const removeEmolumentComponent = (componentCode) => {
    setFormData((prev) => {
      const newEmoluments = { ...prev.emoluments };
      delete newEmoluments[componentCode];
      return { ...prev, emoluments: newEmoluments };
    });
  };

  const calculateTotalCompensation = () => {
    console.log("🧮 Calculating total compensation...");
    console.log("📊 Form emoluments (type):", typeof formData.emoluments);
    console.log("📊 Form emoluments (object):", formData.emoluments);
    console.log(
      "🏷️ Available emolument components:",
      emolumentComponents.length
    );

    // Ensure emoluments is an object
    if (
      typeof formData.emoluments !== "object" ||
      Array.isArray(formData.emoluments)
    ) {
      console.error("❌ Emoluments is not an object:", formData.emoluments);
      setTotalCompensation(0);
      return;
    }

    let total = 0;
    Object.entries(formData.emoluments).forEach(([componentCode, amount]) => {
      const component = emolumentComponents.find(
        (ec) => ec.component_code === componentCode
      );

      if (
        component &&
        ["basic", "allowance", "benefit"].includes(component.category)
      ) {
        const value = parseFloat(amount) || 0;
        total += value;
        console.log(
          `✅ ${componentCode}: ${value} (${component.component_name})`
        );
      }
    });

    console.log("🎯 Final total compensation:", total);
    setTotalCompensation(total);
  };

  const getAvailablePayStructureTypes = () => {
    if (!currentJobStructure || !currentJobStructure.pay_structures) {
      return [];
    }

    return payStructureTypes.filter((type) =>
      currentJobStructure.pay_structures.includes(type.type_code)
    );
  };

  const getAvailableEmolumentComponents = () => {
    // Ensure emoluments is an object before checking properties
    const emoluments =
      typeof formData.emoluments === "object" &&
      !Array.isArray(formData.emoluments)
        ? formData.emoluments
        : {};

    const available = emolumentComponents.filter(
      (component) => !emoluments.hasOwnProperty(component.component_code)
    );

    return available;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.job_structure_id) {
      newErrors.job_structure_id = "Job structure is required";
    }

    if (!formData.grade_name.trim()) {
      newErrors.grade_name = "Grade name is required";
    }

    if (!formData.grade_code.trim()) {
      newErrors.grade_code = "Grade code is required";
    }

    if (!formData.pay_structure_type) {
      newErrors.pay_structure_type = "Pay structure type is required";
    }

    if (Object.keys(formData.emoluments).length === 0) {
      newErrors.emoluments = "At least one emolument component is required";
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
        grade_code: formData.grade_code.trim().toUpperCase(),
      };

      let response;
      if (editingPayGrade) {
        response = await salaryStructureAPI.payGrades.update(
          editingPayGrade.id,
          dataToSubmit
        );
      } else {
        response = await salaryStructureAPI.payGrades.create(dataToSubmit);
      }

      console.log("Save/Update Pay Grade API response:", response);

      // Handle both direct and nested response structures
      const isSuccess = response.success || response.data?.success;

      if (isSuccess) {
        alert(
          editingPayGrade
            ? "Pay grade updated successfully!"
            : "Pay grade created successfully!"
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
            editingPayGrade ? "update" : "create"
          } pay grade: ${errorMessage}`
        );
      }
    } catch (error) {
      console.error("Error saving pay grade:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert("Error saving pay grade. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              PAY GRADE DETAILS - {editingPayGrade ? "EDIT" : "ADD"}
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
                  <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                  Grade Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Structure *
                      {editingPayGrade && (
                        <span className="text-sm text-gray-500 ml-1">
                          (Fixed for editing)
                        </span>
                      )}
                    </label>
                    <select
                      value={formData.job_structure_id}
                      onChange={(e) =>
                        handleInputChange("job_structure_id", e.target.value)
                      }
                      disabled={!!editingPayGrade}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.job_structure_id
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      } ${
                        editingPayGrade ? "bg-gray-100 cursor-not-allowed" : ""
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      {/* Debug dropdown content */}
                      {console.log("🎯 Dropdown Debug:", {
                        jobStructuresLength: jobStructures.length,
                        formDataJobStructureId: formData.job_structure_id,
                        showPlaceholder: !formData.job_structure_id,
                      })}

                      {/* Only show placeholder option if no job structure is pre-selected */}
                      {!formData.job_structure_id && (
                        <option value="">Select Job Structure</option>
                      )}
                      {jobStructures.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.job_code} - {job.job_title}
                        </option>
                      ))}
                    </select>
                    {errors.job_structure_id && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.job_structure_id}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade Name *
                      </label>
                      <input
                        type="text"
                        value={formData.grade_name}
                        onChange={(e) =>
                          handleInputChange("grade_name", e.target.value)
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.grade_name
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200"
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="e.g., Grade 1, Junior, Senior"
                      />
                      {errors.grade_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.grade_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade Code *
                      </label>
                      <input
                        type="text"
                        value={formData.grade_code}
                        onChange={(e) =>
                          handleInputChange("grade_code", e.target.value)
                        }
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.grade_code
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200"
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="e.g., DSA01-G1"
                      />
                      {errors.grade_code && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.grade_code}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pay Structure Type
                    </label>
                    <div className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900">
                      {formData.pay_structure_type || "Not set"}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        Active Status
                      </h4>
                      <p className="text-sm text-gray-600">
                        Enable this pay grade for use
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

              {/* Total Compensation Summary */}
              <div className="p-4 rounded-xl border border-green-200 bg-gradient-to-r from-green-50/50 to-transparent">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-green-600" />
                  Total Compensation
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    {formatCurrency(totalCompensation)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Total Monthly Compensation
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Emolument Components */}
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50/50 to-transparent">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Emolument Components *
                </h3>

                {errors.emoluments && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      <p className="text-sm text-red-600">
                        {errors.emoluments}
                      </p>
                    </div>
                  </div>
                )}

                {/* Current Emoluments */}
                <div className="space-y-3 mb-4">
                  {Object.entries(formData.emoluments).map(
                    ([componentCode, amount]) => {
                      const component = emolumentComponents.find(
                        (ec) => ec.component_code === componentCode
                      );
                      if (!component) return null;

                      return (
                        <div
                          key={componentCode}
                          className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {component.component_name}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                ₦
                              </span>
                              <input
                                type="number"
                                value={amount}
                                onChange={(e) =>
                                  handleEmolumentChange(
                                    componentCode,
                                    e.target.value
                                  )
                                }
                                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                component.category === "basic"
                                  ? "bg-blue-100 text-blue-800"
                                  : component.category === "allowance"
                                  ? "bg-green-100 text-green-800"
                                  : component.category === "benefit"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {component.category}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                removeEmolumentComponent(componentCode)
                              }
                              className="block mt-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Add Component Dropdown */}
                {getAvailableEmolumentComponents().length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Add Component
                    </h4>
                    <div className="flex space-x-2">
                      <select
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => {
                          if (e.target.value) {
                            addEmolumentComponent(e.target.value);
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="">Select component to add...</option>
                        {getAvailableEmolumentComponents().map((component) => (
                          <option
                            key={component.component_code}
                            value={component.component_code}
                          >
                            {component.component_name} ({component.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {getAvailableEmolumentComponents().length === 0 &&
                  Object.keys(formData.emoluments).length > 0 && (
                    <div className="text-center py-4 text-gray-500">
                      All available components have been added
                    </div>
                  )}
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
              className="flex items-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
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
                    {editingPayGrade ? "Update Pay Grade" : "Create Pay Grade"}
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

export default PayGradeForm;
