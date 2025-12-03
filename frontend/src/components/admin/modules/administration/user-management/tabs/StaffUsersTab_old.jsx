import React, { useState, useEffect } from "react";
import { Search, Filter, Loader, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import StaffUserCard from "../components/StaffUserCard";
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
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const handleRoleChangeSubmit = async (userId, roleId, reason) => {
    await changeUserRole(userId, roleId, reason);
    refresh(); // Refresh user list
  };

  const handlePasswordResetSubmit = async (userId, sendEmail) => {
    return await resetPassword(userId, sendEmail);
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filters.role_id}
              onChange={(e) => updateFilters({ role_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Active Filters Info */}
        {(filters.search || filters.role_id || filters.status) && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>
                {pagination?.total || 0} users found
                {filters.search && ` matching "${filters.search}"`}
              </span>
            </div>
            <button
              onClick={() => {
                setSearchInput("");
                updateFilters({ search: "", role_id: "", status: "" });
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Error loading users</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={refresh}
            className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading staff users...</span>
        </div>
      )}

      {/* User Cards Grid */}
      {!loading && users.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <StaffUserCard
                key={user.id}
                user={user}
                onChangeRole={handleChangeRole}
                onResetPassword={handleResetPassword}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{" "}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
                  {pagination.total} users
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(pagination.last_page)].map((_, index) => {
                      const page = index + 1;
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === pagination.last_page ||
                        (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              page === pagination.current_page
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === pagination.current_page - 2 || page === pagination.current_page + 2) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => goToPage(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && !error && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.role_id || filters.status
              ? "Try adjusting your filters"
              : "No SOL staff users available"}
          </p>
          {(filters.search || filters.role_id || filters.status) && (
            <button
              onClick={() => {
                setSearchInput("");
                updateFilters({ search: "", role_id: "", status: "" });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
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
