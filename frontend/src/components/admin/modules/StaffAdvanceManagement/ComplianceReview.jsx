"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { advanceAPI } from '@/services/api/advanceAPI';

export default function ComplianceReview({ currentTheme, onBack }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchComplianceReviews();
  }, []);

  const fetchComplianceReviews = async () => {
    try {
      setLoading(true);
      const response = await advanceAPI.getAll({ compliance_check: true });
      const dataArray = response?.data?.data || response?.data || [];
      setReviews(dataArray);
    } catch (error) {
      console.error('Error fetching compliance reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review =>
    review.advance_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Compliance Review
          </h1>
          <p className={`${currentTheme.textSecondary} mt-1`}>
            Monitor compliance and audit trail for advances
          </p>
        </div>
      </div>

      {/* Search */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-4 backdrop-blur-md shadow-lg`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
          <input
            type="text"
            placeholder="Search compliance reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center`}>
            <p className={currentTheme.textSecondary}>Loading compliance reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-8 text-center`}>
            <Shield className="w-12 h-12 mx-auto mb-3 text-green-600" />
            <p className={currentTheme.textSecondary}>All advances are compliant</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-6 backdrop-blur-md shadow-lg`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3">
                  {review.status === 'approved' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : review.status === 'rejected' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${currentTheme.textPrimary}`}>{review.advance_code}</h3>
                    <p className={`text-xs ${currentTheme.textSecondary}`}>{review.user?.name}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className={`font-semibold ${currentTheme.textPrimary}`}>₦{review.amount ? Number(review.amount).toLocaleString() : '0'}</p>
                  <p className={`text-xs ${currentTheme.textSecondary}`}>Amount</p>
                </div>
                
                <div>
                  <p className={`text-sm ${currentTheme.textSecondary} line-clamp-2`}>{review.purpose}</p>
                </div>
                
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    review.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : review.status === 'rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {review.status === 'approved' ? 'Approved' : review.status === 'rejected' ? 'Rejected' : 'Under Review'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
