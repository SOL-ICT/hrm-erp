import React from 'react';
import { Package, TrendingUp, MapPin, Calendar } from 'lucide-react';
import StockIndicator from './StockIndicator';

/**
 * InventoryItemCard Component
 * 
 * Displays inventory item with stock info and quick actions
 * 
 * @param {Object} item - Inventory item object
 * @param {Function} onRequestClick - Callback when request button is clicked
 * @param {Function} onViewDetails - Callback when view details is clicked
 * @param {boolean} showActions - Whether to show action buttons
 * @param {string} variant - Display variant ('compact', 'detailed')
 */
const InventoryItemCard = ({ 
  item,
  onRequestClick,
  onViewDetails,
  showActions = true,
  variant = 'compact'
}) => {
  const {
    id,
    code,
    name,
    category,
    description,
    total_stock,
    available_stock,
    reserved_stock,
    unit_price,
    location,
    last_restocked,
    is_active
  } = item;

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Category colors
  const getCategoryColor = (category) => {
    const colors = {
      'Office Supplies': 'bg-blue-100 text-blue-700 border-blue-200',
      'IT Equipment': 'bg-purple-100 text-purple-700 border-purple-200',
      'Facilities': 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500">{code}</span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getCategoryColor(category)}`}>
                {category}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{name}</h3>
          </div>
          <Package className="text-gray-400 flex-shrink-0 ml-2" size={18} />
        </div>

        {/* Stock indicator */}
        <div className="mb-3">
          <StockIndicator
            availableStock={available_stock}
            totalStock={total_stock}
            reservedStock={reserved_stock}
            variant="badge"
          />
        </div>

        {/* Price and location */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <span className="font-semibold text-gray-900">{formatPrice(unit_price)}</span>
          {location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {location}
            </span>
          )}
        </div>

        {/* Actions */}
        {showActions && is_active && (
          <div className="flex gap-2">
            <button
              onClick={() => onRequestClick?.(item)}
              disabled={available_stock <= 0}
              className={`
                flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors
                ${available_stock > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {available_stock > 0 ? 'Request' : 'Out of Stock'}
            </button>
            {onViewDetails && (
              <button
                onClick={() => onViewDetails?.(item)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold"
              >
                Details
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {code}
            </span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-lg border ${getCategoryColor(category)}`}>
              {category}
            </span>
            {!is_active && (
              <span className="px-3 py-1 text-sm font-semibold rounded-lg bg-red-100 text-red-700 border border-red-200">
                Inactive
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 text-xl mb-1">{name}</h3>
          {description && (
            <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
            <Package className="text-blue-600" size={32} />
          </div>
        </div>
      </div>

      {/* Stock information */}
      <div className="mb-4">
        <StockIndicator
          availableStock={available_stock}
          totalStock={total_stock}
          reservedStock={reserved_stock}
          variant="detailed"
        />
      </div>

      {/* Additional info */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-gray-500" />
          <div>
            <div className="text-xs text-gray-600">Unit Price</div>
            <div className="font-bold text-gray-900">{formatPrice(unit_price)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-500" />
          <div>
            <div className="text-xs text-gray-600">Location</div>
            <div className="font-semibold text-gray-900">{location || 'N/A'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <Calendar size={16} className="text-gray-500" />
          <div>
            <div className="text-xs text-gray-600">Last Restocked</div>
            <div className="font-semibold text-gray-900">{formatDate(last_restocked)}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && is_active && (
        <div className="flex gap-3">
          <button
            onClick={() => onRequestClick?.(item)}
            disabled={available_stock <= 0}
            className={`
              flex-1 py-3 px-4 rounded-lg font-semibold transition-colors
              ${available_stock > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {available_stock > 0 ? 'Request Item' : 'Out of Stock'}
          </button>
          {onViewDetails && (
            <button
              onClick={() => onViewDetails?.(item)}
              className="px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
            >
              View Full Details
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryItemCard;
