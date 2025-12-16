/**
 * Claims List Hook
 * 
 * State management for Claims Resolution List page.
 * Handles fetching, filtering, sorting, pagination, and export.
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - Claims Resolution List API
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface FilterState {
  search: string;
  client_id: string;
  from_date: string;
  to_date: string;
  status: string[];
}

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

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export function useClaimsList() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    client_id: '',
    from_date: '',
    to_date: '',
    status: []
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.client_id) params.append('client_id', filters.client_id);
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);
      if (filters.status.length > 0) {
        filters.status.forEach(s => params.append('status[]', s));
      }
      
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      params.append('page', page.toString());
      params.append('per_page', '20');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/admin/claims/list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch claims: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      setClaims(data.data);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        per_page: data.per_page,
        total: data.total
      });
    } catch (error) {
      console.error('Error fetching claims:', error);
      alert('Failed to load claims. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page on sort change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = async (format: 'excel' | 'pdf', exportFilters: Record<string, any>) => {
    try {
      const params = new URLSearchParams();
      
      if (exportFilters.search) params.append('search', exportFilters.search);
      if (exportFilters.client_id) params.append('client_id', exportFilters.client_id);
      if (exportFilters.from_date) params.append('from_date', exportFilters.from_date);
      if (exportFilters.to_date) params.append('to_date', exportFilters.to_date);
      if (exportFilters.status?.length > 0) {
        exportFilters.status.forEach((s: string) => params.append('status[]', s));
      }
      
      params.append('format', format);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/admin/claims/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claims-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  };

  return {
    claims,
    loading,
    filters,
    sortBy,
    sortOrder,
    pagination,
    handleFilterChange,
    handleSort,
    handlePageChange,
    handleExport
  };
}
