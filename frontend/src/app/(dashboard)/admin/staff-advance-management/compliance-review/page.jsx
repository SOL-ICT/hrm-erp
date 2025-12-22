'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, AlertTriangle, FileQuestion } from 'lucide-react';
import { retirementAPI } from '@/services/api/retirementAPI';
import { RetirementCard } from '@/components/procurement-advance';
import { toast } from 'sonner';

/**
 * Compliance Review Page
 * For Risk Management to review retirement submissions
 */

export default function ComplianceReviewPage() {
  const [pendingRetirements, setPendingRetirements] = useState([]);
  const [overdueRetirements, setOverdueRetirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRetirement, setSelectedRetirement] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showQueryDialog, setShowQueryDialog] = useState(false);
  const [actionData, setActionData] = useState({ comments: '', reason: '', queries: '' });
  const [activeTab, setActiveTab] = useState('pending'); // pending or overdue

  // Load pending reviews
  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await retirementAPI.getPendingReviews();
      setPendingRetirements(response.data || []);
    } catch (error) {
      toast.error('Failed to load pending reviews');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load overdue retirements
  const loadOverdueRetirements = async () => {
    try {
      const response = await retirementAPI.getOverdue();
      setOverdueRetirements(response.data || []);
    } catch (error) {
      console.error('Failed to load overdue retirements:', error);
    }
  };

  useEffect(() => {
    loadPendingReviews();
    loadOverdueRetirements();
  }, []);

  // Handle approve
  const handleApprove = async () => {
    if (!selectedRetirement) return;

    try {
      await retirementAPI.approve(selectedRetirement.id, actionData.comments);
      toast.success('Retirement approved');
      setShowApproveDialog(false);
      setSelectedRetirement(null);
      setActionData({ comments: '', reason: '', queries: '' });
      loadPendingReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve retirement');
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedRetirement || !actionData.reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await retirementAPI.reject(selectedRetirement.id, actionData.reason);
      toast.success('Retirement rejected');
      setShowRejectDialog(false);
      setSelectedRetirement(null);
      setActionData({ comments: '', reason: '', queries: '' });
      loadPendingReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject retirement');
    }
  };

  // Handle query
  const handleQuery = async () => {
    if (!selectedRetirement || !actionData.queries.trim()) {
      toast.error('Please provide queries for the submitter');
      return;
    }

    try {
      await retirementAPI.query(selectedRetirement.id, actionData.queries);
      toast.success('Query sent to submitter');
      setShowQueryDialog(false);
      setSelectedRetirement(null);
      setActionData({ comments: '', reason: '', queries: '' });
      loadPendingReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send query');
    }
  };

  const displayedRetirements = activeTab === 'pending' ? pendingRetirements : overdueRetirements;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance Review</h1>
        <p className="text-gray-500 mt-1">
          Review and verify retirement submissions for compliance
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingRetirements.length}
            </div>
            <p className="text-sm text-gray-500">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {overdueRetirements.length}
            </div>
            <p className="text-sm text-gray-500">Overdue Retirements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {/* This would come from statistics endpoint */}
              0
            </div>
            <p className="text-sm text-gray-500">Approved Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {/* This would come from statistics endpoint */}
              95%
            </div>
            <p className="text-sm text-gray-500">Compliance Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Review ({pendingRetirements.length})
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overdue'
              ? 'border-b-2 border-red-600 text-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('overdue')}
        >
          Overdue ({overdueRetirements.length})
        </button>
      </div>

      {/* Retirements List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : displayedRetirements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <p className="text-gray-500 text-lg">
              {activeTab === 'pending' ? 'No pending reviews' : 'No overdue retirements'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {activeTab === 'pending' 
                ? 'All retirements have been reviewed' 
                : 'All advances are retired on time'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedRetirements.map((retirement) => (
            <RetirementCard
              key={retirement.id}
              retirement={retirement}
              variant="detailed"
              onView={setSelectedRetirement}
              onApprove={(ret) => {
                setSelectedRetirement(ret);
                setShowApproveDialog(true);
              }}
              onReject={(ret) => {
                setSelectedRetirement(ret);
                setShowRejectDialog(true);
              }}
              onQuery={(ret) => {
                setSelectedRetirement(ret);
                setShowQueryDialog(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Retirement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Retirement Code: <span className="font-semibold">{selectedRetirement?.retirement_code}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Advance: <span className="font-semibold">{selectedRetirement?.advance?.advance_code}</span>
              </p>
              <p className="text-sm text-gray-600">
                Officer: <span className="font-semibold">{selectedRetirement?.advance?.user?.name}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Comments (Optional)
              </label>
              <Textarea
                value={actionData.comments}
                onChange={(e) => setActionData({ ...actionData, comments: e.target.value })}
                placeholder="Add any comments about this approval..."
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
            <DialogTitle>Reject Retirement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Retirement Code: <span className="font-semibold">{selectedRetirement?.retirement_code}</span>
              </p>
              <p className="text-sm text-gray-600">
                Officer: <span className="font-semibold">{selectedRetirement?.advance?.user?.name}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-red-600">
                Reason for Rejection *
              </label>
              <Textarea
                value={actionData.reason}
                onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                placeholder="Provide clear reasons for rejecting this retirement..."
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

      {/* Query Dialog */}
      <Dialog open={showQueryDialog} onOpenChange={setShowQueryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Query Retirement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Retirement Code: <span className="font-semibold">{selectedRetirement?.retirement_code}</span>
              </p>
              <p className="text-sm text-gray-600">
                Officer: <span className="font-semibold">{selectedRetirement?.advance?.user?.name}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-700">
                Queries for Officer *
              </label>
              <Textarea
                value={actionData.queries}
                onChange={(e) => setActionData({ ...actionData, queries: e.target.value })}
                placeholder="List specific queries or issues that need clarification..."
                rows={5}
                className="border-yellow-300 focus:border-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Officer will be notified to provide additional information or clarification
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQueryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuery} className="bg-yellow-600 hover:bg-yellow-700">
              <FileQuestion className="w-4 h-4 mr-2" />
              Send Query
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
