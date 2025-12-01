// File: frontend/src/components/admin/modules/recruitment-management/submodules/boarding-approvals/PendingBoardingApprovalsPage.jsx

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Loader,
  AlertCircle,
  FileText,
  Calendar,
  Mail,
  Phone,
  Building,
  User,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import boardingApprovalsAPI from "@/services/modules/recruitment-management/boardingApprovalsAPI";

/**
 * PendingBoardingApprovalsPage Component
 *
 * Task 3.4: Allows supervisors and Control Department to approve/reject staff boarding.
 *
 * Features:
 * - Table of pending staff approvals
 * - Staff details modal
 * - Approve/Reject individual staff
 * - Bulk approve functionality
 * - Separate views for Supervisor and Control Department
 * - Search and filter capabilities
 */
const PendingBoardingApprovalsPage = ({
  currentTheme,
  preferences,
  onBack,
}) => {
  const { user } = useAuth();

  // State
  const [pendingStaff, setPendingStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Form states
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [customRejectionReason, setCustomRejectionReason] = useState("");

  // Bulk selection
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByClient, setFilterByClient] = useState("");
  const [filterByRequest, setFilterByRequest] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    supervisor_pending: 0,
    control_pending: 0,
  });

  // ========================================
  // LIFECYCLE & DATA FETCHING
  // ========================================

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchQuery, filterByClient, filterByRequest, pendingStaff]);

  // ========================================
  // DATA FETCHING
  // ========================================

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await boardingApprovalsAPI.getPending();

      if (response.success && response.data) {
        const staffList = Array.isArray(response.data) ? response.data : [];
        setPendingStaff(staffList);

        // Calculate statistics
        const total = staffList.length;
        const supervisorPending = staffList.filter(
          (s) => s.boarding_approval_status === "pending"
        ).length;
        const controlPending = staffList.filter(
          (s) => s.boarding_approval_status === "pending_control_approval"
        ).length;

        setStats({
          total,
          supervisor_pending: supervisorPending,
          control_pending: controlPending,
        });
      }
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
      setError("Failed to load pending approvals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FILTERING
  // ========================================

  const filterStaff = () => {
    let filtered = [...pendingStaff];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (staff) =>
          staff.first_name?.toLowerCase().includes(query) ||
          staff.last_name?.toLowerCase().includes(query) ||
          staff.staff_id?.toLowerCase().includes(query) ||
          staff.email?.toLowerCase().includes(query)
      );
    }

    // Client filter
    if (filterByClient) {
      filtered = filtered.filter(
        (staff) => staff.client_id?.toString() === filterByClient
      );
    }

    // Recruitment request filter
    if (filterByRequest) {
      filtered = filtered.filter(
        (staff) => staff.recruitment_request_id?.toString() === filterByRequest
      );
    }

    setFilteredStaff(filtered);
  };

  // Get unique clients for filter dropdown
  const getUniqueClients = () => {
    const clients = pendingStaff.reduce((acc, staff) => {
      if (staff.client && !acc.find((c) => c.id === staff.client.id)) {
        acc.push(staff.client);
      }
      return acc;
    }, []);
    return clients;
  };

  // Get unique recruitment requests for filter dropdown
  const getUniqueRequests = () => {
    const requests = pendingStaff.reduce((acc, staff) => {
      if (
        staff.recruitment_request &&
        !acc.find((r) => r.id === staff.recruitment_request.id)
      ) {
        acc.push(staff.recruitment_request);
      }
      return acc;
    }, []);
    return requests;
  };

  // ========================================
  // APPROVAL/REJECTION HANDLERS
  // ========================================

  const handleApprove = (staff) => {
    setSelectedStaff(staff);
    setApprovalNotes("");
    setApproveModalOpen(true);
  };

  const handleReject = (staff) => {
    setSelectedStaff(staff);
    setRejectionReason("");
    setCustomRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleViewDetails = (staff) => {
    setSelectedStaff(staff);
    setDetailsModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedStaff) return;

    try {
      setActionLoading(true);
      setError("");

      const isSupervisorLevel =
        selectedStaff.boarding_approval_status === "pending";

      let response;
      if (isSupervisorLevel) {
        response = await boardingApprovalsAPI.approve(selectedStaff.id, {
          approval_notes: approvalNotes.trim(),
        });
      } else {
        response = await boardingApprovalsAPI.controlApprove(selectedStaff.id, {
          approval_notes: approvalNotes.trim(),
        });
      }

      if (response.success) {
        setSuccess(
          `Staff ${selectedStaff.first_name} ${selectedStaff.last_name} approved successfully!`
        );
        setApproveModalOpen(false);
        setSelectedStaff(null);
        fetchPendingApprovals();
      } else {
        setError(response.message || "Failed to approve staff");
      }
    } catch (err) {
      console.error("Error approving staff:", err);
      setError(err.response?.data?.message || "Failed to approve staff");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedStaff) return;

    const reason =
      rejectionReason === "other"
        ? customRejectionReason.trim()
        : rejectionReason;

    if (!reason) {
      setError("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const isSupervisorLevel =
        selectedStaff.boarding_approval_status === "pending";

      let response;
      if (isSupervisorLevel) {
        response = await boardingApprovalsAPI.reject(selectedStaff.id, reason);
      } else {
        response = await boardingApprovalsAPI.controlReject(
          selectedStaff.id,
          reason
        );
      }

      if (response.success) {
        setSuccess(
          `Staff ${selectedStaff.first_name} ${selectedStaff.last_name} rejected.`
        );
        setRejectModalOpen(false);
        setSelectedStaff(null);
        fetchPendingApprovals();
      } else {
        setError(response.message || "Failed to reject staff");
      }
    } catch (err) {
      console.error("Error rejecting staff:", err);
      setError(err.response?.data?.message || "Failed to reject staff");
    } finally {
      setActionLoading(false);
    }
  };

  // ========================================
  // BULK OPERATIONS
  // ========================================

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(filteredStaff.map((staff) => staff.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectStaff = (staffId) => {
    if (selectedStaffIds.includes(staffId)) {
      setSelectedStaffIds(selectedStaffIds.filter((id) => id !== staffId));
    } else {
      setSelectedStaffIds([...selectedStaffIds, staffId]);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedStaffIds.length === 0) {
      setError("Please select at least one staff member to approve");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to approve ${selectedStaffIds.length} staff member(s)?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      // Determine if it's supervisor or control level based on first selected staff
      const firstStaff = pendingStaff.find((s) =>
        selectedStaffIds.includes(s.id)
      );
      const isSupervisorLevel =
        firstStaff?.boarding_approval_status === "pending";

      let response;
      if (isSupervisorLevel) {
        response = await boardingApprovalsAPI.bulkApprove(selectedStaffIds, {
          approval_notes: "Bulk approval",
        });
      } else {
        response = await boardingApprovalsAPI.bulkControlApprove(
          selectedStaffIds,
          {
            approval_notes: "Bulk approval",
          }
        );
      }

      if (response.success) {
        setSuccess(
          `Successfully approved ${selectedStaffIds.length} staff member(s)!`
        );
        setSelectedStaffIds([]);
        setSelectAll(false);
        fetchPendingApprovals();
      } else {
        setError(response.message || "Failed to bulk approve staff");
      }
    } catch (err) {
      console.error("Error bulk approving staff:", err);
      setError(err.response?.data?.message || "Failed to bulk approve staff");
    } finally {
      setActionLoading(false);
    }
  };

  // ========================================
  // RENDER MODALS
  // ========================================

  const renderDetailsModal = () => {
    if (!detailsModalOpen || !selectedStaff) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setDetailsModalOpen(false)}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Staff Details
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedStaff.staff_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">First Name</label>
                    <p className="font-medium">{selectedStaff.first_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Last Name</label>
                    <p className="font-medium">{selectedStaff.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-medium flex items-center">
                      <Mail className="w-4 h-4 mr-1 text-gray-400" />
                      {selectedStaff.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <p className="font-medium flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {selectedStaff.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Gender</label>
                    <p className="font-medium capitalize">
                      {selectedStaff.gender || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Date of Birth
                    </label>
                    <p className="font-medium">
                      {selectedStaff.date_of_birth || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="mb-6 border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                  Employment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Client</label>
                    <p className="font-medium">
                      {selectedStaff.client?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Job Title</label>
                    <p className="font-medium">
                      {selectedStaff.job_structure?.job_title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Recruitment Request
                    </label>
                    <p className="font-medium">
                      {selectedStaff.recruitment_request?.ticket_id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <p className="font-medium">
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        {selectedStaff.boarding_approval_status || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Information */}
              {selectedStaff.boarded_by_user && (
                <div className="mb-6 border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Boarding Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">
                        Boarded By
                      </label>
                      <p className="font-medium">
                        {selectedStaff.boarded_by_user.first_name}{" "}
                        {selectedStaff.boarded_by_user.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Boarded At
                      </label>
                      <p className="font-medium flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {new Date(
                          selectedStaff.boarded_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDetailsModalOpen(false);
                  handleApprove(selectedStaff);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => {
                  setDetailsModalOpen(false);
                  handleReject(selectedStaff);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderApproveModal = () => {
    if (!approveModalOpen || !selectedStaff) return null;

    const isSupervisorLevel =
      selectedStaff.boarding_approval_status === "pending";

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => !actionLoading && setApproveModalOpen(false)}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Approve Staff Boarding
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedStaff.first_name} {selectedStaff.last_name}
                  </p>
                </div>
              </div>

              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  {isSupervisorLevel
                    ? "After supervisor approval, this staff will proceed to Control Department for final approval."
                    : "After Control Department approval, this staff will be activated and can access the system."}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows="3"
                  placeholder="Add any notes or comments..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={actionLoading}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setApproveModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {actionLoading && <Loader className="w-4 h-4 animate-spin" />}
                  <span>
                    {actionLoading ? "Approving..." : "Confirm Approval"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRejectModal = () => {
    if (!rejectModalOpen || !selectedStaff) return null;

    const predefinedReasons = [
      "Incomplete documentation",
      "Failed background check",
      "Does not meet requirements",
      "Duplicate entry",
      "Other (please specify)",
    ];

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => !actionLoading && setRejectModalOpen(false)}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Reject Staff Boarding
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedStaff.first_name} {selectedStaff.last_name}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-3"
                  disabled={actionLoading}
                >
                  <option value="">Select a reason...</option>
                  {predefinedReasons.map((reason) => (
                    <option
                      key={reason}
                      value={
                        reason === "Other (please specify)" ? "other" : reason
                      }
                    >
                      {reason}
                    </option>
                  ))}
                </select>

                {rejectionReason === "other" && (
                  <textarea
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    rows="3"
                    placeholder="Please specify the reason..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={actionLoading}
                  />
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {actionLoading && <Loader className="w-4 h-4 animate-spin" />}
                  <span>
                    {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className={`min-h-screen ${currentTheme?.bg || "bg-gray-50"}`}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Pending Boarding Approvals
                </h1>
                <p className="text-gray-600 mt-1">
                  Review and approve staff boarding requests
                </p>
              </div>
            </div>
            <button
              onClick={fetchPendingApprovals}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Supervisor Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {stats.supervisor_pending}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Control Pending</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {stats.control_pending}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">{success}</p>
              <button
                onClick={() => setSuccess("")}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, staff ID, or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Client Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Client
              </label>
              <select
                value={filterByClient}
                onChange={(e) => setFilterByClient(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Clients</option>
                {getUniqueClients().map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Request Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Request
              </label>
              <select
                value={filterByRequest}
                onChange={(e) => setFilterByRequest(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Requests</option>
                {getUniqueRequests().map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.ticket_id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedStaffIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <p className="text-blue-900">
              {selectedStaffIds.length} staff member(s) selected
            </p>
            <button
              onClick={handleBulkApprove}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {actionLoading && <Loader className="w-4 h-4 animate-spin" />}
              <CheckCircle className="w-4 h-4" />
              <span>Bulk Approve</span>
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">
                Loading pending approvals...
              </span>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center p-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchQuery || filterByClient || filterByRequest
                  ? "No staff found matching your filters"
                  : "No pending approvals at this time"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Staff ID
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Client
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Job Title
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-900">
                      Boarded At
                    </th>
                    <th className="p-4 text-center text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStaff.map((staff) => (
                    <tr
                      key={staff.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedStaffIds.includes(staff.id)}
                          onChange={() => handleSelectStaff(staff.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-4 text-sm font-mono text-gray-900">
                        {staff.staff_id}
                      </td>
                      <td className="p-4 text-sm text-gray-900">
                        {staff.first_name} {staff.last_name}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {staff.client?.name || "N/A"}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {staff.job_structure?.job_title || "N/A"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            staff.boarding_approval_status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {staff.boarding_approval_status === "pending"
                            ? "Supervisor Pending"
                            : "Control Pending"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {staff.boarded_at
                          ? new Date(staff.boarded_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(staff)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(staff)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(staff)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {renderDetailsModal()}
      {renderApproveModal()}
      {renderRejectModal()}
    </div>
  );
};

export default PendingBoardingApprovalsPage;
