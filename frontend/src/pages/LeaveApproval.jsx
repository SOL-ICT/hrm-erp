import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useSessionAware } from '@/hooks/useSessionAware';

export default function LeaveApproval() {
  const router = useRouter();
  const { token } = router.query;
  const { makeRequestWithRetry } = useSessionAware();
  
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchApplicationDetails();
    }
  }, [token]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const data = await makeRequestWithRetry(`/api/leave-approval/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      setApplication(data.data);
    } catch (err) {
      console.error('Error fetching application:', err);
      setError('Failed to load leave application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDecision = async () => {
    if (!decision) {
      setError('Please select a decision (Approve or Reject)');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const data = await makeRequestWithRetry(`/api/leave-approval/${token}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          decision: decision,
          comments: comments.trim() || null,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        // Optionally redirect or show final message
      }, 3000);

    } catch (err) {
      console.error('Error submitting decision:', err);
      setError('Failed to submit decision. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading leave application...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 mb-4">
            Leave application has been {decision === 'approve' ? 'approved' : 'rejected'} successfully.
          </p>
          <p className="text-sm text-gray-500">
            The staff member will be notified via email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leave Approval Request</h1>
          <p className="mt-2 text-gray-600">Review and approve/reject leave application</p>
        </div>

        {/* Application Details Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Application Details</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Staff Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Staff Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-base font-medium text-gray-900">{application?.staff?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-base text-gray-900">{application?.staff?.email}</p>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Leave Details</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Leave Type</p>
                    <p className="text-base font-medium text-gray-900">{application?.leave_type}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-base font-medium text-gray-900">{application?.days} day(s)</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Public Holidays</p>
                      <p className="text-base font-medium text-gray-900">{application?.public_holidays || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Dates</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-base font-medium text-gray-900">{application?.start_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="text-base font-medium text-gray-900">{application?.end_date}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Additional Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Handover To</p>
                    <p className="text-base text-gray-900">{application?.handover_staff?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Applied On</p>
                    <p className="text-base text-gray-900">{application?.applied_at}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Reason</h3>
              <p className="text-base text-gray-900 bg-gray-50 p-4 rounded-lg">{application?.reason}</p>
            </div>
          </div>
        </div>

        {/* Decision Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Decision</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Decision Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setDecision('approve')}
              className={`p-4 rounded-lg border-2 transition-all ${
                decision === 'approve'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:border-green-300 text-gray-700'
              }`}
            >
              <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${decision === 'approve' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="font-semibold">Approve</span>
            </button>

            <button
              onClick={() => setDecision('reject')}
              className={`p-4 rounded-lg border-2 transition-all ${
                decision === 'reject'
                  ? 'border-red-600 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-red-300 text-gray-700'
              }`}
            >
              <XCircle className={`w-8 h-8 mx-auto mb-2 ${decision === 'reject' ? 'text-red-600' : 'text-gray-400'}`} />
              <span className="font-semibold">Reject</span>
            </button>
          </div>

          {/* Comments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any comments or reasons for your decision..."
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitDecision}
            disabled={!decision || submitting}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Decision'}
          </button>
        </div>

        {/* Supervisor Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Supervisor: {application?.handover_staff?.name || 'Not assigned'}</p>
        </div>
      </div>
    </div>
  );
}
