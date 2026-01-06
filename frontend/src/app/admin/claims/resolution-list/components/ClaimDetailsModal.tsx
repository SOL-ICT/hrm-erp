/**
 * Claim Details Modal
 * 
 * Modal to view and edit claim details including document checklist.
 * Users can mark documents as provided and update file paths.
 */

'use client';

import { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';

interface ClaimDocument {
  id: number;
  document_name: string;
  is_provided: boolean;
  file_path: string | null;
}

interface ClaimDetails {
  id: number;
  claim_number: string;
  client_name: string;
  client_contact_person: string;
  client_contact_email: string;
  staff_name: string;
  staff_position: string;
  assignment_start_date: string;
  incident_description: string;
  reported_loss: string;
  policy_single_limit: string;
  policy_aggregate_limit: string;
  status: string;
  sol_evaluation_status: string | null;
  sol_notes: string | null;
  evaluated_by_name: string | null;
  insurer_claim_id: string | null;
  insurer_status: string | null;
  settlement_amount: string | null;
  settlement_date: string | null;
  created_at: string;
  documents?: ClaimDocument[];
}

interface ClaimDetailsModalProps {
  claimId: number;
  onClose: () => void;
}

export default function ClaimDetailsModal({ claimId, onClose }: ClaimDetailsModalProps) {
  const [claim, setClaim] = useState<ClaimDetails | null>(null);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchClaimDetails();
  }, [claimId]);

  const fetchClaimDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/admin/claims/list/${claimId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch claim details');
      }

      if (!result.claim) {
        throw new Error('No claim data received');
      }

      setClaim(result.claim);
      setDocuments(result.claim.documents || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load claim details');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentChange = (index: number, field: 'is_provided' | 'file_path', value: boolean | string) => {
    setDocuments(prev => prev.map((doc, i) => 
      i === index ? { ...doc, [field]: value } : doc
    ));
  };

  const handleSaveDocuments = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/admin/claims/resolution/${claimId}/documents`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents }),
      });

      if (!response.ok) {
        throw new Error('Failed to update documents');
      }

      setSuccessMessage('Documents updated successfully');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

        {/* Modal */}
        <div 
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !claim ? (
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">Claim not found</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Claim #{claim.claim_number}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={claim.status as any} size="md" />
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Error/Success Messages */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}
                {successMessage && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-green-800 dark:text-green-200">{successMessage}</p>
                  </div>
                )}

                {/* Claim Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client Information */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Client Information</h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Organization:</span>
                        <p className="text-gray-900 dark:text-gray-100">{claim.client_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Contact:</span>
                        <p className="text-gray-900 dark:text-gray-100">{claim.client_contact_person}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                        <p className="text-gray-900 dark:text-gray-100">{claim.client_contact_email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Staff Information */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Staff Information</h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                        <p className="text-gray-900 dark:text-gray-100">{claim.staff_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Position:</span>
                        <p className="text-gray-900 dark:text-gray-100">{claim.staff_position}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Assignment Start:</span>
                        <p className="text-gray-900 dark:text-gray-100">{formatDate(claim.assignment_start_date)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Financial Information</h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Reported Loss:</span>
                        <p className="text-red-600 dark:text-red-400 font-semibold">{formatCurrency(claim.reported_loss)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Policy Limit:</span>
                        <p className="text-gray-900 dark:text-gray-100">{formatCurrency(claim.policy_single_limit)}</p>
                      </div>
                      {claim.settlement_amount && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Settlement:</span>
                          <p className="text-green-600 dark:text-green-400 font-semibold">{formatCurrency(claim.settlement_amount)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Status</h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                        <p className="text-gray-900 dark:text-gray-100">{formatDate(claim.created_at)}</p>
                      </div>
                      {claim.insurer_claim_id && (
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Insurer ID:</span>
                          <p className="text-gray-900 dark:text-gray-100 font-mono text-[10px]">{claim.insurer_claim_id}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Incident Description */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Incident Description</h3>
                  <p className="text-gray-900 dark:text-gray-100 text-xs leading-relaxed whitespace-pre-wrap">
                    {claim.incident_description}
                  </p>
                </div>

                {/* Document Checklist */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Required Documents</h3>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {documents.filter(d => d.is_provided).length} of {documents.length} provided
                    </div>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {documents.map((doc, index) => (
                      <div
                        key={doc.id}
                        className="space-y-1.5 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`doc-${doc.id}`}
                            checked={doc.is_provided}
                            onChange={(e) => handleDocumentChange(index, 'is_provided', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`doc-${doc.id}`}
                            className="text-xs font-medium text-gray-900 dark:text-gray-100 flex-1 cursor-pointer"
                          >
                            {doc.document_name}
                          </label>
                        </div>
                        <input
                          type="text"
                          value={doc.file_path || ''}
                          onChange={(e) => handleDocumentChange(index, 'file_path', e.target.value)}
                          placeholder="File path (e.g., C:\Documents\claim_form.pdf)"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveDocuments}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Documents'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
