'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DollarSign, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { budgetAPI } from '@/services/api/budgetAPI';
import { BudgetSummary } from '@/components/procurement-advance';
import { toast } from 'sonner';

/**
 * Budget Allocation Page
 * For Finance Director to manage budget allocations
 */

export default function BudgetAllocationPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [allocationData, setAllocationData] = useState({
    user_id: '',
    fiscal_year: new Date().getFullYear(),
    period: 'Q1',
    budget_line: '',
    allocated_amount: '',
    notes: '',
  });

  const currentYear = new Date().getFullYear();
  const fiscalYears = [currentYear - 1, currentYear, currentYear + 1];
  const periods = ['Q1', 'Q2', 'Q3', 'Q4', 'Annual'];

  // Load all budgets
  const loadBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getAll();
      setBudgets(response.data || []);
    } catch (error) {
      toast.error('Failed to load budgets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await budgetAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  useEffect(() => {
    loadBudgets();
    loadStatistics();
  }, []);

  // Handle allocate new budget
  const handleAllocate = async () => {
    if (!allocationData.user_id || !allocationData.budget_line || !allocationData.allocated_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(allocationData.allocated_amount) <= 0) {
      toast.error('Allocated amount must be greater than 0');
      return;
    }

    try {
      await budgetAPI.allocate({
        ...allocationData,
        allocated_amount: parseFloat(allocationData.allocated_amount),
      });
      toast.success('Budget allocated successfully');
      setShowAllocateDialog(false);
      setAllocationData({
        user_id: '',
        fiscal_year: currentYear,
        period: 'Q1',
        budget_line: '',
        allocated_amount: '',
        notes: '',
      });
      loadBudgets();
      loadStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to allocate budget');
    }
  };

  // Handle update budget
  const handleUpdate = async () => {
    if (!selectedBudget || !allocationData.allocated_amount) {
      toast.error('Please provide allocated amount');
      return;
    }

    if (parseFloat(allocationData.allocated_amount) <= 0) {
      toast.error('Allocated amount must be greater than 0');
      return;
    }

    try {
      await budgetAPI.update(selectedBudget.id, {
        allocated_amount: parseFloat(allocationData.allocated_amount),
        notes: allocationData.notes,
      });
      toast.success('Budget updated successfully');
      setShowUpdateDialog(false);
      setSelectedBudget(null);
      setAllocationData({
        user_id: '',
        fiscal_year: currentYear,
        period: 'Q1',
        budget_line: '',
        allocated_amount: '',
        notes: '',
      });
      loadBudgets();
      loadStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update budget');
    }
  };

  // Calculate utilization percentage
  const getUtilizationPercentage = (budget) => {
    if (!budget.allocated_amount || budget.allocated_amount === 0) return 0;
    return ((budget.utilized_amount || 0) / budget.allocated_amount) * 100;
  };

  // Get budget status
  const getBudgetStatus = (budget) => {
    const utilization = getUtilizationPercentage(budget);
    if (utilization >= 90) return { color: 'red', label: 'Critical' };
    if (utilization >= 75) return { color: 'yellow', label: 'Warning' };
    return { color: 'green', label: 'Healthy' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Allocation</h1>
          <p className="text-gray-500 mt-1">
            Manage budget allocations for staff advances
          </p>
        </div>
        <Button onClick={() => setShowAllocateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Allocate Budget
        </Button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                ₦{(statistics.total_allocated || 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Total Allocated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                ₦{(statistics.total_utilized || 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Total Utilized</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                ₦{(statistics.total_available || 0).toLocaleString()}
              </div>
              <p className="text-sm text-gray-500">Total Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.active_budgets || 0}
              </div>
              <p className="text-sm text-gray-500">Active Budgets</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low Budget Alerts */}
      {budgets.filter(b => getUtilizationPercentage(b) >= 75).length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Budget Alerts</p>
                <p className="text-sm text-yellow-700">
                  {budgets.filter(b => getUtilizationPercentage(b) >= 90).length} budget(s) critically low,{' '}
                  {budgets.filter(b => getUtilizationPercentage(b) >= 75 && getUtilizationPercentage(b) < 90).length} budget(s) need attention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budgets List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No budget allocations</p>
            <p className="text-gray-400 text-sm mt-2">
              Create budget allocations for staff to request advances
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const status = getBudgetStatus(budget);
            const utilization = getUtilizationPercentage(budget);

            return (
              <Card key={budget.id} className={`border-l-4 border-l-${status.color}-500`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{budget.user?.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {budget.fiscal_year} - {budget.period} | {budget.budget_line}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded bg-${status.color}-100 text-${status.color}-700`}>
                      {status.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Budget Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Utilization</span>
                      <span className="font-semibold">{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          utilization >= 90
                            ? 'bg-red-600'
                            : utilization >= 75
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Allocated</p>
                      <p className="font-semibold">₦{budget.allocated_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Utilized</p>
                      <p className="font-semibold text-blue-600">₦{budget.utilized_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Available</p>
                      <p className="font-semibold text-green-600">₦{budget.available_amount?.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {budget.notes && (
                    <p className="text-xs text-gray-600 italic">Note: {budget.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBudget(budget);
                        setAllocationData({
                          ...allocationData,
                          allocated_amount: budget.allocated_amount,
                          notes: budget.notes || '',
                        });
                        setShowUpdateDialog(true);
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Allocate Budget Dialog */}
      <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate New Budget</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Fiscal Year *</label>
                <Select
                  value={allocationData.fiscal_year.toString()}
                  onValueChange={(value) => setAllocationData({ ...allocationData, fiscal_year: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Period *</label>
                <Select
                  value={allocationData.period}
                  onValueChange={(value) => setAllocationData({ ...allocationData, period: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">User ID *</label>
              <Input
                type="number"
                value={allocationData.user_id}
                onChange={(e) => setAllocationData({ ...allocationData, user_id: e.target.value })}
                placeholder="Enter user ID"
              />
              <p className="text-xs text-gray-500 mt-1">Officer who will use this budget</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Budget Line *</label>
              <Input
                value={allocationData.budget_line}
                onChange={(e) => setAllocationData({ ...allocationData, budget_line: e.target.value })}
                placeholder="e.g., Field Operations, Training, Emergency Response"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Allocated Amount (₦) *</label>
              <Input
                type="number"
                value={allocationData.allocated_amount}
                onChange={(e) => setAllocationData({ ...allocationData, allocated_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <Textarea
                value={allocationData.notes}
                onChange={(e) => setAllocationData({ ...allocationData, notes: e.target.value })}
                placeholder="Any special conditions or notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAllocateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAllocate}>
              <DollarSign className="w-4 h-4 mr-2" />
              Allocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Budget Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Budget Allocation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Officer: <span className="font-semibold">{selectedBudget?.user?.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                {selectedBudget?.fiscal_year} - {selectedBudget?.period} | {selectedBudget?.budget_line}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Current Allocation</label>
              <Input value={`₦${selectedBudget?.allocated_amount?.toLocaleString()}`} disabled />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">New Allocated Amount (₦) *</label>
              <Input
                type="number"
                value={allocationData.allocated_amount}
                onChange={(e) => setAllocationData({ ...allocationData, allocated_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Update Notes</label>
              <Textarea
                value={allocationData.notes}
                onChange={(e) => setAllocationData({ ...allocationData, notes: e.target.value })}
                placeholder="Reason for update..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
