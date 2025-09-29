import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  CheckCircle,
  AlertTriangle,
  Eye,
  Users,
  Calendar,
  Clock,
} from "lucide-react";

const TemplateDownloadComponent = () => {
  const [showPreview, setShowPreview] = useState(null);

  const templates = [
    {
      id: 1,
      name: "Basic Attendance Template",
      type: "Excel",
      description:
        "Simple attendance tracking with employee ID, name, date, and hours worked",
      filename: "basic_attendance_template.xlsx",
      requiredColumns: [
        "Employee ID",
        "Employee Name",
        "Work Date",
        "Hours Worked",
      ],
      optionalColumns: ["Basic Salary", "Overtime Hours"],
      sampleData: [
        {
          "Employee ID": "EMP001",
          "Employee Name": "John Doe",
          "Work Date": "2025-09-15",
          "Hours Worked": 8,
          "Basic Salary": 300000,
        },
        {
          "Employee ID": "EMP002",
          "Employee Name": "Jane Smith",
          "Work Date": "2025-09-15",
          "Hours Worked": 8,
          "Basic Salary": 400000,
        },
        {
          "Employee ID": "EMP003",
          "Employee Name": "Mike Johnson",
          "Work Date": "2025-09-15",
          "Hours Worked": 7.5,
          "Basic Salary": 250000,
        },
      ],
      guidelines: [
        "Employee ID must be unique and consistent",
        "Date format should be YYYY-MM-DD or DD/MM/YYYY",
        "Hours worked should be numeric (decimal allowed)",
        "Basic Salary is optional but recommended for accurate calculations",
      ],
    },
    {
      id: 2,
      name: "Detailed Payroll Template",
      type: "Excel",
      description: "Comprehensive payroll data with allowances and deductions",
      filename: "detailed_payroll_template.xlsx",
      requiredColumns: [
        "Employee ID",
        "Employee Name",
        "Work Date",
        "Days Worked",
        "Basic Salary",
      ],
      optionalColumns: [
        "Transport Allowance",
        "Meal Allowance",
        "Housing Allowance",
        "Other Deductions",
      ],
      sampleData: [
        {
          "Employee ID": "EMP001",
          "Employee Name": "John Doe",
          "Work Date": "2025-09-15",
          "Days Worked": 22,
          "Basic Salary": 300000,
          "Transport Allowance": 25000,
        },
        {
          "Employee ID": "EMP002",
          "Employee Name": "Jane Smith",
          "Work Date": "2025-09-15",
          "Days Worked": 20,
          "Basic Salary": 400000,
          "Transport Allowance": 40000,
        },
        {
          "Employee ID": "EMP003",
          "Employee Name": "Mike Johnson",
          "Work Date": "2025-09-15",
          "Days Worked": 21,
          "Basic Salary": 250000,
          "Transport Allowance": 20000,
        },
      ],
      guidelines: [
        "Include all allowances as separate columns",
        "Days worked should be actual working days in the month",
        "All monetary values should be in Naira (no commas or currency symbols)",
        "Deductions can be combined or separated into different columns",
      ],
    },
    {
      id: 3,
      name: "CSV Simple Format",
      type: "CSV",
      description: "Lightweight CSV format for basic attendance data",
      filename: "simple_attendance_template.csv",
      requiredColumns: ["employee_id", "name", "date", "hours"],
      optionalColumns: ["salary", "notes"],
      sampleData: [
        {
          employee_id: "EMP001",
          name: "John Doe",
          date: "2025-09-15",
          hours: 8,
          salary: 300000,
        },
        {
          employee_id: "EMP002",
          name: "Jane Smith",
          date: "2025-09-15",
          hours: 8,
          salary: 400000,
        },
        {
          employee_id: "EMP003",
          name: "Mike Johnson",
          date: "2025-09-15",
          hours: 7.5,
          salary: 250000,
        },
      ],
      guidelines: [
        "Use lowercase column headers with underscores",
        "No spaces in column names",
        "Date format: YYYY-MM-DD",
        "Numeric values only (no formatting)",
      ],
    },
  ];

  const handleDownloadTemplate = (template) => {
    // In a real implementation, this would generate and download the actual file
    // For now, we'll simulate the download

    if (template.type === "Excel") {
      // Generate Excel file content
      const csvContent = generateCSVContent(template);
      downloadFile(
        csvContent,
        template.filename.replace(".xlsx", ".csv"),
        "text/csv"
      );
    } else {
      // Generate CSV file content
      const csvContent = generateCSVContent(template);
      downloadFile(csvContent, template.filename, "text/csv");
    }
  };

  const generateCSVContent = (template) => {
    const headers = [
      ...template.requiredColumns,
      ...template.optionalColumns,
    ].join(",");
    const sampleRows = template.sampleData
      .map((row) => Object.values(row).join(","))
      .join("\n");

    return `${headers}\n${sampleRows}`;
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getTemplateIcon = (type) => {
    return type === "Excel" ? (
      <FileSpreadsheet className="h-6 w-6 text-green-600" />
    ) : (
      <FileText className="h-6 w-6 text-blue-600" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Download Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Download these templates to ensure your attendance data is
              properly formatted for processing. Each template includes sample
              data and formatting guidelines.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {getTemplateIcon(template.type)}
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {template.type}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{template.description}</p>

              {/* Required Columns */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                  Required Columns
                </h4>
                <div className="flex flex-wrap gap-1">
                  {template.requiredColumns.map((col, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Optional Columns */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-1" />
                  Optional Columns
                </h4>
                <div className="flex flex-wrap gap-1">
                  {template.optionalColumns.map((col, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={() => handleDownloadTemplate(template)}
                  className="flex-1"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{template.name} Preview</DialogTitle>
                      <DialogDescription>
                        Sample data and formatting guidelines for this template
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Sample Data Table */}
                      <div>
                        <h4 className="font-medium mb-3">Sample Data</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(template.sampleData[0] || {}).map(
                                  (key) => (
                                    <TableHead key={key} className="text-xs">
                                      {key}
                                    </TableHead>
                                  )
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {template.sampleData.map((row, index) => (
                                <TableRow key={index}>
                                  {Object.values(row).map(
                                    (value, cellIndex) => (
                                      <TableCell
                                        key={cellIndex}
                                        className="text-xs"
                                      >
                                        {typeof value === "number" &&
                                        value > 1000
                                          ? value.toLocaleString()
                                          : String(value)}
                                      </TableCell>
                                    )
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Guidelines */}
                      <div>
                        <h4 className="font-medium mb-3">
                          Formatting Guidelines
                        </h4>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <ul className="space-y-2">
                            {template.guidelines.map((guideline, index) => (
                              <li key={index} className="flex items-start">
                                <div className="h-2 w-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <span className="text-sm text-blue-800">
                                  {guideline}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2">1. Download Template</h3>
              <p className="text-sm text-gray-600">
                Choose and download the template that best fits your data
                structure
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">2. Fill Your Data</h3>
              <p className="text-sm text-gray-600">
                Replace sample data with your actual employee attendance
                information
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium mb-2">3. Upload & Process</h3>
              <p className="text-sm text-gray-600">
                Upload your completed file through the attendance upload feature
              </p>
            </div>
          </div>

          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Make sure to follow the column names
              and data formats exactly as shown in the templates. This ensures
              smooth processing and accurate invoice generation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateDownloadComponent;
