/**
 * New Claim Modal Component
 * 
 * Multi-section form for creating new fidelity claims.
 * Auto-generates claim number, validates policy limits, supports evidence upload.
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - NewClaimModal Component
 */

'use client';

import { useState, useEffect } from 'react';

interface Client {
  id: number;
  name: string;
  policy_single_limit?: number;
  policy_aggregate_limit?: number;
}

interface Staff {
  id: number;
  name: string;
  position?: string;
  current_position?: string; // Add this field
}

interface NewClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewClaimModal({ isOpen, onClose, onSuccess }: NewClaimModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: '',
    staff_id: '',
    client_contact_person: '',
    client_contact_email: '',
    staff_position: '',
    assignment_start_date: '',
    incident_date: '',
    incident_description: '',
    reported_loss: '',
    policy_single_limit: '' as string | number,
    policy_aggregate_limit: '' as string | number
  });

  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/admin/claims/resolution/clients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchClientStaff = async (clientId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const url = `${apiUrl}/admin/claims/resolution/clients/${clientId}/staff`;
      console.log('📡 Fetching staff from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Staff response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Staff data received:', data);
        setStaffList(data.staff || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch staff - Status:', response.status, 'Response:', errorText);
      }
    } catch (error) {
      console.error('❌ Failed to fetch staff:', error);
    }
  };

  const handleClientChange = (clientId: string) => {
    console.log('🏢 Client changed:', clientId);
    const selectedClient = clients.find(c => c.id === parseInt(clientId));
    console.log('✅ Selected client:', selectedClient);
    
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      staff_id: '',
      policy_single_limit: selectedClient?.policy_single_limit?.toString() || '',
      policy_aggregate_limit: selectedClient?.policy_aggregate_limit?.toString() || ''
    }));

    if (clientId) {
      console.log('👥 Fetching staff for client:', clientId);
      fetchClientStaff(clientId);
    } else {
      setStaffList([]);
    }
  };

  const handleStaffChange = (staffId: string) => {
    const selectedStaff = staffList.find(s => s.id === parseInt(staffId));
    
    setFormData(prev => ({
      ...prev,
      staff_id: staffId,
      staff_position: selectedStaff?.current_position || ''
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setEvidenceFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create claim
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/admin/claims/resolution`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Validation errors:', errorData);
        throw new Error(errorData.message || 'Failed to create claim');
      }

      const claimData = await response.json();
      const claimId = claimData.id;

      // Upload evidence files if any
      if (evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          const formData = new FormData();
          formData.append('file', file);

          await fetch(`http://localhost:8000/api/admin/claims/resolution/${claimId}/evidence`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
        }
      }

      alert('Claim created successfully!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating claim:', error);
      alert('Failed to create claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      client_id: '',
      staff_id: '',
      client_contact_person: '',
      client_contact_email: '',
      staff_position: '',
      assignment_start_date: '',
      incident_date: '',
      incident_description: '',
      reported_loss: '',
      policy_single_limit: '',
      policy_aggregate_limit: ''
    });
    setEvidenceFiles([]);
    setStaffList([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Create New Claim
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Record a new fidelity insurance claim
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client & Staff Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Client & Staff Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Staff Member <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.staff_id}
                  onChange={(e) => handleStaffChange(e.target.value)}
                  disabled={!formData.client_id}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select staff...</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.client_contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_contact_person: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.client_contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_contact_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Staff Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.staff_position}
                  onChange={(e) => setFormData(prev => ({ ...prev, staff_position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Finance Assistant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assignment Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.assignment_start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignment_start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Incident Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Incident Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Incident Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.incident_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, incident_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reported Loss (₦) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.reported_loss}
                  onChange={(e) => setFormData(prev => ({ ...prev, reported_loss: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="15000.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Incident Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.incident_description}
                onChange={(e) => setFormData(prev => ({ ...prev, incident_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of the incident..."
              />
            </div>
          </div>

          {/* Policy Limits Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Policy Limits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Single Claim Limit (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.policy_single_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, policy_single_limit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Aggregate Limit (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.policy_aggregate_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, policy_aggregate_limit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Evidence Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Evidence Files (Optional)
            </h3>

            <div>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.mp4,.xlsx,.xls"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Allowed: PDF, Images (JPG, PNG), Videos (MP4), Excel (XLSX, XLS). Max 10MB per file.
              </p>
            </div>

            {evidenceFiles.length > 0 && (
              <div className="space-y-2">
                {evidenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Claim'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
