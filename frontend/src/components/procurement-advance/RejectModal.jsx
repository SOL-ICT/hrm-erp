import React, { useState } from 'react';
import { Modal, Button, TextArea } from '@/components/ui';
import { XCircle } from 'lucide-react';

/**
 * Reject Modal Component
 * For Admin/Finance to reject purchase requests
 */
export const RejectModal = ({ isOpen, onClose, purchaseRequest, onSubmit, isSubmitting }) => {
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    // Validate
    const newErrors = {};
    if (!reason.trim()) {
      newErrors.reason = 'Rejection reason is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(purchaseRequest.id, reason);
  };

  const handleClose = () => {
    setReason('');
    setErrors({});
    onClose();
  };

  if (!purchaseRequest) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reject Purchase Request">
      <div className="space-y-4">
        {/* Purchase Request Info */}
        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">{purchaseRequest.request_code}</h3>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Requested by: {purchaseRequest.requester?.name || 'Unknown'}
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Total Items: {purchaseRequest.items?.length || 0}
          </p>
        </div>

        {/* Reason Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <TextArea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errors.reason) setErrors({ ...errors, reason: null });
            }}
            placeholder="Explain why this purchase request is being rejected..."
            rows={4}
            className={errors.reason ? 'border-red-500' : ''}
          />
          {errors.reason && (
            <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
          )}
        </div>

        {/* Warning Message */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-300">
            ⚠️ This action will reject the purchase request. The requester will be notified with your reason.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            <XCircle className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Rejecting...' : 'Reject Request'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RejectModal;
