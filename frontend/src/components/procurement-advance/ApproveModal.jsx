import React, { useState } from 'react';
import { Modal, Button, TextArea } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

/**
 * Approve Modal Component
 * For Finance/Admin to approve purchase requests
 */
export const ApproveModal = ({ isOpen, onClose, purchaseRequest, onSubmit, isSubmitting, userRole }) => {
  const [comments, setComments] = useState('');

  const handleSubmit = () => {
    onSubmit(purchaseRequest.id, { comments });
  };

  const handleClose = () => {
    setComments('');
    onClose();
  };

  if (!purchaseRequest) return null;

  const isFinanceApproval = purchaseRequest.status === 'approved_admin';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isFinanceApproval ? 'Finance Approval' : 'Approve Purchase Request'}>
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
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Status: {purchaseRequest.status}
          </p>
        </div>

        {/* Items List */}
        {purchaseRequest.items && purchaseRequest.items.length > 0 && (
          <div className="border dark:border-slate-600 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Items:</h4>
            <ul className="space-y-2">
              {purchaseRequest.items.map((item, index) => (
                <li key={index} className="text-sm flex justify-between">
                  <span>{item.item_name}</span>
                  <span>
                    {item.quantity} × ₦{item.unit_price?.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t dark:border-slate-600 mt-2 pt-2 font-semibold flex justify-between">
              <span>Total:</span>
              <span>
                ₦{purchaseRequest.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Comments Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Approval Comments (Optional)
          </label>
          <TextArea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Enter any comments for this approval..."
            rows={3}
          />
        </div>

        {/* Confirmation Message */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-300">
            {isFinanceApproval 
              ? 'This will give final approval to the purchase request.'
              : 'This will approve the purchase request for finance review.'}
          </p>
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
            {isSubmitting ? 'Approving...' : 'Approve'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApproveModal;
