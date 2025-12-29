import React from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Ban, ArrowUpCircle } from 'lucide-react';

/**
 * ApprovalStatusBadge Component
 * 
 * Displays consistent status badges for approvals throughout the app
 * 
 * @param {string} status - Status type ('pending', 'approved', 'rejected', 'escalated', 'cancelled', 'overdue')
 * @param {string} size - Size variant ('sm', 'md', 'lg')
 * @param {boolean} showIcon - Whether to show status icon
 * @param {string} tooltip - Optional tooltip text
 * @param {string} className - Additional CSS classes
 */
const ApprovalStatusBadge = ({ 
  status, 
  size = 'md',
  showIcon = true,
  tooltip = '',
  className = ''
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

  // Approval status configurations
  const statusConfigs = {
    pending: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Clock,
      label: 'Pending',
      description: 'Awaiting approval',
    },
    'pending approval': {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Clock,
      label: 'Pending',
      description: 'Awaiting approval',
    },
    approved: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: CheckCircle,
      label: 'Approved',
      description: 'Request approved',
    },
    rejected: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: XCircle,
      label: 'Rejected',
      description: 'Request rejected',
    },
    escalated: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: ArrowUpCircle,
      label: 'Escalated',
      description: 'Escalated to higher authority',
    },
    cancelled: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: Ban,
      label: 'Cancelled',
      description: 'Request cancelled',
    },
    overdue: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: AlertTriangle,
      label: 'Overdue',
      description: 'Approval is overdue',
    },
    'in progress': {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: Clock,
      label: 'In Progress',
      description: 'Approval in progress',
    },
    completed: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: CheckCircle,
      label: 'Completed',
      description: 'Approval completed',
    },
  };

  // Get config for current status or use default
  const config = statusConfigs[normalizedStatus] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: Clock,
    label: status || 'Unknown',
    description: 'Unknown status',
  };

  const Icon = config.icon;
  const tooltipText = tooltip || config.description;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.bg} ${config.text} ${config.border}
        ${sizeClasses[size]}
        ${className}
      `}
      title={tooltipText}
    >
      {showIcon && Icon && <Icon size={iconSizes[size]} />}
      <span>{config.label}</span>
    </span>
  );
};

export default ApprovalStatusBadge;
