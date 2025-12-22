"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter,
  Clock,
  Calendar,
  User,
  FileText,
  X,
  MessageSquare
} from "lucide-react";
import { requisitionAPI } from "@/services/modules/requisition-management";
import { RequisitionCard, StatusBadge, StockIndicator } from "@/components/requisition";

/**
 * ApproveRequisition Component
 * 
 * Store Keeper interface for reviewing, approving/rejecting requisitions,
 * and managing collections
 */
export default function ApproveRequisition({ currentTheme }) {
  // Tab management
  const [activeTab, setActiveTab] = useState("pending"); // pending, approved, ready

  // Data state
  const [requisitions, setRequisitions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);

  // Modal state
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // "approve", "reject", "ready", "collected"
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Load data on mount and tab change
  useEffect(() => {
    loadRequisitions();
    loadStatistics();
  }, [activeTab, selectedDepartment, searchQuery]);

  // Load statistics
  const loadStatistics = async () => {
    try {
      const stats = await requisitionAPI.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

  // Load requisitions based on active tab
  const loadRequisitions = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      
      switch (activeTab) {
        case "pending":
          data = await requisitionAPI.getPendingApprovals();
          break;
        case "approved":
          data = await requisitionAPI.getByStatus("approved", { collection_status: "pending" });
          break;
        case "ready":
          data = await requisitionAPI.getReadyForCollection();
          break;
        default:
          data = await requisitionAPI.getAll();
      }

      // Ensure data is always an array
      const requisitionsArray = Array.isArray(data) ? data : [];

      // Apply filters
      let filteredData = requisitionsArray;
      if (selectedDepartment !== "all") {
        filteredData = filteredData.filter((req) => req.department === selectedDepartment);
      }
      if (searchQuery) {
        filteredData = filteredData.filter(
          (req) =>
            req.requisition_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setRequisitions(filteredData);

      // Extract unique departments
      const uniqueDepts = [...new Set(filteredData.map((req) => req.department).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (err) {
      console.error("Failed to load requisitions:", err);
      setError("Failed to load requisitions");
      setRequisitions([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Open review modal
  const openReviewModal = (requisition, action) => {
    setSelectedRequisition(requisition);
    setReviewAction(action);
    setRejectionReason("");
    setShowReviewModal(true);
  };

  // Close review modal
  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedRequisition(null);
    setReviewAction(null);
    setRejectionReason("");
  };

  // Handle requisition action
  const handleRequisitionAction = async () => {
    if (!selectedRequisition) return;

    if (reviewAction === "reject" && !rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setProcessing(true);
    try {
      switch (reviewAction) {
        case "approve":
          await requisitionAPI.approve(selectedRequisition.id);
          alert("Requisition approved successfully!");
          break;
        case "reject":
          await requisitionAPI.reject(selectedRequisition.id, { reason: rejectionReason });
          alert("Requisition rejected");
          break;
        case "ready":
          await requisitionAPI.markReady(selectedRequisition.id);
          alert("Items marked as ready for collection!");
          break;
        case "collected":
          await requisitionAPI.markCollected(selectedRequisition.id);
          alert("Requisition marked as collected!");
          break;
      }
      closeReviewModal();
      loadRequisitions();
      loadStatistics();
    } catch (err) {
      console.error("Action failed:", err);
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setProcessing(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className={`${currentTheme.cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
              Approve Requisitions
            </h1>
            <p className={`${currentTheme.textSecondary} mt-1`}>
              Review and manage staff requisition requests
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${currentTheme.cardBg} p-4 rounded-lg border ${currentTheme.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Pending Approval</p>
                  <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                    {statistics.by_status?.pending || 0}
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
                    {statistics.by_status?.approved || 0}
                  </p>
                </div>
                <CheckCircle className="text-green-500" size={32} />
              </div>
            </div>

            <div className={`${currentTheme.cardBg} p-4 rounded-lg border ${currentTheme.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Ready for Collection</p>
                  <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                    {statistics.by_collection_status?.ready || 0}
                  </p>
                </div>
                <Package className="text-blue-500" size={32} />
              </div>
            </div>

            <div className={`${currentTheme.cardBg} p-4 rounded-lg border ${currentTheme.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Collected</p>
                  <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                    {statistics.by_collection_status?.collected || 0}
                  </p>
                </div>
                <CheckCircle className="text-purple-500" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 border-b border-gray-300 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "pending"
                ? "text-blue-600 border-b-2 border-blue-600"
                : `${currentTheme.textSecondary} hover:${currentTheme.textPrimary}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span>Pending Approval</span>
              {statistics?.by_status?.pending > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {statistics.by_status.pending}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "approved"
                ? "text-blue-600 border-b-2 border-blue-600"
                : `${currentTheme.textSecondary} hover:${currentTheme.textPrimary}`
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>Approved</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("ready")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "ready"
                ? "text-blue-600 border-b-2 border-blue-600"
                : `${currentTheme.textSecondary} hover:${currentTheme.textPrimary}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={20} />
              <span>Ready for Collection</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("collected")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "collected"
                ? "text-blue-600 border-b-2 border-blue-600"
                : `${currentTheme.textSecondary} hover:${currentTheme.textPrimary}`
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>Collected</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={`${currentTheme.cardBg} rounded-xl p-6`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by requisition code or staff name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                currentTheme.cardBg
              } border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Department Filter */}
          <div className="md:w-64">
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                  currentTheme.cardBg
                } border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
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

      {/* Requisitions List */}
      <div className={`${currentTheme.cardBg} rounded-xl p-6`}>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`${currentTheme.textSecondary} mt-4`}>Loading requisitions...</p>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-2`}>
              No Requisitions Found
            </h3>
            <p className={`${currentTheme.textSecondary}`}>
              {activeTab === "pending"
                ? "No pending requisitions to review"
                : `No ${activeTab} requisitions at the moment`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requisitions.map((requisition) => (
              <RequisitionCard
                key={requisition.id}
                requisition={requisition}
                onViewDetails={(req) => openReviewModal(req, "view")}
                onApprove={(req) => openReviewModal(req, "approve")}
                onReject={(req) => openReviewModal(req, "reject")}
                onMarkReady={(req) => openReviewModal(req, "ready")}
                onMarkCollected={(req) => openReviewModal(req, "collected")}
                userRole="store_keeper"
                variant="compact"
              />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRequisition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.cardBg} rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`sticky top-0 ${currentTheme.cardBg} border-b ${currentTheme.border} p-6 flex items-center justify-between`}>
              <h2 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {reviewAction === "approve" && "Approve Requisition"}
                {reviewAction === "reject" && "Reject Requisition"}
                {reviewAction === "ready" && "Mark Items Ready"}
                {reviewAction === "collected" && "Mark as Collected"}
                {reviewAction === "view" && "Requisition Details"}
              </h2>
              <button
                onClick={closeReviewModal}
                className={`p-2 ${currentTheme.hover} rounded-lg transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Requisition Details */}
              <div className={`p-4 rounded-lg border ${currentTheme.border}`}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Requisition Code</p>
                    <p className={`font-bold ${currentTheme.textPrimary}`}>
                      {selectedRequisition.requisition_code}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Request Date</p>
                    <p className={`font-bold ${currentTheme.textPrimary}`}>
                      {formatDate(selectedRequisition.request_date)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Requested By</p>
                    <p className={`font-bold ${currentTheme.textPrimary}`}>
                      {selectedRequisition.user?.name || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Department</p>
                    <p className={`font-bold ${currentTheme.textPrimary}`}>
                      {selectedRequisition.department}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={selectedRequisition.status} type="requisition" size="md" />
                  <StatusBadge
                    status={selectedRequisition.collection_status}
                    type="collection"
                    size="md"
                  />
                </div>
              </div>

              {/* Items List */}
              {selectedRequisition.items && selectedRequisition.items.length > 0 && (
                <div>
                  <h3 className={`text-lg font-bold ${currentTheme.textPrimary} mb-4 flex items-center gap-2`}>
                    <Package size={20} />
                    Requested Items
                  </h3>
                  <div className="space-y-3">
                    {selectedRequisition.items.map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-bold ${currentTheme.textPrimary}`}>
                              {item.inventory_item?.name || "Item"}
                            </h4>
                            <p className={`text-sm ${currentTheme.textSecondary}`}>
                              Code: {item.inventory_item?.code}
                            </p>
                            {item.inventory_item && (
                              <div className="mt-2">
                                <StockIndicator
                                  availableStock={item.inventory_item.available_stock}
                                  totalStock={item.inventory_item.total_stock}
                                  variant="badge"
                                />
                              </div>
                            )}
                            {item.purpose && (
                              <p className={`text-sm ${currentTheme.textSecondary} mt-2`}>
                                <span className="font-semibold">Purpose:</span> {item.purpose}
                              </p>
                            )}
                          </div>
                          <div className={`text-right`}>
                            <p className={`text-sm ${currentTheme.textSecondary}`}>Quantity</p>
                            <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                              {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Reason Input */}
              {reviewAction === "reject" && (
                <div>
                  <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Please provide a clear reason for rejecting this requisition..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              )}

              {/* Action Buttons */}
              {reviewAction !== "view" && (
                <div className="flex gap-3 pt-4 border-t border-gray-300 dark:border-gray-700">
                  <button
                    onClick={closeReviewModal}
                    disabled={processing}
                    className={`flex-1 py-3 px-4 rounded-lg border ${currentTheme.border} ${currentTheme.textPrimary} ${currentTheme.hover} transition-colors font-semibold disabled:opacity-50`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequisitionAction}
                    disabled={processing || (reviewAction === "reject" && !rejectionReason.trim())}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      reviewAction === "approve" || reviewAction === "ready" || reviewAction === "collected"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {reviewAction === "approve" && <CheckCircle size={20} />}
                        {reviewAction === "reject" && <XCircle size={20} />}
                        {reviewAction === "ready" && <Package size={20} />}
                        {reviewAction === "collected" && <CheckCircle size={20} />}
                        {reviewAction === "approve" && "Approve Requisition"}
                        {reviewAction === "reject" && "Reject Requisition"}
                        {reviewAction === "ready" && "Mark Ready"}
                        {reviewAction === "collected" && "Mark Collected"}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
