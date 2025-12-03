import { useState, useEffect, useCallback } from 'react';
import { userManagementAPI } from '../../../../../../services/userManagementAPI';

export const useStaffUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role_id: '',
    status: '',
    page: 1,
    per_page: 15
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userManagementAPI.getStaffUsers(filters);

      if (response.success) {
        setUsers(response.data.data || []);
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        });
      }
    } catch (err) {
      console.error('Error fetching staff users:', err);
      setError(err.message || 'Failed to load staff users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 on filter change
  };

  const goToPage = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return {
    users,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    goToPage,
    refresh: fetchUsers
  };
};
