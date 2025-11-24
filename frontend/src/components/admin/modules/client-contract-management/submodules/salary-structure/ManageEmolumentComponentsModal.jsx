"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  XCircle,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Tag,
  FileText,
  Settings,
} from "lucide-react";

export default function ManageEmolumentComponentsModal({
  isOpen,
  onClose,
  currentClient,
  currentTheme,
  onComponentCreated,
}) {
  // State Management
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    component_code: "",
    component_name: "",
    description: "",
    category: "allowance",
    payroll_category: "allowance",
    is_pensionable: false,
    is_taxable: true,
  });

  const [formErrors, setFormErrors] = useState({});

  // Load components on mount or when client changes
  useEffect(() => {
    if (isOpen && currentClient) {
      fetchComponents();
    }
  }, [isOpen, currentClient]);

  // Fetch client-specific components
  const fetchComponents = async () => {
    if (!currentClient?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/emolument-components?client_id=${currentClient.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Filter client-specific components only (not universal)
        const clientComponents = data.data.filter(
          (comp) => comp.client_id === currentClient.id
        );
        setComponents(clientComponents);
      } else {
        setError(data.message || "Failed to load components");
      }
    } catch (err) {
      console.error("Error fetching components:", err);
      setError("Failed to load components. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Auto-generate component code from name
  const generateComponentCode = (name) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  // Handle component name change with auto-code generation
  const handleNameChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      component_name: value,
      component_code: editingComponent
        ? prev.component_code
        : generateComponentCode(value),
    }));
    if (formErrors.component_name) {
      setFormErrors((prev) => ({ ...prev, component_name: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.component_code.trim()) {
      errors.component_code = "Component code is required";
    } else if (!/^[A-Z0-9_]+$/.test(formData.component_code)) {
      errors.component_code =
        "Component code must contain only uppercase letters, numbers, and underscores";
    }

    if (!formData.component_name.trim()) {
      errors.component_name = "Component name is required";
    } else if (formData.component_name.length > 255) {
      errors.component_name = "Component name must not exceed 255 characters";
    }

    // Check for duplicate code (excluding current component if editing)
    const isDuplicate = components.some(
      (comp) =>
        comp.component_code === formData.component_code &&
        comp.id !== editingComponent?.id
    );
    if (isDuplicate) {
      errors.component_code =
        "This component code already exists for this client";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create/update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        ...formData,
        client_id: currentClient.id,
        is_universal_template: false,
      };

      const url = editingComponent
        ? `/api/emolument-components/${editingComponent.id}`
        : "/api/emolument-components";

      const method = editingComponent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(
          editingComponent
            ? "Component updated successfully"
            : "Component created successfully"
        );

        // Refresh components list
        await fetchComponents();

        // Reset form
        resetForm();

        // Notify parent component
        if (onComponentCreated) {
          onComponentCreated(data.data);
        }

        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || "Failed to save component");
      }
    } catch (err) {
      console.error("Error saving component:", err);
      setError("Failed to save component. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle edit
  const handleEdit = (component) => {
    setEditingComponent(component);
    setFormData({
      component_code: component.component_code,
      component_name: component.component_name,
      description: component.description || "",
      category: component.category || "allowance",
      payroll_category: component.payroll_category || "allowance",
      is_pensionable: component.is_pensionable || false,
      is_taxable: component.is_taxable !== false, // Default true
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  // Handle delete
  const handleDelete = async (componentId) => {
    if (
      !confirm(
        "Are you sure you want to delete this component? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/emolument-components/${componentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Component deleted successfully");
        await fetchComponents();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || "Failed to delete component");
      }
    } catch (err) {
      console.error("Error deleting component:", err);
      setError("Failed to delete component. Please try again.");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      component_code: "",
      component_name: "",
      description: "",
      category: "allowance",
      payroll_category: "allowance",
      is_pensionable: false,
      is_taxable: true,
    });
    setFormErrors({});
    setEditingComponent(null);
    setShowForm(false);
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  // Theme-based styles
  const isDark = currentTheme === "dark";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        } rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">
                Manage Custom Emolument Components
              </h2>
              <p className="text-indigo-100 text-sm">
                {currentClient?.client_name || "No client selected"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Alert Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {/* Info Banner */}
          <div
            className={`${
              isDark
                ? "bg-blue-900 border-blue-700"
                : "bg-blue-50 border-blue-200"
            } border px-4 py-3 rounded-lg mb-6 flex items-start space-x-3`}
          >
            <AlertCircle
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                isDark ? "text-blue-300" : "text-blue-600"
              }`}
            />
            <div className={isDark ? "text-blue-100" : "text-blue-800"}>
              <p className="text-sm font-medium">
                Custom components are client-specific
              </p>
              <p className="text-xs mt-1">
                These components will be available for this client's pay grades
                in addition to the 11 universal components. They will also
                appear as columns in bulk upload templates.
              </p>
            </div>
          </div>

          {/* Action Button */}
          {!showForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Component</span>
              </button>
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div
              className={`${
                isDark
                  ? "bg-gray-750 border-gray-600"
                  : "bg-gray-50 border-gray-200"
              } border rounded-lg p-6 mb-6`}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Tag className="w-5 h-5" />
                <span>
                  {editingComponent ? "Edit Component" : "New Component"}
                </span>
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Component Name & Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Component Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.component_name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        formErrors.component_name
                          ? "border-red-500"
                          : isDark
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-300 bg-white"
                      } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                      placeholder="e.g., Car Maintenance Allowance"
                      maxLength={255}
                    />
                    {formErrors.component_name && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.component_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Component Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.component_code}
                      onChange={(e) =>
                        handleInputChange(
                          "component_code",
                          e.target.value.toUpperCase()
                        )
                      }
                      className={`w-full px-3 py-2 rounded-lg border ${
                        formErrors.component_code
                          ? "border-red-500"
                          : isDark
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-300 bg-white"
                      } focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono`}
                      placeholder="CAR_MAINTENANCE"
                      maxLength={50}
                    />
                    {formErrors.component_code && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.component_code}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Uppercase letters, numbers, and underscores only
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? "border-gray-600 bg-gray-700"
                        : "border-gray-300 bg-white"
                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    placeholder="Optional description of this component"
                  />
                </div>

                {/* Category & Payroll Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-300 bg-white"
                      } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    >
                      <option value="basic">Basic</option>
                      <option value="allowance">Allowance</option>
                      <option value="deduction">Deduction</option>
                      <option value="benefit">Benefit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Payroll Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.payroll_category}
                      onChange={(e) =>
                        handleInputChange("payroll_category", e.target.value)
                      }
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-300 bg-white"
                      } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    >
                      <option value="salary">Salary</option>
                      <option value="allowance">Allowance</option>
                      <option value="reimbursable">Reimbursable</option>
                      <option value="deduction">Deduction</option>
                      <option value="statutory">Statutory</option>
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_pensionable}
                      onChange={(e) =>
                        handleInputChange("is_pensionable", e.target.checked)
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm">Pensionable</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_taxable}
                      onChange={(e) =>
                        handleInputChange("is_taxable", e.target.checked)
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm">Taxable</span>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 pt-4 border-t border-gray-300 dark:border-gray-600">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving..." : "Save Component"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className={`${
                      isDark
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-gray-200 hover:bg-gray-300"
                    } px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Components List */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Existing Custom Components ({components.length})</span>
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-4">
                  Loading components...
                </p>
              </div>
            ) : components.length === 0 ? (
              <div
                className={`${
                  isDark
                    ? "bg-gray-750 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                } border rounded-lg p-8 text-center`}
              >
                <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">
                  No custom components created yet
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Click "Add Custom Component" to create one
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`${
                        isDark ? "bg-gray-750" : "bg-gray-100"
                      } border-b ${
                        isDark ? "border-gray-600" : "border-gray-200"
                      }`}
                    >
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                        Category
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase">
                        Pensionable
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase">
                        Taxable
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((component) => (
                      <tr
                        key={component.id}
                        className={`border-b ${
                          isDark
                            ? "border-gray-700 hover:bg-gray-750"
                            : "border-gray-200 hover:bg-gray-50"
                        } transition-colors`}
                      >
                        <td className="px-4 py-3">
                          <code
                            className={`${
                              isDark ? "bg-gray-700" : "bg-gray-100"
                            } px-2 py-1 rounded text-xs font-mono`}
                          >
                            {component.component_code}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">
                              {component.component_name}
                            </p>
                            {component.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {component.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              component.payroll_category === "allowance"
                                ? "bg-green-100 text-green-800"
                                : component.payroll_category === "deduction"
                                ? "bg-red-100 text-red-800"
                                : component.payroll_category === "salary"
                                ? "bg-blue-100 text-blue-800"
                                : component.payroll_category === "reimbursable"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {component.payroll_category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {component.is_pensionable ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {component.is_taxable !== false ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(component)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(component.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`${
            isDark
              ? "bg-gray-750 border-gray-600"
              : "bg-gray-50 border-gray-200"
          } border-t px-6 py-4 flex justify-end`}
        >
          <button
            onClick={handleClose}
            className={`${
              isDark
                ? "bg-gray-600 hover:bg-gray-700"
                : "bg-gray-200 hover:bg-gray-300"
            } px-6 py-2 rounded-lg font-medium transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
