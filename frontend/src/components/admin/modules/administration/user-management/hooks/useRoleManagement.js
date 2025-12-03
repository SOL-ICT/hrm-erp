import { useState, useCallback } from 'react';
import { userManagementAPI } from '../../../../../../services/userManagementAPI';

export const useRoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState(null);

  const fetchAvailableRoles = useCallback(async () => {
    setLoadingRoles(true);
    setError(null);
    
    try {
      const response = await userManagementAPI.getAvailableRoles();

      if (response.success) {
        setRoles(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  const changeUserRole = async (userId, roleId, reason = null) => {
    setChanging(true);
    setError(null);
    
    try {
      const response = await userManagementAPI.changeUserRole(userId, roleId, reason);

      if (response.success) {
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error changing role:', err);
      const errorMessage = err.message || 'Failed to change user role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setChanging(false);
    }
  };

  const resetPassword = async (userId, sendEmail = true) => {
    try {
      const response = await userManagementAPI.resetPassword(userId, sendEmail);

      if (response.success) {
        return { success: true, data: response.data };
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      const errorMessage = err.message || 'Failed to reset password';
      throw new Error(errorMessage);
    }
  };

  return {
    roles,
    loadingRoles,
    changing,
    error,
    fetchAvailableRoles,
    changeUserRole,
    resetPassword
  };
};
