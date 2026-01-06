/**
 * Claim Card Component
 * 
 * Compact claim display with status flow, details, and action buttons.
 * Shows different actions based on claim status.
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - Frontend Components
 */

'use client';

import { useState } from 'react';
import ClaimStatusFlow from './ClaimStatusFlow';
import StatusBadge from '../../resolution-list/components/StatusBadge';

interface Claim {
  id: number;
  claim_number: string;
  client_id: number;
  client_name: string;
  staff_id: number;
  staff_name: string;
  staff_position: string;
  incident_description: string;
  reported_loss: string;
  policy_single_limit: string;
  status: 'client_reported' | 'sol_under_review' | 'sol_accepted' | 'sol_declined' | 'insurer_processing' | 'insurer_settled';
  insurer_claim_id?: string;
  created_at: string;
}

interface ClaimCardProps {
  claim: Claim;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  onFileInsurer: (id: number) => void;
  onMarkSettled: (id: number) => void;
}

export default function ClaimCard({ claim, onAccept, onDecline, onFileInsurer, onMarkSettled }: ClaimCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const canTakeAction = () => {
    return claim.status === 'client_reported' || claim.status === 'sol_under_review';
  };

  const canFileInsurer = () => {
    return claim.status === 'sol_accepted' && !claim.insurer_claim_id;
  };

  const canMarkSettled = () => {
    return claim.status === 'insurer_processing';
  };

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Claim #{claim.claim_number}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {claim.client_name} • {claim.staff_name}
          </p>
        </div>
        <StatusBadge status={claim.status} size="sm" />
      </div>

      {/* Status Flow */}
      <ClaimStatusFlow status={claim.status} />

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="space-y-1">
          <div className="text-xs">
            <span className="font-medium text-gray-700 dark:text-gray-300">Staff Position: </span>
            <span className="text-gray-900 dark:text-gray-100">{claim.staff_position}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs">
            <span className="font-medium text-gray-700 dark:text-gray-300">Reported Loss: </span>
            <span className="text-red-600 dark:text-red-400 font-semibold">
              {formatCurrency(claim.reported_loss)}
            </span>
          </div>
          <div className="text-xs">
            <span className="font-medium text-gray-700 dark:text-gray-300">Policy Limit: </span>
            <span className="text-gray-900 dark:text-gray-100">
              {formatCurrency(claim.policy_single_limit)}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs">
            <span className="font-medium text-gray-700 dark:text-gray-300">Created: </span>
            <span className="text-gray-900 dark:text-gray-100">{formatDate(claim.created_at)}</span>
          </div>
          {claim.insurer_claim_id && (
            <div className="text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">Insurer ID: </span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-[10px]">
                {claim.insurer_claim_id}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <p className={`text-xs text-gray-700 dark:text-gray-300 leading-relaxed ${!isExpanded && 'line-clamp-2'}`}>
          {claim.incident_description}
        </p>
        {claim.incident_description.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          {canTakeAction() && (
            <>
              <button
                onClick={() => onAccept(claim.id)}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                <span>✅</span>
                <span>Accept</span>
              </button>
              <button
                onClick={() => onDecline(claim.id)}
                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                <span>❌</span>
                <span>Decline</span>
              </button>
            </>
          )}
          {canFileInsurer() && (
            <button
              onClick={() => onFileInsurer(claim.id)}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <span>🏢</span>
              <span>File with Insurer</span>
            </button>
          )}
          {canMarkSettled() && (
            <button
              onClick={() => onMarkSettled(claim.id)}
              className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"
            >
              <span>💰</span>
              <span>Mark as Settled</span>
            </button>
          )}
        </div>
        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium">
          View Details →
        </button>
      </div>
    </div>
  );
}
