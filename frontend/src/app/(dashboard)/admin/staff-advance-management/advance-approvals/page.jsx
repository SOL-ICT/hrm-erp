'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Textarea, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { advanceAPI } from '@/services/api/advanceAPI';
import { AdvanceCard } from '@/components/procurement-advance';
import { toast } from 'sonner';

/**
 * Advance Approvals Page
 * For Zonal Officers, Admin Officers, and Finance Directors
 */

export default function AdvanceApprovalsPage() {
  const [pendingAdvances, setPendingAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionData, setActionData] = useState({ comments: '', reason: '' });

  // Load pending approvals
  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await advanceAPI.getPendingApprovals();
      setPendingAdvances(response.data || []);
    } catch (error) {
      toast.error('Failed to load pending approvals');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await advanceAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  useEffect(() => {
    loadPendingApprovals();
    loadStatistics();
  }, []);

  // Handle approve
  const handleApprove = async () => {
    if (!selectedAdvance) return;

    try {
      await advanceAPI.approve(selectedAdvance.id, actionData.comments);
      toast.success('Advance approved successfully');
      setShowApproveDialog(false);
      setSelectedAdvance(null);
      setActionData({ comments: '', reason: '' });
      loadPendingApprovals();
      loadStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve advance');
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedAdvance || !actionData.reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await advanceAPI.reject(selectedAdvance.id, actionData.reason);
      toast.success('Advance rejected');
      setShowRejectDialog(false);
      setSelectedAdvance(null);
      setActionData({ comments: '', reason: '' });
      loadPendingApprovals();
      loadStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject advance');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Advance Approvals</h1>
        <p className="text-gray-500 mt-1">
          Review and approve advance requests
        </p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {statistics.pending || 0}
              </div>
              <p className="text-sm text-gray-500">Pending Approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {statistics.approved || 0}
              </div>
              <p className="text-sm text-gray-500">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {statistics.rejected || 0}
              </div>
              <p className="text-sm text-gray-500">Rejected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.disbursed || 0}
              </div>
              <p className="text-sm text-gray-500">Disbursed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Approvals List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : pendingAdvances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <p className="text-gray-500 text-lg">No pending approvals</p>
            <p className="text-gray-400 text-sm mt-2">
              All advance requests have been processed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Pending Approvals ({pendingAdvances.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingAdvances.map((advance) => (
              <AdvanceCard
                key={advance.id}
                advance={advance}
                variant="detailed"
                onView={(adv) => setSelectedAdvance(adv)}
                onApprove={(adv) => {
                  setSelectedAdvance(adv);
                  setShowApproveDialog(true);
                }}
                onReject={(adv) => {
                  setSelectedAdvance(adv);
                  setShowRejectDialog(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Advance Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Advance Code: <span className="font-semibold">{selectedAdvance?.advance_code}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Amount: <span className="font-semibold">₦{selectedAdvance?.amount?.toLocaleString()}</span>
              </p>
              <p className="text-sm text-gray-600">
                Requested by: <span className="font-semibold">{selectedAdvance?.user?.name}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Comments (Optional)
              </label>
              <Textarea
                value={actionData.comments}
                onChange={(e) => setActionData({ ...actionData, comments: e.target.value })}
                placeholder="Add any comments for this approval..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Advance Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Advance Code: <span className="font-semibold">{selectedAdvance?.advance_code}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Amount: <span className="font-semibold">₦{selectedAdvance?.amount?.toLocaleString()}</span>
              </p>
              <p className="text-sm text-gray-600">
                Requested by: <span className="font-semibold">{selectedAdvance?.user?.name}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-red-600">
                Reason for Rejection *
              </label>
              <Textarea
                value={actionData.reason}
                onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                placeholder="Please provide a clear reason for rejecting this advance..."
                rows={4}
                className="border-red-300 focus:border-red-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      {selectedAdvance && !showApproveDialog && !showRejectDialog && (
        <Dialog open={true} onOpenChange={() => setSelectedAdvance(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Advance Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <AdvanceCard
                advance={selectedAdvance}
                variant="detailed"
                showActions={false}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAdvance(null)}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowRejectDialog(true);
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  setShowApproveDialog(true);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
