'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Search, Filter } from 'lucide-react';
import { purchaseRequestAPI } from '@/services/api/purchaseRequestAPI';
import { PurchaseRequestCard, StatusBadge } from '@/components/procurement-advance';
import { toast } from 'sonner';

/**
 * Purchase Requests Page
 * Store Keeper interface for creating and managing purchase requests
 */

export default function PurchaseRequestsPage() {
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  // Load purchase requests
  const loadPurchaseRequests = async () => {
    try {
      setLoading(true);
      const response = await purchaseRequestAPI.getMyRequests(filters);
      setPurchaseRequests(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load purchase requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await purchaseRequestAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  useEffect(() => {
    loadPurchaseRequests();
    loadStatistics();
  }, [filters]);

  // Handle create PR
  const handleCreatePR = async (formData) => {
    try {
      await purchaseRequestAPI.create(formData);
      toast.success('Purchase request created successfully');
      setShowCreateDialog(false);
      loadPurchaseRequests();
      loadStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create purchase request');
    }
  };

  // Handle cancel PR
  const handleCancel = async (pr) => {
    if (!confirm('Are you sure you want to cancel this purchase request?')) return;

    try {
      await purchaseRequestAPI.cancel(pr.id, 'Cancelled by user');
      toast.success('Purchase request cancelled');
      loadPurchaseRequests();
      loadStatistics();
    } catch (error) {
      toast.error('Failed to cancel purchase request');
    }
  };

  // Handle view PR
  const handleView = (pr) => {
    setSelectedPR(pr);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Requests</h1>
          <p className="text-gray-500 mt-1">
            Request items for restocking inventory
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statistics.total || 0}</div>
              <p className="text-sm text-gray-500">Total Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {statistics.pending_admin || 0}
              </div>
              <p className="text-sm text-gray-500">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.pending_finance || 0}
              </div>
              <p className="text-sm text-gray-500">Pending Finance</p>
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
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by PR code..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border rounded-md px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved_admin">Admin Approved</option>
              <option value="approved_finance">Finance Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Requests List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : purchaseRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No purchase requests found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {purchaseRequests.map((pr) => (
            <PurchaseRequestCard
              key={pr.id}
              purchaseRequest={pr}
              onView={handleView}
              onCancel={pr.status === 'pending' ? handleCancel : null}
            />
          ))}
        </div>
      )}

      {/* Create Purchase Request Dialog */}
      <CreatePRDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreatePR}
      />

      {/* View PR Dialog */}
      {selectedPR && (
        <ViewPRDialog
          purchaseRequest={selectedPR}
          onClose={() => setSelectedPR(null)}
        />
      )}
    </div>
  );
}

// Create PR Dialog Component
function CreatePRDialog({ open, onClose, onSubmit }) {
  const [items, setItems] = useState([{ inventory_item_id: '', quantity: '', unit_price: '', justification: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { inventory_item_id: '', quantity: '', unit_price: '', justification: '' }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ items });
      setItems([{ inventory_item_id: '', quantity: '', unit_price: '', justification: '' }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold">Item {index + 1}</h4>
                  {items.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Inventory Item ID</Label>
                    <Input
                      type="number"
                      value={item.inventory_item_id}
                      onChange={(e) => handleItemChange(index, 'inventory_item_id', e.target.value)}
                      placeholder="Enter item ID"
                    />
                  </div>

                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      placeholder="Enter unit price"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Justification</Label>
                    <Textarea
                      value={item.justification}
                      onChange={(e) => handleItemChange(index, 'justification', e.target.value)}
                      placeholder="Why is this item needed?"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={handleAddItem} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Item
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// View PR Dialog Component
function ViewPRDialog({ purchaseRequest, onClose }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Purchase Request Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PurchaseRequestCard
            purchaseRequest={purchaseRequest}
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
