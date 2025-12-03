import React, { useState, useEffect } from "react";
import { Search, Filter, Loader, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, MoreVertical, Shield, Key, CheckCircle, XCircle, Calendar, X } from "lucide-react";
import ChangeRoleModal from "../components/ChangeRoleModal";
import PasswordResetModal from "../components/PasswordResetModal";
import { useStaffUsers } from "../hooks/useStaffUsers";
import { useRoleManagement } from "../hooks/useRoleManagement";

const StaffUsersTab = () => {
  const {
    users,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    goToPage,
    refresh
  } = useStaffUsers();

  const {
    roles,
    loadingRoles,
    changing,
    fetchAvailableRoles,
    changeUserRole,
    resetPassword
  } = useRoleManagement();

  const [searchInput, setSearchInput] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState(null);

  // Fetch available roles on mount
  useEffect(() => {
    fetchAvailableRoles();
  }, [fetchAvailableRoles]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search: searchInput });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleChangeRole = (user) => {
    setSelectedUser(user);
    setShowChangeRoleModal(true);
    setOpenActionMenu(null);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
    setOpenActionMenu(null);
  };

  const handleRoleChangeSubmit = async (userId, roleId, reason) => {
    await changeUserRole(userId, roleId, reason);
    refresh();
  };

  const handlePasswordResetSubmit = async (userId, sendEmail) => {
    return await resetPassword(userId, sendEmail);
  };

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    updateFilters({ search: "", role_id: "", status: "" });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filters.role_id || ""}
              onChange={(e) => updateFilters({ role_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loadingRoles}
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status || ""}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.search || filters.role_id || filters.status) && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-600">Filters:</span>
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                Search: {filters.search}
                <button onClick={() => { setSearchInput(""); updateFilters({ search: "" }); }} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.role_id && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                Role: {roles.find(r => r.id == filters.role_id)?.name}
                <button onClick={() => updateFilters({ role_id: "" })} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                Status: {filters.status}
                <button onClick={() => updateFilters({ status: "" })} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-600 hover:text-gray-900 underline ml-2">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium text-sm">Error loading users</p>
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
            <span className="text-sm text-gray-600">Loading staff users...</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-sm text-gray-600 mb-4">
            {filters.search || filters.role_id || filters.status
              ? "Try adjusting your filters"
              : "No SOL staff users available"}
          </p>
          {(filters.search || filters.role_id || filters.status) && (
            <button onClick={clearFilters} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Staff Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Current Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.staff_code || user.employee_code || '-'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {user.current_role ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.current_role.slug)}`}>
                            <Shield className="w-3 h-3 mr-1" />
                            {user.current_role.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No role assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {user.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenActionMenu(openActionMenu === user.id ? null : user.id)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {openActionMenu === user.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenActionMenu(null)}
                              ></div>
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={() => handleChangeRole(user)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Shield className="w-4 h-4" />
                                  Change Role
                                </button>
                                <button
                                  onClick={() => handleResetPassword(user)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Key className="w-4 h-4" />
                                  Reset Password
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> to{" "}
                <span className="font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of{" "}
                <span className="font-medium">{pagination.total}</span> users
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

      {/* Modals */}
      <ChangeRoleModal
        isOpen={showChangeRoleModal}
        onClose={() => {
          setShowChangeRoleModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        roles={roles}
        onChangeRole={handleRoleChangeSubmit}
        loading={changing}
      />

      <PasswordResetModal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onResetPassword={handlePasswordResetSubmit}
      />
    </div>
  );
};

export default StaffUsersTab;
