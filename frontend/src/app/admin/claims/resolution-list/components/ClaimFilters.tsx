/**
 * Claim Filters Component
 * 
 * Provides filtering controls for claims list including status,
 * client, date range, and search.
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - Claims Resolution List
 */

'use client';

import { useState, useEffect } from 'react';

interface ClaimFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  status: string[];
  client_id: string;
  from_date: string;
  to_date: string;
  search: string;
}

export default function ClaimFilters({ onFilterChange }: ClaimFiltersProps) {
  console.log('🔍 ClaimFilters component mounted');
  
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    client_id: '',
    from_date: '',
    to_date: '',
    search: ''
  });

  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([]);
  console.log('📊 Current clients state:', clients);

  useEffect(() => {
    console.log('🚀 ClaimFilters useEffect running - fetching clients');
    // Fetch clients for dropdown
    const fetchClients = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        console.log('Fetching clients from:', `${apiUrl}/admin/claims/resolution/clients`);
        const response = await fetch(`${apiUrl}/admin/claims/resolution/clients`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Clients response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Clients data received:', data);
          setClients(data.clients || []);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch clients - Status:', response.status, 'Response:', errorText);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      }
    };
    fetchClients();
  }, []);

  const statusOptions = [
    { value: 'client_reported', label: 'Client Reported', icon: '🟡' },
    { value: 'sol_under_review', label: 'SOL Under Review', icon: '🔵' },
    { value: 'sol_accepted', label: 'SOL Accepted', icon: '✅' },
    { value: 'sol_declined', label: 'SOL Declined', icon: '❌' },
    { value: 'insurer_processing', label: 'Insurer Processing', icon: '🏢' },
    { value: 'insurer_settled', label: 'Insurer Settled', icon: '💰' }
  ];

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    const newFilters = { ...filters, status: newStatus };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      status: [],
      client_id: '',
      from_date: '',
      to_date: '',
      search: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Claim number, client, staff..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Client */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Client
          </label>
          <select
            value={filters.client_id}
            onChange={(e) => handleChange('client_id', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Reset Filters
          </button>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            From Date
          </label>
          <input
            type="date"
            value={filters.from_date}
            onChange={(e) => handleChange('from_date', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            To Date
          </label>
          <input
            type="date"
            value={filters.to_date}
            onChange={(e) => handleChange('to_date', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Status Filters */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusToggle(option.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                filters.status.includes(option.value)
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
