// File: frontend/src/components/admin/modules/recruitment-management/submodules/current-vacancies/CandidateCard.jsx

"use client";

import {
  User,
  Phone,
  Mail as MailIcon,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  FileText,
  Calendar,
} from "lucide-react";

const CandidateCard = ({
  application,
  isSelected,
  onSelectionChange,
  getStatusBadge,
  formatDate,
  onViewStatus, // New prop for viewing status
  recruitmentRequestId, // New prop for recruitment request ID
}) => {
  const handleSelectionChange = (e) => {
    onSelectionChange(application.candidate_id, e.target.checked);
  };

  // Extract candidate information from the nested structure
  const candidate = application.candidate || {};
  const candidateName = candidate.first_name && candidate.last_name 
    ? `${candidate.first_name} ${candidate.last_name}` 
    : 'Unknown Candidate';
  const candidateEmail = candidate.email || 'No email provided';
  const candidatePhone = candidate.phone || null;

  const getInvitationStatusIcon = (status) => {
    const iconMap = {
      sent: <Clock size={16} className="text-blue-500" />,
      pending: <Clock size={16} className="text-yellow-500" />,
      accepted: <CheckCircle2 size={16} className="text-green-500" />,
      declined: <XCircle size={16} className="text-red-500" />,
      expired: <AlertCircle size={16} className="text-gray-500" />,
    };
    return iconMap[status] || <Clock size={16} className="text-gray-400" />;
  };

  const getInvitationStatusText = (status) => {
    const textMap = {
      sent: "Invitation Sent",
      pending: "Response Pending",
      accepted: "Invitation Accepted",
      declined: "Invitation Declined",
      expired: "Invitation Expired",
    };
    return textMap[status] || "No Invitation";
  };

  const handleViewStatus = () => {
    if (onViewStatus) {
      onViewStatus(candidate, recruitmentRequestId);
    }
  };

  return (
    <div
      className={`border border-gray-200 rounded-lg p-4 transition-all hover:shadow-md ${
        isSelected ? "bg-blue-50 border-blue-300" : "bg-white"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Selection Checkbox */}
        <div className="flex items-center pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectionChange}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        {/* Candidate Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Name and Contact */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} className="text-gray-400" />
                  <h4 className="font-semibold text-gray-900">
                    {candidateName}
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MailIcon size={14} />
                    <span>{candidateEmail}</span>
                  </div>
                  {candidatePhone && (
                    <div className="flex items-center gap-1">
                      <Phone size={14} />
                      <span>{candidatePhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Applied:</span>
                  <div className="font-medium">
                    {formatDate(application.applied_at)}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className="mt-1">
                    {getStatusBadge(application.status)}
                  </div>
                </div>
              </div>

              {/* Quick Status Indicators */}
              <div className="mt-3 flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <FileText size={12} />
                  <span className={application.has_test ? "text-green-600" : "text-gray-400"}>
                    {application.has_test ? "Test Sent" : "No Test"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span className={application.has_invitation ? "text-blue-600" : "text-gray-400"}>
                    {application.has_invitation ? "Interview Sent" : "No Interview"}
                  </span>
                </div>
                <button
                  onClick={handleViewStatus}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                  title="View complete status history"
                >
                  <Eye size={12} />
                  <span>View Status</span>
                </button>
              </div>
            </div>

            {/* Interview Invitation Status */}
            <div className="ml-4 text-right">
              {application.has_invitation ? (
                <div className="flex items-center gap-2 text-sm">
                  {getInvitationStatusIcon(application.invitation_status)}
                  <span className="font-medium">
                    {getInvitationStatusText(application.invitation_status)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={16} className="text-gray-400" />
                  <span>No invitation sent</span>
                </div>
              )}

              {application.last_invitation_sent && (
                <div className="text-xs text-gray-500 mt-1">
                  Sent: {formatDate(application.last_invitation_sent)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;
