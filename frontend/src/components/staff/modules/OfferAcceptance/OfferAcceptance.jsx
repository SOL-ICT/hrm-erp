import React, { useState, useEffect } from 'react';
import { Check, X, Clock, AlertTriangle, Mail, Calendar, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

export default function OfferAcceptance() {
  const [offerStatus, setOfferStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { user } = useAuth();

  // Fetch offer status
  useEffect(() => {
    fetchOfferStatus();
  }, [user?.id]);

  const fetchOfferStatus = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await apiService.makeRequest('/staff/offer-status');
      console.log('[OFFER] Status data:', data);
      setOfferStatus(data);

    } catch (error) {
      console.error('[OFFER] Error fetching status:', error);
      if (!errorMessage) {
        setErrorMessage('An error occurred while fetching your offer status.');
      }
      setOfferStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle accept offer
  const handleAcceptOffer = async () => {
    if (!window.confirm('Are you sure you want to accept this offer? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiService.makeRequest('/staff/accept-offer', { method: 'POST' });
      setSuccessMessage('Offer accepted successfully! Welcome aboard!');

      // Refresh offer status
      setTimeout(() => {
        fetchOfferStatus();
      }, 1500);

    } catch (error) {
      console.error('[OFFER] Error accepting offer:', error);
      if (!errorMessage) {
        setErrorMessage('An error occurred while accepting the offer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reject offer
  const handleRejectOffer = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejecting the offer.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiService.makeRequest('/staff/reject-offer', {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });

      setSuccessMessage('Offer rejected. Thank you for your consideration.');
      setShowRejectModal(false);

      // Refresh offer status
      setTimeout(() => {
        fetchOfferStatus();
      }, 1500);

    } catch (error) {
      console.error('[OFFER] Error rejecting offer:', error);
      if (!errorMessage) {
        setErrorMessage('An error occurred while rejecting the offer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get urgency color based on days remaining
  const getUrgencyColor = (days) => {
    if (days === null || days === undefined) return 'gray';
    if (days >= 21) return 'green';
    if (days >= 14) return 'yellow';
    if (days >= 7) return 'orange';
    return 'red';
  };

  // Get urgency message
  const getUrgencyMessage = (days) => {
    if (days === null || days === undefined) return 'No deadline set';
    if (days >= 21) return 'You have plenty of time';
    if (days >= 14) return 'Please review your offer soon';
    if (days >= 7) return 'Action required within 2 weeks';
    return 'URGENT: Offer expires soon!';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
              <p className="text-red-600 mt-1">{errorMessage}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!offerStatus || offerStatus.offer_acceptance_status === 'not_applicable') {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800">No Pending Offer</h3>
              <p className="text-blue-600 mt-1">You do not have any pending offers at this time.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const urgencyColor = getUrgencyColor(offerStatus.days_remaining);
  const urgencyMessage = getUrgencyMessage(offerStatus.days_remaining);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Offer Acceptance</h1>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Offer Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Your Offer Status</h2>
          <span className={`px-4 py-2 rounded-full font-semibold ${
            offerStatus.offer_acceptance_status === 'sent' ? 'bg-yellow-100 text-yellow-800' :
            offerStatus.offer_acceptance_status === 'accepted' ? 'bg-green-100 text-green-800' :
            offerStatus.offer_acceptance_status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {offerStatus.offer_acceptance_status?.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{offerStatus.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Employee Code</p>
              <p className="font-medium">{offerStatus.employee_code || 'Not assigned'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Offer Sent</p>
              <p className="font-medium">
                {offerStatus.offer_sent_at 
                  ? new Date(offerStatus.offer_sent_at).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Days Remaining</p>
              <p className={`font-bold text-lg ${
                urgencyColor === 'green' ? 'text-green-600' :
                urgencyColor === 'yellow' ? 'text-yellow-600' :
                urgencyColor === 'orange' ? 'text-orange-600' :
                'text-red-600'
              }`}>
                {offerStatus.days_remaining !== null ? offerStatus.days_remaining : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Urgency Banner */}
        {offerStatus.offer_acceptance_status === 'sent' && (
          <div className={`rounded-lg p-4 mb-6 ${
            urgencyColor === 'green' ? 'bg-green-50 border border-green-200' :
            urgencyColor === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
            urgencyColor === 'orange' ? 'bg-orange-50 border border-orange-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-6 w-6 ${
                urgencyColor === 'green' ? 'text-green-600' :
                urgencyColor === 'yellow' ? 'text-yellow-600' :
                urgencyColor === 'orange' ? 'text-orange-600' :
                'text-red-600'
              }`} />
              <div>
                <p className={`font-semibold ${
                  urgencyColor === 'green' ? 'text-green-800' :
                  urgencyColor === 'yellow' ? 'text-yellow-800' :
                  urgencyColor === 'orange' ? 'text-orange-800' :
                  'text-red-800'
                }`}>
                  {urgencyMessage}
                </p>
                <p className={`text-sm ${
                  urgencyColor === 'green' ? 'text-green-700' :
                  urgencyColor === 'yellow' ? 'text-yellow-700' :
                  urgencyColor === 'orange' ? 'text-orange-700' :
                  'text-red-700'
                }`}>
                  {offerStatus.days_remaining > 0 
                    ? `You have ${offerStatus.days_remaining} days to accept or reject this offer.`
                    : 'Your offer has expired. Please contact HR immediately.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {offerStatus.offer_acceptance_status === 'sent' && offerStatus.days_remaining > 0 && (
          <div className="flex gap-4">
            <button
              onClick={handleAcceptOffer}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Check className="h-5 w-5" />
              {isSubmitting ? 'Processing...' : 'Accept Offer'}
            </button>

            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
              {isSubmitting ? 'Processing...' : 'Reject Offer'}
            </button>
          </div>
        )}

        {offerStatus.offer_acceptance_status === 'accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Check className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Offer Accepted</p>
                <p className="text-sm text-green-700">
                  You accepted this offer on {new Date(offerStatus.offer_accepted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {offerStatus.offer_acceptance_status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <X className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">Offer Rejected</p>
                <p className="text-sm text-red-700">You have declined this offer.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {offerStatus.logs && offerStatus.logs.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Log</h3>
          <div className="space-y-3">
            {offerStatus.logs.map((log, index) => (
              <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                <div className="mt-1">
                  {log.action === 'sent' && <Mail className="h-4 w-4 text-blue-500" />}
                  {log.action === 'accepted' && <Check className="h-4 w-4 text-green-500" />}
                  {log.action === 'rejected' && <X className="h-4 w-4 text-red-500" />}
                  {log.action === 'reminded' && <Clock className="h-4 w-4 text-yellow-500" />}
                  {log.action === 'suspended' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  {log.action === 'terminated' && <X className="h-4 w-4 text-red-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 capitalize">{log.action}</p>
                  {log.notes && <p className="text-sm text-gray-600">{log.notes}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Reject Offer</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this offer. This action cannot be undone.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter your reason for rejecting the offer..."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32 resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectOffer}
                disabled={isSubmitting || !rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
