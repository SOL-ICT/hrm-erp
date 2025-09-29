import React, { useState } from "react";

const TemplateSetupSection = ({
  selectedGrade,
  templateSettings,
  getSalaryComponents,
  updateStatutoryComponent,
  addStatutoryComponent,
  removeStatutoryComponent,
  addCustomComponent,
  updateCustomComponent,
  removeCustomComponent,
  openFormulaBuilder,
  resetCalculationType,
  // Template persistence props
  currentTemplateId,
  availableTemplates,
  templateSaving,
  templateLoading,
  onSaveTemplate,
  onLoadTemplate,
  onCloneTemplate,
  onDeleteTemplate,
}) => {
  // Local state for template management
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(false);
  // Get available components for percentage calculation (Allowance components + basic salary + gross)
  const getAvailableComponents = () => {
    const components = [
      { id: "basic_salary", name: "Basic Salary", category: "Default" },
      { id: "gross_salary", name: "Gross Salary", category: "Calculation" },
    ];

    // Add allowance components that have been configured
    templateSettings.custom.forEach((component) => {
      if (component.name) {
        components.push({
          id: component.id,
          name: component.name,
          category: "Custom",
        });
      }
    });

    return components;
  };

  if (!selectedGrade) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-600">
          Click on any pay grade above to set up its invoice template with
          statutory components and custom formulas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Allowance Components Section (FIRST) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium text-gray-900">
            Allowance Components for {selectedGrade.grade_name}
          </h4>
          <button
            onClick={addCustomComponent}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Add Allowance
          </button>
        </div>

        {templateSettings.custom.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="font-medium">No allowance components added yet</p>
            <p>
              Add allowance components here first - they will be available for
              use in statutory formulas and calculations.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {templateSettings.custom.map((component) => (
              <div
                key={component.id}
                className="border border-gray-200 rounded-md p-3 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Component name"
                    value={component.name}
                    onChange={(e) =>
                      updateCustomComponent(
                        component.id,
                        "name",
                        e.target.value
                      )
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <select
                    value={component.type}
                    onChange={(e) => {
                      updateCustomComponent(
                        component.id,
                        "type",
                        e.target.value
                      );
                      if (e.target.value !== "formula") {
                        updateCustomComponent(component.id, "formula", "");
                        updateCustomComponent(component.id, "components", []);
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="formula">Formula</option>
                  </select>
                  <button
                    onClick={() => removeCustomComponent(component.id)}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>

                {/* Component Value Input */}
                <div className="space-y-2">
                  {component.type === "percentage" && (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="0.1"
                        value={component.rate || ""}
                        onChange={(e) =>
                          updateCustomComponent(
                            component.id,
                            "rate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="Rate %"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <select
                        value={component.dependentComponent || "basic_salary"}
                        onChange={(e) =>
                          updateCustomComponent(
                            component.id,
                            "dependentComponent",
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">
                          Select component for percentage calculation
                        </option>
                        {getAvailableComponents()
                          .filter((sc) => sc.id !== component.id)
                          .map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.name} ({sc.category})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {component.type === "fixed" && (
                    <input
                      type="number"
                      step="0.01"
                      value={component.rate || ""}
                      onChange={(e) =>
                        updateCustomComponent(
                          component.id,
                          "rate",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Fixed Amount ₦"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  )}

                  {component.type === "formula" && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={component.formula || ""}
                          readOnly
                          placeholder="No formula set"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                        />
                        <button
                          onClick={() =>
                            openFormulaBuilder({
                              type: "custom",
                              id: component.id,
                            })
                          }
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center space-x-1"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Build Formula</span>
                        </button>
                      </div>
                      {/* Enhanced formula info display */}
                      {component.formula &&
                        component.components &&
                        component.components.length > 0 && (
                          <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            <span className="font-medium">Components:</span>{" "}
                            {component.components.map((c) => c.name).join(", ")}
                            <span className="mx-2">•</span>
                            <span className="font-medium">Count:</span>{" "}
                            {component.components.length}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statutory Components Section (SECOND) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium text-gray-900">
            Statutory Components for {selectedGrade.grade_name}
          </h4>
          <button
            onClick={addStatutoryComponent}
            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            Add Statutory
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(templateSettings.statutory).map(
            ([key, component]) => (
              <div key={key} className="border border-gray-200 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-900 capitalize">
                    {key.toUpperCase()}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={component.enabled}
                      onChange={(e) =>
                        updateStatutoryComponent(
                          key,
                          "enabled",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    {!["paye", "pension", "nsitf", "itf"].includes(key) && (
                      <button
                        onClick={() => removeStatutoryComponent(key)}
                        className="text-red-600 hover:text-red-800 text-xs"
                        title="Remove custom statutory component"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {component.enabled && (
                  <div className="space-y-2">
                    <select
                      value={component.type}
                      onChange={(e) => {
                        updateStatutoryComponent(key, "type", e.target.value);
                        if (e.target.value !== "formula") {
                          resetCalculationType(
                            "statutory",
                            key,
                            e.target.value
                          );
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="formula">Formula</option>
                    </select>

                    {component.type === "percentage" && (
                      <div className="space-y-2">
                        <input
                          type="number"
                          step="0.1"
                          value={component.rate}
                          onChange={(e) =>
                            updateStatutoryComponent(
                              key,
                              "rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Rate %"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <select
                          value={component.dependentComponent || "basic_salary"}
                          onChange={(e) =>
                            updateStatutoryComponent(
                              key,
                              "dependentComponent",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">
                            Select component for percentage calculation
                          </option>
                          {getAvailableComponents().map((sc) => (
                            <option key={sc.id} value={sc.id}>
                              {sc.name} ({sc.category})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {component.type === "fixed" && (
                      <input
                        type="number"
                        step="0.01"
                        value={component.rate}
                        onChange={(e) =>
                          updateStatutoryComponent(
                            key,
                            "rate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="Amount ₦"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    )}

                    {component.type === "formula" && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={component.formula || ""}
                            readOnly
                            placeholder="No formula set"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                          />
                          <button
                            onClick={() =>
                              openFormulaBuilder({ type: "statutory", key })
                            }
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center space-x-1"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            <span>Build Formula</span>
                          </button>
                        </div>
                        {/* Enhanced formula info display */}
                        {component.formula &&
                          component.components &&
                          component.components.length > 0 && (
                            <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                              <span className="font-medium">Components:</span>{" "}
                              {component.components
                                .map((c) => c.name || c.component_name)
                                .join(", ")}
                              <span className="mx-2">•</span>
                              <span className="font-medium">Count:</span>{" "}
                              {component.components.length}
                              <span className="mx-2">•</span>
                              <span className="font-medium">Type:</span>{" "}
                              {key.replace("_", " ").toUpperCase()}
                            </div>
                          )}
                        {component.formula &&
                          (!component.components ||
                            component.components.length === 0) && (
                            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                              ⚠️ Formula set but no components detected. Please
                              rebuild formula.
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Template Management Section */}
      <div className="pt-4 border-t border-gray-200">
        {/* Current Template Status */}
        {currentTemplateId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-2">
              <svg
                className="h-4 w-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-blue-800">
                Template loaded - ID: {currentTemplateId}
              </span>
            </div>
          </div>
        )}

        {/* Template Actions */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={templateSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {templateSaving && (
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              <span>
                {currentTemplateId ? "Update Template" : "Save Template"}
              </span>
            </button>

            <button
              onClick={() => setShowLoadDialog(true)}
              disabled={templateLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {templateLoading && (
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              <span>Load Template</span>
            </button>
          </div>

          <div className="text-sm text-gray-500">
            Templates available: {availableTemplates.length}
          </div>
        </div>
      </div>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentTemplateId ? "Update Template" : "Save New Template"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder={`Template for ${selectedGrade.grade_name}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Describe this template configuration..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="setAsDefault"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="setAsDefault"
                  className="ml-2 text-sm text-gray-700"
                >
                  Set as default template for this pay grade
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setNewTemplateName("");
                  setNewTemplateDescription("");
                  setSetAsDefault(false);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const name =
                    newTemplateName ||
                    `Template for ${selectedGrade.grade_name}`;
                  const success = await onSaveTemplate(
                    name,
                    newTemplateDescription,
                    setAsDefault
                  );
                  if (success) {
                    setShowSaveDialog(false);
                    setNewTemplateName("");
                    setNewTemplateDescription("");
                    setSetAsDefault(false);
                  }
                }}
                disabled={templateSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {templateSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Template Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Load Template for {selectedGrade.grade_name}
            </h3>

            {availableTemplates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No templates available for this pay grade.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Create and save a template first.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{template.template_name}</span>
                          {template.is_default && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </h4>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {template.description}
                          </p>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          <p>
                            Created:{" "}
                            {new Date(template.created_at).toLocaleDateString()}
                          </p>
                          {template.last_used_at && (
                            <p>
                              Last used:{" "}
                              {new Date(
                                template.last_used_at
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => {
                            onLoadTemplate(template.id);
                            setShowLoadDialog(false);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          Load
                        </button>
                        <button
                          onClick={async () => {
                            const newName = prompt(
                              "Enter name for cloned template:",
                              template.template_name + " (Copy)"
                            );
                            if (newName) {
                              await onCloneTemplate(template.id, newName);
                            }
                          }}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                        >
                          Clone
                        </button>
                        <button
                          onClick={() => onDeleteTemplate(template.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSetupSection;
