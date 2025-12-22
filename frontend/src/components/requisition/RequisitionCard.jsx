import React from 'react';
import { FileText, User, Calendar, Package, MapPin, Building2, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

/**
 * RequisitionCard Component
 * 
 * Displays requisition summary with status, items, and actions
 * 
 * @param {Object} requisition - Requisition object
 * @param {Function} onViewDetails - Callback when view details is clicked
 * @param {Function} onApprove - Callback for approve action (Store Keeper)
 * @param {Function} onReject - Callback for reject action (Store Keeper)
 * @param {Function} onCancel - Callback for cancel action (Staff)
 * @param {Function} onMarkReady - Callback for mark ready action (Store Keeper)
 * @param {Function} onMarkCollected - Callback for mark collected action (Store Keeper)
 * @param {string} userRole - Current user's role for conditional actions
 * @param {string} variant - Display variant ('compact', 'detailed')
 */
const RequisitionCard = ({ 
  requisition,
  onViewDetails,
  onApprove,
  onReject,
  onCancel,
  onMarkReady,
  onMarkCollected,
  userRole = 'staff',
  variant = 'compact'
}) => {
  const {
    id,
    requisition_code,
    user,
    department,
    branch,
    request_date,
    status,
    collection_status,
    approved_by,
    approval_date,
    rejection_reason,
    items = [],
    total_items,
  } = requisition;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate total items
  const itemCount = total_items || items.length;

  // Determine available actions
  const canApprove = userRole === 'store_keeper' && status === 'pending';
  const canReject = userRole === 'store_keeper' && status === 'pending';
  const canCancel = userRole === 'staff' && status === 'pending';
  const canMarkReady = userRole === 'store_keeper' && status === 'approved' && collection_status === 'pending';
  const canMarkCollected = userRole === 'store_keeper' && status === 'approved' && collection_status === 'ready';

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 border border-gray-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} className="text-gray-500" />
              <h3 className="font-bold text-gray-900">{requisition_code}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} type="requisition" size="sm" />
              <StatusBadge status={collection_status} type="collection" size="sm" />
            </div>
          </div>
          <button
            onClick={() => onViewDetails?.(requisition)}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <User size={14} className="flex-shrink-0" />
            <span className="truncate">{user?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} className="flex-shrink-0" />
            <span>{formatDate(request_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Building2 size={14} className="flex-shrink-0" />
            <span className="truncate">{department}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Package size={14} className="flex-shrink-0" />
            <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Actions */}
        {(canApprove || canReject || canCancel || canMarkReady || canMarkCollected) && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            {canApprove && (
              <button
                onClick={() => onApprove?.(requisition)}
                className="flex-1 py-2 px-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                Approve
              </button>
            )}
            {canReject && (
              <button
                onClick={() => onReject?.(requisition)}
                className="flex-1 py-2 px-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold text-sm"
              >
                Reject
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel?.(requisition)}
                className="flex-1 py-2 px-3 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
            )}
            {canMarkReady && (
              <button
                onClick={() => onMarkReady?.(requisition)}
                className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold text-sm"
              >
                Mark Ready
              </button>
            )}
            {canMarkCollected && (
              <button
                onClick={() => onMarkCollected?.(requisition)}
                className="flex-1 py-2 px-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                Mark Collected
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-xl">{requisition_code}</h3>
              <p className="text-sm text-gray-600">Requested on {formatDate(request_date)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} type="requisition" size="md" />
            <StatusBadge status={collection_status} type="collection" size="md" />
          </div>
        </div>
        <button
          onClick={() => onViewDetails?.(requisition)}
          className="ml-4 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-semibold flex items-center gap-2"
        >
          View Details
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <User size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="text-xs text-gray-600">Requested By</div>
            <div className="font-semibold text-gray-900">{user?.name || 'Unknown'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Building2 size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="text-xs text-gray-600">Department</div>
            <div className="font-semibold text-gray-900">{department}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <MapPin size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="text-xs text-gray-600">Branch</div>
            <div className="font-semibold text-gray-900">{branch}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Package size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="text-xs text-gray-600">Total Items</div>
            <div className="font-semibold text-gray-900">{itemCount} item{itemCount !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Items preview */}
      {items.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package size={16} />
            Requested Items
          </h4>
          <div className="space-y-2">
            {items.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">
                    {item.inventory_item?.name || 'Item'}
                  </div>
                  {item.purpose && (
                    <div className="text-xs text-gray-600 mt-1">{item.purpose}</div>
                  )}
                </div>
                <div className="text-sm font-bold text-gray-900 ml-4">
                  Qty: {item.quantity}
                </div>
              </div>
            ))}
            {items.length > 3 && (
              <div className="text-center text-sm text-gray-600 py-2">
                +{items.length - 3} more item{items.length - 3 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection reason */}
      {status === 'rejected' && rejection_reason && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="font-semibold text-red-900 mb-1">Rejection Reason</div>
          <div className="text-sm text-red-700">{rejection_reason}</div>
        </div>
      )}

      {/* Actions */}
      {(canApprove || canReject || canCancel || canMarkReady || canMarkCollected) && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          {canApprove && (
            <button
              onClick={() => onApprove?.(requisition)}
              className="flex-1 py-3 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold"
            >
              Approve Requisition
            </button>
          )}
          {canReject && (
            <button
              onClick={() => onReject?.(requisition)}
              className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold"
            >
              Reject Requisition
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onCancel?.(requisition)}
              className="flex-1 py-3 px-4 rounded-lg border-2 border-red-300 text-red-700 hover:bg-red-50 transition-colors font-semibold"
            >
              Cancel Requisition
            </button>
          )}
          {canMarkReady && (
            <button
              onClick={() => onMarkReady?.(requisition)}
              className="flex-1 py-3 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
            >
              Mark Items Ready
            </button>
          )}
          {canMarkCollected && (
            <button
              onClick={() => onMarkCollected?.(requisition)}
              className="flex-1 py-3 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold"
            >
              Mark as Collected
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RequisitionCard;
