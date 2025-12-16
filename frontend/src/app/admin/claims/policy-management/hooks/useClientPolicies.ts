/**
 * Client Policy Management Hook
 * 
 * Manages CRUD operations for client fidelity insurance policies.
 * Handles fetching, creating, updating policies with proper error handling.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface Policy {
  id: number;
  client_id: number;
  policy_aggregate_limit: number;
  policy_single_limit: number;
  policy_start_date: string | null;
  policy_end_date: string | null;
  policy_number: string | null;
  insurer_name: string | null;
  status: 'active' | 'expired' | 'suspended';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: number;
  name: string;
}

export function useClientPolicies(clientId?: number) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [activePolicy, setActivePolicy] = useState<Policy | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/claims/resolution/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch clients');
      
      const data = await response.json();
      setClients(data.clients || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchPolicies = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/admin/clients/${id}/policies`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch policies');
      
      const data = await response.json();
      setPolicies(data.policies || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActivePolicy = useCallback(async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/clients/${id}/policies/active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivePolicy(data.policy);
      } else {
        setActivePolicy(null);
      }
    } catch (err: any) {
      setActivePolicy(null);
    }
  }, []);

  const createPolicy = async (id: number, policyData: Partial<Policy>) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/clients/${id}/policies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(policyData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create policy');
      }

      const data = await response.json();
      await fetchPolicies(id);
      await fetchActivePolicy(id);
      return data.policy;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updatePolicy = async (id: number, policyId: number, policyData: Partial<Policy>) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/clients/${id}/policies/${policyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(policyData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update policy');
      }

      const data = await response.json();
      await fetchPolicies(id);
      await fetchActivePolicy(id);
      return data.policy;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deletePolicy = async (id: number, policyId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/clients/${id}/policies/${policyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete policy');

      await fetchPolicies(id);
      await fetchActivePolicy(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (clientId) {
      fetchPolicies(clientId);
      fetchActivePolicy(clientId);
    }
  }, [clientId, fetchPolicies, fetchActivePolicy]);

  return {
    policies,
    activePolicy,
    clients,
    loading,
    error,
    fetchPolicies,
    fetchActivePolicy,
    createPolicy,
    updatePolicy,
    deletePolicy,
  };
}
