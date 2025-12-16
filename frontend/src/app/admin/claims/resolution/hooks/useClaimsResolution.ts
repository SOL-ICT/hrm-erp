/**
 * useClaimsResolution Hook
 * 
 * Manages claims resolution state including dashboard stats,
 * active claims, and claim actions (accept/decline/file).
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - API Endpoints
 */

'use client';

import { useState, useEffect } from 'react';

interface ClaimStats {
  total_claims: number;
  client_reported: number;
  sol_under_review: number;
  sol_accepted: number;
  sol_declined: number;
  insurer_processing: number;
  insurer_settled: number;
  total_exposure: number;
  settled_amount: number;
}

interface Claim {
  id: number;
  claim_number: string;
  client_id: number;
  client_name: string;
  client_contact: string;
  client_email: string;
  staff_id: number;
  staff_name: string;
  staff_position: string;
  assignment_start_date: string;
  incident_date: string;
  incident_description: string;
  reported_loss: string;
  policy_single_limit: string;
  policy_aggregate_limit: string;
  status: 'client_reported' | 'sol_under_review' | 'sol_accepted' | 'sol_declined' | 'insurer_processing' | 'insurer_settled';
  sol_evaluation_status?: string;
  sol_notes?: string;
  insurer_claim_id?: string;
  insurer_status?: string;
  settlement_amount?: string;
  evidence_count: number;
  created_at: string;
}

export function useClaimsResolution() {
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [activeClaims, setActiveClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/api/admin/claims/resolution', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data.stats);
      setActiveClaims(data.active_claims || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptClaim = async (claimId: number, notes: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/claims/resolution/${claimId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: notes })
      });

      if (!response.ok) {
        throw new Error('Failed to accept claim');
      }
      
      // Optimistic update
      setActiveClaims(prev => prev.map(claim =>
        claim.id === claimId
          ? { ...claim, status: 'sol_accepted' }
          : claim
      ));
      
      // Refresh data
      await fetchDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to accept claim');
      throw err;
    }
  };

  const declineClaim = async (claimId: number, notes: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/claims/resolution/${claimId}/decline`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: notes })
      });

      if (!response.ok) {
        throw new Error('Failed to decline claim');
      }
      
      // Remove from active claims
      setActiveClaims(prev => prev.filter(claim => claim.id !== claimId));
      
      // Refresh data
      await fetchDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to decline claim');
      throw err;
    }
  };

  const fileWithInsurer = async (claimId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/claims/resolution/${claimId}/file-insurer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to file with insurer');
      }

      const data = await response.json();
      
      // Update claim with insurer ID
      setActiveClaims(prev => prev.map(claim =>
        claim.id === claimId
          ? { 
              ...claim, 
              status: 'insurer_processing',
              insurer_claim_id: data.insurer_claim_id 
            }
          : claim
      ));
      
      // Refresh data
      await fetchDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to file with insurer');
      throw err;
    }
  };

  const markAsSettled = async (claimId: number, settlementAmount: number, settlementNotes?: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/claims/resolution/${claimId}/settle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          settlement_amount: settlementAmount,
          settlement_notes: settlementNotes 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark claim as settled');
      }
      
      // Remove from active claims (settled claims don't show in active)
      setActiveClaims(prev => prev.filter(claim => claim.id !== claimId));
      
      // Refresh data
      await fetchDashboard();
    } catch (err: any) {
      setError(err.message || 'Failed to mark claim as settled');
      throw err;
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    stats,
    activeClaims,
    isLoading,
    error,
    acceptClaim,
    declineClaim,
    fileWithInsurer,
    markAsSettled,
    refetch: () => {
      fetchDashboard();
    }
  };
}
