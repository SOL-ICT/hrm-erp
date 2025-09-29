"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";

const EmolumentComponentForm = ({
  isOpen,
  onClose,
  editingComponent,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    component_code: "",
    component_name: "",
    status: "regular",
    type: "fixed_allowance",
    class: "cash_item",
    client_account: "",
    ledger_account_code: "",
    ledger_account_name: "",
    category: "allowance",
    is_taxable: true,
    calculation_method: "fixed",
    description: "",
    display_order: 100,
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingComponent) {
        setFormData({
          component_code: editingComponent.component_code || "",
          component_name: editingComponent.component_name || "",
          status: editingComponent.status || "regular",
          type: editingComponent.type || "fixed_allowance",
          class: editingComponent.class || "cash_item",
          client_account: editingComponent.client_account || "",
          ledger_account_code: editingComponent.ledger_account_code || "",
          ledger_account_name: editingComponent.ledger_account_name || "",
          category: editingComponent.category || "allowance",
          is_taxable:
            editingComponent.is_taxable !== undefined
              ? editingComponent.is_taxable
              : true,
          calculation_method: editingComponent.calculation_method || "fixed",
          description: editingComponent.description || "",
          display_order: editingComponent.display_order || 100,
          is_active:
            editingComponent.is_active !== undefined
              ? editingComponent.is_active
              : true,
        });
      } else {
        resetForm();
      }
      setErrors({});
    }
  }, [editingComponent, isOpen]);

  const resetForm = () => {
    setFormData({
      component_code: "",
      component_name: "",
      status: "regular",
      type: "fixed_allowance",
      class: "cash_item",
      client_account: "",
      ledger_account_code: "",
      ledger_account_name: "",
      category: "allowance",
      is_taxable: true,
      calculation_method: "fixed",
      description: "",
      display_order: 100,
      is_active: true,
    });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.component_code.trim()) {
      newErrors.component_code = "Component code is required";
    }

    if (!formData.component_name.trim()) {
      newErrors.component_name = "Component name is required";
    }

    if (!formData.client_account.trim()) {
      newErrors.client_account = "Client account is required";
    }

    if (!formData.ledger_account_code.trim()) {
      newErrors.ledger_account_code = "Ledger account code is required";
    }

    if (!formData.ledger_account_name.trim()) {
      newErrors.ledger_account_name = "Ledger account name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const url = editingComponent
        ? `/api/salary-structure/emolument-components/${editingComponent.id}`
        : "/api/salary-structure/emolument-components";

      const method = editingComponent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `Component ${editingComponent ? "updated" : "created"} successfully!`
        );
        onSave();
        onClose();
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          alert(
            data.message ||
              `Error ${editingComponent ? "updating" : "creating"} component`
          );
        }
      }
    } catch (error) {
      console.error("Error saving component:", error);
      alert(
        `Error ${
          editingComponent ? "updating" : "creating"
        } component. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {editingComponent ? "Edit" : "Add"} Emolument Component
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Component Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Code *
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.component_code ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., SALARY, TRANSPORT"
                disabled={loading}
              />
              {errors.component_code && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.component_code}
                </p>
              )}
            </div>

            {/* Component Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Name *
              </label>
              <input
                type="text"
                value={formData.component_name}
                onChange={(e) =>
                  handleInputChange("component_name", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.component_name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Basic Salary, Transport Allowance"
                disabled={loading}
              />
              {errors.component_name && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.component_name}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="regular">Regular</option>
                <option value="benefit">Benefit</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="fixed_allowance">Fixed Allowance</option>
                <option value="variable_allowance">Variable Allowance</option>
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                value={formData.class}
                onChange={(e) => handleInputChange("class", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="cash_item">Cash Item</option>
                <option value="non_cash_item">Non-Cash Item</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="basic">Basic</option>
                <option value="allowance">Allowance</option>
                <option value="deduction">Deduction</option>
                <option value="benefit">Benefit</option>
              </select>
            </div>

            {/* Client Account */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Account *
              </label>
              <input
                type="text"
                value={formData.client_account}
                onChange={(e) =>
                  handleInputChange("client_account", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.client_account ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Salary and Emolument"
                disabled={loading}
              />
              {errors.client_account && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.client_account}
                </p>
              )}
            </div>

            {/* Ledger Account Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ledger Account Code *
              </label>
              <input
                type="text"
                value={formData.ledger_account_code}
                onChange={(e) =>
                  handleInputChange("ledger_account_code", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.ledger_account_code
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="e.g., 270001"
                disabled={loading}
              />
              {errors.ledger_account_code && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.ledger_account_code}
                </p>
              )}
            </div>

            {/* Ledger Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ledger Account Name *
              </label>
              <input
                type="text"
                value={formData.ledger_account_name}
                onChange={(e) =>
                  handleInputChange("ledger_account_name", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.ledger_account_name
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="e.g., Client Account - Salary And Emolument"
                disabled={loading}
              />
              {errors.ledger_account_name && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.ledger_account_name}
                </p>
              )}
            </div>

            {/* Calculation Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calculation Method
              </label>
              <select
                value={formData.calculation_method}
                onChange={(e) =>
                  handleInputChange("calculation_method", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
                <option value="formula">Formula</option>
              </select>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  handleInputChange(
                    "display_order",
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="0"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Optional description for the component"
                disabled={loading}
              />
            </div>

            {/* Checkboxes */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_taxable"
                  checked={formData.is_taxable}
                  onChange={(e) =>
                    handleInputChange("is_taxable", e.target.checked)
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={loading}
                />
                <label
                  htmlFor="is_taxable"
                  className="ml-2 text-sm text-gray-700"
                >
                  Taxable Component
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    handleInputChange("is_active", e.target.checked)
                  }
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={loading}
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 text-sm text-gray-700"
                >
                  Active
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {loading ? "Saving..." : editingComponent ? "Update" : "Create"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmolumentComponentForm;
