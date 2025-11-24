"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Shield,
  Calculator,
  List,
  Edit2,
  X,
  History,
  RefreshCw,
  Save,
} from "lucide-react";

/**
 * Payroll Settings Tab - EDITABLE Configuration
 * Manages Nigeria 2025 payroll defaults with audit trail
 */
export default function PayrollSettingsTab({ currentTheme, user, setError }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("tax");
  const [editingKey, setEditingKey] = useState(null);
  const [editedValue, setEditedValue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

      console.log("🔍 Fetching settings from:", `${API_URL}/payroll/settings`);

      const response = await fetch(`${API_URL}/payroll/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();

      console.log("✅ API Response:", data);
      console.log("📊 Settings data:", data.data);
      console.log("🔢 Number of settings:", data.data?.length);

      setSettings(data.data);
    } catch (error) {
      console.error("❌ Error fetching settings:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (settingKey, currentValue) => {
    setEditingKey(settingKey);
    setEditedValue(JSON.parse(JSON.stringify(currentValue)));
  };

  const handleSave = async (settingKey) => {
    const reason = prompt("Reason for this change:");
    if (!reason) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const response = await fetch(
        `${API_URL}/payroll/settings/${settingKey}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ setting_value: editedValue, reason }),
        }
      );
      if (!response.ok) throw new Error("Failed to save settings");
      await fetchSettings();
      setEditingKey(null);
      setEditedValue(null);
      alert("Settings updated successfully!");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (settingKey) => {
    if (!confirm(`Reset ${settingKey} to Nigeria 2025 defaults?`)) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const response = await fetch(
        `${API_URL}/payroll/settings/${settingKey}/reset`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to reset");
      await fetchSettings();
      alert("Settings reset to defaults!");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const viewHistory = async (settingKey) => {
    try {
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const response = await fetch(
        `${API_URL}/payroll/settings/history/${settingKey}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistoryData(data.data);
      setShowHistory(true);
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sections = [
    { id: "tax", name: "Tax Configuration", icon: FileText },
    { id: "statutory", name: "Statutory Deductions", icon: Shield },
    { id: "formulas", name: "Calculation Formulas", icon: Calculator },
    { id: "components", name: "Universal Components", icon: List },
  ];

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
              Production Impact Warning
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Changes affect all future payroll calculations. Verify with
              HR/Finance before modifying.
            </p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {sections.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeSection === id
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800"
            }`}
          >
            <Icon className="w-4 h-4" />
            {name}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === "tax" && (
        <TaxConfigurationSection
          settings={settings}
          editingKey={editingKey}
          editedValue={editedValue}
          saving={saving}
          onEdit={handleEdit}
          onSave={handleSave}
          onReset={handleReset}
          onCancel={() => {
            setEditingKey(null);
            setEditedValue(null);
          }}
          onViewHistory={viewHistory}
          setEditedValue={setEditedValue}
          currentTheme={currentTheme}
        />
      )}

      {activeSection === "statutory" && (
        <StatutoryDeductionsSection
          settings={settings}
          editingKey={editingKey}
          editedValue={editedValue}
          saving={saving}
          onEdit={handleEdit}
          onSave={handleSave}
          onReset={handleReset}
          onCancel={() => {
            setEditingKey(null);
            setEditedValue(null);
          }}
          setEditedValue={setEditedValue}
          currentTheme={currentTheme}
        />
      )}

      {activeSection === "formulas" && (
        <CalculationFormulasSection
          settings={settings}
          editingKey={editingKey}
          editedValue={editedValue}
          saving={saving}
          onEdit={handleEdit}
          onSave={handleSave}
          onReset={handleReset}
          onCancel={() => {
            setEditingKey(null);
            setEditedValue(null);
          }}
          setEditedValue={setEditedValue}
          currentTheme={currentTheme}
        />
      )}

      {activeSection === "components" && (
        <UniversalComponentsSection
          settings={settings}
          currentTheme={currentTheme}
        />
      )}

      {showHistory && (
        <HistoryModal
          data={historyData}
          onClose={() => setShowHistory(false)}
          currentTheme={currentTheme}
        />
      )}
    </div>
  );
}

// Tax Configuration Section
function TaxConfigurationSection({
  settings,
  editingKey,
  editedValue,
  saving,
  onEdit,
  onSave,
  onReset,
  onCancel,
  onViewHistory,
  setEditedValue,
  currentTheme,
}) {
  const payeBrackets = settings?.find((s) => s.setting_key === "PAYE_BRACKETS");
  const taxExemption = settings?.find((s) => s.setting_key === "TAX_EXEMPTION");
  const isEditingBrackets = editingKey === "PAYE_BRACKETS";
  const isEditingExemption = editingKey === "TAX_EXEMPTION";

  return (
    <div className="space-y-6">
      {/* PAYE Brackets */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              PAYE Tax Brackets
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Progressive tax rates (Nigeria 2025)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onViewHistory("PAYE_BRACKETS")}
              className="p-2 border rounded hover:bg-gray-50"
              title="View history"
            >
              <History className="w-4 h-4" />
            </button>
            {!isEditingBrackets ? (
              <>
                <button
                  onClick={() =>
                    onEdit("PAYE_BRACKETS", payeBrackets?.setting_value)
                  }
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Edit2 className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => onReset("PAYE_BRACKETS")}
                  className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 inline mr-1" />
                  Reset
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSave("PAYE_BRACKETS")}
                  disabled={saving}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-1" />
                  Save
                </button>
                <button
                  onClick={onCancel}
                  disabled={saving}
                  className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-sm font-medium">Tier</th>
              <th className="text-left py-3 px-4 text-sm font-medium">
                Annual Income Range
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium">
                Tax Rate (%)
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {(isEditingBrackets
              ? editedValue
              : payeBrackets?.setting_value
            )?.map((bracket, index) => (
              <tr key={index} className="border-b">
                <td className="py-3 px-4 text-sm">{bracket.tier}</td>
                <td className="py-3 px-4 text-sm">
                  ₦{bracket.min?.toLocaleString()} -{" "}
                  {bracket.max ? `₦${bracket.max.toLocaleString()}` : "Above"}
                </td>
                <td className="py-3 px-4">
                  {isEditingBrackets ? (
                    <input
                      type="number"
                      value={bracket.rate}
                      onChange={(e) => {
                        const newBrackets = [...editedValue];
                        newBrackets[index].rate = parseFloat(e.target.value);
                        setEditedValue(newBrackets);
                      }}
                      className="w-24 px-2 py-1 text-sm border rounded"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  ) : (
                    <span className="text-sm">{bracket.rate}%</span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {bracket.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tax Exemption */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Tax Exemption Threshold
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              CRA + 20% of Gross Income
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditingExemption ? (
              <>
                <button
                  onClick={() =>
                    onEdit("TAX_EXEMPTION", taxExemption?.setting_value)
                  }
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Edit2 className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => onReset("TAX_EXEMPTION")}
                  className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 inline mr-1" />
                  Reset
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSave("TAX_EXEMPTION")}
                  disabled={saving}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Save className="w-4 h-4 inline mr-1" />
                  Save
                </button>
                <button
                  onClick={onCancel}
                  disabled={saving}
                  className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Annual Exemption (₦)
            </label>
            {isEditingExemption ? (
              <input
                type="number"
                value={editedValue?.annual_exemption || 0}
                onChange={(e) =>
                  setEditedValue({
                    ...editedValue,
                    annual_exemption: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded"
              />
            ) : (
              <p className="text-2xl font-bold text-green-600">
                ₦
                {taxExemption?.setting_value?.annual_exemption?.toLocaleString()}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              CRA Percentage (%)
            </label>
            {isEditingExemption ? (
              <input
                type="number"
                value={editedValue?.cra_percentage || 0}
                onChange={(e) =>
                  setEditedValue({
                    ...editedValue,
                    cra_percentage: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded"
                min="0"
                max="100"
              />
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {taxExemption?.setting_value?.cra_percentage}%
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Statutory Deductions Section
function StatutoryDeductionsSection({
  settings,
  editingKey,
  editedValue,
  saving,
  onEdit,
  onSave,
  onReset,
  onCancel,
  setEditedValue,
  currentTheme,
}) {
  const statutorySettings = [
    { key: "PENSION_RATE", name: "Pension", legal: "Pension Reform Act 2014" },
    { key: "NHF_RATE", name: "NHF", legal: "National Housing Fund Act" },
    {
      key: "NSITF_RATE",
      name: "NSITF",
      legal: "Employees Compensation Act 2010",
    },
    { key: "ITF_RATE", name: "ITF", legal: "Industrial Training Fund Act" },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {statutorySettings.map(({ key, name, legal }) => {
        const setting = settings?.find((s) => s.setting_key === key);
        const isEditing = editingKey === key;

        return (
          <div
            key={key}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {legal}
                </p>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => onEdit(key, setting?.setting_value)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onReset(key)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onSave(key)}
                      disabled={saving}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onCancel}
                      disabled={saving}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {key === "PENSION_RATE" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Employee Rate (%)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedValue?.employee_rate || 0}
                      onChange={(e) =>
                        setEditedValue({
                          ...editedValue,
                          employee_rate: parseFloat(e.target.value),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {setting?.setting_value?.employee_rate}%
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Employer Rate (%)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedValue?.employer_rate || 0}
                      onChange={(e) =>
                        setEditedValue({
                          ...editedValue,
                          employer_rate: parseFloat(e.target.value),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {setting?.setting_value?.employer_rate}%
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">Rate (%)</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedValue?.rate || 0}
                    onChange={(e) =>
                      setEditedValue({
                        ...editedValue,
                        rate: parseFloat(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                ) : (
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {setting?.setting_value?.rate}%
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  {setting?.description}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Calculation Formulas Section
function CalculationFormulasSection({
  settings,
  editingKey,
  editedValue,
  saving,
  onEdit,
  onSave,
  onReset,
  onCancel,
  setEditedValue,
  currentTheme,
}) {
  const formulas = [
    { key: "GROSS_PAY_FORMULA", name: "Gross Pay Calculation" },
    { key: "TAXABLE_INCOME_FORMULA", name: "Taxable Income Calculation" },
    { key: "NET_PAY_FORMULA", name: "Net Pay Calculation" },
  ];

  const [testResults, setTestResults] = useState({});

  const handleTestFormula = async (key) => {
    try {
      const response = await fetch("/api/payroll/settings/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formula: editedValue?.formula,
          formula_type: key,
        }),
      });
      const data = await response.json();
      setTestResults({ ...testResults, [key]: data });
    } catch (error) {
      setTestResults({
        ...testResults,
        [key]: { valid: false, message: error.message },
      });
    }
  };

  return (
    <div className="space-y-4">
      {formulas.map(({ key, name }) => {
        const setting = settings?.find((s) => s.setting_key === key);
        const isEditing = editingKey === key;
        const testResult = testResults[key];

        return (
          <div
            key={key}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {name}
                  </h3>
                  {!isEditing && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                      Valid
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => onEdit(key, setting?.setting_value)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => onReset(key)}
                        className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                        Reset
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleTestFormula(key)}
                        className="px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                        Test
                      </button>
                      <button
                        onClick={() => onSave(key)}
                        disabled={saving}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <Save className="w-3.5 h-3.5 inline mr-1" />
                        Save
                      </button>
                      <button
                        onClick={onCancel}
                        disabled={saving}
                        className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
                      >
                        <X className="w-3.5 h-3.5 inline mr-1" />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Formula Expression
                </label>
                {isEditing ? (
                  <textarea
                    value={editedValue?.formula || ""}
                    onChange={(e) =>
                      setEditedValue({
                        ...editedValue,
                        formula: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded font-mono text-sm"
                    rows={3}
                    placeholder="e.g., BASIC_SALARY + HOUSING + TRANSPORT"
                  />
                ) : (
                  <pre className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded border text-sm font-mono">
                    {setting?.setting_value?.formula}
                  </pre>
                )}
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Components Used
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {setting?.setting_value?.components?.map((comp) => (
                      <span
                        key={comp}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {testResult && (
                <div
                  className={`p-3 rounded border ${
                    testResult.valid
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p
                        className={`font-medium ${
                          testResult.valid ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {testResult.valid
                          ? "✓ Valid Formula"
                          : "✗ Invalid Formula"}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          testResult.valid ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Universal Components Section
function UniversalComponentsSection({ settings, currentTheme }) {
  const components = settings?.find(
    (s) => s.setting_key === "UNIVERSAL_COMPONENTS"
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-300">
              System-Wide Components (Read-Only)
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              These 11 components are available for all clients. For
              client-specific components, go to{" "}
              <strong>
                Contract Management → Job Function Setup → Manage Components
              </strong>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium">Code</th>
              <th className="text-left py-3 px-4 text-sm font-medium">Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium">
                Category
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium">
                Pensionable
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {components?.setting_value?.map((comp, index) => (
              <tr
                key={index}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="py-3 px-4">
                  <span className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded">
                    {comp.code}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm font-medium">{comp.name}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      comp.category === "Allowance"
                        ? "bg-green-100 text-green-700"
                        : comp.category === "Deduction"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {comp.category}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {comp.pensionable ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {comp.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// History Modal
function HistoryModal({ data, onClose, currentTheme }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Change History
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium">Date</th>
                <th className="text-left py-2 text-sm font-medium">
                  Changed By
                </th>
                <th className="text-left py-2 text-sm font-medium">Reason</th>
                <th className="text-left py-2 text-sm font-medium">Changes</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3 text-sm">
                    {new Date(entry.updated_at).toLocaleString()}
                  </td>
                  <td className="py-3 text-sm">{entry.updated_by_name}</td>
                  <td className="py-3 text-sm">{entry.last_modified_reason}</td>
                  <td className="py-3 text-sm text-gray-600">
                    {entry.changes_summary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
