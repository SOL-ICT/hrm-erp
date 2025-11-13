/**
 * Export Template Builder - Define invoice line items and formatting
 *
 * This is SEPARATE from Calculation Templates:
 * - Calculation Templates: Define HOW to calculate individual staff salaries
 * - Export Templates: Define WHAT appears on the final invoice Excel
 */

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Trash2,
  Settings,
  Eye,
  Save,
  Download,
  Upload,
  Move,
  DollarSign,
  Percent,
  Calculator,
  Minus,
  FileSpreadsheet,
  Users,
  TrendingUp,
  X,
} from "lucide-react";

const ExportTemplateBuilder = ({ selectedClient, onClose }) => {
  const { sanctumRequest } = useAuth();

  // Template state
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [lineItems, setLineItems] = useState([]);
  const [availableComponents, setAvailableComponents] = useState([]);

  // Excel settings
  const [excelSettings, setExcelSettings] = useState({
    includeSummarySheet: true,
    includeBreakdownSheet: true,
    companyHeader: true,
    periodicSummary: true,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);

  // Load existing export template and calculation template components for client
  useEffect(() => {
    if (selectedClient?.id) {
      loadExportTemplate();
      loadCalculationTemplateComponents();
    }
  }, [selectedClient]);

  /**
   * Load calculation template components for the "Based On" dropdown
   */
  /**
   * Load salary calculation components from invoice_templates
   * These components are used in the export template "Based On" dropdowns
   */
  const loadCalculationTemplateComponents = async () => {
    try {
      console.log(
        "[Export Template] Loading salary calculation components from invoice_templates for client:",
        selectedClient.id
      );

      // Load invoice template (which contains the salary calculation components)
      const templateData = await sanctumRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/invoice-templates?client_id=${selectedClient.id}`
      );

      if (!templateData) {
        console.log("No invoice template found for client");
        return;
      }
      console.log("[Export Template] Invoice template data:", templateData);

      // Get the template - could be in data.data or just data
      const templates = templateData.data?.data || templateData.data || [];

      if (templates.length === 0) {
        console.log("No templates found in response");
        return;
      }

      const template = templates[0]; // Use first template
      console.log("[Export Template] Using template:", template);

      // Extract all components from the template (all 4 categories)
      const components = [];

      // Parse custom_components (salary & allowances)
      if (template.custom_components) {
        const customComps =
          typeof template.custom_components === "string"
            ? JSON.parse(template.custom_components)
            : template.custom_components;

        customComps.forEach((comp, index) => {
          components.push({
            id: `custom_${comp.name}`,
            name: comp.description || comp.name,
            type: "custom",
            category: "Salary & Allowances",
          });
        });
      }

      // Parse employer_costs (Medical Insurance, ITF, ECA, Fidelity, etc.)
      if (template.employer_costs) {
        const employerCosts =
          typeof template.employer_costs === "string"
            ? JSON.parse(template.employer_costs)
            : template.employer_costs;

        employerCosts.forEach((comp, index) => {
          components.push({
            id: `employer_${comp.name}`,
            name: comp.description || comp.name,
            type: "employer_costs",
            category: "Employer Costs",
          });
        });
      }

      // Parse statutory_components (Employee deductions: Pension, PAYE, etc.)
      if (template.statutory_components) {
        const statutoryComps =
          typeof template.statutory_components === "string"
            ? JSON.parse(template.statutory_components)
            : template.statutory_components;

        statutoryComps.forEach((comp, index) => {
          components.push({
            id: `statutory_${comp.name}`,
            name: comp.description || comp.name,
            type: "statutory",
            category: "Statutory Deductions",
          });
        });
      }

      // Parse management_fees (Service fee, VAT, WHT)
      if (template.management_fees) {
        const managementFees =
          typeof template.management_fees === "string"
            ? JSON.parse(template.management_fees)
            : template.management_fees;

        managementFees.forEach((comp, index) => {
          components.push({
            id: `management_${comp.name}`,
            name: comp.description || comp.name,
            type: "management_fees",
            category: "Management Fees",
          });
        });
      }

      console.log(
        "[Export Template] Loaded components from all 4 categories:",
        components
      );

      // Add computed section totals as special components
      const sectionTotals = [
        {
          id: "TOTAL_SALARY_AND_ALLOWANCES",
          name: "Total Salary & Allowances",
          type: "section_total",
          category: "Section Totals",
          description: "Sum of all Salary & Allowances components",
        },
        {
          id: "TOTAL_EMPLOYER_COSTS",
          name: "Total Employer Costs",
          type: "section_total",
          category: "Section Totals",
          description: "Sum of all Employer Costs (Medical, ITF, ECA, etc.)",
        },
        {
          id: "TOTAL_STATUTORY_DEDUCTIONS",
          name: "Total Statutory Deductions",
          type: "section_total",
          category: "Section Totals",
          description: "Sum of all Statutory Deductions (Pension, PAYE, etc.)",
        },
        {
          id: "TOTAL_MANAGEMENT_FEES",
          name: "Total Management Fees",
          type: "section_total",
          category: "Section Totals",
          description: "Sum of all Management Fees",
        },
        {
          id: "GRAND_TOTAL",
          name: "Grand Total (All Costs)",
          type: "section_total",
          category: "Section Totals",
          description:
            "Sum of Salary + Employer Costs + Statutory + Management Fees",
        },
        {
          id: "TOTAL_COST_TO_CLIENT",
          name: "Total Cost to Client",
          type: "section_total",
          category: "Section Totals",
          description:
            "Salary + Employer Costs + Management Fees (excludes employee deductions)",
        },
      ];

      // Combine regular components with section totals
      const allComponents = [...components, ...sectionTotals];
      console.log(
        "[Export Template] Total components including section totals:",
        allComponents.length
      );
      setAvailableComponents(allComponents);
    } catch (error) {
      console.error("Error loading template components:", error);
    }
  };

  /**
   * Load existing export template for the client
   */
  const loadExportTemplate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sanctumRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/v2/export-templates/by-client/${selectedClient.id}`
      );

      let templates = [];

      // Check if body was already consumed
      if (response.bodyUsed) {
        console.warn("Response body already consumed, cannot load template");
        // Set defaults for new template
        setTemplateName(`${selectedClient.organisation_name} Invoice Template`);
        setDescription(
          "Invoice export format for " + selectedClient.organisation_name
        );
        setLineItems(getDefaultLineItems());
        return;
      }

      // Check response status first
      if (!response.ok) {
        console.log("No export template found or API error:", response.status);
        // Set defaults for new template
        setTemplateName(`${selectedClient.organisation_name} Invoice Template`);
        setDescription(
          "Invoice export format for " + selectedClient.organisation_name
        );
        setLineItems(getDefaultLineItems());
        return;
      }

      // Try to parse JSON
      try {
        templates = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        // Set defaults for new template
        setTemplateName(`${selectedClient.organisation_name} Invoice Template`);
        setDescription(
          "Invoice export format for " + selectedClient.organisation_name
        );
        setLineItems(getDefaultLineItems());
        return;
      }

      if (templates && templates.length > 0) {
        const template = templates[0]; // Use first active template
        setTemplateName(
          template.name ||
            `${selectedClient.organisation_name} Invoice Template`
        );
        setDescription(template.description || "");
        setLineItems(JSON.parse(template.line_items || "[]"));
        setExcelSettings({
          includeSummarySheet: template.include_summary_sheet,
          includeBreakdownSheet: template.include_breakdown_sheet,
          ...JSON.parse(template.excel_settings || "{}"),
        });
      } else {
        // No template exists - set defaults
        setTemplateName(`${selectedClient.organisation_name} Invoice Template`);
        setDescription(
          "Invoice export format for " + selectedClient.organisation_name
        );
        setLineItems(getDefaultLineItems());
      }
    } catch (error) {
      console.error("Error loading export template:", error);
      setError("Failed to load export template");
      // Set defaults
      setTemplateName(`${selectedClient.organisation_name} Invoice Template`);
      setLineItems(getDefaultLineItems());
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get default line items for new export template
   */
  const getDefaultLineItems = () => [
    {
      id: "total_staff_cost",
      name: "Total Staff Cost",
      formula_type: "sum",
      sum_items: ["gross_salary"],
      description: "Sum of all staff gross salaries",
      order: 1,
    },
    {
      id: "management_fee",
      name: "Management Fee",
      formula_type: "percentage",
      depends_on: "total_staff_cost",
      percentage: 10,
      description: "10% management fee on total staff cost",
      order: 2,
    },
    {
      id: "vat_on_management",
      name: "VAT on Management Fee",
      formula_type: "percentage",
      depends_on: "management_fee",
      percentage: 7.5,
      description: "7.5% VAT on management fee",
      order: 3,
    },
    {
      id: "invoice_total",
      name: "Invoice Total",
      formula_type: "sum",
      sum_items: ["total_staff_cost", "management_fee", "vat_on_management"],
      description: "Total invoice amount",
      order: 4,
    },
  ];

  /**
   * Add new line item
   */
  const addLineItem = (lineItem) => {
    const newItem = {
      ...lineItem,
      id: `item_${Date.now()}`,
      order: lineItems.length + 1,
    };
    setLineItems([...lineItems, newItem]);
    setShowAddItem(false);
  };

  /**
   * Update line item
   */
  const updateLineItem = (itemId, updates) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  /**
   * Remove line item
   */
  const removeLineItem = (itemId) => {
    setLineItems(lineItems.filter((item) => item.id !== itemId));
  };

  /**
   * Move line item up/down
   */
  const moveLineItem = (itemId, direction) => {
    const itemIndex = lineItems.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return;

    const newIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    if (newIndex < 0 || newIndex >= lineItems.length) return;

    const newItems = [...lineItems];
    [newItems[itemIndex], newItems[newIndex]] = [
      newItems[newIndex],
      newItems[itemIndex],
    ];

    // Update order numbers
    newItems.forEach((item, index) => {
      item.order = index + 1;
    });

    setLineItems(newItems);
  };

  /**
   * Save export template
   */
  const saveTemplate = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        client_id: selectedClient.id,
        name: templateName,
        description: description,
        format: "excel",
        column_mappings: lineItems, // Store line items as column mappings
        formatting_rules: excelSettings,
        grouping_rules: [],
        use_credit_to_bank_model: false,
        service_fee_percentage: 0,
        fee_calculation_rules: [],
        header_config: {},
        footer_config: {},
        styling_config: {},
      };

      const response = await sanctumRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/invoice-export-templates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: selectedClient.id,
            name: templateName,
            description: description,
            line_items: lineItems,
            excel_settings: excelSettings,
          }),
        }
      );

      if (response.ok) {
        const savedTemplate = await response.json();
        alert("Export template saved successfully!");
        console.log("Saved export template:", savedTemplate);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save export template");
      }
    } catch (error) {
      console.error("Error saving export template:", error);
      setError(error.message);
      alert("Failed to save export template: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Export Template Builder
                </h1>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                Invoice Format
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center space-x-2 px-4 py-2 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Line Item</span>
              </button>

              <button
                onClick={saveTemplate}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Template"}</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close Export Template Builder"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Template Info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Fiducia Invoice Template"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
              </label>
              <input
                type="text"
                value={selectedClient?.organisation_name || ""}
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows="2"
              placeholder="Describe what appears on this client's invoice..."
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Line Items Configuration */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Invoice Line Items
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Define what appears on the final invoice Excel file. These line
                items will appear on both the Summary sheet (totals) and
                Breakdown sheet (per employee).
              </p>

              {/* Line Items List */}
              <div className="space-y-4">
                {lineItems.map((item, index) => (
                  <LineItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={lineItems.length}
                    onUpdate={(updates) => updateLineItem(item.id, updates)}
                    onRemove={() => removeLineItem(item.id)}
                    onMove={(direction) => moveLineItem(item.id, direction)}
                  />
                ))}

                {lineItems.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Line Items
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add line items to define what appears on your invoice
                    </p>
                    <button
                      onClick={() => setShowAddItem(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add First Line Item
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Excel Settings Panel */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Excel Settings
            </h3>

            <div className="space-y-6">
              {/* Sheet Configuration */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Sheet Configuration
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={excelSettings.includeSummarySheet}
                      onChange={(e) =>
                        setExcelSettings((prev) => ({
                          ...prev,
                          includeSummarySheet: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include Summary Sheet
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={excelSettings.includeBreakdownSheet}
                      onChange={(e) =>
                        setExcelSettings((prev) => ({
                          ...prev,
                          includeBreakdownSheet: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include Breakdown Sheet
                    </span>
                  </label>
                </div>
              </div>

              {/* Header Configuration */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Header & Footer
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={excelSettings.companyHeader}
                      onChange={(e) =>
                        setExcelSettings((prev) => ({
                          ...prev,
                          companyHeader: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include Company Header
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={excelSettings.periodicSummary}
                      onChange={(e) =>
                        setExcelSettings((prev) => ({
                          ...prev,
                          periodicSummary: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include Period Summary
                    </span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Preview Structure
                </h4>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs">
                  <div className="font-medium text-gray-900 mb-2">
                    Sheet 1: Summary
                  </div>
                  <div className="space-y-1 text-gray-600">
                    {lineItems.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.name}:</span>
                        <span>₦XXX,XXX</span>
                      </div>
                    ))}
                  </div>

                  <div className="font-medium text-gray-900 mt-4 mb-2">
                    Sheet 2: Breakdown
                  </div>
                  <div className="text-gray-600">
                    <div>Employee details with all line items per staff</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="text-gray-700">
                  Loading export template for{" "}
                  {selectedClient?.organisation_name}...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
            <div className="flex">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Add Line Item Modal */}
      {showAddItem && (
        <AddLineItemModal
          onAdd={addLineItem}
          onClose={() => setShowAddItem(false)}
          existingItems={lineItems}
          availableComponents={availableComponents}
        />
      )}
    </div>
  );
};

/**
 * Line Item Card Component
 */
const LineItemCard = ({
  item,
  index,
  totalItems,
  onUpdate,
  onRemove,
  onMove,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getFormulaDescription = () => {
    switch (item.formula_type) {
      case "percentage":
        return `${item.percentage}% of ${item.depends_on}`;
      case "percentage_subtraction":
        return `-${item.percentage}% of ${item.depends_on}`;
      case "component_sum":
        return `Sum of ${item.depends_on} component`;
      case "line_item_sum":
        return `Sum of: ${item.depends_on}`;
      case "subtraction":
        return `${item.base_item} minus ${
          item.subtract_items?.length || 0
        } item(s)`;
      case "fixed_amount":
        return `Fixed amount: ₦${item.amount?.toLocaleString()}`;
      default:
        return "Custom formula";
    }
  };

  const getIcon = () => {
    switch (item.formula_type) {
      case "percentage":
        return <Percent className="w-4 h-4 text-blue-600" />;
      case "percentage_subtraction":
        return <Percent className="w-4 h-4 text-red-600" />;
      case "component_sum":
        return <Users className="w-4 h-4 text-green-600" />;
      case "line_item_sum":
        return <Calculator className="w-4 h-4 text-purple-600" />;
      case "subtraction":
        return <Minus className="w-4 h-4 text-red-600" />;
      case "fixed_amount":
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {item.name}
            </h4>
            <p className="text-xs text-gray-500">{getFormulaDescription()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Move Up/Down */}
          <button
            onClick={() => onMove("up")}
            disabled={index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <Move className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={() => onMove("down")}
            disabled={index === totalItems - 1}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <Move className="w-4 h-4" />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Edit settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Remove */}
          <button
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-600"
            title="Remove line item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Formula Type
              </label>
              <select
                value={item.formula_type}
                onChange={(e) => onUpdate({ formula_type: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="percentage">Percentage</option>
                <option value="component_sum">Component Sum</option>
                <option value="line_item_sum">Line Item Sum</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>
          </div>

          {/* Conditional Fields */}
          {item.formula_type === "percentage" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Percentage
                </label>
                <input
                  type="number"
                  value={item.percentage || ""}
                  onChange={(e) =>
                    onUpdate({ percentage: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Depends On
                </label>
                <input
                  type="text"
                  value={item.depends_on || ""}
                  onChange={(e) => onUpdate({ depends_on: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., total_staff_cost"
                />
              </div>
            </div>
          )}

          {item.formula_type === "fixed_amount" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount (₦)
              </label>
              <input
                type="number"
                value={item.amount || ""}
                onChange={(e) =>
                  onUpdate({ amount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                step="1000"
                min="0"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={item.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows="2"
              placeholder="Describe this line item..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Add Line Item Modal
 */
const AddLineItemModal = ({
  onAdd,
  onClose,
  existingItems,
  availableComponents,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    formula_type: "component",
    depends_on: "",
    percentage: 10,
    amount: 0,
    sum_items: [],
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Line Item</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Management Fee"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formula Type
            </label>
            <select
              value={formData.formula_type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  formula_type: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="component">
                Component (direct from template)
              </option>
              <option value="percentage">Percentage of another item</option>
              <option value="percentage_subtraction">
                Percentage subtraction (e.g., -5% of item)
              </option>
              <option value="sum">Sum (of components or items)</option>
              <option value="subtraction">
                Subtraction (deduct from an item)
              </option>
              <option value="fixed_amount">Fixed amount</option>
            </select>
          </div>

          {/* Conditional Fields */}
          {formData.formula_type === "component" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Component
              </label>
              <select
                value={formData.depends_on}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    depends_on: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Select component from template...</option>
                {availableComponents.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.type})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                This will bring the component value directly from the uploaded
                salary template
              </p>
            </div>
          )}

          {(formData.formula_type === "percentage" ||
            formData.formula_type === "percentage_subtraction") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percentage (%)
                  {formData.formula_type === "percentage_subtraction" && (
                    <span className="text-red-600 text-xs ml-1">
                      (will be subtracted)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={formData.percentage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      percentage: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Based On
                </label>
                <select
                  value={formData.depends_on}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      depends_on: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select item...</option>
                  {/* Group template components by category */}
                  {[
                    "Salary & Allowances",
                    "Employer Costs",
                    "Statutory Deductions",
                    "Management Fees",
                    "Section Totals",
                  ].map((category) => {
                    const categoryComponents = availableComponents.filter(
                      (comp) => comp.category === category
                    );
                    if (categoryComponents.length === 0) return null;

                    return (
                      <optgroup key={category} label={category}>
                        {categoryComponents.map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  <optgroup label="Line Items">
                    {existingItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </>
          )}

          {formData.formula_type === "sum" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sum Of
              </label>
              <select
                multiple
                value={formData.sum_items || []}
                onChange={(e) => {
                  const selectedOptions = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setFormData((prev) => ({
                    ...prev,
                    sum_items: selectedOptions,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                size="6"
              >
                {/* Group template components by category */}
                {[
                  "Salary & Allowances",
                  "Employer Costs",
                  "Statutory Deductions",
                  "Management Fees",
                  "Section Totals",
                ].map((category) => {
                  const categoryComponents = availableComponents.filter(
                    (comp) => comp.category === category
                  );
                  if (categoryComponents.length === 0) return null;

                  return (
                    <optgroup key={category} label={category}>
                      {categoryComponents.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
                <optgroup label="Line Items">
                  {existingItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Hold Ctrl/Cmd to select multiple items to sum
              </p>
            </div>
          )}

          {formData.formula_type === "subtraction" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start With (Base Item)
                </label>
                <select
                  value={formData.base_item || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      base_item: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Select base item --</option>
                  {[
                    "Salary & Allowances",
                    "Employer Costs",
                    "Statutory Deductions",
                    "Management Fees",
                    "Section Totals",
                  ].map((category) => {
                    const categoryComponents = availableComponents.filter(
                      (comp) => comp.category === category
                    );
                    if (categoryComponents.length === 0) return null;

                    return (
                      <optgroup key={category} label={category}>
                        {categoryComponents.map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  <optgroup label="Line Items">
                    {existingItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtract These Items
                </label>
                <select
                  multiple
                  value={formData.subtract_items || []}
                  onChange={(e) => {
                    const selectedOptions = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    setFormData((prev) => ({
                      ...prev,
                      subtract_items: selectedOptions,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  size="6"
                >
                  {[
                    "Salary & Allowances",
                    "Employer Costs",
                    "Statutory Deductions",
                    "Management Fees",
                    "Section Totals",
                  ].map((category) => {
                    const categoryComponents = availableComponents.filter(
                      (comp) => comp.category === category
                    );
                    if (categoryComponents.length === 0) return null;

                    return (
                      <optgroup key={category} label={category}>
                        {categoryComponents.map((comp) => (
                          <option key={comp.id} value={comp.id}>
                            {comp.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  <optgroup label="Line Items">
                    {existingItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Hold Ctrl/Cmd to select multiple items to subtract
                </p>
              </div>
            </>
          )}

          {formData.formula_type === "fixed_amount" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₦)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                step="1000"
                min="0"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows="2"
              placeholder="Describe this line item..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Line Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportTemplateBuilder;
