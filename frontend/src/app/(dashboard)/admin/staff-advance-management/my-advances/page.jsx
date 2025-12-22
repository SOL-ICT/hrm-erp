'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { advanceAPI } from '@/services/api/advanceAPI';
import { AdvanceCard, BudgetSummary } from '@/components/procurement-advance';
import { toast } from 'sonner';

/**
 * Advance Management Page
 * Officers request cash advances for operational expenses
 */

export default function AdvanceManagementPage() {
  const [advances, setAdvances] = useState([]);
  const [myBudget, setMyBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);

  // Load advances
  const loadAdvances = async () => {
    try {
      setLoading(true);
      const response = await advanceAPI.getMyAdvances();
      setAdvances(response.data || []);
    } catch (error) {
      toast.error('Failed to load advances');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics and budget
  const loadData = async () => {
    try {
      const [statsRes, budgetRes] = await Promise.all([
        advanceAPI.getStatistics(),
        budgetAPI.getMyBudget()
      ]);
      setStatistics(statsRes.data);
      setMyBudget(budgetRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => {
    loadAdvances();
    loadData();
  }, []);

  // Handle create advance
  const handleCreateAdvance = async (formData) => {
    try {
      await advanceAPI.create(formData);
      toast.success('Advance request submitted successfully');
      setShowCreateDialog(false);
      loadAdvances();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create advance request');
    }
  };

  // Handle cancel advance
  const handleCancel = async (advance) => {
    if (!confirm('Are you sure you want to cancel this advance request?')) return;

    try {
      await advanceAPI.cancel(advance.id, 'Cancelled by user');
      toast.success('Advance request cancelled');
      loadAdvances();
      loadData();
    } catch (error) {
      toast.error('Failed to cancel advance request');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advance Management</h1>
          <p className="text-gray-500 mt-1">
            Request cash advances for operational expenses
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Request Advance
        </Button>
      </div>

      {/* Budget Summary */}
      {myBudget && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <BudgetSummary budget={myBudget} />
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{statistics.total || 0}</div>
                  <p className="text-sm text-gray-500">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    {statistics.pending || 0}
                  </div>
                  <p className="text-sm text-gray-500">Pending</p>
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
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {statistics.overdue || 0}
                  </div>
                  <p className="text-sm text-gray-500">Overdue</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Advances List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : advances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No advances found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Request your first advance
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {advances.map((advance) => (
            <AdvanceCard
              key={advance.id}
              advance={advance}
              onView={setSelectedAdvance}
              onRetire={(adv) => {/* Handle retirement */}}
            />
          ))}
        </div>
      )}

      {/* Create Advance Dialog */}
      <CreateAdvanceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateAdvance}
      />

      {/* View Advance Dialog */}
      {selectedAdvance && (
        <ViewAdvanceDialog
          advance={selectedAdvance}
          onClose={() => setSelectedAdvance(null)}
        />
      )}
    </div>
  );
}

// Create Advance Dialog Component
function CreateAdvanceDialog({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    office: '',
    budget_line: 'operational',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.amount || !formData.purpose || !formData.office) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({ amount: '', purpose: '', office: '', budget_line: 'operational' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Cash Advance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Amount *</Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <Label>Office *</Label>
            <Input
              value={formData.office}
              onChange={(e) => setFormData({ ...formData, office: e.target.value })}
              placeholder="e.g., Head Office, Regional Office - Lagos"
            />
          </div>

          <div>
            <Label>Budget Line *</Label>
            <select
              value={formData.budget_line}
              onChange={(e) => setFormData({ ...formData, budget_line: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="operational">Operational</option>
              <option value="capital">Capital</option>
              <option value="emergency">Emergency</option>
              <option value="training">Training</option>
              <option value="travel">Travel</option>
              <option value="miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div>
            <Label>Purpose *</Label>
            <Textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Describe the purpose of this advance..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// View Advance Dialog Component
function ViewAdvanceDialog({ advance, onClose }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Advance Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <AdvanceCard
            advance={advance}
            variant="detailed"
            showActions={false}
          />
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
