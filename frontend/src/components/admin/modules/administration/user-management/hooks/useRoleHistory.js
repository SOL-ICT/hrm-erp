import { useState, useCallback, useEffect } from 'react';
import { userManagementAPI } from '../../../../../../services/userManagementAPI';

export const useRoleHistory = (initialFilters = {}) => {
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    user_id: initialFilters.user_id || null,
    per_page: initialFilters.per_page || 15,
    page: 1
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await userManagementAPI.getRoleHistory(filters);
      
      if (response.success) {
        setHistory(response.data.data || []);
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total,
          from: response.data.from,
          to: response.data.to
        });
      } else {
        setError(response.message || 'Failed to load role history');
      }
    } catch (err) {
      console.error('Error fetching role history:', err);
      setError(err.message || 'Failed to load role history');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const goToPage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const refresh = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    goToPage,
    refresh
  };
};
