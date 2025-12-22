import React from 'react';
import { Card, CardContent, CardHeader, Button } from '@/components/ui';
import { StatusBadge } from './StatusBadge';
import { 
  Calendar, 
  User, 
  DollarSign, 
  Building, 
  Eye,
  CheckCircle,
  XCircle,
  Banknote,
  AlertTriangle
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
 * Advance Card Component
 * Displays advance request information in a card format
 */

export const AdvanceCard = ({ 
  advance, 
  variant = 'default',
  onView,
  onApprove,
  onReject,
  onDisburse,
  onRetire,
  showActions = true
}) => {
  const {
    id,
    advance_code,
    amount,
    purpose,
    office,
    budget_line,
    status,
    created_at,
    approved_at,
    disbursed_at,
    retirement_due_date,
    user,
    approver,
    retirement
  } = advance;

  const isOverdue = status === 'overdue';
  const isDisbursed = status === 'disbursed';
  const needsRetirement = isDisbursed && !retirement;

  const budgetLineLabels = {
    operational: 'Operational',
    capital: 'Capital',
    emergency: 'Emergency',
    training: 'Training',
    travel: 'Travel',
    miscellaneous: 'Miscellaneous'
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isOverdue ? 'border-red-300' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{advance_code}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {user?.name || 'Unknown User'}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Amount */}
          <div className="flex items-center text-lg font-semibold text-gray-900">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            <span>{formatCurrency(amount)}</span>
          </div>

          {/* Office */}
          <div className="flex items-center text-sm text-gray-600">
            <Building className="w-4 h-4 mr-2" />
            <span>{office}</span>
            <span className="mx-2">•</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {budgetLineLabels[budget_line] || budget_line}
            </span>
          </div>

          {/* Purpose */}
          {variant === 'detailed' && (
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">Purpose:</p>
              <p>{purpose}</p>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Requested: {formatDate(created_at)}</span>
          </div>

          {/* Approval Info */}
          {approved_at && (
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              <span>Approved: {formatDate(approved_at)}</span>
            </div>
          )}

          {/* Disbursement Info */}
          {disbursed_at && (
            <div className="flex items-center text-sm text-gray-600">
              <Banknote className="w-4 h-4 mr-2 text-blue-600" />
              <span>Disbursed: {formatDate(disbursed_at)}</span>
            </div>
          )}

          {/* Retirement Due Date */}
          {retirement_due_date && (
            <div className={`flex items-center text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
              {isOverdue ? (
                <AlertTriangle className="w-4 h-4 mr-2" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              <span>Retirement due: {formatDate(retirement_due_date)}</span>
            </div>
          )}

          {/* Retirement Status */}
          {retirement && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Retirement Status:</span>
                <StatusBadge status={retirement.status} size="sm" />
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-4 border-t">
              {onView && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onView(advance)}
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
                  onClick={() => onApprove(advance)}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              )}

              {status === 'pending' && onReject && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => onReject(advance)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              )}

              {status === 'approved' && onDisburse && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => onDisburse(advance)}
                  className="flex-1"
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Disburse
                </Button>
              )}

              {(status === 'disbursed' || status === 'overdue') && !retirement && onRetire && (
                <Button 
                  variant={isOverdue ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => onRetire(advance)}
                  className="flex-1"
                >
                  Retire Advance
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvanceCard;
