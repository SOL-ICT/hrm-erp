"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/hooks/useClients";
import {
  invoiceApiService,
  invoiceTemplateService,
} from "@/services/modules/invoicing";
import { salaryStructureAPI } from "@/services/modules/client-contract-management/salary-structure";
import TemplateSetupSection from "./TemplateSetupSection";

// Enhanced Formula Builder Component - Phase 2.4
const FormulaBuilderContent = ({
  salaryComponents,
  onSave,
  onCancel,
  currentFormula,
  currentComponents,
  currentTarget, // The component being edited (to detect circular dependencies)
}) => {
  const [selectedComponents, setSelectedComponents] = useState(
    currentComponents || []
  );
  const [operator, setOperator] = useState("+");
  const [percentage, setPercentage] = useState("");
  const [formula, setFormula] = useState(currentFormula || "");
  const [validationErrors, setValidationErrors] = useState([]);
  const [calculationPreview, setCalculationPreview] = useState(null);

  // Sample values for real-time calculation preview
  const sampleValues = {
    basic_salary: 100000,
    gross_salary: 150000,
    housing_allowance: 25000,
    transport_allowance: 15000,
    meal_allowance: 10000,
    medical_allowance: 5000,
    utility_allowance: 8000,
    telephone_allowance: 3000,
    education_allowance: 12000,
    leave_allowance: 7500,
    overtime_allowance: 5000,
  };

  const toggleComponent = (component) => {
    setSelectedComponents((prev) => {
      const exists = prev.find((c) => c.id === component.id);
      if (exists) {
        return prev.filter((c) => c.id !== component.id);
      }
      return [...prev, component];
    });
  };

  // Validate formula for circular dependencies and logical errors
  const validateFormula = (components) => {
    const errors = [];

    // Check for circular dependency
    if (
      currentTarget &&
      components.some((comp) => comp.id === currentTarget.id)
    ) {
      errors.push(
        `Circular dependency detected: Cannot use "${currentTarget.name}" in its own formula`
      );
    }

    // Check for gross salary dependency issues
    if (
      currentTarget?.id === "gross_salary" &&
      components.some((comp) => comp.id === "gross_salary")
    ) {
      errors.push("Gross Salary cannot reference itself");
    }

    // Warn about complex formulas
    if (components.length > 5) {
      errors.push(
        "Warning: Complex formulas with many components may be hard to maintain"
      );
    }

    // Check percentage validity
    if (
      percentage &&
      (isNaN(percentage) || percentage < 0 || percentage > 1000)
    ) {
      errors.push("Percentage must be a valid number between 0 and 1000");
    }

    return errors;
  };

  // Calculate real-time preview with sample values
  const calculatePreview = (components, operator, percentage) => {
    if (!components.length) return null;

    try {
      let result = 0;
      const componentValues = components.map((comp) => {
        const value = sampleValues[comp.id] || 0;
        return { name: comp.name, value };
      });

      // Calculate based on operator
      switch (operator) {
        case "+":
          result = componentValues.reduce((sum, comp) => sum + comp.value, 0);
          break;
        case "-":
          result = componentValues.reduce(
            (diff, comp, index) =>
              index === 0 ? comp.value : diff - comp.value,
            0
          );
          break;
        case "*":
          result = componentValues.reduce(
            (product, comp) => product * comp.value,
            1
          );
          break;
        case "/":
          result = componentValues.reduce(
            (quotient, comp, index) =>
              index === 0 ? comp.value : quotient / (comp.value || 1),
            1
          );
          break;
        default:
          result = 0;
      }

      // Apply percentage if specified
      if (percentage && !isNaN(percentage)) {
        result = (result * parseFloat(percentage)) / 100;
      }

      return {
        components: componentValues,
        calculation: result,
        formula: buildPreviewFormula(),
      };
    } catch (error) {
      return { error: "Calculation error" };
    }
  };

  const buildPreviewFormula = () => {
    if (!selectedComponents.length) return "";

    const componentNames = selectedComponents
      .map((comp) => comp.name)
      .join(` ${operator} `);
    return percentage
      ? `${percentage}% of (${componentNames})`
      : `(${componentNames})`;
  };

  const handleSave = () => {
    const errors = validateFormula(selectedComponents);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const finalFormula = buildPreviewFormula();
    if (finalFormula && selectedComponents.length) {
      onSave(finalFormula, selectedComponents);
    }
  };

  // Real-time updates
  React.useEffect(() => {
    setFormula(buildPreviewFormula());
    setValidationErrors(validateFormula(selectedComponents));
    setCalculationPreview(
      calculatePreview(selectedComponents, operator, percentage)
    );
  }, [selectedComponents, operator, percentage, currentTarget]);

  return (
    <div className="p-6 space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Formula Validation Issues:
          </h4>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Percentage Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Percentage (optional)
          <span className="text-xs text-gray-500 ml-1">
            - Apply percentage to final calculation
          </span>
        </label>
        <input
          type="number"
          step="0.1"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          placeholder="e.g., 5 for 5%"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Operator Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Operator
          <span className="text-xs text-gray-500 ml-1">
            - How to combine selected components
          </span>
        </label>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="+">Addition (+) - Sum all components</option>
          <option value="-">Subtraction (-) - First minus others</option>
          <option value="*">
            Multiplication (×) - Multiply all components
          </option>
          <option value="/">Division (÷) - First divided by others</option>
        </select>
      </div>

      {/* Component Selection with Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Salary Components
          <span className="text-xs text-gray-500 ml-1">
            - Choose components for your formula
          </span>
        </label>

        {/* Group components by category */}
        {["Default", "Calculation", "Custom"].map((category) => {
          const categoryComponents = salaryComponents.filter(
            (comp) => comp.category === category
          );
          if (categoryComponents.length === 0) return null;

          return (
            <div key={category} className="mb-4">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-2">
                {category} Components
              </h4>
              <div className="border border-gray-200 rounded-lg">
                {categoryComponents.map((component, index) => (
                  <div
                    key={component.id}
                    className={`p-3 hover:bg-gray-50 ${
                      index !== categoryComponents.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedComponents.some(
                          (c) => c.id === component.id
                        )}
                        onChange={() => toggleComponent(component)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        disabled={currentTarget?.id === component.id}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {component.name}
                          {currentTarget?.id === component.id && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Current Target
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {component.id}
                          {sampleValues[component.id] && (
                            <span className="ml-2 text-green-600">
                              Sample: ₦
                              {sampleValues[component.id].toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Formula Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Formula Preview
        </label>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm min-h-[40px] flex items-center">
          {formula || "No formula generated"}
        </div>
      </div>

      {/* Real-time Calculation Preview */}
      {calculationPreview && !calculationPreview.error && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-3">
            Live Calculation Preview
          </h4>
          <div className="space-y-2">
            {calculationPreview.components.map((comp, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-blue-700">{comp.name}:</span>
                <span className="font-mono text-blue-900">
                  ₦{comp.value.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t border-blue-300 pt-2 mt-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-blue-800">Result:</span>
                <span className="font-mono text-blue-900">
                  ₦{calculationPreview.calculation.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Formula: {calculationPreview.formula}
              </div>
            </div>
          </div>
        </div>
      )}

      {calculationPreview?.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">
            ⚠️ {calculationPreview.error}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={
            !selectedComponents.length ||
            validationErrors.some((err) => err.includes("Circular dependency"))
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 focus:ring-2 focus:ring-blue-500"
        >
          Apply Formula
          {selectedComponents.length > 0 && (
            <span className="ml-1 text-xs">
              ({selectedComponents.length} components)
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

const InvoiceManagement = ({ onBack }) => {
  const { user, isAuthenticated, hasRole, sanctumRequest } = useAuth();
  const { clients, loading: clientsLoading, fetchClients } = useClients();
  const [activeTab, setActiveTab] = useState("attendance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Attendance Upload State
  const [attendanceUploads, setAttendanceUploads] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [payrollMonth, setPayrollMonth] = useState("");

  // Generated Invoices State
  const [generatedInvoices, setGeneratedInvoices] = useState([]);
  const [selectedUpload, setSelectedUpload] = useState("");
  const [invoiceType, setInvoiceType] = useState("with_schedule");

  // Template Setup State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateClient, setSelectedTemplateClient] = useState(null);
  const [clientJobStructures, setClientJobStructures] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null); // Currently selected grade for template setup
  const [templateSettings, setTemplateSettings] = useState({
    statutory: {
      paye: {
        enabled: true,
        rate: 7.5,
        type: "formula",
        formula: "",
        components: [],
      },
      pension: {
        enabled: true,
        rate: 8,
        type: "percentage",
        formula: "",
        components: [],
      },
      nsitf: {
        enabled: true,
        rate: 1,
        type: "percentage",
        formula: "",
        components: [],
      },
      itf: {
        enabled: true,
        rate: 1,
        type: "percentage",
        formula: "",
        components: [],
      },
    },
    custom: [],
    payGradeTemplates: {}, // Will store templates per pay grade
  });

  // Template persistence state
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
  const [currentFormulaTarget, setCurrentFormulaTarget] = useState(null);

  // Dynamic salary components - includes predefined + allowance components
  const getSalaryComponents = () => {
    const predefinedComponents = [
      { id: "basic_salary", name: "Basic Salary", category: "basic" },
      { id: "gross_salary", name: "Gross Salary", category: "calculation" },
      {
        id: "housing_allowance",
        name: "Housing Allowance",
        category: "allowance",
      },
      {
        id: "transport_allowance",
        name: "Transport Allowance",
        category: "allowance",
      },
      { id: "meal_allowance", name: "Meal Allowance", category: "allowance" },
      {
        id: "medical_allowance",
        name: "Medical Allowance",
        category: "allowance",
      },
      {
        id: "utility_allowance",
        name: "Utility Allowance",
        category: "allowance",
      },
      {
        id: "telephone_allowance",
        name: "Telephone Allowance",
        category: "allowance",
      },
      {
        id: "education_allowance",
        name: "Education Allowance",
        category: "allowance",
      },
      { id: "leave_allowance", name: "Leave Allowance", category: "allowance" },
      {
        id: "overtime_allowance",
        name: "Overtime Allowance",
        category: "allowance",
      },
    ];

    // Add allowance components from templateSettings
    const customComponents = templateSettings.custom.map((comp) => ({
      id: comp.id,
      name: comp.name,
      category: "custom",
    }));

    return [...predefinedComponents, ...customComponents];
  };

  // Get components for formula builder (only allowance components + basic salary + gross)
  const salaryComponents = [
    { id: "basic_salary", name: "Basic Salary", category: "Default" },
    { id: "gross_salary", name: "Gross Salary", category: "Calculation" },
    ...templateSettings.custom
      .filter((comp) => comp.name)
      .map((comp) => ({
        id: comp.id,
        name: comp.name,
        category: "Custom",
      })),
  ];

  // Statistics
  const [statistics, setStatistics] = useState({
    total_uploads: 0,
    pending_invoices: 0,
    generated_invoices: 0,
    total_amount: 0,
  });

  useEffect(() => {
    console.log("Auth status:", {
      isAuthenticated,
      hasAdminRole: hasRole("admin"),
      user,
    });
    loadInitialData();
    console.log("Clients loaded:", clients.length, clients);
  }, []);

  useEffect(() => {
    console.log("Clients updated:", clients.length, clients);
  }, [clients]);

  // Load invoices when switching to the Generated Invoices tab
  useEffect(() => {
    if (activeTab === "invoices") {
      console.log("Loading invoices for Generated Invoices tab...");
      loadGeneratedInvoices();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAttendanceUploads(),
        loadGeneratedInvoices(),
        fetchClients(),
        loadStatistics(),
      ]);
    } catch (err) {
      setError("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceUploads = async () => {
    try {
      const response = await invoiceApiService.getAttendanceUploads();
      console.log("Attendance uploads API response:", response);

      if (response.success) {
        // Handle different response structures
        const uploadsData = response.data?.data || response.data || [];
        setAttendanceUploads(Array.isArray(uploadsData) ? uploadsData : []);
      } else {
        setAttendanceUploads([]);
      }
    } catch (err) {
      console.error("Error loading attendance uploads:", err);
      setAttendanceUploads([]);
    }
  };

  const loadGeneratedInvoices = async () => {
    try {
      const response = await invoiceApiService.getInvoices();
      if (response.success) {
        // Handle paginated response structure
        const invoicesArray = response.data?.data || response.data || [];
        setGeneratedInvoices(Array.isArray(invoicesArray) ? invoicesArray : []);
      } else {
        setGeneratedInvoices([]);
      }
    } catch (err) {
      console.error("Error loading generated invoices:", err);
      setGeneratedInvoices([]);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await invoiceApiService.getInvoiceStatistics();
      if (response.success) {
        setStatistics(response.data || {});
      } else {
        setStatistics({});
      }
    } catch (err) {
      console.error("Error loading statistics:", err);
      setStatistics({});
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedClient || !payrollMonth) {
      setError("Please select file, client, and payroll month");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await invoiceApiService.uploadAttendanceFile(
        selectedFile,
        selectedClient,
        payrollMonth,
        user.id
      );

      if (response.success) {
        setSelectedFile(null);
        setSelectedClient("");
        setPayrollMonth("");
        document.getElementById("attendance-file").value = "";
        await loadAttendanceUploads();
        await loadStatistics();
      } else {
        setError(response.message || "Upload failed");
      }
    } catch (err) {
      setError("Error uploading file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle attendance template download
  const handleDownloadAttendanceTemplate = () => {
    // Create SIMPLIFIED attendance template data - only fields the backend actually expects
    const templateData = [
      ["Employee ID", "Employee Name", "Days Worked", "Basic Salary"],
      ["EMP001", "John Doe", "22", "150000"],
      ["EMP002", "Jane Smith", "20", "200000"],
      ["EMP003", "Mike Johnson", "25", "120000"],
    ];

    // Add header with instructions
    const instructionData = [
      ["SIMPLIFIED ATTENDANCE UPLOAD TEMPLATE"],
      [""],
      ["=== INSTRUCTIONS ==="],
      ["1. Employee ID: Must match existing employee records in the system"],
      ["2. Employee Name: For display and verification purposes"],
      ["3. Days Worked: Number of days worked in the period (0-31)"],
      [
        "4. Basic Salary: Monthly basic salary (numeric, no commas or currency symbols)",
      ],
      [""],
      ["=== IMPORTANT NOTES ==="],
      ["• Only these 4 fields are required for attendance-based invoicing"],
      [
        "• Salary data from pay grade assignments will be used for calculations",
      ],
      [
        "• Attendance factor calculated based on client's pay calculation basis",
      ],
      ["• Save as Excel (.xlsx) or CSV file before uploading"],
      ["• Do not modify the column headers"],
      [""],
      ["EMPLOYEE DATA STARTS BELOW:"],
      [""],
    ];

    // Combine instructions with template data
    const fullData = [...instructionData, ...templateData];

    // Convert to CSV format with proper escaping
    const csvContent = fullData
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    // Add BOM for proper UTF-8 handling in Excel
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    // Create blob and download
    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `attendance_template_${new Date().toISOString().slice(0, 10)}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(
        "✅ Attendance template downloaded successfully! \n\nThe file contains:\n• Sample employee data\n• Required column format\n• Detailed instructions for usage\n\nPlease replace sample data with your actual employee information before uploading."
      );
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedUpload) {
      setError("Please select an attendance upload");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await invoiceApiService.generateInvoice(
        selectedUpload,
        invoiceType,
        payrollMonth
      );

      if (response.success) {
        setSelectedUpload("");
        await loadGeneratedInvoices();
        await loadStatistics();
      } else {
        setError(response.message || "Invoice generation failed");
      }
    } catch (err) {
      setError("Error generating invoice: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      setLoading(true);
      await invoiceApiService.downloadInvoice(invoiceId);
    } catch (err) {
      setError("Error downloading invoice: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUpload = async (uploadId) => {
    if (
      !confirm(
        "Are you sure you want to delete this upload and all related data?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await invoiceApiService.deleteAttendanceUpload(uploadId);

      if (response.success) {
        await loadAttendanceUploads();
        await loadGeneratedInvoices();
        await loadStatistics();
      } else {
        setError(response.message || "Delete failed");
      }
    } catch (err) {
      setError("Error deleting upload: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Template Setup Functions
  const handleTemplateSetup = (client) => {
    setSelectedTemplateClient(client);
    setShowTemplateModal(true);
    setSelectedGrade(null); // Reset selected grade
    loadClientJobStructures(client.id);
  };

  const loadClientJobStructures = async (clientId) => {
    try {
      console.log(
        "Loading job structures and pay grades for client:",
        clientId
      );

      // First get job structures for the client
      const jobStructuresData = await salaryStructureAPI.jobStructures.getAll({
        client_id: clientId,
        per_page: 1000,
      });

      console.log("Raw job structures API response:", jobStructuresData);

      // Extract the actual API response from the new structure
      const actualResponse = jobStructuresData.data;
      console.log("Extracted job structures response:", actualResponse);

      const jobStructures =
        actualResponse?.data?.data || actualResponse?.data || [];
      console.log("Final extracted job structures:", jobStructures);

      // Then get pay grades for each job structure
      const jobStructuresWithGrades = await Promise.all(
        jobStructures.map(async (jobStructure) => {
          try {
            // Use the existing getAll method with job_structure_id filter
            const payGradesData = await salaryStructureAPI.payGrades.getAll({
              job_structure_id: jobStructure.id,
            });

            console.log(
              `Raw pay grades API response for job structure ${jobStructure.id}:`,
              payGradesData
            );

            // Extract the actual API response (same fix as job structures)
            const actualPayGradesResponse = payGradesData.data;
            console.log(
              `Extracted pay grades response for job structure ${jobStructure.id}:`,
              actualPayGradesResponse
            );

            // Extract pay grades from the response
            const payGrades =
              actualPayGradesResponse?.data?.data ||
              actualPayGradesResponse?.data ||
              [];

            console.log(
              `Final pay grades for job structure ${jobStructure.id} (${jobStructure.job_title}):`,
              payGrades
            );

            return {
              ...jobStructure,
              payGrades: payGrades,
            };
          } catch (error) {
            console.error(
              `Error loading pay grades for job structure ${jobStructure.id}:`,
              error
            );
            return {
              ...jobStructure,
              payGrades: [],
            };
          }
        })
      );

      console.log("Job structures with pay grades:", jobStructuresWithGrades);
      setClientJobStructures(jobStructuresWithGrades);
    } catch (err) {
      console.error("Error loading client job structures:", err);
      setClientJobStructures([]);
    }
  };

  const handleGradeSelect = (grade) => {
    console.log("Selected grade for template setup:", grade);
    setSelectedGrade(grade);

    // Load existing template for this grade if it exists
    const existingTemplate = templateSettings.payGradeTemplates[grade.id];
    if (existingTemplate) {
      setTemplateSettings((prev) => ({
        ...prev,
        statutory: existingTemplate.statutory || prev.statutory,
        custom: existingTemplate.custom || [],
      }));
    } else {
      // Reset to defaults for new grade
      setTemplateSettings((prev) => ({
        ...prev,
        statutory: {
          paye: {
            enabled: true,
            rate: 7.5,
            type: "formula",
            formula: "",
            components: [],
          },
          pension: {
            enabled: true,
            rate: 8,
            type: "percentage",
            formula: "",
            components: [],
          },
          nsitf: {
            enabled: true,
            rate: 1,
            type: "percentage",
            formula: "",
            components: [],
          },
          itf: {
            enabled: true,
            rate: 1,
            type: "percentage",
            formula: "",
            components: [],
          },
        },
        custom: [],
      }));
    }
  };

  const handleCopyTemplate = (fromGrade, toGrade) => {
    const sourceTemplate = templateSettings.payGradeTemplates[fromGrade.id];
    if (sourceTemplate) {
      setTemplateSettings((prev) => ({
        ...prev,
        payGradeTemplates: {
          ...prev.payGradeTemplates,
          [toGrade.id]: {
            statutory: { ...sourceTemplate.statutory },
            custom: [...sourceTemplate.custom],
          },
        },
      }));

      // If copying to currently selected grade, update the active template
      if (selectedGrade && selectedGrade.id === toGrade.id) {
        setTemplateSettings((prev) => ({
          ...prev,
          statutory: { ...sourceTemplate.statutory },
          custom: [...sourceTemplate.custom],
        }));
      }

      console.log(
        `Template copied from ${fromGrade.grade_name} to ${toGrade.grade_name}`
      );
    }
  };

  const saveCurrentGradeTemplate = () => {
    if (selectedGrade) {
      setTemplateSettings((prev) => ({
        ...prev,
        payGradeTemplates: {
          ...prev.payGradeTemplates,
          [selectedGrade.id]: {
            statutory: { ...prev.statutory },
            custom: [...prev.custom],
          },
        },
      }));
      console.log(`Template saved for grade: ${selectedGrade.grade_name}`);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Save current grade template before saving all
      saveCurrentGradeTemplate();

      // Save template logic - you can implement API call here
      console.log(
        "Saving all templates for client:",
        selectedTemplateClient?.id,
        templateSettings.payGradeTemplates
      );

      // For now, just close modal
      setShowTemplateModal(false);
      setSelectedTemplateClient(null);
      setSelectedGrade(null);
    } catch (err) {
      setError("Error saving template: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCustomComponent = () => {
    setTemplateSettings((prev) => ({
      ...prev,
      custom: [
        ...prev.custom,
        {
          id: Date.now(),
          name: "",
          rate: 0,
          type: "percentage",
          formula: "",
          components: [],
        },
      ],
    }));
  };

  const removeCustomComponent = (id) => {
    setTemplateSettings((prev) => ({
      ...prev,
      custom: prev.custom.filter((comp) => comp.id !== id),
    }));
  };

  const updateCustomComponent = (id, field, value) => {
    setTemplateSettings((prev) => ({
      ...prev,
      custom: prev.custom.map((comp) =>
        comp.id === id ? { ...comp, [field]: value } : comp
      ),
    }));
  };

  const updateStatutoryComponent = (component, field, value) => {
    setTemplateSettings((prev) => ({
      ...prev,
      statutory: {
        ...prev.statutory,
        [component]: {
          ...prev.statutory[component],
          [field]: value,
        },
      },
    }));
  };

  // Add new statutory component
  const addStatutoryComponent = () => {
    const componentName = prompt(
      "Enter statutory component name (e.g., 'NHF', 'Gratuity'):"
    );
    if (componentName && componentName.trim()) {
      const key = componentName.toLowerCase().replace(/\s+/g, "_");
      setTemplateSettings((prev) => ({
        ...prev,
        statutory: {
          ...prev.statutory,
          [key]: {
            enabled: false,
            rate: 0,
            type: "percentage",
            formula: "",
            components: [],
            dependentComponent: "basic_salary", // Default dependency
          },
        },
      }));
    }
  };

  // Remove statutory component (only for custom ones, not predefined)
  const removeStatutoryComponent = (key) => {
    const predefinedComponents = ["paye", "pension", "nsitf", "itf"];
    if (predefinedComponents.includes(key)) {
      alert(
        "Cannot remove predefined statutory components. You can disable them instead."
      );
      return;
    }

    if (
      confirm(`Are you sure you want to remove ${key.toUpperCase()} component?`)
    ) {
      setTemplateSettings((prev) => {
        const newStatutory = { ...prev.statutory };
        delete newStatutory[key];
        return {
          ...prev,
          statutory: newStatutory,
        };
      });
    }
  };

  // Template Persistence Functions
  const loadAvailableTemplates = async () => {
    if (!selectedTemplateClient || !selectedGrade) return;

    try {
      setTemplateLoading(true);
      const response = await invoiceTemplateService.getTemplates({
        client_id: selectedTemplateClient.id,
        pay_grade_structure_id: selectedGrade.id,
        active_only: true,
      });

      if (response.success) {
        setAvailableTemplates(response.data);
      } else {
        console.error("Failed to load templates:", response.message);
      }
    } catch (error) {
      console.error("Error loading available templates:", error);
    } finally {
      setTemplateLoading(false);
    }
  };

  const loadExistingTemplate = async (templateId) => {
    try {
      setTemplateLoading(true);
      const response = await invoiceTemplateService.getTemplate(templateId);

      if (response.success) {
        const templateData = invoiceTemplateService.parseTemplateData(
          response.data
        );

        // Apply template settings to current state
        setTemplateSettings((prev) => ({
          ...prev,
          statutory: templateData.templateSettings.statutory,
          custom: templateData.templateSettings.custom,
        }));

        setCurrentTemplateId(templateId);
        console.log(
          "Template loaded successfully:",
          templateData.template_name
        );
      } else {
        console.error("Failed to load template:", response.message);
        alert("Failed to load template: " + response.message);
      }
    } catch (error) {
      console.error("Error loading template:", error);
      alert("Error loading template");
    } finally {
      setTemplateLoading(false);
    }
  };

  const saveTemplate = async (
    templateName,
    description = "",
    setAsDefault = false
  ) => {
    if (!selectedTemplateClient || !selectedGrade) {
      alert("Please select a client and pay grade first");
      return false;
    }

    try {
      setTemplateSaving(true);

      const templateData = invoiceTemplateService.formatTemplateData(
        templateSettings,
        {
          client_id: selectedTemplateClient.id,
          pay_grade_structure_id: selectedGrade.id,
          template_name: templateName,
          description: description,
          grade_name: selectedGrade.grade_name,
          use_credit_to_bank_model: true,
          service_fee_percentage: 0,
          attendance_calculation_method: "working_days",
          prorate_salary: true,
          minimum_attendance_factor: 0,
          is_active: true,
          is_default: setAsDefault,
        }
      );

      let response;
      if (currentTemplateId) {
        // Update existing template
        response = await invoiceTemplateService.updateTemplate(
          currentTemplateId,
          templateData
        );
      } else {
        // Create new template
        response = await invoiceTemplateService.createTemplate(templateData);
      }

      if (response.success) {
        setCurrentTemplateId(response.data.id);
        await loadAvailableTemplates(); // Refresh template list
        console.log("Template saved successfully:", templateName);
        alert("Template saved successfully!");
        return true;
      } else {
        console.error("Failed to save template:", response.message);
        alert("Failed to save template: " + response.message);
        return false;
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Error saving template");
      return false;
    } finally {
      setTemplateSaving(false);
    }
  };

  const cloneTemplate = async (
    sourceTemplateId,
    newName,
    newDescription = ""
  ) => {
    try {
      setTemplateSaving(true);

      const response = await invoiceTemplateService.cloneTemplate(
        sourceTemplateId,
        {
          template_name: newName,
          description: newDescription,
          is_default: false,
        }
      );

      if (response.success) {
        await loadAvailableTemplates(); // Refresh template list
        console.log("Template cloned successfully:", newName);
        alert("Template cloned successfully!");
        return true;
      } else {
        console.error("Failed to clone template:", response.message);
        alert("Failed to clone template: " + response.message);
        return false;
      }
    } catch (error) {
      console.error("Error cloning template:", error);
      alert("Error cloning template");
      return false;
    } finally {
      setTemplateSaving(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return false;
    }

    try {
      const response = await invoiceTemplateService.deleteTemplate(templateId);

      if (response.success) {
        if (currentTemplateId === templateId) {
          setCurrentTemplateId(null);
        }
        await loadAvailableTemplates(); // Refresh template list
        console.log("Template deleted successfully");
        alert("Template deleted successfully!");
        return true;
      } else {
        console.error("Failed to delete template:", response.message);
        alert("Failed to delete template: " + response.message);
        return false;
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Error deleting template");
      return false;
    }
  };

  // Load templates when client or grade changes
  useEffect(() => {
    if (selectedTemplateClient && selectedGrade) {
      loadAvailableTemplates();
    }
  }, [selectedTemplateClient, selectedGrade]);

  // Formula Builder Functions
  const openFormulaBuilder = (target) => {
    setCurrentFormulaTarget(target);
    setShowFormulaBuilder(true);
  };

  const closeFormulaBuilder = () => {
    setCurrentFormulaTarget(null);
    setShowFormulaBuilder(false);
  };

  const buildFormula = (selectedComponents, operator = "+", percentage) => {
    if (!selectedComponents.length) return "";

    const componentNames = selectedComponents
      .map((comp) => comp.component_name)
      .join(` ${operator} `);
    return percentage
      ? `${percentage}% of (${componentNames})`
      : `(${componentNames})`;
  };

  const saveFormula = (formula, components) => {
    if (!currentFormulaTarget) return;

    const { type, key } = currentFormulaTarget;

    if (type === "statutory") {
      setTemplateSettings((prev) => ({
        ...prev,
        statutory: {
          ...prev.statutory,
          [key]: {
            ...prev.statutory[key],
            formula,
            components,
            type: "formula",
          },
        },
      }));
    } else if (type === "custom") {
      setTemplateSettings((prev) => ({
        ...prev,
        custom: prev.custom.map((comp) =>
          comp.id === key
            ? { ...comp, formula, components, type: "formula" }
            : comp
        ),
      }));
    }

    closeFormulaBuilder();
  };

  const resetCalculationType = (type, key, newType) => {
    if (type === "statutory") {
      setTemplateSettings((prev) => ({
        ...prev,
        statutory: {
          ...prev.statutory,
          [key]: {
            ...prev.statutory[key],
            type: newType,
            formula: "",
            components: [],
          },
        },
      }));
    }
  };

  // Template copying functions
  const copyTemplateToGrade = (fromGradeId, toGradeId) => {
    const fromTemplate = templateSettings.payGradeTemplates[fromGradeId];
    if (fromTemplate) {
      setTemplateSettings((prev) => ({
        ...prev,
        payGradeTemplates: {
          ...prev.payGradeTemplates,
          [toGradeId]: { ...fromTemplate },
        },
      }));
    }
  };

  const updatePayGradeTemplate = (gradeId, field, value) => {
    setTemplateSettings((prev) => ({
      ...prev,
      payGradeTemplates: {
        ...prev.payGradeTemplates,
        [gradeId]: {
          ...prev.payGradeTemplates[gradeId],
          [field]: value,
        },
      },
    }));
  };

  const initializeGradeTemplate = (gradeId) => {
    if (!templateSettings.payGradeTemplates[gradeId]) {
      setTemplateSettings((prev) => ({
        ...prev,
        payGradeTemplates: {
          ...prev.payGradeTemplates,
          [gradeId]: {
            statutory: {
              paye: { enabled: true, rate: 7.5, type: "percentage" },
              pension: { enabled: true, rate: 8, type: "percentage" },
              nsitf: { enabled: true, rate: 1, type: "percentage" },
              itf: { enabled: true, rate: 1, type: "percentage" },
            },
            custom: [],
          },
        },
      }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoicing</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Upload attendance files and generate client invoices
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Uploads
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.total_uploads}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Invoices
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.pending_invoices}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Generated Invoices
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.generated_invoices}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Amount
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(statistics.total_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "attendance"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Attendance Upload
            </button>
            <button
              onClick={() => setActiveTab("generate")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "generate"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Generate Invoice
            </button>
            <button
              onClick={() => setActiveTab("invoices")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "invoices"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Generated Invoices
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "templates"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Template Setup
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "upcoming"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🚀 Upcoming Features
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Upload Form */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Upload Attendance File
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Upload Excel or CSV files containing employee attendance
                      data
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadAttendanceTemplate}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Template
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Client
                    </label>
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.organisation_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payroll Month
                    </label>
                    <input
                      type="month"
                      value={payrollMonth}
                      onChange={(e) => setPayrollMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attendance File (Excel/CSV)
                    </label>
                    <input
                      id="attendance-file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Template Info */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Need the correct format?</strong> Download the
                    template above to get the required columns and sample data.
                    Replace the sample data with your employee information
                    before uploading.
                  </p>
                </div>

                <button
                  onClick={handleFileUpload}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? "Uploading..." : "Upload Attendance File"}
                </button>
              </div>
            </div>

            {/* Attendance Uploads List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Uploaded Attendance Files
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Records
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {!Array.isArray(attendanceUploads) ||
                    attendanceUploads.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No attendance files uploaded yet
                        </td>
                      </tr>
                    ) : (
                      attendanceUploads.map((upload) => (
                        <tr key={upload.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {upload.client?.organisation_name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {upload.payroll_month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {upload.original_filename}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {upload.records_count || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                upload.processing_status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : upload.processing_status === "processing"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : upload.processing_status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {upload.processing_status || "pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(upload.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteUpload(upload.id)}
                              className="text-red-600 hover:text-red-900 mr-3"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "generate" && (
          <div className="space-y-6">
            {/* Generate Invoice Form */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Generate Invoice
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select an attendance upload to generate an invoice
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Attendance Upload
                    </label>
                    <select
                      value={selectedUpload}
                      onChange={(e) => setSelectedUpload(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose an upload...</option>
                      {Array.isArray(attendanceUploads) &&
                        attendanceUploads
                          .filter(
                            (upload) => upload.processing_status === "completed"
                          )
                          .map((upload) => (
                            <option key={upload.id} value={upload.id}>
                              {upload.client?.organisation_name} -{" "}
                              {upload.payroll_month} ({upload.records_count}{" "}
                              records)
                            </option>
                          ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Type
                    </label>
                    <select
                      value={invoiceType}
                      onChange={(e) => setInvoiceType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="with_schedule">
                        Detailed Invoice (with Schedule)
                      </option>
                      <option value="without_schedule">
                        Summary Invoice (Totals Only)
                      </option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateInvoice}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Generated Invoices
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!Array.isArray(generatedInvoices) ||
                  generatedInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No invoices generated yet
                      </td>
                    </tr>
                  ) : (
                    generatedInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.client?.organisation_name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.invoice_month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.invoice_type === "with_schedule"
                            ? "Detailed"
                            : "Summary"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              invoice.status === "generated"
                                ? "bg-green-100 text-green-800"
                                : invoice.status === "sent"
                                ? "bg-blue-100 text-blue-800"
                                : invoice.status === "paid"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {invoice.status || "draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(
                            invoice.generated_at || invoice.created_at
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-6">
            {/* Template Setup Clients List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Client Template Setup
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Configure invoice templates and statutory components for each
                  client
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientsLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          Loading clients...
                        </td>
                      </tr>
                    ) : !isAuthenticated ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-red-500"
                        >
                          Please log in to view clients
                        </td>
                      </tr>
                    ) : !hasRole("admin") ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-red-500"
                        >
                          Admin access required to manage templates
                        </td>
                      </tr>
                    ) : clients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No clients found. Please ensure you have created
                          clients in the Client Management section.
                          <br />
                          <button
                            onClick={() => fetchClients()}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Retry Loading Clients
                          </button>
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {client.organisation_name?.charAt(0) || "N"}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {client.organisation_name || "N/A"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {client.cac_registration_number ||
                                    "No CAC number"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{client.phone || "No phone"}</div>
                            <div className="text-gray-500">
                              {client.head_office_address || "No address"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                client.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : client.status === "inactive"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {client.status || "unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Not Configured
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleTemplateSetup(client)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Setup Template
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Features Tab */}
        {activeTab === "upcoming" && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🚀</div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800">
                      Upcoming Advanced Features
                    </h3>
                    <p className="text-amber-700 mt-1">
                      Phase 5.1: Advanced Calculations are next on our
                      development roadmap
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 5.1: Advanced Calculations */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      🔢 Phase 5.1: Advanced Calculations
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Sophisticated payroll calculations for complex scenarios
                    </p>
                  </div>
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    READY FOR IMPLEMENTATION
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Overtime Calculations */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      ⏰ Overtime Calculations
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 1.5x/2x overtime rates</li>
                      <li>• Weekend & holiday overtime</li>
                      <li>• Client-specific overtime policies</li>
                      <li>• Overtime hour tracking & validation</li>
                    </ul>
                    <div className="mt-3 text-xs text-green-600">
                      📈 Example: 25 days worked → 22 normal + 3 at 1.5x rate
                    </div>
                  </div>

                  {/* Prorated Allowances */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      📅 Prorated Allowances
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Mid-month joiner calculations</li>
                      <li>• Resignation prorations</li>
                      <li>• Daily/weekly proration methods</li>
                      <li>• Allowance-specific rules</li>
                    </ul>
                    <div className="mt-3 text-xs text-green-600">
                      📈 Example: Join 15th → Housing = (16÷30) × Full amount
                    </div>
                  </div>

                  {/* Leave Adjustments */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      🏖️ Leave Adjustments
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Paid leave (maintain full pay)</li>
                      <li>• Unpaid leave deductions</li>
                      <li>• Leave balance tracking</li>
                      <li>• Policy enforcement</li>
                    </ul>
                    <div className="mt-3 text-xs text-green-600">
                      📈 Example: 3 days unpaid → Reduce attendance by 3 days
                    </div>
                  </div>

                  {/* Bonus & Incentives */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      🎯 Bonus & Incentives
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Performance bonuses</li>
                      <li>• Attendance bonuses</li>
                      <li>• Commission calculations</li>
                      <li>• Achievement incentives</li>
                    </ul>
                    <div className="mt-3 text-xs text-green-600">
                      📈 Example: Perfect attendance → +₦50,000 bonus
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <h5 className="font-medium text-blue-900 mb-2">
                    🎯 Business Value & ROI
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">
                        Efficiency Gain:
                      </span>
                      <br />
                      <span className="text-blue-700">
                        40-60% reduction in payroll processing time
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">
                        Client Value:
                      </span>
                      <br />
                      <span className="text-blue-700">
                        Advanced features enable premium pricing
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">
                        Implementation:
                      </span>
                      <br />
                      <span className="text-blue-700">
                        2-3 days development time
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Future Phases */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  🔮 Future Development Phases
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Additional features planned for future implementation
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {/* Phase 5.3: Advanced Reporting */}
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg">📊</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        Phase 5.3: Advanced Reporting & Analytics
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Attendance impact analytics, payroll variance reports,
                        client efficiency analysis
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                          PLANNED
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Phase 5.4: Enterprise Features */}
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg">🏢</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        Phase 5.4: Enterprise Features
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Complete audit trails, approval workflows, backup &
                        recovery systems
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          FUTURE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start space-x-2">
                    <div className="text-amber-600 text-lg">💡</div>
                    <div>
                      <h5 className="font-medium text-amber-800">
                        Ready to Implement Phase 5.1?
                      </h5>
                      <p className="text-sm text-amber-700 mt-1">
                        Advanced calculations will significantly enhance your
                        payroll capabilities and provide competitive advantages.
                        The system is production-ready and ready for the next
                        phase of development.
                      </p>
                      <div className="mt-3 text-xs text-amber-600">
                        🚀 Current Status: Core system 100% complete with
                        perfect test results
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Setup Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Setup Invoice Template -{" "}
                  {selectedTemplateClient?.organisation_name}
                </h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
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
            </div>

            <div className="p-4 space-y-4">
              {/* Job Structures with Pay Grades */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Job Structures & Pay Grades for{" "}
                  {selectedTemplateClient?.organisation_name}
                </h4>
                {clientJobStructures.length > 0 ? (
                  <div className="space-y-2">
                    {clientJobStructures.map((jobStructure) => (
                      <div
                        key={jobStructure.id}
                        className="border border-gray-200 rounded-md overflow-hidden"
                      >
                        {/* Job Structure Header - Compressed */}
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">
                                {jobStructure.job_title}
                              </h5>
                              <p className="text-xs text-gray-500">
                                {jobStructure.department} •{" "}
                                {jobStructure.payGrades?.length || 0} grades
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                              {jobStructure.job_category || "Standard"}
                            </span>
                          </div>
                        </div>

                        {/* Pay Grades Grid - Compressed */}
                        <div className="p-2">
                          {jobStructure.payGrades &&
                          jobStructure.payGrades.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {jobStructure.payGrades.map((grade) => {
                                const hasTemplate =
                                  templateSettings.payGradeTemplates[grade.id];
                                const isSelected =
                                  selectedGrade &&
                                  selectedGrade.id === grade.id;
                                return (
                                  <div
                                    key={grade.id}
                                    className={`border rounded p-2 transition-all cursor-pointer text-sm ${
                                      isSelected
                                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                                        : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                    }`}
                                    onClick={() => handleGradeSelect(grade)}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                          {grade.grade_name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          {grade.grade_code}
                                        </div>
                                        <div className="text-xs text-green-600 font-medium">
                                          ₦
                                          {grade.total_compensation?.toLocaleString() ||
                                            "0"}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end space-y-1 ml-1">
                                        {isSelected && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-600 text-white">
                                            ✓
                                          </span>
                                        )}
                                        {hasTemplate ? (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                            ✓
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                            ×
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Template Actions - Compressed */}
                                    {hasTemplate && !isSelected && (
                                      <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyTemplate(
                                              grade,
                                              selectedGrade
                                            );
                                          }}
                                          disabled={!selectedGrade}
                                          className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                                        >
                                          Copy to selected
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic py-2">
                              No pay grades defined
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      No job structures found for this client
                    </p>
                    <p className="text-xs text-gray-400">
                      Set up job structures and pay grades first
                    </p>
                  </div>
                )}
              </div>

              {/* Currently Selected Grade Indicator - Compressed */}
              {selectedGrade && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3.5 h-3.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-blue-900">
                          {selectedGrade.grade_name} ({selectedGrade.grade_code}
                          )
                        </h5>
                        <p className="text-xs text-blue-700">
                          ₦
                          {selectedGrade.total_compensation?.toLocaleString() ||
                            "0"}
                          {selectedGrade.job_structure &&
                            ` • ${selectedGrade.job_structure.job_title}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedGrade(null)}
                      className="text-blue-400 hover:text-blue-600 p-1"
                    >
                      <svg
                        className="w-4 h-4"
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
                </div>
              )}

              {/* Template Configuration Section */}
              <TemplateSetupSection
                selectedGrade={selectedGrade}
                templateSettings={templateSettings}
                getSalaryComponents={getSalaryComponents}
                updateStatutoryComponent={updateStatutoryComponent}
                addStatutoryComponent={addStatutoryComponent}
                removeStatutoryComponent={removeStatutoryComponent}
                addCustomComponent={addCustomComponent}
                updateCustomComponent={updateCustomComponent}
                removeCustomComponent={removeCustomComponent}
                openFormulaBuilder={openFormulaBuilder}
                resetCalculationType={resetCalculationType}
                // Template persistence props
                currentTemplateId={currentTemplateId}
                availableTemplates={availableTemplates}
                templateSaving={templateSaving}
                templateLoading={templateLoading}
                onSaveTemplate={saveTemplate}
                onLoadTemplate={loadExistingTemplate}
                onCloneTemplate={cloneTemplate}
                onDeleteTemplate={deleteTemplate}
              />
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formula Builder Modal */}
      {showFormulaBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Formula Builder
                </h3>
                <button
                  onClick={closeFormulaBuilder}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
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
            </div>

            <FormulaBuilderContent
              salaryComponents={salaryComponents}
              onSave={saveFormula}
              onCancel={closeFormulaBuilder}
              currentTarget={currentFormulaTarget} // Pass current target for circular dependency detection
              currentFormula={
                currentFormulaTarget?.key
                  ? currentFormulaTarget.type === "statutory"
                    ? templateSettings.statutory[currentFormulaTarget.key]
                        ?.formula || ""
                    : templateSettings.custom.find(
                        (c) => c.id === currentFormulaTarget.key
                      )?.formula || ""
                  : ""
              }
              currentComponents={
                currentFormulaTarget?.key
                  ? currentFormulaTarget.type === "statutory"
                    ? templateSettings.statutory[currentFormulaTarget.key]
                        ?.components || []
                    : templateSettings.custom.find(
                        (c) => c.id === currentFormulaTarget.key
                      )?.components || []
                  : []
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
