// File: frontend/src/components/admin/modules/recruitment-management/submodules/current-vacancies/TicketGroup.jsx

"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  MapPin,
  Mail,
  CheckCircle2,
  Clock,
  User,
  Phone,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import CandidateCard from "./CandidateCard";
import CandidateStatusTracker from "./CandidateStatusTracker";

const TicketGroup = ({
  vacancy,
  expanded,
  onToggleExpansion,
  onOpenInviteModal,
  getPriorityColor,
  currentTheme,
}) => {
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showStatusTracker, setShowStatusTracker] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const handleViewCandidateStatus = (candidate, recruitmentRequestId) => {
    setSelectedCandidate(candidate);
    setShowStatusTracker(true);
  };

  const handleCloseStatusTracker = () => {
    setShowStatusTracker(false);
    setSelectedCandidate(null);
  };

  const handleCandidateSelection = (candidateId, isSelected) => {
    setSelectedCandidates((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(candidateId);
      } else {
        newSet.delete(candidateId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCandidates(new Set());
    } else {
      const allCandidateIds = vacancy.applications.map(
        (app) => app.candidate_id
      );
      setSelectedCandidates(new Set(allCandidateIds));
    }
    setSelectAll(!selectAll);
  };

  const handleSendInvites = () => {
    const selectedApplications = vacancy.applications.filter((app) =>
      selectedCandidates.has(app.candidate_id)
    );
    onOpenInviteModal(vacancy, selectedApplications);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },
      reviewing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Reviewing",
      },
      shortlisted: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        label: "Shortlisted",
      },
      interviewed: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "Interviewed",
      },
      offered: { bg: "bg-green-100", text: "text-green-800", label: "Offered" },
      hired: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Hired" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
      withdrawn: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Withdrawn",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isDeadlineApproaching = () => {
    if (!vacancy.deadline) return false;
    const deadline = new Date(vacancy.deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadline - today) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
  };

  const isOverdue = () => {
    if (!vacancy.deadline) return false;
    const deadline = new Date(vacancy.deadline);
    const today = new Date();
    return deadline < today;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Ticket Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onToggleExpansion(vacancy.id)}
              className="flex items-center gap-2 text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              {expanded ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {vacancy.ticket_id}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      vacancy.priority_level
                    )}`}
                  >
                    {vacancy.priority_level?.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 font-medium">{vacancy.job_structure?.job_title}</p>
                <p className="text-sm text-gray-500">{vacancy.client?.organisation_name}</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-6">
            {/* Vacancy Info */}
            <div className="text-right">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{vacancy.number_of_vacancies} positions</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{vacancy.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span
                    className={`${
                      isOverdue()
                        ? "text-red-600 font-medium"
                        : isDeadlineApproaching()
                        ? "text-orange-600 font-medium"
                        : ""
                    }`}
                  >
                    {formatDate(vacancy.deadline)}
                  </span>
                </div>
              </div>
            </div>

            {/* Application Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {vacancy.applications_count}
                </div>
                <div className="text-xs text-gray-500">Applications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {vacancy.invited_count}
                </div>
                <div className="text-xs text-gray-500">Invited</div>
              </div>
            </div>

            {/* Actions */}
            {vacancy.applications_count > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenInviteModal(vacancy, [])}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail size={16} />
                  <span>Send Invites</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content - Applications */}
      {expanded && (
        <div className="p-6">
          {vacancy.applications_count === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No Applications Yet
              </h4>
              <p className="text-gray-600">
                No candidates have applied for this position.
              </p>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({vacancy.applications.length})
                    </span>
                  </label>
                  {selectedCandidates.size > 0 && (
                    <span className="text-sm text-blue-600">
                      {selectedCandidates.size} selected
                    </span>
                  )}
                </div>

                {selectedCandidates.size > 0 && (
                  <button
                    onClick={handleSendInvites}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Mail size={16} />
                    <span>
                      Send Invites to Selected ({selectedCandidates.size})
                    </span>
                  </button>
                )}
              </div>

              {/* Status Legend */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">
                  Application Status Guide:
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                    <span className="text-gray-600">Under review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Shortlisted
                    </span>
                    <span className="text-gray-600">
                      Eligible for interview
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Interviewed
                    </span>
                    <span className="text-gray-600">Interview completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Offered
                    </span>
                    <span className="text-gray-600">Job offer sent</span>
                  </div>
                </div>
              </div>

              {/* Applications List */}
              <div className="space-y-4">
                {vacancy.applications.map((application) => (
                  <CandidateCard
                    key={application.id}
                    application={application}
                    isSelected={selectedCandidates.has(
                      application.candidate_id
                    )}
                    onSelectionChange={handleCandidateSelection}
                    getStatusBadge={getStatusBadge}
                    formatDate={formatDate}
                    onViewStatus={handleViewCandidateStatus}
                    recruitmentRequestId={vacancy.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Status Tracker Modal */}
      {showStatusTracker && selectedCandidate && (
        <CandidateStatusTracker
          candidate={selectedCandidate}
          recruitmentRequestId={vacancy.id}
          onClose={handleCloseStatusTracker}
        />
      )}
    </div>
  );
};

export default TicketGroup;
