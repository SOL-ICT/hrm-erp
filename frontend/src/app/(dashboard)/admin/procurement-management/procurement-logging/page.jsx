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
import { Package, CheckCircle, Calendar } from 'lucide-react';
import { procurementAPI } from '@/services/api/procurementAPI';
import { purchaseRequestAPI } from '@/services/api/purchaseRequestAPI';
import { toast } from 'sonner';

/**
 * Procurement Logging Page
 * Admin Officer logs received items after approval
 */

export default function ProcurementLoggingPage() {
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [procurementHistory, setProcurementHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [procurementData, setProcurementData] = useState({
    supplier_name: '',
    supplier_invoice: '',
    delivery_date: new Date().toISOString().split('T')[0],
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Load approved purchase requests
  const loadApprovedRequests = async () => {
    try {
      setLoading(true);
      const response = await purchaseRequestAPI.getAll();
      // Filter only finance-approved requests
      const approved = (response.data || []).filter(
        req => req.status === 'finance_approved' && !req.procurement_logged
      );
      setApprovedRequests(approved);
    } catch (error) {
      toast.error('Failed to load approved requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load procurement history
  const loadProcurementHistory = async () => {
    try {
      const response = await procurementAPI.getAll();
      setProcurementHistory(response.data || []);
    } catch (error) {
      console.error('Failed to load procurement history:', error);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await procurementAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  useEffect(() => {
    loadApprovedRequests();
    loadProcurementHistory();
    loadStatistics();
  }, []);

  // Handle log procurement
  const handleLogProcurement = async () => {
    if (!selectedRequest || !procurementData.supplier_name.trim() || !procurementData.supplier_invoice.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await procurementAPI.logProcurement({
        purchase_request_id: selectedRequest.id,
        ...procurementData,
      });
      toast.success('Procurement logged successfully');
      setShowLogDialog(false);
      setSelectedRequest(null);
      setProcurementData({
        supplier_name: '',
        supplier_invoice: '',
        delivery_date: new Date().toISOString().split('T')[0],
        received_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      loadApprovedRequests();
      loadProcurementHistory();
      loadStatistics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to log procurement');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Procurement Logging</h1>
        <p className="text-gray-500 mt-1">
          Log received items and update inventory
        </p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.total_procurements || 0}
              </div>
              <p className="text-sm text-gray-500">Total Procurements</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {statistics.this_month || 0}
              </div>
              <p className="text-sm text-gray-500">This Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-purple-600">
                {statistics.unique_suppliers || 0}
              </div>
              <p className="text-sm text-gray-500">Unique Suppliers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {approvedRequests.length}
              </div>
              <p className="text-sm text-gray-500">Awaiting Logging</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Approved Requests Awaiting Logging */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Awaiting Procurement Logging ({approvedRequests.length})
        </h2>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : approvedRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <p className="text-gray-500 text-lg">All requests logged</p>
              <p className="text-gray-400 text-sm mt-2">
                No approved purchase requests awaiting procurement logging
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {approvedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.request_code}</CardTitle>
                      <p className="text-sm text-gray-500">
                        Requested by {request.user?.name}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">
                      Approved
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Items:</p>
                    <div className="space-y-1">
                      {request.items?.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 flex justify-between">
                          <span>• {item.item_name}</span>
                          <span className="font-medium">Qty: {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {request.justification && (
                    <div>
                      <p className="text-sm font-medium">Justification:</p>
                      <p className="text-sm text-gray-600">{request.justification}</p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowLogDialog(true);
                    }}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Log Procurement
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Procurement History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Recent Procurement History ({procurementHistory.length})
        </h2>

        {procurementHistory.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No procurement history available
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {procurementHistory.slice(0, 10).map((procurement) => (
              <Card key={procurement.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-semibold">
                            {procurement.purchase_request?.request_code}
                          </p>
                          <p className="text-sm text-gray-500">
                            Supplier: {procurement.supplier_name}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Invoice</p>
                          <p className="font-medium">{procurement.supplier_invoice}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Delivery Date</p>
                          <p className="font-medium">
                            {new Date(procurement.delivery_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Received Date</p>
                          <p className="font-medium">
                            {new Date(procurement.received_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {procurement.notes && (
                        <p className="text-xs text-gray-600 mt-2 italic">
                          Note: {procurement.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Log Procurement Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Procurement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Purchase Request Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">
                {selectedRequest?.request_code}
              </p>
              <div className="space-y-1">
                {selectedRequest?.items?.map((item, index) => (
                  <div key={index} className="text-sm flex justify-between">
                    <span>{item.item_name}</span>
                    <span className="font-medium">Qty: {item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplier Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Supplier Name *
                </label>
                <Input
                  value={procurementData.supplier_name}
                  onChange={(e) => setProcurementData({ ...procurementData, supplier_name: e.target.value })}
                  placeholder="ABC Suppliers Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Supplier Invoice *
                </label>
                <Input
                  value={procurementData.supplier_invoice}
                  onChange={(e) => setProcurementData({ ...procurementData, supplier_invoice: e.target.value })}
                  placeholder="INV-2025-001"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Delivery Date
                </label>
                <Input
                  type="date"
                  value={procurementData.delivery_date}
                  onChange={(e) => setProcurementData({ ...procurementData, delivery_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Received Date
                </label>
                <Input
                  type="date"
                  value={procurementData.received_date}
                  onChange={(e) => setProcurementData({ ...procurementData, received_date: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes
              </label>
              <Textarea
                value={procurementData.notes}
                onChange={(e) => setProcurementData({ ...procurementData, notes: e.target.value })}
                placeholder="Condition of items, delivery issues, quality checks..."
                rows={3}
              />
            </div>

            <div className="bg-green-50 border border-green-200 p-3 rounded">
              <p className="text-sm text-green-800">
                ✅ Logging this procurement will automatically update inventory stock levels
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogProcurement}>
              <Package className="w-4 h-4 mr-2" />
              Log Procurement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
