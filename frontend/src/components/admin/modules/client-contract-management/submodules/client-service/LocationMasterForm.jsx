import { useState, useEffect } from "react";
import {
  X,
  Save,
  MapPin,
  Building2,
  Download,
  Upload,
  Info,
} from "lucide-react";
import { serviceLocationAPI, clientAPI } from "../../../../../../services/api";

const LocationMasterForm = ({
  isOpen,
  onClose,
  editingLocation = null,
  onSave,
  showBulkUpload = false,
}) => {
  const [formData, setFormData] = useState({
    location_code: "",
    location_name: "",
    unique_id: "",
    short_name: "",
    city: "",
    full_address: "",
    contact_person_name: "",
    contact_person_phone: "",
    contact_person_email: "",
    client_id: "",
    is_active: true,
  });

  // ✅ FIX: Ensure clients is always an array
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [autoAssignmentInfo, setAutoAssignmentInfo] = useState(null);

  // Bulk upload states
  const [activeMode, setActiveMode] = useState("single");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");

  // ✅ FIX: Load clients on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingLocation) {
      setFormData({
        location_code: editingLocation.location_code || "",
        location_name: editingLocation.location_name || "",
        unique_id: editingLocation.unique_id || "",
        short_name: editingLocation.short_name || "",
        city: editingLocation.city || "",
        full_address:
          editingLocation.full_address || editingLocation.address || "",
        contact_person_name: editingLocation.contact_person_name || "",
        contact_person_phone: editingLocation.contact_person_phone || "",
        contact_person_email: editingLocation.contact_person_email || "",
        client_id: editingLocation.client_id || "",
        is_active:
          editingLocation.is_active !== undefined
            ? editingLocation.is_active
            : true,
      });
    } else {
      resetForm();
    }
  }, [editingLocation, isOpen]);

  // ✅ FIX: Add loading state and error handling
  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientAPI.getActive();
      console.log("Loaded clients:", response);

      // ✅ Handle paginated response structure
      let clientsData = [];

      if (response && response.data) {
        if (Array.isArray(response.data)) {
          clientsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Handle paginated response: response.data.data
          clientsData = response.data.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          // Handle Laravel paginated response: response.data.items
          clientsData = response.data.items;
        }
      }

      setClients(clientsData);
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Test auto-assignment when city changes
  const testAutoAssignment = async (city) => {
    if (!city || city.length < 3) {
      setAutoAssignmentInfo(null);
      return;
    }

    try {
      const response = await serviceLocationAPI.testAutoAssignment({ city });
      if (response.success) {
        setAutoAssignmentInfo(response.data);
      }
    } catch (error) {
      console.error("Error testing auto-assignment:", error);
      setAutoAssignmentInfo(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // ✅ NEW: Test auto-assignment when city changes
    if (name === "city" && value.length >= 3) {
      testAutoAssignment(value);
    } else if (name === "city" && value.length < 3) {
      setAutoAssignmentInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validate required fields
      if (!formData.location_name || !formData.client_id || !formData.city) {
        alert("Please fill in all required fields");
        return;
      }

      const dataToSubmit = {
        ...formData,
        // Note: SOL office will be auto-assigned based on city
      };

      let response;
      if (editingLocation) {
        response = await serviceLocationAPI.update(
          editingLocation.id,
          dataToSubmit
        );
      } else {
        response = await serviceLocationAPI.create(dataToSubmit);
      }

      if (response.success) {
        const assignment = response.data?.auto_assignment;
        let message = editingLocation
          ? "Location updated successfully!"
          : "Location created successfully!";

        if (assignment?.office) {
          message += `\n\nAuto-assigned to: ${assignment.office.office_name}`;
          message += `\nAssignment type: ${assignment.assignment_type.toUpperCase()}`;
        } else if (assignment) {
          message += `\n\nNote: ${assignment.assignment_reason}`;
        }

        alert(message);
        onSave(response.data);
        onClose();
        resetForm();
      } else {
        alert(response.message || "Error saving location");
      }
    } catch (error) {
      console.error("Error saving location:", error);
      alert("Error saving location. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile || !selectedClient) {
      alert("Please select a file and client for bulk upload");
      return;
    }

    setFormLoading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // ✅ UPDATED: No need to pass SOL office - auto-assigned
      const response = await serviceLocationAPI.bulkImport(
        selectedClient,
        uploadFile
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        const assignmentSummary = response.data.assignment_summary || {};

        setUploadResults({
          success: true,
          totalProcessed: response.data.total_processed || 0,
          successCount: response.data.success_count || 0,
          errorCount: response.data.error_count || 0,
          errors: response.data.errors || [],
          assignmentSummary,
        });

        let message = `Bulk upload completed!\n${response.data.success_count} locations imported successfully.`;

        // Show assignment summary
        if (assignmentSummary.lga_assignments > 0) {
          message += `\n\n📍 LGA-level assignments: ${assignmentSummary.lga_assignments}`;
        }
        if (assignmentSummary.state_assignments > 0) {
          message += `\n🏢 State-level assignments: ${assignmentSummary.state_assignments}`;
        }
        if (assignmentSummary.no_assignments > 0) {
          message += `\n⚠️ No SOL office found: ${assignmentSummary.no_assignments}`;
        }

        alert(message);

        // Reset after successful upload
        setTimeout(() => {
          setUploadFile(null);
          setUploadProgress(0);
          setUploadResults(null);
          onSave();
          onClose();
        }, 2000);
      } else {
        alert(response.message || "Error uploading file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please check the format and try again.");
    } finally {
      setFormLoading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        unique_id: "LOC001",
        location_name: "Victoria Island Branch",
        short_name: "VI Branch",
        city: "Victoria Island",
        full_address: "123 Ahmadu Bello Way, Victoria Island, Lagos",
        contact_person_name: "John Doe",
        contact_person_phone: "08012345678",
        contact_person_email: "john.doe@example.com",
      },
      {
        unique_id: "LOC002",
        location_name: "Ikeja Main Office",
        short_name: "Ikeja Office",
        city: "Ikeja",
        full_address: "45 Allen Avenue, Ikeja, Lagos",
        contact_person_name: "Jane Smith",
        contact_person_phone: "08087654321",
        contact_person_email: "jane.smith@example.com",
      },
      {
        unique_id: "LOC003",
        location_name: "Port Harcourt Branch",
        short_name: "PH Branch",
        city: "Port Harcourt",
        full_address: "15 Aba Road, Port Harcourt, Rivers State",
        contact_person_name: "Mike Johnson",
        contact_person_phone: "08011223344",
        contact_person_email: "mike.johnson@example.com",
      },
    ];

    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(","),
      ...templateData.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "service_locations_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      location_code: "",
      location_name: "",
      unique_id: "",
      short_name: "",
      city: "",
      full_address: "",
      contact_person_name: "",
      contact_person_phone: "",
      contact_person_email: "",
      client_id: "",
      is_active: true,
    });
    setAutoAssignmentInfo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              SERVICE LOCATION MASTER -{" "}
              {editingLocation
                ? "EDIT"
                : activeMode === "bulk"
                ? "BULK UPLOAD"
                : "ADD"}
            </h2>
            <div className="flex items-center space-x-2">
              {!editingLocation && (
                <div className="flex bg-white/20 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setActiveMode("single")}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      activeMode === "single"
                        ? "bg-white text-blue-600"
                        : "text-white"
                    }`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode("bulk")}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      activeMode === "bulk"
                        ? "bg-white text-blue-600"
                        : "text-white"
                    }`}
                  >
                    Bulk Upload
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {activeMode === "single" ? (
            /* Single Location Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Auto-Assignment Info */}
              {autoAssignmentInfo && (
                <div
                  className={`p-4 rounded-lg border-l-4 ${
                    autoAssignmentInfo.office
                      ? "bg-green-50 border-green-400"
                      : "bg-yellow-50 border-yellow-400"
                  }`}
                >
                  <div className="flex">
                    <Info
                      className={`w-5 h-5 ${
                        autoAssignmentInfo.office
                          ? "text-green-400"
                          : "text-yellow-400"
                      } mr-3 mt-0.5`}
                    />
                    <div>
                      <h3
                        className={`text-sm font-medium ${
                          autoAssignmentInfo.office
                            ? "text-green-800"
                            : "text-yellow-800"
                        }`}
                      >
                        SOL Office Auto-Assignment
                      </h3>
                      <p
                        className={`text-sm ${
                          autoAssignmentInfo.office
                            ? "text-green-700"
                            : "text-yellow-700"
                        }`}
                      >
                        {autoAssignmentInfo.assignment_reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Client Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  {/* ✅ FIX: Add loading state and ensure clients is array */}
                  {loading ? (
                    <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                      Loading clients...
                    </div>
                  ) : (
                    <select
                      name="client_id"
                      value={formData.client_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Client</option>
                      {/* ✅ FIX: Ensure clients is array and add fallback */}
                      {Array.isArray(clients) && clients.length > 0 ? (
                        clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No clients available
                        </option>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location_name"
                    value={formData.location_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unique ID
                  </label>
                  <input
                    type="text"
                    name="unique_id"
                    value={formData.unique_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Name
                  </label>
                  <input
                    type="text"
                    name="short_name"
                    value={formData.short_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Ikeja, Abuja, Port Harcourt"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address
                </label>
                <textarea
                  name="full_address"
                  value={formData.full_address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter complete address"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contact_person_name"
                    value={formData.contact_person_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contact_person_phone"
                    value={formData.contact_person_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contact_person_email"
                    value={formData.contact_person_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active Location
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      <span>
                        {editingLocation ? "Update" : "Save"} Location
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Bulk Upload Mode */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  🚀 Smart Bulk Upload with Auto-Assignment
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • Download the CSV template and fill in location details
                  </li>
                  <li>• Select the client for all locations</li>
                  <li>
                    • 🎯{" "}
                    <strong>SOL offices will be automatically assigned</strong>{" "}
                    based on city
                  </li>
                  <li>• LGA-level assignments get priority over state-level</li>
                  <li>
                    • Upload the completed CSV file and review assignment
                    results
                  </li>
                </ul>
              </div>

              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client <span className="text-red-500">*</span>
                </label>
                {/* ✅ FIX: Add loading state and ensure clients is array */}
                {loading ? (
                  <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    Loading clients...
                  </div>
                ) : (
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Client</option>
                    {/* ✅ FIX: Ensure clients is array and add fallback */}
                    {Array.isArray(clients) && clients.length > 0 ? (
                      clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        {loading ? "Loading..." : "No clients available"}
                      </option>
                    )}
                  </select>
                )}
              </div>

              {/* Template Download */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">
                  Step 1: Download Template
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Download the CSV template and fill in your location data
                </p>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </button>
              </div>

              {/* File Upload */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">
                  Step 2: Upload CSV File
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Select your completed CSV file for bulk import
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ File selected: {uploadFile.name}
                  </p>
                )}
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Upload Progress
                    </span>
                    <span className="text-sm text-blue-700">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Results */}
              {uploadResults && (
                <div
                  className={`p-4 rounded-lg border ${
                    uploadResults.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <h4
                    className={`font-medium mb-2 ${
                      uploadResults.success ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {uploadResults.success
                      ? "✅ Upload Complete!"
                      : "❌ Upload Failed"}
                  </h4>

                  {uploadResults.success && (
                    <div className="text-sm text-green-800">
                      <p>
                        📊 <strong>Summary:</strong>{" "}
                        {uploadResults.successCount} of{" "}
                        {uploadResults.totalProcessed} locations imported
                        successfully
                      </p>

                      {uploadResults.assignmentSummary && (
                        <div className="mt-2 space-y-1">
                          {uploadResults.assignmentSummary.lga_assignments >
                            0 && (
                            <p>
                              📍 LGA-level assignments:{" "}
                              {uploadResults.assignmentSummary.lga_assignments}
                            </p>
                          )}
                          {uploadResults.assignmentSummary.state_assignments >
                            0 && (
                            <p>
                              🏢 State-level assignments:{" "}
                              {
                                uploadResults.assignmentSummary
                                  .state_assignments
                              }
                            </p>
                          )}
                          {uploadResults.assignmentSummary.no_assignments >
                            0 && (
                            <p>
                              ⚠️ No SOL office found:{" "}
                              {uploadResults.assignmentSummary.no_assignments}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {uploadResults.errors && uploadResults.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-red-700 font-medium">Errors:</p>
                      <ul className="text-sm text-red-600 mt-1">
                        {uploadResults.errors
                          .slice(0, 5)
                          .map((error, index) => (
                            <li key={index}>
                              Row {error.row}: {error.message}
                            </li>
                          ))}
                        {uploadResults.errors.length > 5 && (
                          <li>
                            ... and {uploadResults.errors.length - 5} more
                            errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Bulk Upload Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkUpload}
                  disabled={formLoading || !uploadFile || !selectedClient}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      <span>Upload & Auto-Assign</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationMasterForm;
