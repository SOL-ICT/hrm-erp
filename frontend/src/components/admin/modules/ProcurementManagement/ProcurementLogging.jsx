"use client";

import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Calendar } from 'lucide-react';
import { procurementAPI } from '@/services/api/procurementAPI';

export default function ProcurementLogging({ currentTheme, onBack }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchLogs();
  }, [dateFilter]);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      // Build clean parameters object - exclude undefined values
      const params = { page };
      if (dateFilter !== 'all') {
        params.date_filter = dateFilter;
      }
      
      const response = await procurementAPI.getAll(params);
      console.log("🔍 Procurement Logging API Response:", response);
      
      // Data is in response.data.data for this endpoint (paginated)
      const dataArray = response?.data?.data || [];
      setLogs(dataArray);
      
      console.log("📊 Procurement Logging data:", { 
        count: dataArray.length, 
        hasData: !!response?.data,
        hasDataData: !!response?.data?.data
      });
      
      // Handle pagination metadata
      if (response?.data?.meta) {
        setPagination({
          currentPage: response.data.meta.current_page || 1,
          totalPages: response.data.meta.last_page || 1,
          total: response.data.meta.total || 0
        });
      } else {
        // Set basic pagination if no meta
        setPagination({
          currentPage: 1,
          totalPages: Math.ceil(dataArray.length / 15),
          total: dataArray.length
        });
      }
    } catch (error) {
      console.error('Error fetching procurement logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.purchase_request?.request_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.inventory_item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.logger?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Procurement Logging
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Track all procurement activities and changes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 backdrop-blur-md shadow-lg`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`px-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg`}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Logs List - Modern Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center backdrop-blur-md shadow-lg col-span-full`}>
            <p className={currentTheme.textSecondary}>Loading procurement logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center backdrop-blur-md shadow-lg col-span-full`}>
            <div className="flex flex-col items-center gap-3">
              <Package className={`w-16 h-16 ${currentTheme.textSecondary} opacity-50`} />
              <p className={currentTheme.textSecondary}>No procurement logs found</p>
            </div>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div 
              key={log.id || index} 
              className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-5 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              {/* Header: Item Name & PR Code */}
              <div className="mb-4">
                <h3 className={`font-semibold ${currentTheme.textPrimary} text-lg mb-1`}>
                  {log.inventory_item?.name || log.inventory_item?.item_name || 'Item'}
                </h3>
                {log.purchase_request?.request_code && (
                  <p className={`text-sm ${currentTheme.textSecondary}`}>
                    PR: {log.purchase_request.request_code}
                  </p>
                )}
              </div>

              {/* Financial Info */}
              <div className={`${currentTheme.inputBg} rounded-lg p-3 mb-4 space-y-2`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${currentTheme.textSecondary}`}>Quantity:</span>
                  <span className={`font-medium ${currentTheme.textPrimary}`}>
                    {log.quantity || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${currentTheme.textSecondary}`}>Unit Price:</span>
                  <span className={`font-medium ${currentTheme.textPrimary}`}>
                    ₦{log.unit_price ? Number(log.unit_price).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}
                  </span>
                </div>
                <div className={`flex justify-between items-center pt-2 border-t ${currentTheme.border}`}>
                  <span className={`text-sm font-semibold ${currentTheme.textPrimary}`}>Total:</span>
                  <span className={`font-bold text-lg ${currentTheme.textPrimary}`}>
                    ₦{log.total_amount ? Number(log.total_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}
                  </span>
                </div>
              </div>

              {/* Supplier Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <Package className={`w-4 h-4 ${currentTheme.textSecondary} mt-0.5`} />
                  <div className="flex-1">
                    <p className={`text-xs ${currentTheme.textSecondary} mb-0.5`}>Supplier</p>
                    <p className={`text-sm font-medium ${currentTheme.textPrimary}`}>
                      {log.supplier_name || 'Not specified'}
                    </p>
                    {log.supplier_contact && (
                      <p className={`text-xs ${currentTheme.textSecondary}`}>
                        {log.supplier_contact}
                      </p>
                    )}
                  </div>
                </div>

                {log.invoice_number && (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${currentTheme.textSecondary}`}>Invoice:</span>
                    <span className={`text-sm font-mono ${currentTheme.textPrimary}`}>
                      {log.invoice_number}
                    </span>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className={`space-y-2 pt-3 border-t ${currentTheme.border}`}>
                {log.purchase_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${currentTheme.textSecondary}`} />
                    <div className="flex-1">
                      <p className={`text-xs ${currentTheme.textSecondary}`}>Purchase Date</p>
                      <p className={`text-sm ${currentTheme.textPrimary}`}>
                        {new Date(log.purchase_date).toLocaleDateString('en-NG', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {log.delivery_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${currentTheme.textSecondary}`} />
                    <div className="flex-1">
                      <p className={`text-xs ${currentTheme.textSecondary}`}>Delivery Date</p>
                      <p className={`text-sm ${currentTheme.textPrimary}`}>
                        {new Date(log.delivery_date).toLocaleDateString('en-NG', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Logger & Notes */}
              {(log.logger?.name || log.notes) && (
                <div className={`mt-3 pt-3 border-t ${currentTheme.border}`}>
                  {log.logger?.name && (
                    <p className={`text-xs ${currentTheme.textSecondary} mb-1`}>
                      Logged by: {log.logger.name}
                    </p>
                  )}
                  {log.notes && (
                    <p className={`text-xs ${currentTheme.textSecondary} italic`}>
                      {log.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 flex justify-between items-center`}>
          <div className={currentTheme.textSecondary}>
            Showing {logs.length} of {pagination.total} procurement logs
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className={`px-4 py-2 rounded-lg ${pagination.currentPage <= 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            <span className={`px-4 py-2 ${currentTheme.textPrimary}`}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchLogs(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className={`px-4 py-2 rounded-lg ${pagination.currentPage >= pagination.totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
