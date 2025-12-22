"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Filter } from 'lucide-react';
import { advanceAPI } from '@/services/api/advanceAPI';
import { Button } from '@/components/ui';

export default function Disbursement({ currentTheme, onBack }) {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchAdvancesForDisbursement();
  }, []);

  const fetchAdvancesForDisbursement = async (page = 1) => {
    try {
      setLoading(true);
      
      // Build clean parameters object
      const params = { page };
      
      const response = await advanceAPI.getReadyForDisbursement(params);
      console.log("🔍 Disbursement API Response:", response);
      
      // Data is in response.data.data for this endpoint (paginated)
      const dataArray = response?.data?.data || [];
      setAdvances(dataArray);
      
      console.log("📊 Disbursement data:", { 
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
      console.error('Error fetching advances for disbursement:', error);
      setAdvances([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdvances = advances.filter(advance =>
    advance.advance_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advance.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advance.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Disbursement
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Process approved advance disbursements
          </p>
        </div>
      </div>

      {/* Search */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 backdrop-blur-md shadow-lg`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
          <input
            type="text"
            placeholder="Search advances..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>

      {/* Disbursement List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center col-span-full`}>
            <p className={currentTheme.textSecondary}>Loading disbursements...</p>
          </div>
        ) : filteredAdvances.length === 0 ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center col-span-full`}>
            <p className={currentTheme.textSecondary}>No advances ready for disbursement</p>
          </div>
        ) : (
          filteredAdvances.map((advance) => (
            <div key={advance.id} className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 backdrop-blur-md shadow-lg`}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={`font-semibold ${currentTheme.textPrimary}`}>{advance.advance_code}</h3>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>To: {advance.user?.name}</p>
                    </div>
                    <p className={`text-lg font-bold ${currentTheme.textPrimary}`}>
                      ₦{Number(advance.amount).toLocaleString()}
                    </p>
                  </div>
                  <p className={`text-sm ${currentTheme.textSecondary} mb-3`}>{advance.purpose}</p>
                  <div className="flex justify-end">
                    <Button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Disburse
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 flex justify-between items-center`}>
          <div className={currentTheme.textSecondary}>
            Showing {advances.length} of {pagination.total} advances ready for disbursement
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchAdvancesForDisbursement(pagination.currentPage - 1)}
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
              onClick={() => fetchAdvancesForDisbursement(pagination.currentPage + 1)}
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
