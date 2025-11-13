import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  Alert,
  AlertDescription,
} from "@/components/ui";
import {
  Calculator,
  DollarSign,
  FileCheck,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from "lucide-react";

/**
 * Phase 2.1: Template Preview Calculations Component
 * Real-time template-based calculation preview
 */
const TemplatePreviewCalculations = ({
  calculations,
  templateCoverage,
  uploadData,
}) => {
  const [calculationDetails, setCalculationDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (uploadData?.upload_id) {
      loadCalculationDetails();
    }
  }, [uploadData]);

  const loadCalculationDetails = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/attendance/${uploadData.upload_id}/calculate-preview`
      );

      if (response.ok) {
        const data = await response.json();
        setCalculationDetails(data);
      }
    } catch (error) {
      console.error("Error loading calculation details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getTemplateStatusBadge = (covered, total) => {
    const percentage = total > 0 ? (covered / total) * 100 : 0;

    if (percentage === 100) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Complete Coverage
        </Badge>
      );
    } else if (percentage >= 80) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Partial Coverage
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Insufficient Coverage
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-40 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Template-Based Calculations Preview
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Real-time invoice calculations using configured templates
        </p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-xl font-semibold text-gray-900">
                  {calculations?.total_staff || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Gross Total</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(calculations?.gross_total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Deductions</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(calculations?.total_deductions)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calculator className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Total</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(calculations?.net_total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Coverage Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Template Coverage Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Coverage Status:
              </span>
              {getTemplateStatusBadge(
                templateCoverage?.covered_pay_grades?.length || 0,
                templateCoverage?.total_pay_grades || 0
              )}
            </div>
            <span className="text-sm text-gray-600">
              {templateCoverage?.coverage_percentage || 0}% Complete
            </span>
          </div>

          <Progress
            value={templateCoverage?.coverage_percentage || 0}
            max={100}
            className="w-full"
          />

          {templateCoverage?.missing_templates?.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Missing templates for pay grades:{" "}
                {templateCoverage.missing_templates.join(", ")}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Pay Grade Breakdown */}
      {calculationDetails?.pay_grade_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Pay Grade Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculationDetails.pay_grade_breakdown.map((grade) => (
                <div
                  key={grade.pay_grade_structure_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {grade.grade_name ||
                        `Pay Grade ${grade.pay_grade_structure_id}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {grade.staff_count} staff • {grade.total_days} total days
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(grade.net_amount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Gross: {formatCurrency(grade.gross_amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Breakdown */}
      {calculationDetails?.component_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Salary Components Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Earnings</h4>
                <div className="space-y-2">
                  {Object.entries(
                    calculationDetails.component_breakdown.earnings || {}
                  ).map(([component, amount]) => (
                    <div
                      key={component}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-600 capitalize">
                        {component.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Deductions</h4>
                <div className="space-y-2">
                  {Object.entries(
                    calculationDetails.component_breakdown.deductions || {}
                  ).map(([component, amount]) => (
                    <div
                      key={component}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-600 capitalize">
                        {component.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Warnings */}
      {calculationDetails?.warnings?.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Validation Warnings:</div>
              {calculationDetails.warnings.map((warning, index) => (
                <div key={index} className="text-sm">
                  • {warning}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TemplatePreviewCalculations;
