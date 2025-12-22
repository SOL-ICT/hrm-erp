import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useAllActiveClients } from "@/hooks/useClients";
import { invoiceApiService } from "../../services/modules/invoicing";
import AttendanceCalculationPreview from "./AttendanceCalculationPreview";
import {
  Upload,
  FileSpreadsheet,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  AlertTriangle,
  Calculator,
} from "lucide-react";

const AttendanceUploadComponent = () => {
  const { clients } = useAllActiveClients();
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payCalculationBasis, setPayCalculationBasis] =
    useState("working_days");
  const [showCalculationPreview, setShowCalculationPreview] = useState(false);
  const [calculationData, setCalculationData] = useState(null);

  // Load uploads on component mount
  useEffect(() => {
    loadUploads();
  }, []);

  // Load attendance uploads
  const loadUploads = async () => {
    try {
      setLoading(true);
      const response = await invoiceApiService.getAttendanceUploads({
        per_page: 10,
      });
      setUploads(response.data || []);
    } catch (error) {
      console.error("Error loading uploads:", error);
      setError("Failed to load upload history");
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload and processing
  const handleFileUpload = async () => {
    if (!selectedFile || !selectedClient) {
      alert("Please select both a file and a client");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Use simplified upload since template is now simplified
      const result = await invoiceApiService.uploadSimplifiedAttendanceFile(
        selectedFile,
        selectedClient
      );

      setUploadResult(result);

      // Reload uploads list
      await loadUploads();

      // Reset form
      setSelectedFile(null);
      setPreviewData(null);

      // Reset file input
      const fileInput = document.getElementById("file-upload");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error.message || "Upload failed");
      setUploadResult({
        success: false,
        error: error.message || "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle upload deletion
  const handleDeleteUpload = async (uploadId) => {
    if (
      !confirm(
        "Are you sure you want to delete this upload? This will remove all associated attendance records."
      )
    ) {
      return;
    }

    try {
      await invoiceApiService.deleteAttendanceUpload(uploadId);
      await loadUploads(); // Reload the list
      alert("Upload deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete upload: " + error.message);
    }
  };

  // Handle template download
  const handleDownloadTemplate = () => {
    // Create the simplified attendance template with only required fields
    const templateData = [
      ["Employee ID", "Employee Name", "Days Worked"],
      ["EMP001", "John Doe", "22"],
      ["EMP002", "Jane Smith", "20"],
      ["EMP003", "Mike Johnson", "25"],
    ];

    // Instructions for the simplified template
    const instructionData = [
      ["SIMPLIFIED ATTENDANCE DATA TEMPLATE"],
      [""],
      ["=== INSTRUCTIONS ==="],
      ["1. Employee ID: Must match existing employee records in the system"],
      ["2. Employee Name: For display and verification purposes"],
      ["3. Days Worked: Number of days worked in the period (0-31)"],
      [""],
      ["=== IMPORTANT NOTES ==="],
      ["• Only these 3 fields are required for attendance-based invoicing"],
      [
        "• Salary data will be automatically fetched from employee pay grade assignments",
      ],
      [
        "• Attendance factor will be calculated based on client's pay calculation basis",
      ],
      ["• Only employees with existing pay grade assignments can be processed"],
      ["• Preview will show calculated adjustments before final processing"],
      ["• Save as Excel (.xlsx) or CSV file before uploading"],
      [""],
      ["DATA STARTS BELOW:"],
      [""],
    ];

    // Combine instructions with template data
    const fullData = [...instructionData, ...templateData];

    // Convert to CSV format
    const csvContent = fullData
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    // Add BOM for proper UTF-8 handling in Excel
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;

    // Create blob and download
    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `simplified_attendance_template_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      alert(
        "✅ Simplified template downloaded successfully! \n\nThe file contains:\n• Only 4 required fields (Employee Code, Name, Designation, Days Worked)\n• Salary data will be auto-fetched from system\n• Instructions for proper usage"
      );
    }
  };

  // File upload handler
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];
      if (!validTypes.includes(file.type)) {
        alert("Please select a valid Excel file (.xlsx, .xls) or CSV file");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should not exceed 10MB");
        return;
      }

      setSelectedFile(file);
      // Parse and preview file data
      previewFileData(file);
    }
  }, []);

  // Preview file data with calculation preview
  const previewFileData = (file) => {
    // Parse file for calculation preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Simple CSV parsing for demonstration
        const text = e.target.result;
        const lines = text.split("\n");
        const headers = lines[0].split(",");

        // Parse attendance data from CSV
        const attendanceData = lines
          .slice(1, 6)
          .map((line, index) => {
            // Limit to first 5 for preview
            const values = line.split(",");
            return {
              employee_name: values[0] || `Employee ${index + 1}`,
              employee_code:
                values[1] || `EMP${String(index + 1).padStart(3, "0")}`,
              designation: values[2] || "Staff",
              days_worked:
                parseInt(values[3]) || Math.floor(Math.random() * 22) + 1,
              department: values[4] || "General",
            };
          })
          .filter(
            (record) => record.employee_name && record.employee_name.trim()
          );

        setPreviewData({
          fileName: file.name,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          recordCount: attendanceData.length,
          attendanceData: attendanceData,
        });

        setShowCalculationPreview(true);
      } catch (error) {
        console.error("File preview error:", error);
        setPreviewData({
          fileName: file.name,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          message: 'File selected. Click "Upload & Process" to continue.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCalculationUpdate = (data) => {
    setCalculationData(data);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", icon: Clock, text: "Pending" },
      processing: { variant: "default", icon: Clock, text: "Processing" },
      completed: { variant: "default", icon: CheckCircle, text: "Completed" },
      failed: { variant: "destructive", icon: XCircle, text: "Failed" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Attendance & Payroll Upload
        </h2>
        <p className="text-gray-600">
          Upload employee attendance and payroll data for invoice generation
        </p>
      </div>

      {/* Upload Result Alert */}
      {uploadResult && (
        <Alert variant={uploadResult.success ? "default" : "destructive"}>
          <AlertDescription>
            {uploadResult.success ? (
              <div>
                <p className="font-medium">{uploadResult.message}</p>
                {uploadResult.data && (
                  <div className="mt-2 text-sm">
                    <p>Processed: {uploadResult.data.processed} records</p>
                    {uploadResult.data.failed > 0 && (
                      <p>Failed: {uploadResult.data.failed} records</p>
                    )}
                    {uploadResult.data.warnings &&
                      uploadResult.data.warnings.length > 0 && (
                        <p>Warnings: {uploadResult.data.warnings.length}</p>
                      )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="font-medium">
                  {uploadResult.message || "Upload failed"}
                </p>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm">Errors:</p>
                    <ul className="list-disc list-inside text-sm">
                      {uploadResult.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <li>... and {uploadResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload Payroll Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Client *
              </label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.client_name || client.organisation_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Upload File *
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="text-xs px-3 py-1.5 h-8 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                >
                  <Download className="h-3 w-3 mr-1.5" />
                  Download Template
                </Button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-sm text-gray-600">
                    <span className="text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>
                    {" or drag and drop"}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Excel (.xlsx, .xls) or CSV files only, max 10MB
                  </div>
                </label>
              </div>
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {/* Required Format Info */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div>
                    <strong>Required columns:</strong> Employee Code, Employee
                    Name, Designation, Days Worked
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    ✨ <strong>Simplified:</strong> Salary data auto-fetched
                    from employee records the correct format with sample data
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Upload Button */}
            <Button
              onClick={handleFileUpload}
              disabled={!selectedClient || !selectedFile || uploading}
              className="w-full"
            >
              {uploading
                ? "Uploading & Processing..."
                : "Upload & Process File"}
            </Button>
          </CardContent>
        </Card>

        {/* File Preview and Calculation Preview */}
        {previewData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                File Preview & Calculation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="file-info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="file-info">File Info</TabsTrigger>
                  <TabsTrigger value="data-preview">Data Preview</TabsTrigger>
                  <TabsTrigger
                    value="calculation"
                    disabled={!showCalculationPreview}
                  >
                    <Calculator className="h-4 w-4 mr-1" />
                    Calculation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file-info" className="mt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">File Name:</span>
                      <span>{previewData.fileName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">File Size:</span>
                      <span>{previewData.fileSize}</span>
                    </div>
                    {previewData.recordCount && (
                      <div className="flex justify-between">
                        <span className="font-medium">Records Found:</span>
                        <span>{previewData.recordCount} employees</span>
                      </div>
                    )}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {previewData.message ||
                          "File ready for processing. Review data and calculation preview before uploading."}
                      </p>
                    </div>

                    {/* Calculation Basis Selection */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">
                        Calculation Basis
                      </label>
                      <Select
                        value={payCalculationBasis}
                        onValueChange={setPayCalculationBasis}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select calculation basis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="working_days">
                            Working Days (22 days)
                          </SelectItem>
                          <SelectItem value="calendar_days">
                            Calendar Days (30 days)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="data-preview" className="mt-4">
                  {previewData.attendanceData &&
                  previewData.attendanceData.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600">
                        Preview of first {previewData.attendanceData.length}{" "}
                        records:
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee Name</TableHead>
                            <TableHead>Employee Code</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Days Worked</TableHead>
                            <TableHead>Department</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.attendanceData.map((record, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {record.employee_name}
                              </TableCell>
                              <TableCell>{record.employee_code}</TableCell>
                              <TableCell>{record.designation}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {record.days_worked}
                                </Badge>
                              </TableCell>
                              <TableCell>{record.department}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No preview data available. Upload a CSV file to see data
                      preview.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="calculation" className="mt-4">
                  {showCalculationPreview && previewData.attendanceData ? (
                    <AttendanceCalculationPreview
                      attendanceData={previewData.attendanceData}
                      clientId={selectedClient}
                      payCalculationBasis={payCalculationBasis}
                      onCalculationUpdate={handleCalculationUpdate}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Upload attendance data to see calculation preview
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload History */}
      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading uploads...
                  </TableCell>
                </TableRow>
              ) : uploads.length > 0 ? (
                uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">
                      {upload.file_name}
                    </TableCell>
                    <TableCell>
                      {upload.client?.client_name ||
                        upload.client?.organisation_name}
                    </TableCell>
                    <TableCell>
                      {upload.records_processed || 0}
                      {upload.records_failed > 0 && (
                        <span className="text-red-600 ml-1">
                          ({upload.records_failed} failed)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(upload.status)}</TableCell>
                    <TableCell>{formatDate(upload.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteUpload(upload.id)}
                          title="Delete Upload"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-4 text-gray-500"
                  >
                    No uploads found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceUploadComponent;
