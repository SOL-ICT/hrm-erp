// File: frontend/src/components/admin/modules/recruitment-management/submodules/recruitment-request/modals/TicketAssignmentModal.jsx

import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Search,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";
import recruitmentRequestAPI from "@/services/modules/recruitment-management/recruitmentRequestAPI";

/**
 * TicketAssignmentModal Component
 *
 * Task 3.3: Allows users to assign or reassign recruitment tickets to other users.
 *
 * Features:
 * - Search/filter assignable users
 * - Assignment notes textarea
 * - Assign/Reassign functionality
 * - Success/error feedback
 * - Prevents assignment to current assignee
 *
 * Props:
 * @param {boolean} isOpen - Modal visibility state
 * @param {function} onClose - Close modal callback
 * @param {object} recruitmentRequest - Recruitment request object to assign
 * @param {function} onSuccess - Callback after successful assignment
 * @param {object} currentTheme - Theme configuration
 */
const TicketAssignmentModal = ({
  isOpen,
  onClose,
  recruitmentRequest,
  onSuccess,
  currentTheme = {},
}) => {
  // Alias for easier use throughout the component
  const request = recruitmentRequest;
  // State
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch assignable users on mount
  useEffect(() => {
    if (isOpen) {
      fetchAssignableUsers();
      // Pre-select current assignee if exists
      if (request?.assigned_to) {
        setSelectedUserId(request.assigned_to.toString());
      }
    } else {
      // Reset state when modal closes
      resetForm();
    }
  }, [isOpen, request]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(assignableUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = assignableUsers.filter(
        (user) =>
          user.first_name?.toLowerCase().includes(query) ||
          user.last_name?.toLowerCase().includes(query) ||
          user.role_name?.toLowerCase().includes(query) ||
          user.department?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, assignableUsers]);

  // Fetch assignable users from API
  const fetchAssignableUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await recruitmentRequestAPI.getAssignableUsers();

      if (response.success && response.data) {
        const users = Array.isArray(response.data) ? response.data : [];
        setAssignableUsers(users);
        setFilteredUsers(users);
      } else {
        setError("Failed to fetch assignable users");
      }
    } catch (err) {
      console.error("Error fetching assignable users:", err);
      setError("Failed to load assignable users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedUserId) {
      setError("Please select a user to assign the ticket to");
      return;
    }

    // Check if trying to assign to the same user
    if (
      request?.assigned_to &&
      selectedUserId === request.assigned_to.toString()
    ) {
      setError("Ticket is already assigned to this user");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await recruitmentRequestAPI.assignTicket(request.id, {
        assigned_to: selectedUserId,
        assignment_notes: assignmentNotes.trim(),
      });

      if (response.success) {
        setSuccess(
          request?.assigned_to
            ? "Ticket reassigned successfully!"
            : "Ticket assigned successfully!"
        );

        // Call success callback after short delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(response.data);
          }
          onClose();
        }, 1500);
      } else {
        setError(response.message || "Failed to assign ticket");
      }
    } catch (err) {
      console.error("Error assigning ticket:", err);
      setError(
        err.response?.data?.message ||
          "Failed to assign ticket. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setSearchQuery("");
    setSelectedUserId("");
    setAssignmentNotes("");
    setError("");
    setSuccess("");
  };

  // Handle modal close
  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  // Get selected user details
  const selectedUser = assignableUsers.find(
    (user) => user.id.toString() === selectedUserId
  );

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {request?.assigned_to ? "Reassign Ticket" : "Assign Ticket"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ticket ID:{" "}
                  <span className="font-mono text-blue-600">
                    {request?.ticket_id || `RR-${request?.id}`}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Current Assignment Info (if exists) */}
            {request?.assigned_to && request?.assigned_to_user && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">
                      Currently Assigned To:
                    </p>
                    <p className="text-yellow-800 mt-1">
                      {request.assigned_to_user.first_name}{" "}
                      {request.assigned_to_user.last_name} (
                      {request.assigned_to_user.role_name || "Staff"})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, role, or department..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || submitting}
                />
              </div>
            </div>

            {/* User Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assignee <span className="text-red-500">*</span>
              </label>

              {loading ? (
                <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg">
                  <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading users...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-500">
                    {searchQuery
                      ? "No users found matching your search"
                      : "No assignable users available"}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-200 last:border-b-0 transition-colors ${
                        selectedUserId === user.id.toString()
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="assignee"
                        value={user.id}
                        checked={selectedUserId === user.id.toString()}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        disabled={submitting}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.role_name || "Staff"}
                          {user.department && ` • ${user.department}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {filteredUsers.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {filteredUsers.length} user(s) available
                  {searchQuery && " matching your search"}
                </p>
              )}
            </div>

            {/* Assignment Notes */}
            {selectedUserId && (
              <div className="mb-4 animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows="3"
                  placeholder="Add any instructions or context for the assigned user..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide context or special instructions for the assignee
                </p>
              </div>
            )}

            {/* Selected User Preview */}
            {selectedUser && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Assigning ticket to:
                </p>
                <p className="text-sm text-blue-800">
                  {selectedUser.first_name} {selectedUser.last_name} (
                  {selectedUser.role_name || "Staff"})
                  {selectedUser.department && ` - ${selectedUser.department}`}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedUserId || submitting || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting && <Loader className="w-4 h-4 animate-spin" />}
                <span>
                  {submitting
                    ? "Assigning..."
                    : request?.assigned_to
                    ? "Reassign Ticket"
                    : "Assign Ticket"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketAssignmentModal;
