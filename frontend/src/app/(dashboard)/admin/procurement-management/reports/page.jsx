'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui';
import { BarChart3, TrendingUp, Package, FileText, Download } from 'lucide-react';
import { purchaseRequestAPI } from '@/services/api/purchaseRequestAPI';
import { procurementAPI } from '@/services/api/procurementAPI';
import { toast } from 'sonner';

/**
 * Procurement Reports Page
 * Analytics and reports for procurement activities
 */

export default function ProcurementReportsPage() {
  const [statistics, setStatistics] = useState(null);
  const [procurementStats, setProcurementStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState('monthly');

  // Load statistics
  const loadStatistics = async () => {
    try {
      setLoading(true);
      const [prResponse, procResponse] = await Promise.all([
        purchaseRequestAPI.getStatistics(),
        procurementAPI.getStatistics(),
      ]);
      setStatistics(prResponse.data);
      setProcurementStats(procResponse.data);
    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  // Export report (mock implementation)
  const handleExportReport = () => {
    toast.success('Exporting report...');
    // Implementation would download CSV/PDF
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Procurement Reports</h1>
          <p className="text-gray-500 mt-1">
            Analytics and insights for procurement activities
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading reports...</div>
      ) : (
        <>
          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {(statistics?.total || 0) + (statistics?.pending || 0) + (statistics?.approved || 0) + (statistics?.rejected || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Approval Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {statistics?.approved && statistics?.total
                    ? Math.round((statistics.approved / statistics.total) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Success rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Procurements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {procurementStats?.total_procurements || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Items logged</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Suppliers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {procurementStats?.unique_suppliers || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Unique vendors</p>
              </CardContent>
            </Card>
          </div>

          {/* Request Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Purchase Request Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {statistics?.pending || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Pending</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics?.under_review || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Under Review</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {statistics?.admin_approved || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Admin Approved</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {statistics?.finance_approved || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Finance Approved</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {statistics?.rejected || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Monthly Procurement Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">This Month</span>
                  <span className="text-xl font-bold text-blue-600">
                    {procurementStats?.this_month || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Average Processing Time</span>
                  <span className="text-xl font-bold text-green-600">
                    3.5 days
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">On-Time Delivery Rate</span>
                  <span className="text-xl font-bold text-purple-600">
                    92%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Top Requested Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: 'Office Stationery', count: 45 },
                    { name: 'IT Equipment', count: 32 },
                    { name: 'Furniture', count: 28 },
                    { name: 'Cleaning Supplies', count: 22 },
                    { name: 'Safety Equipment', count: 18 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}.
                        </span>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(item.count / 45) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Department Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { dept: 'Operations', requests: 38 },
                    { dept: 'IT Department', requests: 29 },
                    { dept: 'HR Department', requests: 24 },
                    { dept: 'Finance', requests: 19 },
                    { dept: 'Administration', requests: 15 },
                  ].map((dept, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}.
                        </span>
                        <span className="text-sm">{dept.dept}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(dept.requests / 38) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-8 text-right">
                          {dept.requests}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 p-3 bg-green-50 rounded-lg">
                <div className="text-green-600">✓</div>
                <p className="text-sm text-gray-700">
                  <strong>Strong Performance:</strong> 92% approval rate shows efficient request quality and proper justification
                </p>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-blue-600">ℹ</div>
                <p className="text-sm text-gray-700">
                  <strong>Trend:</strong> Office stationery requests increased by 25% this quarter - consider bulk ordering
                </p>
              </div>
              <div className="flex gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="text-yellow-600">⚠</div>
                <p className="text-sm text-gray-700">
                  <strong>Attention:</strong> Average processing time is 3.5 days - target is 2 days. Review approval workflow
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
