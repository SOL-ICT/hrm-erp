/**
 * Policy Form Modal
 * 
 * Modal for creating/editing client fidelity insurance policies.
 * Handles all policy fields with validation.
 */

'use client';

import { useState, useEffect } from 'react';

interface Policy {
  id?: number;
  policy_aggregate_limit: number;
  policy_single_limit: number;
  policy_start_date: string;
  policy_end_date: string;
  policy_number: string;
  insurer_name: string;
  status: 'active' | 'expired' | 'suspended';
  notes: string;
}

interface PolicyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (policy: Partial<Policy>) => Promise<void>;
  policy?: Policy | null;
  clientName: string;
}

export default function PolicyFormModal({ isOpen, onClose, onSubmit, policy, clientName }: PolicyFormModalProps) {
  const [formData, setFormData] = useState<Partial<Policy>>({
    policy_aggregate_limit: 0,
    policy_single_limit: 0,
    policy_start_date: '',
    policy_end_date: '',
    policy_number: '',
    insurer_name: '',
    status: 'active',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (policy) {
      setFormData({
        policy_aggregate_limit: policy.policy_aggregate_limit,
        policy_single_limit: policy.policy_single_limit,
        policy_start_date: policy.policy_start_date || '',
        policy_end_date: policy.policy_end_date || '',
        policy_number: policy.policy_number || '',
        insurer_name: policy.insurer_name || '',
        status: policy.status,
        notes: policy.notes || '',
      });
    } else {
      setFormData({
        policy_aggregate_limit: 0,
        policy_single_limit: 0,
        policy_start_date: '',
        policy_end_date: '',
        policy_number: '',
        insurer_name: '',
        status: 'active',
        notes: '',
      });
    }
  }, [policy, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('limit') || name.includes('amount') ? parseFloat(value) || 0 : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {policy ? 'Edit Policy' : 'Create New Policy'} - {clientName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Set fidelity insurance policy limits and coverage details
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Policy Limits */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span>💰</span>
              Coverage Limits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aggregate Limit *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    name="policy_aggregate_limit"
                    required
                    min="0"
                    step="0.01"
                    value={formData.policy_aggregate_limit}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Single Occurrence Limit *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    name="policy_single_limit"
                    required
                    min="0"
                    step="0.01"
                    value={formData.policy_single_limit}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Policy Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span>📋</span>
              Policy Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Policy Number
                </label>
                <input
                  type="text"
                  name="policy_number"
                  value={formData.policy_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., POL-2025-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Insurer Name
                </label>
                <input
                  type="text"
                  name="insurer_name"
                  value={formData.insurer_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Insurance company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="policy_start_date"
                  value={formData.policy_start_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="policy_end_date"
                  value={formData.policy_end_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              placeholder="Additional notes about this policy..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving...' : policy ? 'Update Policy' : 'Create Policy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
