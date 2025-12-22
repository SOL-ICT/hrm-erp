'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Banknote, Search, CheckCircle } from 'lucide-react';
import { advanceAPI } from '@/services/api/advanceAPI';
import { AdvanceCard } from '@/components/procurement-advance';
import { toast } from 'sonner';

/**
 * Disbursement Page
 * For Accounts Department to process approved advances
 */

export default function DisbursementPage() {
  const [readyAdvances, setReadyAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const [disbursementData, setDisbursementData] = useState({
    disbursement_reference: '',
    disbursement_notes: '',
  });

  // Load advances ready for disbursement
  const loadReadyAdvances = async () => {
    try {
      setLoading(true);
      const response = await advanceAPI.getReadyForDisbursement();
      setReadyAdvances(response.data || []);
    } catch (error) {
      toast.error('Failed to load advances');
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
    loadReadyAdvances();
    loadStatistics();
  }, []);

  // Handle disburse
  const handleDisburse = async () => {
    if (!selectedAdvance || !disbursementData.disbursement_reference.trim()) {
      toast.error('Please provide disbursement reference');
      return;
    }

    try {
      await advanceAPI.disburse(selectedAdvance.id, disbursementData);
      toast.success('Advance disbursed successfully');
      setShowDisburseDialog(false);
      setSelectedAdvance(null);
      setDisbursementData({ disbursement_reference: '', disbursement_notes: '' });
      loadReadyAdvances();
      loadStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to disburse advance');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Disbursement</h1>
        <p className="text-gray-500 mt-1">
          Process approved advances for payment
        </p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {statistics.approved || 0}
              </div>
              <p className="text-sm text-gray-500">Ready for Disbursement</p>
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
              <div className="text-2xl font-bold text-purple-600">
                {statistics.retired || 0}
              </div>
              <p className="text-sm text-gray-500">Retired</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                ₦{(statistics.total_amount_disbursed || 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Total Disbursed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ready for Disbursement List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : readyAdvances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <p className="text-gray-500 text-lg">No advances ready for disbursement</p>
            <p className="text-gray-400 text-sm mt-2">
              All approved advances have been processed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Ready for Disbursement ({readyAdvances.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {readyAdvances.map((advance) => (
              <AdvanceCard
                key={advance.id}
                advance={advance}
                variant="detailed"
                onView={setSelectedAdvance}
                onDisburse={(adv) => {
                  setSelectedAdvance(adv);
                  setShowDisburseDialog(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Disburse Dialog */}
      <Dialog open={showDisburseDialog} onOpenChange={setShowDisburseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disburse Advance</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Advance Code: <span className="font-semibold">{selectedAdvance?.advance_code}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Officer: <span className="font-semibold">{selectedAdvance?.user?.name}</span>
              </p>
              <p className="text-lg font-bold text-blue-600">
                Amount: ₦{selectedAdvance?.amount?.toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Disbursement Reference * (e.g., Bank Transfer ID)
              </label>
              <Input
                value={disbursementData.disbursement_reference}
                onChange={(e) => setDisbursementData({
                  ...disbursementData,
                  disbursement_reference: e.target.value
                })}
                placeholder="TRF-2025-001, CHK-12345, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notes (Optional)
              </label>
              <Textarea
                value={disbursementData.disbursement_notes}
                onChange={(e) => setDisbursementData({
                  ...disbursementData,
                  disbursement_notes: e.target.value
                })}
                placeholder="Bank name, payment method, any additional notes..."
                rows={3}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ Officer must retire this advance within 2 weeks of disbursement
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisburseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDisburse}>
              <Banknote className="w-4 h-4 mr-2" />
              Disburse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      {selectedAdvance && !showDisburseDialog && (
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
                onClick={() => {
                  setShowDisburseDialog(true);
                }}
              >
                <Banknote className="w-4 h-4 mr-2" />
                Disburse
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
