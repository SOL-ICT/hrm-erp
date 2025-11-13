/**
 * Template Canvas - Main workspace where users build their salary calculation template
 * Displays active components with drag-and-drop reordering
 */

"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Edit,
  Trash2,
  DollarSign,
  Percent,
  Calculator,
  AlertCircle,
} from "lucide-react";

// Sortable Component Card
const SortableComponentCard = ({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onOpenFormulaBuilder,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get color based on category
  const getCategoryColor = () => {
    switch (component.category) {
      case "allowance":
        return "border-green-200 bg-green-50";
      case "deduction":
        return "border-orange-200 bg-orange-50";
      case "statutory":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getIconColor = () => {
    switch (component.category) {
      case "allowance":
        return "text-green-600";
      case "deduction":
        return "text-orange-600";
      case "statutory":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative border-2 rounded-lg p-4 transition-all ${
        isSelected
          ? "ring-2 ring-indigo-500 border-indigo-500"
          : getCategoryColor()
      } ${isDragging ? "shadow-lg" : "shadow-sm hover:shadow-md"}`}
      onClick={() => onSelect(component)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing bg-gray-100 rounded-l-lg hover:bg-gray-200"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Component Content */}
      <div className="pl-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Component Header */}
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className={`w-5 h-5 ${getIconColor()}`} />
              <h3 className="font-semibold text-gray-900">{component.label}</h3>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white border border-gray-200">
                {component.category}
              </span>
            </div>

            {/* Formula Display */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2 mb-1">
                <Calculator className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-600">
                  Formula
                </span>
              </div>
              <code className="text-sm font-mono text-gray-800 block">
                {component.formula || "No formula set"}
              </code>
            </div>

            {/* Component Description */}
            {component.description && (
              <p className="text-sm text-gray-600">{component.description}</p>
            )}

            {/* Warning if no formula */}
            {!component.formula && (
              <div className="flex items-center space-x-2 mt-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Formula not set</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFormulaBuilder(component);
              }}
              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
              title="Edit Formula"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(component.id);
              }}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Remove Component"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Component is new indicator */}
        {component.isNew && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full animate-pulse">
              New
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const TemplateCanvas = ({
  components,
  selectedComponent,
  onSelectComponent,
  onUpdateComponent,
  onRemoveComponent,
  onOpenFormulaBuilder,
}) => {
  // Group components by category
  const groupedComponents = {
    allowance: components.filter((c) => c.category === "allowance"),
    deduction: components.filter((c) => c.category === "deduction"),
    statutory: components.filter((c) => c.category === "statutory"),
  };

  const renderSection = (title, items, emptyMessage) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <span>{title}</span>
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
          {items.length}
        </span>
      </h3>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((component) => (
            <SortableComponentCard
              key={component.id}
              component={component}
              isSelected={selectedComponent?.id === component.id}
              onSelect={onSelectComponent}
              onUpdate={onUpdateComponent}
              onRemove={onRemoveComponent}
              onOpenFormulaBuilder={onOpenFormulaBuilder}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Template Components
          </h2>
          <p className="text-gray-600">
            Add salary components from the library and configure their formulas.
            Drag to reorder components.
          </p>
        </div>

        {/* Empty State */}
        {components.length === 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-300 rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <DollarSign className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start Building Your Template
              </h3>
              <p className="text-gray-600 mb-4">
                Add salary components from the library on the left to start
                building your calculation template.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-indigo-600">
                <span>👈</span>
                <span>Click components in the library to add them</span>
              </div>
            </div>
          </div>
        )}

        {/* Component Sections */}
        {components.length > 0 && (
          <>
            {renderSection(
              "💰 Allowances",
              groupedComponents.allowance,
              "No allowances added yet. Add housing, transport, or other allowances from the library."
            )}

            {renderSection(
              "📉 Deductions",
              groupedComponents.deduction,
              "No deductions added yet. Add loan deductions or other deductions from the library."
            )}

            {renderSection(
              "🛡️ Statutory Components",
              groupedComponents.statutory,
              "No statutory components added yet. Add tax, pension, or NHIS contributions from the library."
            )}
          </>
        )}

        {/* Calculation Flow Indicator */}
        {components.length > 0 && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">
              📊 Calculation Flow
            </h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center space-x-2">
                <span className="font-mono">1.</span>
                <span>Basic Salary (input)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono">2.</span>
                <span>
                  + Allowances ({groupedComponents.allowance.length} components)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono">3.</span>
                <span>= Gross Salary</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono">4.</span>
                <span>
                  - Deductions ({groupedComponents.deduction.length} components)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono">5.</span>
                <span>
                  - Statutory ({groupedComponents.statutory.length} components)
                </span>
              </div>
              <div className="flex items-center space-x-2 font-semibold">
                <span className="font-mono">6.</span>
                <span>= Net Salary</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateCanvas;
