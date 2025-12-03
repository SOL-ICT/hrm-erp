import React, { useState } from 'react';
import { Search, Loader, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Calendar, ArrowRight, User, Shield, Clock, FileText, X } from 'lucide-react';
import { useRoleHistory } from '../hooks/useRoleHistory';

const RoleHistoryTab = () => {
  const [searchInput, setSearchInput] = useState('');

  const { history, pagination, loading, error, goToPage, refresh } = useRoleHistory({
    per_page: 15
  });

  const getRoleBadgeColor = (roleSlug) => {
    const colors = {
      'super-admin': 'bg-purple-100 text-purple-800',
      'global-admin': 'bg-indigo-100 text-indigo-800',
      'hr': 'bg-blue-100 text-blue-800',
      'crb': 'bg-green-100 text-green-800',
      'accounts': 'bg-yellow-100 text-yellow-800',
      'control': 'bg-red-100 text-red-800',
      'recruitment': 'bg-pink-100 text-pink-800',
    };
    return colors[roleSlug] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredHistory = history.filter(item => {
    if (!searchInput) return true;
    const search = searchInput.toLowerCase();
    return (
      item.user_name?.toLowerCase().includes(search) ||
      item.user_email?.toLowerCase().includes(search) ||
      item.new_role_name?.toLowerCase().includes(search) ||
      item.old_role_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search and Refresh */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by user name, email, or role..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {searchInput && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-600">Filter:</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              Search: {searchInput}
              <button onClick={() => setSearchInput('')} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
            <span className="text-xs text-gray-500">
              ({filteredHistory.length} of {history.length} results)
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium text-sm">Error loading role history</p>
            <p className="text-red-700 text-xs">{error}</p>
          </div>
          <button
            onClick={refresh}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-10 h-10 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-600">Loading role history...</span>
          </div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No role history found</h3>
          <p className="text-sm text-gray-600">
            {searchInput
              ? "No matching role changes found. Try adjusting your search."
              : history.length === 0
              ? "No role changes have been recorded yet."
              : "No results match your search criteria."}
          </p>
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Role History Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900">Role Change Timeline</h3>
              <p className="text-xs text-gray-600 mt-1">Complete history of all role assignments for SOL staff</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredHistory.map((item, index) => (
                <div key={item.id} className="p-2.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      {index < filteredHistory.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 min-h-[24px] mt-1"></div>
                      )}
                    </div>

                    {/* Content - All in one row */}
                    <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                      {/* User Info */}
                      <div className="flex items-center gap-2 min-w-[180px]">
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {item.user_name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {item.user_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{item.user_email}</p>
                        </div>
                      </div>

                      {/* Role Change */}
                      <div className="flex items-center gap-2">
                        {item.old_role_name ? (
                          <>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(item.old_role_slug)}`}>
                              {item.old_role_name}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Initial →</span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(item.new_role_slug)}`}>
                          {item.new_role_name}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className="whitespace-nowrap">{formatDateTime(item.assigned_at)}</span>
                        </div>
                        {item.changed_by_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="whitespace-nowrap">{item.changed_by_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Reason (if provided) - compact inline */}
                      {item.reason && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 rounded border border-amber-200">
                          <FileText className="w-3 h-3 text-amber-600 flex-shrink-0" />
                          <span className="text-xs text-amber-900 truncate max-w-[300px]" title={item.reason}>
                            {item.reason}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{pagination.from || 0}</span> to{" "}
                <span className="font-medium">{pagination.to || 0}</span> of{" "}
                <span className="font-medium">{pagination.total || 0}</span> changes
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {[...Array(Math.min(pagination.last_page, 7))].map((_, idx) => {
                    let pageNum;
                    if (pagination.last_page <= 7) {
                      pageNum = idx + 1;
                    } else if (pagination.current_page <= 4) {
                      pageNum = idx + 1;
                    } else if (pagination.current_page >= pagination.last_page - 3) {
                      pageNum = pagination.last_page - 6 + idx;
                    } else {
                      pageNum = pagination.current_page - 3 + idx;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-1.5 text-sm rounded-lg ${
                          pagination.current_page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => goToPage(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoleHistoryTab;
