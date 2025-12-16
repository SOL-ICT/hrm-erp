/**
 * Policy Management Page
 * 
 * Manage client fidelity insurance policies - view, create, edit, delete.
 * Organized by client with clear active policy indication.
 */

'use client';

import { useState } from 'react';
import { useClientPolicies } from './hooks/useClientPolicies';
import PolicyFormModal from './components/PolicyFormModal';

export default function PolicyManagementPage() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  
  const { 
    policies, 
    activePolicy, 
    clients, 
    loading, 
    error,
    createPolicy,
    updatePolicy,
    deletePolicy,
    fetchPolicies
  } = useClientPolicies(selectedClientId || undefined);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleCreatePolicy = () => {
    setSelectedPolicy(null);
    setShowModal(true);
  };

  const handleEditPolicy = (policy: any) => {
    setSelectedPolicy(policy);
    setShowModal(true);
  };

  const handleSubmitPolicy = async (policyData: any) => {
    if (!selectedClientId) return;
    
    try {
      if (selectedPolicy) {
        await updatePolicy(selectedClientId, selectedPolicy.id, policyData);
        alert('Policy updated successfully!');
      } else {
        await createPolicy(selectedClientId, policyData);
        alert('Policy created successfully!');
      }
    } catch (error) {
      alert('Failed to save policy. Please try again.');
      throw error;
    }
  };

  const handleDeletePolicy = async (policyId: number) => {
    if (!selectedClientId) return;
    if (!confirm('Are you sure you want to delete this policy? This action cannot be undone.')) return;

    try {
      await deletePolicy(selectedClientId, policyId);
      alert('Policy deleted successfully!');
    } catch (error) {
      alert('Failed to delete policy. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Client Policy Management
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage fidelity insurance policy limits for clients
        </p>
      </div>

      {/* Client Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Client
        </label>
        <select
          value={selectedClientId || ''}
          onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">-- Select a client --</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Active Policy Card */}
      {selectedClientId && activePolicy && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-green-200 dark:border-green-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✅</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Active Policy
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current coverage for {selectedClient?.name}
              </p>
            </div>
            <button
              onClick={() => handleEditPolicy(activePolicy)}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Aggregate Limit</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(activePolicy.policy_aggregate_limit)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Single Occurrence</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(activePolicy.policy_single_limit)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Policy Period</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatDate(activePolicy.policy_start_date)} - {formatDate(activePolicy.policy_end_date)}
              </p>
            </div>
          </div>

          {activePolicy.insurer_name && (
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Insurer</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{activePolicy.insurer_name}</p>
              {activePolicy.policy_number && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Policy #{activePolicy.policy_number}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* No Active Policy Warning */}
      {selectedClientId && !activePolicy && !loading && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                No Active Policy
              </h3>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                This client does not have an active fidelity insurance policy. Claims cannot be created without an active policy.
              </p>
            </div>
          </div>
          <button
            onClick={handleCreatePolicy}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
          >
            Create Active Policy
          </button>
        </div>
      )}

      {/* Policy List */}
      {selectedClientId && policies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Policy History
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                All policies for {selectedClient?.name}
              </p>
            </div>
            <button
              onClick={handleCreatePolicy}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <span>+</span>
              <span>New Policy</span>
            </button>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {policies.map(policy => (
              <div key={policy.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      policy.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : policy.status === 'expired'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {policy.status.toUpperCase()}
                    </span>
                    {policy.policy_number && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        #{policy.policy_number}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPolicy(policy)}
                      className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      Edit
                    </button>
                    {policy.status !== 'active' && (
                      <button
                        onClick={() => handleDeletePolicy(policy.id)}
                        className="px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Aggregate Limit</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(policy.policy_aggregate_limit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Single Limit</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(policy.policy_single_limit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Period</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {formatDate(policy.policy_start_date)} - {formatDate(policy.policy_end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Insurer</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {policy.insurer_name || 'N/A'}
                    </p>
                  </div>
                </div>

                {policy.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">{policy.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedClientId && policies.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Policies Found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Create the first fidelity insurance policy for this client
          </p>
          <button
            onClick={handleCreatePolicy}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create First Policy
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Policy Form Modal */}
      <PolicyFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitPolicy}
        policy={selectedPolicy}
        clientName={selectedClient?.name || ''}
      />
    </div>
  );
}
