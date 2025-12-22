"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { requisitionAPI } from "@/services/modules/requisition-management";
import { RequisitionCard, StatusBadge } from "@/components/requisition";

/**
 * RequisitionHistory Component
 * 
 * Comprehensive requisition history with advanced filtering and export
 * Accessible by all roles with appropriate permissions
 */
export default function RequisitionHistory({ currentTheme }) {
  // Data state
  const [requisitions, setRequisitions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    collectionStatus: "all",
    department: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Dropdown options
  const [departments, setDepartments] = useState([]);

  // Modal state
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load data on mount and filter changes
  useEffect(() => {
    loadRequisitions();
    loadStatistics();
  }, [filters, currentPage]);

  // Load statistics
  const loadStatistics = async () => {
    try {
      const stats = await requisitionAPI.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

  // Load requisitions with filters
  const loadRequisitions = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await requisitionAPI.getAll();

      // Apply status filter
      if (filters.status !== "all") {
        data = data.filter((req) => req.status === filters.status);
      }

      // Apply collection status filter
      if (filters.collectionStatus !== "all") {
        data = data.filter((req) => req.collection_status === filters.collectionStatus);
      }

      // Apply department filter
      if (filters.department !== "all") {
        data = data.filter((req) => req.department === filters.department);
      }

      // Apply date range filter
      if (filters.dateFrom) {
        data = data.filter((req) => new Date(req.request_date) >= new Date(filters.dateFrom));
      }
      if (filters.dateTo) {
        data = data.filter((req) => new Date(req.request_date) <= new Date(filters.dateTo));
      }

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        data = data.filter(
          (req) =>
            req.requisition_code.toLowerCase().includes(searchLower) ||
            req.user?.name.toLowerCase().includes(searchLower) ||
            req.department.toLowerCase().includes(searchLower)
        );
      }

      // Extract unique departments
      const uniqueDepts = [...new Set(data.map((req) => req.department))];
      setDepartments(uniqueDepts);

      // Sort by date (newest first)
      data.sort((a, b) => new Date(b.request_date) - new Date(a.request_date));

      setRequisitions(data);
    } catch (err) {
      console.error("Failed to load requisitions:", err);
      setError("Failed to load requisition history");
    } finally {
      setLoading(false);
    }
  };

  // Update filter
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      collectionStatus: "all",
      department: "all",
      dateFrom: "",
      dateTo: "",
    });
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(requisitions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequisitions = requisitions.slice(startIndex, endIndex);

  // View requisition details
  const viewRequisitionDetails = (requisition) => {
    setSelectedRequisition(requisition);
    setShowDetailsModal(true);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (requisitions.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Requisition Code",
      "Request Date",
      "Requester",
      "Department",
      "Branch",
      "Status",
      "Collection Status",
      "Items Count",
      "Approved By",
      "Approval Date",
    ];

    const rows = requisitions.map((req) => [
      req.requisition_code,
      formatDate(req.request_date),
      req.user?.name || "N/A",
      req.department,
      req.branch,
      req.status,
      req.collection_status,
      req.items?.length || req.total_items || 0,
      req.approved_by_name || "N/A",
      req.approval_date ? formatDate(req.approval_date) : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `requisition_history_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Status distribution
  const statusCounts = {
    pending: requisitions.filter((r) => r.status === "pending").length,
    approved: requisitions.filter((r) => r.status === "approved").length,
    rejected: requisitions.filter((r) => r.status === "rejected").length,
    cancelled: requisitions.filter((r) => r.status === "cancelled").length,
  };

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className={`${currentTheme.cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
              Requisition History
            </h1>
            <p className={`${currentTheme.textSecondary} mt-1`}>
              Complete audit trail of all requisitions
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={requisitions.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download size={20} />
            Export to CSV
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${currentTheme.cardBg} p-4 rounded-lg border ${currentTheme.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Total Requisitions</p>
                <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                  {requisitions.length}
                </p>
              </div>
              <FileText className="text-blue-500" size={32} />
            </div>
          </div>

          <div className={`${currentTheme.cardBg} p-4 rounded-lg border ${currentTheme.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Pending</p>
                <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                  {statusCounts.pending}
                </p>
              </div>
              <Clock className="text-amber-500" size={32} />
            </div>
          </div>

          <div className={`${currentTheme.cardBg} p-4 rounded-lg border ${currentTheme.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Approved</p>
                <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                  {statusCounts.approved}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>

          <div className={`${currentTheme.cardBg} p-4 rounded-lg border ${currentTheme.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Rejected/Cancelled</p>
                <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                  {statusCounts.rejected + statusCounts.cancelled}
                </p>
              </div>
              <XCircle className="text-red-500" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${currentTheme.cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${currentTheme.textPrimary}`}>Filters</h2>
          <button
            onClick={resetFilters}
            className={`text-sm ${currentTheme.textSecondary} hover:${currentTheme.textPrimary} font-semibold`}
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="lg:col-span-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by code, staff name, or department..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
              Requisition Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Collection Status Filter */}
          <div>
            <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
              Collection Status
            </label>
            <select
              value={filters.collectionStatus}
              onChange={(e) => updateFilter("collectionStatus", e.target.value)}
              className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
              <option value="collected">Collected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => updateFilter("department", e.target.value)}
              className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
              Date From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Date To */}
          <div>
            <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
              Date To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <div className="font-semibold text-red-900 dark:text-red-200">Error</div>
            <div className="text-red-700 dark:text-red-300">{error}</div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className={`${currentTheme.cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold ${currentTheme.textPrimary}`}>
            Results ({requisitions.length} total)
          </h2>
          <p className={`text-sm ${currentTheme.textSecondary}`}>
            Showing {startIndex + 1}-{Math.min(endIndex, requisitions.length)} of {requisitions.length}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`${currentTheme.textSecondary} mt-4`}>Loading requisitions...</p>
          </div>
        ) : currentRequisitions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-2`}>
              No Requisitions Found
            </h3>
            <p className={`${currentTheme.textSecondary}`}>
              Try adjusting your filters to see more results
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentRequisitions.map((requisition) => (
                <div
                  key={requisition.id}
                  className={`p-5 rounded-lg border ${currentTheme.border} ${currentTheme.hover} transition-all cursor-pointer`}
                  onClick={() => viewRequisitionDetails(requisition)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className={`font-bold ${currentTheme.textPrimary}`}>
                          {requisition.requisition_code}
                        </h3>
                        <StatusBadge status={requisition.status} type="requisition" size="sm" />
                        <StatusBadge
                          status={requisition.collection_status}
                          type="collection"
                          size="sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className={`${currentTheme.textSecondary}`}>Requested By</p>
                          <p className={`font-semibold ${currentTheme.textPrimary}`}>
                            {requisition.user?.name || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className={`${currentTheme.textSecondary}`}>Department</p>
                          <p className={`font-semibold ${currentTheme.textPrimary}`}>
                            {requisition.department}
                          </p>
                        </div>
                        <div>
                          <p className={`${currentTheme.textSecondary}`}>Request Date</p>
                          <p className={`font-semibold ${currentTheme.textPrimary}`}>
                            {formatDate(requisition.request_date)}
                          </p>
                        </div>
                        <div>
                          <p className={`${currentTheme.textSecondary}`}>Items</p>
                          <p className={`font-semibold ${currentTheme.textPrimary}`}>
                            {requisition.items?.length || requisition.total_items || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`${currentTheme.textSecondary}`} size={24} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.hover} disabled:opacity-50 disabled:cursor-not-allowed font-semibold`}
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : `border ${currentTheme.border} ${currentTheme.hover}`
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.hover} disabled:opacity-50 disabled:cursor-not-allowed font-semibold`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequisition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.cardBg} rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`sticky top-0 ${currentTheme.cardBg} border-b ${currentTheme.border} p-6 flex items-center justify-between`}>
              <h2 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                Requisition Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className={`p-2 ${currentTheme.hover} rounded-lg transition-colors`}
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <RequisitionCard
                requisition={selectedRequisition}
                userRole="admin"
                variant="detailed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
