"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { budgetAPI } from '@/services/api/budgetAPI';

export default function BudgetAllocation({ currentTheme, onBack }) {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await budgetAPI.getStatistics();
      console.log("🔍 Budget Allocation API Response:", response);
      
      // Data is directly in response.data as an object with statistics
      setBudgetData(response?.data);
      
      console.log("📊 Budget data:", { 
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : []
      });
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setError('Failed to load budget data. Please try again.');
      setBudgetData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Budget Allocation
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Track and manage advance budget allocation
          </p>
        </div>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Total Allocated</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                ₦{budgetData?.total_allocated ? Number(budgetData.total_allocated).toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Total Utilized</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                ₦{budgetData?.total_utilized ? Number(budgetData.total_utilized).toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>

        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <PieChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className={`text-sm ${currentTheme.textSecondary}`}>Available</p>
              <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                ₦{budgetData?.total_available ? Number(budgetData.total_available).toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Utilization Chart */}
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4`}>
            Budget Utilization
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className={currentTheme.textSecondary}>Utilized</span>
                <span className={currentTheme.textPrimary}>
                  {budgetData?.overall_utilization_percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${budgetData?.overall_utilization_percentage || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
              <div className="text-center">
                <p className={currentTheme.textSecondary}>Total Users</p>
                <p className={`font-bold ${currentTheme.textPrimary}`}>
                  {budgetData?.total_users_with_budget || 0}
                </p>
              </div>
              <div className="text-center">
                <p className={currentTheme.textSecondary}>Fiscal Year</p>
                <p className={`font-bold ${currentTheme.textPrimary}`}>
                  {budgetData?.fiscal_year || new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
          <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4`}>
            Budget Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                <span className={`text-sm ${currentTheme.textSecondary}`}>Allocated</span>
              </div>
              <span className={`text-sm font-semibold ${currentTheme.textPrimary}`}>
                ₦{budgetData?.total_allocated ? Number(budgetData.total_allocated).toLocaleString() : '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-3"></div>
                <span className={`text-sm ${currentTheme.textSecondary}`}>Utilized</span>
              </div>
              <span className={`text-sm font-semibold ${currentTheme.textPrimary}`}>
                ₦{budgetData?.total_utilized ? Number(budgetData.total_utilized).toLocaleString() : '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                <span className={`text-sm ${currentTheme.textSecondary}`}>Available</span>
              </div>
              <span className={`text-sm font-semibold ${currentTheme.textPrimary}`}>
                ₦{budgetData?.total_available ? Number(budgetData.total_available).toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
