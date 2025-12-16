/**
 * Status Badge Component
 * 
 * Displays claim status with appropriate color coding and icon.
 * Supports all 6 claim statuses with dark mode.
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - Styling Guidelines
 */

interface StatusBadgeProps {
  status: 'client_reported' | 'sol_under_review' | 'sol_accepted' | 'sol_declined' | 'insurer_processing' | 'insurer_settled';
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const configs = {
    client_reported: {
      label: 'Client Reported',
      icon: '🟡',
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800'
    },
    sol_under_review: {
      label: 'SOL Under Review',
      icon: '🔵',
      classes: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800'
    },
    sol_accepted: {
      label: 'SOL Accepted',
      icon: '✅',
      classes: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800'
    },
    sol_declined: {
      label: 'SOL Declined',
      icon: '❌',
      classes: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800'
    },
    insurer_processing: {
      label: 'Insurer Processing',
      icon: '🏢',
      classes: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800'
    },
    insurer_settled: {
      label: 'Insurer Settled',
      icon: '💰',
      classes: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800'
    }
  };

  const config = configs[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full border ${sizeClasses} ${config.classes}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
