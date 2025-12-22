import React, { useState } from 'react';
import { Modal, Button, TextArea } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

/**
 * Review Modal Component
 * For Admin Officers to review purchase requests
 */
export const ReviewModal = ({ isOpen, onClose, purchaseRequest, onSubmit, isSubmitting }) => {
  const [comments, setComments] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    // Validate
    const newErrors = {};
    if (!comments.trim()) {
      newErrors.comments = 'Review comments are required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(purchaseRequest.id, comments);
  };

  const handleClose = () => {
    setComments('');
    setErrors({});
    onClose();
  };

  if (!purchaseRequest) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Review Purchase Request">
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

        {/* Comments Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Review Comments <span className="text-red-500">*</span>
          </label>
          <TextArea
            value={comments}
            onChange={(e) => {
              setComments(e.target.value);
              if (errors.comments) setErrors({ ...errors, comments: null });
            }}
            placeholder="Enter your review comments..."
            rows={4}
            className={errors.comments ? 'border-red-500' : ''}
          />
          {errors.comments && (
            <p className="text-red-500 text-sm mt-1">{errors.comments}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewModal;
