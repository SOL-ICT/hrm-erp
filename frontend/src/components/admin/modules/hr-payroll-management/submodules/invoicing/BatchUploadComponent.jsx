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
  Progress,
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
} from "@/components/ui";
import {
  Upload,
  FileSpreadsheet,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Download,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Clock,
  TrendingUp,
} from "lucide-react";

const BatchUploadComponent = () => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(-1);

  // Mock data for demonstration
  const [completedUploads] = useState([
    {
      id: 1,
      fileName: "september_attendance_lagos.xlsx",
      client: "TechCorp Lagos",
      status: "completed",
      recordsProcessed: 45,
      errors: 0,
      warnings: 2,
      uploadedAt: "2025-09-28 14:30:00",
      processedAt: "2025-09-28 14:32:15",
    },
    {
      id: 2,
      fileName: "september_attendance_abuja.xlsx",
      client: "FinanceHub Abuja",
      status: "completed",
      recordsProcessed: 32,
      errors: 1,
      warnings: 0,
      uploadedAt: "2025-09-28 13:15:00",
      processedAt: "2025-09-28 13:16:45",
    },
    {
      id: 3,
      fileName: "september_attendance_ph.xlsx",
      client: "OilCorp Port Harcourt",
      status: "failed",
      recordsProcessed: 0,
      errors: 5,
      warnings: 0,
      uploadedAt: "2025-09-28 12:00:00",
      processedAt: "2025-09-28 12:01:30",
      errorMessage: "Invalid date format in multiple rows",
    },
  ]);

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files);
    const newUploads = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      fileName: file.name,
      fileSize: file.size,
      status: "queued",
      progress: 0,
      client: "Auto-detected from file", // Would be detected from file content
      recordsFound: Math.floor(Math.random() * 100) + 10, // Mock detection
      errors: [],
      warnings: [],
    }));

    setUploadQueue((prev) => [...prev, ...newUploads]);
  };

  const startBatchProcessing = async () => {
    setIsProcessing(true);

    for (let i = 0; i < uploadQueue.length; i++) {
      if (uploadQueue[i].status !== "queued") continue;

      setProcessingIndex(i);

      // Update status to processing
      setUploadQueue((prev) =>
        prev.map((item, index) =>
          index === i ? { ...item, status: "processing", progress: 0 } : item
        )
      );

      // Simulate file processing with progress updates
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUploadQueue((prev) =>
          prev.map((item, index) =>
            index === i ? { ...item, progress } : item
          )
        );
      }

      // Mark as completed
      setUploadQueue((prev) =>
        prev.map((item, index) =>
          index === i
            ? {
                ...item,
                status: Math.random() > 0.2 ? "completed" : "failed",
                progress: 100,
                recordsProcessed: Math.floor(Math.random() * 50) + 10,
                errors: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
                warnings: Math.floor(Math.random() * 5),
              }
            : item
        )
      );
    }

    setIsProcessing(false);
    setProcessingIndex(-1);
  };

  const removeFromQueue = (id) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const retryFailedUpload = (id) => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "queued", progress: 0, errors: [], warnings: [] }
          : item
      )
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "queued":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      queued: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Batch File Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Upload multiple attendance files simultaneously for efficient
              processing. Files will be processed in sequence with real-time
              progress tracking.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Drop multiple files here or click to browse
            </h3>
            <p className="text-gray-600 mb-4">
              Supports Excel (.xlsx, .xls) and CSV files
            </p>
            <input
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={handleFilesSelected}
              className="hidden"
              id="batch-file-input"
            />
            <label
              htmlFor="batch-file-input"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Select Files
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upload Queue ({uploadQueue.length} files)</CardTitle>
              <div className="space-x-2">
                <Button
                  onClick={startBatchProcessing}
                  disabled={
                    isProcessing ||
                    uploadQueue.every((item) => item.status !== "queued")
                  }
                >
                  {isProcessing ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Processing
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setUploadQueue([])}
                  disabled={isProcessing}
                >
                  Clear Queue
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadQueue.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <h4 className="font-medium">{item.fileName}</h4>
                        <p className="text-sm text-gray-600">
                          {(item.fileSize / 1024 / 1024).toFixed(2)} MB •{" "}
                          {item.recordsFound} records detected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(item.status)}
                      {item.status === "failed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryFailedUpload(item.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      {(item.status === "queued" ||
                        item.status === "failed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromQueue(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {item.status === "processing" && (
                    <div className="space-y-2">
                      <Progress value={item.progress} className="w-full" />
                      <p className="text-sm text-gray-600">
                        Processing... {item.progress}%
                      </p>
                    </div>
                  )}

                  {item.status === "completed" && (
                    <div className="bg-green-50 p-3 rounded-lg text-sm">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="font-medium text-green-800">
                            Records Processed:
                          </span>
                          <span className="ml-2 text-green-700">
                            {item.recordsProcessed}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">
                            Warnings:
                          </span>
                          <span className="ml-2 text-yellow-600">
                            {item.warnings}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">
                            Errors:
                          </span>
                          <span className="ml-2 text-red-600">
                            {item.errors}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {item.status === "failed" && (
                    <div className="bg-red-50 p-3 rounded-lg text-sm">
                      <div className="text-red-800 font-medium mb-1">
                        Processing Failed
                      </div>
                      <div className="text-red-700">
                        Error: Invalid file format or corrupted data
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Summary */}
      {uploadQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">
                  {
                    uploadQueue.filter((item) => item.status === "queued")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600">Queued</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {
                    uploadQueue.filter((item) => item.status === "processing")
                      .length
                  }
                </div>
                <div className="text-sm text-blue-600">Processing</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {
                    uploadQueue.filter((item) => item.status === "completed")
                      .length
                  }
                </div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {
                    uploadQueue.filter((item) => item.status === "failed")
                      .length
                  }
                </div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Uploads History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Processed At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedUploads.map((upload) => (
                <TableRow key={upload.id}>
                  <TableCell className="font-medium">
                    {upload.fileName}
                  </TableCell>
                  <TableCell>{upload.client}</TableCell>
                  <TableCell>{getStatusBadge(upload.status)}</TableCell>
                  <TableCell>{upload.recordsProcessed}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {upload.errors > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {upload.errors} errors
                        </Badge>
                      )}
                      {upload.warnings > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          {upload.warnings} warnings
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(upload.processedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Download Report"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchUploadComponent;
