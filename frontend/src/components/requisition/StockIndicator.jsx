import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * StockIndicator Component
 * 
 * Visual indicator for inventory stock levels
 * 
 * @param {number} availableStock - Available stock quantity
 * @param {number} totalStock - Total stock quantity
 * @param {number} reservedStock - Reserved stock quantity
 * @param {string} variant - Display variant ('badge', 'progress', 'detailed')
 * @param {number} lowStockThreshold - Threshold for low stock warning (default: 10)
 */
const StockIndicator = ({ 
  availableStock = 0,
  totalStock = 0,
  reservedStock = 0,
  variant = 'badge',
  lowStockThreshold = 10 
}) => {
  // Determine stock status
  const getStockStatus = () => {
    if (availableStock <= 0) return 'out';
    if (availableStock <= lowStockThreshold) return 'low';
    return 'available';
  };

  const stockStatus = getStockStatus();

  // Status configurations
  const statusConfig = {
    available: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: CheckCircle,
      label: 'In Stock',
      progressColor: 'bg-green-500',
    },
    low: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: AlertTriangle,
      label: 'Low Stock',
      progressColor: 'bg-amber-500',
    },
    out: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: AlertCircle,
      label: 'Out of Stock',
      progressColor: 'bg-red-500',
    },
  };

  const config = statusConfig[stockStatus];
  const Icon = config.icon;

  // Calculate percentage for progress bar
  const availablePercentage = totalStock > 0 
    ? Math.round((availableStock / totalStock) * 100) 
    : 0;

  // Badge variant
  if (variant === 'badge') {
    return (
      <span 
        className={`
          px-3 py-1 
          text-sm 
          font-semibold 
          rounded-full 
          ${config.bg} 
          ${config.text}
          border
          ${config.border}
          inline-flex 
          items-center 
          gap-1.5
        `}
      >
        <Icon size={14} />
        {config.label}
        <span className="ml-1 font-bold">{availableStock}</span>
      </span>
    );
  }

  // Progress bar variant
  if (variant === 'progress') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={`font-medium ${config.text} flex items-center gap-1.5`}>
            <Icon size={14} />
            {config.label}
          </span>
          <span className="text-gray-600 font-semibold">
            {availableStock} / {totalStock}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 ${config.progressColor} transition-all duration-300 ease-out`}
            style={{ width: `${availablePercentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <div className="space-y-3">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span 
            className={`
              px-3 py-1.5 
              text-sm 
              font-semibold 
              rounded-lg 
              ${config.bg} 
              ${config.text}
              border
              ${config.border}
              inline-flex 
              items-center 
              gap-2
            `}
          >
            <Icon size={16} />
            {config.label}
          </span>
        </div>

        {/* Stock breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{totalStock}</div>
            <div className="text-xs text-gray-600 mt-1">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{availableStock}</div>
            <div className="text-xs text-green-600 mt-1">Available</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{reservedStock}</div>
            <div className="text-xs text-blue-600 mt-1">Reserved</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 ${config.progressColor} transition-all duration-300 ease-out`}
            style={{ width: `${availablePercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-600 text-right">
          {availablePercentage}% Available
        </div>
      </div>
    );
  }

  return null;
};

export default StockIndicator;
