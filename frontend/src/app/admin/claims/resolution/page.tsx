/**
 * Claims Resolution Page
 * 
 * Main dashboard for managing fidelity claims - shows statistics,
 * active claims needing attention, and provides accept/decline actions.
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - Claims Resolution Page
 */

'use client';

import { useState } from 'react';
import StatsCard from './components/StatsCard';
import ClaimCard from './components/ClaimCard';
import NewClaimModal from './components/NewClaimModal';
import { useClaimsResolution } from './hooks/useClaimsResolution';

export default function ClaimsResolutionPage() {
  const { stats, activeClaims, isLoading, acceptClaim, declineClaim, fileWithInsurer, markAsSettled, refetch } = useClaimsResolution();
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);

  const handleAccept = async (id: number) => {
    if (confirm('Are you sure you want to accept this claim?')) {
      const notes = prompt('Enter evaluation notes (required):');
      if (!notes) return;
      
      setActioningId(id);
      try {
        await acceptClaim(id, notes);
      } catch (error) {
        alert('Failed to accept claim. Please try again.');
      } finally {
        setActioningId(null);
      }
    }
  };

  const handleDecline = async (id: number) => {
    if (confirm('Are you sure you want to decline this claim? This action cannot be undone.')) {
      const notes = prompt('Enter decline reason (required):');
      if (!notes) return;
      
      setActioningId(id);
      try {
        await declineClaim(id, notes);
      } catch (error) {
        alert('Failed to decline claim. Please try again.');
      } finally {
        setActioningId(null);
      }
    }
  };

  const handleFileInsurer = async (id: number) => {
    if (confirm('File this claim with the insurance company?')) {
      setActioningId(id);
      try {
        await fileWithInsurer(id);
        alert('Claim successfully filed with insurer!');
      } catch (error) {
        alert('Failed to file claim. Please try again.');
      } finally {
        setActioningId(null);
      }
    }
  };

  const handleMarkSettled = async (id: number) => {
    const amountStr = prompt('Enter settlement amount received:');
    if (!amountStr) return;
    
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid settlement amount.');
      return;
    }

    const notes = prompt('Enter settlement notes (optional):') || undefined;
    
    setActioningId(id);
    try {
      await markAsSettled(id, amount, notes);
      alert('Claim marked as settled successfully!');
    } catch (error) {
      alert('Failed to mark claim as settled. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Create Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Fidelity Claims Resolution
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Evaluate and process client-reported fidelity claims
          </p>
        </div>
        <button
          onClick={() => setShowNewClaimModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Claim
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Claims"
          value={stats?.total_claims || 0}
          color="gray"
          icon="📋"
        />
        <StatsCard
          title="Pending Review"
          value={(stats?.client_reported || 0) + (stats?.sol_under_review || 0)}
          color="orange"
          icon="⏳"
          subtitle="Requires SOL action"
        />
        <StatsCard
          title="Total Exposure"
          value={formatCurrency(stats?.total_exposure || 0)}
          color="red"
          icon="💰"
        />
        <StatsCard
          title="Settled Amount"
          value={formatCurrency(stats?.settled_amount || 0)}
          color="green"
          icon="✅"
        />
      </div>

      {/* Active Claims Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Active Claims
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Claims requiring attention or in progress
          </p>
        </div>

        <div className="p-6 space-y-4">
          {activeClaims.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No active claims at the moment
              </p>
            </div>
          ) : (
            activeClaims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onFileInsurer={handleFileInsurer}
                onMarkSettled={handleMarkSettled}
              />
            ))
          )}
        </div>
      </div>

      {/* New Claim Modal */}
      <NewClaimModal
        isOpen={showNewClaimModal}
        onClose={() => setShowNewClaimModal(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
