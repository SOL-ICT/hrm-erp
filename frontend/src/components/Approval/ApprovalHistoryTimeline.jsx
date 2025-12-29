import React from 'react';
import { Clock, CheckCircle, XCircle, MessageCircle, ArrowUpCircle, Ban, User } from 'lucide-react';
import ApprovalStatusBadge from './ApprovalStatusBadge';

/**
 * ApprovalHistoryTimeline Component
 * 
 * Displays a visual timeline of approval progression with dates, users, actions, and comments
 * 
 * @param {Array} history - Array of approval history records
 * @param {boolean} loading - Loading state
 * @param {string} className - Additional CSS classes
 */
const ApprovalHistoryTimeline = ({ history = [], loading = false, className = '' }) => {
  // Action icon mapping
  const actionIcons = {
    submitted: Clock,
    approved: CheckCircle,
    rejected: XCircle,
    comment: MessageCircle,
    escalated: ArrowUpCircle,
    cancelled: Ban,
    reassigned: User,
  };

  // Action color mapping
  const actionColors = {
    submitted: 'bg-blue-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    comment: 'bg-gray-500',
    escalated: 'bg-purple-500',
    cancelled: 'bg-gray-400',
    reassigned: 'bg-indigo-500',
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get action display text
  const getActionText = (action, status) => {
    const actions = {
      submitted: 'Submitted for approval',
      approved: 'Approved',
      rejected: 'Rejected',
      comment: 'Added comment',
      escalated: 'Escalated',
      cancelled: 'Cancelled',
      reassigned: 'Reassigned',
    };
    return actions[action?.toLowerCase()] || action || status;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p>No approval history available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Timeline line */}
      <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-200" />

      {/* History items */}
      <div className="space-y-6">
        {history.map((item, index) => {
          const action = item.action?.toLowerCase() || '';
          const Icon = actionIcons[action] || Clock;
          const iconColor = actionColors[action] || 'bg-gray-500';
          const isLatest = index === 0;

          return (
            <div key={item.id || index} className="relative flex gap-4">
              {/* Timeline node */}
              <div
                className={`
                  relative z-10 flex items-center justify-center
                  w-10 h-10 rounded-full border-4 border-white
                  ${iconColor}
                  ${isLatest ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                `}
              >
                <Icon size={18} className="text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {getActionText(item.action, item.to_status)}
                      </h4>
                      <p className="text-sm text-gray-600 mt-0.5">
                        by <span className="font-medium">{item.actionBy?.full_name || item.actionBy?.name || 'Unknown'}</span>
                        {item.actionBy?.designation && (
                          <span className="text-gray-500"> ({item.actionBy.designation})</span>
                        )}
                      </p>
                    </div>
                    {item.to_status && (
                      <ApprovalStatusBadge status={item.to_status} size="sm" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(item.actioned_at || item.created_at)}
                    </span>
                    {item.level && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                        Level {item.level}
                      </span>
                    )}
                  </div>

                  {/* Comments */}
                  {item.comments && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-100">
                      <div className="flex items-start gap-2">
                        <MessageCircle size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{item.comments}</p>
                      </div>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {item.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 rounded border border-red-100">
                      <p className="text-sm text-red-700">
                        <strong>Reason:</strong> {item.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Escalation info */}
                  {item.escalation_reason && (
                    <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-100">
                      <p className="text-sm text-purple-700">
                        <strong>Escalation reason:</strong> {item.escalation_reason}
                      </p>
                      {item.escalated_to && (
                        <p className="text-sm text-purple-600 mt-1">
                          Escalated to: {item.escalated_to.full_name || item.escalated_to.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Level progression indicator */}
                  {item.from_status !== item.to_status && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      {item.from_status && (
                        <>
                          <ApprovalStatusBadge status={item.from_status} size="sm" showIcon={false} />
                          <span>→</span>
                        </>
                      )}
                      {item.to_status && (
                        <ApprovalStatusBadge status={item.to_status} size="sm" showIcon={false} />
                      )}
                    </div>
                  )}
                </div>

                {/* Latest indicator */}
                {isLatest && (
                  <div className="absolute -right-2 top-0 px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded shadow">
                    Latest
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApprovalHistoryTimeline;
