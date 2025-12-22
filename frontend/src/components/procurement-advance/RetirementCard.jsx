import React from 'react';
import { Card, CardContent, CardHeader, Button } from '@/components/ui';
import { StatusBadge } from './StatusBadge';
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  MessageSquare
} from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

/**
 * Retirement Card Component
 * Displays retirement submission information in a card format
 */

export const RetirementCard = ({ 
  retirement, 
  variant = 'default', // 'default', 'user-actions', 'admin-approvals'
  onView,
  onApprove,
  onReject,
  onQuery,
  onQueryResponse,
  showActions = true
}) => {
  const {
    id,
    retirement_code,
    advance,
    actual_amount_spent,
    balance_to_return,
    supporting_documents,
    items = [],
    status,
    created_at,
    reviewed_at,
    reviewer,
    query_message,
    query_response,
    queried_at,
    responded_at
  } = retirement || {};

  const totalItems = items?.length || 0;
  const hasBalance = (balance_to_return || 0) > 0;
  const hasDocuments = supporting_documents && supporting_documents.length > 0;
  const hasQuery = status === 'queried' && query_message;
  const hasQueryResponse = query_response && responded_at;

  // Render different actions based on variant and status
  const renderActions = () => {
    if (variant === 'user-actions') {
      // User can respond to queries or view their retirement
      return (
        <div className="flex flex-col gap-1">
          {hasQuery && !hasQueryResponse && onQueryResponse && (
            <button 
              onClick={() => onQueryResponse(retirement)}
              className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow transition-all duration-200 flex items-center space-x-1 w-full justify-center"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Respond</span>
            </button>
          )}
          {onView && (
            <button 
              onClick={() => onView(retirement)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 transition-all duration-200 flex items-center space-x-1 w-full justify-center"
            >
              <Eye className="w-3 h-3" />
              <span>View</span>
            </button>
          )}
        </div>
      );
    } else if (variant === 'admin-approvals') {
      // Admin approval tab - show all items, enable actions only for actionable statuses
      const canApprove = ['pending', 'submitted', 'queried'].includes(status) && hasQueryResponse !== false;
      const canReject = ['pending', 'submitted', 'queried'].includes(status);
      const canQuery = ['pending', 'submitted', 'rejected'].includes(status);
      
      return (
        <div className="flex flex-col gap-1">
          {canApprove && onApprove && (
            <button 
              onClick={() => onApprove(retirement)}
              className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow transition-all duration-200 flex items-center space-x-1 w-full justify-center"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Approve</span>
            </button>
          )}

          {canReject && onReject && (
            <button 
              onClick={() => onReject(retirement)}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow transition-all duration-200 flex items-center space-x-1 w-full justify-center"
            >
              <XCircle className="w-3 h-3" />
              <span>Reject</span>
            </button>
          )}

          {canQuery && onQuery && (
            <button 
              onClick={() => onQuery(retirement)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow transition-all duration-200 flex items-center space-x-1 w-full justify-center"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Query</span>
            </button>
          )}

          {/* Always show View button for admin */}
          {onView && (
            <button 
              onClick={() => onView(retirement)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 transition-all duration-200 flex items-center space-x-1 w-full justify-center"
            >
              <Eye className="w-3 h-3" />
              <span>View</span>
            </button>
          )}
        </div>
      );
    } else {
      // Default behavior (backward compatibility)
      return (
        <div className="flex flex-col gap-1">
          {(status === 'pending' || status === 'submitted') && onApprove && (
            <button 
              onClick={() => onApprove(retirement)}
              className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow transition-all duration-200 flex items-center space-x-1 w-full justify-center"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Approve</span>
            </button>
          )}

          {(status === 'pending' || status === 'submitted') && onReject && (
            <button 
              onClick={() => onReject(retirement)}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow transition-all duration-200 flex items-center space-x-1 w-full justify-center"
            >
              <XCircle className="w-3 h-3" />
              <span>Reject</span>
            </button>
          )}

          {(status === 'pending' || status === 'submitted' || status === 'rejected') && onQuery && (
            <button 
              onClick={() => onQuery(retirement)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow transition-all duration-200 flex items-center space-x-1 w-full justify-center"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Query</span>
            </button>
          )}

          {/* Always show View button for default variant */}
          {onView && (
            <button 
              onClick={() => onView(retirement)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 transition-all duration-200 flex items-center space-x-1 w-full justify-center"
            >
              <Eye className="w-3 h-3" />
              <span>View</span>
            </button>
          )}
        </div>
      );
    }
  };

  return (
    <div className={`group relative bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ${hasQuery ? 'ring-2 ring-yellow-300/50' : ''}`}>
      {/* Compact Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-4">
        {/* Column 1: Basic Info with Icon */}
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            hasQuery ? 'bg-yellow-100' : status === 'approved' ? 'bg-green-100' : status === 'rejected' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {hasQuery ? (
              <AlertCircle className={`w-6 h-6 text-yellow-600`} />
            ) : (
              <Receipt className={`w-6 h-6 ${status === 'approved' ? 'text-green-600' : status === 'rejected' ? 'text-red-600' : 'text-blue-600'}`} />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{advance?.advance_code || 'Unknown'}</h3>
            <p className="text-xs text-gray-600">{advance?.user?.name || 'Unknown User'}</p>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{retirement_code || `RET-${id}`}</span>
          </div>
        </div>

        {/* Column 2: Financial Summary (Inline) + Status + Metadata */}
        <div className="space-y-3">
          {/* Inline Financial Summary */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-xs text-blue-600 font-medium">Advance</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(advance?.amount || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-purple-600 font-medium">Spent</p>
              <p className="text-lg font-bold text-purple-900">{formatCurrency(actual_amount_spent || 0)}</p>
            </div>
            {hasBalance && (
              <div className="text-center">
                <p className="text-xs text-orange-600 font-medium">Balance</p>
                <p className="text-lg font-bold text-orange-900">{formatCurrency(balance_to_return || 0)}</p>
              </div>
            )}
          </div>
          
          {/* Status Badge - No longer overlapping */}
          <div className="flex justify-start">
            <StatusBadge status={status} />
          </div>
          
          {/* Metadata */}
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(created_at)}</span>
            </div>
            {totalItems > 0 && (
              <div className="flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Actions */}
        <div className="flex flex-col items-end justify-center space-y-2">
          {showActions && renderActions()}
        </div>
      </div>

      {/* Query Information Section - Modern Design */}
      {hasQuery && (
        <div className="mt-6 space-y-4">
          {/* Query from Admin */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-r-2xl p-4 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-100 p-2 rounded-xl">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-yellow-800 text-lg">Administrative Query</h4>
                <p className="text-yellow-700 font-medium mt-2 leading-relaxed">{query_message}</p>
                {queried_at && (
                  <div className="flex items-center mt-3 text-yellow-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Asked on {formatDate(queried_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Query Response */}
          {hasQueryResponse && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-r-2xl p-4 shadow-lg">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-green-800 text-lg">Your Response</h5>
                  <p className="text-green-700 font-medium mt-2 leading-relaxed">{query_response}</p>
                  {responded_at && (
                    <div className="flex items-center mt-3 text-green-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Responded on {formatDate(responded_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default RetirementCard;
