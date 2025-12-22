import React from 'react';
import { Clock, CheckCircle, XCircle, Package, Ban } from 'lucide-react';

/**
 * StatusBadge Component
 * 
 * Displays consistent status badges for requisitions throughout the app
 * 
 * @param {string} status - Status type ('pending', 'approved', 'rejected', 'cancelled')
 * @param {string} type - Badge type ('requisition' or 'collection')
 * @param {string} size - Size variant ('sm', 'md', 'lg')
 * @param {boolean} showIcon - Whether to show status icon
 */
const StatusBadge = ({ 
  status, 
  type = 'requisition', 
  size = 'md',
  showIcon = true 
}) => {
  // Normalize status to lowercase
  const normalizedStatus = status?.toLowerCase();

  // Size classes
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

  // Requisition status configurations
  const requisitionStatuses = {
    pending: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Clock,
      label: 'Pending',
    },
    approved: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: CheckCircle,
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: XCircle,
      label: 'Rejected',
    },
    cancelled: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: Ban,
      label: 'Cancelled',
    },
  };

  // Collection status configurations
  const collectionStatuses = {
    pending: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Clock,
      label: 'Pending',
    },
    ready: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: Package,
      label: 'Ready',
    },
    collected: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: CheckCircle,
      label: 'Collected',
    },
    cancelled: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: Ban,
      label: 'Cancelled',
    },
  };

  // Select appropriate status config
  const statusConfig = type === 'collection' 
    ? collectionStatuses[normalizedStatus]
    : requisitionStatuses[normalizedStatus];

  // Fallback if status not found
  if (!statusConfig) {
    return (
      <span className={`${sizeClasses[size]} font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200 inline-flex items-center gap-1.5`}>
        {status}
      </span>
    );
  }

  const Icon = statusConfig.icon;

  return (
    <span 
      className={`
        ${sizeClasses[size]} 
        ${statusConfig.bg} 
        ${statusConfig.text} 
        font-semibold 
        rounded-full 
        border 
        ${statusConfig.border}
        inline-flex 
        items-center 
        gap-1.5
        transition-all
        duration-200
      `}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {statusConfig.label}
    </span>
  );
};

export default StatusBadge;
