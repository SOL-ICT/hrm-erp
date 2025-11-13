/**
 * Live Preview - Real-time calculation preview showing how the template works
 * Updates automatically as user modifies components
 */

"use client";

import React from "react";
import {
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  RefreshCw,
} from "lucide-react";

const LivePreview = ({
  results,
  sampleData,
  onUpdateSampleData,
  components,
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleSampleDataChange = (field, value) => {
    onUpdateSampleData({
      ...sampleData,
      [field]: parseFloat(value) || 0,
    });
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Live Preview
            </h2>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full animate-pulse">
            Live
          </span>
        </div>

        <p className="text-sm text-gray-600">
          Preview how your template calculates invoices. Adjust sample values to
          test different scenarios.
        </p>

        {/* Sample Data Inputs */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Sample Employee Data
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Basic Salary
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={sampleData.basicSalary}
                onChange={(e) =>
                  handleSampleDataChange("basicSalary", e.target.value)
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                step="10000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendance Days
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={sampleData.attendanceDays}
                  onChange={(e) =>
                    handleSampleDataChange("attendanceDays", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max={sampleData.totalWorkingDays}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Days
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={sampleData.totalWorkingDays}
                  onChange={(e) =>
                    handleSampleDataChange("totalWorkingDays", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Attendance Percentage Indicator */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Attendance Rate
              </span>
              <span className="text-lg font-bold text-indigo-600">
                {(
                  (sampleData.attendanceDays / sampleData.totalWorkingDays) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (sampleData.attendanceDays / sampleData.totalWorkingDays) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Calculation Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Calculation Results
            </h3>
            <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />
          </div>

          {/* Basic Salary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-700 mb-1">Basic Salary</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(results.basicSalary)}
            </div>
          </div>

          {/* Allowances */}
          {Object.keys(results.allowances).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-green-700">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Allowances</span>
              </div>
              {Object.entries(results.allowances).map(([key, value]) => {
                const component = components.find((c) => c.id === key);
                return (
                  <div
                    key={key}
                    className="flex justify-between items-center pl-6 py-2 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">
                      {component?.label || key}
                    </span>
                    <span className="text-sm font-semibold text-green-700">
                      +{formatCurrency(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Gross Salary */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-green-300 rounded-lg p-4">
            <div className="text-sm text-green-700 mb-1">Gross Salary</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(results.grossSalary)}
            </div>
          </div>

          {/* Deductions */}
          {Object.keys(results.deductions).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-orange-700">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">Deductions</span>
              </div>
              {Object.entries(results.deductions).map(([key, value]) => {
                const component = components.find((c) => c.id === key);
                return (
                  <div
                    key={key}
                    className="flex justify-between items-center pl-6 py-2 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">
                      {component?.label || key}
                    </span>
                    <span className="text-sm font-semibold text-orange-700">
                      -{formatCurrency(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Statutory */}
          {Object.keys(results.statutory).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-700">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Statutory Deductions
                </span>
              </div>
              {Object.entries(results.statutory).map(([key, value]) => {
                const component = components.find((c) => c.id === key);
                return (
                  <div
                    key={key}
                    className="flex justify-between items-center pl-6 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">
                      {component?.label || key}
                    </span>
                    <span className="text-sm font-semibold text-blue-700">
                      -{formatCurrency(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total Deductions */}
          {results.totalDeductions > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-700 mb-1">Total Deductions</div>
              <div className="text-xl font-bold text-red-900">
                {formatCurrency(results.totalDeductions)}
              </div>
            </div>
          )}

          {/* Net Salary - Final Result */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm opacity-90">Net Salary</div>
              <DollarSign className="w-5 h-5 opacity-75" />
            </div>
            <div className="text-3xl font-bold">
              {formatCurrency(results.netSalary)}
            </div>
            <div className="mt-3 pt-3 border-t border-white border-opacity-20">
              <div className="text-xs opacity-75">
                {results.netSalary > 0
                  ? `Take-home pay after ${
                      Object.keys(results.deductions).length +
                      Object.keys(results.statutory).length
                    } deductions`
                  : "Configure components to see calculation"}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {components.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Template Summary
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Object.keys(results.allowances).length}
                </div>
                <div className="text-xs text-gray-600">Allowances</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(results.deductions).length}
                </div>
                <div className="text-xs text-gray-600">Deductions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(results.statutory).length}
                </div>
                <div className="text-xs text-gray-600">Statutory</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;
