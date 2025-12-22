import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle
} from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(amount || 0);
};

/**
 * Budget Summary Component
 * Displays budget allocation, utilization, and availability
 */

export const BudgetSummary = ({ 
  budget,
  variant = 'default',
  showProgress = true
}) => {
  if (!budget) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500 text-center">No budget allocated</p>
        </CardContent>
      </Card>
    );
  }

  const {
    allocated_amount,
    utilized_amount,
    available_amount,
    fiscal_year,
    budget_period,
    is_active
  } = budget;

  const utilizationPercentage = (utilized_amount / allocated_amount) * 100;
  const isLowBudget = utilizationPercentage > 80;
  const isCritical = utilizationPercentage > 90;

  const periodLabels = {
    annual: 'Annual',
    quarterly: 'Quarterly',
    monthly: 'Monthly'
  };

  return (
    <Card className={variant === 'compact' ? '' : 'hover:shadow-lg transition-shadow'}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Budget Summary</span>
          {!is_active && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Inactive</span>
          )}
        </CardTitle>
        <p className="text-sm text-gray-500">
          {periodLabels[budget_period] || budget_period} • FY {fiscal_year}
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Budget Amounts */}
          <div className="space-y-3">
            {/* Allocated */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="w-4 h-4 mr-2" />
                <span>Allocated</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatCurrency(allocated_amount)}
              </span>
            </div>

            {/* Utilized */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span>Utilized</span>
              </div>
              <span className="font-semibold text-orange-600">
                {formatCurrency(utilized_amount)}
              </span>
            </div>

            {/* Available */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <TrendingDown className="w-4 h-4 mr-2" />
                <span>Available</span>
              </div>
              <span className={`font-semibold ${isLowBudget ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(available_amount)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Utilization</span>
                <span className={`font-semibold ${isCritical ? 'text-red-600' : isLowBudget ? 'text-orange-600' : 'text-gray-900'}`}>
                  {utilizationPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={utilizationPercentage} 
                className={`h-2 ${isCritical ? 'bg-red-100' : isLowBudget ? 'bg-orange-100' : ''}`}
              />
              {isLowBudget && (
                <div className={`flex items-center text-xs ${isCritical ? 'text-red-600' : 'text-orange-600'} mt-2`}>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  <span>
                    {isCritical ? 'Critical: Budget almost depleted' : 'Warning: Low budget remaining'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Compact Stats */}
          {variant === 'compact' && (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center">
              <div>
                <p className="text-xs text-gray-500">Allocated</p>
                <p className="text-sm font-semibold">{formatCurrency(allocated_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Used</p>
                <p className="text-sm font-semibold text-orange-600">{formatCurrency(utilized_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Left</p>
                <p className={`text-sm font-semibold ${isLowBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(available_amount)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetSummary;
