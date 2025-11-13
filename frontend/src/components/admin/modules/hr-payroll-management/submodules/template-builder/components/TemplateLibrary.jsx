/**
 * Template Library - Modal showing pre-built template options
 * Now fetches real templates from the database instead of using mock data
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Star,
  TrendingUp,
  Users,
  Briefcase,
  Crown,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";

const TemplateLibrary = ({ onClose, onLoadTemplate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get auth token for API request
        let authToken = null;
        if (typeof window !== "undefined") {
          // Try multiple token storage methods for compatibility
          try {
            const authData = JSON.parse(localStorage.getItem("auth") || "{}");
            authToken = authData.access_token;
          } catch (e) {
            // Fallback to direct token storage
            authToken =
              localStorage.getItem("auth_token") ||
              localStorage.getItem("token");
          }
        }

        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        };

        // Add Bearer token if available
        if (authToken && authToken !== "session-authenticated") {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(
          "http://localhost:8000/api/calculation-templates",
          {
            credentials: "include",
            headers,
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load templates: ${response.statusText}`);
        }

        const data = await response.json();
        setTemplates(data.data || data || []);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);
  // Parse components from JSON
  const parseTemplate = (template) => {
    try {
      const components = [];

      // Parse allowance components
      if (template.allowance_components) {
        const allowances =
          typeof template.allowance_components === "string"
            ? JSON.parse(template.allowance_components)
            : template.allowance_components;
        Object.entries(allowances || {}).forEach(([key, value]) => {
          components.push({
            id: key,
            type: key,
            label:
              value.name ||
              key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            category: "allowance",
            formula: value.formula || value.rate || "0",
            description: value.description || "",
          });
        });
      }

      // Parse deduction components
      if (template.deduction_components) {
        const deductions =
          typeof template.deduction_components === "string"
            ? JSON.parse(template.deduction_components)
            : template.deduction_components;
        Object.entries(deductions || {}).forEach(([key, value]) => {
          components.push({
            id: key,
            type: key,
            label:
              value.name ||
              key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            category: "deduction",
            formula: value.formula || value.rate || "0",
            description: value.description || "",
          });
        });
      }

      // Parse statutory components
      if (template.statutory_components) {
        const statutory =
          typeof template.statutory_components === "string"
            ? JSON.parse(template.statutory_components)
            : template.statutory_components;
        Object.entries(statutory || {}).forEach(([key, value]) => {
          components.push({
            id: key,
            type: key,
            label:
              value.name ||
              key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            category: "statutory",
            formula: value.formula || value.rate || "0",
            description: value.description || "",
          });
        });
      }

      return {
        ...template,
        components,
        componentCount: components.length,
      };
    } catch (error) {
      console.error("Error parsing template:", error);
      return {
        ...template,
        components: [],
        componentCount: 0,
      };
    }
  };

  // Filter templates
  const filteredTemplates = templates.map(parseTemplate).filter((template) => {
    const matchesSearch =
      (template.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (template.pay_grade_code || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Template Library
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose from pre-built templates or start from scratch
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by name, description, or pay grade code..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading templates...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 mb-2">Failed to load templates</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map((template) => {
                  return (
                    <div
                      key={template.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => onLoadTemplate(template)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 text-sm">
                              {template.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-mono">
                                {template.pay_grade_code}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center space-x-1">
                          {template.is_active && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {template.description || "No description available"}
                      </p>

                      {/* Component Count */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>
                            {
                              template.components.filter(
                                (c) => c.category === "allowance"
                              ).length
                            }{" "}
                            allowances
                          </span>
                          <span>
                            {
                              template.components.filter(
                                (c) => c.category === "statutory"
                              ).length
                            }{" "}
                            statutory
                          </span>
                        </div>
                        <Download className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No templates found matching your criteria
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchQuery
                      ? "Try a different search term"
                      : "Create a new template to get started"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredTemplates.length} template
            {filteredTemplates.length !== 1 ? "s" : ""} available
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Start from Scratch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;
