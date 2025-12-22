import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  DollarSign,
  FileCheck,
  Ban
} from 'lucide-react';

/**
 * Status Badge Component
 * Displays status with appropriate color and icon
 */

export const StatusBadge = ({ status, size = 'md', showIcon = true }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const normalizedStatus = status?.toLowerCase();

  const statusConfig = {
  // Purchase Request statuses
  pending: { 
    label: 'Pending', 
    variant: 'secondary', 
    icon: Clock,
    className: 'bg-gray-100 text-gray-800'
  },
  approved_admin: { 
    label: 'Admin Approved', 
    variant: 'default', 
    icon: CheckCircle,
    className: 'bg-blue-100 text-blue-800'
  },
  approved_finance: { 
    label: 'Finance Approved', 
    variant: 'default', 
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800'
  },
  rejected: { 
    label: 'Rejected', 
    variant: 'destructive', 
    icon: XCircle,
    className: 'bg-red-100 text-red-800'
  },
  cancelled: { 
    label: 'Cancelled', 
    variant: 'outline', 
    icon: Ban,
    className: 'bg-gray-100 text-gray-600'
  },
  completed: { 
    label: 'Completed', 
    variant: 'default', 
    icon: FileCheck,
    className: 'bg-green-100 text-green-800'
  },

  // Advance statuses
  approved: { 
    label: 'Approved', 
    variant: 'default', 
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800'
  },
  disbursed: { 
    label: 'Disbursed', 
    variant: 'default', 
    icon: DollarSign,
    className: 'bg-blue-100 text-blue-800'
  },
  retired: { 
    label: 'Retired', 
    variant: 'default', 
    icon: FileCheck,
    className: 'bg-purple-100 text-purple-800'
  },
  overdue: { 
    label: 'Overdue', 
    variant: 'destructive', 
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800'
  },

  // Retirement statuses
  queried: { 
    label: 'Queried', 
    variant: 'default', 
    icon: AlertCircle,
    className: 'bg-yellow-100 text-yellow-800'
  },
};

const config = statusConfig[normalizedStatus] || statusConfig.pending;
const Icon = config.icon;
const iconSize = iconSizes[size];

return (
  <span 
    className={`inline-flex items-center gap-1 rounded-full font-medium border ${config.className} ${sizeClasses[size]}`}
  >
    {showIcon && <Icon size={iconSize} />}
    {config.label}
  </span>
);
};

export default StatusBadge;
