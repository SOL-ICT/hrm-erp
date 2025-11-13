import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TemplateSetupSection from "../TemplateSetupSection";

/**
 * Template Setup Tab Component
 * Handles salary template configuration with client list and setup modal
 */
const TemplateSetupTab = ({
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
  const [loading, setLoading] = useState(false);
  
  // Formula builder state
  const [currentFormula, setCurrentFormula] = useState('');

  // Helper function to insert text into formula at cursor position
  const insertIntoFormula = (text) => {
    setCurrentFormula(prev => prev + (prev && !prev.endsWith(' ') && !text.startsWith(' ') ? ' ' : '') + text);
  };

  // Calculate gross total from all components
  const calculateGrossTotal = () => {
    let total = 150000; // Start with base salary
    
    // Add statutory components
    if (templateSettings.statutory) {
      Object.values(templateSettings.statutory).forEach(component => {
        if (component.enabled && component.rate) {
          total += (150000 * (component.rate / 100));
        }
      });
    }
    
    // Add custom components
    if (templateSettings.custom) {
      templateSettings.custom.forEach(component => {
        if (component.rate) {
          total += (150000 * (component.rate / 100));
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
        'Basic_Salary': 150000,
        'Gross_Total': calculateGrossTotal()
      };
      
      // Add statutory components
      if (templateSettings.statutory) {
        Object.entries(templateSettings.statutory).forEach(([key, component]) => {
          if (component.enabled && component.rate) {
            componentValues[key.charAt(0).toUpperCase() + key.slice(1)] = 150000 * (component.rate / 100);
          }
        });
      }
      
      // Add custom components
      if (templateSettings.custom) {
        templateSettings.custom.forEach(component => {
          if (component.rate) {
            componentValues[component.name.replace(/\s+/g, '_')] = 150000 * (component.rate / 100);
          }
        });
      }
      
      // Replace component names in formula with values
      let evaluableFormula = currentFormula;
      Object.entries(componentValues).forEach(([name, value]) => {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        evaluableFormula = evaluableFormula.replace(regex, value.toString());
      });
      
      // Safely evaluate the formula
      // Note: In production, you'd want to use a proper expression parser for security
      const result = Function(`"use strict"; return (${evaluableFormula})`)();
      return isNaN(result) ? 0 : result;
      
    } catch (error) {
      console.error('Formula calculation error:', error);
      return 0;
    }
  };

  // Calculate preview with allowance components and percentage handling
  const calculatePreview = () => {
    if (!currentFormula.trim()) return 0;
    
    try {
      // Create a mapping of component names to sample values  
      const componentValues = {
        'Basic_Salary': 150000
      };
      
      // Add allowance components only
      if (templateSettings?.allowances) {
        Object.entries(templateSettings.allowances).forEach(([key, component]) => {
          if (component.enabled) {
            componentValues[key] = component.calculation_type === 'percentage' 
              ? (150000 * component.percentage / 100)
              : parseInt(component.fixed_amount) || 0;
          }
        });
      }
      
      // Calculate Gross_Total
      let grossTotal = 150000; // Basic salary
      if (templateSettings?.allowances) {
        Object.entries(templateSettings.allowances).forEach(([key, component]) => {
          if (component.enabled) {
            grossTotal += component.calculation_type === 'percentage' 
              ? (150000 * component.percentage / 100)
              : parseInt(component.fixed_amount) || 0;
          }
        });
      }
      componentValues['Gross_Total'] = grossTotal;
      
      // Replace component names in formula with values
      let evaluableFormula = currentFormula;
      
      // Handle percentage notation: convert standalone numbers to percentages
      // Replace patterns like "8 *" with "0.08 *" (but not "Basic_Salary * 8")
      evaluableFormula = evaluableFormula.replace(/(\D|^)(\d+(?:\.\d+)?)(\s*\*\s*[A-Za-z_])/g, (match, prefix, number, suffix) => {
        return prefix + (parseFloat(number) / 100) + suffix;
      });
      
      Object.entries(componentValues).forEach(([name, value]) => {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        evaluableFormula = evaluableFormula.replace(regex, value.toString());
      });
      
      // Safely evaluate the formula
      const result = Function(`"use strict"; return (${evaluableFormula})`)();
      return isNaN(result) ? 0 : result;
      
    } catch (error) {
      console.error('Formula calculation error:', error);
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

  return (
    <div className="space-y-6">
      {/* Template Setup Clients List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Client Template Setup
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure invoice templates and statutory components for each client
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
              {!clients || clients.length === 0 ? (
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
                            {client.cac_registration_number || "No CAC number"}
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
                      {(() => {
                        const templateCount =
                          clientTemplateCounts[client.id] || 0;
                        return (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              templateCount > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
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
                        {/* Job Structure Header - Clickable and Collapsible */}
                        <div
                          className="bg-gray-50 px-3 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() =>
                            toggleJobStructureCollapse(jobStructure.id)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">
                                  {jobStructure.job_title}
                                </h5>
                                <p className="text-xs text-gray-500">
                                  {jobStructure.department} •{" "}
                                  {(
                                    jobStructure.payGrades ||
                                    jobStructure.pay_grades
                                  )?.length || 0}{" "}
                                  grades
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                {jobStructure.job_category || "Standard"}
                              </span>
                              {/* Collapse/Expand Icon */}
                              <svg
                                className={`w-4 h-4 text-gray-500 transition-transform ${
                                  collapsedJobStructures[jobStructure.id]
                                    ? "rotate-0"
                                    : "rotate-180"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Pay Grades Grid - Collapsible */}
                        {!collapsedJobStructures[jobStructure.id] && (
                          <div className="p-2">
                            {(jobStructure.payGrades ||
                              jobStructure.pay_grades) &&
                            (jobStructure.payGrades || jobStructure.pay_grades)
                              .length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {(
                                  jobStructure.payGrades ||
                                  jobStructure.pay_grades
                                ).map((grade) => {
                                  const hasTemplate =
                                    templateSettings.payGradeTemplates[
                                      grade.id
                                    ];
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

                                      {/* Template Actions - Enhanced Clone Interface */}
                                      {hasTemplate &&
                                        !isSelected &&
                                        selectedGrade && (
                                          <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyTemplate(
                                                  grade,
                                                  selectedGrade
                                                );
                                              }}
                                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                              📋 Copy to{" "}
                                              {selectedGrade.grade_name}
                                            </button>
                                          </div>
                                        )}

                                      {/* Clear Template Action for selected grade */}
                                      {hasTemplate && isSelected && (
                                        <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleClearTemplate(grade);
                                            }}
                                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                                          >
                                            🗑️ Clear Template
                                          </button>
                                        </div>
                                      )}

                                      {/* Clone from other grades when no template exists */}
                                      {!hasTemplate && isSelected && (
                                        <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                                          <p className="text-xs text-gray-500 mb-1">
                                            Clone template from:
                                          </p>
                                          <div className="space-y-1">
                                            {/* Look across ALL job structures for grades with templates */}
                                            {clientJobStructures
                                              ?.flatMap(
                                                (js) =>
                                                  js.payGrades ||
                                                  js.pay_grades ||
                                                  []
                                              )
                                              ?.filter(
                                                (otherGrade) =>
                                                  otherGrade.id !== grade.id &&
                                                  templateSettings
                                                    .payGradeTemplates[
                                                    otherGrade.id
                                                  ]
                                              )
                                              ?.slice(0, 5)
                                              ?.map((otherGrade) => (
                                                <button
                                                  key={otherGrade.id}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyTemplate(
                                                      otherGrade,
                                                      grade
                                                    );
                                                  }}
                                                  className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                  📋 {otherGrade.grade_name}
                                                  <span className="text-gray-400 ml-1">
                                                    (
                                                    {
                                                      clientJobStructures.find(
                                                        (js) =>
                                                          (
                                                            js.payGrades ||
                                                            js.pay_grades
                                                          )?.some(
                                                            (pg) =>
                                                              pg.id ===
                                                              otherGrade.id
                                                          )
                                                      )?.job_title
                                                    }
                                                    )
                                                  </span>
                                                </button>
                                              ))}
                                            {/* Show message if no templates found anywhere */}
                                            {clientJobStructures
                                              ?.flatMap(
                                                (js) =>
                                                  js.payGrades ||
                                                  js.pay_grades ||
                                                  []
                                              )
                                              ?.filter(
                                                (otherGrade) =>
                                                  otherGrade.id !== grade.id &&
                                                  templateSettings
                                                    .payGradeTemplates[
                                                    otherGrade.id
                                                  ]
                                              )?.length === 0 && (
                                              <p className="text-xs text-gray-400 italic">
                                                No templates available to clone
                                              </p>
                                            )}
                                          </div>
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
                        )}
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
                onSaveTemplate={handleTemplateSetupSave}
                onLoadTemplate={loadTemplate}
                onCloneTemplate={async (sourceId, newName, newDesc) => {
                  // Handle cloning through the cloneTemplate function
                  if (cloneTemplate) {
                    const success = await cloneTemplate(
                      sourceId,
                      newName,
                      newDesc
                    );
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
                  }
                  return false;
                }}
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
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
                    placeholder="Enter your formula here (e.g., Basic_Salary * 0.10 + Housing_Allowance)"
                    value={currentFormula}
                    onChange={(e) => setCurrentFormula(e.target.value)}
                  />
                </div>
                
                {/* Mathematical Operators */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Mathematical Operators:</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {['+', '-', '*', '/', '%', '(', ')'].map((operator) => (
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
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Available Allowance Components:</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {/* Basic Salary */}
                    <button
                      className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 rounded border text-left"
                      onClick={() => insertIntoFormula('Basic_Salary')}
                    >
                      <div className="font-medium">Basic_Salary</div>
                      <div className="text-xs text-gray-600">Base salary amount</div>
                    </button>

                    {/* Allowance Components Only */}
                    {templateSettings?.allowances && Object.entries(templateSettings.allowances).map(([key, component]) => (
                      component.enabled && (
                        <button
                          key={key}
                          className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded border text-left"
                          onClick={() => insertIntoFormula(key)}
                        >
                          <div className="font-medium">{key}</div>
                          <div className="text-xs text-gray-600">
                            {component.calculation_type === 'percentage' 
                              ? `${component.percentage}% - percentage`
                              : `₦${component.fixed_amount} - fixed`
                            }
                          </div>
                        </button>
                      )
                    ))}

                    {/* Gross Total */}
                    <button
                      className="px-3 py-2 text-sm bg-orange-100 hover:bg-orange-200 rounded border text-left"
                      onClick={() => insertIntoFormula('Gross_Total')}
                    >
                      <div className="font-medium">Gross_Total</div>
                      <div className="text-xs text-gray-600">Sum of all allowance components</div>
                    </button>
                  </div>
                </div>
                          {component.rate}% - {component.calculation_type}
                        </div>
                      </button>
                    ))}

                    {/* Gross Total */}
                    <button
                      className="px-3 py-2 text-sm bg-indigo-100 hover:bg-indigo-200 rounded border text-left col-span-2"
                      onClick={() => insertIntoFormula('Gross_Total')}
                    >
                      <div className="font-medium">Gross_Total</div>
                      <div className="text-xs text-gray-600">Sum of all allowance components</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel - Preview */}
              <div className="border-l pl-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview Calculation:</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1">Sample Values:</div>
                    <div className="text-xs space-y-1">
                      <div>Basic_Salary: ₦150,000</div>
                      {templateSettings.statutory && Object.entries(templateSettings.statutory).map(([key, component]) => (
                        component.enabled && (
                          <div key={key}>{key.charAt(0).toUpperCase() + key.slice(1)}: ₦{(150000 * (component.rate / 100)).toLocaleString()}</div>
                        )
                      ))}
                      {templateSettings.custom && templateSettings.custom.map((component) => (
                        <div key={component.id}>
                          {component.name.replace(/\s+/g, '_')}: ₦{(150000 * (component.rate / 100)).toLocaleString()}
                        </div>
                      ))}
                      <div className="font-medium border-t pt-1">
                        Gross_Total: ₦{calculateGrossTotal().toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="text-xs text-gray-600 mb-1">Formula Result:</div>
                    <div className="font-medium text-lg text-blue-600">
                      ₦{calculateFormulaPreview().toLocaleString()}
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
                    setCurrentFormula(''); // Clear formula after applying
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
    </div>
  );
};

export default TemplateSetupTab;
