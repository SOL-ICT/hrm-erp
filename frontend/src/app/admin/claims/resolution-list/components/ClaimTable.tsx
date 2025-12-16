/**
 * Claim Table Component
 * 
 * Sortable, paginated table displaying all claims with key details.
 * Compact design with alternating row colors and dark mode support.
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - Claims Resolution List
 */

'use client';

import StatusBadge from './StatusBadge';

interface Claim {
  id: number;
  claim_number: string;
  client_name: string;
  client_contact: string;
  staff_name: string;
  staff_position: string;
  incident_date: string;
  reported_loss: number;
  status: 'client_reported' | 'sol_under_review' | 'sol_accepted' | 'sol_declined' | 'insurer_processing' | 'insurer_settled';
  sol_evaluation_status: string | null;
  insurer_claim_id: string | null;
  settlement_amount: number | null;
  evidence_count: number;
  created_at: string;
}

interface ClaimTableProps {
  claims: Claim[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export default function ClaimTable({ claims, sortBy, sortOrder, onSort }: ClaimTableProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return <span className="text-gray-400">⇅</span>;
    }
    return sortOrder === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <th
              onClick={() => onSort('claim_number')}
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-1">
                Claim # <SortIcon column="claim_number" />
              </div>
            </th>
            <th
              onClick={() => onSort('client')}
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-1">
                Client <SortIcon column="client" />
              </div>
            </th>
            <th
              onClick={() => onSort('staff')}
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-1">
                Staff Member <SortIcon column="staff" />
              </div>
            </th>
            <th
              onClick={() => onSort('incident_date')}
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-1">
                Incident Date <SortIcon column="incident_date" />
              </div>
            </th>
            <th
              onClick={() => onSort('reported_loss')}
              className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center justify-end gap-1">
                Loss <SortIcon column="reported_loss" />
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th
              onClick={() => onSort('created_at')}
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-1">
                Created <SortIcon column="created_at" />
              </div>
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {claims.map((claim, index) => (
            <tr
              key={claim.id}
              className={`${
                index % 2 === 0
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-gray-50 dark:bg-gray-800/50'
              } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-mono text-xs">
                {claim.claim_number}
              </td>
              <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                {claim.client_name}
              </td>
              <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                {claim.staff_name}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {formatDate(claim.incident_date)}
              </td>
              <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 font-semibold">
                {formatCurrency(claim.reported_loss.toString())}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={claim.status} size="sm" />
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {formatDate(claim.created_at)}
              </td>
              <td className="px-4 py-3 text-center">
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {claims.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No claims found matching your filters
          </p>
        </div>
      )}
    </div>
  );
}
