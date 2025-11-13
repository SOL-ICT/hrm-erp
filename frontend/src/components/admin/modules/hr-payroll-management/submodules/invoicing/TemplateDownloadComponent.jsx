import React, { useState, useEffect } from "react";
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
} from "@/components/ui";
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
  Building2,
} from "lucide-react";
import { apiService } from "../../services/apiService";
import employeeRecordAPI from "../../services/modules/hr-payroll-management/employeeRecordAPI";

const TemplateDownloadComponent = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(null);

  // Load clients on component mount
  useEffect(() => {
    console.log("TemplateDownloadComponent mounted - loading clients...");
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      console.log("Loading clients...");
      const response = await employeeRecordAPI.getClients();

      console.log("Clients response:", response);
      if (response.success) {
        setClients(response.data);
        console.log("Clients loaded:", response.data.length, "clients");
      } else {
        console.error("Failed to load clients:", response.message);
        setClients([]);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAttendanceTemplate = async () => {
    if (!selectedClient) {
      alert("Please select a client first");
      return;
    }

    try {
      setLoading(true);

      // Call the attendance export API
      const response = await apiService.post(
        "/attendance-export/export-template",
        { client_id: selectedClient.id },
        { responseType: "blob" }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `attendance_template_${selectedClient.organisation_name}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export attendance template. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  console.log(
    "TemplateDownloadComponent render - clients:",
    clients.length,
    "loading:",
    loading,
    "selectedClient:",
    selectedClient
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Download Attendance Template
            <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
              NEW CLIENT-BASED SYSTEM
            </span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Select a client to download their attendance template with
            pre-filled employee data
          </p>
        </CardHeader>
      </Card>

      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Select Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Client
              </label>
              <select
                value={selectedClient?.id || ""}
                onChange={(e) => {
                  const clientId = e.target.value;
                  const client = clients.find((c) => c.id == clientId);
                  setSelectedClient(client || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.organisation_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Selected Client: {selectedClient.organisation_name}
                </h4>
                <p className="text-sm text-blue-700">
                  The template will include all active employees under this
                  client with the following columns:
                </p>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                  <li>Employee Code (pre-filled)</li>
                  <li>Employee Name (pre-filled)</li>
                  <li>Pay Grade Structure ID (pre-filled)</li>
                  <li>Days Worked (empty - to be filled by you)</li>
                </ul>
              </div>
            )}

            <Button
              onClick={handleExportAttendanceTemplate}
              disabled={!selectedClient || loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              <Download className="h-4 w-4" />
              {loading
                ? "Generating Template..."
                : "Download Attendance Template"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2" />
            How to Use the Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Download</h4>
                  <p className="text-sm text-gray-600">
                    Download the Excel template for your selected client
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">
                    2
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Fill Days</h4>
                  <p className="text-sm text-gray-600">
                    Only fill the "Days Worked" column (highlighted in blue)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-orange-600">
                    3
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Upload</h4>
                  <p className="text-sm text-gray-600">
                    Upload the completed file through the attendance upload
                    section
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-purple-600">
                    4
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Generate</h4>
                  <p className="text-sm text-gray-600">
                    System will automatically generate invoices based on
                    templates
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Do not modify the Employee Code,
                Employee Name, or Pay Grade Structure ID columns. Only fill in
                the "Days Worked" column with the actual number of days each
                employee worked (0-31).
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateDownloadComponent;
