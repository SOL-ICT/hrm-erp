/**
 * Visual Template Builder - Modern drag-and-drop interface for salary calculation templates
 *
 * Features:
 * - Drag & drop salary components
 * - Real-time calculation preview
 * - Visual formula builder
 * - Template library with pre-built options
 * - Mobile-responsive design
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Calculator,
  Plus,
  Trash2,
  Settings,
  Eye,
  Save,
  Download,
  Upload,
  Copy,
  Sparkles,
  TrendingUp,
  DollarSign,
  Percent,
  Hash,
  X,
} from "lucide-react";

// Import components
import ComponentPalette from "./components/ComponentPalette";
import TemplateCanvas from "./components/TemplateCanvas";
import LivePreview from "./components/LivePreview";
import TemplateLibrary from "./components/TemplateLibrary";
import FormulaBuilder from "./components/FormulaBuilder";

const VisualTemplateBuilder = ({ selectedClient, selectedGrade, onClose }) => {
  const { sanctumRequest } = useAuth();

  // Main state
  const [templateName, setTemplateName] = useState("New Template");
  const [templateDescription, setTemplateDescription] = useState("");
  const [payGradeCode, setPayGradeCode] = useState("");
  const [templateId, setTemplateId] = useState(null);

  // Component state
  const [activeComponents, setActiveComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [availableComponents, setAvailableComponents] = useState([]);

  // UI state
  const [showLibrary, setShowLibrary] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Sample data for preview
  const [sampleData, setSampleData] = useState({
    basicSalary: 500000,
    attendanceDays: 22,
    totalWorkingDays: 22,
  });

  // Load template when selectedGrade changes
  useEffect(() => {
    if (selectedGrade && selectedGrade.grade_code) {
      loadTemplateForGrade(selectedGrade.grade_code);
    }
  }, [selectedGrade]);

  /**
   * Load template from invoice_templates API
   * NOTE: Now uses invoice_templates instead of deprecated calculation_templates
   */
  const loadTemplateForGrade = async (gradeCode) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      if (!selectedClient || !selectedGrade) {
        throw new Error("Client and grade must be selected");
      }

      console.log("[VisualTemplateBuilder] Loading template for:", {
        client: selectedClient.id,
        grade: selectedGrade.id,
      });

      // Load from invoice_templates using client_id and pay_grade_structure_id
      const response = await sanctumRequest(
        `${process.env.NEXT_PUBLIC_API_URL}/invoice-templates?client_id=${selectedClient.id}&pay_grade_structure_id=${selectedGrade.id}`
      );

      if (response.ok) {
        const data = await response.json();
        const templates = data.data?.data || data.data || [];

        if (templates.length > 0) {
          const template = templates[0]; // Use first template
          console.log("[VisualTemplateBuilder] Template loaded:", template);
          parseInvoiceTemplate(template);
        } else {
          // No template exists yet
          console.log(
            "[VisualTemplateBuilder] No template found, starting fresh"
          );
          setTemplateName(`${selectedGrade.grade_name} Template`);
          setPayGradeCode(gradeCode);
          setActiveComponents([]);
        }
      } else if (response.status === 404) {
        // No template exists yet - start fresh
        console.log(
          "[VisualTemplateBuilder] No template found for grade:",
          gradeCode
        );
        setTemplateName(`${selectedGrade.grade_name} Template`);
        setPayGradeCode(gradeCode);
        setActiveComponents([]);
      } else {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }
    } catch (error) {
      console.error("[VisualTemplateBuilder] Error loading template:", error);
      setLoadError(error.message);
      // Start fresh even if there's an error
      setTemplateName(`${selectedGrade?.grade_name || "New"} Template`);
      setPayGradeCode(gradeCode);
      setActiveComponents([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Parse invoice_template format (new 4-category structure)
   * Converts from invoice_templates to component format for the visual builder
   */
  const parseInvoiceTemplate = (template) => {
    const components = [];

    try {
      // Parse custom_components (Salary & Allowances)
      const customComponents =
        typeof template.custom_components === "string"
          ? JSON.parse(template.custom_components)
          : template.custom_components || [];

      customComponents.forEach((comp, index) => {
        // Determine the formula/value
        let formula = "0";
        if (comp.formula) {
          formula = comp.formula;
        } else if (comp.amount !== undefined && comp.amount !== null) {
          formula = comp.amount.toString();
        } else if (comp.rate !== undefined && comp.rate !== null) {
          formula = `BASIC_SALARY * ${comp.rate} / 100`;
        }

        components.push({
          id: comp.name ? `custom_${comp.name}` : `comp_${components.length}`,
          type: comp.name,
          label: comp.description || comp.name,
          category: "allowance",
          formula: formula,
          description: comp.description || "",
          order: components.length,
        });
      });

      // Parse employer_costs (Medical Insurance, ITF, etc.)
      const employerCosts =
        typeof template.employer_costs === "string"
          ? JSON.parse(template.employer_costs)
          : template.employer_costs || [];

      employerCosts.forEach((comp, index) => {
        // Determine the formula/value
        let formula = "0";
        if (comp.formula) {
          formula = comp.formula;
        } else if (comp.amount !== undefined && comp.amount !== null) {
          formula = comp.amount.toString();
        } else if (comp.rate !== undefined && comp.rate !== null) {
          formula = `GROSS_SALARY * ${comp.rate} / 100`;
        }

        components.push({
          id: comp.name ? `employer_${comp.name}` : `comp_${components.length}`,
          type: comp.name,
          label: comp.description || comp.name,
          category: "employer_cost",
          formula: formula,
          description: comp.description || "",
          order: components.length,
        });
      });

      // Parse statutory_components (Employee Deductions)
      const statutoryComponents =
        typeof template.statutory_components === "string"
          ? JSON.parse(template.statutory_components)
          : template.statutory_components || [];

      statutoryComponents.forEach((comp, index) => {
        // Determine the formula/value
        let formula = "0";
        if (comp.formula) {
          formula = comp.formula;
        } else if (comp.amount !== undefined && comp.amount !== null) {
          formula = comp.amount.toString();
        } else if (comp.rate !== undefined && comp.rate !== null) {
          formula = `GROSS_SALARY * ${comp.rate} / 100`;
        }

        components.push({
          id: comp.name
            ? `statutory_${comp.name}`
            : `comp_${components.length}`,
          type: comp.name,
          label: comp.description || comp.name,
          category: "statutory",
          formula: formula,
          description: comp.description || "",
          order: components.length,
        });
      });

      // Parse management_fees
      const managementFees =
        typeof template.management_fees === "string"
          ? JSON.parse(template.management_fees)
          : template.management_fees || [];

      managementFees.forEach((comp, index) => {
        // Determine the formula/value
        let formula = "0";
        if (comp.formula) {
          formula = comp.formula;
        } else if (comp.amount !== undefined && comp.amount !== null) {
          formula = comp.amount.toString();
        } else if (comp.rate !== undefined && comp.rate !== null) {
          formula = `GROSS_SALARY * ${comp.rate} / 100`;
        }

        components.push({
          id: comp.name
            ? `management_${comp.name}`
            : `comp_${components.length}`,
          type: comp.name,
          label: comp.description || comp.name,
          category: "management",
          formula: formula,
          description: comp.description || "",
          order: components.length,
        });
      });

      setActiveComponents(components);
      setTemplateName(template.template_name || template.name);
      setTemplateDescription(template.description || "");
      setPayGradeCode(selectedGrade?.grade_code || "");
      setTemplateId(template.id);

      console.log(
        `[VisualTemplateBuilder] Loaded ${components.length} components from invoice template:`,
        {
          custom: customComponents.length,
          employer: employerCosts.length,
          statutory: statutoryComponents.length,
          management: managementFees.length,
        }
      );
    } catch (error) {
      console.error(
        "[VisualTemplateBuilder] Error parsing invoice template:",
        error
      );
      setLoadError("Error parsing template data: " + error.message);
    }
  };

  /**
   * Parse OLD calculation_template format (DEPRECATED - kept for reference)
   * This is the old format, only use if loading from calculation_templates table
   */
  const parseAndLoadTemplate = (template) => {
    const components = [];

    try {
      // Parse allowances
      const allowances =
        typeof template.allowance_components === "string"
          ? JSON.parse(template.allowance_components)
          : template.allowance_components;

      Object.entries(allowances || {}).forEach(([key, val]) => {
        components.push({
          id: key,
          type: key,
          label: formatLabel(key),
          category: "allowance",
          formula: val.formula,
          description: val.description || "",
          order: components.length,
        });
      });

      // Parse deductions
      const deductions =
        typeof template.deduction_components === "string"
          ? JSON.parse(template.deduction_components)
          : template.deduction_components;

      Object.entries(deductions || {}).forEach(([key, val]) => {
        components.push({
          id: key,
          type: key,
          label: formatLabel(key),
          category: "deduction",
          formula: val.formula,
          description: val.description || "",
          order: components.length,
        });
      });

      // Parse statutory
      const statutory =
        typeof template.statutory_components === "string"
          ? JSON.parse(template.statutory_components)
          : template.statutory_components;

      Object.entries(statutory || {}).forEach(([key, val]) => {
        components.push({
          id: key,
          type: key,
          label: formatLabel(key),
          category: "statutory",
          formula: val.formula,
          description: val.description || "",
          order: components.length,
        });
      });

      setActiveComponents(components);
      setTemplateName(template.name);
      setTemplateDescription(template.description || "");
      setPayGradeCode(template.pay_grade_code);
      setTemplateId(template.id);

      console.log(
        `Loaded ${components.length} components for ${template.name}`
      );
    } catch (error) {
      console.error("Error parsing template components:", error);
      setLoadError("Error parsing template data");
    }
  };

  /**
   * Format component key to readable label
   * e.g., "housing_allowance" -> "Housing Allowance"
   */
  const formatLabel = (key) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate preview results based on active components
  const calculatePreview = () => {
    let results = {
      basicSalary: sampleData.basicSalary,
      allowances: {},
      deductions: {},
      statutory: {},
      grossSalary: 0,
      totalDeductions: 0,
      netSalary: 0,
    };

    // Calculate allowances
    activeComponents
      .filter((c) => c.category === "allowance")
      .forEach((component) => {
        const value = evaluateFormula(component.formula, results);
        results.allowances[component.id] = value;
      });

    // Calculate gross salary
    results.grossSalary =
      results.basicSalary +
      Object.values(results.allowances).reduce((sum, val) => sum + val, 0);

    // Calculate deductions
    activeComponents
      .filter((c) => c.category === "deduction")
      .forEach((component) => {
        const value = evaluateFormula(component.formula, results);
        results.deductions[component.id] = value;
      });

    // Calculate statutory
    activeComponents
      .filter((c) => c.category === "statutory")
      .forEach((component) => {
        const value = evaluateFormula(component.formula, results);
        results.statutory[component.id] = value;
      });

    // Calculate totals
    results.totalDeductions =
      Object.values(results.deductions).reduce((sum, val) => sum + val, 0) +
      Object.values(results.statutory).reduce((sum, val) => sum + val, 0);

    results.netSalary = results.grossSalary - results.totalDeductions;

    return results;
  };

  // Simple formula evaluator for preview
  const evaluateFormula = (formula, context) => {
    if (!formula) return 0;

    try {
      // If formula is just a number, return it
      const numericValue = parseFloat(formula);
      if (
        !isNaN(numericValue) &&
        formula.toString() === numericValue.toString()
      ) {
        return numericValue;
      }

      // Replace component references with actual values
      let expression = formula.toString();

      // Handle Excel-style formulas (remove leading =)
      if (expression.startsWith("=")) {
        expression = expression.substring(1);
      }

      // Replace system variables
      expression = expression.replace(/basic_salary/gi, context.basicSalary);
      expression = expression.replace(/gross_salary/gi, context.grossSalary);
      expression = expression.replace(/GROSS_SALARY/g, context.grossSalary);
      expression = expression.replace(/BASIC_SALARY/g, context.basicSalary);
      expression = expression.replace(
        /attendance_days/g,
        sampleData.attendanceDays
      );
      expression = expression.replace(
        /total_working_days/g,
        sampleData.totalWorkingDays
      );
      expression = expression.replace(/annual_division_factor/g, 12); // Default to 12 months

      // Handle SUM() functions BEFORE replacing component names
      // This processes Excel-style ranges like SUM(A:B) or SUM(BASIC_SALARY:TRANSPORT)
      expression = expression.replace(/SUM\((.*?)\)/gi, (match, group) => {
        // Handle range notation (COMPONENT1:COMPONENT2)
        if (group.includes(":")) {
          const [start, end] = group.split(":").map((s) => s.trim());

          // Find all components between start and end in the activeComponents array
          const startIdx = activeComponents.findIndex(
            (c) => c.id === start || c.type === start || c.id.includes(start)
          );
          const endIdx = activeComponents.findIndex(
            (c) => c.id === end || c.type === end || c.id.includes(end)
          );

          if (startIdx >= 0 && endIdx >= 0) {
            // Sum all components in the range
            const rangeComponents = activeComponents.slice(
              Math.min(startIdx, endIdx),
              Math.max(startIdx, endIdx) + 1
            );

            const sum = rangeComponents.reduce((acc, comp) => {
              const value = context.allowances[comp.id] || 0;
              return acc + (typeof value === "number" ? value : 0);
            }, 0);

            return sum;
          }
        }

        // Handle comma-separated values
        const values = group.split(/[,\s]+/).filter((v) => v);
        const componentValues = values.map((v) => {
          // Check if it's already a number
          const num = parseFloat(v);
          if (!isNaN(num)) return num;

          // Look up component value
          return context.allowances[v] || context.deductions?.[v] || 0;
        });

        const sum = componentValues.reduce((acc, val) => acc + val, 0);
        return sum;
      });

      // Replace component references by name (handle UPPERCASE and underscores)
      activeComponents.forEach((comp) => {
        if (comp.id && context.allowances[comp.id]) {
          // Match the component name with word boundaries
          const regex = new RegExp(`\\b${comp.id}\\b`, "gi");
          expression = expression.replace(regex, context.allowances[comp.id]);
        }
      });

      // Replace allowance references
      Object.entries(context.allowances).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        expression = expression.replace(regex, value);
      });

      // Replace deduction references
      Object.entries(context.deductions || {}).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        expression = expression.replace(regex, value);
      });

      // Clean up any remaining component references that couldn't be resolved
      // Replace Cell_ prefixed references with 0
      expression = expression.replace(/\bCell_[A-Z0-9_]+\b/g, "0");
      // Replace any remaining UPPERCASE_WITH_UNDERSCORES with 0
      expression = expression.replace(/\b[A-Z_][A-Z_0-9]+\b/g, "0");

      // Evaluate the expression safely
      // Replace any remaining invalid JavaScript tokens
      expression = expression.replace(/[^0-9+\-*/.() ]/g, "");

      if (!expression || expression.trim() === "") {
        return 0;
      }

      return eval(expression);
    } catch (error) {
      console.error("Formula evaluation error:", error, "Formula:", formula);
      // Return 0 instead of throwing to prevent UI crashes
      return 0;
    }
  };

  // Handle component addition
  const addComponent = (componentTemplate) => {
    const newComponent = {
      ...componentTemplate,
      id: `${componentTemplate.type}_${Date.now()}`,
      isNew: true,
    };
    setActiveComponents([...activeComponents, newComponent]);
  };

  // Handle component removal
  const removeComponent = (componentId) => {
    setActiveComponents(activeComponents.filter((c) => c.id !== componentId));
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  };

  // Handle component update
  const updateComponent = (componentId, updates) => {
    setActiveComponents(
      activeComponents.map((c) =>
        c.id === componentId ? { ...c, ...updates } : c
      )
    );
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setActiveComponents((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Save template to API
  const saveTemplate = async () => {
    setIsSaving(true);
    setLoadError(null);

    try {
      // Group components by category
      const allowances = {};
      const deductions = {};
      const statutory = {};

      activeComponents.forEach((component) => {
        const componentData = {
          formula: component.formula,
          description: component.description || component.label,
        };

        switch (component.category) {
          case "allowance":
            allowances[component.type] = componentData;
            break;
          case "deduction":
            deductions[component.type] = componentData;
            break;
          case "statutory":
            statutory[component.type] = componentData;
            break;
        }
      });

      // Prepare payload
      const payload = {
        name: templateName,
        pay_grade_code: payGradeCode || selectedGrade?.grade_code,
        description: templateDescription,
        allowance_components: JSON.stringify(allowances),
        deduction_components: JSON.stringify(deductions),
        statutory_components: JSON.stringify(statutory),
        salary_components: "{}",
        calculation_rules: "{}",
        annual_division_factor: 12,
        attendance_calculation_method: "working_days",
        prorate_salary: true,
        is_active: true,
      };

      console.log("Saving template:", payload);

      // Determine if creating new or updating existing
      const url = templateId
        ? `${process.env.NEXT_PUBLIC_API_URL}/calculation-templates/${templateId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/calculation-templates`;

      const response = await sanctumRequest(url, {
        method: templateId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedTemplate = await response.json();
        setTemplateId(savedTemplate.id);
        alert(`Template ${templateId ? "updated" : "created"} successfully!`);
        console.log("Saved template:", savedTemplate);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      setLoadError(error.message);
      alert("Failed to save template: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Add custom component uploaded by user
   */
  const handleUploadComponent = (newComponent) => {
    const component = {
      id: newComponent.name.toLowerCase().replace(/\s+/g, "_"),
      type: newComponent.name.toLowerCase().replace(/\s+/g, "_"),
      label: newComponent.name,
      category: newComponent.category,
      formula: newComponent.formula,
      description: newComponent.description,
      order: activeComponents.length,
      isCustom: true,
    };

    setActiveComponents([...activeComponents, component]);
    setShowUploadModal(false);
  };

  // Load template from library
  const loadTemplate = (template) => {
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setPayGradeCode(template.pay_grade_code);
    setActiveComponents(template.components || []);
    setShowLibrary(false);
  };

  // Recalculate preview whenever sampleData or activeComponents change
  const previewResults = useMemo(() => {
    return calculatePreview();
  }, [sampleData, activeComponents]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Visual Template Builder
                </h1>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                New Experience
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Component</span>
              </button>

              <button
                onClick={() => setShowLibrary(true)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Template Library</span>
              </button>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showPreview
                    ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>

              <button
                onClick={saveTemplate}
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Template"}</span>
              </button>

              <button
                onClick={() => {
                  const exportData = {
                    name: templateName,
                    pay_grade_code: payGradeCode,
                    description: templateDescription,
                    components: activeComponents,
                    created_at: new Date().toISOString(),
                  };
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${
                    payGradeCode || "template"
                  }_${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Export template as JSON file for backup"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close Template Builder"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Template Info */}
          <div className="mt-4 flex items-center space-x-4">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="px-3 py-2 text-lg font-semibold border-b-2 border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none transition-colors"
              placeholder="Template Name"
            />
            <input
              type="text"
              value={payGradeCode}
              onChange={(e) => setPayGradeCode(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              placeholder="Pay Grade Code (e.g., SENIOR_MGR)"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Component Palette */}
          <ComponentPalette
            currentComponents={activeComponents}
            onAddComponent={addComponent}
          />

          {/* Template Canvas */}
          <div className="flex-1 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <TemplateCanvas
                components={activeComponents}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
                onUpdateComponent={updateComponent}
                onRemoveComponent={removeComponent}
                onOpenFormulaBuilder={(component) => {
                  setSelectedComponent(component);
                  setShowFormulaBuilder(true);
                }}
              />
            </DndContext>
          </div>

          {/* Live Preview Panel */}
          {showPreview && (
            <LivePreview
              results={previewResults}
              sampleData={sampleData}
              onUpdateSampleData={setSampleData}
              components={activeComponents}
            />
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="text-gray-700">
                  Loading template for {selectedGrade?.grade_name}...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {loadError && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Error:</span>
              <span>{loadError}</span>
              <button
                onClick={() => setLoadError(null)}
                className="ml-2 text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {showLibrary && (
          <TemplateLibrary
            onClose={() => setShowLibrary(false)}
            onLoadTemplate={loadTemplate}
          />
        )}

        {showFormulaBuilder && selectedComponent && (
          <FormulaBuilder
            component={selectedComponent}
            availableVariables={[
              "basic_salary",
              "gross_salary",
              ...activeComponents.map((c) => c.type),
            ]}
            onSave={(formula) => {
              updateComponent(selectedComponent.id, { formula });
              setShowFormulaBuilder(false);
            }}
            onClose={() => setShowFormulaBuilder(false)}
          />
        )}

        {/* Upload Component Modal */}
        {showUploadModal && (
          <ComponentUploadModal
            onClose={() => setShowUploadModal(false)}
            onUpload={handleUploadComponent}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Component Upload Modal
 * Allows users to create custom salary components for ANY client
 */
const ComponentUploadModal = ({ onClose, onUpload }) => {
  const [formData, setFormData] = useState({
    name: "",
    formula: "",
    category: "allowance",
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.formula) {
      alert("Please fill in component name and formula");
      return;
    }

    onUpload(formData);
    setFormData({
      name: "",
      formula: "",
      category: "allowance",
      description: "",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Plus className="w-6 h-6" />
              <h2 className="text-xl font-bold">Add Custom Component</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
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
          <p className="text-indigo-100 text-sm mt-2">
            Create a custom allowance, deduction, or statutory component
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Component Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Component Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Driver Allowance, Performance Bonus"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Will be converted to lowercase_with_underscores
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="allowance">Allowance (Added to salary)</option>
              <option value="deduction">
                Deduction (Subtracted from salary)
              </option>
              <option value="statutory">Statutory (Required deductions)</option>
            </select>
          </div>

          {/* Formula */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formula *
            </label>
            <input
              type="text"
              value={formData.formula}
              onChange={(e) =>
                setFormData({ ...formData, formula: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              placeholder="e.g., basic_salary * 0.15 or 50000"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use:{" "}
              <code className="bg-gray-100 px-1 rounded">basic_salary</code>,{" "}
              <code className="bg-gray-100 px-1 rounded">gross_salary</code>,
              operators: +, -, *, /, %
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Optional description of what this component is for"
              rows={3}
            />
          </div>

          {/* Examples */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Examples:
            </h4>
            <div className="space-y-1 text-xs text-blue-800">
              <p>
                • <strong>Housing:</strong> basic_salary * 0.20
              </p>
              <p>
                • <strong>Transport:</strong> basic_salary * 0.10
              </p>
              <p>
                • <strong>Fixed Meal:</strong> 30000
              </p>
              <p>
                • <strong>Tax:</strong> gross_salary * 0.05
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Component
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisualTemplateBuilder;
