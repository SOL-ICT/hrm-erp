"use client";

import { useState, useEffect } from "react";
import { X, Save, MapPin, Building2, Download, Upload } from "lucide-react";
import {
  solOfficeAPI,
  serviceLocationAPI,
  clientAPI,
} from "../../../../../../services/api";

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
    sol_office_id: "",
    is_active: true,
  });

  const [clients, setClients] = useState([]);
  const [solOffices, setSolOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [autoSuggestedOffice, setAutoSuggestedOffice] = useState(null);

  // Bulk upload states
  const [activeMode, setActiveMode] = useState("single");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedSOLOffice, setSelectedSOLOffice] = useState("");

  // Load clients and SOL offices on mount
  useEffect(() => {
    loadClients();
    loadSolOffices();
  }, []);

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
        sol_office_id: editingLocation.sol_office_id || "",
        is_active:
          editingLocation.is_active !== undefined
            ? editingLocation.is_active
            : true,
      });
    }
  }, [editingLocation]);

  // Auto-suggest SOL office based on city
  useEffect(() => {
    if (formData.city && formData.city.trim().length > 2) {
      autoSuggestSOLOffice();
    }
  }, [formData.city]);

  const loadClients = async () => {
    try {
      const response = await clientAPI.getActive();
      if (response) {
        // Check if it's paginated response
        if (response.data && Array.isArray(response.data)) {
          setClients(response.data);
        } else if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          setClients(response.data.data); // For paginated responses
        } else if (Array.isArray(response)) {
          setClients(response); // Direct array response
        } else {
          console.log("Unexpected response structure:", response);
          setClients([]);
        }
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]);
      // Don't show alert for initial load failures
    }
  };

  const loadSolOffices = async () => {
    try {
      const response = await solOfficeAPI.getActiveOffices();
      if (response && response.data) {
        setSolOffices(Array.isArray(response.data) ? response.data : []);
      } else {
        setSolOffices([]);
      }
    } catch (error) {
      console.error("Error loading SOL offices:", error);
      setSolOffices([]);
      // Don't show alert for initial load failures
    }
  };

  const autoSuggestSOLOffice = async () => {
    try {
      // Simple logic to match city with SOL office
      const cityLower = formData.city.toLowerCase();

      // Find office that controls this city/area
      const matchingOffice = solOffices.find((office) => {
        // Check if city matches office location
        if (office.office_name.toLowerCase().includes(cityLower)) {
          return true;
        }

        // Check controlled areas if available
        if (office.controlled_areas && Array.isArray(office.controlled_areas)) {
          return office.controlled_areas.some((area) =>
            area.toLowerCase().includes(cityLower)
          );
        }

        return false;
      });

      if (matchingOffice && !formData.sol_office_id) {
        setFormData((prev) => ({ ...prev, sol_office_id: matchingOffice.id }));
        setAutoSuggestedOffice(matchingOffice);
      }
    } catch (error) {
      console.error("Error auto-suggesting SOL office:", error);
    }
  };

  const generateLocationCode = async () => {
    if (!formData.client_id || !formData.city) {
      alert("Please select a client and enter city first");
      return;
    }

    try {
      const client = clients.find((c) => c.id === parseInt(formData.client_id));
      if (!client) return;

      // Generate code format: CLIENT_CODE-CITY-XXX
      const cityCode = formData.city.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-3);
      const locationCode = `${client.client_code}-${cityCode}-${timestamp}`;

      setFormData((prev) => ({ ...prev, location_code: locationCode }));
    } catch (error) {
      console.error("Error generating location code:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

      // Generate location code if not set
      if (!formData.location_code) {
        await generateLocationCode();
      }

      const dataToSubmit = {
        ...formData,
        sol_office_id: formData.sol_office_id || null,
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
        alert(
          editingLocation
            ? "Location updated successfully!"
            : "Location created successfully!"
        );
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
    if (!uploadFile || !selectedClient || !selectedSOLOffice) {
      alert("Please select a file, client, and SOL office for bulk upload");
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

      const response = await serviceLocationAPI.bulkImport(
        selectedClient,
        selectedSOLOffice,
        uploadFile
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setUploadResults({
          success: true,
          totalProcessed: response.data.total_processed || 0,
          successCount: response.data.success_count || 0,
          errorCount: response.data.error_count || 0,
          errors: response.data.errors || [],
        });

        alert(
          `Bulk upload completed! ${response.data.success_count} locations imported successfully.`
        );

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
      sol_office_id: "",
      is_active: true,
    });
    setAutoSuggestedOffice(null);
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="client_id"
                      value={formData.client_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Client</option>
                      {clients &&
                        Array.isArray(clients) &&
                        clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name} ({client.client_code})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="location_code"
                        value={formData.location_code}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Auto-generated or enter manually"
                      />
                      <button
                        type="button"
                        onClick={generateLocationCode}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Location Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location_name"
                      value={formData.location_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Victoria Island Branch"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unique ID
                    </label>
                    <input
                      type="text"
                      name="unique_id"
                      value={formData.unique_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Client's internal ID"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., VI Branch"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Victoria Island"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address and SOL Office */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address
                  </label>
                  <textarea
                    name="full_address"
                    value={formData.full_address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Complete address of the location"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SOL Office Assignment
                    </label>
                    <select
                      name="sol_office_id"
                      value={formData.sol_office_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select SOL Office</option>
                      {solOffices &&
                        Array.isArray(solOffices) &&
                        solOffices.map((office) => (
                          <option key={office.id} value={office.id}>
                            {office.office_name} ({office.state_name})
                          </option>
                        ))}
                    </select>
                    {autoSuggestedOffice && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Auto-suggested based on city:{" "}
                        {autoSuggestedOffice.office_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Active Location
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      name="contact_person_name"
                      value={formData.contact_person_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Full name"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phone number"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
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
                  Bulk Upload Instructions
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • Download the CSV template and fill in location details
                  </li>
                  <li>• Select the client and SOL office for all locations</li>
                  <li>• Upload the completed CSV file</li>
                  <li>• The system will automatically assign location codes</li>
                </ul>
              </div>

              {/* Client and SOL Office Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Client</option>
                    {clients &&
                      Array.isArray(clients) &&
                      clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.client_code})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SOL Office <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSOLOffice}
                    onChange={(e) => setSelectedSOLOffice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select SOL Office</option>
                    {solOffices &&
                      Array.isArray(solOffices) &&
                      solOffices.map((office) => (
                        <option key={office.id} value={office.id}>
                          {office.office_name} ({office.state_name})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Template Download */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Download className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  Download the CSV template to get started
                </p>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="hidden"
                  id="bulk-upload"
                />
                <label
                  htmlFor="bulk-upload"
                  className="cursor-pointer text-center block"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    {uploadFile ? uploadFile.name : "Click to upload CSV file"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum file size: 5MB
                  </p>
                </label>
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Results */}
              {uploadResults && (
                <div
                  className={`border rounded-lg p-4 ${
                    uploadResults.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <h4 className="font-semibold mb-2">Upload Results</h4>
                  <div className="text-sm space-y-1">
                    <p>Total Processed: {uploadResults.totalProcessed}</p>
                    <p>Successful: {uploadResults.successCount}</p>
                    <p>Errors: {uploadResults.errorCount}</p>
                  </div>
                  {uploadResults.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Errors:</p>
                      <ul className="text-xs space-y-1">
                        {uploadResults.errors
                          .slice(0, 5)
                          .map((error, index) => (
                            <li key={index} className="text-red-600">
                              Row {error.row}: {error.message}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={
                    !uploadFile ||
                    !selectedClient ||
                    !selectedSOLOffice ||
                    formLoading
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Locations</span>
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
