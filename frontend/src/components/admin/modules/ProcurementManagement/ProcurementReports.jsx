"use client";

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui';

export default function ProcurementReports({ currentTheme, onBack }) {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReportData({
        totalSpent: Math.floor(Math.random() * 1000000),
        totalTransactions: Math.floor(Math.random() * 100),
        topVendor: 'Sample Vendor Ltd.',
        averageAmount: Math.floor(Math.random() * 50000)
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Procurement Reports
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Analytics and insights on procurement activities
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Report Filters */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 backdrop-blur-md shadow-lg`}>
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className={`px-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg`}
          >
            <option value="summary">Summary Report</option>
            <option value="vendor">Vendor Analysis</option>
            <option value="spending">Spending Report</option>
            <option value="timeline">Timeline Report</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`px-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg`}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button 
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 backdrop-blur-md shadow-lg text-center`}>
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className={currentTheme.textSecondary}>Generating report...</p>
        </div>
      ) : reportData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Total Spent</p>
                <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                  ₦{reportData.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Transactions</p>
                <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                  {reportData.totalTransactions}
                </p>
              </div>
            </div>
          </div>

          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Top Vendor</p>
                <p className={`text-sm font-bold ${currentTheme.textPrimary}`}>
                  {reportData.topVendor}
                </p>
              </div>
            </div>
          </div>

          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Avg Amount</p>
                <p className={`text-lg font-bold ${currentTheme.textPrimary}`}>
                  ₦{reportData.averageAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 backdrop-blur-md shadow-lg text-center`}>
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h3 className={`text-xl font-semibold ${currentTheme.textPrimary} mb-2`}>
            Generate Report
          </h3>
          <p className={currentTheme.textSecondary}>
            Click "Generate Report" to view procurement analytics
          </p>
        </div>
      )}
    </div>
  );
}
