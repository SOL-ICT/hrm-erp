import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Alert,
  AlertDescription,
  Progress,
} from "../ui";
import {
  FileSpreadsheet,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Upload,
  Users,
  Calendar,
  Clock,
} from "lucide-react";

const FilePreviewComponent = ({ file, onConfirm, onCancel }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (file) {
      parseFilePreview(file);
    }
  }, [file]);

  const parseFilePreview = async (file) => {
    setLoading(true);
    setError(null);

    try {
      // For production, this would use a library like Papa Parse for CSV or SheetJS for Excel
      // For now, we'll simulate the parsing process

      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing time

      // Simulated parsed data
      const simulatedData = {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.type.includes("csv") ? "CSV" : "Excel",
        totalRows: 25,
        validRows: 23,
        invalidRows: 2,
        columns: [
          {
            name: "Employee ID",
            found: true,
            type: "string",
            example: "EMP001",
          },
          {
            name: "Employee Name",
            found: true,
            type: "string",
            example: "John Doe",
          },
          {
            name: "Work Date",
            found: true,
            type: "date",
            example: "2025-09-15",
          },
          { name: "Hours Worked", found: true, type: "number", example: "8" },
          {
            name: "Basic Salary",
            found: false,
            type: "number",
            example: "Not found",
          },
        ],
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
          {
            "Employee ID": "EMP004",
            "Employee Name": "Sarah Wilson",
            "Work Date": "2025-09-15",
            "Hours Worked": 8,
            "Basic Salary": 350000,
          },
          {
            "Employee ID": "EMP005",
            "Employee Name": "David Brown",
            "Work Date": "2025-09-15",
            "Hours Worked": 8,
            "Basic Salary": 280000,
          },
        ],
        validationResults: [
          {
            type: "error",
            row: 12,
            message: "Missing Employee Name for EMP012",
          },
          {
            type: "error",
            row: 18,
            message: 'Invalid date format in row 18: "N/A"',
          },
          {
            type: "warning",
            row: 7,
            message: "High hours worked (12 hours) - please verify",
          },
          {
            type: "warning",
            row: 22,
            message: "Weekend date detected - confirm if intentional",
          },
        ],
        dateRange: {
          start: "2025-09-01",
          end: "2025-09-30",
        },
        uniqueEmployees: 20,
      };

      setPreviewData(simulatedData);
    } catch (err) {
      setError("Failed to parse file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getValidationIcon = (type) => {
    return type === "error" ? (
      <XCircle className="h-4 w-4 text-red-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
    );
  };

  const getColumnStatus = (column) => {
    if (column.found) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const canProceed =
    previewData &&
    previewData.validRows > 0 &&
    previewData.columns.filter((c) => c.found).length >= 3;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h3 className="text-lg font-semibold">Analyzing File</h3>
            <p className="text-gray-600">
              Please wait while we process your file...
            </p>
            <div className="w-full max-w-sm mx-auto">
              <Progress value={65} className="h-2" />
            </div>
            <p className="text-sm text-gray-500">
              Parsing columns and validating data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>File Parsing Failed</strong>
              <br />
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end space-x-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!previewData) return null;

  return (
    <div className="space-y-6">
      {/* File Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            File Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">File Name</p>
              <p className="text-sm">{previewData.fileName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">File Size</p>
              <p className="text-sm">{previewData.fileSize}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">File Type</p>
              <Badge variant="outline">{previewData.fileType}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rows</p>
              <p className="text-sm font-semibold">{previewData.totalRows}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Valid Records
                </p>
                <p className="text-xl font-bold text-green-600">
                  {previewData.validRows}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Invalid Records
                </p>
                <p className="text-xl font-bold text-red-600">
                  {previewData.invalidRows}
                </p>
              </div>
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Unique Employees
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {previewData.uniqueEmployees}
                </p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Date Range</p>
                <p className="text-sm font-semibold">
                  {formatDate(previewData.dateRange.start)} -{" "}
                  {formatDate(previewData.dateRange.end)}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Column Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {previewData.columns.map((column, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getColumnStatus(column)}
                  <div>
                    <p className="font-medium">{column.name}</p>
                    <p className="text-sm text-gray-600">Type: {column.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {column.found ? "Found" : "Missing"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Example: {column.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sample Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data (First 5 Rows)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(previewData.sampleData[0] || {}).map((key) => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.sampleData.map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {typeof value === "number" && value > 1000
                          ? value.toLocaleString()
                          : String(value)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {previewData.validationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {previewData.validationResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    result.type === "error"
                      ? "bg-red-50 border-red-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  {getValidationIcon(result.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">Row {result.row}</p>
                    <p className="text-sm">{result.message}</p>
                  </div>
                  <Badge
                    variant={
                      result.type === "error" ? "destructive" : "secondary"
                    }
                  >
                    {result.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center p-6 bg-gray-50 rounded-lg">
        <div>
          {!canProceed ? (
            <Alert variant="destructive" className="max-w-md">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Cannot proceed: File has critical errors or missing required
                columns
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="max-w-md">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                File looks good! Ready to process {previewData.validRows} valid
                records.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(previewData)}
            disabled={!canProceed}
            className="flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Process File
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewComponent;
