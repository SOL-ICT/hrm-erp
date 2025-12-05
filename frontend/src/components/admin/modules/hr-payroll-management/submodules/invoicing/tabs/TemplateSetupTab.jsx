import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TemplateSetupSection from "../TemplateSetupSection";
import ExcelTemplateImportModal from "../components/ExcelTemplateImportModal";
import ExportTemplateBuilder from "../../export-templates/ExportTemplateBuilder";

/**
 * Template Setup Tab Component
 * Handles salary template configuration with client list and setup modal
 */
const TemplateSetupTab = ({
  currentTheme,
  // Client and structure data
  clients,
  selectedTemplateClient,
  setSelectedTemplateClient,
  clientJobStructures,
  setClientJobStructures,

  // Grade selection
  selectedGrade,
  setSelectedGrade,

  // Template settings
  templateSettings,
  setTemplateSettings,

  // Template persistence
  currentTemplateId,
  setCurrentTemplateId,
  availableTemplates,
  setAvailableTemplates,
  templateSaving,
  setTemplateSaving,
  templateLoading,
  setTemplateLoading,

  // Formula builder
  showFormulaBuilder,
  setShowFormulaBuilder,
  currentFormulaTarget,
  setCurrentFormulaTarget,

  // Template counts and UI state
  clientTemplateCounts,
  setClientTemplateCounts,
  collapsedJobStructures,
  setCollapsedJobStructures,

  // Functions
  getSalaryComponents,
  loadClientJobStructures,
  loadTemplatesForClient,
  saveTemplate,
  deleteTemplate,
  loadTemplate,
  createNewTemplate,
  handleTemplateSetup,
  handleGradeSelection,
  handleCopyTemplate,
  handleClearTemplate,
  updateStatutoryComponent,
  updateCustomComponent,
  addCustomComponent,
  removeCustomComponent,
  openFormulaBuilder,
  closeFormulaBuilder,
  applyFormula,
  resetCalculationType,
  cloneTemplate,

  // Legacy props for compatibility
  templates,
  onTemplateUpdate,
}) => {
  const { user, isAuthenticated, hasRole } = useAuth();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [showExportTemplateBuilder, setShowExportTemplateBuilder] =
    useState(false);
  const [templateModalTab, setTemplateModalTab] = useState("calculation"); // "calculation" or "export"
  const [loading, setLoading] = useState(false);

  // Formula builder state
  const [currentFormula, setCurrentFormula] = useState("");

  // Helper function to insert text into formula at cursor position
  const insertIntoFormula = (text) => {
    setCurrentFormula(
      (prev) =>
        prev +
        (prev && !prev.endsWith(" ") && !text.startsWith(" ") ? " " : "") +
        text
    );
  };

  // Calculate gross total from all components
  const calculateGrossTotal = () => {
    let total = 150000; // Start with base salary

    // Add statutory components
    if (templateSettings.statutory) {
      Object.values(templateSettings.statutory).forEach((component) => {
        if (component.enabled && component.rate) {
          total += 150000 * (component.rate / 100);
        }
      });
    }

    // Add custom components
    if (templateSettings.custom) {
      templateSettings.custom.forEach((component) => {
        if (component.rate) {
          total += 150000 * (component.rate / 100);
        }
      });
    }

    return total;
  };

  // Calculate formula preview with sample values
  const calculateFormulaPreview = () => {
    if (!currentFormula.trim()) return 0;

    try {
      // Create a mapping of component names to sample values
      const componentValues = {
        Basic_Salary: 150000,
        Gross_Total: calculateGrossTotal(),
      };

      // Add statutory components
      if (templateSettings.statutory) {
        Object.entries(templateSettings.statutory).forEach(
          ([key, component]) => {
            if (component.enabled && component.rate) {
              componentValues[key.charAt(0).toUpperCase() + key.slice(1)] =
                150000 * (component.rate / 100);
            }
          }
        );
      }

      // Add custom components
      if (templateSettings.custom) {
        templateSettings.custom.forEach((component) => {
          if (component.rate) {
            componentValues[component.name.replace(/\s+/g, "_")] =
              150000 * (component.rate / 100);
          }
        });
      }

      // Replace component names in formula with values
      let evaluableFormula = currentFormula;
      Object.entries(componentValues).forEach(([name, value]) => {
        const regex = new RegExp(`\\b${name}\\b`, "g");
        evaluableFormula = evaluableFormula.replace(regex, value.toString());
      });

      // Safely evaluate the formula
      // Note: In production, you'd want to use a proper expression parser for security
      const result = Function(`"use strict"; return (${evaluableFormula})`)();
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error("Formula calculation error:", error);
      return 0;
    }
  };

  // Calculate preview with allowance components and percentage handling
  const calculatePreview = () => {
    if (!currentFormula.trim()) return 0;

    let evaluableFormula = ""; // Declare outside try block to avoid reference error

    try {
      // Create a mapping of component names to actual values from templateSettings
      const componentValues = {};

      // Get actual Basic_Salary from the Basic component if it exists
      let basicSalaryValue = 150000; // fallback default

      // Add allowance components from templateSettings.allowances
      if (templateSettings?.allowances) {
        Object.entries(templateSettings.allowances).forEach(
          ([key, component]) => {
            if (component.enabled) {
              const value =
                component.calculation_type === "percentage"
                  ? (basicSalaryValue * component.percentage) / 100
                  : parseInt(component.fixed_amount) || 0;

              componentValues[key] = value;

              // If this is the Basic component, use it as the basic salary value
              if (
                key.toLowerCase() === "basic" ||
                key.toLowerCase() === "basic_salary"
              ) {
                basicSalaryValue = value;
              }
            }
          }
        );
      }

      // Also check for components in templateSettings.custom (alternative structure)
      if (templateSettings?.custom && Array.isArray(templateSettings.custom)) {
        templateSettings.custom.forEach((component) => {
          if (component.enabled !== false) {
            // Assume enabled if not explicitly disabled
            const componentName = component.name.replace(/\s+/g, "_");

            // Try different possible field names for the amount
            let amount = 0;
            if (component.calculation_type === "percentage") {
              amount =
                (basicSalaryValue *
                  (component.percentage || component.rate || 0)) /
                100;
            } else {
              // Try various field names that might contain the amount - rate is the key field!
              amount = parseInt(
                component.rate || // This is where your values are stored!
                  component.fixed_amount ||
                  component.amount ||
                  component.annual_amount ||
                  component.value ||
                  0
              );
            }

            componentValues[componentName] = amount;

            // If this is the Basic component, use it as the basic salary value for calculations
            if (
              component.name.toLowerCase() === "basic" ||
              component.name.toLowerCase() === "basic salary"
            ) {
              basicSalaryValue = amount;
              componentValues["Basic_Salary"] = amount; // Update Basic_Salary to actual value
            }
          }
        });
      }

      // Set Basic_Salary to the actual basic component value or fallback
      componentValues["Basic_Salary"] = basicSalaryValue;

      // Calculate Gross_Total (sum of all components)
      let grossTotal = 0;
      Object.entries(componentValues).forEach(([key, value]) => {
        if (key !== "Gross_Total") {
          grossTotal += value;
        }
      });
      componentValues["Gross_Total"] = grossTotal;

      // Replace component names in formula with values
      evaluableFormula = currentFormula;

      // First, replace component names with their values
      Object.entries(componentValues).forEach(([name, value]) => {
        const regex = new RegExp(`\\b${name}\\b`, "g");
        evaluableFormula = evaluableFormula.replace(regex, value.toString());
      });

      // Simple percentage conversion: treat standalone numbers as percentages
      console.log("Before percentage conversion:", evaluableFormula);

      // Convert standalone numbers to percentages (e.g., "8" becomes "0.08" for 8%)
      evaluableFormula = evaluableFormula.replace(
        /\b(\d{1,2}(?:\.\d+)?)\b/g,
        (match, number) => {
          const num = parseFloat(number);
          // Only convert numbers that look like percentages (1-100 range, no decimals)
          if (num > 0 && num <= 100 && Number.isInteger(num)) {
            const converted = num / 100;
            console.log(
              `Converting ${num} to ${converted} (${num}% = ${converted})`
            );
            return converted.toString();
          }
          return match;
        }
      );

      console.log("After percentage conversion:", evaluableFormula);

      // Clean up any invalid syntax that might remain
      evaluableFormula = evaluableFormula.replace(/\s+/g, " ").trim();

      // Validate formula syntax before evaluation
      if (
        !evaluableFormula ||
        evaluableFormula.endsWith("*") ||
        evaluableFormula.endsWith("+") ||
        evaluableFormula.endsWith("-") ||
        evaluableFormula.endsWith("/") ||
        evaluableFormula.endsWith("%")
      ) {
        console.warn(
          "Formula ends with operator, incomplete formula:",
          evaluableFormula
        );
        return 0;
      }

      // Check for unmatched parentheses
      const openParens = (evaluableFormula.match(/\(/g) || []).length;
      const closeParens = (evaluableFormula.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        console.warn("Unmatched parentheses in formula:", evaluableFormula);
        return 0;
      }

      console.log("Final evaluable formula:", evaluableFormula);
      console.log(
        "Expected result for 0.10 * (400000 + 720000 + 360000):",
        0.1 * (400000 + 720000 + 360000)
      );

      // Safely evaluate the formula
      const result = Function(`"use strict"; return (${evaluableFormula})`)();
      console.log("Actual calculation result:", result);
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error("Formula calculation error:", error);
      console.error("Evaluable formula was:", evaluableFormula);
      return 0;
    }
  };

  // Handle template setup button click
  const handleTemplateSetupClick = (client) => {
    setSelectedTemplateClient(client);
    setShowTemplateModal(true);
    setSelectedGrade(null);
    loadClientJobStructures(client.id, client);
  };

  // Handle grade selection in modal
  const handleGradeSelect = (grade) => {
    handleGradeSelection(grade);
  };

  // Toggle job structure collapse
  const toggleJobStructureCollapse = (structureId) => {
    setCollapsedJobStructures((prev) => ({
      ...prev,
      [structureId]: !prev[structureId],
    }));
  };

  // Handle save template action
  const handleSaveTemplate = async () => {
    if (!selectedGrade) {
      alert("Please select a pay grade first");
      return;
    }

    const templateName = prompt("Enter template name:");
    if (!templateName) return;

    const description = prompt("Enter template description (optional):") || "";

    setLoading(true);
    try {
      const success = await saveTemplate(templateName, description, false);
      if (success) {
        // Close modal and reload template setup
        setShowTemplateModal(false);
        // Reload client job structures to refresh the template setup display
        if (selectedTemplateClient) {
          await loadClientJobStructures(
            selectedTemplateClient.id,
            selectedTemplateClient
          );
        }
        // Reset selected grade to clear any cached state
        setSelectedGrade(null);
      }
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for TemplateSetupSection save to handle modal closing
  const handleTemplateSetupSave = async (
    templateName,
    description,
    setAsDefault
  ) => {
    const success = await saveTemplate(templateName, description, setAsDefault);
    if (success) {
      // Close modal and reload template setup
      setShowTemplateModal(false);
      // Reload client job structures to refresh the template setup display
      if (selectedTemplateClient) {
        await loadClientJobStructures(
          selectedTemplateClient.id,
          selectedTemplateClient
        );
      }
      // Reset selected grade to clear any cached state
      setSelectedGrade(null);
    }
    return success;
  };

  // Fetch clients function for retry button
  const fetchClients = () => {
    if (onTemplateUpdate) {
      onTemplateUpdate();
    }
  };

  // Handle Excel import completion
  const handleExcelImportComplete = async (result) => {
    console.log("Excel import completed:", result);

    // Show success message
    alert(`Template "${result.data.template_name}" imported successfully!`);

    // Close modal
    setShowExcelImportModal(false);

    // Reload client job structures to refresh the template setup display
    if (selectedTemplateClient) {
      await loadClientJobStructures(
        selectedTemplateClient.id,
        selectedTemplateClient
      );
    }

    // If template was created for the currently selected grade, refresh template state
    if (
      selectedGrade &&
      result.data.pay_grade_structure_id === selectedGrade.id
    ) {
      // Reload templates for this grade
      if (loadTemplate) {
        await loadTemplate(result.data.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Management Overview */}
      <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-lg shadow-sm ${currentTheme?.border || 'border'}`}>
        <div className={`p-6 border-b ${currentTheme?.border || 'border-gray-200'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`text-lg font-medium ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                Template Management
              </h3>
              <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} mt-1`}>
                Configure calculation templates (salary computation) and export
                templates (invoice formatting)
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchClients}
                className={`inline-flex items-center px-3 py-2 ${currentTheme?.border || 'border border-gray-300'} shadow-sm text-sm leading-4 font-medium rounded-md ${currentTheme?.textPrimary || 'text-gray-700'} ${currentTheme?.cardBg || 'bg-white'} ${currentTheme?.hover || 'hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                title="Refresh client list and template status"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Setup Clients List */}
      <div className={`${currentTheme?.cardBg || 'bg-white'} rounded-lg shadow-sm ${currentTheme?.border || 'border'}`}>
        <div className={`p-6 border-b ${currentTheme?.border || 'border-gray-200'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`text-lg font-medium ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                Client Calculation Template Setup
              </h3>
              <p className={`text-sm ${currentTheme?.textSecondary || 'text-gray-600'} mt-1`}>
                Configure salary calculation templates for each client (Phase 1:
                HOW to calculate)
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full divide-y ${currentTheme?.border || 'divide-gray-200'}`}>
            <thead className={currentTheme?.bg || 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>
                  Client
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>
                  Contact
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>
                  Template Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme?.textSecondary || 'text-gray-500'} uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${currentTheme?.cardBg || 'bg-white'} divide-y ${currentTheme?.border || 'divide-gray-200'}`}>
              {!clients || clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className={`px-6 py-8 text-center ${currentTheme?.textSecondary || 'text-gray-500'}`}
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
                    className={`px-6 py-8 text-center ${currentTheme?.textSecondary || 'text-gray-500'}`}
                  >
                    No clients found. Please ensure you have created clients in
                    the Client Management section.
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
                  <tr key={client.id} className={currentTheme?.hover || 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {client.organisation_name?.charAt(0) || "N"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                            {client.organisation_name || "N/A"}
                          </div>
                          <div className={`text-sm ${currentTheme?.textSecondary || 'text-gray-500'}`}>
                            {client.cac_registration_number || "No CAC number"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme?.textPrimary || 'text-gray-900'}`}>
                      <div>{client.phone || "No phone"}</div>
                      <div className={currentTheme?.textSecondary || 'text-gray-500'}>
                        {client.head_office_address || "No address"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : client.status === "inactive"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {client.status || "unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const templateCount =
                          clientTemplateCounts[client.id] || 0;
                        return (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              templateCount > 0
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            }`}
                          >
                            {templateCount > 0
                              ? `${templateCount} Template${
                                  templateCount > 1 ? "s" : ""
                                } Configured`
                              : "Not Configured"}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleTemplateSetupClick(client)}
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
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setTemplateModalTab("calculation")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      templateModalTab === "calculation"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Calculation Templates
                  </button>
                  <button
                    onClick={() => setTemplateModalTab("export")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      templateModalTab === "export"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Export Templates
                  </button>
                </nav>
              </div>

              {templateModalTab === "calculation" ? (
                /* Calculation Template Section */
                <div className="space-y-6">
                  {/* Template Setup Content */}
                  <TemplateSetupSection
                    selectedClient={selectedTemplateClient}
                    clientJobStructures={clientJobStructures}
                    selectedGrade={selectedGrade}
                    setSelectedGrade={setSelectedGrade}
                    templateSettings={templateSettings}
                    setTemplateSettings={setTemplateSettings}
                    currentTemplateId={currentTemplateId}
                    setCurrentTemplateId={setCurrentTemplateId}
                    availableTemplates={availableTemplates}
                    setAvailableTemplates={setAvailableTemplates}
                    templateSaving={templateSaving}
                    setTemplateSaving={setTemplateSaving}
                    templateLoading={templateLoading}
                    setTemplateLoading={setTemplateLoading}
                    showFormulaBuilder={showFormulaBuilder}
                    setShowFormulaBuilder={setShowFormulaBuilder}
                    currentFormulaTarget={currentFormulaTarget}
                    setCurrentFormulaTarget={setCurrentFormulaTarget}
                    collapsedJobStructures={collapsedJobStructures}
                    setCollapsedJobStructures={setCollapsedJobStructures}
                    getSalaryComponents={getSalaryComponents}
                    handleSaveTemplate={handleTemplateSetupSave}
                    onExcelImport={() => setShowExcelImportModal(true)}
                  />
                </div>
              ) : (
                /* Export Template Section */
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Export Template for{" "}
                      {selectedTemplateClient?.organisation_name}
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                      Configure invoice line items and formatting specific to
                      this client's requirements.
                    </p>

                    <button
                      onClick={() => {
                        console.log(
                          "Opening export template builder for:",
                          selectedTemplateClient?.organisation_name
                        );
                        setShowExportTemplateBuilder(true);
                      }}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Configure Export Template
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formula Builder Modal */}
      {showFormulaBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Formula Builder - {currentFormulaTarget?.name}
              </h3>
            </div>

            <div className="p-6 grid grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
              {/* Left Panel - Formula Input */}
              <div className="col-span-2">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formula Expression
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Note: Numbers are treated as percentages by default (e.g., 8
                    = 8%). Click component buttons to add them to your formula.
                  </p>

                  {/* Simple Formula Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formula Expression
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                      placeholder="Enter your formula here (e.g., 8 + 10 * Basic_Salary)"
                      value={currentFormula}
                      onChange={(e) => setCurrentFormula(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Tip: For percentages, just type the number (e.g., "8"
                      for 8%). Use component names and operators to build
                      expressions.
                    </p>
                  </div>
                </div>

                {/* Quick Numbers */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Quick Numbers (Percentages):
                  </h4>
                  <div className="grid grid-cols-6 gap-2">
                    {["5", "8", "10", "15", "20", "25"].map((number) => (
                      <button
                        key={number}
                        className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 rounded border font-mono"
                        onClick={() => {
                          insertIntoFormula(number); // Keep traditional method
                          addTextToFormula(number); // Also add to component-based
                        }}
                      >
                        {number}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mathematical Operators */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Mathematical Operators:
                  </h4>
                  <div className="grid grid-cols-7 gap-2">
                    {["+", "-", "*", "/", "%", "(", ")"].map((operator) => (
                      <button
                        key={operator}
                        className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded border font-mono"
                        onClick={() => insertIntoFormula(operator)}
                      >
                        {operator}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Components */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Available Allowance Components:
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {/* Basic Salary */}
                    <button
                      className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 rounded border text-left"
                      onClick={() => insertIntoFormula("Basic_Salary")}
                    >
                      <div className="font-medium">Basic_Salary</div>
                      <div className="text-xs text-gray-600">
                        Base salary amount
                      </div>
                    </button>

                    {/* Allowance Components Only */}
                    {templateSettings?.allowances &&
                      Object.entries(templateSettings.allowances).map(
                        ([key, component]) =>
                          component.enabled && (
                            <button
                              key={key}
                              className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded border text-left"
                              onClick={() => insertIntoFormula(key)}
                            >
                              <div className="font-medium">{key}</div>
                              <div className="text-xs text-gray-600">
                                {component.calculation_type === "percentage"
                                  ? `${component.percentage}% - percentage`
                                  : `₦${
                                      component.fixed_amount ||
                                      component.amount ||
                                      "N/A"
                                    } - fixed`}
                              </div>
                            </button>
                          )
                      )}

                    {/* Allowance Components from templateSettings.custom (alternative structure) */}
                    {templateSettings?.custom &&
                      Array.isArray(templateSettings.custom) &&
                      templateSettings.custom.map(
                        (component) =>
                          component.enabled !== false && ( // Show if not explicitly disabled
                            <button
                              key={component.id || component.name}
                              className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded border text-left"
                              onClick={() => {
                                const componentName = component.name.replace(
                                  /\s+/g,
                                  "_"
                                );
                                insertIntoFormula(componentName);
                              }}
                            >
                              <div className="font-medium">
                                {component.name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {component.calculation_type === "percentage"
                                  ? `${
                                      component.percentage ||
                                      component.rate ||
                                      0
                                    }% - percentage`
                                  : `₦${
                                      component.rate ||
                                      component.fixed_amount ||
                                      component.amount ||
                                      component.annual_amount ||
                                      component.value ||
                                      "N/A"
                                    } - fixed`}
                              </div>
                            </button>
                          )
                      )}

                    {/* Debug info if no components found */}
                    {(!templateSettings?.allowances ||
                      Object.keys(templateSettings.allowances).length === 0) &&
                      (!templateSettings?.custom ||
                        templateSettings.custom.length === 0) && (
                        <div className="text-xs text-gray-500 col-span-2 p-2 bg-yellow-50 border rounded">
                          <div>No allowance components found.</div>
                          <div>
                            Available templateSettings keys:{" "}
                            {Object.keys(templateSettings || {}).join(", ")}
                          </div>
                          <div className="max-h-32 overflow-y-auto mt-2">
                            <pre>
                              {JSON.stringify(templateSettings, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                    {/* Always show debug info to understand data structure */}
                    {/* Debug section temporarily hidden - remove in production */}

                    {/* Gross Total */}
                    <button
                      className="px-3 py-2 text-sm bg-orange-100 hover:bg-orange-200 rounded border text-left col-span-2"
                      onClick={() => insertIntoFormula("Gross_Total")}
                    >
                      <div className="font-medium">Gross_Total</div>
                      <div className="text-xs text-gray-600">
                        Sum of all allowance components
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel - Preview */}
              <div className="border-l pl-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Preview Calculation:
                </h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1">
                      Current Values:
                    </div>
                    <div className="text-xs space-y-1">
                      <div>
                        Basic_Salary: ₦
                        {(() => {
                          // Get actual Basic component value from custom components
                          let basicValue = 150000; // fallback
                          if (templateSettings?.custom) {
                            const basicComponent = templateSettings.custom.find(
                              (c) =>
                                c.name.toLowerCase() === "basic" ||
                                c.name.toLowerCase() === "basic salary"
                            );
                            if (basicComponent) {
                              basicValue = parseInt(basicComponent.rate || 0);
                            }
                          }
                          return basicValue.toLocaleString();
                        })()}
                      </div>
                      {templateSettings?.custom &&
                        templateSettings.custom
                          .filter(
                            (c) =>
                              c.name.toLowerCase() !== "basic" &&
                              c.name.toLowerCase() !== "basic salary"
                          )
                          .map(
                            (component) =>
                              component.enabled !== false && (
                                <div key={component.id || component.name}>
                                  {component.name}: ₦
                                  {component.calculation_type === "percentage"
                                    ? (() => {
                                        let basicValue = 120000; // Use actual basic value
                                        const basicComponent =
                                          templateSettings.custom.find(
                                            (c) =>
                                              c.name.toLowerCase() ===
                                                "basic" ||
                                              c.name.toLowerCase() ===
                                                "basic salary"
                                          );
                                        if (basicComponent) {
                                          basicValue = parseInt(
                                            basicComponent.rate || 0
                                          );
                                        }
                                        return (
                                          (basicValue *
                                            (component.percentage ||
                                              component.rate ||
                                              0)) /
                                          100
                                        ).toLocaleString();
                                      })()
                                    : parseInt(
                                        component.rate || 0
                                      ).toLocaleString()}
                                </div>
                              )
                          )}
                      <div>
                        Gross_Total: ₦
                        {(() => {
                          // Calculate actual total using real component values
                          let total = 0;

                          // Add all custom components
                          if (templateSettings?.custom) {
                            templateSettings.custom.forEach((component) => {
                              if (component.enabled !== false) {
                                total += parseInt(component.rate || 0);
                              }
                            });
                          }

                          return total.toLocaleString();
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-xs text-gray-600 mb-1">
                      Formula Result:
                    </div>
                    <div className="text-sm font-mono bg-white p-2 rounded border">
                      ₦{calculatePreview().toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={closeFormulaBuilder}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (currentFormula.trim()) {
                    applyFormula(currentFormula);
                    setCurrentFormula(""); // Clear formula after applying
                  }
                  closeFormulaBuilder();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!currentFormula.trim()}
              >
                Apply Formula
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Template Import Modal */}
      <ExcelTemplateImportModal
        isOpen={showExcelImportModal}
        onClose={() => setShowExcelImportModal(false)}
        selectedClient={selectedTemplateClient}
        selectedGrade={selectedGrade}
        onImportComplete={handleExcelImportComplete}
      />

      {/* Export Template Builder */}
      {showExportTemplateBuilder && selectedTemplateClient && (
        <ExportTemplateBuilder
          selectedClient={selectedTemplateClient}
          onClose={() => setShowExportTemplateBuilder(false)}
        />
      )}
    </div>
  );
};

export default TemplateSetupTab;
