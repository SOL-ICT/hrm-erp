"use client";

import { useState, useEffect } from "react";
import { Trash2, AlertCircle, DollarSign, Tag } from "lucide-react";

/**
 * EmolumentGridEditor - Reusable editable grid for pay grade emolument components
 *
 * Used in:
 * - PayGradeForm (manual entry via Load Universal Template / Add Custom Component)
 * - BulkUploadModal (preview after Excel upload)
 *
 * Features:
 * - Editable amount cells
 * - Auto-calculates total compensation (Basic + Allowances + Benefits)
 * - Remove component rows
 * - Color-coded category badges
 * - Dark mode support
 */
const EmolumentGridEditor = ({
  emoluments = [],
  onChange,
  onRemoveComponent,
  currentTheme = "light",
  readOnly = false,
  showRemoveButton = true,
  className = "",
}) => {
  const [localEmoluments, setLocalEmoluments] = useState(emoluments);
  const [totalCompensation, setTotalCompensation] = useState(0);

  // Sync with parent emoluments prop
  useEffect(() => {
    setLocalEmoluments(emoluments);
  }, [emoluments]);

  // Calculate total compensation when emoluments change
  useEffect(() => {
    calculateTotalCompensation();
  }, [localEmoluments]);

  const calculateTotalCompensation = () => {
    // Sum ALL emolument amounts (Salary + Allowance + Deduction + Reimbursable)
    // This represents the ANNUAL GROSS SALARY AND EMOLUMENTS
    const total = localEmoluments.reduce((sum, emolument) => {
      const amount = parseFloat(emolument.amount) || 0;
      console.log(
        `Component: ${
          emolument.component_code || emolument.code
        }, Amount: ${amount}`
      );
      return sum + amount;
    }, 0);

    console.log(`Total Annual Gross Compensation: ${total}`);
    setTotalCompensation(total);
  };

  const handleAmountChange = (index, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedEmoluments = [...localEmoluments];
    updatedEmoluments[index] = {
      ...updatedEmoluments[index],
      amount: numericValue,
    };

    setLocalEmoluments(updatedEmoluments);

    // Notify parent component
    if (onChange) {
      onChange(updatedEmoluments);
    }
  };

  const handleRemove = (index) => {
    const componentToRemove = localEmoluments[index];
    const updatedEmoluments = localEmoluments.filter((_, i) => i !== index);

    setLocalEmoluments(updatedEmoluments);

    // Notify parent component
    if (onChange) {
      onChange(updatedEmoluments);
    }

    if (onRemoveComponent) {
      onRemoveComponent(componentToRemove);
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

  const getCategoryBadgeColor = (category) => {
    const categoryLower = category?.toLowerCase();
    switch (categoryLower) {
      case "basic":
      case "salary":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "allowance":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "benefit":
      case "reimbursable":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "deduction":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatCategoryName = (category) => {
    if (!category) return "N/A";
    // Capitalize first letter of each word
    return category
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const isDark = currentTheme === "dark";

  if (localEmoluments.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
            isDark ? "bg-gray-800" : "bg-gray-100"
          } mb-4`}
        >
          <AlertCircle
            className={`w-8 h-8 ${isDark ? "text-gray-400" : "text-gray-400"}`}
          />
        </div>
        <h3
          className={`text-lg font-medium ${
            isDark ? "text-gray-300" : "text-gray-700"
          } mb-2`}
        >
          No Emolument Components
        </h3>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Use "Load Universal Template" or "Add Custom Component" to add
          emolument components.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Emoluments Grid Table */}
      <div
        className={`rounded-lg border ${
          isDark ? "border-gray-700" : "border-gray-200"
        } overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
              <tr>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  } uppercase tracking-wider`}
                >
                  Code
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  } uppercase tracking-wider`}
                >
                  Component Name
                </th>
                <th
                  className={`px-4 py-3 text-left text-xs font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  } uppercase tracking-wider`}
                >
                  Category
                </th>
                <th
                  className={`px-4 py-3 text-center text-xs font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  } uppercase tracking-wider`}
                >
                  Pensionable
                </th>
                <th
                  className={`px-4 py-3 text-right text-xs font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  } uppercase tracking-wider`}
                >
                  Amount (₦)
                </th>
                {showRemoveButton && !readOnly && (
                  <th
                    className={`px-4 py-3 text-center text-xs font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    } uppercase tracking-wider`}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody
              className={`${isDark ? "bg-gray-900" : "bg-white"} divide-y ${
                isDark ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              {localEmoluments.map((emolument, index) => (
                <tr
                  key={`${emolument.component_code}-${index}`}
                  className={`hover:${
                    isDark ? "bg-gray-800" : "bg-gray-50"
                  } transition-colors`}
                >
                  {/* Component Code */}
                  <td
                    className={`px-4 py-3 text-sm ${
                      isDark ? "text-gray-300" : "text-gray-900"
                    } font-mono`}
                  >
                    <div className="flex items-center">
                      <Tag
                        className={`w-4 h-4 mr-2 ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      {emolument.component_code}
                    </div>
                  </td>

                  {/* Component Name */}
                  <td
                    className={`px-4 py-3 text-sm ${
                      isDark ? "text-gray-300" : "text-gray-900"
                    }`}
                  >
                    {emolument.component_name || emolument.name}
                  </td>

                  {/* Category Badge */}
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(
                        emolument.payroll_category || emolument.category
                      )}`}
                    >
                      {formatCategoryName(
                        emolument.payroll_category || emolument.category
                      )}
                    </span>
                  </td>

                  {/* Pensionable */}
                  <td className="px-4 py-3 text-sm text-center">
                    {emolument.is_pensionable ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓
                      </span>
                    ) : (
                      <span
                        className={`${
                          isDark ? "text-gray-600" : "text-gray-400"
                        }`}
                      >
                        —
                      </span>
                    )}
                  </td>

                  {/* Amount Input */}
                  <td className="px-4 py-3 text-sm text-right">
                    {readOnly ? (
                      <span
                        className={`font-semibold ${
                          isDark ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {formatCurrency(emolument.amount || 0)}
                      </span>
                    ) : (
                      <div className="relative inline-block w-40">
                        <span
                          className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          } text-sm`}
                        >
                          ₦
                        </span>
                        <input
                          type="number"
                          value={emolument.amount || 0}
                          onChange={(e) =>
                            handleAmountChange(index, e.target.value)
                          }
                          className={`w-full pl-8 pr-3 py-2 text-right rounded-lg border ${
                            isDark
                              ? "bg-gray-800 border-gray-700 text-gray-200 focus:border-blue-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-blue-500"
                          } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                  </td>

                  {/* Remove Button */}
                  {showRemoveButton && !readOnly && (
                    <td className="px-4 py-3 text-sm text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className={`p-2 rounded-lg ${
                          isDark
                            ? "text-red-400 hover:bg-red-900/30"
                            : "text-red-600 hover:bg-red-50"
                        } transition-colors`}
                        title="Remove component"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total Compensation Summary */}
      <div
        className={`mt-4 p-4 rounded-lg border ${
          isDark
            ? "border-green-800 bg-green-900/20"
            : "border-green-200 bg-green-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign
              className={`w-5 h-5 mr-2 ${
                isDark ? "text-green-400" : "text-green-600"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Annual Gross Salary & Emoluments
            </span>
            <span
              className={`ml-2 text-xs ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              (All Components)
            </span>
          </div>
          <div
            className={`text-2xl font-bold ${
              isDark ? "text-green-400" : "text-green-700"
            }`}
          >
            {formatCurrency(totalCompensation)}
          </div>
        </div>
      </div>

      {/* Component Count Info */}
      <div
        className={`mt-2 text-sm ${
          isDark ? "text-gray-400" : "text-gray-600"
        } text-right`}
      >
        {localEmoluments.length} component
        {localEmoluments.length !== 1 ? "s" : ""} configured
      </div>
    </div>
  );
};

export default EmolumentGridEditor;
