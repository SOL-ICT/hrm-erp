"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  FileText,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Settings,
  Building2,
  Users,
  Award,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import OfferLetterBuilder from "./OfferLetterBuilder";
import { salaryStructureAPI } from "../../../../../../services/modules/client-contract-management/salary-structure";
import { isExpectedNoDataError } from "../../../../../../services/modules/client-contract-management/salary-structure/apiErrorHandler";

const OfferLetterTemplateManager = ({
  currentTheme,
  selectedClient,
  selectedJobCategory,
  selectedPayGrade,
  onBack,
}) => {
  const [currentOfferLetter, setCurrentOfferLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPreview, setShowPreview] = useState(null);

  // Convert single currentOfferLetter to templates array format for UI compatibility
  const templates = currentOfferLetter ? [currentOfferLetter] : [];

  // Computed filtered templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !searchTerm ||
      template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || template.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Auto-load template when grade is selected (expected user flow)
  useEffect(() => {
    if (!selectedClient || !selectedJobCategory || !selectedPayGrade) {
      setCurrentOfferLetter(null);
      setLoading(false);
    } else {
      // Automatically check for existing template when grade is selected
      loadTemplateForGrade();
    }
  }, [selectedClient, selectedJobCategory, selectedPayGrade]);

  // Function to load template on demand
  const loadTemplateForGrade = async () => {
    if (!selectedClient || !selectedJobCategory || !selectedPayGrade) return;
    
    setLoading(true);
    try {
      const response = await salaryStructureAPI.offerLetters.getForGrade({
        client_id: selectedClient.id,
        job_structure_id: selectedJobCategory.id,
        pay_grade_structure_id: selectedPayGrade.id,
      });

      if (response.success) {
        setCurrentOfferLetter(response.data.template);
        console.log("✅ Template found:", response.message);
      } else {
        setCurrentOfferLetter(null);
        console.log("ℹ️ No template found:", response.message);
      }
    } catch (error) {
      console.error("Error loading template:", error);
      setCurrentOfferLetter(null);
    }
    setLoading(false);
  };

  // Create new template
  const handleCreateNew = () => {
    setEditingTemplate(null);
    setShowBuilderModal(true);
  };

  // Edit template
  const handleEdit = (template) => {
    console.log("🔧 Edit button clicked with template:", template);
    console.log("🔧 Template ID:", template?.id);
    setEditingTemplate(template);
    setShowBuilderModal(true);
  };

  // Copy template
  const handleCopy = (template) => {
    const newTemplate = {
      ...template,
      id: null,
      name: `${template.name} (Copy)`,
      status: "draft",
      created_date: new Date().toISOString().split("T")[0],
      last_modified: new Date().toISOString().split("T")[0],
    };
    setEditingTemplate(newTemplate);
    setShowBuilderModal(true);
  };

  // Save template (Single offer letter per grade)
  // Handle template save - receives the saved data from OfferLetterBuilder
  const handleSaveTemplate = (savedTemplateData) => {
    try {
      // OfferLetterBuilder has already made the API call and returns the saved data
      setCurrentOfferLetter(savedTemplateData);
      console.log("Template operation completed successfully");
      
      setShowBuilderModal(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error("Error processing template save:", error);
      alert("Failed to process template save. Please try again.");
    }
  };

  // Delete offer letter
  const handleDelete = async (templateId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this offer letter template? This action cannot be undone."
      )
    ) {
      try {
        await salaryStructureAPI.offerLetters.delete(templateId);
        setCurrentOfferLetter(null);
        console.log("Template deleted successfully");
      } catch (error) {
        console.error("Error deleting template:", error);
        alert("Failed to delete template. Please try again.");
      }
    }
  };

  // Close modal
  const closeModal = () => {
    setShowBuilderModal(false);
    setEditingTemplate(null);
  };

  // Export template
  const handleExport = (template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import template
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const templateData = JSON.parse(e.target.result);
          const importedTemplate = {
            ...templateData,
            id: Date.now(),
            name: `${selectedPayGrade?.pay_grade} Offer Letter (Imported)`,
            status: "draft",
            created_date: new Date().toISOString().split("T")[0],
            last_modified: new Date().toISOString().split("T")[0],
            client_id: selectedClient?.id,
            job_category_id: selectedJobCategory?.id,
            pay_grade_id: selectedPayGrade?.id,
          };
          // Replace current offer letter with imported one
          setCurrentOfferLetter(importedTemplate);
        } catch (error) {
          alert("Invalid template file format");
        }
      };
      reader.readAsText(file);
    }
    event.target.value = "";
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Offer Letter Templates</h1>
            <div className="flex items-center space-x-4 text-purple-100 text-sm">
              <div className="flex items-center space-x-1">
                <Building2 className="w-4 h-4" />
                <span>{selectedClient?.organisation_name}</span>
              </div>
              <span>→</span>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{selectedJobCategory?.job_title}</span>
              </div>
              <span>→</span>
              <div className="flex items-center space-x-1">
                <Award className="w-4 h-4" />
                <span>{selectedPayGrade?.pay_grade}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            ← Back to Job Function
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Template</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Total Templates
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {templates.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Active Templates
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {templates.filter((t) => t.status === "active").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">
                  Draft Templates
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {templates.filter((t) => t.status === "draft").length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  Grade-Specific
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {templates.filter((t) => t.pay_grade_id).length}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Templates List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Templates Found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== "all"
                ? "No templates match your current filters."
                : selectedClient && selectedJobCategory && selectedPayGrade
                ? loading 
                  ? "Checking for existing template..."
                  : "No offer letter template exists for this pay grade. You can create one now."
                : "Select a client, job category, and pay grade to manage offer letter templates."}
            </p>
            {selectedClient && selectedJobCategory && selectedPayGrade && !loading && (
              <div className="flex justify-center">
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create New Template
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all"
              >
                {/* Template Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          template.status === "active"
                            ? "bg-green-100 text-green-800"
                            : template.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.status.charAt(0).toUpperCase() +
                          template.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowPreview(template)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <div className="relative group">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                        <Settings className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => handleEdit(template)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleCopy(template)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={() => handleExport(template)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{template.job_category}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="w-4 h-4 mr-2" />
                    <span>{template.pay_grade}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Modified: {template.last_modified}</span>
                  </div>
                </div>

                {/* Template Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{template.sections_count} sections</span>
                  <span>{template.variables_count} variables</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-4">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors text-sm font-medium"
                  >
                    Edit Template
                  </button>
                  <button
                    onClick={() => setShowPreview(template)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">
                Template Preview: {showPreview.name}
              </h3>
              <button
                onClick={() => setShowPreview(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-gray-600">
                  Template preview would be rendered here
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Full preview functionality available in the builder
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Builder Modal */}
      {showBuilderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
              <h3 className="text-lg font-medium">
                {editingTemplate?.id ? "Edit Template" : "Create New Template"}
              </h3>
              <button
                onClick={() => {
                  setShowBuilderModal(false);
                  setEditingTemplate(null);
                }}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <OfferLetterBuilder
                currentTheme={currentTheme}
                selectedClient={selectedClient}
                selectedJobCategory={selectedJobCategory}
                selectedPayGrade={selectedPayGrade}
                editingTemplate={editingTemplate}
                onSave={handleSaveTemplate}
                onCancel={() => {
                  setShowBuilderModal(false);
                  setEditingTemplate(null);
                }}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferLetterTemplateManager;
