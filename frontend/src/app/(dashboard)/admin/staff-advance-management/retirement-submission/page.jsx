'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  Textarea, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui';
import { FileText, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import { advanceAPI } from '@/services/api/advanceAPI';
import { retirementAPI } from '@/services/api/retirementAPI';
import { AdvanceCard } from '@/components/procurement-advance';
import { toast } from 'sonner';

/**
 * Retirement Submission Page
 * Officers submit expense reports for disbursed advances
 */

export default function RetirementSubmissionPage() {
  const [disbursedAdvances, setDisbursedAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [showRetirementDialog, setShowRetirementDialog] = useState(false);
  const [expenseItems, setExpenseItems] = useState([
    { description: '', amount: 0, receipt_number: '' }
  ]);
  const [retirementData, setRetirementData] = useState({
    notes: '',
    documents: []
  });

  // Load disbursed advances
  const loadDisbursedAdvances = async () => {
    try {
      setLoading(true);
      const response = await advanceAPI.getMyAdvances();
      // Filter only disbursed advances without retirement
      const disbursed = (response.data || []).filter(
        adv => adv.status === 'disbursed' && !adv.retirement_id
      );
      setDisbursedAdvances(disbursed);
    } catch (error) {
      toast.error('Failed to load advances');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisbursedAdvances();
  }, []);

  // Add expense item
  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { description: '', amount: 0, receipt_number: '' }]);
  };

  // Remove expense item
  const removeExpenseItem = (index) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter((_, i) => i !== index));
    }
  };

  // Update expense item
  const updateExpenseItem = (index, field, value) => {
    const updated = [...expenseItems];
    updated[index][field] = value;
    setExpenseItems(updated);
  };

  // Calculate totals
  const totalExpenses = expenseItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const balanceToReturn = selectedAdvance ? selectedAdvance.amount - totalExpenses : 0;

  // Handle submit retirement
  const handleSubmitRetirement = async () => {
    if (!selectedAdvance) return;

    // Validate expense items
    const validItems = expenseItems.filter(item => 
      item.description.trim() && item.amount > 0
    );

    if (validItems.length === 0) {
      toast.error('Please add at least one expense item');
      return;
    }

    if (totalExpenses > selectedAdvance.amount) {
      toast.error('Total expenses exceed advance amount');
      return;
    }

    try {
      const formData = {
        advance_id: selectedAdvance.id,
        total_expenses: totalExpenses,
        balance_to_return: balanceToReturn,
        notes: retirementData.notes,
        items: validItems
      };

      await retirementAPI.submit(formData);
      toast.success('Retirement submitted successfully');
      setShowRetirementDialog(false);
      setSelectedAdvance(null);
      setExpenseItems([{ description: '', amount: 0, receipt_number: '' }]);
      setRetirementData({ notes: '', documents: [] });
      loadDisbursedAdvances();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit retirement');
    }
  };

  // Check if advance is overdue
  const isOverdue = (advance) => {
    if (!advance.disbursement_date) return false;
    const disbursementDate = new Date(advance.disbursement_date);
    const twoWeeksLater = new Date(disbursementDate);
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    return new Date() > twoWeeksLater;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Retirement Submission</h1>
        <p className="text-gray-500 mt-1">
          Submit expense reports for your disbursed advances
        </p>
      </div>

      {/* Overdue Warning */}
      {disbursedAdvances.some(adv => isOverdue(adv)) && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Overdue Retirements</p>
                <p className="text-sm text-red-700">
                  You have advances that are overdue for retirement (2 weeks deadline exceeded).
                  Please submit your expense reports immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disbursed Advances List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : disbursedAdvances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No disbursed advances</p>
            <p className="text-gray-400 text-sm mt-2">
              All advances have been retired or are awaiting disbursement
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Awaiting Retirement ({disbursedAdvances.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {disbursedAdvances.map((advance) => (
              <div key={advance.id} className="relative">
                {isOverdue(advance) && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      OVERDUE
                    </span>
                  </div>
                )}
                <AdvanceCard
                  advance={advance}
                  variant="detailed"
                  onRetire={(adv) => {
                    setSelectedAdvance(adv);
                    setShowRetirementDialog(true);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Retirement Dialog */}
      <Dialog open={showRetirementDialog} onOpenChange={setShowRetirementDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Retirement</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Advance Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Advance Code: <span className="font-semibold">{selectedAdvance?.advance_code}</span>
              </p>
              <p className="text-lg font-bold text-blue-600">
                Advance Amount: ₦{selectedAdvance?.amount?.toLocaleString()}
              </p>
              {selectedAdvance?.disbursement_date && (
                <p className="text-sm text-gray-600 mt-2">
                  Disbursed on: {new Date(selectedAdvance.disbursement_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Expense Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Expense Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addExpenseItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {expenseItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-5">
                          <label className="block text-xs font-medium mb-1">Description *</label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateExpenseItem(index, 'description', e.target.value)}
                            placeholder="Transportation, Hotel, etc."
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-medium mb-1">Amount *</label>
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateExpenseItem(index, 'amount', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-medium mb-1">Receipt #</label>
                          <Input
                            value={item.receipt_number}
                            onChange={(e) => updateExpenseItem(index, 'receipt_number', e.target.value)}
                            placeholder="RCT-001"
                          />
                        </div>
                        <div className="col-span-1 flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExpenseItem(index)}
                            disabled={expenseItems.length === 1}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Advance Amount:</span>
                    <span className="font-semibold">₦{selectedAdvance?.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Expenses:</span>
                    <span className="font-semibold">₦{totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className={`font-semibold ${balanceToReturn < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {balanceToReturn < 0 ? 'Excess (to be reimbursed):' : 'Balance to Return:'}
                      </span>
                      <span className={`font-bold text-lg ${balanceToReturn < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₦{Math.abs(balanceToReturn).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes
              </label>
              <Textarea
                value={retirementData.notes}
                onChange={(e) => setRetirementData({ ...retirementData, notes: e.target.value })}
                placeholder="Add any additional notes about your expenses..."
                rows={3}
              />
            </div>

            {/* Document Upload Section */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Supporting Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Upload receipts, reports, and other supporting documents</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (Max 10MB each)</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Browse Files
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRetirementDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRetirement}>
              <FileText className="w-4 h-4 mr-2" />
              Submit Retirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
