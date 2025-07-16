"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { serviceRequestAPI } from "../../../../../../services/api";

const ServiceRequestForm = ({
  isOpen,
  onClose,
  editingService = null,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    service_code: "",
    service_name: "",
    description: "",
    category: "",
  });

  const [loading, setLoading] = useState(false);

  // Add the resetForm function here
  const resetForm = () => {
    setFormData({
      service_code: "",
      service_name: "",
      description: "",
      category: "",
      is_active: true,
    });
  };

  // Pre-fill form when editing
  useEffect(() => {
    if (editingService) {
      setFormData({
        service_code: editingService.service_code || "",
        service_name: editingService.service_name || "",
        description: editingService.description || "",
        category: editingService.category || "",
        is_active: editingService.is_active === 1,
      });
    }
  }, [editingService]);

  useEffect(() => {
    if (isOpen && !editingService) {
      resetForm();
    }
  }, [isOpen, editingService]);

  const [existingServices, setExistingServices] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadExistingServices();
    }
  }, [isOpen]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const dataToSubmit = {
        service_code: formData.service_code,
        service_name: formData.service_name,
        description: formData.description,
        category: formData.category,
        is_active: formData.is_active ? 1 : 0,
      };

      let response;
      if (editingService) {
        response = await serviceRequestAPI.update(
          editingService.id,
          dataToSubmit
        );
      } else {
        response = await serviceRequestAPI.create(dataToSubmit);
      }

      if (response.success) {
        alert(
          editingService
            ? "Service updated successfully!"
            : "Service created successfully!"
        );
        onSave(response.data);
        onClose();
        resetForm();
      } else {
        alert(response.message || "Error saving service");
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Error saving service. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="service_name"
              value={formData.service_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Account Officer, Administrative Officer"
              required
            />
          </div>

          {/* Service Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="service_code"
              value={formData.service_code}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. ACC001, ADM001"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              <option value="Finance">Finance</option>
              <option value="Administration">Administration</option>
              <option value="Security">Security</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Technology">Technology</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Operations">Operations</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Detailed description of the service request..."
            />
          </div>
        </form>

        {/* Record List Section */}
        <div className="bg-black text-white py-2 px-6">
          <h3 className="text-center font-bold">EXISTING SERVICE TYPES</h3>
        </div>

        {/* Real Services Table */}
        <div className="max-h-48 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Code
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Service Name
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Category
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {existingServices.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No existing services found
                  </td>
                </tr>
              ) : (
                existingServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 font-medium">
                      {service.service_code}
                    </td>
                    <td className="px-4 py-2 text-gray-900">
                      {service.service_name}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {service.category || "Uncategorized"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
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
        <div className="px-6 py-2 bg-gray-50 text-xs text-gray-600">
          <p>
            💡 Tip: Ensure your service code is unique. Common format: XXX001
            (e.g., ACC001, SEC001)
          </p>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestForm;
