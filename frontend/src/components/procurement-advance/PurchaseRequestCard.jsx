import React from 'react';
import { Card, CardContent, CardHeader, Button } from '@/components/ui';
import { StatusBadge } from './StatusBadge';
import { 
  Calendar, 
  User, 
  Package, 
  FileText, 
  Eye,
  CheckCircle,
  XCircle
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
 * Purchase Request Card Component
 * Displays purchase request information in a card format
 */

export const PurchaseRequestCard = ({ 
  purchaseRequest, 
  variant = 'default',
  onView,
  onApprove,
  onReject,
  onCancel,
  showActions = true
}) => {
  const {
    id,
    request_code,
    status,
    created_at,
    admin_reviewed_at,
    finance_approved_at,
    requester,
    items = [],
    admin_approver,
    finance_approver
  } = purchaseRequest;

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{request_code}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Requested by {requester?.name || 'Unknown'}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Items Summary */}
          <div className="flex items-center text-sm text-gray-600">
            <Package className="w-4 h-4 mr-2" />
            <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            <span className="mx-2">•</span>
            <span className="font-semibold">{formatCurrency(totalValue)}</span>
          </div>

          {/* Date */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Requested: {formatDate(created_at)}</span>
          </div>

          {/* Approval Info */}
          {admin_reviewed_at && (
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              <span>Admin reviewed: {formatDate(admin_reviewed_at)}</span>
            </div>
          )}

          {finance_approved_at && (
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              <span>Finance approved: {formatDate(finance_approved_at)}</span>
            </div>
          )}

          {/* Items List (compact) */}
          {variant === 'detailed' && items.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Items:</h4>
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <li key={index} className="text-sm flex justify-between">
                    <span className="text-gray-700">{item.item_name || item.inventory_item?.item_name}</span>
                    <span className="text-gray-600">
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-4 border-t">
              {onView && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onView(purchaseRequest)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
              )}

              {status === 'pending' && onApprove && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => onApprove(purchaseRequest)}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Review
                </Button>
              )}

              {status === 'approved_admin' && onApprove && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => onApprove(purchaseRequest)}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              )}

              {(status === 'pending' || status === 'approved_admin') && onReject && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => onReject(purchaseRequest)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              )}

              {status === 'pending' && onCancel && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onCancel(purchaseRequest)}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseRequestCard;
