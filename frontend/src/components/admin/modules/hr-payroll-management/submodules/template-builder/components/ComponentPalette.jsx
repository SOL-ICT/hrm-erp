/**
 * Component Palette - Shows available components from the template
 * Now works with real database components instead of mock data
 */

"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingDown,
  Shield,
  Search,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";

const ComponentPalette = ({ onAddComponent, currentComponents = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({
    allowances: true,
    deductions: true,
    statutory: true,
  });

  // Category metadata
  const categoryMeta = {
    allowances: {
      title: "Allowances",
      icon: DollarSign,
      color: "bg-green-100 text-green-700",
    },
    deductions: {
      title: "Deductions",
      icon: TrendingDown,
      color: "bg-orange-100 text-orange-700",
    },
    statutory: {
      title: "Statutory Components",
      icon: Shield,
      color: "bg-blue-100 text-blue-700",
    },
  };

  // Group current components by category
  const groupedComponents = {
    allowances: currentComponents.filter((c) => c.category === "allowance"),
    deductions: currentComponents.filter((c) => c.category === "deduction"),
    statutory: currentComponents.filter((c) => c.category === "statutory"),
  };

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };

  // Filter components based on search
  const filterComponents = (items) => {
    if (!searchQuery) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Component Library
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Click to add components to your template
        </p>
      </div>

      <div className="p-4 space-y-4">
        {currentComponents.length === 0 ? (
          // Show message when no components loaded yet
          <div className="text-center py-8">
            <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No components available yet.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Load a template or add custom components to get started.
            </p>
          </div>
        ) : (
          // Show components grouped by category
          Object.entries(categoryMeta).map(([key, meta]) => {
            const CategoryIcon = meta.icon;
            const isExpanded = expandedCategories[key];
            const categoryItems = groupedComponents[key] || [];
            const filteredItems = filterComponents(categoryItems);

            if (categoryItems.length === 0) return null;
            if (searchQuery && filteredItems.length === 0) return null;

            return (
              <div key={key} className="space-y-2">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(key)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <CategoryIcon className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900 text-sm">
                      {meta.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({filteredItems.length})
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="space-y-2 pl-2">
                    {filteredItems.map((component) => {
                      const ComponentIcon = CategoryIcon;
                      return (
                        <button
                          key={component.id}
                          onClick={() =>
                            onAddComponent({
                              ...component,
                            })
                          }
                          className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`p-2 rounded-lg ${meta.color} group-hover:scale-110 transition-transform`}
                            >
                              <ComponentIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                                {component.label}
                              </div>
                              {component.description && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {component.description}
                                </div>
                              )}
                              <div className="text-xs font-mono text-gray-400 mt-1 truncate">
                                {component.formula ||
                                  component.defaultFormula ||
                                  "No formula"}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Tips */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-700 mb-2">
          💡 Quick Tips
        </h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click components to add to canvas</li>
          <li>• Drag to reorder on canvas</li>
          <li>• Click component to edit formula</li>
          <li>• Use "Add Custom Component" for new items</li>
        </ul>
      </div>
    </div>
  );
};

export default ComponentPalette;
