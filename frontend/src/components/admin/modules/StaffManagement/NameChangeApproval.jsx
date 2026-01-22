"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Clock,
  User,
  FileText,
  MessageSquare,
} from "lucide-react";
import apiService from "@/services/api";

/**
 * NameChangeApproval Component
 * Admin approval interface for name change requests
 */
export default function NameChangeApproval({ currentTheme, preferences, onBack }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Approval form state
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionComments, setRejectionComments] = useState("");
  const [stats, setStats] = useState({
    total_pending: 0,
    total_approved: 0,
    total_rejected: 0,
    total_requests: 0,
  });

  // Fetch requests
  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await apiService.makeRequest("admin/name-change-requests", {
        method: "GET",
      });

      if (data?.success) {
        setRequests(data.data || []);
        setErrorMessage("");
      } else {
        setErrorMessage("Failed to load requests");
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      setErrorMessage("Unable to load name change requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiService.makeRequest("admin/name-change-requests/stats", {
        method: "GET",
      });

      if (data?.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingId(selectedRequest.id);
      setErrorMessage("");

      const response = await apiService.makeRequest(
        `admin/name-change-requests/${selectedRequest.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({
            comments: approvalComments,
          }),
        }
      );

      if (response?.success) {
        setSuccessMessage(
          `Name change request for ${selectedRequest.employee_first_name} has been approved`
        );
        setShowDetailModal(false);
        setApprovalComments("");
        await fetchRequests();
        await fetchStats();
      } else {
        setErrorMessage(response?.message || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      setErrorMessage("Failed to approve request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      setErrorMessage("Please provide a rejection reason");
      return;
    }

    try {
      setProcessingId(selectedRequest.id);
      setErrorMessage("");

      const response = await apiService.makeRequest(
        `admin/name-change-requests/${selectedRequest.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({
            rejection_reason: rejectionReason.trim(),
            comments: rejectionComments,
          }),
        }
      );

      if (response?.success) {
        setSuccessMessage(
          `Name change request for ${selectedRequest.employee_first_name} has been rejected`
        );
        setShowDetailModal(false);
        setRejectionReason("");
        setRejectionComments("");
        await fetchRequests();
        await fetchStats();
      } else {
        setErrorMessage(response?.message || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      setErrorMessage("Failed to reject request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const downloadProof = (proofDocument) => {
    if (!proofDocument) return;
    const url = `/storage/${proofDocument}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = proofDocument.split("/").pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Name Change Requests
        </h1>
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm font-medium text-yellow-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.total_pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-600">Approved</p>
          <p className="text-2xl font-bold text-green-700">{stats.total_approved}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm font-medium text-red-600">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{stats.total_rejected}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-600">Total</p>
          <p className="text-2xl font-bold text-blue-700">{stats.total_requests}</p>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Error</p>
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-700">Success</p>
            <p className="text-green-600 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">
          <p>Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No pending requests</p>
          <p className="text-gray-500 text-sm">All name change requests have been processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {request.employee_first_name} {request.employee_last_name}
                      </p>
                      <p className="text-sm text-gray-600">{request.employee_code}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Current Name</p>
                      <p className="font-medium text-gray-900">
                        {request.employee_first_name} {request.employee_last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Requested Name</p>
                      <p className="font-medium text-gray-900">
                        {request.requested_first_name}{" "}
                        {request.requested_last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Submitted</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(request.submitted_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <p className="font-medium text-yellow-600">Pending</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1">Reason:</p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {request.reason}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleViewDetails(request)}
                  className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Review</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Review Name Change Request
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setApprovalComments("");
                  setRejectionReason("");
                  setRejectionComments("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Employee Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Employee Information</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Employee Code</p>
                    <p className="font-medium text-gray-900">
                      {selectedRequest.employee_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Designation</p>
                    <p className="font-medium text-gray-900">
                      {selectedRequest.designation || selectedRequest.job_title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedRequest.employee_first_name}
                      {selectedRequest.employee_middle_name
                        ? ` ${selectedRequest.employee_middle_name}`
                        : ""}{" "}
                      {selectedRequest.employee_last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Requested Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedRequest.requested_first_name}
                      {selectedRequest.requested_middle_name
                        ? ` ${selectedRequest.requested_middle_name}`
                        : ""}{" "}
                      {selectedRequest.requested_last_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Request Details</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Reason for Change</p>
                    <p className="text-gray-900 mt-1">{selectedRequest.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Proof Document</p>
                    {selectedRequest.proof_document ? (
                      <button
                        onClick={() =>
                          downloadProof(selectedRequest.proof_document)
                        }
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download {selectedRequest.proof_document.split("/").pop()}</span>
                      </button>
                    ) : (
                      <p className="text-gray-600">No document attached</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted On</p>
                    <p className="text-gray-900 mt-1">
                      {formatDate(selectedRequest.submitted_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Form */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Decision</span>
                </h3>

                {/* Tabs for Approve/Reject */}
                <div className="space-y-4">
                  {/* Approve Section */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-3">Approve Request</h4>
                    <textarea
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      placeholder="Optional comments (e.g., 'Documentation verified')"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={handleApprove}
                      disabled={processingId === selectedRequest.id}
                      className="mt-3 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>
                        {processingId === selectedRequest.id
                          ? "Processing..."
                          : "Approve Request"}
                      </span>
                    </button>
                  </div>

                  {/* Reject Section */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900 mb-3">Reject Request</h4>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Required: Please provide a reason for rejection (min 10 characters)"
                      rows="2"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        !rejectionReason.trim() && rejectionReason
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <textarea
                      value={rejectionComments}
                      onChange={(e) => setRejectionComments(e.target.value)}
                      placeholder="Optional additional comments"
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mt-2"
                    />
                    <button
                      onClick={handleReject}
                      disabled={
                        processingId === selectedRequest.id ||
                        !rejectionReason.trim()
                      }
                      className="mt-3 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-2"
                    >
                      <XCircle className="h-5 w-5" />
                      <span>
                        {processingId === selectedRequest.id
                          ? "Processing..."
                          : "Reject Request"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
