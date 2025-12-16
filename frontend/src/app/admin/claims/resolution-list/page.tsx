/**
 * Claims Resolution List Page
 * 
 * Comprehensive claims archive with advanced filtering, sorting, and export.
 * Displays all claims (active and completed) with full search capabilities.
 * 
 * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md - Claims Resolution List
 */

'use client';

import ClaimFilters, { FilterState } from './components/ClaimFilters';
import ClaimTable from './components/ClaimTable';
import ExportButton from './components/ExportButton';
import { useClaimsList } from './hooks/useClaimsList';

export default function ClaimsResolutionListPage() {
  const {
    claims,
    loading,
    filters,
    sortBy,
    sortOrder,
    pagination,
    handleFilterChange,
    handleSort,
    handlePageChange,
    handleExport
  } = useClaimsList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Claims Resolution List
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete archive of all fidelity claims with advanced filtering and export
          </p>
        </div>
        <ExportButton filters={filters} onExport={handleExport} />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <ClaimFilters 
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Results Summary */}
      {!loading && claims && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{claims.length}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{pagination.total}</span> claims
          </div>
          <div>
            Page {pagination.current_page} of {pagination.last_page}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading claims...</span>
            </div>
          </div>
        ) : (
          <ClaimTable
            claims={claims || []}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.last_page > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
          <button
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
              let pageNum: number;
              
              if (pagination.last_page <= 5) {
                pageNum = i + 1;
              } else if (pagination.current_page <= 3) {
                pageNum = i + 1;
              } else if (pagination.current_page >= pagination.last_page - 2) {
                pageNum = pagination.last_page - 4 + i;
              } else {
                pageNum = pagination.current_page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    pagination.current_page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.last_page}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
