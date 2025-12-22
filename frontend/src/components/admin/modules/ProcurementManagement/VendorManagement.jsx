"use client";

import React, { useState, useEffect } from 'react';
import { Building, Plus, Search, Edit, Trash2, Package, FileText } from 'lucide-react';
import { vendorAPI } from '@/services/api/vendorAPI';
import { procurementAPI } from '@/services/api/procurementAPI';
import { VendorFormModal } from './VendorFormModal';
import { ProcurementLogModal } from './ProcurementLogModal';
import { Button } from '@/components/ui';

export default function VendorManagement({ currentTheme, preferences, onBack }) {
  const [activeTab, setActiveTab] = useState('vendors');
  
  // Vendors tab state
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isVendorSubmitting, setIsVendorSubmitting] = useState(false);
  
  // Procurement logs tab state
  const [procurementLogs, setProcurementLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLogSubmitting, setIsLogSubmitting] = useState(false);
  
  // Pagination
  const [vendorPagination, setVendorPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [logPagination, setLogPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    if (activeTab === 'vendors') {
      fetchVendors();
    } else {
      fetchProcurementLogs();
    }
  }, [activeTab]);

  // Fetch vendors for Tab 1
  const fetchVendors = async (page = 1) => {
    try {
      setVendorsLoading(true);
      const params = { page };
      const response = await vendorAPI.getAll(params);
      
      const dataArray = response?.data?.data || [];
      setVendors(dataArray);
      
      if (response?.data?.meta) {
        setVendorPagination({
          currentPage: response.data.meta.current_page || 1,
          totalPages: response.data.meta.last_page || 1,
          total: response.data.meta.total || 0
        });
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  // Fetch procurement logs for Tab 2
  const fetchProcurementLogs = async (page = 1) => {
    try {
      setLogsLoading(true);
      const params = { page };
      const response = await procurementAPI.getAll(params);
      
      const dataArray = response?.data?.data || [];
      setProcurementLogs(dataArray);
      
      if (response?.data?.meta) {
        setLogPagination({
          currentPage: response.data.meta.current_page || 1,
          totalPages: response.data.meta.last_page || 1,
          total: response.data.meta.total || 0
        });
      }
    } catch (error) {
      console.error('Error fetching procurement logs:', error);
      setProcurementLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // Vendor CRUD handlers
  const handleAddVendor = () => {
    setSelectedVendor(null);
    setShowVendorModal(true);
  };

  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setShowVendorModal(true);
  };

  const handleVendorSubmit = async (formData, vendorId) => {
    try {
      setIsVendorSubmitting(true);
      if (vendorId) {
        await vendorAPI.update(vendorId, formData);
        alert('Vendor updated successfully');
      } else {
        await vendorAPI.create(formData);
        alert('Vendor created successfully');
      }
      setShowVendorModal(false);
      setSelectedVendor(null);
      fetchVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor');
    } finally {
      setIsVendorSubmitting(false);
    }
  };

  const handleDeleteVendor = async (vendor) => {
    if (!confirm(`Are you sure you want to delete vendor "${vendor.vendor_name}"?`)) {
      return;
    }
    
    try {
      await vendorAPI.delete(vendor.id);
      alert('Vendor deleted successfully');
      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Failed to delete vendor');
    }
  };

  // Procurement Log CRUD handlers
  const handleAddLog = () => {
    setSelectedLog(null);
    setShowLogModal(true);
  };

  const handleEditLog = (log) => {
    setSelectedLog(log);
    setShowLogModal(true);
  };

  const handleLogSubmit = async (formData, logId) => {
    try {
      setIsLogSubmitting(true);
      if (logId) {
        await procurementAPI.update(logId, formData);
        alert('Procurement log updated successfully');
      } else {
        await procurementAPI.create(formData);
        alert('Procurement log created successfully');
      }
      setShowLogModal(false);
      setSelectedLog(null);
      fetchProcurementLogs();
    } catch (error) {
      console.error('Error saving procurement log:', error);
      alert('Failed to save procurement log');
    } finally {
      setIsLogSubmitting(false);
    }
  };

  const handleDeleteLog = async (log) => {
    if (!confirm(`Are you sure you want to delete this procurement log?`)) {
      return;
    }
    
    try {
      await procurementAPI.delete(log.id);
      alert('Procurement log deleted successfully');
      fetchProcurementLogs();
    } catch (error) {
      console.error('Error deleting procurement log:', error);
      alert('Failed to delete procurement log');
    }
  };

  // Filtered data
  const filteredVendors = vendors.filter(vendor =>
    vendor.vendor_name?.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
    vendor.vendor_code?.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
    vendor.category?.toLowerCase().includes(vendorSearchTerm.toLowerCase())
  );

  const filteredLogs = procurementLogs.filter(log =>
    log.vendor?.vendor_name?.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
    log.invoice_number?.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
    log.inventory_item?.name?.toLowerCase().includes(logSearchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Vendor Management
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Manage vendor directory and procurement transactions
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Main Card with Tabs */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl backdrop-blur-md shadow-lg overflow-hidden`}>
        {/* Tabs Navigation */}
        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
              activeTab === 'vendors'
                ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                : `${currentTheme.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-800`
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Vendor Directory</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'vendors' 
                ? 'bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
            }`}>
              {vendorPagination.total || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                : `${currentTheme.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-800`
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Procurement Logs</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'logs' 
                ? 'bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
            }`}>
              {logPagination.total || 0}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Search & Action Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${currentTheme.textSecondary}`} />
              <input
                type="text"
                placeholder={activeTab === 'vendors' ? 'Search vendors...' : 'Search procurement logs...'}
                value={activeTab === 'vendors' ? vendorSearchTerm : logSearchTerm}
                onChange={(e) => activeTab === 'vendors' ? setVendorSearchTerm(e.target.value) : setLogSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <Button 
              onClick={activeTab === 'vendors' ? handleAddVendor : handleAddLog}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'vendors' ? 'Add Vendor' : 'Add Log'}
            </Button>
          </div>

          {/* Tab Content - Vendors or Logs */}
          {activeTab === 'vendors' ? (
            /* VENDOR DIRECTORY TAB */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {vendorsLoading ? (
                  <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center col-span-full`}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className={`${currentTheme.textSecondary} text-sm`}>Loading vendors...</p>
                    </div>
                  </div>
                ) : filteredVendors.length === 0 ? (
                  <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center col-span-full`}>
                    <div className="flex flex-col items-center gap-2">
                      <Building className={`w-12 h-12 ${currentTheme.textSecondary} opacity-40`} />
                      <p className={`${currentTheme.textSecondary} text-sm`}>No vendors found</p>
                    </div>
                  </div>
                ) : (
                  filteredVendors.map((vendor) => (
                    <div 
                      key={vendor.id} 
                      className={`${currentTheme.cardBg} ${currentTheme.border} rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold ${currentTheme.textPrimary} text-base truncate`}>
                            {vendor.vendor_name}
                          </h3>
                          <p className={`text-xs ${currentTheme.textSecondary} font-mono mt-0.5`}>
                            {vendor.vendor_code}
                          </p>
                        </div>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          vendor.status === 'active' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : vendor.status === 'blacklisted'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {vendor.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs mb-3">
                        <div className={`flex items-center gap-1.5 ${currentTheme.textSecondary}`}>
                          <span className="w-16 font-medium">Contact:</span>
                          <span className="truncate">{vendor.contact_person}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${currentTheme.textSecondary}`}>
                          <span className="w-16 font-medium">Phone:</span>
                          <span>{vendor.contact_phone}</span>
                        </div>
                        {vendor.category && (
                          <div className={`flex items-center gap-1.5 ${currentTheme.textSecondary}`}>
                            <span className="w-16 font-medium">Category:</span>
                            <span className="truncate">{vendor.category}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg mb-3">
                        <div className="text-center flex-1">
                          <p className={`text-xs ${currentTheme.textSecondary}`}>Transactions</p>
                          <p className={`text-sm font-bold ${currentTheme.textPrimary}`}>{vendor.transaction_count || 0}</p>
                        </div>
                        {vendor.total_transactions && (
                          <div className="text-center flex-1 border-l dark:border-slate-700">
                            <p className={`text-xs ${currentTheme.textSecondary}`}>Total Value</p>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(vendor.total_transactions)}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditVendor(vendor)}
                          className="flex-1 h-8 text-xs"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteVendor(vendor)}
                          className="h-8"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Vendor Pagination */}
              {vendorPagination.totalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
                  <div className={`text-sm ${currentTheme.textSecondary}`}>
                    Showing {filteredVendors.length} of {vendorPagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchVendors(vendorPagination.currentPage - 1)}
                      disabled={vendorPagination.currentPage <= 1}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        vendorPagination.currentPage <= 1
                          ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      ← Prev
                    </button>
                    <span className={`px-3 py-1.5 text-sm ${currentTheme.textPrimary} font-medium`}>
                      {vendorPagination.currentPage} / {vendorPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchVendors(vendorPagination.currentPage + 1)}
                      disabled={vendorPagination.currentPage >= vendorPagination.totalPages}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        vendorPagination.currentPage >= vendorPagination.totalPages
                          ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* PROCUREMENT LOGS TAB */
            <>
              <div className="space-y-3 mb-6">
                {logsLoading ? (
                  <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center`}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <p className={`${currentTheme.textSecondary} text-sm`}>Loading procurement logs...</p>
                    </div>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center`}>
                    <div className="flex flex-col items-center gap-2">
                      <Package className={`w-12 h-12 ${currentTheme.textSecondary} opacity-40`} />
                      <p className={`${currentTheme.textSecondary} text-sm`}>No procurement logs found</p>
                    </div>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`${currentTheme.cardBg} ${currentTheme.border} rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Left: Item Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold ${currentTheme.textPrimary} text-sm truncate`}>
                                {log.inventory_item?.name || 'Unknown Item'}
                              </h3>
                              <p className={`text-xs ${currentTheme.textSecondary} truncate`}>
                                {log.vendor?.vendor_name || log.supplier_name || 'Unknown Vendor'}
                              </p>
                            </div>
                          </div>

                          {/* Compact Details Grid */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className={currentTheme.textSecondary}>Qty:</span>
                              <span className={`font-medium ${currentTheme.textPrimary}`}>{log.quantity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={currentTheme.textSecondary}>Unit:</span>
                              <span className={`font-medium ${currentTheme.textPrimary}`}>{formatCurrency(log.unit_price)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={currentTheme.textSecondary}>Date:</span>
                              <span className={`font-medium ${currentTheme.textPrimary}`}>{formatDate(log.purchase_date)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={currentTheme.textSecondary}>By:</span>
                              <span className={`font-medium ${currentTheme.textPrimary} truncate ml-1`}>{log.logger?.name || 'N/A'}</span>
                            </div>
                          </div>

                          {log.invoice_number && (
                            <div className={`text-xs ${currentTheme.textSecondary} mt-2 flex items-center gap-1`}>
                              <FileText className="w-3 h-3" />
                              <span className="font-mono">{log.invoice_number}</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <p className={`text-xs ${currentTheme.textSecondary} mb-0.5`}>Total</p>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                              {formatCurrency(log.total_amount)}
                            </p>
                          </div>

                          <div className="flex gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLog(log)}
                              className="h-7 px-2"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteLog(log)}
                              className="h-7 px-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {log.notes && (
                        <div className="mt-3 pt-3 border-t dark:border-slate-700">
                          <p className={`text-xs ${currentTheme.textSecondary} italic`}>{log.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Logs Pagination */}
              {logPagination.totalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
                  <div className={`text-sm ${currentTheme.textSecondary}`}>
                    Showing {filteredLogs.length} of {logPagination.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchProcurementLogs(logPagination.currentPage - 1)}
                      disabled={logPagination.currentPage <= 1}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        logPagination.currentPage <= 1
                          ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      ← Prev
                    </button>
                    <span className={`px-3 py-1.5 text-sm ${currentTheme.textPrimary} font-medium`}>
                      {logPagination.currentPage} / {logPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchProcurementLogs(logPagination.currentPage + 1)}
                      disabled={logPagination.currentPage >= logPagination.totalPages}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        logPagination.currentPage >= logPagination.totalPages
                          ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <VendorFormModal
        isOpen={showVendorModal}
        onClose={() => {
          setShowVendorModal(false);
          setSelectedVendor(null);
        }}
        vendor={selectedVendor}
        onSubmit={handleVendorSubmit}
        isSubmitting={isVendorSubmitting}
      />

      <ProcurementLogModal
        isOpen={showLogModal}
        onClose={() => {
          setShowLogModal(false);
          setSelectedLog(null);
        }}
        procurementLog={selectedLog}
        onSubmit={handleLogSubmit}
        isSubmitting={isLogSubmitting}
        vendors={vendors}
        purchaseRequests={[]}
        inventoryItems={[]}
      />
    </div>
  );
}
