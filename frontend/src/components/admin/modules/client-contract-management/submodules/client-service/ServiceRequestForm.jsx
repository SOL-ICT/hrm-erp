"use client";

import { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Edit3 } from "lucide-react";
import { serviceRequestAPI, clientAPI } from "../../../../../../services/api";

const ServiceRequestForm = ({
  isOpen,
  onClose,
  editingService = null,
  onSave,
}) => {
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client_id: "",
    service_types: [
      {
        id: Date.now(),
        service_type: "",
        service_name: "",
        description: "",
        service_code: "",
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [existingServices, setExistingServices] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  // Load clients and existing services
  useEffect(() => {
    if (isOpen) {
      loadClients();
      loadExistingServices();
    }
  }, [isOpen]);

  const loadClients = async () => {
    try {
      const response = await clientAPI.getAll({ per_page: 1000 });
      if (response.success) {
        let clientsData = [];
        if (response.data.data && Array.isArray(response.data.data)) {
          clientsData = response.data.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          clientsData = response.data.items;
        } else if (Array.isArray(response.data)) {
          clientsData = response.data;
        }
        setClients(clientsData);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadExistingServices = async () => {
    try {
      const response = await serviceRequestAPI.getAll();
      if (response.success) {
        setExistingServices(response.data || []);
      }
    } catch (error) {
      console.error("Error loading existing services:", error);
    }
  };

  // Generate service code from service type and service name
  const generateServiceCode = (serviceType, serviceName, clientCode = "") => {
    if (!serviceType || !serviceName) return "";

    // Get first 3 letters of each word, remove spaces
    const typeCode = serviceType
      .replace(/\s+/g, "")
      .substring(0, 3)
      .toUpperCase();
    const nameCode = serviceName
      .replace(/\s+/g, "")
      .substring(0, 3)
      .toUpperCase();
    const clientPrefix = clientCode ? clientCode.substring(0, 3) : "SOL";

    return `${clientPrefix}-${typeCode}-${nameCode}`;
  };

  // Handle service type changes
  const handleServiceTypeChange = (index, field, value) => {
    const updatedServiceTypes = [...formData.service_types];
    updatedServiceTypes[index][field] = value;

    // Auto-generate service code if service_type and service_name are filled
    if (field === "service_type" || field === "service_name") {
      const selectedClient = clients.find((c) => c.id == formData.client_id);
      const clientCode = selectedClient?.client_code || "";
      updatedServiceTypes[index].service_code = generateServiceCode(
        updatedServiceTypes[index].service_type,
        updatedServiceTypes[index].service_name,
        clientCode
      );
    }

    setFormData((prev) => ({
      ...prev,
      service_types: updatedServiceTypes,
    }));
  };

  // Add new service type
  const addServiceType = () => {
    setFormData((prev) => ({
      ...prev,
      service_types: [
        ...prev.service_types,
        {
          id: Date.now(),
          service_type: "",
          service_name: "",
          description: "",
          service_code: "",
        },
      ],
    }));
  };

  // Remove service type
  const removeServiceType = (index) => {
    if (formData.service_types.length > 1) {
      setFormData((prev) => ({
        ...prev,
        service_types: prev.service_types.filter((_, i) => i !== index),
      }));
    }
  };

  // Handle client change - regenerate all service codes
  const handleClientChange = (clientId) => {
    const selectedClient = clients.find((c) => c.id == clientId);
    const clientCode = selectedClient?.client_code || "";

    const updatedServiceTypes = formData.service_types.map((serviceType) => ({
      ...serviceType,
      service_code: generateServiceCode(
        serviceType.service_type,
        serviceType.service_name,
        clientCode
      ),
    }));

    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      service_types: updatedServiceTypes,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      client_id: "",
      service_types: [
        {
          id: Date.now(),
          service_type: "",
          service_name: "",
          description: "",
          service_code: "",
        },
      ],
    });
    setEditingIndex(null);
  };

  // Pre-fill form when editing
  useEffect(() => {
    if (editingService) {
      setFormData({
        client_id: editingService.client_id || "",
        service_types: [
          {
            id: editingService.id || Date.now(),
            service_type: editingService.service_type || "",
            service_name: editingService.service_name || "",
            description: editingService.description || "",
            service_code: editingService.service_code || "",
          },
        ],
      });
    } else if (isOpen) {
      resetForm();
    }
  }, [editingService, isOpen]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.client_id) {
        alert("Please select a client");
        setLoading(false);
        return;
      }

      const validServiceTypes = formData.service_types.filter(
        (st) => st.service_type.trim() && st.service_name.trim()
      );

      if (validServiceTypes.length === 0) {
        alert("Please add at least one valid service type");
        setLoading(false);
        return;
      }

      // Save each service type
      const savePromises = validServiceTypes.map(async (serviceType) => {
        const dataToSubmit = {
          client_id: formData.client_id,
          service_type: serviceType.service_type,
          service_name: serviceType.service_name,
          service_code: serviceType.service_code,
          description: serviceType.description,
          is_active: 1,
        };

        if (editingService && serviceType.id === editingService.id) {
          return serviceRequestAPI.update(editingService.id, dataToSubmit);
        } else {
          return serviceRequestAPI.create(dataToSubmit);
        }
      });

      const responses = await Promise.all(savePromises);
      const allSuccessful = responses.every((response) => response.success);

      if (allSuccessful) {
        alert(
          editingService
            ? "Service updated successfully!"
            : `${validServiceTypes.length} service(s) created successfully!`
        );
        onSave();
        onClose();
        resetForm();
      } else {
        alert("Some services failed to save. Please try again.");
      }
    } catch (error) {
      console.error("Error saving services:", error);
      alert("Error saving services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter existing services by selected client
  const filteredExistingServices = existingServices.filter(
    (service) => !formData.client_id || service.client_id == formData.client_id
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              SERVICE REQUEST MASTER - {editingService ? "EDIT" : "ADD"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.client_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Service Types Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Service Types
                </h3>
                <button
                  type="button"
                  onClick={addServiceType}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center space-x-2 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Service Type</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.service_types.map((serviceType, index) => (
                  <div
                    key={serviceType.id}
                    className="border border-gray-200 rounded-lg p-4 relative"
                  >
                    {formData.service_types.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServiceType(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800 transition-colors"
                        title="Remove this service type"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Service Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={serviceType.service_type}
                          onChange={(e) =>
                            handleServiceTypeChange(
                              index,
                              "service_type",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g. Access Hydrogen, FBN Core Banking"
                          required
                        />
                      </div>

                      {/* Service Name (renamed from Category) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={serviceType.service_name}
                          onChange={(e) =>
                            handleServiceTypeChange(
                              index,
                              "service_name",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g. Financial Services, Customer Support"
                          required
                        />
                      </div>

                      {/* Auto-generated Service Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Code (Auto-generated)
                        </label>
                        <input
                          type="text"
                          value={serviceType.service_code}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                          placeholder="Will be auto-generated"
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={serviceType.description}
                        onChange={(e) =>
                          handleServiceTypeChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Detailed description of this service type..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Existing Services Table */}
          {formData.client_id && (
            <div className="mt-6">
              <div className="bg-gray-800 text-white py-2 px-4 rounded-t-lg">
                <h3 className="font-bold">
                  EXISTING SERVICES FOR SELECTED CLIENT
                </h3>
              </div>

              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-b-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Service Code
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Service Type
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Service Name
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredExistingServices.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          No services found for this client
                        </td>
                      </tr>
                    ) : (
                      filteredExistingServices.map((service, index) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900 font-mono text-xs">
                            {service.service_code}
                          </td>
                          <td className="px-4 py-2 text-gray-900">
                            {service.service_type}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {service.service_name}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                service.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {service.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <Save className="w-4 h-4" />
            <span>
              {loading
                ? "Saving..."
                : editingService
                ? "Update Service"
                : "Save Services"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestForm;
