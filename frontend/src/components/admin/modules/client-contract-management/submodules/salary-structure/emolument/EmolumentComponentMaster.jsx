"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  MoreVertical,
  CheckSquare,
  Square,
  Settings,
  DollarSign,
  Tag,
  CreditCard,
  Building2,
  Eye,
  X,
} from "lucide-react";
import { apiService } from "../../../../../../../services/api";
import EmolumentComponentForm from "./EmolumentComponentForm";
import ExcelImportModal from "./ExcelImportModal";

const EmolumentComponentMaster = ({ onBack, onDataChange }) => {
  const [components, setComponents] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    benefit_status: 0,
    regular_status: 0,
    cash_items: 0,
    non_cash_items: 0,
    by_category: { basic: 0, allowance: 0, deduction: 0, benefit: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("display_order");
  const [sortDirection, setSortDirection] = useState("asc");

  // Modal states
  const [showComponentForm, setShowComponentForm] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [selectedComponents, setSelectedComponents] = useState(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadComponents();
  }, [
    searchTerm,
    statusFilter,
    typeFilter,
    classFilter,
    categoryFilter,
    activeStatusFilter,
    sortBy,
    sortDirection,
    currentPage,
    perPage,
  ]);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        status: statusFilter,
        type: typeFilter,
        class: classFilter,
        category: categoryFilter,
        active_status: activeStatusFilter,
        sort_by: sortBy,
        sort_direction: sortDirection,
        page: currentPage,
        per_page: perPage,
      };

      console.log('Loading components with params:', params);

      const data = await apiService.makeRequest("/salary-structure/emolument-components", {
        method: "GET",
        params: params,
      });

      console.log('Full API Response:', data);
      console.log('data.success:', data.success);
      console.log('data.data:', data.data);
      console.log('data.data.data:', data.data?.data);
      console.log('data.data.total:', data.data?.total);
      console.log('data.data.last_page:', data.data?.last_page);

      if (data.success) {
        setComponents(data.data.data || []);
        setTotalPages(data.data.last_page || 0);
      } else {
        console.error("Failed to load components:", data.message);
      }
    } catch (error) {
      console.error("Error loading components:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await apiService.makeRequest("/salary-structure/emolument-components/statistics", {
        method: "GET",
      });

      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadComponents(), loadStatistics()]);
    setRefreshing(false);
  };

  const handleAddComponent = () => {
    setEditingComponent(null);
    setShowComponentForm(true);
  };

  const handleEditComponent = (component) => {
    setEditingComponent(component);
    setShowComponentForm(true);
  };

  const handleDeleteComponent = async (componentId) => {
    if (!confirm("Are you sure you want to delete this component?")) {
      return;
    }

    try {
      const data = await apiService.makeRequest(`/salary-structure/emolument-components/${componentId}`, {
        method: "DELETE",
      });

      if (data.success) {
        alert("Component deleted successfully!");
        loadComponents();
        loadStatistics();
        onDataChange?.();
      } else {
        alert(data.message || "Error deleting component");
      }
    } catch (error) {
      console.error("Error deleting component:", error);
      alert("Error deleting component. Please try again.");
    }
  };

  const handleComponentSave = () => {
    loadComponents();
    loadStatistics();
    onDataChange?.();
  };

  const handleBulkAction = async (action) => {
    if (selectedComponents.size === 0) {
      alert("Please select components to perform bulk action");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to ${action} ${selectedComponents.size} component(s)?`
      )
    ) {
      return;
    }

    try {
      const data = await apiService.makeRequest("/salary-structure/emolument-components/bulk-action", {
        method: "POST",
        body: JSON.stringify({
          action: action,
          component_ids: Array.from(selectedComponents),
        }),
      });

      if (data.success) {
        alert(`Bulk ${action} completed successfully!`);
        setSelectedComponents(new Set());
        loadComponents();
        loadStatistics();
        onDataChange?.();
      } else {
        alert(data.message || `Error performing bulk ${action}`);
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      alert(`Error performing bulk ${action}. Please try again.`);
    }
  };

  const handleSelectAll = () => {
    if (selectedComponents.size === components.length) {
      setSelectedComponents(new Set());
    } else {
      setSelectedComponents(new Set(components.map((c) => c.id)));
    }
  };

  const handleSelectComponent = (componentId) => {
    const newSelected = new Set(selectedComponents);
    if (newSelected.has(componentId)) {
      newSelected.delete(componentId);
    } else {
      newSelected.add(componentId);
    }
    setSelectedComponents(newSelected);
  };

  const handleExportExcel = async () => {
    try {
      // For file downloads, we need to use fetch directly with the full URL
      const response = await fetch(
        `${apiService.baseURL}/salary-structure/emolument-components/export`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `emolument_components_export_${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Error exporting data");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Error exporting data. Please try again.");
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === "benefit"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeBadgeColor = (type) => {
    return type === "fixed_allowance"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const getClassBadgeColor = (classType) => {
    return classType === "cash_item"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const getCategoryColor = (category) => {
    const colors = {
      basic: "bg-indigo-100 text-indigo-800",
      allowance: "bg-green-100 text-green-800",
      deduction: "bg-red-100 text-red-800",
      benefit: "bg-blue-100 text-blue-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const statsCards = [
    {
      label: "Total Components",
      value: statistics.total,
      change: `${statistics.active} active`,
      icon: Building2,
      bgGradient: "from-blue-500 to-blue-600",
    },
    {
      label: "Benefit Components",
      value: statistics.benefit_status,
      change: "Benefit status",
      icon: CreditCard,
      bgGradient: "from-green-500 to-green-600",
    },
    {
      label: "Regular Components",
      value: statistics.regular_status,
      change: "Regular status",
      icon: Tag,
      bgGradient: "from-purple-500 to-purple-600",
    },
    {
      label: "Cash Items",
      value: statistics.cash_items,
      change: `${statistics.non_cash_items} non-cash`,
      icon: DollarSign,
      bgGradient: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Emolument Component Master
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage salary components, allowances, and deductions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.change}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.bgGradient} flex items-center justify-center text-white`}
              >
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="benefit">Benefit</option>
                <option value="regular">Regular</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="basic">Basic</option>
                <option value="allowance">Allowance</option>
                <option value="deduction">Deduction</option>
                <option value="benefit">Benefit</option>
              </select>

              <select
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowExcelImport(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            <button
              onClick={handleAddComponent}
              className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Component</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedComponents.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedComponents.size} component(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction("activate")}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Components Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-2 w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedComponents.size === components.length &&
                        components.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-gray-900 min-w-20">
                    Code
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-gray-900 min-w-32">
                    Component Name
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-gray-900 min-w-20">
                    Status
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-gray-900 min-w-24">
                    Type
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-gray-900 min-w-20">
                    Class
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-gray-900 min-w-20">
                    Category
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-gray-900 min-w-16">
                    Active
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-gray-900 min-w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {components.map((component) => (
                  <tr
                    key={component.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 px-2">
                      <input
                        type="checkbox"
                        checked={selectedComponents.has(component.id)}
                        onChange={() => handleSelectComponent(component.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <span className="font-medium text-gray-900 text-xs">
                        {component.component_code}
                      </span>
                    </td>
                    <td className="py-2 px-2 max-w-32">
                      <span className="font-medium text-gray-900 text-xs block truncate" title={component.component_name}>
                        {component.component_name}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${getStatusBadgeColor(
                          component.status
                        )}`}
                      >
                        {component.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${getTypeBadgeColor(
                          component.type
                        )}`}
                      >
                        {component.type?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${getClassBadgeColor(
                          component.class
                        )}`}
                      >
                        {component.class?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getCategoryColor(
                          component.category
                        )}`}
                      >
                        {component.category}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                          component.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {component.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditComponent(component)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteComponent(component.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && components.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No components found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter || categoryFilter
                ? "Try adjusting your search criteria"
                : "Get started by creating your first emolument component"}
            </p>
            {!searchTerm && !statusFilter && !categoryFilter && (
              <button
                onClick={handleAddComponent}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Component</span>
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Component Form Modal */}
      <EmolumentComponentForm
        isOpen={showComponentForm}
        onClose={() => setShowComponentForm(false)}
        editingComponent={editingComponent}
        onSave={handleComponentSave}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        onImportComplete={handleComponentSave}
      />
    </div>
  );
};

export default EmolumentComponentMaster;
