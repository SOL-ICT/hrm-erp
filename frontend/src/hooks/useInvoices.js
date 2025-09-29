import { useState, useEffect, useCallback, useRef } from "react";
import { invoiceApiService } from "../services/modules/invoicing";

/**
 * Custom hook for managing invoices
 * Provides state management, CRUD operations, and data formatting
 */
export const useInvoices = (initialFilters = {}) => {
  // State management
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  // Filters and search
  const [filters, setFilters] = useState({
    client_id: "",
    invoice_type: "",
    date_from: "",
    date_to: "",
    search: "",
    ...initialFilters,
  });

  // Statistics
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Available attendance uploads
  const [availableAttendance, setAvailableAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Refs for cleanup
  const abortController = useRef(null);

  /**
   * Fetch invoices with current filters and pagination
   */
  const fetchInvoices = useCallback(
    async (page = 1, customFilters = {}) => {
      // Cancel any existing request
      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          per_page: pagination.per_page,
          ...filters,
          ...customFilters,
        };

        // Remove empty filters
        Object.keys(params).forEach((key) => {
          if (
            params[key] === "" ||
            params[key] === null ||
            params[key] === undefined
          ) {
            delete params[key];
          }
        });

        const response = await invoiceApiService.getInvoices(params);

        if (response.success) {
          setInvoices(response.data.data);
          setPagination({
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            per_page: response.data.per_page,
            total: response.data.total,
          });
        } else {
          throw new Error(response.message || "Failed to fetch invoices");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setError(error.message || "Error fetching invoices");
          console.error("Error fetching invoices:", error);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.per_page]
  );

  /**
   * Fetch invoice statistics
   */
  const fetchStatistics = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await invoiceApiService.getInvoiceStatistics();

      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /**
   * Fetch available attendance uploads
   */
  const fetchAvailableAttendance = useCallback(async (clientId = null) => {
    try {
      setLoadingAttendance(true);
      const response = await invoiceApiService.getAvailableAttendanceUploads(
        clientId
      );

      if (response.success) {
        setAvailableAttendance(response.data);
      }
    } catch (error) {
      console.error("Error fetching available attendance:", error);
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  /**
   * Generate new invoice
   */
  const generateInvoice = async (
    attendanceUploadId,
    invoiceType,
    invoicePeriod
  ) => {
    try {
      setLoading(true);
      const response = await invoiceApiService.generateInvoice(
        attendanceUploadId,
        invoiceType,
        invoicePeriod
      );

      if (response.success) {
        // Refresh the list
        await fetchInvoices(1);
        // Refresh available attendance
        await fetchAvailableAttendance();
        return response.data;
      } else {
        throw new Error(response.message || "Failed to generate invoice");
      }
    } catch (error) {
      setError(error.message || "Error generating invoice");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export invoice to Excel
   */
  const exportToExcel = async (invoiceId) => {
    try {
      const result = await invoiceApiService.exportInvoiceToExcel(invoiceId);
      return result;
    } catch (error) {
      setError(error.message || "Error exporting invoice");
      throw error;
    }
  };

  /**
   * Delete invoice
   */
  const deleteInvoice = async (invoiceId) => {
    try {
      const response = await invoiceApiService.deleteInvoice(invoiceId);

      if (response.success) {
        // Remove from local state
        setInvoices((prev) =>
          prev.filter((invoice) => invoice.id !== invoiceId)
        );
        return true;
      } else {
        throw new Error(response.message || "Failed to delete invoice");
      }
    } catch (error) {
      setError(error.message || "Error deleting invoice");
      throw error;
    }
  };

  /**
   * Update filters and refetch data
   */
  const updateFilters = useCallback(
    (newFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      fetchInvoices(1, newFilters);
    },
    [fetchInvoices]
  );

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    (page) => {
      fetchInvoices(page);
    },
    [fetchInvoices]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      client_id: "",
      invoice_type: "",
      date_from: "",
      date_to: "",
      search: "",
    };
    setFilters(clearedFilters);
    fetchInvoices(1, clearedFilters);
  }, [fetchInvoices]);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    fetchInvoices(pagination.current_page);
    fetchStatistics();
    fetchAvailableAttendance();
  }, [
    fetchInvoices,
    fetchStatistics,
    fetchAvailableAttendance,
    pagination.current_page,
  ]);

  // Initial data fetch
  useEffect(() => {
    fetchInvoices();
    fetchStatistics();
    fetchAvailableAttendance();

    // Cleanup on unmount
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []); // Only run on mount

  // Helper functions
  const formatCurrency = invoiceApiService.formatCurrency;
  const formatDate = invoiceApiService.formatDate;

  return {
    // Data
    invoices,
    statistics,
    availableAttendance,
    pagination,
    filters,

    // Loading states
    loading,
    loadingStats,
    loadingAttendance,
    error,

    // Actions
    fetchInvoices,
    generateInvoice,
    exportToExcel,
    deleteInvoice,
    updateFilters,
    goToPage,
    clearFilters,
    refresh,

    // Utilities
    formatCurrency,
    formatDate,
  };
};
