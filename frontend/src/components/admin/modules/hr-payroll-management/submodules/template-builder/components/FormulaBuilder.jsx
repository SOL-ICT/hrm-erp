/**
 * Formula Builder - Visual interface for creating and editing salary calculation formulas
 * Helps users build formulas without needing to know syntax
 */

"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Minus,
  DivideIcon,
  Asterisk,
  Percent,
  Calculator,
  AlertCircle,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

const FormulaBuilder = ({ component, availableVariables, onSave, onClose }) => {
  const [formula, setFormula] = useState(component.formula || "");
  const [testValue, setTestValue] = useState(500000);
  const [testResult, setTestResult] = useState(null);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState("");

  // Common formula templates
  const formulaTemplates = [
    {
      name: "Percentage of Basic Salary",
      formula: "basic_salary * {percentage} / 100",
      description: "Calculate as percentage of basic salary",
      example: "20% = basic_salary * 20 / 100",
    },
    {
      name: "Fixed Amount",
      formula: "{amount}",
      description: "Use a fixed amount",
      example: "50000",
    },
    {
      name: "Monthly from Annual",
      formula: "{annual_amount} / 12",
      description: "Divide annual amount by 12 months",
      example: "600000 / 12 = 50000/month",
    },
    {
      name: "Sum of Components",
      formula: "{component1} + {component2}",
      description: "Add multiple components together",
      example: "housing + transport + lunch",
    },
    {
      name: "Percentage of Gross",
      formula: "gross_salary * {percentage} / 100",
      description: "Calculate as percentage of gross salary",
      example: "5% tax = gross_salary * 5 / 100",
    },
  ];

  // Operators
  const operators = [
    { symbol: "+", icon: Plus, label: "Add" },
    { symbol: "-", icon: Minus, label: "Subtract" },
    { symbol: "*", icon: Asterisk, label: "Multiply" },
    { symbol: "/", icon: DivideIcon, label: "Divide" },
    { symbol: "%", icon: Percent, label: "Modulo" },
  ];

  // Insert into formula
  const insertText = (text) => {
    setFormula(formula + " " + text);
  };

  // Test formula
  const testFormula = () => {
    try {
      // Create a test context
      const context = {
        basic_salary: testValue,
        gross_salary: testValue * 1.5,
      };

      // Replace variables in formula
      let testExpression = formula;
      Object.entries(context).forEach(([key, value]) => {
        testExpression = testExpression.replace(new RegExp(key, "g"), value);
      });

      // Evaluate
      const result = eval(testExpression);
      setTestResult(result);
      setIsValid(true);
      setError("");
    } catch (err) {
      setIsValid(false);
      setError(err.message);
      setTestResult(null);
    }
  };

  // Handle save
  const handleSave = () => {
    if (formula.trim()) {
      onSave(formula.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div>
            <h2 className="text-xl font-bold">Formula Builder</h2>
            <p className="text-sm opacity-90 mt-1">
              Building formula for: {component.label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Formula Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formula
            </label>
            <div className="relative">
              <Calculator className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                rows={3}
                placeholder="e.g., basic_salary * 0.20"
              />
            </div>

            {/* Validation Status */}
            {formula && (
              <div
                className={`mt-2 flex items-center space-x-2 text-sm ${
                  isValid ? "text-green-600" : "text-red-600"
                }`}
              >
                {isValid ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Formula looks valid</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Insert */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Quick Insert
            </h3>

            {/* Variables */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Variables
              </label>
              <div className="flex flex-wrap gap-2">
                {availableVariables.map((variable) => (
                  <button
                    key={variable}
                    onClick={() => insertText(variable)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-mono rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>

            {/* Operators */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Operators
              </label>
              <div className="flex flex-wrap gap-2">
                {operators.map((op) => {
                  const OpIcon = op.icon;
                  return (
                    <button
                      key={op.symbol}
                      onClick={() => insertText(op.symbol)}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <OpIcon className="w-4 h-4" />
                      <span>{op.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => insertText("(")}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-mono rounded-lg hover:bg-gray-200 transition-colors"
                >
                  (
                </button>
                <button
                  onClick={() => insertText(")")}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-mono rounded-lg hover:bg-gray-200 transition-colors"
                >
                  )
                </button>
              </div>
            </div>
          </div>

          {/* Formula Templates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Formula Templates</span>
            </h3>
            <div className="space-y-2">
              {formulaTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => setFormula(template.formula)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  <div className="font-medium text-gray-900 mb-1">
                    {template.name}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {template.description}
                  </div>
                  <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {template.example}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Test Formula */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Test Formula
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Test with Basic Salary:
                </label>
                <input
                  type="number"
                  value={testValue}
                  onChange={(e) => setTestValue(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={testFormula}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Test Formula
              </button>
              {testResult !== null && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm text-green-700">Result:</div>
                  <div className="text-2xl font-bold text-green-900">
                    ₦{testResult.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formula.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Formula
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormulaBuilder;
