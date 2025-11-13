import React, { useState, useEffect } from "react";
import { Badge, Alert, AlertDescription } from "@/components/ui";
import { CheckCircle, XCircle, AlertTriangle, FileCheck } from "lucide-react";

/**
 * Phase 2.1: Pay Grade Structure Selector Component
 * Selector with template validation indicators
 */
const PayGradeStructureSelector = ({
  defaultValue,
  clientId,
  onSelect,
  showTemplateStatus = false,
  className = "",
}) => {
  const [payGrades, setPayGrades] = useState([]);
  const [templateStatus, setTemplateStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  useEffect(() => {
    if (clientId) {
      loadPayGrades();
    }
  }, [clientId]);

  const loadPayGrades = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load pay grade structures for the client
      const response = await fetch(
        `/api/salary-structures/client/${clientId}/pay-grades`
      );

      if (!response.ok) {
        throw new Error("Failed to load pay grades");
      }

      const data = await response.json();
      setPayGrades(data.pay_grades || []);

      // Load template status if required
      if (showTemplateStatus) {
        await loadTemplateStatus(data.pay_grades || []);
      }
    } catch (error) {
      console.error("Error loading pay grades:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateStatus = async (grades) => {
    try {
      const templatePromises = grades.map(async (grade) => {
        try {
          const response = await fetch(
            `/api/invoice-templates?client_id=${clientId}&pay_grade_structure_id=${grade.id}`
          );
          const data = await response.json();
          return {
            payGradeId: grade.id,
            hasTemplate: data.success && data.data && data.data.length > 0,
            templateCount: data.success ? data.data?.length || 0 : 0,
          };
        } catch {
          return {
            payGradeId: grade.id,
            hasTemplate: false,
            templateCount: 0,
          };
        }
      });

      const results = await Promise.all(templatePromises);
      const statusMap = {};
      results.forEach((result) => {
        statusMap[result.payGradeId] = result;
      });
      setTemplateStatus(statusMap);
    } catch (error) {
      console.error("Error loading template status:", error);
    }
  };

  const handleSelectionChange = (event) => {
    const value = event.target.value;
    setSelectedValue(value);
    if (onSelect) {
      onSelect(value ? parseInt(value) : null);
    }
  };

  const getTemplateIndicator = (payGradeId) => {
    if (!showTemplateStatus) return null;

    const status = templateStatus[payGradeId];
    if (!status) {
      return (
        <Badge className="bg-gray-100 text-gray-800 ml-2">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Checking...
        </Badge>
      );
    }

    if (status.hasTemplate) {
      return (
        <Badge className="bg-green-100 text-green-800 ml-2">
          <CheckCircle className="w-3 h-3 mr-1" />
          Template ({status.templateCount})
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 ml-2">
          <XCircle className="w-3 h-3 mr-1" />
          No Template
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Error loading pay grades: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <select
        value={selectedValue || ""}
        onChange={handleSelectionChange}
        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select Pay Grade Structure</option>
        {payGrades.map((grade) => (
          <option key={grade.id} value={grade.id}>
            {grade.grade_name} - {grade.description || `Grade ${grade.id}`}
          </option>
        ))}
      </select>

      {/* Template Status for Selected Grade */}
      {showTemplateStatus && selectedValue && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center">
            <FileCheck className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-sm text-gray-700">Template Status:</span>
          </div>
          {getTemplateIndicator(parseInt(selectedValue))}
        </div>
      )}

      {/* Template Coverage Summary */}
      {showTemplateStatus && payGrades.length > 0 && (
        <div className="text-xs text-gray-600">
          Template Coverage:{" "}
          {
            Object.values(templateStatus).filter(
              (status) => status?.hasTemplate
            ).length
          }{" "}
          of {payGrades.length} pay grades have templates
        </div>
      )}
    </div>
  );
};

export default PayGradeStructureSelector;
