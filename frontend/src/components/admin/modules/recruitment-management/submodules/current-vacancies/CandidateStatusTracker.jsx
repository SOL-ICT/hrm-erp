import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, XCircle, Send, Calendar, FileText, 
  User, AlertTriangle, History, Eye 
} from 'lucide-react';

const CandidateStatusTracker = ({ candidate, recruitmentRequestId, onClose }) => {
  const [statusHistory, setStatusHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCandidateStatus();
  }, [candidate?.id, recruitmentRequestId]);

  const fetchCandidateStatus = async () => {
    try {
      setLoading(true);
      
      // Get token using the same logic as other components
      let token = null;
      try {
        const authData = JSON.parse(localStorage.getItem('auth') || '{}');
        token = authData.access_token;
      } catch (e) {
        token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${apiUrl}/candidates/${candidate.id}/status-history?recruitment_request_id=${recruitmentRequestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setStatusHistory(data.data);
      } else {
        setError(data.message || 'Failed to fetch candidate status');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching candidate status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status, type) => {
    const iconProps = { size: 20 };
    
    switch (status) {
      case 'completed':
      case 'passed':
        return <CheckCircle className="text-green-500" {...iconProps} />;
      case 'failed':
      case 'declined':
        return <XCircle className="text-red-500" {...iconProps} />;
      case 'pending':
      case 'in_progress':
        return <Clock className="text-yellow-500" {...iconProps} />;
      case 'sent':
        return <Send className="text-blue-500" {...iconProps} />;
      default:
        return <AlertTriangle className="text-gray-400" {...iconProps} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canSendTest = (status) => {
    return !status?.test_assignment || 
           status.test_assignment.status === 'expired' || 
           status.test_assignment.status === 'cancelled';
  };

  const canSendInterview = (status) => {
    return status?.test_assignment?.status === 'completed' && 
           (!status?.interview_invitation || 
            status.interview_invitation.status === 'declined' ||
            status.interview_invitation.status === 'cancelled');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading candidate status...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <User className="text-blue-600" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Candidate Status Tracker
                </h2>
                <p className="text-sm text-gray-600">
                  {candidate?.full_name || candidate?.first_name + ' ' + candidate?.last_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
              <p className="text-red-600 font-medium">Error Loading Status</p>
              <p className="text-gray-600 text-sm mt-2">{error}</p>
              <button
                onClick={fetchCandidateStatus}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : statusHistory ? (
            <div className="space-y-6">
              {/* Overall Application Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <History className="mr-2" size={18} />
                  Application Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Current Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(statusHistory.application_status)}`}>
                        {statusHistory.application_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Applied On</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(statusHistory.applied_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Assignment Status */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="mr-2" size={18} />
                  Test Assignment Status
                </h3>
                
                {statusHistory.test_assignment ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(statusHistory.test_assignment.status, 'test')}
                        <div>
                          <p className="font-medium text-gray-900">
                            Test {statusHistory.test_assignment.status.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            ID: {statusHistory.test_assignment.id}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(statusHistory.test_assignment.status)}`}>
                        {statusHistory.test_assignment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="text-gray-600">Sent At</label>
                        <p className="text-gray-900">
                          {formatDate(statusHistory.test_assignment.sent_at)}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-600">Completed At</label>
                        <p className="text-gray-900">
                          {formatDate(statusHistory.test_assignment.completed_at)}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-600">Expires At</label>
                        <p className="text-gray-900">
                          {formatDate(statusHistory.test_assignment.expires_at)}
                        </p>
                      </div>
                    </div>

                    {/* Action Recommendation */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Action Status:</strong> {canSendTest(statusHistory) 
                          ? '✅ Can send new test assignment' 
                          : '❌ Test already sent and active'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <FileText className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600 font-medium">No Test Assignment Found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      ✅ Safe to send test assignment
                    </p>
                  </div>
                )}
              </div>

              {/* Interview Invitation Status */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="mr-2" size={18} />
                  Interview Invitation Status
                </h3>
                
                {statusHistory.interview_invitation ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(statusHistory.interview_invitation.status, 'interview')}
                        <div>
                          <p className="font-medium text-gray-900">
                            Interview {statusHistory.interview_invitation.status.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-600">
                            ID: {statusHistory.interview_invitation.id} | Type: {statusHistory.interview_invitation.interview_type}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(statusHistory.interview_invitation.status)}`}>
                        {statusHistory.interview_invitation.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="text-gray-600">Sent At</label>
                        <p className="text-gray-900">
                          {formatDate(statusHistory.interview_invitation.sent_at)}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-600">Interview Date</label>
                        <p className="text-gray-900">
                          {formatDate(statusHistory.interview_invitation.interview_date)}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-600">Location/Link</label>
                        <p className="text-gray-900">
                          {statusHistory.interview_invitation.location || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Action Recommendation */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Action Status:</strong> {canSendInterview(statusHistory) 
                          ? '✅ Can send new interview invitation' 
                          : '❌ Interview already sent or test not completed'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Calendar className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600 font-medium">No Interview Invitation Found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {statusHistory.test_assignment?.status === 'completed' 
                        ? '✅ Test completed - Safe to send interview invitation'
                        : '⏳ Waiting for test completion'}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Summary */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Recommended Actions</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  {canSendTest(statusHistory) && (
                    <li>• You can safely send a test assignment to this candidate</li>
                  )}
                  {canSendInterview(statusHistory) && (
                    <li>• You can safely send an interview invitation to this candidate</li>
                  )}
                  {!canSendTest(statusHistory) && !canSendInterview(statusHistory) && (
                    <li>• All current processes are active. No new actions recommended.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No status information available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateStatusTracker;
