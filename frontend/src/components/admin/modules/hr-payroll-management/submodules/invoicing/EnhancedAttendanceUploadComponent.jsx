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
  Progress,
} from "@/components/ui";
import { useClients } from "@/hooks/useClients";
import { invoiceApiService } from "../../services/modules/invoicing";
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
  Target,
  FileCheck,
  TrendingUp,
} from "lucide-react";

/**
 * Phase 1.3: Enhanced Attendance Upload Component
 *
 * Features:
 * - Direct pay_grade_structure_id matching
 * - Real-time validation feedback
 * - Template coverage analysis
 * - Comprehensive validation reporting
 */
const EnhancedAttendanceUploadComponent = () => {
  const { clients } = useClients();
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [templateCoverage, setTemplateCoverage] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      setValidationResults(null);
      setTemplateCoverage(null);
      setError(null);
    }
  };

  // Phase 1.3: Enhanced upload with direct ID matching
  const handleEnhancedUpload = async () => {
    if (!selectedFile || !selectedClient) {
      alert("Please select both a file and a client");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setActiveTab("validation");

      // Step 1: Upload with direct ID matching
      const uploadResponse = await invoiceApiService.uploadWithDirectMatching(
        selectedFile,
        selectedClient
      );

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || "Upload failed");
      }

      setUploadResult(uploadResponse);
      const uploadId = uploadResponse.data.upload_id;

      // Step 2: Get validation results
      setValidating(true);
      const validationResponse = await invoiceApiService.getValidationResults(
        uploadId
      );

      if (validationResponse.success) {
        setValidationResults(validationResponse.data);
      }

      // Step 3: Get template coverage
      const coverageResponse = await invoiceApiService.getTemplateCoverage(
        uploadId
      );

      if (coverageResponse.success) {
        setTemplateCoverage(coverageResponse.data);
      }

      // Reset form
      setSelectedFile(null);
      const fileInput = document.getElementById("enhanced-file-upload");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Enhanced upload failed:", error);
      setError(error.message || "Enhanced upload failed");
    } finally {
      setUploading(false);
      setValidating(false);
    }
  };

  // Render validation status badge
  const renderValidationBadge = (status) => {
    const statusConfig = {
      ready_for_processing: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Ready for Processing",
      },
      partial_success: {
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertTriangle,
        label: "Partial Success",
      },
      failed: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Validation Failed",
      },
      pending: {
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
        label: "Pending Validation",
      },
    };

    const config = statusConfig[status] || statusConfig["pending"];
    const IconComponent = config.icon;

    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Render format validation section
  const renderFormatValidation = () => {
    if (!validationResults?.format_validation) return null;

    const formatData = validationResults.format_validation.data;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Format Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatData.total_records}
              </div>
              <div className="text-sm text-gray-500">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatData.valid_format}
              </div>
              <div className="text-sm text-gray-500">Valid Format</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatData.invalid_format}
              </div>
              <div className="text-sm text-gray-500">Invalid Format</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatData.total_records > 0
                  ? Math.round(
                      (formatData.valid_format / formatData.total_records) * 100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>

          {formatData.invalid_format > 0 && formatData.format_errors && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Format Issues:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formatData.format_errors.slice(0, 5).map((error, index) => (
                  <Alert key={index} className="py-2">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      <strong>{error.employee_code}:</strong>{" "}
                      {error.errors.join(", ")}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render ID matching validation section
  const renderIDMatchingValidation = () => {
    if (!validationResults?.matching_results) return null;

    const matchingData = validationResults.matching_results.data;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Direct ID Matching
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {matchingData.successfully_matched}
              </div>
              <div className="text-sm text-gray-500">Successfully Matched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {matchingData.failed_matches}
              </div>
              <div className="text-sm text-gray-500">Failed Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {matchingData.successfully_matched +
                  matchingData.failed_matches >
                0
                  ? Math.round(
                      (matchingData.successfully_matched /
                        (matchingData.successfully_matched +
                          matchingData.failed_matches)) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-500">Match Rate</div>
            </div>
          </div>

          {matchingData.failed_matches > 0 && matchingData.matching_errors && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Matching Issues:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {matchingData.matching_errors
                  .slice(0, 5)
                  .map((error, index) => (
                    <Alert key={index} className="py-2">
                      <XCircle className="w-4 h-4" />
                      <AlertDescription className="text-sm">
                        <strong>{error.employee_code}:</strong>{" "}
                        {error.errors.join(", ")}
                      </AlertDescription>
                    </Alert>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render template coverage section
  const renderTemplateCoverage = () => {
    if (!templateCoverage?.template_coverage) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Template Coverage Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templateCoverage.template_coverage.map((template, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div className="flex items-center gap-3">
                  {template.has_template ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      Pay Grade ID: {template.pay_grade_structure_id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {template.has_template
                        ? `Template: ${template.template_name}`
                        : "No template available"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {template.record_count} records
                  </div>
                  {template.has_template && (
                    <Badge
                      className={
                        template.template_complete
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {template.template_complete ? "Complete" : "Incomplete"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render recommendations section
  const renderRecommendations = () => {
    if (!validationResults?.recommendations) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validationResults.recommendations.map((rec, index) => (
              <Alert
                key={index}
                className={
                  rec.type === "success"
                    ? "border-green-200 bg-green-50"
                    : rec.type === "warning"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-red-200 bg-red-50"
                }
              >
                {rec.type === "success" && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                {rec.type === "warning" && (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
                {rec.type === "error" && (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription>{rec.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Phase 1.3: Enhanced Attendance Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload & Validate</TabsTrigger>
              <TabsTrigger value="validation">Validation Results</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Client
                </label>
                <Select
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.organisation_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Attendance File (Excel/CSV with Pay Grade Structure
                  IDs)
                </label>
                <input
                  id="enhanced-file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="text-sm">{selectedFile.name}</span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleEnhancedUpload}
                disabled={!selectedFile || !selectedClient || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    {validating ? "Validating..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enhanced Upload with Validation
                  </>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Quick Upload Result */}
              {uploadResult && (
                <Alert
                  className={
                    uploadResult.success
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }
                >
                  {uploadResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription>
                    {uploadResult.success
                      ? `Upload successful! ${
                          uploadResult.data?.total_records || 0
                        } records processed.`
                      : `Upload failed: ${uploadResult.message}`}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="validation" className="space-y-4">
              {validationResults ? (
                <>
                  {/* Overall Status */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                          Overall Validation Status
                        </h3>
                        {renderValidationBadge(
                          validationResults.overall_status
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Validation Sections */}
                  {renderFormatValidation()}
                  {renderIDMatchingValidation()}
                  {renderTemplateCoverage()}
                  {renderRecommendations()}
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      No validation results available. Please upload a file
                      first.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAttendanceUploadComponent;
